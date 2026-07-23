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
try:
    import fitz
except Exception as _fitz_err:
    fitz = None

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


GEMINI_MODELS = [
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
    "gemini-3.1-pro",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-flash-latest",
    "gemini-pro-latest"
]

def _get_gemini_api_key():
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("VITE_GEMINI_API_KEY")
    if not api_key:
        env_path = os.path.join(os.path.dirname(__file__), '.env')
        if os.path.exists(env_path):
            with open(env_path) as f:
                for line in f:
                    line = line.strip()
                    if line.startswith('GEMINI_API_KEY=') or line.startswith('VITE_GEMINI_API_KEY='):
                        api_key = line.split('=', 1)[1]
                        break
    return api_key

def _generate_with_model_fallback(contents):
    """
    Attempts to generate content starting from gemini models using Gemini REST API.
    """
    api_key = _get_gemini_api_key()
    if not api_key:
        raise Exception("Gemini API key is not configured.")

    rest_parts = []
    for item in contents:
        if isinstance(item, str):
            rest_parts.append({"text": item})
        elif isinstance(item, dict):
            if "data" in item:
                rest_parts.append({
                    "inline_data": {
                        "mime_type": item.get("mime_type", "application/pdf"),
                        "data": item["data"]
                    }
                })
            elif "text" in item:
                rest_parts.append({"text": item["text"]})

    payload = {"contents": [{"parts": rest_parts}]}
    headers = {"Content-Type": "application/json"}

    for model_name in GEMINI_MODELS:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            res = requests.post(url, json=payload, headers=headers, timeout=45)
            if res.status_code == 200:
                data = res.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts and "text" in parts[0]:
                        text = parts[0]["text"]
                        if text:
                            print(f"[Gemini Multi-Model Fallback] ✅ Success with REST model: {model_name}")
                            class ResponseWrapper:
                                def __init__(self, t): self.text = t
                            return ResponseWrapper(text)
            print(f"[Gemini REST Fallback] ⚠ Model {model_name} returned status {res.status_code}: {res.text[:120]}")
        except Exception as e:
            print(f"[Gemini REST Fallback] ⚠ Model {model_name} failed: {e}. Switching to next fallback model...")
            
    raise Exception("All configured Gemini models in fallback sequence failed to respond.")

# ═══ Main Engine ══════════════════════════════════════════════════════════════

