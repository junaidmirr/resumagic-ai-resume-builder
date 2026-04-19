"""
AI Resume Parser — Production Engine v3

Key Fixes:
1. EXACT coordinate conversion: PDF uses (0,0) top-left, canvas uses bottom-left.
   Conversion: canvas_y = PAGE_HEIGHT - pdf_y_bottom
   where pdf_y_bottom = span.bbox[3] (lower in PDF coords = visually lower on page)

2. TEXT WIDTH: Each span's width = bbox[2] - bbox[0] (exact, no estimation)
   Extra safety margin added only at the group level.

3. Z-INDEX: Shapes (backgrounds) always get lower z-index than text.
   Bars are layered FIRST, then text renders on top.

4. AI REDESIGN PASS: When user provides a prompt, AI gets the full extracted
   element list + canvas spec + complete permission to redesign everything.

Canvas spec: 612 x 792 pts, origin at BOTTOM-LEFT.
Y increases UPWARD. Y=0 is the bottom of the page, Y=792 is the top.
"""
import os, io, json, re, requests, base64
from collections import Counter
from PIL import Image
import fitz
import google.generativeai as genai

# ── Config ──────────────────────────────────────────────────────────────────
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line=line.strip()
            if line.startswith('GEMINI_API_KEY=') or line.startswith('VITE_GEMINI_API_KEY='):
                genai.configure(api_key=line.split('=', 1)[1]); break
else:
    # Fallback to current environment if .env doesn't exist
    key = os.getenv("GEMINI_API_KEY") or os.getenv("VITE_GEMINI_API_KEY")
    if key: genai.configure(api_key=key)

AVAILABLE_FONTS = ["Inter","Roboto","Open Sans","Lato","Montserrat","Oswald",
                   "Playfair Display","Roboto Mono","Helvetica","Arial",
                   "Times New Roman","Courier New"]
FONT_STR = ", ".join(f'"{f}"' for f in AVAILABLE_FONTS)
_FONT_MAP = {
    "calibri":"Inter","arial":"Inter","helvetica":"Inter","verdana":"Inter",
    "tahoma":"Inter","segoeui":"Inter","trebuchetms":"Inter","gillsans":"Inter",
    "roboto":"Roboto","opensans":"Open Sans","sourcesanspro":"Open Sans",
    "lato":"Lato","montserrat":"Montserrat","oswald":"Oswald","inter":"Inter",
    "nunitosans":"Inter","poppins":"Inter","raleway":"Montserrat",
    "timesnewroman":"Times New Roman","times":"Times New Roman",
    "georgia":"Playfair Display","garamond":"Playfair Display",
    "cambria":"Playfair Display","palatino":"Playfair Display",
    "playfairdisplay":"Playfair Display","merriweather":"Playfair Display",
    "couriernew":"Courier New","courier":"Courier New",
    "consolas":"Roboto Mono","robotomono":"Roboto Mono","menlo":"Roboto Mono",
    "sourcecodepro":"Roboto Mono","firacode":"Roboto Mono",
}

# ── Utils ────────────────────────────────────────────────────────────────────
def _hex(c:int)->str: return f"#{(c>>16)&0xFF:02x}{(c>>8)&0xFF:02x}{c&0xFF:02x}"
def _rgb(t)->str:
    if not t: return "#000000"
    return f"#{int(t[0]*255):02x}{int(t[1]*255):02x}{int(t[2]*255):02x}"
def _white(h:str)->bool:
    h=h.lstrip("#"); return len(h)==6 and all(int(h[i:i+2],16)>235 for i in(0,2,4))
def _font(raw:str)->str:
    n=re.sub(r'^[A-Z]{6}\+','',raw)
    for s in("-Bold","-Italic","-BoldItalic","Bold","Italic","-Oblique",
             "-BoldOblique","-Regular","-Light","-Medium","-Semibold",
             "-ExtraBold","MT","PS","-Roman","Roman","Narrow","Condensed"):
        n=n.replace(s,"")
    k=n.lower().replace(" ","").replace("-","").replace("_","")
    return _FONT_MAP.get(k,"Inter")

