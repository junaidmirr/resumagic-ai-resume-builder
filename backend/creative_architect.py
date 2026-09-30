"""
Creative AI Architect - True AI-Driven Resume Design
=====================================================
This module implements a fully creative AI architect that:
1. Designs completely new and unique resume layouts from scratch
2. Generates exact canvas coordinates for every element
3. Implements designs with mathematical precision
4. No template constraints - pure AI creativity
"""

import json
import re
import uuid
import os
import time
from typing import List, Dict, Any, Optional

try:
    from ai_parser import ask_swirls, CAREER_AI_SYSTEM_INSTRUCTIONS
    HAS_SWIRLS = True
except ImportError:
    HAS_SWIRLS = False
    ask_swirls = None

try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False
    ChatGoogleGenerativeAI = None

from langchain_core.messages import HumanMessage, SystemMessage

PAGE_WIDTH = 612
PAGE_HEIGHT = 792

CREATIVE_DESIGN_SYSTEM_PROMPT = """You are an elite Resume Design Architect with complete creative freedom.

## YOUR MISSION
Design a COMPLETE, FULL resume with ALL sections from scratch. You MUST include:

### REQUIRED SECTIONS (Generate ALL of these):
1. **HEADER** - Name (large, 24-36pt), Job Title, Contact Info (email, phone, location, LinkedIn)
2. **PROFESSIONAL SUMMARY** - 2-3 sentences (150-200 words) describing the candidate
3. **WORK EXPERIENCE** - 2-3 job entries, each with:
   - Job Title (bold, 12-14pt)
   - Company Name and Duration
   - 3-4 achievement bullets with quantified results
4. **SKILLS** - 6-8 skills with visual indicators (progress bars, pills, or ratings)
5. **EDUCATION** - Degree, University, Year, GPA/Honors
6. **OPTIONAL** - Certifications, Projects, or Awards if space permits

YOU MUST GENERATE 40-80 ELEMENTS TOTAL for a complete resume.

You have full creative control over:
- Exact positions (x, y coordinates) of every element
- Size dimensions (width, height) with mathematical precision
- Color schemes, fonts, and visual hierarchy
- Layout structure - be innovative! Not limited to traditional templates

## CANVAS SPECIFICATIONS
- Canvas size: 612pt × 792pt (US Letter, portrait)
- Coordinate system: Bottom-left origin (y=0 at bottom, y=792 at top)
- Margins: Typical 40-50pt, but you can be creative
- All measurements in points (pt)

## ELEMENT TYPES YOU CAN CREATE

### 1. TEXT ELEMENTS
```json
{
  "id": "unique_id",
  "element_type": "text",
  "page_id": "page-1",
  "text": "Content here",
  "x": 50,
  "y": 700,
  "width": 400,
  "height": 30,
  "font_size": 18,
  "font_name": "Helvetica-Bold",
  "text_color": "#0F172A",
  "bold": true,
  "italic": false,
  "underline": false,
  "align": "left",
  "line_height": 1.4,
  "z_index": 3
}
```

### 2. SHAPE ELEMENTS
```json
{
  "id": "unique_id",
  "element_type": "shape",
  "shape_type": "rectangle",
  "page_id": "page-1",
  "x": 0,
  "y": 0,
  "width": 200,
  "height": 792,
  "fill_color": "#1E293B",
  "border_color": "#475569",
  "border_width": 0,
  "border_radius": 8,
  "z_index": 0
}
```

Shape types: "rectangle", "circle", "line"

For lines, use x2, y2:
```json
{
  "element_type": "shape",
  "shape_type": "line",
  "x": 50,
  "y": 680,
  "x2": 450,
  "y2": 680,
  "border_color": "#2563EB",
  "border_width": 2
}
```

### 3. SKILL PROGRESS BARS (Two overlapping rectangles)
Background bar (gray):
```json
{
  "element_type": "shape",
  "shape_type": "rectangle",
  "x": 300,
  "y": 450,
  "width": 200,
  "height": 8,
  "fill_color": "#E5E7EB",
  "border_radius": 999
}
```

Filled bar (colored, same y position):
```json
{
  "element_type": "shape",
  "shape_type": "rectangle",
  "x": 300,
  "y": 450,
  "width": 170,
  "height": 8,
  "fill_color": "#2563EB",
  "border_radius": 999,
  "z_index": 2
}
```

## DESIGN PRINCIPLES
1. **Visual Hierarchy**: Larger fonts (20-28pt) for names, smaller (9-12pt) for body text
2. **Spacing**: Maintain consistent gaps (16-24pt between sections)
3. **Alignment**: Align elements to invisible grid lines (e.g., all left edges at x=50)
4. **Color Harmony**: Choose 3-5 colors that work together
5. **Z-Index Layers**: Background (0), shapes (1), text (3), decorative (5)
6. **No Overlaps**: Calculate exact heights for text to avoid overlaps

## TEXT HEIGHT CALCULATION
For multi-line text, calculate height precisely:
- Characters per line ≈ width / (font_size × 0.52)
- Lines = ceil(text_length / chars_per_line)
- Height = lines × font_size × line_height (typically 1.35-1.5)

## CREATIVE LAYOUT IDEAS
- **Asymmetric Layouts**: Bold header on left 60%, sidebar on right 40%
- **Geometric Accents**: Colored circles, diagonal lines, triangular sections
- **Card-Based**: Floating rounded rectangles with shadows (simulate with borders)
- **Timeline Vertical**: Vertical line with milestone circles
- **Split Header**: Name/role on left, contact icons on right
- **Color Blocking**: Large colored rectangle backgrounds for sections
- **Minimalist**: Lots of white space, thin accent lines
- **Bold Typography**: Oversized name (36-48pt) as design element

## COMPLETE RESUME CONTENT STRUCTURE

You MUST generate a complete resume with realistic content. Here's the required structure:

### 1. HEADER SECTION (y: 700-760)
- Name text element (24-36pt, bold)
- Job title text element (14-18pt)
- Email text element (9-11pt)
- Phone text element (9-11pt)
- Location text element (9-11pt)
- LinkedIn/Website text element (9-11pt)
- Optional: Background shape, decorative lines, icons

### 2. PROFESSIONAL SUMMARY (y: 620-680)
- "PROFESSIONAL SUMMARY" heading (11-13pt, bold)
- Summary paragraph text (2-3 sentences, 9-10pt, 150-200 words)
- Example: "Results-driven Senior Engineer with 8+ years building scalable cloud systems. Proven track record of reducing costs by 40% and improving performance by 60%. Expert in Python, AWS, and microservices architecture."

### 3. WORK EXPERIENCE (y: 400-600)
- "WORK EXPERIENCE" heading (11-13pt, bold)
- Job 1:
  * Job Title text (11-12pt, bold) - e.g., "Senior Software Engineer"
  * Company & Duration text (9-10pt) - e.g., "TechCorp | 2021 - Present"
  * Bullet 1 text (9-10pt) - e.g., "• Led team of 8 engineers to build microservices platform processing 5M+ daily requests"
  * Bullet 2 text (9-10pt) - e.g., "• Reduced cloud infrastructure costs by $200K annually through optimization"
  * Bullet 3 text (9-10pt) - e.g., "• Implemented CI/CD pipeline improving deployment frequency by 300%"
- Job 2:
  * Job Title text (11-12pt, bold) - e.g., "Software Engineer"
  * Company & Duration text (9-10pt) - e.g., "StartupCo | 2018 - 2021"
  * Bullet 1, 2, 3 text (9-10pt) with specific achievements

### 4. SKILLS SECTION (y: 250-380)
- "SKILLS" or "TECHNICAL SKILLS" heading (11-13pt, bold)
- 6-8 skill items, each with:
  * Skill label text (9-10pt) - e.g., "Python / Django"
  * Optional: Progress bar (background gray rectangle + filled colored rectangle)
  * OR pill-shaped tag (rounded rectangle with text)

Examples:
- "Python / Django" with 90% progress bar
- "React / TypeScript" with 85% progress bar
- "AWS / Docker / K8s" with 80% progress bar
- "PostgreSQL / MongoDB" with 75% progress bar

### 5. EDUCATION (y: 150-230)
- "EDUCATION" heading (11-13pt, bold)
- Degree text (10-11pt, bold) - e.g., "Master of Science in Computer Science"
- University text (9-10pt) - e.g., "Stanford University"
- Year text (9-10pt) - e.g., "2018"
- Details text (9-10pt) - e.g., "GPA: 3.9/4.0, Summa Cum Laude"

### 6. OPTIONAL SECTIONS (y: 50-140)
- Certifications: "AWS Solutions Architect", "Certified Scrum Master"
- Projects: Brief project descriptions
- Awards: "Employee of the Year 2023"

## OUTPUT FORMAT
Return a JSON array with 40-80 elements representing the COMPLETE resume. ONLY return valid JSON, no markdown fences:

[
  {
    "id": "name_text",
    "element_type": "text",
    "page_id": "page-1",
    "text": "ALEXANDER CHEN",
    "x": 50,
    "y": 740,
    "width": 400,
    "height": 32,
    "font_size": 28,
    "font_name": "Helvetica-Bold",
    "text_color": "#1E293B",
    "bold": true,
    "z_index": 3
  },
  {
    "id": "role_text",
    "element_type": "text",
    "page_id": "page-1",
    "text": "Senior Full-Stack Engineer",
    "x": 50,
    "y": 710,
    "width": 400,
    "height": 20,
    "font_size": 16,
    "font_name": "Helvetica",
    "text_color": "#475569",
    "z_index": 3
  },
  ... (continue with ALL sections - summary, experience, skills, education)
]

## CRITICAL REQUIREMENTS
- Minimum 40 elements, maximum 80 elements (for complete resume)
- Include ALL sections: Header, Summary, 2-3 Work Experiences, 6-8 Skills, Education
- Every element must have exact x, y, width, height
- Calculate text heights accurately (multi-line text needs proper height)
- No overlapping elements (use proper y-spacing)
- Use z_index for layering (background=0, shapes=1, text=3)
- Generate REALISTIC content with quantified achievements
- Be creative with layout but include ALL content!
"""