class AIParserEngine:
    def __init__(self):
        pass

    def parse_file(self, file_bytes:bytes, filename:str, user_prompt:str="", is_linkedin:bool=False)->list:
        """
        Parses a PDF/Docx using AI Data Distillation + AI Architect Layout Generation.
        Distills candidate details and leverages full engine features (Skill Loaders, QR codes, Banners).
        """
        print(f"[AI-Parser] 🧠 AI Data Distillation & Architect Engine initialized for {filename}…")
        
        file_part = {
            "mime_type": "application/pdf" if filename.endswith(".pdf") else "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "data": base64.b64encode(file_bytes).decode("utf-8")
        }
        
        sys_prompt = f"""You are a Lead AI Career Architect.
YOUR TASK:
1. Distill ALL details from this uploaded resume/document (Candidate Name, Email, Phone, Location, Summary, Work History, Education, Skills, Certifications).
2. Format into a structured JSON for layout generation.

{f'USER ENHANCEMENT PROMPT: {user_prompt}' if user_prompt else ''}

Return ONLY raw JSON with this exact schema:
{{
  "personal_info": {{
    "first_name": "...",
    "last_name": "...",
    "headline": "...",
    "email": "...",
    "phone": "...",
    "location": "...",
    "linkedin": "..."
  }},
  "summary": "...",
  "experience": [
    {{ "title": "...", "company": "...", "dates": "...", "location": "...", "description": "..." }}
  ],
  "education": [
    {{ "degree": "...", "school": "...", "dates": "...", "location": "..." }}
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3"]
}}"""

        try:
            response = _generate_with_model_fallback([file_part, sys_prompt])
            raw = response.text.strip()
            for f in ("```json", "```"):
                if raw.startswith(f): raw = raw[len(f):]
            if raw.endswith("```"): raw = raw[:-3]
            
            wizard_data = json.loads(raw.strip())
            print(f"[AI-Parser] 🪄 Successfully distilled candidate data for {filename}. Now generating bespoke canvas elements...")
            
            # Use Architect Engine to build full-featured resume with skill progress bars, banners, & dividers
            elements = self.generate_from_scratch(wizard_data)
            if elements and len(elements) > 0:
                return elements
        except Exception as e:
            print(f"[AI-Parser] ⚠ AI Distillation pass error: {e}. Falling back to PyMuPDF visual extraction.")

        # Fallback: PyMuPDF visual extraction if Gemini call fails or file is image-only
        raw_elements = self._extract_pdf(file_bytes)
        refined_elements = self._vision_refine(raw_elements, file_bytes)
        return _align(refined_elements)

    # ── Phase 1: Exact PDF Extraction ────────────────────────────────────────
    def _extract_pdf(self, fb:bytes)->list:
        if not fitz:
            raise Exception("PyMuPDF (fitz) library is not available in this environment.")
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
            response = _generate_with_model_fallback([img_part, sys_prompt])
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
            r1 = _generate_with_model_fallback(strat_prompt)
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
            response = _generate_with_model_fallback(impl_prompt)
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
            r = _generate_with_model_fallback(prompt)
            return [s.strip() for s in r.text.split(',') if s.strip()]
        except Exception as e:
            print(f"[AI-Skills] Error: {e}")
            return []

    def get_summary(self, wizard_data:dict)->str:
        """Generates professional summary from WizardData."""
        prompt = f"Write a professional 4-sentence summary for this person:\n{json.dumps(wizard_data)}\nDo NOT use placeholders. Keep it concise."
        try:
            r = _generate_with_model_fallback(prompt)
            return r.text.strip().replace('*','')
        except Exception as e:
            print(f"[AI-Summary] Error: {e}")
            return "Professional dedicated to achieving excellence through innovation and hard work."
    def import_linkedin_url(self, url:str)->dict:
        """
        Parses the LinkedIn profile handle and generates a customized professional resume starting point.
        """
        print(f"[AI-Parser] Intelligent LinkedIn URL Import: {url}…")
        
        # Extract handle and clean up numeric suffix
        name_guess = "LinkedIn Member"
        role_guess = "Professional"
        match = re.search(r'/in/([\w-]+)', url)
        if match:
            handle = match.group(1)
            parts = handle.split('-')
            # Look for common words representing roles
            role_keywords = ['engineer', 'developer', 'manager', 'designer', 'consultant', 'analyst', 'scientist', 'lead', 'architect']
            name_parts = []
            role_parts = []
            for p in parts:
                if p.lower() in role_keywords or len(role_parts) > 0:
                    role_parts.append(p)
                else:
                    name_parts.append(p)
            
            if name_parts:
                name_guess = " ".join(name_parts).title()
                # Clean up numeric suffixes (e.g., 'john-doe-12345' -> 'John Doe')
                name_guess = re.sub(r'\s\d+$', '', name_guess)
            if role_parts:
                role_guess = " ".join(role_parts).title()

        # Call Gemini to write a customized draft based on the candidate's name & role guess
        sys_prompt = f"""You are a Premium AI Career Consultant.
Candidate: {name_guess}
Target Role: {role_guess}

TASK: Generate a complete professional resume starting draft tailored to this target role in ResumeWizard JSON format.
Make it detailed and customized, using realistic achievements for a professional in this field.

Return ONLY a JSON object:
{{
  "contact": {{
    "firstName": "{name_guess.split()[0] if name_guess != 'LinkedIn Member' else 'First'}",
    "lastName": "{' '.join(name_guess.split()[1:]) if name_guess != 'LinkedIn Member' else 'Last'}",
    "email": "{name_guess.lower().replace(' ', '')}@example.com",
    "phone": "+1 (555) 019-2834",
    "linkedin": "{url}",
    "location": "San Francisco, CA"
  }},
  "summary": "Dedicated {role_guess} with a track record of driving impact and technical excellence...",
  "experiences": [
    {{
      "jobTitle": "Lead {role_guess}",
      "company": "Enterprise Tech Corp",
      "dates": "2022 - Present",
      "location": "San Francisco, CA",
      "description": "• Led cross-functional team of 8 to launch high-performance services\\n• Improved application reliability by 35% through robust architectural optimization\\n• Orchestrated cloud migration reducing operational overhead by 20%"
    }},
    {{
      "jobTitle": "{role_guess}",
      "company": "Innovate Systems",
      "dates": "2019 - 2022",
      "location": "Austin, TX",
      "description": "• Designed and implemented scalable backend components using modern technologies\\n• Reduced database latency by 45% through query tuning and query caching"
    }}
  ],
  "educations": [
    {{
      "degree": "B.S. Computer Science / Engineering",
      "school": "State University",
      "dates": "2015 - 2019",
      "location": "State College"
    }}
  ],
  "skills": ["System Design", "Cloud Computing", "Team Leadership", "Agile Methodologies"]
}}"""

        try:
            response = _generate_with_model_fallback(sys_prompt)
            raw = response.text.strip()
            for f in ("```json", "```"):
                if raw.startswith(f): raw = raw[len(f):]
            if raw.endswith("```"): raw = raw[:-3]
            data = json.loads(raw.strip())
            if not data.get("contact"):
                data["contact"] = {}
            if not data["contact"].get("firstName"):
                data["contact"]["firstName"] = name_guess
            return data
        except Exception as e:
            print(f"[AI-Parser] Error generating custom profile draft: {e}. Falling back to default layout.")
            return {
                "contact": {
                  "firstName": name_guess.split()[0] if name_guess != "LinkedIn Member" else "First",
                  "lastName": " ".join(name_guess.split()[1:]) if name_guess != "LinkedIn Member" else "Last",
                  "email": f"{name_guess.lower().replace(' ', '')}@example.com",
                  "phone": "+1 (555) 019-2834",
                  "linkedin": url
                },
                "summary": f"Professional specializing in {role_guess} with experience in building scalable solutions and leading technical projects.",
                "experiences": [
                    {
                        "jobTitle": f"Lead {role_guess}",
                        "company": "Tech Corp",
                        "dates": "2022 - Present",
                        "description": "• Led projects to deliver high-quality scalable software solutions."
                    }
                ],
                "educations": [
                    {
                        "degree": "B.S. Computer Science",
                        "school": "University",
                        "dates": "2018 - 2022"
                    }
                ],
                "skills": [role_guess, "Software Engineering", "Problem Solving"]
            }

    # ━━━ AI EDITOR ARCHITECT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    def _extract_json(self, text: str):
        import re
        import json
        
        # Try to find a markdown block first
        match = re.search(r'```(?:json)?\s*([\s\S]*?)```', text)
        if match:
            try:
                return json.loads(match.group(1).strip())
            except json.JSONDecodeError:
                pass
                
        # Fallback to finding the first [ or { and matching till the end
        try:
            start_array = text.find('[')
            start_obj = text.find('{')
            
            start_idx = -1
            if start_array != -1 and start_obj != -1:
                start_idx = min(start_array, start_obj)
            elif start_array != -1:
                start_idx = start_array
            elif start_obj != -1:
                start_idx = start_obj
                
            if start_idx != -1:
                end_char = ']' if text[start_idx] == '[' else '}'
                end_idx = text.rfind(end_char)
                if end_idx != -1:
                    json_str = text[start_idx:end_idx+1]
                    return json.loads(json_str)
        except Exception:
            pass
            
        raise ValueError("Could not extract valid JSON from response")

    def ai_chat_edit(self, elements:list, prompt:str)->dict:
        """
        The Master Editor Architect. 
        Two-Stage Design: 
        1. Planning (Math/Structure) 
        2. Execution (JSON Generation)
        """
        import json
        print(f"[AI-Architect] 🤖 Collaborative Editing: '{prompt}'…")

        # --- Stage 1: The Planner ---
        plan_prompt = f"""You are a Lead Design Planner. 
CONTEXT: An interactive PDF Editor (612x792, Origin=BOTTOM-LEFT).
USER REQUEST: "{prompt}"

EXISTING ELEMENTS: {json.dumps(elements[:120])} # Representative sample

TASK: Analyze the current layout and prepare a MATHEMATICAL PLAN for the new structure.
Rules:
1. Define a Grid/Layout (e.g., 'Sidebar: x=0-180, Main: x=200-612').
2. CRITICAL Y-AXIS RULE: The origin (0,0) is at the BOTTOM-LEFT. Y=792 is the TOP of the page, Y=0 is the BOTTOM. A header belongs near Y=750. As you move DOWN the page, Y MUST DECREASE.
3. Determine font-sizes and colors for 'Math Perfection'.
4. Calculate y-offsets for all sections. Provide generous height padding (e.g., min 50-80pts) for text blocks to account for word wrapping.

Return a short, technical bulleted plan."""

        try:
            r1 = _generate_with_model_fallback(plan_prompt)
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
1. Return ONLY a raw JSON array of the FINAL elements. Do NOT output conversational text.
2. If the user wants a redesign, you may modify, move, or delete existing elements.
3. CRITICAL: Every element MUST have: id, element_type, page_id (e.g. 'page-1'), x, y, width, height, z_index.
4. TEXT elements ('text'): text, font_size, font_name, text_color (Hex), bold, italic, underline, align, line_height, letter_spacing.
5. SHAPE elements ('shape'): shape_type ('rectangle', 'circle', 'line', 'arrow', 'polygon', 'path'), fill_color, border_color, border_width. For line/arrow include x2, y2. For path include path_d.
6. IMAGE elements ('image'): image_path, mask_shape ('none', 'circle', 'rounded'), border_radius, shadow (bool), opacity. (Icons use image_path='' and is_icon=true).
7. Y-AXIS COORDINATES: The origin is at the BOTTOM-LEFT. Y=792 is the TOP, Y=0 is the BOTTOM. Headers go near Y=750. As you progress DOWN the page, Y MUST DECREASE.
8. NO OVERLAPS: You must leave enough vertical space (height) for text blocks. Text will wrap automatically into multiple lines, so a block's true height might be 3x its font size.
9. NEVER strip the page_id from existing elements unless you are moving them to a different page.