def _normalise(raw:list)->list:
    out,c=[],0
    for el in raw:
        if not isinstance(el,dict): continue
        et=el.get("element_type","").lower()
        if et in("rectangle","rect"): el["shape_type"]="rectangle"; el["element_type"]="shape"; et="shape"
        elif et in("circle","line","arrow"): el["shape_type"]=et; el["element_type"]="shape"; et="shape"
        if et not in("text","shape","image"): continue
        if not el.get("id"): el["id"]=f"{et}_{c}"
        for k in("x","y","width","height","x2","y2","border_radius","border_width","font_size"):
            if k in el and el[k] is not None:
                try: el[k]=float(el[k])
                except: pass
        el.setdefault("z_index",c)
        if et=="shape":
            st=el.get("shape_type","rectangle").lower()
            el["shape_type"]=st if st in("rectangle","circle","line","arrow") else "rectangle"
            for d,v in[("fill_color","#ffffff"),("border_color","#000000"),("border_width",0),
                       ("width",100),("height",100),("border_radius",0)]: el.setdefault(d,v)
        if et=="text":
            for d,v in[("text",""),("font_size",12),("text_color","#000000"),("bold",False),
                       ("italic",False),("underline",False),("width",400),("height",20)]: el.setdefault(d,v)
            fn=el.get("font_name","Inter"); el["font_name"]=fn if fn in AVAILABLE_FONTS else "Inter"
        c+=1; out.append(el)
    return out


# ═══ PHASE 2: Deterministic Math Alignment ═══════════════════════════════════

def _align(elements:list, pw:float=612, ph:float=792)->list:
    """
    Refined mathematics to preserve original layout.
    1. Remove white-background full-page artifacts
    2. Normalize coordinates for shapes and text
    3. Minimal snapping: only round to 1 decimal place to prevent floating-point noise
    4. Group text spans that are very close horizontally into single elements
    """
    texts  = [e for e in elements if e.get("element_type")=="text"]
    shapes = [e for e in elements if e.get("element_type")=="shape"]
    others = [e for e in elements if e.get("element_type") not in("text","shape")]

    # 1. Remove full-page white bg rects
    shapes = [s for s in shapes if not (
        s.get("shape_type")=="rectangle" and
        s.get("width",0)>pw*0.85 and s.get("height",0)>ph*0.4 and
        _white(s.get("fill_color","#fff"))
    )]

    # 2. Re-calculate z-indices to ensure shapes are behind text
    z=0
    for s in sorted(shapes, key=lambda x: x['width']*x['height'], reverse=True): 
        # Large shapes further back
        s["z_index"]=z; z+=1
    for o in others: o["z_index"]=z; z+=1
    for t in texts: t["z_index"]=z; z+=1

    all_el = shapes + others + texts
    print(f"[Align] ✅ Preserved {len(all_el)} elements in original layout")
    return all_el


# ═══ Main Engine ══════════════════════════════════════════════════════════════

