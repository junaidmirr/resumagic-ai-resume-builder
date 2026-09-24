"""
Typed Schema Validation & Layout Normalization Module
=====================================================
Validates raw LLM JSON outputs before they reach the document/rendering engine.
Enforces structural invariants, bounds checking, geometry limits, and typed models.
"""

from typing import List, Dict, Any, Optional
import math


class SchemaValidationError(Exception):
    pass


class DocumentElementValidator:
    """
    Validates, sanitizes, and normalizes AI-generated resume canvas elements.
    Ensures safe geometry, font sizes, text lengths, and element boundaries.
    """
    VALID_ELEMENT_TYPES = {"text", "shape", "image", "table"}
    VALID_SHAPE_TYPES = {"rectangle", "circle", "line", "arrow", "badge"}

    PAGE_WIDTH = 612.0
    PAGE_HEIGHT = 792.0

    MIN_FONT_SIZE = 6.0
    MAX_FONT_SIZE = 72.0
    MAX_TEXT_LEN = 10000

    @classmethod
    def validate_and_normalize_element(cls, el: Dict[str, Any], page_index: int = 0) -> Dict[str, Any]:
        if not isinstance(el, dict):
            raise SchemaValidationError(f"Element must be a dictionary, got {type(el).__name__}")

        el_type = str(el.get("element_type", "text")).strip().lower()
        if el_type not in cls.VALID_ELEMENT_TYPES:
            el_type = "text"

        # Coordinates & Dimensions
        try:
            x = float(el.get("x", 40.0))
            y = float(el.get("y", 100.0))
            width = float(el.get("width", 200.0))
            height = float(el.get("height", 30.0))
        except (ValueError, TypeError):
            x, y, width, height = 40.0, 100.0, 200.0, 30.0

        # Enforce page boundary constraints
        x = max(0.0, min(cls.PAGE_WIDTH - 20.0, x))
        y = max(0.0, min(cls.PAGE_HEIGHT * 4, y)) # Allow multi-page coordinate spaces
        width = max(10.0, min(cls.PAGE_WIDTH - x, width))
        height = max(5.0, min(cls.PAGE_HEIGHT, height))

        clean: Dict[str, Any] = {
            "id": str(el.get("id") or f"el_{int(x)}_{int(y)}_{hash(str(el.get('text', ''))[:20]) % 10000}"),
            "element_type": el_type,
            "x": round(x, 2),
            "y": round(y, 2),
            "width": round(width, 2),
            "height": round(height, 2),
            "page_id": el.get("page_id", f"page-{page_index + 1}"),
        }

        # Type-specific validation
        if el_type == "text":
            raw_text = str(el.get("text", "") or "")
            if len(raw_text) > cls.MAX_TEXT_LEN:
                raw_text = raw_text[:cls.MAX_TEXT_LEN]

            try:
                font_size = float(el.get("font_size", 11.0))
            except (ValueError, TypeError):
                font_size = 11.0
            font_size = max(cls.MIN_FONT_SIZE, min(cls.MAX_FONT_SIZE, font_size))

            clean["text"] = raw_text
            clean["font_size"] = round(font_size, 1)
            clean["font_name"] = str(el.get("font_name", "Helvetica")).strip()
            clean["text_color"] = str(el.get("text_color", "#1e293b")).strip()
            clean["line_height"] = max(1.0, min(3.0, float(el.get("line_height", 1.3))))
            clean["alignment"] = str(el.get("alignment", "left")).lower()

        elif el_type == "shape":
            shape_type = str(el.get("shape_type", "rectangle")).lower()
            if shape_type not in cls.VALID_SHAPE_TYPES:
                shape_type = "rectangle"
            clean["shape_type"] = shape_type
            clean["fill_color"] = str(el.get("fill_color", "#ffffff"))
            clean["border_color"] = str(el.get("border_color", "#000000"))
            clean["border_width"] = max(0.0, min(20.0, float(el.get("border_width", 1.0))))

        elif el_type == "image":
            clean["image_path"] = str(el.get("image_path", ""))
            clean["is_icon"] = bool(el.get("is_icon", False))
            if clean["is_icon"]:
                clean["icon_name"] = str(el.get("icon_name", "circle"))

        return clean

    @classmethod
    def validate_and_normalize_elements(cls, raw_list: Any) -> List[Dict[str, Any]]:
        """
        Processes a raw list of LLM outputs, dropping unrepairable elements and fixing all others.
        """
        if not isinstance(raw_list, list):
            return []

        sanitized = []
        for idx, item in enumerate(raw_list):
            try:
                clean_el = cls.validate_and_normalize_element(item, page_index=0)
                sanitized.append(clean_el)
            except SchemaValidationError:
                continue
            except Exception:
                continue

        return sanitized