Return a JSON array of EditorElements."""

        try:
            response = _generate_with_model_fallback(exec_prompt)
            raw = response.text.strip()
            
            final_elements = self._extract_json(raw)
            if isinstance(final_elements, list):
                # Apply normalization just in case
                final_elements = _normalise(final_elements)
                print(f"[AI-Architect] ✅ Execution Success! Produced {len(final_elements)} elements.")
                return {"elements": final_elements, "plan": plan}
        except Exception as e:
            print(f"[AI-Architect] ⚠ Execution Failed: {e}")
        
        return {"elements": elements, "plan": "Failed to execute design plan."}


    def handle_ai_action(self, action: str, text: str, context: dict, job_description: str) -> dict:
        """
        Unified handler for all AI Assistant tasks in the Editor.
        Communicates via strict JSON format with safety guardrails and actionable fixes.
        """
        import json
        print(f"[AI-Assistant] Action: {action}")
        
        sys_prompt = (
            "You are an elite Career & Resume Expert AI.\n"
            "SAFETY POLICY & GUARDRAIL:\n"
            "If the request or input is unrelated to resumes, career advice, job descriptions, professional skills, cover letters, or contains harmful/malicious intent, "
            "you MUST DENY the request by returning ONLY JSON:\n"
            '{"status": "rejected", "reason": "I am a dedicated Resume & Career AI. I can only assist with resume building, professional skills, and job application topics."}\n\n'
            "FORMAT REQUIREMENT:\n"
            "You MUST respond ONLY with valid raw JSON (no ```json markdown wrapping, no introductory text).\n"
            "Standard Success JSON Schema:\n"
            '{\n'
            '  "status": "success",\n'
            '  "result": "Clean text or summary result",\n'
            '  "fixes": [\n'
            '    {\n'
            '      "id": "fix_1",\n'
            '      "title": "Short title of fix",\n'
            '      "description": "Explanation of change",\n'
            '      "target_field": "skills | summary | experience | text",\n'
            '      "suggested_value": "Exact replacement or inserted text value"\n'
            '    }\n'
            '  ]\n'
            '}\n'
        )
        
        prompt = ""
        
        # Text Operations
        if action == "improve_grammar":
            prompt = f"Improve the grammar and flow of this text, keeping it professional and concise:\n\n{text}"
        elif action == "rewrite":
            prompt = f"Rewrite this resume text to sound more impactful and professional:\n\n{text}"
        elif action == "professional_tone":
            prompt = f"Rewrite this text to have a highly professional, executive tone:\n\n{text}"
        elif action == "translate":
            prompt = f"Translate this text to professional English (or fix it if already English):\n\n{text}"
        elif action == "summarize":
            prompt = f"Summarize this text into a concise, powerful resume bullet point:\n\n{text}"
        elif action == "expand":
            prompt = f"Expand on this text, adding professional filler and impact metrics where appropriate:\n\n{text}"
        elif action == "shorten":
            prompt = f"Shorten this text, making it punchy and removing unnecessary words:\n\n{text}"
        elif action == "bullet_points":
            prompt = f"Convert this text into 2-3 powerful, action-oriented resume bullet points:\n\n{text}"
        elif action == "keywords":
            prompt = f"Extract the top 5-7 ATS keywords from this text. Return them in the result field as a comma-separated list:\n\n{text}"
            
        # Context Operations
        if action == "write_resume":
            prompt = f"Write a professional resume based on this prompt:\n\n{text}"
        elif action == "generate_summary":
            prompt = f"Generate a powerful 3-sentence professional summary based on this context or prompt:\n\n{text}"
        elif action == "generate_objective":
            prompt = f"Generate a compelling resume objective based on this context:\n\n{text}"
        elif action == "generate_skills":
            prompt = f"Generate a list of 10 highly relevant professional skills based on this context/role:\n\n{text}. Return as a comma-separated list."
        elif action == "generate_experience":
            prompt = f"Write a professional work experience entry (Company, Role, and 3 bullet points) for this role/context:\n\n{text}"
        elif action == "generate_projects":
            prompt = f"Write a professional project entry (Project Name, Tech Stack, and 2 bullet points) for this context:\n\n{text}"
        elif action == "generate_cover_letter":
            prompt = f"Write a compelling, professional cover letter based on this resume context:\n\n{json.dumps(context)[:2000]}\n\nAnd this job description (if any):\n{job_description}"
            
        # Analytical Operations (with actionable fixes array)
        elif action == "ats_optimization":
            prompt = (
                f"Analyze this resume content for ATS optimization. Identify missing keywords, bad formatting, and provide 3 specific actionable fixes in the 'fixes' array:\n\n"
                f"Resume Content: {json.dumps(context)[:2000]}\n\n"
                f"Target Job Description:\n{job_description}"
            )
        elif action == "analyze_job":
            prompt = f"Analyze this job description and provide the top 5 hard skills, top 3 soft skills, and core experience required:\n\n{job_description}"
        elif action == "match_resume":
            prompt = f"Match this resume to the job description. Give a match score (0-100%), list missing items, and provide actionable fixes in the 'fixes' array.\n\nResume: {json.dumps(context)[:2000]}\n\nJob Description: {job_description}"
        elif action == "suggest_improvements":
            prompt = f"Act as a strict Resume Reviewer. Give 3 actionable, highly specific improvements in the 'fixes' array for this resume:\n\n{json.dumps(context)[:2000]}"
            
        elif not prompt:
            prompt = f"Assist the user with their resume request:\n\n{text}"

        try:
            full_prompt = f"{sys_prompt}\n\nTask: {prompt}"
            response = _generate_with_model_fallback(full_prompt)
            result_raw = response.text.strip()
            
            try:
                parsed = self._extract_json(result_raw)
                if isinstance(parsed, dict) and "status" in parsed:
                    return parsed
                elif isinstance(parsed, dict) and "result" in parsed:
                    return {"status": "success", "result": parsed["result"], "fixes": parsed.get("fixes", [])}
                elif isinstance(parsed, str):
                    return {"status": "success", "result": parsed, "fixes": []}
            except Exception:
                pass
                
            return {"status": "success", "result": result_raw, "fixes": []}
        except Exception as e:
            print(f"[AI-Assistant] Error: {e}")
            return {"status": "error", "error": str(e), "result": "AI processing failed."}




    def generate_architect_plan(self, prompt: str, refinement_instruction: str = "", previous_plan: dict = None) -> dict:
        """
        Generates a mathematical and visual design plan for building a bespoke resume.
        Supports iterative refinement based on user feedback.
        """
        import json
        print(f"[AI-Architect-Plan] 🎨 Planning prompt: '{prompt}' | Refinement: '{refinement_instruction}'")
        
        sys_prompt = """You are a Lead AI Architect specializing in high-converting, ATS-friendly resume engineering.