class CreativeAIArchitect:
    """
    Pure creative AI architect that designs resumes from scratch
    without template constraints.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        self.use_swirls = HAS_SWIRLS and ask_swirls is not None

        # Initialize Gemini as fallback
        if self.api_key and HAS_GEMINI:
            try:
                self.llm_fallback = ChatGoogleGenerativeAI(
                    model="gemini-2.0-flash-exp",
                    google_api_key=self.api_key,
                    temperature=0.9,  # High temperature for creativity
                    max_output_tokens=16000,  # Increased for full resume generation
                )
            except Exception:
                try:
                    self.llm_fallback = ChatGoogleGenerativeAI(
                        model="gemini-flash-latest",
                        google_api_key=self.api_key,
                        temperature=0.9,
                        max_output_tokens=16000,  # Increased for full resume generation
                    )
                except Exception:
                    self.llm_fallback = None
        else:
            self.llm_fallback = None

    def _call_ai(self, user_prompt: str) -> str:
        """Makes AI call with high creativity settings."""
        # Try Swirls AI first (PRIMARY)
        if self.use_swirls:
            try:
                print("[CreativeArchitect] 🌀 Using Swirls AI")
                complete_prompt = f"""{CREATIVE_DESIGN_SYSTEM_PROMPT}

USER REQUEST:
{user_prompt}

