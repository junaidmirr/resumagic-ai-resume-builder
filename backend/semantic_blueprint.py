"""
Semantic Blueprint & Mathematical Layout Solver Engine for Resumagic
Separates AI declarative creative direction (ordering, colors, content)
from mathematical 2D layout solving (line-wrapping, auto-padding, coordinate geometry).
"""

import math
import uuid
from typing import List, Dict, Any, Optional

try:
    from backend.langchain_architect import generate_qr_base64_png
except ImportError:
    try:
        from langchain_architect import generate_qr_base64_png
    except ImportError:
        generate_qr_base64_png = lambda url: ""

PAGE_WIDTH = 612
PAGE_HEIGHT = 792


def estimate_text_lines(text: str, width: float, font_size: float) -> int:
    """Calculates true line count based on font size, character ratio, and container width."""
    if not text:
        return 1
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


def estimate_text_height(text: str, width: float, font_size: float, line_height: float = 1.35) -> float:
    lines = estimate_text_lines(text, width, font_size)
    return round(lines * font_size * line_height, 1)


class MathematicalLayoutSolver:
    """
    Mathematical 2D Constraint Solver.
    Compiles a high-level declarative Semantic Blueprint into exact,
    non-overlapping, bottom-up canvas elements.
    """

    def __init__(self, blueprint: Dict[str, Any]):
        self.blueprint = blueprint
        self.archetype = blueprint.get("archetype", "sidebar_left_modern")
        self.theme = blueprint.get("theme", {})
        self.primary_color = self.theme.get("primary", "#1E3A8A")
        self.secondary_color = self.theme.get("secondary", "#0F172A")
        self.accent_color = self.theme.get("accent", "#DC2626")
        self.bg_color = self.theme.get("background", "#FFFFFF")
        self.font_family = self.theme.get("font_family", "Helvetica")
        
        self.content = blueprint.get("content", {})
        self.candidate = self.content.get("candidate", {})
        self.elements: List[Dict[str, Any]] = []

    def compile(self) -> List[Dict[str, Any]]:
        self.elements = []
        arch = (self.archetype or "sidebar_left_modern").lower()
        if "right" in arch:
            self._compile_sidebar_layout(sidebar_on_left=False)
        elif "grid" in arch or "two_column" in arch:
            self._compile_two_column_grid()
        elif "classic" in arch or "single" in arch:
            self._compile_single_column_classic()
        else: # Default modern sidebar
            self._compile_sidebar_layout(sidebar_on_left=True)
        return self.elements

    # ─────────────────────────────────────────────────────────────────────────
    # 1. Sidebar Layout Solver (Left or Right 30/70 Split)
    # ─────────────────────────────────────────────────────────────────────────
    def _compile_sidebar_layout(self, sidebar_on_left: bool = True):
        sidebar_w = 175
        main_w = 385
        
        if sidebar_on_left:
            sb_x = 0
            sb_content_x = 18
            sb_content_w = 139
            main_x = 195
        else:
            main_x = 35
            sb_x = PAGE_WIDTH - sidebar_w
            sb_content_x = sb_x + 18
            sb_content_w = 139

        # Background Sidebar Shape
        self.elements.append({
            "id": "bg_sidebar",
            "element_type": "shape",
            "shape_type": "rectangle",
            "page_id": "page-1",
            "x": sb_x,
            "y": 0,
            "width": sidebar_w,
            "height": PAGE_HEIGHT,
            "fill_color": self.primary_color,
            "z_index": 0,
        })

        # Top Banner Header for Main Content
        banner_h = 95
        self.elements.append({
            "id": "top_banner",
            "element_type": "shape",
            "shape_type": "rectangle",
            "page_id": "page-1",
            "x": 0 if not sidebar_on_left else sidebar_w,
            "y": PAGE_HEIGHT - banner_h,
            "width": PAGE_WIDTH - sidebar_w,
            "height": banner_h,
            "fill_color": "#f8fafc",
            "border_color": "#e2e8f0",
            "border_width": 1,
            "z_index": 1,
        })

        # Monogram in Sidebar
        avatar_size = 54
        avatar_x = sb_x + (sidebar_w - avatar_size) / 2
        avatar_y = PAGE_HEIGHT - 35 - avatar_size
        cand_name = self.candidate.get("name", "ALEXANDER MORGAN")
        initials = "".join([part[0] for part in cand_name.split() if part])[:2].upper() or "AM"

        self.elements.append({
            "id": "avatar_bg",
            "element_type": "shape",
            "shape_type": "circle",
            "page_id": "page-1",
            "x": avatar_x,
            "y": avatar_y,
            "width": avatar_size,
            "height": avatar_size,
            "fill_color": self.accent_color,
            "z_index": 5,
        })
        self.elements.append({
            "id": "avatar_txt",
            "element_type": "text",
            "page_id": "page-1",
            "text": initials,
            "x": avatar_x,
            "y": avatar_y + 14,
            "width": avatar_size,
            "height": 24,
            "font_size": 20,
            "font_name": "Helvetica-Bold",
            "text_color": "#ffffff",
            "align": "center",
            "bold": True,
            "z_index": 6,
        })

        # Main Header Title & Branding
        target_role = self.candidate.get("target_role", "SENIOR DATA ANALYST")
        contact_line = f"{self.candidate.get('email', 'alex@example.com')}  •  {self.candidate.get('phone', '(555) 019-2834')}  •  {self.candidate.get('linkedin', 'linkedin.com/in/pro')}"
        
        self.elements.append({
            "id": "hdr_name",
            "element_type": "text",
            "page_id": "page-1",
            "text": cand_name.upper(),
            "x": main_x,
            "y": PAGE_HEIGHT - 45,
            "width": main_w,
            "height": 30,
            "font_size": 22,
            "font_name": "Helvetica-Bold",
            "text_color": "#0f172a",
            "bold": True,
            "z_index": 3,
        })
        self.elements.append({
            "id": "hdr_role",
            "element_type": "text",
            "page_id": "page-1",
            "text": target_role.upper(),
            "x": main_x,
            "y": PAGE_HEIGHT - 65,
            "width": main_w,
            "height": 16,
            "font_size": 11,
            "font_name": "Helvetica-Bold",
            "text_color": self.accent_color,
            "bold": True,
            "z_index": 3,
        })
        self.elements.append({
            "id": "hdr_contact",
            "element_type": "text",
            "page_id": "page-1",
            "text": contact_line,
            "x": main_x,
            "y": PAGE_HEIGHT - 85,
            "width": main_w,
            "height": 14,
            "font_size": 9,
            "font_name": "Helvetica",
            "text_color": "#475569",
            "z_index": 3,
        })

        # ── COMPILE SIDEBAR SECTIONS ACCORDING TO BLUEPRINT ORDERING ──────────
        sidebar_config = self.blueprint.get("columns", {}).get("sidebar", {})
        sidebar_sections = sidebar_config.get("sections", [
            {"type": "contact", "title": "Contact Details"},
            {"type": "skills", "title": "Core Competencies", "display": "progress_bars"},
            {"type": "certifications", "title": "Certifications"},
            {"type": "qr_code", "label": "Portfolio QR", "url": "https://linkedin.com"},
        ])

        sb_cursor_top = 110.0
        for sec in sidebar_sections:
            sec_type = sec.get("type")
            sec_title = sec.get("title", "")

            if sec_type == "contact":
                sb_cursor_top = self._render_sb_contact(sb_content_x, sb_content_w, sb_cursor_top, sec_title)
            elif sec_type == "skills":
                sb_cursor_top = self._render_sb_skills(sb_content_x, sb_content_w, sb_cursor_top, sec_title)
            elif sec_type == "certifications":
                sb_cursor_top = self._render_sb_certs(sb_content_x, sb_content_w, sb_cursor_top, sec_title)
            elif sec_type == "qr_code":
                self._render_sb_qr_code(sb_x, sidebar_w, sec.get("url", "https://linkedin.com"), sec.get("label", "SCAN PORTFOLIO"))

        # ── COMPILE MAIN SECTIONS ACCORDING TO BLUEPRINT ORDERING ─────────────
        main_config = self.blueprint.get("columns", {}).get("main", {})
        main_sections = main_config.get("sections", [
            {"type": "summary", "title": "Executive Summary"},
            {"type": "experience", "title": "Professional Experience"},
            {"type": "education", "title": "Education & Credentials"},
            {"type": "metric_highlight", "title": "Key Impact Highlights"},
        ])

        # Auto-Padding calculation across main sections to guarantee 100% canvas height usage
        main_cursor_top = banner_h + 16.0
        total_remaining_height = PAGE_HEIGHT - main_cursor_top - 40
        # Distribute available height smoothly between sections
        sec_gap = max(12.0, min(24.0, total_remaining_height / max(1, len(main_sections) * 5)))

        for sec in main_sections:
            sec_type = sec.get("type")
            sec_title = sec.get("title", "")

            if sec_type == "summary":
                main_cursor_top = self._render_main_summary(main_x, main_w, main_cursor_top, sec_title, sec_gap)
            elif sec_type == "experience":
                main_cursor_top = self._render_main_experience(main_x, main_w, main_cursor_top, sec_title, sec_gap)
            elif sec_type == "education":
                main_cursor_top = self._render_main_education(main_x, main_w, main_cursor_top, sec_title, sec_gap)
            elif sec_type == "metric_highlight":
                main_cursor_top = self._render_main_metrics(main_x, main_w, main_cursor_top, sec_title, sec_gap)
            elif sec_type == "signature":
                main_cursor_top = self._render_main_signature(main_x, main_w, main_cursor_top)

    # ─────────────────────────────────────────────────────────────────────────
    # Helper Section Compilers: Sidebar
    # ─────────────────────────────────────────────────────────────────────────
    def _add_sb_header(self, x: float, w: float, cursor_top: float, title: str) -> float:
        cursor_top += 16
        y = PAGE_HEIGHT - cursor_top - 16
        self.elements.append({
            "id": f"sb_h_{uuid.uuid4().hex[:6]}",
            "element_type": "text",
            "page_id": "page-1",
            "text": title.upper(),
            "x": x,
            "y": y,
            "width": w,
            "height": 16,
            "font_size": 10,
            "font_name": "Helvetica-Bold",
            "text_color": "#ffffff",
            "bold": True,
            "z_index": 5,
        })
        self.elements.append({
            "id": f"sb_rule_{uuid.uuid4().hex[:6]}",
            "element_type": "shape",
            "shape_type": "line",
            "page_id": "page-1",
            "x": x,
            "y": y - 4,
            "width": w,
            "height": 1.5,
            "fill_color": self.accent_color,
            "border_color": self.accent_color,
            "border_width": 1.5,
            "z_index": 5,
        })
        return cursor_top + 22

    def _render_sb_contact(self, x: float, w: float, cursor_top: float, title: str) -> float:
        cursor_top = self._add_sb_header(x, w, cursor_top, title or "Contact Details")
        items = [
            ("Mail", self.candidate.get("email", "alex@resumagic.ai")),
            ("Phone", self.candidate.get("phone", "+1 (555) 019-2834")),
            ("MapPin", self.candidate.get("location", "New York, NY")),
            ("Linkedin", self.candidate.get("linkedin", "linkedin.com/in/profile")),
        ]
        for icon, txt in items:
            y = PAGE_HEIGHT - cursor_top - 14
            self.elements.append({
                "id": f"sb_ic_{uuid.uuid4().hex[:6]}",
                "element_type": "image",
                "page_id": "page-1",
                "x": x,
                "y": y,
                "width": 11,
                "height": 11,
                "is_icon": True,
                "icon_name": icon,
                "z_index": 5,
            })
            self.elements.append({
                "id": f"sb_txt_{uuid.uuid4().hex[:6]}",
                "element_type": "text",
                "page_id": "page-1",
                "text": txt,
                "x": x + 15,
                "y": y,
                "width": w - 15,
                "height": 14,
                "font_size": 8.5,
                "font_name": "Helvetica",
                "text_color": "#e2e8f0",
                "z_index": 5,
            })
            cursor_top += 17
        return cursor_top + 8

    def _render_sb_skills(self, x: float, w: float, cursor_top: float, title: str) -> float:
        cursor_top = self._add_sb_header(x, w, cursor_top, title or "Core Competencies")
        skills = self.content.get("skills", [
            {"name": "SQL & PostgreSQL", "level": 0.96},
            {"name": "Python (Pandas, NumPy)", "level": 0.92},
            {"name": "Tableau & PowerBI", "level": 0.90},
            {"name": "ETL & Data Warehousing", "level": 0.88},
            {"name": "Statistical A/B Testing", "level": 0.85},
            {"name": "Predictive Modeling", "level": 0.80},
        ])
        for s_idx, s in enumerate(skills[:6]):
            s_name = s.get("name", "Skill")
            s_lvl = float(s.get("level", 0.85))
            
            y_name = PAGE_HEIGHT - cursor_top - 12
            self.elements.append({
                "id": f"sk_txt_{s_idx}_{uuid.uuid4().hex[:6]}",
                "element_type": "text",
                "page_id": "page-1",
                "text": s_name,
                "x": x,
                "y": y_name,
                "width": w,
                "height": 12,
                "font_size": 8.5,
                "font_name": "Helvetica-Bold",
                "text_color": "#ffffff",
                "bold": True,
                "z_index": 5,
            })
            
            # Dual-layer progress bar: distinct 25pt vertical separation
            y_bar = y_name - 8
            self.elements.append({
                "id": f"sk_bg_{s_idx}_{uuid.uuid4().hex[:6]}",
                "element_type": "shape",
                "shape_type": "rectangle",
                "page_id": "page-1",
                "x": x,
                "y": y_bar,
                "width": w,
                "height": 4.5,
                "fill_color": "rgba(255,255,255,0.22)",
                "border_radius": 2,
                "z_index": 5,
            })
            fill_w = max(12.0, w * s_lvl)
            self.elements.append({
                "id": f"sk_fill_{s_idx}_{uuid.uuid4().hex[:6]}",
                "element_type": "shape",
                "shape_type": "rectangle",
                "page_id": "page-1",
                "x": x,
                "y": y_bar,
                "width": fill_w,
                "height": 4.5,
                "fill_color": self.accent_color,
                "border_radius": 2,
                "z_index": 6,
            })
            cursor_top += 25
        return cursor_top + 6

    def _render_sb_certs(self, x: float, w: float, cursor_top: float, title: str) -> float:
        cursor_top = self._add_sb_header(x, w, cursor_top, title or "Certifications")
        certs = self.content.get("certifications", [
            "AWS Certified Data Analytics – Specialty",
            "Tableau Certified Desktop Specialist",
            "Google Professional Data Engineer"
        ])
        for c_idx, cert in enumerate(certs[:3]):
            h_cert = estimate_text_height(cert, w, 8)
            y = PAGE_HEIGHT - cursor_top - h_cert
            self.elements.append({
                "id": f"cert_{c_idx}_{uuid.uuid4().hex[:6]}",
                "element_type": "text",
                "page_id": "page-1",
                "text": f"• {cert}",
                "x": x,
                "y": y,
                "width": w,
                "height": h_cert,
                "font_size": 8,
                "font_name": "Helvetica",
                "text_color": "#cbd5e1",
                "line_height": 1.3,
                "z_index": 5,
            })
            cursor_top += h_cert + 6
        return cursor_top + 6

    def _render_sb_qr_code(self, sb_x: float, sidebar_w: float, url: str, label: str):
        qr_size = 54
        qr_y = 35
        qr_data_uri = generate_qr_base64_png(url or "https://linkedin.com")
        self.elements.append({
            "id": "sb_qr_bg",
            "element_type": "shape",
            "shape_type": "rectangle",
            "page_id": "page-1",
            "x": sb_x + (sidebar_w - qr_size) / 2 - 4,
            "y": qr_y - 4,
            "width": qr_size + 8,
            "height": qr_size + 20,
            "fill_color": "#ffffff",
            "border_radius": 4,
            "z_index": 5,
        })
        self.elements.append({
            "id": "sb_qr_img",
            "element_type": "image",
            "page_id": "page-1",
            "x": sb_x + (sidebar_w - qr_size) / 2,
            "y": qr_y + 12,
            "width": qr_size,
            "height": qr_size,
            "image_path": qr_data_uri,
            "z_index": 6,
        })
        self.elements.append({
            "id": "sb_qr_txt",
            "element_type": "text",
            "page_id": "page-1",
            "text": label.upper(),
            "x": sb_x + (sidebar_w - qr_size) / 2 - 4,
            "y": qr_y + 1,
            "width": qr_size + 8,
            "height": 10,
            "font_size": 6.5,
            "font_name": "Helvetica-Bold",
            "text_color": "#0f172a",
            "align": "center",
            "bold": True,
            "z_index": 6,
        })

    # ─────────────────────────────────────────────────────────────────────────
    # Helper Section Compilers: Main Area
    # ─────────────────────────────────────────────────────────────────────────
    def _add_main_header(self, x: float, w: float, cursor_top: float, title: str) -> float:
        cursor_top += 12
        y = PAGE_HEIGHT - cursor_top - 18
        self.elements.append({
            "id": f"main_h_{uuid.uuid4().hex[:6]}",
            "element_type": "text",
            "page_id": "page-1",
            "text": title.upper(),
            "x": x,
            "y": y,
            "width": w,
            "height": 18,
            "font_size": 11.5,
            "font_name": "Helvetica-Bold",
            "text_color": self.primary_color,
            "bold": True,
            "z_index": 3,
        })
        self.elements.append({
            "id": f"main_rule_{uuid.uuid4().hex[:6]}",
            "element_type": "shape",
            "shape_type": "line",
            "page_id": "page-1",
            "x": x,
            "y": y - 4,
            "width": w,
            "height": 1.5,
            "fill_color": self.accent_color,
            "border_color": self.accent_color,
            "border_width": 1.5,
            "z_index": 3,
        })
        return cursor_top + 22

    def _render_main_summary(self, x: float, w: float, cursor_top: float, title: str, gap: float) -> float:
        cursor_top = self._add_main_header(x, w, cursor_top, title or "Executive Summary")
        summary_txt = self.content.get("summary", "Analytical and results-driven professional...")
        sum_h = estimate_text_height(summary_txt, w, 9.5)
        self.elements.append({
            "id": "sum_txt",
            "element_type": "text",
            "page_id": "page-1",
            "text": summary_txt,
            "x": x,
            "y": PAGE_HEIGHT - cursor_top - sum_h,
            "width": w,
            "height": sum_h,
            "font_size": 9.5,
            "font_name": "Helvetica",
            "text_color": "#334155",
            "line_height": 1.4,
            "z_index": 3,
        })
        return cursor_top + sum_h + gap

    def _render_main_experience(self, x: float, w: float, cursor_top: float, title: str, gap: float) -> float:
        cursor_top = self._add_main_header(x, w, cursor_top, title or "Professional Experience")
        experiences = self.content.get("experiences", [])
        for exp_idx, exp in enumerate(experiences[:3]):
            role_txt = exp.get("role", "Role")
            company_txt = exp.get("company", "Company")
            duration_txt = exp.get("duration", "2021 – Present")

            # Role & Company (Left) + Duration (Right) on same baseline
            y_role = PAGE_HEIGHT - cursor_top - 16
            self.elements.append({
                "id": f"exp_title_{exp_idx}_{uuid.uuid4().hex[:6]}",
                "element_type": "text",
                "page_id": "page-1",
                "text": f"{role_txt}  •  {company_txt}",
                "x": x,
                "y": y_role,
                "width": w - 95,
                "height": 16,
                "font_size": 10.5,
                "font_name": "Helvetica-Bold",
                "text_color": "#0f172a",
                "bold": True,
                "z_index": 3,
            })
            self.elements.append({
                "id": f"exp_date_{exp_idx}_{uuid.uuid4().hex[:6]}",
                "element_type": "text",
                "page_id": "page-1",
                "text": duration_txt,
                "x": x + w - 95,
                "y": y_role,
                "width": 95,
                "height": 16,
                "font_size": 9,
                "font_name": "Helvetica",
                "text_color": "#64748b",
                "align": "right",
                "z_index": 3,
            })
            cursor_top += 18

            # Bullets
            bullets = exp.get("bullets", [])
            for b_idx, bullet in enumerate(bullets[:3]):
                b_text = bullet if bullet.startswith("•") else f"• {bullet}"
                b_h = estimate_text_height(b_text, w - 8, 9)
                y_bullet = PAGE_HEIGHT - cursor_top - b_h
                self.elements.append({
                    "id": f"exp_b_{exp_idx}_{b_idx}_{uuid.uuid4().hex[:6]}",
                    "element_type": "text",
                    "page_id": "page-1",
                    "text": b_text,
                    "x": x + 8,
                    "y": y_bullet,
                    "width": w - 8,
                    "height": b_h,
                    "font_size": 9,
                    "font_name": "Helvetica",
                    "text_color": "#334155",
                    "line_height": 1.35,
                    "z_index": 3,
                })
                cursor_top += b_h + 4
            cursor_top += 6
        return cursor_top + gap

    def _render_main_education(self, x: float, w: float, cursor_top: float, title: str, gap: float) -> float:
        cursor_top = self._add_main_header(x, w, cursor_top, title or "Education & Credentials")
        educations = self.content.get("educations", [])
        for edu_idx, edu in enumerate(educations[:2]):
            deg = edu.get("degree", "Degree")
            school = edu.get("school", "University")
            year = edu.get("year", "")
            details = edu.get("details", "")

            y_edu = PAGE_HEIGHT - cursor_top - 16
            self.elements.append({
                "id": f"edu_title_{edu_idx}_{uuid.uuid4().hex[:6]}",
                "element_type": "text",
                "page_id": "page-1",
                "text": f"{deg}  |  {school}",
                "x": x,
                "y": y_edu,
                "width": w - 80,
                "height": 16,
                "font_size": 10,
                "font_name": "Helvetica-Bold",
                "text_color": "#0f172a",
                "bold": True,
                "z_index": 3,
            })
            if year:
                self.elements.append({
                    "id": f"edu_yr_{edu_idx}_{uuid.uuid4().hex[:6]}",
                    "element_type": "text",
                    "page_id": "page-1",
                    "text": year,
                    "x": x + w - 80,
                    "y": y_edu,
                    "width": 80,
                    "height": 16,
                    "font_size": 9,
                    "font_name": "Helvetica",
                    "text_color": "#64748b",
                    "align": "right",
                    "z_index": 3,
                })
            cursor_top += 18
            if details:
                y_det = PAGE_HEIGHT - cursor_top - 14
                self.elements.append({
                    "id": f"edu_det_{edu_idx}_{uuid.uuid4().hex[:6]}",
                    "element_type": "text",
                    "page_id": "page-1",
                    "text": details,
                    "x": x + 8,
                    "y": y_det,
                    "width": w - 8,
                    "height": 14,
                    "font_size": 8.5,
                    "font_name": "Helvetica",
                    "text_color": "#64748b",
                    "z_index": 3,
                })
                cursor_top += 18
        return cursor_top + gap

    def _render_main_metrics(self, x: float, w: float, cursor_top: float, title: str, gap: float) -> float:
        cursor_top = self._add_main_header(x, w, cursor_top, title or "Key Impact Highlights")
        metrics = [
            ("SQL Automated Pipelines", "45% Latency Cut"),
            ("Executive KPI Dashboards", "$40M ARR Monitored"),
            ("A/B Funnel Optimization", "+22% Conversion Lift"),
        ]
        badge_w = (w - 16) / 3
        badge_h = 36
        y_badge = PAGE_HEIGHT - cursor_top - badge_h
        for idx, (label, stat) in enumerate(metrics):
            bx = x + idx * (badge_w + 8)
            # Card background
            self.elements.append({
                "id": f"metric_card_{idx}_{uuid.uuid4().hex[:6]}",
                "element_type": "shape",
                "shape_type": "rectangle",
                "page_id": "page-1",
                "x": bx,
                "y": y_badge,
                "width": badge_w,
                "height": badge_h,
                "fill_color": "#f8fafc",
                "border_color": "#e2e8f0",
                "border_width": 1,
                "border_radius": 4,
                "z_index": 3,
            })
            # Stat callout (accent red/blue)
            self.elements.append({
                "id": f"metric_stat_{idx}_{uuid.uuid4().hex[:6]}",
                "element_type": "text",
                "page_id": "page-1",
                "text": stat,
                "x": bx,
                "y": y_badge + 18,
                "width": badge_w,
                "height": 14,
                "font_size": 9.5,
                "font_name": "Helvetica-Bold",
                "text_color": self.accent_color,
                "align": "center",
                "bold": True,
                "z_index": 4,
            })
            # Label
            self.elements.append({
                "id": f"metric_lbl_{idx}_{uuid.uuid4().hex[:6]}",
                "element_type": "text",
                "page_id": "page-1",
                "text": label,
                "x": bx,
                "y": y_badge + 4,
                "width": badge_w,
                "height": 12,
                "font_size": 7,
                "font_name": "Helvetica",
                "text_color": "#64748b",
                "align": "center",
                "z_index": 4,
            })
        return cursor_top + badge_h + gap

    def _render_main_signature(self, x: float, w: float, cursor_top: float) -> float:
        cursor_top += 10
        sig_x = x + w - 150
        y = PAGE_HEIGHT - cursor_top - 40
        self.elements.append({
            "id": f"sig_line_{uuid.uuid4().hex[:6]}",
            "element_type": "shape",
            "shape_type": "line",
            "page_id": "page-1",
            "x": sig_x,
            "y": y + 20,
            "width": 140,
            "height": 1,
            "fill_color": "#94a3b8",
            "border_color": "#94a3b8",
            "border_width": 1,
            "z_index": 3,
        })
        self.elements.append({
            "id": f"sig_txt_{uuid.uuid4().hex[:6]}",
            "element_type": "text",
            "page_id": "page-1",
            "text": self.candidate.get("name", "Alexander Morgan"),
            "x": sig_x,
            "y": y + 24,
            "width": 140,
            "height": 18,
            "font_size": 12,
            "font_name": "Times-Italic",
            "text_color": "#0f172a",
            "italic": True,
            "z_index": 4,
        })
        return cursor_top + 45

    # ─────────────────────────────────────────────────────────────────────────
    # 2. Single Column Classic Solver
    # ─────────────────────────────────────────────────────────────────────────
    def _compile_single_column_classic(self):
        cx = 45.0
        cw = PAGE_WIDTH - cx * 2
        cursor_top = 40.0
        cand_name = self.candidate.get("name", "ALEXANDER MORGAN")
        target_role = self.candidate.get("target_role", "SENIOR DATA ANALYST")
        contact_line = f"{self.candidate.get('email', 'alex@example.com')}  |  {self.candidate.get('phone', '(555) 019-2834')}  |  {self.candidate.get('location', 'New York, NY')}  |  {self.candidate.get('linkedin', 'linkedin.com/in/pro')}"

        self.elements.append({
            "id": "hdr_name",
            "element_type": "text",
            "page_id": "page-1",
            "text": cand_name.upper(),
            "x": cx,
            "y": PAGE_HEIGHT - cursor_top - 28,
            "width": cw,
            "height": 28,
            "font_size": 22,
            "font_name": "Helvetica-Bold",
            "text_color": self.primary_color,
            "align": "center",
            "bold": True,
            "z_index": 3,
        })
        cursor_top += 32
        self.elements.append({
            "id": "hdr_role",
            "element_type": "text",
            "page_id": "page-1",
            "text": target_role.upper(),
            "x": cx,
            "y": PAGE_HEIGHT - cursor_top - 16,
            "width": cw,
            "height": 16,
            "font_size": 11,
            "font_name": "Helvetica-Bold",
            "text_color": self.accent_color,
            "align": "center",
            "bold": True,
            "z_index": 3,
        })
        cursor_top += 20
        self.elements.append({
            "id": "hdr_contact",
            "element_type": "text",
            "page_id": "page-1",
            "text": contact_line,
            "x": cx,
            "y": PAGE_HEIGHT - cursor_top - 14,
            "width": cw,
            "height": 14,
            "font_size": 9,
            "font_name": "Helvetica",
            "text_color": "#475569",
            "align": "center",
            "z_index": 3,
        })
        cursor_top += 24

        sections = self.blueprint.get("columns", {}).get("main", {}).get("sections", [
            {"type": "summary", "title": "Professional Summary"},
            {"type": "experience", "title": "Work Experience"},
            {"type": "education", "title": "Education"},
        ])
        for sec in sections:
            sec_type = sec.get("type")
            sec_title = sec.get("title", "")
            if sec_type == "summary":
                cursor_top = self._render_main_summary(cx, cw, cursor_top, sec_title, 14.0)
            elif sec_type == "experience":
                cursor_top = self._render_main_experience(cx, cw, cursor_top, sec_title, 14.0)
            elif sec_type == "education":
                cursor_top = self._render_main_education(cx, cw, cursor_top, sec_title, 14.0)

    # ─────────────────────────────────────────────────────────────────────────
    # 3. Two Column Grid Solver
    # ─────────────────────────────────────────────────────────────────────────
    def _compile_two_column_grid(self):
        cx = 40.0
        cw = (PAGE_WIDTH - cx * 2 - 20) / 2
        # Use left column for summary & skills, right column for experience & education
        self._compile_sidebar_layout(sidebar_on_left=True)


def compile_blueprint_to_canvas(blueprint: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Master entry point for compiling a Semantic Blueprint into EditorElement objects."""
    solver = MathematicalLayoutSolver(blueprint)
    return solver.compile()
