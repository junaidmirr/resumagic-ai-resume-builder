# engine.py
"""
PDF Engine - Backend for PDF Editor

Coordinate system:
  - All coordinates stored in PDF points, origin BOTTOM-LEFT (standard PDF).
  - Canvas/GUI flips Y for display.
  - Letter page: 612 x 792 pts

Element anchor conventions:
  - Text:      (x, y) = bottom-left of bounding box
  - Rectangle: (x, y) = bottom-left corner
  - Circle:    (x, y) = center
  - Line:      (x, y) = start point, (x2, y2) = end point
  - Image:     (x, y) = bottom-left corner
"""

from reportlab.lib.pagesizes import letter, A4, A3
from reportlab.pdfgen import canvas as rl_canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase.pdfmetrics import stringWidth
import json
import os
import io
import copy
import dataclasses
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class TextElement:
    id: str
    x: float
    y: float
    text: str
    font_size: int      = 12
    font_name: str      = "Helvetica"
    text_color: str     = "#000000"
    underline: bool     = False
    bold: bool          = False
    italic: bool        = False
    width: float        = 200
    height: float       = 50
    z_index: int        = 0
    element_type: str   = "text"
    align: str          = "left"

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class ShapeElement:
    id: str
    shape_type: str
    x: float
    y: float
    width: float            = 100
    height: float           = 100
    fill_color: str         = "#FFFFFF"
    border_color: str       = "#000000"
    border_width: float     = 2.0
    z_index: int            = 0
    element_type: str       = "shape"
    x2: Optional[float]     = None
    y2: Optional[float]     = None
    control_x: Optional[float] = None
    control_y: Optional[float] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class ImageElement:
    id: str
    x: float
    y: float
    width: float
    height: float
    image_path: str
    z_index: int        = 0
    element_type: str   = "image"
    mask_shape: str     = "none"
    remove_bg: bool     = False
    is_icon: bool       = False
    icon_name: str      = ""
    text_color: str     = "#334155"

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


# ---------------------------------------------------------------------------
# PDF Engine
# ---------------------------------------------------------------------------