CRITICAL INSTRUCTIONS:
1. Generate a COMPLETE resume with ALL sections (Header, Summary, Experience, Skills, Education)
2. You MUST generate 40-80 elements (not just a header!)
3. Include realistic content with specific achievements and metrics
4. Each work experience should have 3-4 bullet points
5. Include 6-8 skills with visual indicators
6. Output ONLY a valid JSON array of elements, no markdown fences
7. Be creative with the visual design while including all content!

Start generating the complete resume now:
"""
                response = ask_swirls(complete_prompt, timeout=60)  # Increased timeout
                if response and response.strip():
                    return response
            except Exception as e:
                print(f"[CreativeArchitect] ⚠️ Swirls AI error: {e}")

        # Fallback to Gemini (SECONDARY)
        if self.llm_fallback:
            try:
                print("[CreativeArchitect] 🔄 Using Gemini with high creativity")
                messages = [
                    SystemMessage(content=CREATIVE_DESIGN_SYSTEM_PROMPT),
                    HumanMessage(content=f"""{user_prompt}

CRITICAL INSTRUCTIONS:
1. Generate a COMPLETE resume with ALL sections (Header, Summary, Experience, Skills, Education)
2. You MUST generate 40-80 elements (not just a header!)
3. Include realistic content:
   - Professional Summary: 2-3 sentences
   - Work Experience: 2 jobs with 3-4 achievement bullets EACH
   - Skills: 6-8 skills with progress bars or tags
   - Education: Degree, University, Year
4. Each text element needs:
   - Exact x, y position
   - Exact width, height
   - font_size, text_color, font_name
5. Output ONLY a valid JSON array of elements, no markdown fences
6. Be creative with visual layout while including ALL content!

Example structure you MUST follow:
[
  {{"id": "name", "element_type": "text", "text": "FULL NAME", "x": 50, "y": 740, ...}},
  {{"id": "role", "element_type": "text", "text": "Job Title", "x": 50, "y": 710, ...}},
  {{"id": "summary_heading", "element_type": "text", "text": "PROFESSIONAL SUMMARY", "x": 50, "y": 660, ...}},
  {{"id": "summary_text", "element_type": "text", "text": "Results-driven engineer...", "x": 50, "y": 630, ...}},
  {{"id": "exp_heading", "element_type": "text", "text": "WORK EXPERIENCE", "x": 50, "y": 580, ...}},
  {{"id": "job1_title", "element_type": "text", "text": "Senior Engineer", "x": 50, "y": 560, ...}},
  {{"id": "job1_company", "element_type": "text", "text": "TechCorp | 2021-Present", "x": 50, "y": 545, ...}},
  {{"id": "job1_bullet1", "element_type": "text", "text": "• Led team of 8...", "x": 50, "y": 525, ...}},
  ... (continue with ALL sections)
]