CONTEXT: A 612x792 PDF canvas (Origin=BOTTOM-LEFT).

YOUR TASK:
Analyze the user's prompt (and optional refinement instruction / previous plan) and create a structured DESIGN PLAN.

Return ONLY raw JSON with this exact schema:
{
  "title": "Short Descriptive Title of Design",
  "layout_type": "two_column_left_sidebar",
  "theme_summary": "1-2 sentence description of design aesthetics and typography",
  "color_palette": {
    "bg": "#HEX",
    "primary": "#HEX",
    "secondary": "#HEX",
    "text": "#HEX",
    "accent": "#HEX"
  },
  "sections": [
    {
      "id": "sec_1",
      "title": "Section Name",
      "component_type": "header",
      "description": "Details of what will be included"
    }
  ],
  "special_elements": [
    "Skill progress bars with percentage loaders",
    "QR Code linking to portfolio",
    "Visual bar chart for key impact metrics"
  ]
}

DO NOT output conversational text. Output ONLY valid raw JSON."""

        user_content = f"User Request: {prompt}\n"
        if previous_plan:
            user_content += f"\nPrevious Plan:\n{json.dumps(previous_plan, indent=2)}\n"
        if refinement_instruction:
            user_content += f"\nRefinement Instruction: {refinement_instruction}\n"
            
        try:
            full_prompt = f"{sys_prompt}\n\n{user_content}"
            response = _generate_with_model_fallback(full_prompt)
            raw = response.text.strip()
            plan = self._extract_json(raw)
            print(f"[AI-Architect-Plan] ✅ Plan created: {plan.get('title', 'Resume Plan')}")
            return {"status": "success", "plan": plan}
        except Exception as e:
            print(f"[AI-Architect-Plan] Error: {e}")
            fallback_plan = {
                "title": "Bespoke Modern Resume Plan",
                "layout_type": "two_column_left_sidebar",
                "theme_summary": "Clean, modern dual-column layout with vibrant accent colors and clear section hierarchy.",
                "color_palette": {
                    "bg": "#FFFFFF",
                    "primary": "#0F172A",
                    "secondary": "#38BDF8",
                    "text": "#1E293B",
                    "accent": "#6366F1"
                },
                "sections": [
                    {"id": "sec_1", "title": "Header & Contact", "component_type": "header", "description": "Bold name, target role, contact info with modern icons"},
                    {"id": "sec_2", "title": "Sidebar Skills & Progress Loaders", "component_type": "skill_loader", "description": "Interactive progress bar loaders for core tech stack"},
                    {"id": "sec_3", "title": "Professional Experience", "component_type": "timeline", "description": "Action-oriented bullet points with company details and timeline lines"},
                    {"id": "sec_4", "title": "Education & Credentials", "component_type": "text_block", "description": "Degrees, university, GPA, and certifications"},
                    {"id": "sec_5", "title": "Portfolio QR Code", "component_type": "qr_code", "description": "Scannable QR code block for live portfolio"}
                ],
                "special_elements": [
                    "Skill progress bars with percentage loaders",
                    "QR Code linking to portfolio",
                    "Timeline section lines"
                ]
            }
            return {"status": "success", "plan": fallback_plan}

    def build_architect_resume(self, plan: dict, prompt: str = "") -> dict:
        """
        Executes the approved design plan and returns a complete array of EditorElement objects
        fully leveraging all PDF Engine features (shapes, progress bars, charts, QR codes, icons, fonts).
        """
        import json
        print(f"[AI-Architect-Build] 🚀 Building full resume for plan: '{plan.get('title')}'...")
        
        exec_prompt = f"""You are a Master Graphics Engineer.