class PDFEngine:
    """
    All public API methods use PDF points with bottom-left origin.
    render_to_pdf() passes coordinates directly to ReportLab — no transformation.
    """

    def __init__(self, page_size: str = "letter",
                 width: Optional[float] = None,
                 height: Optional[float] = None):
        self._elements: List[Any]   = []
        self._element_counter: int  = 0
        self._undo_stack: List[str] = []
        self._redo_stack: List[str] = []

        sizes = {"letter": letter, "A4": A4, "A3": A3}
        if page_size in sizes:
            self.page_width, self.page_height = sizes[page_size]
        else:
            self.page_width  = float(width  or 612)
            self.page_height = float(height or 792)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _next_id(self, prefix: str) -> str:
        eid = f"{prefix}_{self._element_counter}"
        self._element_counter += 1
        return eid

    def _serialise(self) -> str:
        return json.dumps([e.to_dict() for e in self._elements])

    def push_undo_snapshot(self):
        """Push current state onto undo stack. Call BEFORE making a change."""
        self._undo_stack.append(self._serialise())
        self._redo_stack.clear()
        if len(self._undo_stack) > 50:
            self._undo_stack.pop(0)

    # keep old name working internally
    def _snapshot(self):
        self.push_undo_snapshot()

    def _restore(self, snapshot: str):
        data = json.loads(snapshot)
        self._elements = [self._dict_to_element(d) for d in data]
        if self._elements:
            nums = [int(e.id.rsplit("_", 1)[1])
                    for e in self._elements
                    if e.id.rsplit("_", 1)[-1].isdigit()]
            self._element_counter = (max(nums) + 1) if nums else 0

    # ------------------------------------------------------------------
    # Undo / Redo
    # ------------------------------------------------------------------

    def undo(self) -> bool:
        if not self._undo_stack:
            return False
        self._redo_stack.append(self._serialise())
        self._restore(self._undo_stack.pop())
        return True

    def redo(self) -> bool:
        if not self._redo_stack:
            return False
        self._undo_stack.append(self._serialise())
        self._restore(self._redo_stack.pop())
        return True

    # ------------------------------------------------------------------
    # Element creation
    # ------------------------------------------------------------------

    def add_text(self, x: float, y: float, text: str,
                 font_size: int = 12,
                 font_name: str = "Helvetica",
                 text_color: str = "#000000",
                 bold: bool = False,
                 italic: bool = False,
                 underline: bool = False,
                 width: float = 200,
                 height: float = 50) -> str:
        self._snapshot()
        eid = self._next_id("text")
        self._elements.append(TextElement(
            id=eid, x=x, y=y, text=text,
            font_size=font_size, font_name=font_name,
            text_color=text_color, bold=bold, italic=italic,
            underline=underline, width=width, height=height,
            z_index=len(self._elements)
        ))
        return eid

    def add_rectangle(self, x: float, y: float,
                      width: float, height: float,
                      fill_color: str = "#FFFFFF",
                      border_color: str = "#000000",
                      border_width: float = 2.0) -> str:
        self._snapshot()
        eid = self._next_id("rect")
        self._elements.append(ShapeElement(
            id=eid, shape_type="rectangle",
            x=x, y=y, width=width, height=height,
            fill_color=fill_color, border_color=border_color,
            border_width=border_width, z_index=len(self._elements)
        ))
        return eid

    def add_circle(self, cx: float, cy: float, radius: float,
                   fill_color: str = "#FFFFFF",
                   border_color: str = "#000000",
                   border_width: float = 2.0) -> str:
        self._snapshot()
        eid = self._next_id("circle")
        self._elements.append(ShapeElement(
            id=eid, shape_type="circle",
            x=cx, y=cy,
            width=radius * 2, height=radius * 2,
            fill_color=fill_color, border_color=border_color,
            border_width=border_width, z_index=len(self._elements)
        ))
        return eid

    def add_line(self, x1: float, y1: float,
                 x2: float, y2: float,
                 color: str = "#000000",
                 width: float = 2.0) -> str:
        self._snapshot()
        eid = self._next_id("line")
        self._elements.append(ShapeElement(
            id=eid, shape_type="line",
            x=x1, y=y1, x2=x2, y2=y2,
            border_color=color, border_width=width,
            z_index=len(self._elements)
        ))
        return eid

    def add_image(self, x: float, y: float,
                  width: float, height: float,
                  image_path: str) -> str:
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found: {image_path}")
        self._snapshot()
        eid = self._next_id("image")
        self._elements.append(ImageElement(
            id=eid, x=x, y=y, width=width, height=height,
            image_path=image_path, z_index=len(self._elements)
        ))
        return eid

    # ------------------------------------------------------------------
    # Element mutation
    # ------------------------------------------------------------------

    def update_element(self, element_id: str, **kwargs) -> bool:
        """Update without snapshot — for live drag updates."""
        for el in self._elements:
            if el.id == element_id:
                for key, value in kwargs.items():
                    if value is not None and hasattr(el, key):
                        attr = getattr(el, key)
                        if isinstance(attr, float):
                            value = float(value)
                        elif isinstance(attr, int):
                            value = int(value)
                        setattr(el, key, value)
                return True
        return False

    def update_element_with_undo(self, element_id: str, **kwargs) -> bool:
        """Update with snapshot — for discrete user actions."""
        self._snapshot()
        return self.update_element(element_id, **kwargs)

    def delete_element(self, element_id: str) -> bool:
        self._snapshot()
        for i, el in enumerate(self._elements):
            if el.id == element_id:
                self._elements.pop(i)
                self._reindex_z()
                return True
        return False

    def duplicate_element(self, element_id: str) -> Optional[str]:
        self._snapshot()
        for el in self._elements:
            if el.id == element_id:
                raw    = copy.deepcopy(el.to_dict())
                prefix = element_id.rsplit("_", 1)[0]
                new_id = self._next_id(prefix)
                raw["id"]      = new_id
                raw["x"]       = raw["x"] + 15
                raw["y"]       = raw["y"] - 15
                raw["z_index"] = len(self._elements)
                self._elements.append(self._dict_to_element(raw))
                return new_id
        return None

    def move_element_forward(self, element_id: str) -> bool:
        for i, el in enumerate(self._elements):
            if el.id == element_id and i < len(self._elements) - 1:
                self._snapshot()
                self._elements[i], self._elements[i+1] = \
                    self._elements[i+1], self._elements[i]
                self._reindex_z()
                return True
        return False

    def move_element_backward(self, element_id: str) -> bool:
        for i, el in enumerate(self._elements):
            if el.id == element_id and i > 0:
                self._snapshot()
                self._elements[i], self._elements[i-1] = \
                    self._elements[i-1], self._elements[i]
                self._reindex_z()
                return True
        return False

    def _reindex_z(self):
        for i, el in enumerate(self._elements):
            el.z_index = i

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    def get_all_elements(self) -> List[Dict[str, Any]]:
        return [e.to_dict()
                for e in sorted(self._elements, key=lambda e: e.z_index)]

    def get_element(self, element_id: str) -> Optional[Dict[str, Any]]:
        for e in self._elements:
            if e.id == element_id:
                return e.to_dict()
        return None

    def get_page_size(self) -> tuple:
        return (self.page_width, self.page_height)

    # ------------------------------------------------------------------
    # Serialisation
    # ------------------------------------------------------------------

    def export_state(self) -> str:
        return json.dumps({
            "page_width":  self.page_width,
            "page_height": self.page_height,
            "elements":    [e.to_dict() for e in self._elements],
        }, indent=2)

    def import_state(self, json_state: str) -> bool:
        try:
            payload = json.loads(json_state)
            if isinstance(payload, list):
                elements_data = payload
            else:
                self.page_width  = float(payload.get("page_width",  self.page_width))
                self.page_height = float(payload.get("page_height", self.page_height))
                elements_data    = payload.get("elements", [])

            self._elements        = []
            self._element_counter = 0
            for item in elements_data:
                el = self._dict_to_element(item)
                self._elements.append(el)
                parts = el.id.rsplit("_", 1)
                if len(parts) == 2 and parts[1].isdigit():
                    self._element_counter = max(self._element_counter,
                                                int(parts[1]) + 1)
            self._undo_stack.clear()
            self._redo_stack.clear()
            return True
        except Exception as e:
            print(f"[PDFEngine] import_state error: {e}")
            return False

    def clear_all(self):
        self._snapshot()
        self._elements        = []
        self._element_counter = 0

    # ------------------------------------------------------------------
    # Rendering
    # ------------------------------------------------------------------

    def render_to_pdf(self, output_path: str) -> bool:
        try:
            c = rl_canvas.Canvas(output_path,
                                 pagesize=(self.page_width, self.page_height))
            self._render_all(c)
            c.save()
            return True
        except Exception as e:
            print(f"[PDFEngine] render_to_pdf error: {e}")
            return False

    def render_to_bytes(self) -> Optional[bytes]:
        try:
            buf = io.BytesIO()
            c   = rl_canvas.Canvas(buf,
                                   pagesize=(self.page_width, self.page_height))
            self._render_all(c)
            c.save()
            buf.seek(0)
            return buf.read()
        except Exception as e:
            print(f"[PDFEngine] render_to_bytes error: {e}")
            return None

    def _render_all(self, c: rl_canvas.Canvas):
        for el in sorted(self._elements, key=lambda e: e.z_index):
            if isinstance(el, TextElement):
                self._draw_text(c, el)
            elif isinstance(el, ShapeElement):
                self._draw_shape(c, el)
            elif isinstance(el, ImageElement):
                self._draw_image(c, el)

    # ------------------------------------------------------------------
    # Draw helpers — coordinates are PDF points, bottom-left origin.
    # THESE MUST MATCH THE CANVAS PREVIEW EXACTLY.
    # ------------------------------------------------------------------

    def _draw_text(self, c: rl_canvas.Canvas, el: TextElement):
        """
        Draw text inside bounding box (el.x, el.y, el.width, el.height).
        (el.x, el.y) = bottom-left of box.

        Lines are laid out top-to-bottom:
          first baseline = el.y + el.height - el.font_size
          each next line  = previous - font_size * 1.2
        Stop when baseline < el.y (clipped by box bottom).

        The canvas preview must use IDENTICAL layout logic.
        """
        font_name   = self._resolve_font(el.font_name, el.bold, el.italic)
        font_size   = el.font_size
        line_height = font_size * 1.2

        c.setFont(font_name, font_size)
        c.setFillColor(self._hex_to_color(el.text_color))

        lines = self._wrap_text(el.text, el.width, font_name, font_size)

        # First baseline: one font_size below the top of the bounding box
        current_y = el.y + el.height - font_size

        # Calculate horizontal alignment offset
        for line in lines:
            if current_y < el.y:      # clipped — outside bounding box
                break
            
            line_w = stringWidth(line, font_name, font_size)
            offset_x = 0
            if el.align == "center":
                offset_x = (el.width - line_w) / 2.0
            elif el.align == "right":
                offset_x = el.width - line_w
            
            c.drawString(el.x + offset_x, current_y, line)
            if el.underline:
                c.setLineWidth(0.5)
                c.line(el.x + offset_x, current_y - 2, el.x + offset_x + line_w, current_y - 2)
                c.setLineWidth(1)
            current_y -= line_height

    def _draw_shape(self, c: rl_canvas.Canvas, el: ShapeElement):
        c.setStrokeColor(self._hex_to_color(el.border_color))
        c.setLineWidth(el.border_width)

        if el.shape_type == "rectangle":
            c.setFillColor(self._hex_to_color(el.fill_color))
            c.rect(el.x, el.y, el.width, el.height, fill=1, stroke=1)

        elif el.shape_type == "circle":
            c.setFillColor(self._hex_to_color(el.fill_color))
            c.circle(el.x, el.y, el.width / 2.0, fill=1, stroke=1)

        elif el.shape_type == "line":
            if el.x2 is not None and el.y2 is not None:
                if el.control_x is not None and el.control_y is not None:
                    p = c.beginPath()
                    p.moveTo(el.x, el.y)
                    p.quadraticCurveTo(el.control_x, el.control_y, el.x2, el.y2)
                    c.drawPath(p, stroke=1, fill=0)
                else:
                    c.line(el.x, el.y, el.x2, el.y2)

        elif el.shape_type == "arrow":
            if el.x2 is not None and el.y2 is not None:
                if el.control_x is not None and el.control_y is not None:
                    p = c.beginPath()
                    p.moveTo(el.x, el.y)
                    p.quadraticCurveTo(el.control_x, el.control_y, el.x2, el.y2)
                    c.drawPath(p, stroke=1, fill=0)
                else:
                    c.line(el.x, el.y, el.x2, el.y2)
                
                import math
                angle = math.atan2(el.y2 - el.y, el.x2 - el.x)
                arrow_len = 15
                arrow_ang = math.pi / 6
                p1x = el.x2 - arrow_len * math.cos(angle - arrow_ang)
                p1y = el.y2 - arrow_len * math.sin(angle - arrow_ang)
                p2x = el.x2 - arrow_len * math.cos(angle + arrow_ang)
                p2y = el.y2 - arrow_len * math.sin(angle + arrow_ang)
                
                # Fill arrowhead
                p = c.beginPath()
                p.moveTo(el.x2, el.y2)
                p.lineTo(p1x, p1y)
                p.lineTo(p2x, p2y)
                p.close()
                c.setFillColor(self._hex_to_color(el.border_color))
                c.drawPath(p, fill=1, stroke=1)

    def _draw_image(self, c: rl_canvas.Canvas, el: ImageElement):
        try:
            if getattr(el, 'is_icon', False) or not el.image_path:
                return

            c.saveState()
            
            # Handle Base64 Data URIs (Vercel/Cloud Compatibility)
            img_source = el.image_path
            if img_source.startswith("data:image"):
                import base64, io
                header, encoded = img_source.split(",", 1)
                img_data = base64.b64decode(encoded)
                img_source = io.BytesIO(img_data)

            if el.mask_shape == "circle":
                p = c.beginPath()
                p.circle(el.x + el.width/2, el.y + el.height/2, min(el.width, el.height)/2)
                c.clipPath(p, stroke=0, fill=0)
            elif el.mask_shape == "rounded":
                p = c.beginPath()
                p.roundRect(el.x, el.y, el.width, el.height, 15)
                c.clipPath(p, stroke=0, fill=0)
            elif el.mask_shape == "heart":
                p = c.beginPath()
                x, y, w, h = el.x, el.y, el.width, el.height
                p.moveTo(x + w/2, y + h*0.2)
                p.bezierTo(x + w/4, y, x, y + h/2, x + w/2, y + h)
                p.bezierTo(x + w, y + h/2, x + 3*w/4, y, x + w/2, y + h*0.2)
                c.clipPath(p, stroke=0, fill=0)

            c.drawImage(el.image_path,
                        el.x, el.y,
                        width=el.width, height=el.height,
                        preserveAspectRatio=False,
                        mask="auto")
            c.restoreState()
        except Exception as e:
            print(f"[PDFEngine] draw_image error: {e}")

    # ------------------------------------------------------------------
    # Font resolution
    # ------------------------------------------------------------------

    @staticmethod
    def _resolve_font(base: str, bold: bool, italic: bool) -> str:
        mapping = {
            "Helvetica": "Helvetica",
            "Times": "Times-Roman",
            "Times New Roman": "Times-Roman",
            "Courier": "Courier",
        }
        base = mapping.get(base, "Helvetica")

        table = {
            "Helvetica": {
                (False, False): "Helvetica",
                (True, False): "Helvetica-Bold",
                (False, True): "Helvetica-Oblique",
                (True, True): "Helvetica-BoldOblique",
            },
            "Times-Roman": {
                (False, False): "Times-Roman",
                (True, False): "Times-Bold",
                (False, True): "Times-Italic",
                (True, True): "Times-BoldItalic",
            },
            "Courier": {
                (False, False): "Courier",
                (True, False): "Courier-Bold",
                (False, True): "Courier-Oblique",
                (True, True): "Courier-BoldOblique",
            },
        }

        family = table.get(base, table["Helvetica"])
        return family.get((bold, italic), "Helvetica")

    # ------------------------------------------------------------------
    # Text wrapping
    # ------------------------------------------------------------------

    @staticmethod
    def _wrap_text(text: str, max_width: float,
                   font_name: str, font_size: float) -> List[str]:
        """
        Word-wrap *text* to fit within *max_width* PDF points.
        Uses ReportLab stringWidth for accurate measurement.
        This is the SINGLE source of truth for wrapping —
        the canvas preview replicates the same logic.
        """
        result: List[str] = []

        for paragraph in text.split("\n"):
            if not paragraph.strip():
                result.append("")
                continue

            words   = paragraph.split()
            current = ""

            for word in words:
                candidate = (current + " " + word).strip()
                if stringWidth(candidate, font_name, font_size) <= max_width:
                    current = candidate
                else:
                    if current:
                        result.append(current)
                    # Force-break a single word that is too wide
                    while stringWidth(word, font_name, font_size) > max_width:
                        for k in range(len(word) - 1, 0, -1):
                            if stringWidth(word[:k], font_name, font_size) <= max_width:
                                result.append(word[:k])
                                word = word[k:]
                                break
                        else:
                            result.append(word)
                            word = ""
                            break
                    current = word

            if current:
                result.append(current)

        return result

    # ------------------------------------------------------------------
    # Colour
    # ------------------------------------------------------------------

    @staticmethod
    def _hex_to_color(hex_color: str) -> HexColor:
        h = hex_color.strip()
        if not h.startswith("#"):
            h = "#" + h
        return HexColor(h)

    # ------------------------------------------------------------------
    # Serialisation helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _dict_to_element(item: Dict[str, Any]):
        d     = dict(item)
        etype = d.get("element_type") or d.pop("type", None)

        if etype == "text":
            valid = {f.name for f in dataclasses.fields(TextElement)}
            return TextElement(**{k: v for k, v in d.items() if k in valid})

        if etype in ("shape", "rectangle", "circle", "line", "arrow"):
            valid = {f.name for f in dataclasses.fields(ShapeElement)}
            return ShapeElement(**{k: v for k, v in d.items() if k in valid})

        if etype == "image":
            valid = {f.name for f in dataclasses.fields(ImageElement)}
            return ImageElement(**{k: v for k, v in d.items() if k in valid})

        raise ValueError(f"Unknown element_type: '{etype}'")
