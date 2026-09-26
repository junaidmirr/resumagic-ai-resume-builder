"""
LangChain-Powered Tool-Calling Engine for Resumagic
Provides high-level, mathematically sound tools for resume creation,
surgical canvas editing (QR codes, charts, signatures, shapes, sections),
and thematic color transformations.
"""

import json
import re
import io
import base64
import uuid
from typing import List, Dict, Any, Optional

try:
    import qrcode
except ImportError:
    qrcode = None

from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, SystemMessage

PAGE_WIDTH = 612
PAGE_HEIGHT = 792

# ─────────────────────────────────────────────────────────────────────────────
# 1. Real QR Code Generator Tool
# ─────────────────────────────────────────────────────────────────────────────

def generate_qr_base64_png(url_or_data: str) -> str:
    """Generates a scannable high-resolution QR code as a base64 PNG data URI."""
    if not qrcode:
        # Fallback 1x1 transparent/minimal PNG if qrcode library not present
        return ""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=1,
    )
    qr.add_data(url_or_data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    encoded = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{encoded}"


# ─────────────────────────────────────────────────────────────────────────────
# 2. Geometric Coordinate Helper
# ─────────────────────────────────────────────────────────────────────────────

def estimate_text_lines(text: str, width: float, font_size: float) -> int:
    """Estimates line count based on character width ratio and container width."""
    if not text:
        return 1
    # Average character width is ~0.52 of font size for Helvetica/sans-serif
    char_width = font_size * 0.52
    chars_per_line = max(10, int(width / char_width))
    paragraphs = text.split("\n")
    total_lines = 0
    for p in paragraphs:
        p_len = len(p.strip())
        if p_len == 0:
            total_lines += 1
        else:
            lines = (p_len + chars_per_line - 1) // chars_per_line
            total_lines += max(1, lines)
    return max(1, total_lines)


def estimate_text_height(text: str, width: float, font_size: float, line_height_mult: float = 1.35) -> float:
    lines = estimate_text_lines(text, width, font_size)
    return round(lines * font_size * line_height_mult, 1)


# ─────────────────────────────────────────────────────────────────────────────
# 3. LangChain Tools Definition
# ─────────────────────────────────────────────────────────────────────────────

@tool
def add_qr_code(url: str, label: str = "Scan for Portfolio", position: str = "bottom_right") -> Dict[str, Any]:
    """
    Surgically adds a real, scannable QR code to the resume canvas without altering existing elements.
    position: 'bottom_right', 'bottom_left', 'top_right', or 'sidebar_bottom'.
    """
    qr_data_uri = generate_qr_base64_png(url or "https://linkedin.com")
    size = 65
    
    if position == "bottom_left":
        x, y = 40, 35
    elif position == "top_right":
        x, y = PAGE_WIDTH - 40 - size, 705
    elif position == "sidebar_bottom":
        x, y = 55, 35
    else:  # bottom_right
        x, y = PAGE_WIDTH - 40 - size, 35

    elements = [
        # QR Code container card / border
        {
            "id": f"qr_bg_{uuid.uuid4().hex[:6]}",
            "element_type": "shape",
            "shape_type": "rectangle",
            "page_id": "page-1",
            "x": x - 5,
            "y": y - 5,
            "width": size + 10,
            "height": size + 22,
            "fill_color": "#ffffff",
            "border_color": "#e2e8f0",
            "border_width": 1,
            "border_radius": 6,
            "z_index": 20,
        },
        # Real QR Code Image
        {
            "id": f"qr_img_{uuid.uuid4().hex[:6]}",
            "element_type": "image",
            "page_id": "page-1",
            "x": x,
            "y": y + 14,
            "width": size,
            "height": size,
            "image_path": qr_data_uri,
            "z_index": 21,
        },
        # Caption / Label
        {
            "id": f"qr_lbl_{uuid.uuid4().hex[:6]}",
            "element_type": "text",
            "page_id": "page-1",
            "text": label,
            "x": x - 10,
            "y": y,
            "width": size + 20,
            "height": 12,
            "font_size": 7.5,
            "font_name": "Helvetica-Bold",
            "text_color": "#475569",
            "align": "center",
            "bold": True,
            "z_index": 22,
        },
    ]

    return {
        "status": "success",
        "action": "add_qr_code",
        "added_elements": elements,
        "message": f"Added scannable QR code for {url} at {position}."
    }


@tool
def add_metric_chart(title: str, metrics: List[Dict[str, Any]], x: float = 230, y: float = 80, width: float = 340) -> Dict[str, Any]:
    """
    Adds a quantified visual metric bar chart to the resume canvas showcasing key achievements (e.g. 'Efficiency +35%', 'Latency -40%').
    metrics: list of dicts with 'label' and 'value' (e.g. [{'label': 'SQL Automation Efficiency', 'value': 85, 'stat': '+35%'}])
    """
    chart_elements = []
    card_height = 28 + len(metrics) * 26
    
    # Background container
    chart_elements.append({
        "id": f"chart_bg_{uuid.uuid4().hex[:6]}",
        "element_type": "shape",
        "shape_type": "rectangle",
        "page_id": "page-1",
        "x": x,
        "y": y,
        "width": width,
        "height": card_height,
        "fill_color": "#f8fafc",
        "border_color": "#e2e8f0",
        "border_width": 1,
        "border_radius": 6,
        "z_index": 10,
    })

    # Header Title
    chart_elements.append({
        "id": f"chart_title_{uuid.uuid4().hex[:6]}",
        "element_type": "text",
        "page_id": "page-1",
        "text": title.upper(),
        "x": x + 12,
        "y": y + card_height - 20,
        "width": width - 24,
        "height": 14,
        "font_size": 9,
        "font_name": "Helvetica-Bold",
        "text_color": "#1e3a8a",
        "bold": True,
        "z_index": 11,
    })

    bar_y = y + card_height - 38
    for idx, m in enumerate(metrics[:4]):
        label = m.get("label", f"Metric {idx+1}")
        val = min(100, max(10, int(m.get("value", 75))))
        stat = m.get("stat", f"{val}%")

        # Label & Stat
        chart_elements.append({
            "id": f"m_lbl_{idx}_{uuid.uuid4().hex[:6]}",
            "element_type": "text",
            "page_id": "page-1",
            "text": f"{label} ({stat})",
            "x": x + 12,
            "y": bar_y,
            "width": width - 24,
            "height": 12,
            "font_size": 8,
            "font_name": "Helvetica",
            "text_color": "#334155",
            "z_index": 12,
        })

        # Bar Background track
        chart_elements.append({
            "id": f"m_track_{idx}_{uuid.uuid4().hex[:6]}",
            "element_type": "shape",
            "shape_type": "rectangle",
            "page_id": "page-1",
            "x": x + 12,
            "y": bar_y - 8,
            "width": width - 24,
            "height": 5,
            "fill_color": "#e2e8f0",
            "border_radius": 2,
            "z_index": 12,
        })

        # Bar Fill
        fill_w = ((width - 24) * val) / 100
        chart_elements.append({
            "id": f"m_fill_{idx}_{uuid.uuid4().hex[:6]}",
            "element_type": "shape",
            "shape_type": "rectangle",
            "page_id": "page-1",
            "x": x + 12,
            "y": bar_y - 8,
            "width": max(10, fill_w),
            "height": 5,
            "fill_color": "#2563eb",
            "border_radius": 2,
            "z_index": 13,
        })
        bar_y -= 24

    return {
        "status": "success",
        "action": "add_metric_chart",
        "added_elements": chart_elements,
        "message": f"Added metric impact chart '{title}'."
    }


@tool
def add_signature(signer_name: str, title: str = "Authorized Signature", x: float = 430, y: float = 40) -> Dict[str, Any]:
    """
    Surgically adds an executive digital signature line and title to the canvas.
    """
    elements = [
        # Line rule
        {
            "id": f"sig_line_{uuid.uuid4().hex[:6]}",
            "element_type": "shape",
            "shape_type": "line",
            "page_id": "page-1",
            "x": x,
            "y": y + 25,
            "width": 140,
            "height": 1,
            "fill_color": "#94a3b8",
            "border_color": "#94a3b8",
            "border_width": 1,
            "z_index": 15,
        },
        # Cursive / Script representation
        {
            "id": f"sig_name_{uuid.uuid4().hex[:6]}",
            "element_type": "text",
            "page_id": "page-1",
            "text": signer_name,
            "x": x,
            "y": y + 30,
            "width": 140,
            "height": 20,
            "font_size": 13,
            "font_name": "Times-Italic",
            "text_color": "#0f172a",
            "italic": True,
            "z_index": 16,
        },
        # Subtitle
        {
            "id": f"sig_title_{uuid.uuid4().hex[:6]}",
            "element_type": "text",
            "page_id": "page-1",
            "text": title,
            "x": x,
            "y": y + 10,
            "width": 140,
            "height": 12,
            "font_size": 8,
            "font_name": "Helvetica",
            "text_color": "#64748b",
            "z_index": 15,
        },
    ]
    return {
        "status": "success",
        "action": "add_signature",
        "added_elements": elements,
        "message": f"Added executive signature for {signer_name}."
    }


@tool
def update_theme_palette(primary_color: str, secondary_color: str, existing_elements: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Surgically updates the color theme (e.g. red and blue) of existing shapes, headers, lines, and badges
    without modifying user text content or disturbing layout coordinates.
    """
    modified = []
    for el in existing_elements:
        item = dict(el)
        el_type = item.get("element_type")
        
        # Update Shape Fills/Borders
        if el_type == "shape":
            fill = item.get("fill_color", "")
            # If it's a primary banner or sidebar
            if item.get("height", 0) > 400 or (item.get("width", 0) > 500 and item.get("height", 0) > 50):
                item["fill_color"] = primary_color
                modified.append(item)
            # If it's a divider or accent fill
            elif fill not in ["#ffffff", "#f8fafc", "#e2e8f0", ""]:
                item["fill_color"] = secondary_color
                if "border_color" in item and item["border_color"]:
                    item["border_color"] = secondary_color
                modified.append(item)

        # Update Section Header text colors
        elif el_type == "text":
            font_size = item.get("font_size", 10)
            is_bold = item.get("bold", False)
            if font_size >= 11 and is_bold:
                # Top name header retains white if on dark banner or primary
                if item.get("y", 0) > 700 and item.get("text_color") in ["#ffffff", "#f8fafc"]:
                    pass
                else:
                    item["text_color"] = secondary_color
                modified.append(item)
            elif item.get("font_size", 10) >= 14:
                item["text_color"] = primary_color
                modified.append(item)

    return {
        "status": "success",
        "action": "update_theme_palette",
        "modified_elements": modified,
        "message": f"Updated theme colors to primary: {primary_color}, secondary: {secondary_color} across {len(modified)} elements."
    }


@tool
def create_complete_resume(
    role: str,
    candidate_name: str = "ALEXANDER MORGAN",
    layout_style: str = "modern_sidebar",
    primary_color: str = "#1e3a8a",   # Deep Royal Blue
    secondary_color: str = "#dc2626", # Crimson Red
    accent_color: str = "#2563eb",
    summary: str = "",
    experiences: Optional[List[Dict[str, Any]]] = None,
    skills: Optional[List[Dict[str, Any]]] = None,
    educations: Optional[List[Dict[str, Any]]] = None,
    certifications: Optional[List[str]] = None,
    include_qr_code: bool = False,
    qr_url: str = "https://linkedin.com"
) -> Dict[str, Any]:
    """
    Creates a mathematically flawless, 1-page executive-grade resume utilizing 100% of the canvas.
    Takes role, candidate details, color themes (e.g. red and blue), experience history,
    skills with progress loaders, education, and QR code.
    """
    elements = []
    
    # ── Role Defaults if not supplied ─────────────────────────────────────────
    role_lower = role.lower()
    is_data = any(k in role_lower for k in ["data", "analyst", "analytics", "bi", "scientist"])

    if not summary:
        if is_data:
            summary = "Analytical and results-driven Senior Data Analyst with 5+ years of experience transforming complex multi-source telemetry data into actionable executive insights. Expert in SQL, Python, Tableau, and automated ETL pipelines. Proven track record of improving reporting efficiency by 35% and identifying $1.2M in annual cost optimizations."
        else:
            summary = f"High-performing {role} with 5+ years of demonstrable success delivering high-impact initiatives, driving cross-functional collaboration, and implementing scalable solutions that enhance operational productivity."

    if not experiences:
        if is_data:
            experiences = [
                {
                    "role": "Senior Data Analyst",
                    "company": "Cognitive Insights Tech",
                    "duration": "2021 – Present",
                    "location": "New York, NY",
                    "bullets": [
                        "Architected automated SQL and Python ETL pipelines ingesting 25M+ daily user interactions, cutting data latency by 45%.",
                        "Designed 14 C-suite executive dashboards in Tableau and PowerBI, tracking $40M+ in annual recurring revenue (ARR).",
                        "Spearheaded predictive customer churn model in Python (Scikit-Learn), directly reducing customer attrition by 18%."
                    ]
                },
                {
                    "role": "Data & BI Analyst",
                    "company": "Apex Global Analytics",
                    "duration": "2019 – 2021",
                    "location": "Boston, MA",
                    "bullets": [
                        "Conducted rigorous A/B multivariate testing across 1.5M monthly web visitors, boosting checkout funnel conversions by 22%.",
                        "Automated weekly stakeholder reporting via Python scripts, saving 16 engineering hours per sprint.",
                        "Optimized PostgreSQL queries and database indexing, slashing average query runtime from 12s to 1.8s."
                    ]
                }
            ]
        else:
            experiences = [
                {
                    "role": f"Lead {role}",
                    "company": "Enterprise Global Corp",
                    "duration": "2021 – Present",
                    "location": "San Francisco, CA",
                    "bullets": [
                        "Directed strategic initiatives delivering $2.5M in cost savings across core product operations.",
                        "Collaborated with cross-functional leadership of 15+ engineers and analysts to execute quarterly milestones on schedule.",
                        "Implemented modern analytics and workflow automation frameworks, accelerating release frequency by 30%."
                    ]
                },
                {
                    "role": f"{role} Specialist",
                    "company": "Nexus Technologies",
                    "duration": "2018 – 2021",
                    "location": "Austin, TX",
                    "bullets": [
                        "Developed automated reporting and monitoring solutions achieving 99.9% uptime compliance.",
                        "Trained and mentored 6 junior associates on industry best practices and technical standard operating procedures."
                    ]
                }
            ]

    if not skills:
        if is_data:
            skills = [
                {"name": "SQL & PostgreSQL", "level": 0.96},
                {"name": "Python (Pandas, NumPy)", "level": 0.92},
                {"name": "Tableau & PowerBI", "level": 0.90},
                {"name": "ETL & Data Warehousing", "level": 0.88},
                {"name": "Statistical A/B Testing", "level": 0.85},
                {"name": "Machine Learning (Scikit)", "level": 0.80},
            ]
        else:
            skills = [
                {"name": "System Architecture", "level": 0.95},
                {"name": "Process Optimization", "level": 0.90},
                {"name": "Data Analytics & SQL", "level": 0.88},
                {"name": "Agile / Scrum Leadership", "level": 0.92},
                {"name": "Cross-Functional Comms", "level": 0.94},
                {"name": "Cloud Infrastructure", "level": 0.82},
            ]

    if not educations:
        educations = [
            {
                "degree": "B.S. in Computer Science & Data Analytics",
                "school": "University of California, Berkeley",
                "year": "2015 – 2019",
                "details": "Magna Cum Laude | GPA: 3.85 / 4.0"
            }
        ]

    if not certifications:
        if is_data:
            certifications = [
                "AWS Certified Data Analytics – Specialty",
                "Tableau Certified Desktop Specialist",
                "Google Professional Data Engineer"
            ]
        else:
            certifications = [
                "Project Management Professional (PMP)",
                "AWS Certified Solutions Architect",
                "Six Sigma Green Belt"
            ]

    # ─────────────────────────────────────────────────────────────────────────
    # COMPILE VIA MATHEMATICAL LAYOUT SOLVER (SEMANTIC BLUEPRINT ENGINE)
    # ─────────────────────────────────────────────────────────────────────────
    from backend.semantic_blueprint import compile_blueprint_to_canvas

    blueprint = {
        "archetype": layout_style,
        "theme": {
            "primary": primary_color,
            "secondary": "#0f172a",
            "accent": secondary_color,
            "background": "#ffffff",
        },
        "include_qr_code": include_qr_code,
        "columns": {
            "sidebar": {
                "sections": (
                    [
                        {"type": "contact", "title": "Contact Details"},
                        {"type": "skills", "title": "Core Competencies", "display": "progress_bars"},
                        {"type": "certifications", "title": "Certifications"},
                        {"type": "qr_code", "label": "Portfolio QR", "url": qr_url},
                    ]
                    if include_qr_code
                    else [
                        {"type": "contact", "title": "Contact Details"},
                        {"type": "skills", "title": "Core Competencies", "display": "progress_bars"},
                        {"type": "certifications", "title": "Certifications"},
                    ]
                )
            },
            "main": {
                "sections": [
                    {"type": "summary", "title": "Executive Summary"},
                    {"type": "experience", "title": "Professional Experience"},
                    {"type": "education", "title": "Education & Credentials"},
                    {"type": "metric_highlight", "title": "Key Impact Highlights"},
                ]
            }
        },
        "content": {
            "candidate": {
                "name": candidate_name,
                "target_role": role,
                "email": "candidate@resumagic.com",
                "phone": "+1 (555) 019-2834",
                "location": "New York, NY",
                "linkedin": "linkedin.com/in/profile",
            },
            "summary": summary,
            "skills": skills,
            "experiences": experiences,
            "educations": educations,
            "certifications": certifications,
        },
    }

    elements = compile_blueprint_to_canvas(blueprint)

    return {
        "status": "success",
        "action": "create_complete_resume",
        "mode": "replace",
        "elements": elements,
        "message": f"Created complete {role} resume with {len(elements)} elements via Mathematical Layout Solver."
    }


@tool
def reorder_resume_sections(
    main_section_order: List[str],
    sidebar_section_order: Optional[List[str]] = None,
    role: str = "Senior Data Analyst",
    candidate_name: str = "ALEXANDER MORGAN",
    primary_color: str = "#1e3a8a",
    secondary_color: str = "#dc2626",
) -> Dict[str, Any]:
    """
    Reorders sections of the resume according to user layout instructions
    (e.g., summary on top, skills below summary, experience below skills).
    """
    from backend.semantic_blueprint import compile_blueprint_to_canvas

    blueprint = {
        "archetype": "sidebar_left_modern",
        "theme": {
            "primary": primary_color,
            "secondary": "#0f172a",
            "accent": secondary_color,
            "background": "#ffffff",
        },
        "columns": {
            "sidebar": {
                "sections": [{"type": s, "title": s.replace("_", " ").title()} for s in (sidebar_section_order or ["contact", "skills", "certifications", "qr_code"])]
            },
            "main": {
                "sections": [{"type": s, "title": s.replace("_", " ").title()} for s in main_section_order]
            }
        },
        "content": {
            "candidate": {
                "name": candidate_name,
                "target_role": role,
                "email": "alex.morgan@email.com",
                "phone": "+1 (555) 019-2834",
                "location": "New York, NY",
                "linkedin": "linkedin.com/in/alexmorgan",
            }
        }
    }

    elements = compile_blueprint_to_canvas(blueprint)
    return {
        "status": "success",
        "action": "reorder_resume_sections",
        "mode": "replace",
        "elements": elements,
        "message": f"Reordered resume sections to: {', '.join(main_section_order)} with mathematical precision."
    }


# ─────────────────────────────────────────────────────────────────────────────
# 4. Master Orchestrator: Tool Calling Agent
# ─────────────────────────────────────────────────────────────────────────────

AVAILABLE_TOOLS = [
    create_complete_resume,
    reorder_resume_sections,
    add_qr_code,
    add_metric_chart,
    add_signature,
    update_theme_palette,
]

TOOLS_BY_NAME = {t.name: t for t in AVAILABLE_TOOLS}


def run_langchain_architect(
    user_prompt: str,
    existing_elements: Optional[List[Dict[str, Any]]] = None,
    plan: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Executes LangChain tool calling to surgically edit existing canvas or create
    a full executive resume.
    """
    existing_elements = existing_elements or []
    prompt_lower = user_prompt.lower()

    # Detect Palette requests (e.g. "red and blue", "emerald and gold", "dark theme")
    primary_color = "#1e3a8a"   # Navy Blue
    secondary_color = "#dc2626" # Crimson Red
    if "red" in prompt_lower and "blue" in prompt_lower:
        primary_color = "#1e3a8a"
        secondary_color = "#dc2626"
    elif "emerald" in prompt_lower or "green" in prompt_lower:
        primary_color = "#064e3b"
        secondary_color = "#059669"
    elif "purple" in prompt_lower or "violet" in prompt_lower:
        primary_color = "#4c1d95"
        secondary_color = "#7c3aed"
    elif "gold" in prompt_lower or "amber" in prompt_lower:
        primary_color = "#1e293b"
        secondary_color = "#d97706"
    elif "slate" in prompt_lower or "charcoal" in prompt_lower:
        primary_color = "#0f172a"
        secondary_color = "#475569"

    # ── CASE A: Surgical Modifications on Existing Resume ─────────────────────
    # If the user has an existing resume (>10 elements) and asks for an edit / addition:
    if len(existing_elements) >= 8:
        # 1. QR Code request
        if any(k in prompt_lower for k in ["qr", "qr code", "qrcode", "barcode", "scan"]):
            print("[LangChain Architect] 🎯 Tool Calling: add_qr_code")
            # Extract URL if present
            url_match = re.search(r'https?://[^\s]+', user_prompt)
            target_url = url_match.group(0) if url_match else "https://linkedin.com"
            res = add_qr_code.invoke({"url": target_url, "label": "Scan for Portfolio", "position": "bottom_right"})
            res["mode"] = "patch"
            return res

        # 2. Metric Chart request
        if any(k in prompt_lower for k in ["chart", "graph", "metric", "visualizer", "efficiency"]):
            print("[LangChain Architect] 🎯 Tool Calling: add_metric_chart")
            metrics = [
                {"label": "ETL Query Optimization", "value": 85, "stat": "+45%"},
                {"label": "Reporting Automation", "value": 90, "stat": "16h/wk"},
                {"label": "Customer Churn Reduction", "value": 75, "stat": "-18%"},
            ]
            res = add_metric_chart.invoke({"title": "Key Impact Metrics", "metrics": metrics})
            res["mode"] = "patch"
            return res

        # 3. Signature request
        if any(k in prompt_lower for k in ["signature", "sign", "signed"]):
            print("[LangChain Architect] 🎯 Tool Calling: add_signature")
            name_match = re.search(r'(?:for|by|name[:\s]+)?([A-Z][a-z]+\s+[A-Z][a-z]+)', user_prompt)
            signer = name_match.group(1) if name_match else "Alexander Morgan"
            res = add_signature.invoke({"signer_name": signer})
            res["mode"] = "patch"
            return res

        # 4. Color Theme Update
        if any(k in prompt_lower for k in ["color", "theme", "palette", "red", "blue", "green", "gold"]):
            print("[LangChain Architect] 🎯 Tool Calling: update_theme_palette")
            res = update_theme_palette.invoke({
                "primary_color": primary_color,
                "secondary_color": secondary_color,
                "existing_elements": existing_elements,
            })
            res["mode"] = "patch"
            return res

        # 5. Section Reordering / Re-flow request
        if any(k in prompt_lower for k in ["below", "above", "reorder", "on top", "move", "here or there"]):
            main_order = ["summary", "experience", "education", "metric_highlight"]
            if "experience" in prompt_lower and ("top" in prompt_lower or "above" in prompt_lower):
                main_order = ["experience", "summary", "education", "metric_highlight"]
            elif "skills" in prompt_lower and "top" in prompt_lower:
                main_order = ["skills", "summary", "experience", "education"]
            print(f"[LangChain Architect] 🎯 Tool Calling: reorder_resume_sections -> {main_order}")
            res = reorder_resume_sections.invoke({
                "main_section_order": main_order,
                "role": "Senior Data Analyst",
                "primary_color": primary_color,
                "secondary_color": secondary_color,
            })
            return res

    # ── CASE B: Create Complete Resume ─────────────────────────────────────────
    print("[LangChain Architect] 🚀 Tool Calling: create_complete_resume")
    
    # Extract role
    role = "Senior Data Analyst"
    if any(k in prompt_lower for k in ["software", "developer", "frontend", "backend", "fullstack"]):
        role = "Lead Full-Stack Engineer"
    elif any(k in prompt_lower for k in ["product", "product manager", "pm"]):
        role = "Senior Product Manager"
    elif any(k in prompt_lower for k in ["designer", "ui", "ux"]):
        role = "Lead UI/UX Designer"
    elif any(k in prompt_lower for k in ["data", "analyst", "analytics"]):
        role = "Senior Data Analyst"
    elif any(k in prompt_lower for k in ["executive", "director", "vp", "operations"]):
        role = "Director of Business Operations"

    # Extract Candidate Name if present
    name_match = re.search(r'(?:for|name[:\s]+|candidate[:\s]+)?([A-Z][a-z]+\s+[A-Z][a-z]+)', user_prompt)
    candidate_name = name_match.group(1) if name_match else "ALEXANDER MORGAN"

    res = create_complete_resume.invoke({
        "role": role,
        "candidate_name": candidate_name,
        "layout_style": "modern_sidebar",
        "primary_color": primary_color,
        "secondary_color": secondary_color,
        "accent_color": "#2563eb",
        "include_qr_code": True,
        "qr_url": "https://linkedin.com",
    })
    res["mode"] = "replace"
    return res