Task: Generate ALL EditorElement objects to build a complete, production-ready, 1-page resume based on this DESIGN PLAN.

DESIGN PLAN:
{json.dumps(plan, indent=2)}

USER INITIAL PROMPT: {prompt}

CANVAS SPECIFICATIONS:
- Size: 612x792 points. Origin (0,0) is at the BOTTOM-LEFT.
- TOP of page is Y=792. BOTTOM of page is Y=0.
- Header goes at Y=720-770.
- As you place elements DOWN the page, Y MUST DECREASE.

ENGINE CAPABILITIES TO USE:
1. TEXT ('element_type': 'text'):
   - text, x, y, width, height, font_size, font_name ('Helvetica', 'Helvetica-Bold', 'NotoSans-Regular', 'NotoSans-Bold'), text_color (#HEX), align ('left', 'center', 'right'), bold, italic, line_height, letter_spacing, z_index.
2. SHAPES ('element_type': 'shape'):
   - shape_type: 'rectangle', 'circle', 'line', 'arrow', 'polygon', 'path'
   - fill_color, border_color, border_width, border_radius (for rounded rects), x2, y2 (for lines/arrows), path_d (for SVG paths), points (for polygons).
3. SKILL PROGRESS LOADERS:
   - Build skill progress bars using TWO overlapping rectangles:
     a) Background loader bar: height=6, fill_color='#E2E8F0', border_radius=3.
     b) Filled progress bar: height=6, width=(percentage * total_width), fill_color=accent_color, border_radius=3.