Start generating the COMPLETE 40-80 element resume now:""")
                ]
                response = self.llm_fallback.invoke(messages)
                content = response.content
                if isinstance(content, str):
                    return content
                elif isinstance(content, list):
                    parts = []
                    for item in content:
                        if isinstance(item, dict) and "text" in item:
                            parts.append(str(item["text"]))
                        elif isinstance(item, str):
                            parts.append(item)
                    return "".join(parts)
                return str(content or "")
            except Exception as e:
                print(f"[CreativeArchitect] ❌ Gemini error: {e}")

        return None

    def _extract_json_from_response(self, response: str) -> Optional[List[Dict[str, Any]]]:
        """Extract JSON array from AI response."""
        if not response:
            return None

        # Remove markdown code fences
        response = re.sub(r'```json\s*', '', response)
        response = re.sub(r'```\s*', '', response)

        # Try to find JSON array
        array_match = re.search(r'\[\s*\{[\s\S]*\}\s*\]', response)
        if array_match:
            try:
                elements = json.loads(array_match.group())
                if isinstance(elements, list) and len(elements) > 0:
                    return elements
            except json.JSONDecodeError as e:
                print(f"[CreativeArchitect] JSON parse error: {e}")

        return None

    def _validate_content_matches_prompt(self, elements: List[Dict[str, Any]], user_prompt: str) -> bool:
        """Check if AI-generated content matches the user's prompt."""
        # Extract all text from elements
        all_text = " ".join([
            str(el.get("text", "")).lower()
            for el in elements
            if el.get("element_type") == "text"
        ])

        prompt_lower = user_prompt.lower()

        # Define role keywords to check
        role_checks = [
            (["python", "django", "fastapi"], ["python"]),
            (["react", "frontend", "javascript"], ["react", "javascript", "frontend"]),
            (["full", "stack", "fullstack"], ["full", "stack"]),
            (["data", "scientist", "ml", "machine learning"], ["data", "scientist", "machine"]),
            (["devops", "sre"], ["devops", "kubernetes", "infrastructure"]),
            (["product", "manager", "pm"], ["product", "manager"]),
            (["backend"], ["backend", "api", "server"]),
            (["mobile", "ios", "android"], ["mobile", "ios", "android"]),
        ]

        # Check if prompt mentions a role
        prompt_role = None
        for prompt_keywords, expected_in_content in role_checks:
            if any(keyword in prompt_lower for keyword in prompt_keywords):
                prompt_role = (prompt_keywords, expected_in_content)
                break

        if not prompt_role:
            # No specific role in prompt, can't validate
            return True

        prompt_keywords, expected_in_content = prompt_role

        # Check if content has expected keywords
        content_matches = any(keyword in all_text for keyword in expected_in_content)

        if not content_matches:
            print(f"[CreativeArchitect] ❌ Content validation FAILED:")
            print(f"  - Prompt keywords: {prompt_keywords}")
            print(f"  - Expected in content: {expected_in_content}")
            print(f"  - Found in content: NONE")
            print(f"  - Sample content: {all_text[:200]}...")
            return False

        print(f"[CreativeArchitect] ✅ Content validation PASSED (found {expected_in_content} in generated text)")
        return True

    def _has_complete_content(self, elements: List[Dict[str, Any]]) -> bool:
        """Check if elements contain actual content sections, not just a header."""
        # Count elements by approximate Y position
        high_y = 0  # Elements at y > 650 (header area)
        mid_y = 0   # Elements at 400 < y < 650 (content area)
        low_y = 0   # Elements at y < 400 (content area)

        for el in elements:
            y = el.get("y", 0)
            if y > 650:
                high_y += 1
            elif y > 400:
                mid_y += 1
            else:
                low_y += 1

        # If most elements are in header area, it's incomplete
        if high_y > (mid_y + low_y):
            print(f"[CreativeArchitect] Content check: Most elements in header area (high={high_y}, mid={mid_y}, low={low_y})")
            return False

        # Check for bullet points (sign of experience section)
        has_bullets = any("•" in str(el.get("text", "")) for el in elements if el.get("element_type") == "text")

        # Check for multiple distinct text sizes (sign of varied content)
        font_sizes = set(el.get("font_size", 10) for el in elements if el.get("element_type") == "text")

        # Complete content should have:
        # 1. Elements spread across Y axis
        # 2. Bullet points (experience)
        # 3. Multiple font sizes (headings vs body)
        has_spread = (mid_y + low_y) >= 5
        has_variety = len(font_sizes) >= 3

        is_complete = has_spread and has_bullets and has_variety

        print(f"[CreativeArchitect] Content completeness check:")
        print(f"  - Spread across page: {has_spread} (mid+low={mid_y + low_y})")
        print(f"  - Has bullet points: {has_bullets}")
        print(f"  - Font variety: {has_variety} ({len(font_sizes)} sizes)")
        print(f"  - VERDICT: {'COMPLETE' if is_complete else 'INCOMPLETE'}")

        return is_complete

    def _enrich_incomplete_resume(
        self,
        existing_elements: List[Dict[str, Any]],
        user_prompt: str,
        candidate_data: Optional[Dict[str, Any]],
        force_rebuild: bool = False
    ) -> List[Dict[str, Any]]:
        """Enrich incomplete AI-generated resume with missing sections using user's prompt."""
        print(f"[CreativeArchitect] 🔧 Enrichment called for prompt: '{user_prompt[:100]}...'")
        if force_rebuild:
            print(f"[CreativeArchitect] 🔄 FORCE REBUILD enabled (AI content doesn't match prompt)")

        # If AI only generated header (< 15 elements) OR force_rebuild, DISCARD it and start fresh
        # This prevents wrong AI-generated roles from persisting
        if len(existing_elements) < 15 or force_rebuild:
            if force_rebuild:
                print(f"[CreativeArchitect] ⚠️  AI generated WRONG CONTENT (doesn't match '{user_prompt[:50]}...')")
                print(f"[CreativeArchitect] 🔄 Discarding ALL AI content and rebuilding with correct role")
            else:
                print(f"[CreativeArchitect] ⚠️  AI generated too few elements ({len(existing_elements)})")
                print(f"[CreativeArchitect] 🔄 Discarding incomplete AI response and building from scratch")

            # Keep only shapes and header-area text (y > 680)
            filtered_elements = []
            for el in existing_elements:
                if el.get("element_type") == "shape":
                    filtered_elements.append(el)
                elif el.get("element_type") == "text" and el.get("y", 0) > 680:
                    # Keep header text but might replace later
                    filtered_elements.append(el)

            existing_elements = filtered_elements
            print(f"[CreativeArchitect] Kept {len(filtered_elements)} header/shape elements, rebuilding content")

            # Force rebuild all sections
            has_summary = False
            has_experience = False
            has_skills = False
            has_education = False
        else:
            # Analyze what sections are missing - check for actual section headings
            text_elements = [el.get("text", "").upper() for el in existing_elements if el.get("element_type") == "text"]

            has_summary = any("PROFESSIONAL SUMMARY" in text or "SUMMARY" == text or "ABOUT" in text for text in text_elements)
            has_experience = any("WORK EXPERIENCE" in text or "EXPERIENCE" == text or "EMPLOYMENT" in text for text in text_elements)
            has_skills = any("SKILLS" in text or "TECHNICAL SKILLS" in text or "COMPETENCIES" in text for text in text_elements)
            has_education = any("EDUCATION" in text for text in text_elements)

        print(f"[CreativeArchitect] Missing sections - Summary: {not has_summary}, Experience: {not has_experience}, Skills: {not has_skills}, Education: {not has_education}")

        # Find the lowest Y position to start adding new sections
        if existing_elements:
            min_y = min(el.get("y", 700) - el.get("height", 20) for el in existing_elements)
            min_y = min(min_y, 600)  # Don't go below 600 if header is huge
        else:
            min_y = 650

        enriched = list(existing_elements)
        current_y = min_y - 30

        # EXTRACT ROLE FROM USER PROMPT (not hardcoded!)
        prompt_lower = user_prompt.lower()

        # Extract role from prompt
        role = "Software Engineer"  # Default
        name = "Alex Chen"  # Default

        if candidate_data:
            name = candidate_data.get("name", name)
            role = candidate_data.get("role", role)

        # Try to extract role from user prompt
        if "python" in prompt_lower and ("dev" in prompt_lower or "engineer" in prompt_lower):
            role = "Senior Python Developer"
        elif "react" in prompt_lower or "frontend" in prompt_lower:
            role = "Senior Frontend Developer"
        elif "full" in prompt_lower and "stack" in prompt_lower:
            role = "Senior Full-Stack Engineer"
        elif "data scientist" in prompt_lower or "ml engineer" in prompt_lower:
            role = "Senior Data Scientist"
        elif "devops" in prompt_lower or "sre" in prompt_lower:
            role = "Senior DevOps Engineer"
        elif "product manager" in prompt_lower:
            role = "Senior Product Manager"
        elif "designer" in prompt_lower or "ux" in prompt_lower:
            role = "Senior UX Designer"
        elif "backend" in prompt_lower:
            role = "Senior Backend Engineer"
        elif "mobile" in prompt_lower or "ios" in prompt_lower or "android" in prompt_lower:
            role = "Senior Mobile Developer"

        print(f"[CreativeArchitect] Enriching for role: {role} (extracted from prompt)")

        # Generate role-specific content
        skills = self._get_role_specific_skills(role)
        experience = self._get_role_specific_experience(role)
        summary = self._get_role_specific_summary(role)

        # Add missing sections using role-specific content
        if not has_summary and current_y > 100:
            # Add Summary section
            enriched.append({
                "id": f"summary_heading_{uuid.uuid4().hex[:6]}",
                "element_type": "text",
                "page_id": "page-1",
                "text": "PROFESSIONAL SUMMARY",
                "x": 50,
                "y": current_y,
                "width": 512,
                "height": 16,
                "font_size": 12,
                "font_name": "Helvetica-Bold",
                "text_color": "#1E293B",
                "bold": True,
                "z_index": 3
            })
            current_y -= 26

            enriched.append({
                "id": f"summary_text_{uuid.uuid4().hex[:6]}",
                "element_type": "text",
                "page_id": "page-1",
                "text": summary,
                "x": 50,
                "y": current_y - 40,
                "width": 512,
                "height": 45,
                "font_size": 10,
                "font_name": "Helvetica",
                "text_color": "#475569",
                "line_height": 1.4,
                "z_index": 3
            })
            current_y -= 70

        if not has_experience and current_y > 150:
            # Add Experience section using role-specific content
            enriched.append({
                "id": f"exp_heading_{uuid.uuid4().hex[:6]}",
                "element_type": "text",
                "page_id": "page-1",
                "text": "WORK EXPERIENCE",
                "x": 50,
                "y": current_y,
                "width": 512,
                "height": 16,
                "font_size": 12,
                "font_name": "Helvetica-Bold",
                "text_color": "#1E293B",
                "bold": True,
                "z_index": 3
            })
            current_y -= 26

            # Add jobs from role-specific experience
            for job_idx, job in enumerate(experience):
                enriched.append({
                    "id": f"job{job_idx}_title_{uuid.uuid4().hex[:6]}",
                    "element_type": "text",
                    "page_id": "page-1",
                    "text": job["title"],
                    "x": 50,
                    "y": current_y,
                    "width": 400,
                    "height": 14,
                    "font_size": 11,
                    "font_name": "Helvetica-Bold",
                    "text_color": "#0F172A",
                    "bold": True,
                    "z_index": 3
                })
                current_y -= 18

                company_text = f"{job['company']} | {job['duration']}"
                if job.get("location"):
                    company_text += f" | {job['location']}"

                enriched.append({
                    "id": f"job{job_idx}_company_{uuid.uuid4().hex[:6]}",
                    "element_type": "text",
                    "page_id": "page-1",
                    "text": company_text,
                    "x": 50,
                    "y": current_y,
                    "width": 400,
                    "height": 12,
                    "font_size": 9,
                    "font_name": "Helvetica",
                    "text_color": "#64748B",
                    "z_index": 3
                })
                current_y -= 18

                for bullet in job["bullets"]:
                    enriched.append({
                        "id": f"job{job_idx}_bullet_{uuid.uuid4().hex[:6]}",
                        "element_type": "text",
                        "page_id": "page-1",
                        "text": bullet,
                        "x": 50,
                        "y": current_y - 12,
                        "width": 512,
                        "height": 14,
                        "font_size": 9,
                        "font_name": "Helvetica",
                        "text_color": "#334155",
                        "line_height": 1.4,
                        "z_index": 3
                    })
                    current_y -= 18

                current_y -= 10  # Extra spacing between jobs
                if current_y < 100:
                    break  # Stop if running out of space

            current_y -= 10

        if not has_skills and current_y > 100:
            # Add Skills section using role-specific skills
            enriched.append({
                "id": f"skills_heading_{uuid.uuid4().hex[:6]}",
                "element_type": "text",
                "page_id": "page-1",
                "text": "TECHNICAL SKILLS",
                "x": 50,
                "y": current_y,
                "width": 512,
                "height": 16,
                "font_size": 12,
                "font_name": "Helvetica-Bold",
                "text_color": "#1E293B",
                "bold": True,
                "z_index": 3
            })
            current_y -= 26

            for skill_name, skill_level in skills:
                # Skill label
                enriched.append({
                    "id": f"skill_label_{uuid.uuid4().hex[:6]}",
                    "element_type": "text",
                    "page_id": "page-1",
                    "text": skill_name,
                    "x": 50,
                    "y": current_y,
                    "width": 250,
                    "height": 12,
                    "font_size": 9,
                    "font_name": "Helvetica",
                    "text_color": "#334155",
                    "z_index": 3
                })

                # Progress bar background
                enriched.append({
                    "id": f"skill_bg_{uuid.uuid4().hex[:6]}",
                    "element_type": "shape",
                    "shape_type": "rectangle",
                    "page_id": "page-1",
                    "x": 320,
                    "y": current_y + 2,
                    "width": 200,
                    "height": 8,
                    "fill_color": "#E5E7EB",
                    "border_radius": 999,
                    "z_index": 1
                })

                # Progress bar fill
                enriched.append({
                    "id": f"skill_fill_{uuid.uuid4().hex[:6]}",
                    "element_type": "shape",
                    "shape_type": "rectangle",
                    "page_id": "page-1",
                    "x": 320,
                    "y": current_y + 2,
                    "width": int(200 * skill_level),
                    "height": 8,
                    "fill_color": "#2563EB",
                    "border_radius": 999,
                    "z_index": 2
                })

                current_y -= 20

            current_y -= 10

        if not has_education and current_y > 50:
            # Add Education section
            enriched.append({
                "id": f"edu_heading_{uuid.uuid4().hex[:6]}",
                "element_type": "text",
                "page_id": "page-1",
                "text": "EDUCATION",
                "x": 50,
                "y": current_y,
                "width": 512,
                "height": 16,
                "font_size": 12,
                "font_name": "Helvetica-Bold",
                "text_color": "#1E293B",
                "bold": True,
                "z_index": 3
            })
            current_y -= 26

            enriched.append({
                "id": f"degree_{uuid.uuid4().hex[:6]}",
                "element_type": "text",
                "page_id": "page-1",
                "text": "Master of Science in Computer Science",
                "x": 50,
                "y": current_y,
                "width": 400,
                "height": 13,
                "font_size": 10,
                "font_name": "Helvetica-Bold",
                "text_color": "#0F172A",
                "bold": True,
                "z_index": 3
            })
            current_y -= 17

            enriched.append({
                "id": f"university_{uuid.uuid4().hex[:6]}",
                "element_type": "text",
                "page_id": "page-1",
                "text": "Stanford University | 2018 | GPA: 3.9/4.0",
                "x": 50,
                "y": current_y,
                "width": 400,
                "height": 12,
                "font_size": 9,
                "font_name": "Helvetica",
                "text_color": "#64748B",
                "z_index": 3
            })

        print(f"[CreativeArchitect] ✅ Enriched resume from {len(existing_elements)} to {len(enriched)} elements")
        return enriched

    def _get_role_specific_skills(self, role: str) -> List[tuple]:
        """Get skills based on role."""
        role_lower = role.lower()

        if "python" in role_lower:
            return [
                ("Python / Django / FastAPI", 0.95),
                ("SQL / PostgreSQL / MongoDB", 0.90),
                ("Docker / Kubernetes / AWS", 0.85),
                ("REST APIs / GraphQL", 0.88),
                ("Redis / Celery / RabbitMQ", 0.82),
                ("Git / CI/CD / Testing", 0.90),
            ]
        elif "react" in role_lower or "frontend" in role_lower:
            return [
                ("React / Next.js / TypeScript", 0.95),
                ("JavaScript / ES6+ / Node.js", 0.92),
                ("HTML5 / CSS3 / Tailwind", 0.90),
                ("Redux / Context API / Zustand", 0.85),
                ("Webpack / Vite / Build Tools", 0.80),
                ("Jest / Testing Library / E2E", 0.88),
            ]
        elif "full" in role_lower and "stack" in role_lower:
            return [
                ("React / TypeScript / Next.js", 0.93),
                ("Python / Django / FastAPI", 0.92),
                ("AWS / Docker / Kubernetes", 0.88),
                ("PostgreSQL / Redis / MongoDB", 0.85),
                ("GraphQL / REST APIs", 0.90),
                ("CI/CD / Git / Testing", 0.87),
            ]
        elif "data" in role_lower or "ml" in role_lower:
            return [
                ("Python / PyTorch / TensorFlow", 0.95),
                ("SQL / Pandas / NumPy", 0.92),
                ("Machine Learning / Deep Learning", 0.90),
                ("AWS SageMaker / MLOps", 0.85),
                ("Scikit-learn / XGBoost", 0.88),
                ("Data Visualization / Tableau", 0.80),
            ]
        elif "devops" in role_lower or "sre" in role_lower:
            return [
                ("Kubernetes / Docker / Helm", 0.95),
                ("AWS / GCP / Azure", 0.92),
                ("Terraform / Infrastructure as Code", 0.90),
                ("Jenkins / GitLab CI / GitHub Actions", 0.88),
                ("Prometheus / Grafana / ELK", 0.85),
                ("Linux / Bash / Python", 0.90),
            ]
        elif "product" in role_lower:
            return [
                ("Product Strategy / Roadmapping", 0.95),
                ("User Research / A/B Testing", 0.90),
                ("Agile / Scrum / Jira", 0.92),
                ("Data Analysis / SQL / Analytics", 0.85),
                ("Wireframing / Figma / Design", 0.80),
                ("Stakeholder Management", 0.88),
            ]
        else:  # Default software engineer
            return [
                ("JavaScript / TypeScript / Python", 0.92),
                ("React / Node.js / Express", 0.90),
                ("AWS / Docker / Microservices", 0.85),
                ("SQL / NoSQL / Databases", 0.88),
                ("Git / CI/CD / Agile", 0.90),
                ("REST APIs / GraphQL", 0.87),
            ]

    def _get_role_specific_experience(self, role: str) -> List[Dict[str, Any]]:
        """Get experience entries based on role."""
        role_lower = role.lower()

        if "python" in role_lower:
            return [
                {
                    "title": "Senior Python Developer",
                    "company": "TechCorp Systems",
                    "duration": "2021 – Present",
                    "location": "San Francisco, CA",
                    "bullets": [
                        "• Architected and deployed scalable Python microservices handling 10M+ daily API requests with 99.9% uptime",
                        "• Optimized database queries and implemented Redis caching, reducing response times by 65%",
                        "• Led migration from monolith to microservices architecture using FastAPI and Docker, improving deployment velocity by 400%",
                    ]
                },
                {
                    "title": "Python Software Engineer",
                    "company": "DataFlow Solutions",
                    "duration": "2018 – 2021",
                    "location": "Austin, TX",
                    "bullets": [
                        "• Built automated data processing pipelines using Python, Celery, and RabbitMQ processing 5TB+ data daily",
                        "• Implemented comprehensive test suite achieving 95% code coverage with pytest and continuous integration",
                    ]
                }
            ]
        elif "react" in role_lower or "frontend" in role_lower:
            return [
                {
                    "title": "Senior Frontend Developer",
                    "company": "UINext Technologies",
                    "duration": "2021 – Present",
                    "location": "New York, NY",
                    "bullets": [
                        "• Led frontend development of enterprise SaaS platform using React, TypeScript, and Next.js serving 50K+ users",
                        "• Improved Core Web Vitals scores by 40% through code splitting, lazy loading, and performance optimization",
                        "• Architected component library with Storybook and design tokens, reducing development time by 30%",
                    ]
                },
                {
                    "title": "Frontend Engineer",
                    "company": "WebScale Inc",
                    "duration": "2018 – 2021",
                    "location": "Seattle, WA",
                    "bullets": [
                        "• Built responsive web applications using React, Redux, and Material-UI with mobile-first approach",
                        "• Implemented accessibility standards (WCAG 2.1 AA) ensuring inclusive user experience",
                    ]
                }
            ]
        elif "full" in role_lower and "stack" in role_lower:
            return [
                {
                    "title": "Senior Full-Stack Engineer",
                    "company": "CloudStack Solutions",
                    "duration": "2021 – Present",
                    "location": "San Francisco, CA",
                    "bullets": [
                        "• Architected and deployed full-stack web applications using React, Node.js, and PostgreSQL for 100K+ users",
                        "• Built RESTful and GraphQL APIs handling 15M+ requests daily with sub-200ms response times",
                        "• Reduced infrastructure costs by $180K annually through AWS optimization and serverless architecture",
                    ]
                },
                {
                    "title": "Full-Stack Developer",
                    "company": "StartupHub",
                    "duration": "2018 – 2021",
                    "location": "Austin, TX",
                    "bullets": [
                        "• Developed feature-rich SaaS platform using React frontend and Python/Django backend",
                        "• Implemented real-time features using WebSockets and Redis pub/sub for collaborative editing",
                    ]
                }
            ]
        else:  # Default software engineer experience
            return [
                {
                    "title": "Senior Software Engineer",
                    "company": "TechCorp",
                    "duration": "2021 – Present",
                    "location": "San Francisco, CA",
                    "bullets": [
                        "• Led development of cloud-native applications processing 5M+ daily transactions",
                        "• Reduced system latency by 50% through database optimization and caching strategies",
                        "• Mentored team of 6 junior engineers and established code review best practices",
                    ]
                },
                {
                    "title": "Software Engineer",
                    "company": "StartupCo",
                    "duration": "2018 – 2021",
                    "location": "Austin, TX",
                    "bullets": [
                        "• Built microservices architecture using Docker and Kubernetes",
                        "• Implemented CI/CD pipelines reducing deployment time by 70%",
                    ]
                }
            ]

    def _get_role_specific_summary(self, role: str) -> str:
        """Get professional summary based on role."""
        role_lower = role.lower()

        if "python" in role_lower:
            return "Results-driven Senior Python Developer with 6+ years of experience building scalable backend systems and microservices. Expert in Python, Django, FastAPI, and cloud technologies. Proven track record of optimizing application performance by 60% and reducing infrastructure costs by $180K annually."
        elif "react" in role_lower or "frontend" in role_lower:
            return "Creative Senior Frontend Developer with 6+ years of experience building responsive, accessible web applications. Expert in React, TypeScript, Next.js, and modern frontend architecture. Proven track record of improving Core Web Vitals by 40% and leading component library development."
        elif "full" in role_lower and "stack" in role_lower:
            return "Versatile Senior Full-Stack Engineer with 6+ years building end-to-end web applications. Expert in React, Node.js, Python, and cloud architecture. Proven track record of scaling systems to 100K+ users and reducing costs by $180K annually through optimization."
        elif "data" in role_lower or "ml" in role_lower:
            return "Innovative Senior Data Scientist with 6+ years developing machine learning models and data pipelines. Expert in Python, PyTorch, TensorFlow, and MLOps. Proven track record of deploying production ML systems improving business metrics by 35%."
        elif "devops" in role_lower:
            return "Expert Senior DevOps Engineer with 6+ years automating infrastructure and improving deployment pipelines. Specialist in Kubernetes, AWS, Terraform, and CI/CD. Proven track record of achieving 99.9% uptime and reducing deployment times by 80%."
        elif "product" in role_lower:
            return "Strategic Senior Product Manager with 6+ years driving product vision and delivering customer value. Expert in product strategy, user research, and data-driven decision making. Proven track record of launching 5+ successful products generating $10M+ ARR."
        else:
            return "Results-driven Senior Software Engineer with 6+ years building scalable cloud systems and leading high-performing teams. Expert in modern web technologies and cloud architecture. Proven track record of improving system performance by 60% and reducing costs by 40%."

    def _validate_and_fix_elements(self, elements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Validate and fix common issues in AI-generated elements."""
        fixed_elements = []

        for idx, el in enumerate(elements):
            # Ensure required fields
            if not el.get("id"):
                el["id"] = f"el_{uuid.uuid4().hex[:8]}"

            if not el.get("page_id"):
                el["page_id"] = "page-1"

            if not el.get("element_type"):
                el["element_type"] = "text"

            # Validate coordinates
            el["x"] = float(el.get("x", 40))
            el["y"] = float(el.get("y", 700 - idx * 20))
            el["width"] = float(el.get("width", 100))
            el["height"] = float(el.get("height", 20))

            # Clamp to canvas bounds
            el["x"] = max(0, min(PAGE_WIDTH - el["width"], el["x"]))
            el["y"] = max(0, min(PAGE_HEIGHT - el["height"], el["y"]))

            # Set default z_index
            if "z_index" not in el:
                el["z_index"] = 0 if el.get("element_type") == "shape" and el.get("width", 0) > 400 else 3

            # Fix text elements
            if el.get("element_type") == "text":
                if not el.get("text"):
                    continue  # Skip empty text elements

                el["font_size"] = float(el.get("font_size", 10))
                el["text_color"] = str(el.get("text_color", "#1E293B"))
                el["font_name"] = str(el.get("font_name", "Helvetica"))

                # Recalculate height for accurate text wrapping
                text = str(el["text"])
                font_size = el["font_size"]
                width = el["width"]
                line_height = float(el.get("line_height", 1.35))

                char_width = font_size * 0.52
                chars_per_line = max(10, int(width / char_width))
                lines = max(1, (len(text) + chars_per_line - 1) // chars_per_line)
                el["height"] = round(lines * font_size * line_height, 1)

            # Fix shape elements
            elif el.get("element_type") == "shape":
                if not el.get("shape_type"):
                    el["shape_type"] = "rectangle"

                el["fill_color"] = str(el.get("fill_color", "#475569"))

                if el.get("shape_type") == "line":
                    el["x2"] = float(el.get("x2", el["x"] + el.get("width", 100)))
                    el["y2"] = float(el.get("y2", el["y"]))

            fixed_elements.append(el)

        return fixed_elements

    def design_creative_resume(
        self,
        user_prompt: str,
        candidate_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Main method: Design a completely creative resume from user prompt.

        Args:
            user_prompt: User's description of desired resume design
            candidate_data: Optional candidate information (name, experience, etc.)

        Returns:
            Dict with status, elements, and metadata
        """
        print(f"[CreativeArchitect] 🎨 Designing creative resume for: {user_prompt[:60]}...")

        # Enhance prompt with candidate data if provided
        enhanced_prompt = user_prompt
        if candidate_data:
            name = candidate_data.get("name", "Alexander Chen")
            role = candidate_data.get("role", "Senior Software Engineer")
            enhanced_prompt = f"""{user_prompt}

CANDIDATE INFORMATION:
- Name: {name}
- Target Role: {role}
- Has {len(candidate_data.get("experiences", []))} work experiences
- Has {len(candidate_data.get("skills", []))} skills
- Education background included

Design a beautiful, unique resume layout for this candidate.
"""

        # Call AI to generate design
        response = self._call_ai(enhanced_prompt)

        if not response:
            return {
                "status": "error",
                "error": "AI failed to generate design",
                "fallback_triggered": True
            }

        # Extract and validate elements
        elements = self._extract_json_from_response(response)

        if not elements:
            return {
                "status": "error",
                "error": "Failed to parse AI-generated design",
                "raw_response": response[:500],
                "fallback_triggered": True
            }

        # Validate and fix elements
        fixed_elements = self._validate_and_fix_elements(elements)

        # Check if AI generated a complete resume
        # Even if we have 10-20 elements, they might just be a header
        # We need to check if we have actual CONTENT sections
        has_actual_content = self._has_complete_content(fixed_elements)

        # ALSO check if AI's content matches the user's prompt
        content_matches_prompt = self._validate_content_matches_prompt(fixed_elements, user_prompt)

        if len(fixed_elements) < 20 or not has_actual_content or not content_matches_prompt:
            if not content_matches_prompt:
                print(f"[CreativeArchitect] ⚠️ AI generated content that doesn't match prompt!")
            if len(fixed_elements) < 20:
                print(f"[CreativeArchitect] ⚠️ AI generated only {len(fixed_elements)} elements (need 30+)")
            if not has_actual_content:
                print(f"[CreativeArchitect] ⚠️ AI generated incomplete content (no sections)")

            print("[CreativeArchitect] 🔧 Enriching with missing sections...")

            # Enrich with missing sections
            # If content doesn't match prompt, force complete rebuild
            force_rebuild = not content_matches_prompt
            fixed_elements = self._enrich_incomplete_resume(fixed_elements, user_prompt, candidate_data, force_rebuild=force_rebuild)

        if len(fixed_elements) < 10:
            return {
                "status": "error",
                "error": f"AI generated incomplete resume ({len(fixed_elements)} elements), falling back to template system",
                "fallback_triggered": True
            }

        print(f"[CreativeArchitect] ✅ Successfully generated {len(fixed_elements)} elements")

        return {
            "status": "success",
            "elements": fixed_elements,
            "element_count": len(fixed_elements),
            "design_approach": "pure_creative_ai",
            "message": f"Creative AI designed {len(fixed_elements)} elements with mathematical precision"
        }

    def design_creative_resume_stream(
        self,
        user_prompt: str,
        candidate_data: Optional[Dict[str, Any]] = None
    ):
        """Streaming version that yields progress events."""
        yield {
            "type": "status",
            "stage": "creative_thinking",
            "message": "AI is thinking creatively about your resume design...",
            "step_index": 1,
            "total_steps": 3
        }
        time.sleep(0.05)

        yield {
            "type": "agent_start",
            "agent": "creative_designer",
            "message": "Creative AI Designer is generating a unique layout from scratch..."
        }
        time.sleep(0.05)

        result = self.design_creative_resume(user_prompt, candidate_data)

        if result["status"] == "success":
            yield {
                "type": "agent_step",
                "agent": "creative_designer",
                "step_index": 2,
                "total_steps": 3,
                "message": f"Generated {result['element_count']} elements with mathematical precision"
            }
            time.sleep(0.05)

            yield {
                "type": "complete",
                "status": "success",
                "elements": result["elements"],
                "design_approach": result["design_approach"],
                "message": result["message"]
            }
        else:
            yield {
                "type": "fallback_prompt",
                "fallback_triggered": True,
                "message": result.get("error", "AI design generation failed"),
                "error": result.get("error")
            }


def run_creative_architect(user_prompt: str, candidate_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Public API: Generate a creative resume design."""
    architect = CreativeAIArchitect()
    return architect.design_creative_resume(user_prompt, candidate_data)


def run_creative_architect_stream(user_prompt: str, candidate_data: Optional[Dict[str, Any]] = None):
    """Public API: Generate a creative resume design with streaming."""
    architect = CreativeAIArchitect()
    yield from architect.design_creative_resume_stream(user_prompt, candidate_data)