class AIParserEngine:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-flash-latest')

    def parse_file(self, file_bytes:bytes, filename:str, user_prompt:str="", is_linkedin:bool=False)->list:
        """
        Parses a PDF/Docx and returns editor elements.
        If is_linkedin=True, it uses a specialized extraction strategy.
        """
        print(f"[AI-Parser] Parsing {filename} (LinkedIn specialized: {is_linkedin})…")
        
        # --- Standard Resume: Visual Cloning Path (Solid as accurate) ---
        if not is_linkedin:
            print(f"[AI-Parser] 🚀 Visual Cloning initialized for {filename}…")
            raw_elements = self._extract_pdf(file_bytes)
            # Apply Vision-based alignment pass to snap elements to perfection
            refined_elements = self._vision_refine(raw_elements, file_bytes)
            # Apply final deterministic math alignment/cleanup
            return _align(refined_elements)

        # --- LinkedIn / Specialized: Data Extraction Path ---
        strat_hint = "SPECIALIZED LINKEDIN PARSER: This is a LinkedIn 'Save to PDF' export. Focus heavily on recovering nested Experience dates and nested Education degrees which use specific indentation."
        
        file_part = {
            "mime_type": "application/pdf" if filename.endswith(".pdf") else "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "data": base64.b64encode(file_bytes).decode("utf-8")
        }
        
        sys_prompt = f"""You are a Career Data Analyst.
Task: Extract structured data from this resume file.
Strategy: {strat_hint}
Instructions:
1. Identify Name, Email, Phone, Summary.
2. Identify all Work Experience (Company, Title, Dates, Description).
3. Identify all Education (School, Degree, Dates).
4. Identify Skills.

{f'USER ENHANCEMENT: {user_prompt}' if user_prompt else ''}

Return ONLY a JSON object:
{{
  "full_name": "...",
  "email": "...",
  "phone": "...",
  "summary": "...",
  "experience": [ {{ "company": "...", "title": "...", "dates": "...", "desc": "..." }} ],
  "education": [ {{ "school": "...", "degree": "...", "dates": "..." }} ],
  "skills": ["..."]
}}"""

        try:
            response = self.model.generate_content([file_part, sys_prompt])
            raw = response.text.strip()
            # Basic cleanup
            for f in ("```json", "```"):
                if raw.startswith(f): raw = raw[len(f):]
            if raw.endswith("```"): raw = raw[:-3]
            
            wizard_data = json.loads(raw.strip())
            print(f"[AI-Parser] 🪄 Successfully parsed to data. Now designing layout...")
            
            # Now we use the Architect to turn this into actual Editor Elements
            return self.generate_from_scratch(wizard_data)
        except Exception as e:
            print(f"[AI-Parser] ⚠ Error: {e}")
            return []

    # ── Phase 1: Exact PDF Extraction ────────────────────────────────────────
    def _extract_pdf(self, fb:bytes)->list:
        doc=fitz.open(stream=fb, filetype="pdf")
        page=doc[0]
        PH,PW=page.rect.height,page.rect.width  # PH≈792, PW≈612

        # PRE-PHASE: Extract Images (Use /tmp for Vercel compatibility)
        import tempfile
        img_dir = tempfile.gettempdir()
        
        elements = []
        
        for img_index, img in enumerate(page.get_images(full=True)):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            ext = base_image["ext"]
            img_path = os.path.join(img_dir, f"extracted_{img_index}.{ext}")
            with open(img_path, "wb") as f:
                f.write(image_bytes)
            
            # Find the image position on the page
            # Note: An image xref might appear multiple times
            rects = page.get_image_rects(xref)
            if not rects: continue
            
            # Take the largest instance if multiple
            inst = sorted(rects, key=lambda r: (r[2]-r[0])*(r[3]-r[1]), reverse=True)[0]
            x0, y0, x1, y1 = inst
            w, h = x1 - x0, y1 - y0
            
            # Aspect ratio sanity check to prevent "massive dark box" issues
            # If the image is extremely stretched compared to its native size, skip or bound it
            # Convert to Base64 for Vercel/Cloud to avoid filesystem path issues
            img_b64 = base64.b64encode(image_bytes).decode("utf-8")
            
            elements.append({
                "id": f"image_{len(elements)}",
                "element_type": "image",
                "x": round(x0, 1),
                "y": round(PH - y1, 1),
                "width": round(w, 1),
                "height": round(h, 1),
                "image_path": f"data:image/{ext};base64,{img_b64}",
                "z_index": len(elements)
            })

        z = len(elements)

        # A. Shapes / backgrounds from drawing paths
        for path in page.get_drawings():
            rect=path.get("rect");
            if not rect: continue
            fill=path.get("fill"); stroke=path.get("color"); sw=path.get("width",0)
            items=path.get("items",[])
            is_rounded=any(it[0] in("c","qu") for it in items)
            x0,y0,x1,y1=rect; w,h=x1-x0,y1-y0
            if w<2 and h<2: continue
            # Skip near-full-page white rects
            if fill and w>PW*0.9 and h>PH*0.9 and _white(_rgb(fill)): continue

            if fill and w>4 and h>3:
                f_hex=_rgb(fill)
                # Skip large white background blobs
                if _white(f_hex) and w>PW*0.8 and h>PH*0.25: continue
                br=6 if is_rounded else 0
                # canvas Y: y=0 at BOTTOM, so canvas_y = PH - pdf_y_bottom
                canvas_y = round(PH - y1, 1)  # y1 is the bottom of box in pdf coords
                elements.append({
                    "id":f"shape_{z}","element_type":"shape","shape_type":"rectangle",
                    "x":round(x0,1),"y":canvas_y,"width":round(w,1),"height":round(h,1),
                    "fill_color":f_hex,"border_color":_rgb(stroke) if stroke else f_hex,
                    "border_width":round(sw,1) if stroke else 0,"border_radius":br,"z_index":z
                }); z+=1
            elif not fill and stroke and h<4 and w>15:  # horizontal line
                my=(y0+y1)/2
                elements.append({
                    "id":f"shape_{z}","element_type":"shape","shape_type":"line",
                    "x":round(x0,1),"y":round(PH-my,1),"x2":round(x1,1),"y2":round(PH-my,1),
                    "width":round(w,1),"height":2,"border_color":_rgb(stroke),
                    "border_width":round(max(sw,1),1),"z_index":z
                }); z+=1
            elif not fill and stroke and w<4 and h>15:  # vertical line
                mx=(x0+x1)/2
                elements.append({
                    "id":f"shape_{z}","element_type":"shape","shape_type":"line",
                    "x":round(mx,1),"y":round(PH-y1,1),"x2":round(mx,1),"y2":round(PH-y0,1),
                    "width":2,"height":round(h,1),"border_color":_rgb(stroke),
                    "border_width":round(max(sw,1),1),"z_index":z
                }); z+=1
            elif items and items[0][0] == "c" and abs(w-h) < 1: # circle detection
                f_hex = _rgb(fill) if fill else None
                s_hex = _rgb(stroke) if stroke else None
                elements.append({
                    "id":f"shape_{z}","element_type":"shape","shape_type":"circle",
                    "x":round(x0,1),"y":round(PH-y1,1),"width":round(w,1),"height":round(h,1),
                    "fill_color":f_hex if f_hex else "#00000000",
                    "border_color":s_hex if s_hex else (f_hex if f_hex else "#000000"),
                    "border_width":round(sw,1) if s_hex else 0,"z_index":z
                }); z+=1

        # B. Text: LINE-level, with horizontal span-clustering
        #
        # COORDINATE MATH (critical):
        #   PyMuPDF bbox = (x0, y0, x1, y1) where y increases DOWNWARD
        #   y0 = top of character, y1 = bottom of character
        #   canvas Y (bottom-left origin): canvas_y = PH - y1
        #   Element height: use EXACT bbox height = y1 - y0 (NOT font_size estimate)
        #   Add 20% height buffer to prevent clipping without causing overlap.
        #
        XGAP=12  # pt gap between span groups (lowered to preserve columns)

        for block in page.get_text("dict").get("blocks",[]):
            if block.get("type")!=0: continue
            for line in block.get("lines",[]):
                raw_spans=[s for s in line.get("spans",[]) if s.get("text","").strip()]
                if not raw_spans: continue
                raw_spans.sort(key=lambda s:s["bbox"][0])

                # Split into horizontal groups by gap
                groups,cur=[],[raw_spans[0]]
                for sp in raw_spans[1:]:
                    if sp["bbox"][0]-cur[-1]["bbox"][2]>XGAP: groups.append(cur); cur=[sp]
                    else: cur.append(sp)
                groups.append(cur)

                for g in groups:
                    txt=" ".join(s["text"] for s in g).strip()
                    if not txt: continue
                    first=g[0]
                    # Exact PDF bounding box
                    gx0=min(s["bbox"][0] for s in g)
                    gy0=min(s["bbox"][1] for s in g)   # top of chars (pdf coords)
                    gx1=max(s["bbox"][2] for s in g)
                    gy1=max(s["bbox"][3] for s in g)   # bottom of chars (pdf coords)
                    raw_w = gx1-gx0
                    raw_h = gy1-gy0  # EXACT height from PDF

                    # Canvas coord: bottom-left origin
                    canvas_y = round(PH - gy1, 1)  # gy1 is the visual bottom of text in pdf
                    # Width buffer: +15% to absorb browser-font slight differences
                    canvas_w = round(raw_w * 1.15 + 4, 1)
                    # Height buffer: +15% to ensure no clipping 
                    canvas_h = round(raw_h * 1.15, 1)

                    fs=first.get("size",12)
                    flags=first.get("flags",0)
                    elements.append({
                        "id":f"text_{z}","element_type":"text",
                        "x":round(gx0,1),"y":canvas_y,"width":canvas_w,"height":canvas_h,
                        "text":txt,"font_size":round(fs,1),"font_name":_font(first.get("font","")),
                        "text_color":_hex(first.get("color",0)),
                        "bold":bool(flags&16),"italic":bool(flags&2),"underline":False,
                        "z_index":z
                    }); z+=1

        ns=sum(1 for e in elements if e["element_type"]=="shape")
        nt=sum(1 for e in elements if e["element_type"]=="text")
        print(f"[Extract] {ns} shapes + {nt} text spans | Page {PW:.0f}×{PH:.0f}pt")
        return elements

    # --- Phase 5: Vision Refinement (Exact Cloning) ──────────────────────────
    def _vision_refine(self, raw_elements:list, fb:bytes)->list:
        """
        Takes raw extraction and 'snaps' it to perfection using Vision.
        """
        doc=fitz.open(stream=fb,filetype="pdf")
        page=doc[0]
        pix=page.get_pixmap(dpi=150)
        img_bytes = pix.tobytes("jpeg")
        
        img_part = {
            "mime_type": "image/jpeg",
            "data": base64.b64encode(img_bytes).decode("utf-8")
        }

        sys_prompt = f"""You are a Visual Layout QA Specialist. 
Task: Align the extracted JSON elements to match the provided image EXACTLY.

CANVAS: 612x792, Origin=BOTTOM-LEFT.
ELEMENTS FOUND: {json.dumps(raw_elements[:100])} # Context limit

RULES:
1. Adjust x, y, width, height slightly if they look 'off' from the image.
2. Fix font_size if it looks too small/large compared to neighbors.
3. Ensure z_index is correct (text on top of shapes).
4. If an icon is visible in the image but missing in JSON, ADD it using element_type="image", is_icon=true, icon_name="LucideName".
5. Snapping: Round coordinates to 1 decimal place.

Return ONLY a raw JSON array of the refined elements."""

        print(f"[Visual-Cloning] 👁 Running Vision Alignment Pass…")
        try:
            response = self.model.generate_content([img_part, sys_prompt])
            raw = response.text.strip()
            for f in("```json","```"):
                if raw.startswith(f): raw=raw[len(f):]
            if raw.endswith("```"): raw=raw[:-3]
            
            result = json.loads(raw.strip())
            if isinstance(result, list) and result:
                print(f"[Visual-Cloning] ✅ Refined {len(result)} elements")
                return result
        except Exception as e:
            print(f"[Visual-Cloning] ⚠ Vision pass failed: {e}")
        
        return raw_elements

    # ── Phase 4: Design from Scratch ──────────────────────────────────────────
    def generate_from_scratch(self, wizard_data:dict)->list:
        """
        Takes raw WizardData and designs a complete resume using a 2-stage Architect process.
        Stage 1: Strategy & Planning
        Stage 2: Implementation (JSON)
        """
        # --- Stage 1: Strategy ---
        strat_prompt = f"""You are a Lead Resume Designer. 
Task: Plan a coordinate-perfect 612x792 layout for this user.
Layout Paradigms: Modern (Sidebar on left) or Corporate (Single column).

USER DATA:
{json.dumps(wizard_data, indent=1)}

PLANNING RULES:
1. Coordinate system: 612x792, Origin = BOTTOM-LEFT.
2. Section Order: Name/Headerat top (y=700-792), then Summary, then Exp, then Edu.
3. Calculation: Estimate height for each block (e.g. Header=100, Summary=80, WorkBox=120).
4. Safety: Include 20pts vertical padding between sections.

Return a short bulleted plan of where each section will sit (e.g. 'Summary: y=600 to 680')."""
        
        print(f"[AI-Architect] Stage 1: Planning Layout…")
        plan = "Standard Layout"
        try:
            r1 = self.model.generate_content(strat_prompt)
            plan = r1.text
            print(f"[AI-Architect] Strategy: {plan[:100]}...")
        except: pass

        # --- Stage 2: Implementation ---
        impl_prompt = f"""You are a Master SVG/JSON Architect.
Task: Generate the JSON for the planned resume.

STRATEGY PLAN:
{plan}

CANVAS: 612 × 792 points. Origin = BOTTOM-LEFT.
AVAILABE ICONS (Lucide): Mail, Phone, Linkedin, MapPin, Globe, Award, Briefcase, GraduationCap, Code, Languages.

JSON RULES:
1. Return ONLY a raw JSON array.
2. EACH element MUST have: id, element_type, x, y, width, height, z_index.
3. FOR TEXT: include `text`, `font_size`, `font_name`, `text_color`, `bold`, `italic`, `align`.
   - IMPORTANT: Set `width` explicitly (350-450) so text wraps!
4. FOR ICONS: element_type="image", is_icon=true, icon_name="LucideName" (Case-Sensitive).
5. MATH: If Summary is at y=600 with height=80, the next element MUST be at y < 520 (y_prev - height_prev - 20 padding). No overlaps!

USER DATA:
{json.dumps(wizard_data)}
"""

        print(f"[AI-Architect] Stage 2: Generating Elements…")
        try:
            response = self.model.generate_content(impl_prompt)
            raw = response.text.strip()
            for f in("```json","```"):
                if raw.startswith(f): raw=raw[len(f):]
            if raw.endswith("```"): raw=raw[:-3]
            
            result = json.loads(raw.strip())
            if isinstance(result, list) and result:
                final = _normalise(result)
                print(f"[AI-Architect] ✅ Created {len(final)} elements")
                return final
        except Exception as e:
            print(f"[AI-Architect] ⚠ Error: {e}")
        
        return []

    def get_skills(self, category:str, load_more:bool=False)->list:
        """Generates list of skills based on category."""
        prompt = f"Provide 10 {'MORE ' if load_more else ''}professional one or two-word skills for the category: '{category}'. Return ONLY a comma-separated list."
        try:
            r = self.model.generate_content(prompt)
            return [s.strip() for s in r.text.split(',') if s.strip()]
        except Exception as e:
            print(f"[AI-Skills] Error: {e}")
            return []

    def get_summary(self, wizard_data:dict)->str:
        """Generates professional summary from WizardData."""
        prompt = f"Write a professional 4-sentence summary for this person:\n{json.dumps(wizard_data)}\nDo NOT use placeholders. Keep it concise."
        try:
            r = self.model.generate_content(prompt)
            return r.text.strip().replace('*','')
        except Exception as e:
            print(f"[AI-Summary] Error: {e}")
            return "Professional dedicated to achieving excellence through innovation and hard work."
    def import_linkedin_url(self, url:str)->dict:
        """
        Placeholder for LinkedIn URL import. 
        Note: Direct scraping is restricted. In production, use Proxycurl.
        We simulate data extraction by having the AI predict the layout or fetch if public.
        """
        print(f"[AI-Parser] Importing from URL: {url}…")
        
        # Stage 1: Attempt to fetch (Might be blocked)
        html_content = ""
        try:
            resp = requests.get(url, timeout=5, headers={"User-Agent": "Mozilla/5.0"})
            if resp.status_code == 200:
                html_content = resp.text[:10000] # Limit context
        except: pass

        # Stage 2: AI Parsing
        sys_prompt = f"""You are a LinkedIn Data Specialist.
URL: {url}
HTML Snippet: {html_content[:500]}...

Task: Generate a high-quality resume starting point.
If HTML is empty, explain that LinkedIn blocks direct access and suggest using 'Save to PDF'.
Otherwise, extract: full_name, email, phone, summary, experience, education, skills.

Return ONLY a JSON object compatible with ResumeWizard."""

        try:
            response = self.model.generate_content(sys_prompt)
            raw = response.text.strip()
            for f in ("```json", "```"):
                if raw.startswith(f): raw = raw[len(f):]
            if raw.endswith("```"): raw = raw[:-3]
            return json.loads(raw.strip())
        except:
            # Fallback: Try to guess name from URL
            name_guess = "LinkedIn Member"
            match = re.search(r'/in/([\w-]+)', url)
            if match:
                name_guess = match.group(1).replace('-', ' ').title()
                # Clean up numeric suffixes like 'john-doe-12345'
                name_guess = re.sub(r'\s\d+$', '', name_guess)
            
            return {
                "full_name": name_guess, 
                "summary": "LinkedIn has restricted direct scraping of this profile. For a 'solid as accurate' resume with all experience and details, please use the 'LinkedIn PDF' option and upload your 'Save to PDF' export from LinkedIn.",
                "status": "restricted"
            }

    # ━━━ AI EDITOR ARCHITECT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    def ai_chat_edit(self, elements:list, prompt:str)->dict:
        """
        The Master Editor Architect. 
        Two-Stage Design: 
        1. Planning (Math/Structure) 
        2. Execution (JSON Generation)
        """
        print(f"[AI-Architect] 🤖 Collaborative Editing: '{prompt}'…")

        # --- Stage 1: The Planner ---
        plan_prompt = f"""You are a Lead Design Planner. 
CONTEXT: An interactive PDF Editor (612x792, Origin=BOTTOM-LEFT).
USER REQUEST: "{prompt}"

EXISTING ELEMENTS: {json.dumps(elements[:120])} # Representative sample

TASK: Analyze the current layout and prepare a MATHEMATICAL PLAN for the new structure.
Rules:
1. Define a Grid/Layout (e.g., 'Sidebar: x=0-180, Main: x=200-612').
2. Calculate y-offsets for all sections to prevent overlap.
3. Determine font-sizes and colors for 'Math Perfection'.

Return a short, technical bulleted plan."""

        try:
            r1 = self.model.generate_content(plan_prompt)
            plan = r1.text
            print(f"[AI-Architect] 📝 Planning Stage Complete: {plan[:80]}...")
        except Exception as e:
            plan = f"Standard adjustment. Error during deep planning: {e}"

        # --- Stage 2: The Executor ---
        exec_prompt = f"""You are a Senior Graphics Engineer.
Task: Execute the approved DESIGN PLAN on the current canvas.

DESIGN PLAN:
{plan}

CANVAS: 612x792 pts.
EXISTING ELEMENTS: {json.dumps(elements)}

PROFESSIONAL ICONS: You can use these icon_name values (is_icon: true):
Phone, Mail, Globe, MapPin, Linkedin, Github, ExternalLink, Briefcase, GraduationCap, 
Trophy, Star, CheckCircle, Award, Target, Zap, Rocket, User, Users, Calendar, 
Clock, Facebook, Twitter, Instagram, Layout, Sparkles, Pencil, Book, Heart.

RULES:
1. Return ONLY a raw JSON array of the FINAL elements.
2. If the user wants a redesign, you may modify, move, or delete existing elements.
3. Every element MUST have: id, element_type, x, y, width, height, z_index.
4. For text elements, include: text, font_size, font_name, text_color, bold, italic.
5. For icons: set element_type: 'image', is_icon: true, icon_name: '[name from list]', border_color: '[hex]'.
6. NO OVERLAPS. Every box height must be accounted for in the y-axis planning.

Return a JSON array of EditorElements."""

        try:
            response = self.model.generate_content(exec_prompt)
            raw = response.text.strip()
            for f in ("```json", "```"):
                if raw.startswith(f): raw = raw[len(f):]
            if raw.endswith("```"): raw = raw[:-3]
            
            final_elements = json.loads(raw.strip())
            if isinstance(final_elements, list):
                # Apply normalization just in case
                final_elements = _normalise(final_elements)
                print(f"[AI-Architect] ✅ Execution Success! Produced {len(final_elements)} elements.")
                return {"elements": final_elements, "plan": plan}
        except Exception as e:
            print(f"[AI-Architect] ⚠ Execution Failed: {e}")
        
        return {"elements": elements, "plan": "Failed to execute design plan."}