4. CHARTS / METRIC GRAPHS:
   - Draw bar charts or metric graphs using rectangles and line axes to visually display key metrics (e.g. '99% Uptime', '10M Users').
5. QR CODES:
   - Render a QR code block using a square image/shape element.
6. ICONS:
   - Use is_icon=true with icon_name: Phone, Mail, Globe, MapPin, Linkedin, Github, ExternalLink, Briefcase, GraduationCap, Trophy, Star, CheckCircle, Award, Target, Zap, Rocket, User, Calendar.

RULES:
- Return ONLY a raw JSON array of the final EditorElement objects.
- Ensure EVERY element has: id, element_type, page_id ('page-1'), x, y, width, height, z_index.
- NO OVERLAPS: Account for line wrapping heights (give 50-80pts per section block).
- Build a complete 1-page resume with all sections mentioned in the plan."""

        try:
            response = _generate_with_model_fallback(exec_prompt)
            raw = response.text.strip()
            elements = self._extract_json(raw)
            if isinstance(elements, list):
                elements = _normalise(elements)
                print(f"[AI-Architect-Build] ✅ Successfully built resume with {len(elements)} elements!")
                return {"status": "success", "elements": elements}
        except Exception as e:
            print(f"[AI-Architect-Build] Execution Error: {e}")
            
        return {"status": "error", "error": str(e)}
