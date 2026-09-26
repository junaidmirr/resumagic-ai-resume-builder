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
        self.design_spec = blueprint.get("design_spec") or {}
        self.archetype = self.design_spec.get("layout_type") or blueprint.get("archetype") or blueprint.get("layout_style") or "two_column_left_sidebar"
        self.theme = self.design_spec.get("palette") or blueprint.get("theme") or blueprint.get("color_palette") or {}
        self.primary_color = self.theme.get("primary", "#0F172A")
        self.secondary_color = self.theme.get("secondary", "#475569")
        self.accent_color = self.theme.get("accent", "#2563EB")
        self.bg_color = self.theme.get("background", "#FFFFFF")
        self.text_color = self.theme.get("text", "#1E293B")
        self.muted_color = self.theme.get("muted", "#64748B")
        self.card_bg = self.theme.get("card_bg", "#F8FAFC")
        self.font_family = self.theme.get("font_family", "Helvetica")
        
        self.content = blueprint.get("content", {})
        self.candidate = self.content.get("candidate", {})
        self.elements: List[Dict[str, Any]] = []

    def compile(self) -> List[Dict[str, Any]]:
        self.elements = []
        arch = (self.archetype or "").lower()
        if "cyberpunk" in arch or "neon" in arch or "synth" in arch:
            self._compile_cyberpunk_layout()
        elif "terminal" in arch or "retro" in arch or "hacker" in arch or "cli" in arch or "console" in arch:
            self._compile_retro_terminal_layout()
        else:
            self._compile_dynamic_blueprint()
        return self.elements

    # ─────────────────────────────────────────────────────────────────────────
    # DYNAMIC GENERATIVE BLUEPRINT COMPILER
    # ─────────────────────────────────────────────────────────────────────────
    def _compile_dynamic_blueprint(self):
        spec = self.design_spec or {}
        arch = (self.archetype or "two_column_left_sidebar").lower()

        # Resolve Grid Type
        if "single" in arch or "classic" in arch or "monarch" in arch or "harvard" in arch or spec.get("layout_type") == "single_column":
            grid_type = "single_column"
        elif "right" in arch or spec.get("layout_type") == "two_column_right_sidebar":
            grid_type = "two_column_right_sidebar"
        elif "grid" in arch or "balanced" in arch or "split" in arch or "minimal" in arch or spec.get("layout_type") == "two_column_grid":
            grid_type = "two_column_grid"
        elif "banner" in arch or spec.get("layout_type") == "top_banner_split":
            grid_type = "top_banner_split"
        else:
            grid_type = spec.get("layout_type", "two_column_left_sidebar")

        # Resolve Header Style
        header_style = spec.get("header_style")
        if not header_style:
            if grid_type == "single_column":
                header_style = "centered_classic"
            elif grid_type == "top_banner_split":
                header_style = "banner_bold"
            elif grid_type == "two_column_grid":
                header_style = "minimal_left"
            else:
                header_style = "modern_split"

        # Resolve Component Styles
        heading_dec = spec.get("heading_decoration")
        if not heading_dec:
            heading_dec = "underline_rule" if grid_type == "single_column" else "left_accent_bar"

        skills_style = spec.get("skills_style")
        if not skills_style:
            skills_style = "pill_tags" if grid_type in ["two_column_grid", "single_column"] else "progress_bars"

        exp_style = spec.get("experience_style")
        if not exp_style:
            exp_style = "timeline_track" if grid_type != "single_column" else "clean_split"

        sidebar_has_bg = spec.get("sidebar_has_bg", True if "sidebar" in grid_type and "grid" not in grid_type else False)
        sidebar_ratio = float(spec.get("sidebar_width_ratio", 0.32 if "sidebar" in grid_type else 0.50))

        # Base Canvas Background
        if self.bg_color and self.bg_color.upper() != "#FFFFFF":
            self.elements.append({
                "id": "bg_canvas",
                "element_type": "shape",
                "shape_type": "rectangle",
                "page_id": "page-1",
                "x": 0,
                "y": 0,
                "width": PAGE_WIDTH,
                "height": PAGE_HEIGHT,
                "fill_color": self.bg_color,
                "z_index": 0,
            })

        # Render Header
        cursor_top = 35.0
        cursor_top = self._render_dynamic_header(cursor_top, header_style)

        # Distribute Sections into Zones
        primary_secs, secondary_secs = self._resolve_sections_for_zones(grid_type)

        page_margin_x = 42.0
        total_w = PAGE_WIDTH - 2 * page_margin_x
        gutter = 22.0

        if grid_type == "single_column":
            col_x = page_margin_x
            col_w = total_w
            cur = cursor_top
            for sec in (primary_secs + secondary_secs):
                cur = self._render_dynamic_section(
                    sec.get("type", "summary"),
                    sec.get("title", ""),
                    col_x, col_w, cur,
                    heading_dec, skills_style, exp_style, gap=14.0
                )
        elif grid_type == "two_column_left_sidebar":
            sidebar_w = round(total_w * sidebar_ratio)
            main_w = total_w - sidebar_w - gutter
            sb_x = page_margin_x
            main_x = page_margin_x + sidebar_w + gutter

            if sidebar_has_bg:
                sb_bg_w = sb_x + sidebar_w + (gutter / 2)
                self.elements.append({
                    "id": f"bg_sidebar_{uuid.uuid4().hex[:6]}",
                    "element_type": "shape",
                    "shape_type": "rectangle",
                    "page_id": "page-1",
                    "x": 0,
                    "y": 0,
                    "width": sb_bg_w,
                    "height": PAGE_HEIGHT - (cursor_top if header_style in ["banner_bold", "modern_split"] else 0),
                    "fill_color": self.theme.get("sidebar_bg", self.theme.get("card_bg", "#F8FAFC")),
                    "z_index": 1,
                })

            cur_sb = cursor_top
            for sec in secondary_secs:
                cur_sb = self._render_dynamic_section(
                    sec.get("type"), sec.get("title", ""),
                    sb_x, sidebar_w, cur_sb,
                    heading_dec, skills_style, exp_style, gap=12.0
                )

            cur_main = cursor_top
            for sec in primary_secs:
                cur_main = self._render_dynamic_section(
                    sec.get("type"), sec.get("title", ""),
                    main_x, main_w, cur_main,
                    heading_dec, skills_style, exp_style, gap=14.0
                )

        elif grid_type == "two_column_right_sidebar":
            sidebar_w = round(total_w * sidebar_ratio)
            main_w = total_w - sidebar_w - gutter
            main_x = page_margin_x
            sb_x = page_margin_x + main_w + gutter

            if sidebar_has_bg:
                self.elements.append({
                    "id": f"bg_sidebar_{uuid.uuid4().hex[:6]}",
                    "element_type": "shape",
                    "shape_type": "rectangle",
                    "page_id": "page-1",
                    "x": sb_x - (gutter / 2),
                    "y": 0,
                    "width": PAGE_WIDTH - (sb_x - gutter / 2),
                    "height": PAGE_HEIGHT - (cursor_top if header_style in ["banner_bold", "modern_split"] else 0),
                    "fill_color": self.theme.get("sidebar_bg", self.theme.get("card_bg", "#F8FAFC")),
                    "z_index": 1,
                })

            cur_main = cursor_top
            for sec in primary_secs:
                cur_main = self._render_dynamic_section(
                    sec.get("type"), sec.get("title", ""),
                    main_x, main_w, cur_main,
                    heading_dec, skills_style, exp_style, gap=14.0
                )

            cur_sb = cursor_top
            for sec in secondary_secs:
                cur_sb = self._render_dynamic_section(
                    sec.get("type"), sec.get("title", ""),
                    sb_x, sidebar_w, cur_sb,
                    heading_dec, skills_style, exp_style, gap=12.0
                )

        elif grid_type in ["two_column_grid", "balanced_two_column", "top_banner_split"]:
            col_w = (total_w - gutter) / 2
            col1_x = page_margin_x
            col2_x = page_margin_x + col_w + gutter

            cur_col1 = cursor_top
            for sec in primary_secs:
                cur_col1 = self._render_dynamic_section(
                    sec.get("type"), sec.get("title", ""),
                    col1_x, col_w, cur_col1,
                    heading_dec, skills_style, exp_style, gap=14.0
                )

            cur_col2 = cursor_top
            for sec in secondary_secs:
                cur_col2 = self._render_dynamic_section(
                    sec.get("type"), sec.get("title", ""),
                    col2_x, col_w, cur_col2,
                    heading_dec, skills_style, exp_style, gap=14.0
                )

    def _render_dynamic_header(self, cursor_top: float, header_style: str) -> float:
        cand_name = self.candidate.get("name", "ALEXANDER MORGAN").upper()
        target_role = self.candidate.get("target_role", "SENIOR PROFESSIONAL").upper()
        email = self.candidate.get("email", "candidate@resumagic.ai")
        phone = self.candidate.get("phone", "+1 (555) 019-2834")
        loc = self.candidate.get("location", "San Francisco, CA")
        linkedin = self.candidate.get("linkedin", "linkedin.com/in/profile")

        if header_style == "centered_classic":
            self.elements.append({
                "id": "hdr_name",
                "element_type": "text",
                "page_id": "page-1",
                "text": cand_name,
                "x": 42,
                "y": PAGE_HEIGHT - cursor_top - 26,
                "width": 528,
                "height": 26,
                "font_size": 22,
                "font_name": "Helvetica-Bold",
                "text_color": self.primary_color,
                "align": "center",
                "bold": True,
                "z_index": 3,
            })
            cursor_top += 28

            self.elements.append({
                "id": "hdr_role",
                "element_type": "text",
                "page_id": "page-1",
                "text": target_role,
                "x": 42,
                "y": PAGE_HEIGHT - cursor_top - 16,
                "width": 528,
                "height": 16,
                "font_size": 11,
                "font_name": "Helvetica-Bold",
                "text_color": self.accent_color,
                "align": "center",
                "bold": True,
                "z_index": 3,
            })
            cursor_top += 18

            contact_str = f"{email}   •   {phone}   •   {loc}   •   {linkedin}"
            self.elements.append({
                "id": "hdr_contact",
                "element_type": "text",
                "page_id": "page-1",
                "text": contact_str,
                "x": 42,
                "y": PAGE_HEIGHT - cursor_top - 14,
                "width": 528,
                "height": 14,
                "font_size": 8.5,
                "font_name": "Helvetica",
                "text_color": self.muted_color,
                "align": "center",
                "z_index": 3,
            })
            cursor_top += 18

            self.elements.append({
                "id": f"hdr_rule_{uuid.uuid4().hex[:6]}",
                "element_type": "shape",
                "shape_type": "line",
                "page_id": "page-1",
                "x": 42,
                "y": PAGE_HEIGHT - cursor_top - 2,
                "x2": 570,
                "y2": PAGE_HEIGHT - cursor_top - 2,
                "width": 528,
                "height": 1,
                "fill_color": self.accent_color,
                "border_color": self.accent_color,
                "border_width": 1,
                "z_index": 3,
            })
            return cursor_top + 14

        elif header_style == "banner_bold":
            banner_h = 88.0
            self.elements.append({
                "id": "hdr_banner_bg",
                "element_type": "shape",
                "shape_type": "rectangle",
                "page_id": "page-1",
                "x": 0,
                "y": PAGE_HEIGHT - banner_h,
                "width": PAGE_WIDTH,
                "height": banner_h,
                "fill_color": self.primary_color,
                "z_index": 1,
            })

            self.elements.append({
                "id": "hdr_name",
                "element_type": "text",
                "page_id": "page-1",
                "text": cand_name,
                "x": 42,
                "y": PAGE_HEIGHT - 38,
                "width": 380,
                "height": 24,
                "font_size": 20,
                "font_name": "Helvetica-Bold",
                "text_color": "#FFFFFF",
                "bold": True,
                "z_index": 3,
            })

            self.elements.append({
                "id": "hdr_role",
                "element_type": "text",
                "page_id": "page-1",
                "text": target_role,
                "x": 42,
                "y": PAGE_HEIGHT - 60,
                "width": 380,
                "height": 16,
                "font_size": 10.5,
                "font_name": "Helvetica-Bold",
                "text_color": self.accent_color if self.accent_color != self.primary_color else "#93C5FD",
                "bold": True,
                "z_index": 3,
            })

            contact_items = [email, phone, loc]
            c_y = PAGE_HEIGHT - 32
            for item in contact_items:
                self.elements.append({
                    "id": f"hdr_c_{uuid.uuid4().hex[:6]}",
                    "element_type": "text",
                    "page_id": "page-1",
                    "text": item,
                    "x": 420,
                    "y": c_y,
                    "width": 150,
                    "height": 13,
                    "font_size": 8.5,
                    "font_name": "Helvetica",
                    "text_color": "#F1F5F9",
                    "align": "right",
                    "z_index": 3,
                })
                c_y -= 16

            return banner_h + 20

        elif header_style == "minimal_left":
            bar_h = 44.0
            self.elements.append({
                "id": "hdr_accent_bar",
                "element_type": "shape",
                "shape_type": "rectangle",
                "page_id": "page-1",
                "x": 42,
                "y": PAGE_HEIGHT - cursor_top - bar_h,
                "width": 4,
                "height": bar_h,
                "border_radius": 2,
                "fill_color": self.accent_color,
                "z_index": 3,
            })

            self.elements.append({
                "id": "hdr_name",
                "element_type": "text",
                "page_id": "page-1",
                "text": cand_name,
                "x": 54,
                "y": PAGE_HEIGHT - cursor_top - 24,
                "width": 360,
                "height": 24,
                "font_size": 20,
                "font_name": "Helvetica-Bold",
                "text_color": self.primary_color,
                "bold": True,
                "z_index": 3,
            })

            self.elements.append({
                "id": "hdr_role",
                "element_type": "text",
                "page_id": "page-1",
                "text": target_role,
                "x": 54,
                "y": PAGE_HEIGHT - cursor_top - 42,
                "width": 360,
                "height": 16,
                "font_size": 10.5,
                "font_name": "Helvetica-Bold",
                "text_color": self.secondary_color,
                "bold": True,
                "z_index": 3,
            })

            c_y = PAGE_HEIGHT - cursor_top - 18
            for item in [email, phone, loc]:
                self.elements.append({
                    "id": f"hdr_c_{uuid.uuid4().hex[:6]}",
                    "element_type": "text",
                    "page_id": "page-1",
                    "text": item,
                    "x": 420,
                    "y": c_y,
                    "width": 150,
                    "height": 13,
                    "font_size": 8.5,
                    "font_name": "Helvetica",
                    "text_color": self.muted_color,
                    "align": "right",
                    "z_index": 3,
                })
                c_y -= 14

            return cursor_top + bar_h + 20

        else: # modern_split
            self.elements.append({
                "id": "hdr_name",
                "element_type": "text",
                "page_id": "page-1",
                "text": cand_name,
                "x": 42,
                "y": PAGE_HEIGHT - cursor_top - 24,
                "width": 350,
                "height": 24,
                "font_size": 21,
                "font_name": "Helvetica-Bold",
                "text_color": self.primary_color,
                "bold": True,
                "z_index": 3,
            })
            self.elements.append({
                "id": "hdr_role",
                "element_type": "text",
                "page_id": "page-1",
                "text": target_role,
                "x": 42,
                "y": PAGE_HEIGHT - cursor_top - 42,
                "width": 350,
                "height": 16,
                "font_size": 10.5,
                "font_name": "Helvetica-Bold",
                "text_color": self.accent_color,
                "bold": True,
                "z_index": 3,
            })

            contacts = [
                ("Mail", email),
                ("Phone", phone),
                ("MapPin", loc),
            ]
            c_y = PAGE_HEIGHT - cursor_top - 14
            for icon, val in contacts:
                self.elements.append({
                    "id": f"hdr_ic_{uuid.uuid4().hex[:6]}",
                    "element_type": "image",
                    "page_id": "page-1",
                    "x": 420,
                    "y": c_y,
                    "width": 10,
                    "height": 10,
                    "is_icon": True,
                    "icon_name": icon,
                    "z_index": 3,
                })
                self.elements.append({
                    "id": f"hdr_c_{uuid.uuid4().hex[:6]}",
                    "element_type": "text",
                    "page_id": "page-1",
                    "text": val,
                    "x": 434,
                    "y": c_y - 1,
                    "width": 136,
                    "height": 13,
                    "font_size": 8.5,
                    "font_name": "Helvetica",
                    "text_color": self.muted_color,
                    "z_index": 3,
                })
                c_y -= 15

            cursor_top += 52
            self.elements.append({
                "id": f"hdr_div_{uuid.uuid4().hex[:6]}",
                "element_type": "shape",
                "shape_type": "line",
                "page_id": "page-1",
                "x": 42,
                "y": PAGE_HEIGHT - cursor_top,
                "x2": 570,
                "y2": PAGE_HEIGHT - cursor_top,
                "width": 528,
                "height": 1,
                "fill_color": self.theme.get("border", "#E2E8F0"),
                "border_color": self.theme.get("border", "#E2E8F0"),
                "border_width": 1,
                "z_index": 2,
            })
            return cursor_top + 16

    def _render_dynamic_heading(self, x: float, w: float, cursor_top: float, title: str, decoration: str) -> float:
        cursor_top += 10
        y_text = PAGE_HEIGHT - cursor_top - 16
        clean_title = (title or "").upper()

        if decoration == "left_accent_bar":
            bar_h = 14.0
            self.elements.append({
                "id": f"h_bar_{uuid.uuid4().hex[:6]}",
                "element_type": "shape",
                "shape_type": "rectangle",
                "page_id": "page-1",
                "x": x,
                "y": y_text + 1,
                "width": 3.5,
                "height": bar_h,
                "border_radius": 1.5,
                "fill_color": self.accent_color,
                "z_index": 3,
            })
            self.elements.append({
                "id": f"h_txt_{uuid.uuid4().hex[:6]}",
                "element_type": "text",
                "page_id": "page-1",
                "text": clean_title,
                "x": x + 9,
                "y": y_text,
                "width": w - 9,
                "height": 16,
                "font_size": 10.5,
                "font_name": "Helvetica-Bold",
                "text_color": self.primary_color,
                "bold": True,
                "z_index": 3,
            })
            return cursor_top + 22

        elif decoration == "pill_badge":
            badge_w = min(w, max(60, len(clean_title) * 6.5 + 20))
            self.elements.append({
                "id": f"h_pill_{uuid.uuid4().hex[:6]}",
                "element_type": "shape",
                "shape_type": "rectangle",
                "page_id": "page-1",
                "x": x,
                "y": y_text - 2,
                "width": badge_w,
                "height": 20,
                "border_radius": 4,
                "fill_color": self.primary_color,
                "z_index": 2,
            })
            self.elements.append({
                "id": f"h_txt_{uuid.uuid4().hex[:6]}",
                "element_type": "text",
                "page_id": "page-1",
                "text": clean_title,
                "x": x,
                "y": y_text + 1,
                "width": badge_w,
                "height": 14,
                "font_size": 9.5,
                "font_name": "Helvetica-Bold",
                "text_color": "#FFFFFF",
                "align": "center",
                "bold": True,
                "z_index": 3,
            })
            return cursor_top + 26

        elif decoration == "boxed_header":
            self.elements.append({
                "id": f"h_box_{uuid.uuid4().hex[:6]}",
                "element_type": "shape",
                "shape_type": "rectangle",
                "page_id": "page-1",
                "x": x,
                "y": y_text - 3,
                "width": w,
                "height": 22,
                "border_radius": 3,
                "fill_color": self.theme.get("card_bg", "#F1F5F9"),
                "border_color": self.theme.get("border", "#E2E8F0"),
                "border_width": 1,
                "z_index": 2,
            })
            self.elements.append({
                "id": f"h_txt_{uuid.uuid4().hex[:6]}",
                "element_type": "text",
                "page_id": "page-1",
                "text": clean_title,
                "x": x + 10,
                "y": y_text + 1,
                "width": w - 20,
                "height": 15,
                "font_size": 10,
                "font_name": "Helvetica-Bold",
                "text_color": self.primary_color,
                "bold": True,
                "z_index": 3,
            })
            return cursor_top + 28

        elif decoration == "numbered_minimal":
            self.elements.append({
                "id": f"h_txt_{uuid.uuid4().hex[:6]}",
                "element_type": "text",
                "page_id": "page-1",
                "text": clean_title,
                "x": x,
                "y": y_text,
                "width": w,
                "height": 16,
                "font_size": 10.5,
                "font_name": "Helvetica-Bold",
                "text_color": self.primary_color,
                "bold": True,
                "z_index": 3,
            })
            return cursor_top + 20

        else: # underline_rule
            self.elements.append({
                "id": f"h_txt_{uuid.uuid4().hex[:6]}",
                "element_type": "text",
                "page_id": "page-1",
                "text": clean_title,
                "x": x,
                "y": y_text,
                "width": w,
                "height": 16,
                "font_size": 10.5,
                "font_name": "Helvetica-Bold",
                "text_color": self.primary_color,
                "bold": True,
                "z_index": 3,
            })
            self.elements.append({
                "id": f"h_rule_{uuid.uuid4().hex[:6]}",
                "element_type": "shape",
                "shape_type": "line",
                "page_id": "page-1",
                "x": x,
                "y": y_text - 4,
                "x2": x + w,
                "y2": y_text - 4,
                "width": w,
                "height": 1.5,
                "fill_color": self.accent_color,
                "border_color": self.accent_color,
                "border_width": 1.5,
                "z_index": 3,
            })
            return cursor_top + 26

    def _render_dynamic_experience(self, x: float, w: float, cursor_top: float, title: str, decoration: str, style: str, gap: float) -> float:
        cursor_top = self._render_dynamic_heading(x, w, cursor_top, title or "Professional Experience", decoration)
        experiences = self.content.get("experiences", [])
        if not experiences:
            return cursor_top

        is_timeline = (style == "timeline_track")
        content_x = x + 16 if is_timeline else x
        content_w = w - 16 if is_timeline else w

        node_positions = []

        for exp_idx, exp in enumerate(experiences[:3]):
            role_txt = exp.get("role", "Role")
            company_txt = exp.get("company", "Company")
            duration_txt = exp.get("duration", "2021 – Present")
            bullets = exp.get("bullets", [])

            y_role = PAGE_HEIGHT - cursor_top - 16

            if is_timeline:
                node_positions.append(y_role + 7)
                self.elements.append({
                    "id": f"dot_{exp_idx}_{uuid.uuid4().hex[:6]}",
                    "element_type": "shape",
                    "shape_type": "circle",
                    "page_id": "page-1",
                    "x": x + 5,
                    "y": y_role + 7,
                    "width": 6,
                    "height": 6,
                    "fill_color": self.accent_color,
                    "z_index": 4,
                })

            if style == "card_blocks":
                b_lines = sum(estimate_text_lines(b, content_w - 20, 8.5) for b in bullets[:3])
                card_h = 24 + b_lines * 12 + 10
                self.elements.append({
                    "id": f"card_{exp_idx}_{uuid.uuid4().hex[:6]}",
                    "element_type": "shape",
                    "shape_type": "rectangle",
                    "page_id": "page-1",
                    "x": content_x,
                    "y": PAGE_HEIGHT - cursor_top - card_h,
                    "width": content_w,
                    "height": card_h,
                    "border_radius": 4,
                    "fill_color": self.theme.get("card_bg", "#F8FAFC"),
                    "border_color": self.theme.get("border", "#E2E8F0"),
                    "border_width": 1,
                    "z_index": 2,
                })
                card_in_x = content_x + 8
                card_in_w = content_w - 16
            else:
                card_in_x = content_x
                card_in_w = content_w

            date_w = 90.0
            title_w = max(100.0, card_in_w - date_w - 5.0)

            self.elements.append({
                "id": f"exp_t_{exp_idx}_{uuid.uuid4().hex[:6]}",
                "element_type": "text",
                "page_id": "page-1",
                "text": f"{role_txt}  •  {company_txt}",
                "x": card_in_x,
                "y": y_role,
                "width": title_w,
                "height": 16,
                "font_size": 9.5,
                "font_name": "Helvetica-Bold",
                "text_color": self.primary_color,
                "bold": True,
                "z_index": 3,
            })

            self.elements.append({
                "id": f"exp_d_{exp_idx}_{uuid.uuid4().hex[:6]}",
                "element_type": "text",
                "page_id": "page-1",
                "text": duration_txt,
                "x": card_in_x + card_in_w - date_w,
                "y": y_role,
                "width": date_w,
                "height": 16,
                "font_size": 8.5,
                "font_name": "Helvetica-Bold",
                "text_color": self.secondary_color,
                "align": "right",
                "z_index": 3,
            })
            cursor_top += 18

            for b_idx, bullet in enumerate(bullets[:3]):
                bullet_str = f"•  {bullet.strip()}"
                bh = estimate_text_height(bullet_str, card_in_w, 8.5, 1.35)
                self.elements.append({
                    "id": f"exp_b_{exp_idx}_{b_idx}_{uuid.uuid4().hex[:6]}",
                    "element_type": "text",
                    "page_id": "page-1",
                    "text": bullet_str,
                    "x": card_in_x + 6,
                    "y": PAGE_HEIGHT - cursor_top - bh,
                    "width": card_in_w - 6,
                    "height": bh,
                    "font_size": 8.5,
                    "font_name": "Helvetica",
                    "text_color": self.text_color,
                    "line_height": 1.35,
                    "z_index": 3,
                })
                cursor_top += bh + 3

            cursor_top += 8

        if is_timeline and len(node_positions) >= 2:
            top_y = max(node_positions)
            bot_y = min(node_positions)
            self.elements.append({
                "id": f"timeline_line_{uuid.uuid4().hex[:6]}",
                "element_type": "shape",
                "shape_type": "line",
                "page_id": "page-1",
                "x": x + 5,
                "y": bot_y,
                "x2": x + 5,
                "y2": top_y,
                "width": 1.5,
                "height": abs(top_y - bot_y),
                "fill_color": self.theme.get("border", "#CBD5E1"),
                "border_color": self.theme.get("border", "#CBD5E1"),
                "border_width": 1.5,
                "z_index": 2,
            })

        return cursor_top + gap

    def _render_dynamic_skills(self, x: float, w: float, cursor_top: float, title: str, decoration: str, style: str, gap: float) -> float:
        cursor_top = self._render_dynamic_heading(x, w, cursor_top, title or "Technical Skills", decoration)
        skills = self.content.get("skills", [])
        if not skills:
            return cursor_top

        if style == "pill_tags":
            line_x = x
            line_y = cursor_top
            for s in skills[:10]:
                name = s.get("name", "") if isinstance(s, dict) else str(s)
                tag_w = min(w, max(42, len(name) * 5.2 + 16))
                if line_x + tag_w > x + w and line_x > x:
                    line_x = x
                    line_y += 24

                y_pos = PAGE_HEIGHT - line_y - 18
                self.elements.append({
                    "id": f"tag_bg_{uuid.uuid4().hex[:6]}",
                    "element_type": "shape",
                    "shape_type": "rectangle",
                    "page_id": "page-1",
                    "x": line_x,
                    "y": y_pos,
                    "width": tag_w,
                    "height": 18,
                    "border_radius": 4,
                    "fill_color": self.theme.get("card_bg", "#F1F5F9"),
                    "border_color": self.theme.get("border", "#CBD5E1"),
                    "border_width": 1,
                    "z_index": 2,
                })
                self.elements.append({
                    "id": f"tag_txt_{uuid.uuid4().hex[:6]}",
                    "element_type": "text",
                    "page_id": "page-1",
                    "text": name,
                    "x": line_x,
                    "y": y_pos + 3,
                    "width": tag_w,
                    "height": 12,
                    "font_size": 8.0,
                    "font_name": "Helvetica-Bold",
                    "text_color": self.text_color,
                    "align": "center",
                    "z_index": 3,
                })
                line_x += tag_w + 6
            cursor_top = line_y + 26

        elif style == "two_column_list":
            col_w = (w - 10) / 2
            for s_idx, s in enumerate(skills[:8]):
                name = s.get("name", "") if isinstance(s, dict) else str(s)
                is_right = (s_idx % 2 == 1)
                cx = x + col_w + 10 if is_right else x
                cy = PAGE_HEIGHT - cursor_top - 14

                self.elements.append({
                    "id": f"sk_li_{s_idx}_{uuid.uuid4().hex[:6]}",
                    "element_type": "text",
                    "page_id": "page-1",
                    "text": f"• {name}",
                    "x": cx,
                    "y": cy,
                    "width": col_w,
                    "height": 14,
                    "font_size": 8.5,
                    "font_name": "Helvetica",
                    "text_color": self.text_color,
                    "z_index": 3,
                })
                if is_right:
                    cursor_top += 16
            if len(skills) % 2 == 1:
                cursor_top += 16

        else: # progress_bars
            for s_idx, s in enumerate(skills[:6]):
                name = s.get("name", "") if isinstance(s, dict) else str(s)
                level = float(s.get("level", 0.85)) if isinstance(s, dict) else 0.85
                if level > 1.0: level /= 100.0

                y_txt = PAGE_HEIGHT - cursor_top - 13
                self.elements.append({
                    "id": f"sk_txt_{s_idx}_{uuid.uuid4().hex[:6]}",
                    "element_type": "text",
                    "page_id": "page-1",
                    "text": name,
                    "x": x,
                    "y": y_txt,
                    "width": w - 35,
                    "height": 13,
                    "font_size": 8.5,
                    "font_name": "Helvetica-Bold",
                    "text_color": self.primary_color,
                    "z_index": 3,
                })
                self.elements.append({
                    "id": f"sk_pct_{s_idx}_{uuid.uuid4().hex[:6]}",
                    "element_type": "text",
                    "page_id": "page-1",
                    "text": f"{int(level * 100)}%",
                    "x": x + w - 30,
                    "y": y_txt,
                    "width": 30,
                    "height": 13,
                    "font_size": 8.0,
                    "font_name": "Helvetica",
                    "text_color": self.muted_color,
                    "align": "right",
                    "z_index": 3,
                })
                cursor_top += 15

                track_h = 3.5
                y_bar = PAGE_HEIGHT - cursor_top - track_h
                self.elements.append({
                    "id": f"sk_bg_{s_idx}_{uuid.uuid4().hex[:6]}",
                    "element_type": "shape",
                    "shape_type": "rectangle",
                    "page_id": "page-1",
                    "x": x,
                    "y": y_bar,
                    "width": w,
                    "height": track_h,
                    "border_radius": 2,
                    "fill_color": self.theme.get("border", "#E2E8F0"),
                    "z_index": 2,
                })
                fill_w = max(8.0, min(w, w * level))
                self.elements.append({
                    "id": f"sk_fill_{s_idx}_{uuid.uuid4().hex[:6]}",
                    "element_type": "shape",
                    "shape_type": "rectangle",
                    "page_id": "page-1",
                    "x": x,
                    "y": y_bar,
                    "width": fill_w,
                    "height": track_h,
                    "border_radius": 2,
                    "fill_color": self.accent_color,
                    "z_index": 3,
                })
                cursor_top += 10

        return cursor_top + gap

    def _render_dynamic_summary(self, x: float, w: float, cursor_top: float, title: str, decoration: str, gap: float) -> float:
        cursor_top = self._render_dynamic_heading(x, w, cursor_top, title or "Executive Summary", decoration)
        summary_txt = self.content.get("summary", "")
        if not summary_txt:
            return cursor_top

        sum_h = estimate_text_height(summary_txt, w, 9.0, 1.35)
        self.elements.append({
            "id": f"sum_txt_{uuid.uuid4().hex[:6]}",
            "element_type": "text",
            "page_id": "page-1",
            "text": summary_txt,
            "x": x,
            "y": PAGE_HEIGHT - cursor_top - sum_h,
            "width": w,
            "height": sum_h,
            "font_size": 9.0,
            "font_name": "Helvetica",
            "text_color": self.text_color,
            "line_height": 1.35,
            "z_index": 3,
        })
        return cursor_top + sum_h + gap

    def _render_dynamic_education(self, x: float, w: float, cursor_top: float, title: str, decoration: str, gap: float) -> float:
        cursor_top = self._render_dynamic_heading(x, w, cursor_top, title or "Education & Credentials", decoration)
        educations = self.content.get("educations", [])
        for edu_idx, edu in enumerate(educations[:2]):
            degree = edu.get("degree", "Degree")
            school = edu.get("school", "University")
            year = edu.get("year", "2020")
            details = edu.get("details", "")

            y_deg = PAGE_HEIGHT - cursor_top - 15
            yr_w = 70.0
            self.elements.append({
                "id": f"edu_d_{edu_idx}_{uuid.uuid4().hex[:6]}",
                "element_type": "text",
                "page_id": "page-1",
                "text": f"{degree}  •  {school}",
                "x": x,
                "y": y_deg,
                "width": max(100.0, w - yr_w),
                "height": 15,
                "font_size": 9.0,
                "font_name": "Helvetica-Bold",
                "text_color": self.primary_color,
                "bold": True,
                "z_index": 3,
            })
            self.elements.append({
                "id": f"edu_y_{edu_idx}_{uuid.uuid4().hex[:6]}",
                "element_type": "text",
                "page_id": "page-1",
                "text": year,
                "x": x + w - yr_w,
                "y": y_deg,
                "width": yr_w,
                "height": 15,
                "font_size": 8.5,
                "font_name": "Helvetica-Bold",
                "text_color": self.secondary_color,
                "align": "right",
                "z_index": 3,
            })
            cursor_top += 16
            if details:
                self.elements.append({
                    "id": f"edu_det_{edu_idx}_{uuid.uuid4().hex[:6]}",
                    "element_type": "text",
                    "page_id": "page-1",
                    "text": details,
                    "x": x + 6,
                    "y": PAGE_HEIGHT - cursor_top - 13,
                    "width": w - 6,
                    "height": 13,
                    "font_size": 8.0,
                    "font_name": "Helvetica",
                    "text_color": self.muted_color,
                    "z_index": 3,
                })
                cursor_top += 15
            cursor_top += 4
        return cursor_top + gap

    def _render_dynamic_certifications(self, x: float, w: float, cursor_top: float, title: str, decoration: str, gap: float) -> float:
        cursor_top = self._render_dynamic_heading(x, w, cursor_top, title or "Certifications", decoration)
        certs = self.content.get("certifications", [])
        for c_idx, cert in enumerate(certs[:4]):
            c_text = cert if isinstance(cert, str) else cert.get("name", "Certification")
            self.elements.append({
                "id": f"cert_{c_idx}_{uuid.uuid4().hex[:6]}",
                "element_type": "text",
                "page_id": "page-1",
                "text": f"• {c_text}",
                "x": x + 4,
                "y": PAGE_HEIGHT - cursor_top - 13,
                "width": w - 4,
                "height": 13,
                "font_size": 8.5,
                "font_name": "Helvetica",
                "text_color": self.text_color,
                "z_index": 3,
            })
            cursor_top += 15
        return cursor_top + gap

    def _render_dynamic_qr_code(self, x: float, w: float, cursor_top: float, url: str, label: str) -> float:
        qr_b64 = generate_qr_base64_png(url or "https://linkedin.com")
        qr_size = min(68.0, max(44.0, w - 20))
        qr_x = x + (w - qr_size) / 2
        y_pos = PAGE_HEIGHT - cursor_top - qr_size
        if qr_b64:
            self.elements.append({
                "id": "sb_qr_img",
                "element_type": "image",
                "page_id": "page-1",
                "x": qr_x,
                "y": y_pos,
                "width": qr_size,
                "height": qr_size,
                "image_path": qr_b64,
                "z_index": 3,
            })
        if label:
            self.elements.append({
                "id": f"qr_lbl_{uuid.uuid4().hex[:6]}",
                "element_type": "text",
                "page_id": "page-1",
                "text": label,
                "x": x,
                "y": y_pos - 13,
                "width": w,
                "height": 12,
                "font_size": 7.5,
                "font_name": "Helvetica-Bold",
                "text_color": self.muted_color,
                "align": "center",
                "z_index": 3,
            })
        return cursor_top + qr_size + 20

    def _resolve_sections_for_zones(self, grid_type: str):
        zones = self.blueprint.get("zones", {})
        columns = self.blueprint.get("columns", {})

        pri = zones.get("primary_column")
        sec = zones.get("secondary_column")

        if not pri and columns:
            pri = columns.get("main", {}).get("sections", [])
            sec = columns.get("sidebar", {}).get("sections", [])

        if not pri and not sec:
            raw_secs = self.blueprint.get("sections", ["summary", "experience", "skills", "education"])
            norm_secs = []
            for s in raw_secs:
                if isinstance(s, dict):
                    norm_secs.append(s)
                elif isinstance(s, str):
                    norm_secs.append({"type": s.lower().replace(" ", "_"), "title": s.title()})

            if grid_type == "single_column":
                pri = norm_secs
                sec = []
            else:
                pri = [s for s in norm_secs if s.get("type") in ["summary", "experience", "education", "projects"]]
                sec = [s for s in norm_secs if s.get("type") in ["skills", "certifications", "qr_code", "contact", "languages"]]
                if not pri:
                    pri = norm_secs[:2]
                    sec = norm_secs[2:]

        return pri or [], sec or []

    def _render_dynamic_section(self, sec_type: str, sec_title: str, x: float, w: float, cursor_top: float, decoration: str, skills_style: str, exp_style: str, gap: float) -> float:
        st = (sec_type or "").lower()
        if "summary" in st:
            return self._render_dynamic_summary(x, w, cursor_top, sec_title, decoration, gap)
        elif "exp" in st or "work" in st:
            return self._render_dynamic_experience(x, w, cursor_top, sec_title, decoration, exp_style, gap)
        elif "skill" in st:
            return self._render_dynamic_skills(x, w, cursor_top, sec_title, decoration, skills_style, gap)
        elif "edu" in st:
            return self._render_dynamic_education(x, w, cursor_top, sec_title, decoration, gap)
        elif "cert" in st:
            return self._render_dynamic_certifications(x, w, cursor_top, sec_title, decoration, gap)
        elif "qr" in st:
            return self._render_dynamic_qr_code(x, w, cursor_top, self.content.get("qr_url", "https://linkedin.com"), sec_title or "Scan Portfolio")
        elif "contact" in st:
            return self._render_sb_contact(x, w, cursor_top, sec_title)
        else:
            return cursor_top

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

        # Monogram in Sidebar (circle (x, y) is center)
        avatar_size = 54
        avatar_center_x = sb_x + sidebar_w / 2
        avatar_center_y = PAGE_HEIGHT - 35 - avatar_size / 2
        cand_name = self.candidate.get("name", "ALEXANDER MORGAN")
        initials = "".join([part[0] for part in cand_name.split() if part])[:2].upper() or "AM"

        self.elements.append({
            "id": "avatar_bg",
            "element_type": "shape",
            "shape_type": "circle",
            "page_id": "page-1",
            "x": avatar_center_x,
            "y": avatar_center_y,
            "width": avatar_size,
            "height": avatar_size,
            "fill_color": self.accent_color,
            "border_width": 0,
            "border_color": "transparent",
            "z_index": 5,
        })
        self.elements.append({
            "id": "avatar_txt",
            "element_type": "text",
            "page_id": "page-1",
            "text": initials,
            "x": sb_x,
            "y": avatar_center_y - 12,
            "width": sidebar_w,
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
        include_qr = bool(self.blueprint.get("include_qr_code", False))
        default_sb_sections = [
            {"type": "contact", "title": "Contact Details"},
            {"type": "skills", "title": "Core Competencies", "display": "progress_bars"},
            {"type": "certifications", "title": "Certifications"},
        ]
        if include_qr:
            default_sb_sections.append({"type": "qr_code", "label": "Portfolio QR", "url": "https://linkedin.com"})
        sidebar_sections = sidebar_config.get("sections", default_sb_sections)

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
            elif sec_type == "qr_code" and include_qr:
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
            "y": y - 5,
            "x2": x + w,
            "y2": y - 5,
            "width": w,
            "height": 1.5,
            "fill_color": self.accent_color,
            "border_color": self.accent_color,
            "border_width": 1.5,
            "z_index": 5,
        })
        return cursor_top + 30

    def _render_sb_contact(self, x: float, w: float, cursor_top: float, title: str) -> float:
        cursor_top = self._add_sb_header(x, w, cursor_top, title or "Contact Details")
        items = [
            ("Mail", self.candidate.get("email", "alex@resumagic.ai")),
            ("Phone", self.candidate.get("phone", "+1 (555) 019-2834")),
            ("MapPin", self.candidate.get("location", "New York, NY")),
            ("Globe", self.candidate.get("linkedin", "linkedin.com/in/profile")),
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
                "border_width": 0,
                "border_color": "transparent",
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
                "border_width": 0,
                "border_color": "transparent",
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
            lines = max(1, (len(cert) + 20) // 22)
            h_cert = max(14.0, lines * 11.5)
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
            cursor_top += h_cert + 8
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
            "y": y - 6,
            "x2": x + w,
            "y2": y - 6,
            "width": w,
            "height": 1.5,
            "fill_color": self.accent_color,
            "border_color": self.accent_color,
            "border_width": 1.5,
            "z_index": 3,
        })
        return cursor_top + 34

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
            "x2": sig_x + 140,
            "y2": y + 20,
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
        self._compile_sidebar_layout(sidebar_on_left=True)

    # ─────────────────────────────────────────────────────────────────────────
    # 4. Cyberpunk Edge Layout Solver
    # ─────────────────────────────────────────────────────────────────────────
    def _compile_cyberpunk_layout(self):
        cand_name = self.candidate.get("name", "ALEX MERCER")
        target_role = self.candidate.get("target_role", "CYBERPUNK TECH PROFESSIONAL")

        # Dark background
        self.elements.append({
            "id": "bg_dark",
            "element_type": "shape",
            "shape_type": "rectangle",
            "page_id": "page-1",
            "x": 0,
            "y": 0,
            "width": PAGE_WIDTH,
            "height": PAGE_HEIGHT,
            "fill_color": "#0a0a0f",
            "border_width": 0,
            "z_index": 0,
        })
        # Cyberpunk angular slashes
        self.elements.append({
            "id": "slash_red",
            "element_type": "shape",
            "shape_type": "path",
            "page_id": "page-1",
            "path_d": "M 0 792 L 612 660 L 612 792 Z",
            "fill_color": "#FF003C",
            "border_width": 0,
            "x": 0,
            "y": 0,
            "z_index": 1,
        })
        self.elements.append({
            "id": "slash_cyan",
            "element_type": "shape",
            "shape_type": "path",
            "page_id": "page-1",
            "path_d": "M 0 792 L 612 685 L 612 792 Z",
            "fill_color": "#00F0FF",
            "border_width": 0,
            "x": 0,
            "y": 0,
            "z_index": 2,
        })

        # Name in Neon Yellow
        self.elements.append({
            "id": "cyber_name",
            "element_type": "text",
            "page_id": "page-1",
            "text": cand_name.upper(),
            "x": 35,
            "y": PAGE_HEIGHT - 95,
            "width": 380,
            "height": 34,
            "font_size": 26,
            "font_name": "Helvetica-Bold",
            "text_color": "#FEE715",
            "bold": True,
            "z_index": 4,
        })

        # Target Role Pill Badge
        role_w = min(220, max(120, len(target_role) * 7.5 + 20))
        self.elements.append({
            "id": "cyber_role_bg",
            "element_type": "shape",
            "shape_type": "rectangle",
            "page_id": "page-1",
            "x": 35,
            "y": PAGE_HEIGHT - 122,
            "width": role_w,
            "height": 20,
            "fill_color": "#00F0FF",
            "border_radius": 2,
            "border_width": 0,
            "z_index": 4,
        })
        self.elements.append({
            "id": "cyber_role_txt",
            "element_type": "text",
            "page_id": "page-1",
            "text": target_role.upper(),
            "x": 35,
            "y": PAGE_HEIGHT - 120,
            "width": role_w,
            "height": 16,
            "font_size": 9,
            "font_name": "Helvetica-Bold",
            "text_color": "#000000",
            "align": "center",
            "bold": True,
            "z_index": 5,
        })

        # Left Column: Contact
        contact_items = [
            f"> {self.candidate.get('email', 'alex@mercer.dev')}",
            f"> {self.candidate.get('phone', '(555) 012-3456')}",
            f"> {self.candidate.get('location', 'San Francisco, CA')}",
        ]
        c_y = PAGE_HEIGHT - 170
        for item in contact_items:
            self.elements.append({
                "id": f"c_item_{uuid.uuid4().hex[:6]}",
                "element_type": "text",
                "page_id": "page-1",
                "text": item,
                "x": 35,
                "y": c_y,
                "width": 185,
                "height": 14,
                "font_size": 9,
                "font_name": "Courier",
                "text_color": "#FEE715",
                "z_index": 4,
            })
            c_y -= 18

        # SYS.SKILLS Header
        sk_y = c_y - 25
        self.elements.append({
            "id": "sk_sq",
            "element_type": "shape",
            "shape_type": "rectangle",
            "page_id": "page-1",
            "x": 35,
            "y": sk_y + 2,
            "width": 12,
            "height": 12,
            "fill_color": "#FEE715",
            "border_width": 0,
            "z_index": 4,
        })
        self.elements.append({
            "id": "sk_hdr",
            "element_type": "text",
            "page_id": "page-1",
            "text": "SYS.SKILLS",
            "x": 54,
            "y": sk_y,
            "width": 150,
            "height": 16,
            "font_size": 11,
            "font_name": "Helvetica-Bold",
            "text_color": "#ffffff",
            "bold": True,
            "z_index": 4,
        })
        skills = self.content.get("skills", [
            {"name": "React & Node.js"},
            {"name": "Python / FastAPI"},
            {"name": "PostgreSQL"},
            {"name": "AWS / Docker"},
            {"name": "TypeScript"},
        ])
        s_item_y = sk_y - 22
        for s in skills[:6]:
            s_name = s.get("name", "Skill") if isinstance(s, dict) else str(s)
            self.elements.append({
                "id": f"sk_tag_{uuid.uuid4().hex[:6]}",
                "element_type": "text",
                "page_id": "page-1",
                "text": f"[{s_name}]",
                "x": 35,
                "y": s_item_y,
                "width": 185,
                "height": 16,
                "font_size": 9.5,
                "font_name": "Courier-Bold",
                "text_color": "#00F0FF",
                "bold": True,
                "z_index": 4,
            })
            s_item_y -= 22

        # Right Column: SYS.SUMMARY
        sum_hdr_y = PAGE_HEIGHT - 170
        self.elements.append({
            "id": "sum_sq",
            "element_type": "shape",
            "shape_type": "rectangle",
            "page_id": "page-1",
            "x": 240,
            "y": sum_hdr_y + 2,
            "width": 12,
            "height": 12,
            "fill_color": "#00F0FF",
            "border_width": 0,
            "z_index": 4,
        })
        self.elements.append({
            "id": "sum_hdr",
            "element_type": "text",
            "page_id": "page-1",
            "text": "SYS.SUMMARY",
            "x": 259,
            "y": sum_hdr_y,
            "width": 200,
            "height": 16,
            "font_size": 11,
            "font_name": "Helvetica-Bold",
            "text_color": "#ffffff",
            "bold": True,
            "z_index": 4,
        })
        summary_txt = self.content.get("summary", "Innovative engineer with 8+ years building scalable cloud systems...")
        sum_h = estimate_text_height(summary_txt, 335, 9)
        self.elements.append({
            "id": "cyber_sum_txt",
            "element_type": "text",
            "page_id": "page-1",
            "text": summary_txt,
            "x": 240,
            "y": sum_hdr_y - 12 - sum_h,
            "width": 335,
            "height": sum_h,
            "font_size": 9,
            "font_name": "Courier",
            "text_color": "#e2e8f0",
            "line_height": 1.4,
            "z_index": 4,
        })

        # SYS.EXPERIENCE
        exp_hdr_y = sum_hdr_y - 28 - sum_h
        self.elements.append({
            "id": "exp_sq",
            "element_type": "shape",
            "shape_type": "rectangle",
            "page_id": "page-1",
            "x": 240,
            "y": exp_hdr_y + 2,
            "width": 12,
            "height": 12,
            "fill_color": "#FF003C",
            "border_width": 0,
            "z_index": 4,
        })
        self.elements.append({
            "id": "exp_hdr",
            "element_type": "text",
            "page_id": "page-1",
            "text": "SYS.EXPERIENCE",
            "x": 259,
            "y": exp_hdr_y,
            "width": 200,
            "height": 16,
            "font_size": 11,
            "font_name": "Helvetica-Bold",
            "text_color": "#ffffff",
            "bold": True,
            "z_index": 4,
        })

        curr_y = exp_hdr_y - 12
        experiences = self.content.get("experiences", [])
        for e_idx, exp in enumerate(experiences[:2]):
            r_txt = f"{exp.get('role', 'Lead Engineer')} · {exp.get('company', 'TechCorp Inc.')}"
            d_txt = exp.get("duration", "2021 – Present")
            curr_y -= 16
            self.elements.append({
                "id": f"cy_exp_r_{e_idx}",
                "element_type": "text",
                "page_id": "page-1",
                "text": r_txt,
                "x": 240,
                "y": curr_y,
                "width": 335,
                "height": 16,
                "font_size": 10.5,
                "font_name": "Helvetica-Bold",
                "text_color": "#00F0FF",
                "bold": True,
                "z_index": 4,
            })
            curr_y -= 14
            self.elements.append({
                "id": f"cy_exp_d_{e_idx}",
                "element_type": "text",
                "page_id": "page-1",
                "text": d_txt,
                "x": 240,
                "y": curr_y,
                "width": 335,
                "height": 14,
                "font_size": 8.5,
                "font_name": "Courier",
                "text_color": "#94a3b8",
                "z_index": 4,
            })
            curr_y -= 6
            bullets = exp.get("bullets", [])
            for b_idx, bullet in enumerate(bullets[:3]):
                b_text = bullet if bullet.startswith("•") else f"• {bullet}"
                b_h = estimate_text_height(b_text, 335, 8.5)
                curr_y -= b_h
                self.elements.append({
                    "id": f"cy_exp_b_{e_idx}_{b_idx}",
                    "element_type": "text",
                    "page_id": "page-1",
                    "text": b_text,
                    "x": 240,
                    "y": curr_y,
                    "width": 335,
                    "height": b_h,
                    "font_size": 8.5,
                    "font_name": "Courier",
                    "text_color": "#cbd5e1",
                    "line_height": 1.35,
                    "z_index": 4,
                })
                curr_y -= 4
            curr_y -= 10

    # ─────────────────────────────────────────────────────────────────────────
    # 5. Retro Terminal Layout Solver
    # ─────────────────────────────────────────────────────────────────────────
    def _compile_retro_terminal_layout(self):
        cand_name = self.candidate.get("name", "alex_mercer").lower().replace(" ", "_")
        target_role = self.candidate.get("target_role", "Senior Software Engineer")

        # Dark Terminal Background
        self.elements.append({
            "id": "bg_term",
            "element_type": "shape",
            "shape_type": "rectangle",
            "page_id": "page-1",
            "x": 0,
            "y": 0,
            "width": PAGE_WIDTH,
            "height": PAGE_HEIGHT,
            "fill_color": "#0C0C0C",
            "border_width": 0,
            "z_index": 0,
        })
        self.elements.append({
            "id": "term_init",
            "element_type": "text",
            "page_id": "page-1",
            "text": "user@system:~$ ./init_resume.sh",
            "x": 35,
            "y": PAGE_HEIGHT - 45,
            "width": 540,
            "height": 14,
            "font_size": 10,
            "font_name": "Courier",
            "text_color": "#22C55E",
            "z_index": 2,
        })
        self.elements.append({
            "id": "term_name",
            "element_type": "text",
            "page_id": "page-1",
            "text": f"> {cand_name}",
            "x": 35,
            "y": PAGE_HEIGHT - 80,
            "width": 540,
            "height": 28,
            "font_size": 22,
            "font_name": "Courier-Bold",
            "text_color": "#22C55E",
            "bold": True,
            "z_index": 2,
        })
        self.elements.append({
            "id": "term_role",
            "element_type": "text",
            "page_id": "page-1",
            "text": f"// {target_role}",
            "x": 35,
            "y": PAGE_HEIGHT - 105,
            "width": 540,
            "height": 16,
            "font_size": 11,
            "font_name": "Courier",
            "text_color": "#86EFAC",
            "z_index": 2,
        })
        contact_line = f"{self.candidate.get('email', 'alex@mercer.dev')}  |  {self.candidate.get('phone', '(555) 012-3456')}  |  {self.candidate.get('linkedin', 'linkedin.com/in/alex')}"
        self.elements.append({
            "id": "term_contact",
            "element_type": "text",
            "page_id": "page-1",
            "text": contact_line,
            "x": 35,
            "y": PAGE_HEIGHT - 128,
            "width": 540,
            "height": 14,
            "font_size": 9,
            "font_name": "Courier",
            "text_color": "#4ADE80",
            "z_index": 2,
        })
        self.elements.append({
            "id": "term_rule_top",
            "element_type": "shape",
            "shape_type": "line",
            "page_id": "page-1",
            "x": 35,
            "y": PAGE_HEIGHT - 145,
            "x2": 577,
            "y2": PAGE_HEIGHT - 145,
            "width": 542,
            "height": 1,
            "fill_color": "#16A34A",
            "border_color": "#16A34A",
            "border_width": 1,
            "z_index": 2,
        })

        # Vertical splitter line between columns
        self.elements.append({
            "id": "term_col_split",
            "element_type": "shape",
            "shape_type": "line",
            "page_id": "page-1",
            "x": 235,
            "y": 30,
            "x2": 235,
            "y2": PAGE_HEIGHT - 160,
            "width": 1,
            "height": PAGE_HEIGHT - 190,
            "fill_color": "#16A34A",
            "border_color": "#16A34A",
            "border_width": 1,
            "z_index": 2,
        })

        # Left Column: /* SUMMARY */
        sum_y = PAGE_HEIGHT - 175
        self.elements.append({
            "id": "term_sum_hdr",
            "element_type": "text",
            "page_id": "page-1",
            "text": "/* SUMMARY */",
            "x": 35,
            "y": sum_y,
            "width": 185,
            "height": 16,
            "font_size": 10.5,
            "font_name": "Courier-Bold",
            "text_color": "#22C55E",
            "bold": True,
            "z_index": 2,
        })
        summary_txt = self.content.get("summary", "Innovative engineer with 8+ years building scalable cloud systems...")
        sum_h = estimate_text_height(summary_txt, 185, 8.5)
        self.elements.append({
            "id": "term_sum_txt",
            "element_type": "text",
            "page_id": "page-1",
            "text": summary_txt,
            "x": 35,
            "y": sum_y - 12 - sum_h,
            "width": 185,
            "height": sum_h,
            "font_size": 8.5,
            "font_name": "Courier",
            "text_color": "#D1D5DB",
            "line_height": 1.35,
            "z_index": 2,
        })

        # /* SKILLS */
        sk_y = sum_y - 28 - sum_h
        self.elements.append({
            "id": "term_sk_hdr",
            "element_type": "text",
            "page_id": "page-1",
            "text": "/* SKILLS */",
            "x": 35,
            "y": sk_y,
            "width": 185,
            "height": 16,
            "font_size": 10.5,
            "font_name": "Courier-Bold",
            "text_color": "#22C55E",
            "bold": True,
            "z_index": 2,
        })
        skills = self.content.get("skills", [
            {"name": "React & Node.js", "level": 0.92},
            {"name": "Python / FastAPI", "level": 0.88},
            {"name": "PostgreSQL", "level": 0.85},
            {"name": "AWS / Docker", "level": 0.90},
            {"name": "TypeScript", "level": 0.95},
        ])
        s_y = sk_y - 20
        for s in skills[:5]:
            s_name = s.get("name", "Skill") if isinstance(s, dict) else str(s)
            s_lvl = float(s.get("level", 0.85)) if isinstance(s, dict) else 0.85
            self.elements.append({
                "id": f"term_sk_t_{uuid.uuid4().hex[:6]}",
                "element_type": "text",
                "page_id": "page-1",
                "text": f"> {s_name}",
                "x": 35,
                "y": s_y,
                "width": 185,
                "height": 14,
                "font_size": 8.5,
                "font_name": "Courier",
                "text_color": "#86EFAC",
                "z_index": 2,
            })
            s_y -= 8
            self.elements.append({
                "id": f"term_sk_bg_{uuid.uuid4().hex[:6]}",
                "element_type": "shape",
                "shape_type": "rectangle",
                "page_id": "page-1",
                "x": 35,
                "y": s_y,
                "width": 185,
                "height": 4,
                "fill_color": "#064E3B",
                "border_width": 0,
                "z_index": 2,
            })
            self.elements.append({
                "id": f"term_sk_fill_{uuid.uuid4().hex[:6]}",
                "element_type": "shape",
                "shape_type": "rectangle",
                "page_id": "page-1",
                "x": 35,
                "y": s_y,
                "width": 185 * s_lvl,
                "height": 4,
                "fill_color": "#22C55E",
                "border_width": 0,
                "z_index": 3,
            })
            s_y -= 18

        # Right Column: /* EXPERIENCE */
        exp_y = PAGE_HEIGHT - 175
        self.elements.append({
            "id": "term_exp_hdr",
            "element_type": "text",
            "page_id": "page-1",
            "text": "/* EXPERIENCE */",
            "x": 255,
            "y": exp_y,
            "width": 320,
            "height": 16,
            "font_size": 10.5,
            "font_name": "Courier-Bold",
            "text_color": "#22C55E",
            "bold": True,
            "z_index": 2,
        })
        cur_y = exp_y - 16
        experiences = self.content.get("experiences", [])
        for e_idx, exp in enumerate(experiences[:2]):
            cur_y -= 16
            self.elements.append({
                "id": f"term_exp_r_{e_idx}",
                "element_type": "text",
                "page_id": "page-1",
                "text": f"> {exp.get('role', 'Lead Engineer')} · {exp.get('company', 'TechCorp Inc.')}",
                "x": 255,
                "y": cur_y,
                "width": 320,
                "height": 16,
                "font_size": 10,
                "font_name": "Courier-Bold",
                "text_color": "#F8FAFC",
                "bold": True,
                "z_index": 2,
            })
            cur_y -= 14
            self.elements.append({
                "id": f"term_exp_d_{e_idx}",
                "element_type": "text",
                "page_id": "page-1",
                "text": f"// {exp.get('duration', '2021 – Present')}",
                "x": 255,
                "y": cur_y,
                "width": 320,
                "height": 14,
                "font_size": 8.5,
                "font_name": "Courier",
                "text_color": "#22C55E",
                "z_index": 2,
            })
            cur_y -= 6
            bullets = exp.get("bullets", [])
            for b_idx, bullet in enumerate(bullets[:3]):
                b_text = bullet if bullet.startswith("•") else f"• {bullet}"
                b_h = estimate_text_height(b_text, 320, 8)
                cur_y -= b_h
                self.elements.append({
                    "id": f"term_exp_b_{e_idx}_{b_idx}",
                    "element_type": "text",
                    "page_id": "page-1",
                    "text": b_text,
                    "x": 255,
                    "y": cur_y,
                    "width": 320,
                    "height": b_h,
                    "font_size": 8,
                    "font_name": "Courier",
                    "text_color": "#CBD5E1",
                    "line_height": 1.35,
                    "z_index": 2,
                })
                cur_y -= 4
            cur_y -= 10


def compile_blueprint_to_canvas(blueprint: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Master entry point for compiling a Semantic Blueprint into EditorElement objects."""
    solver = MathematicalLayoutSolver(blueprint)
    return solver.compile()
