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
from reportlab.lib.colors import HexColor, Color
from reportlab.pdfbase.pdfmetrics import stringWidth
import json
import os
import io
import copy
import dataclasses
import logging
import threading
import base64
import hashlib
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict

# Set up structured logging
logger = logging.getLogger("PDFEngine")
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('[%(levelname)s] %(name)s: %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)
logger.setLevel(logging.INFO)

# Unicode support
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics

HAS_UNICODE_FONT = False
try:
    font_dir = os.path.join(os.path.dirname(__file__), "src", "assets", "fonts")
    pdfmetrics.registerFont(TTFont('NotoSans', os.path.join(font_dir, "NotoSans-Regular.ttf")))
    pdfmetrics.registerFont(TTFont('NotoSans-Bold', os.path.join(font_dir, "NotoSans-Bold.ttf")))
    pdfmetrics.registerFont(TTFont('NotoSans-Italic', os.path.join(font_dir, "NotoSans-Italic.ttf")))
    pdfmetrics.registerFont(TTFont('NotoSans-BoldItalic', os.path.join(font_dir, "NotoSans-BoldItalic.ttf")))
    HAS_UNICODE_FONT = True
except Exception as e:
    logger.error(f"CRITICAL: Failed to load NotoSans Unicode fonts from src/assets/fonts/. Non-Latin scripts will not render correctly! Error: {e}")

# Optional dependencies handling
try:
    from PIL import Image, ImageEnhance
    # Decompression bomb mitigation
    Image.MAX_IMAGE_PIXELS = 50_000_000 
except ImportError:
    Image = None
    logger.warning("Pillow (PIL) is not installed. Advanced image manipulation will be disabled.")


# ---------------------------------------------------------------------------
# Security & Limits
# ---------------------------------------------------------------------------
MAX_ELEMENTS = 5000
MAX_TEXT_LEN = 20000
ALLOWED_IMAGE_DIR = os.environ.get("ALLOWED_IMAGE_DIR", "/tmp/uploads")
os.makedirs(ALLOWED_IMAGE_DIR, exist_ok=True)


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
    line_height: float  = 1.4
    letter_spacing: float = 0.0
    page_id: str        = "page-1"

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class ShapeElement:
    id: str
    shape_type: str     # "rectangle", "circle", "line", "arrow", "polygon", "path"
    x: float
    y: float
    width: float        = 100
    height: float       = 100
    fill_color: str     = "#FFFFFF"
    border_color: str   = "#000000"
    border_width: float = 2.0
    border_radius: float = 0.0
    x2: Optional[float] = None
    y2: Optional[float] = None
    control_x: Optional[float] = None
    control_y: Optional[float] = None
    points: List[float] = dataclasses.field(default_factory=list)
    path_d: str         = ""
    z_index: int        = 0
    element_type: str   = "shape"
    page_id: str        = "page-1"

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
    page_id: str        = "page-1"

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


# ---------------------------------------------------------------------------
# PDF Engine
# ---------------------------------------------------------------------------

class PDFEngine:
    def __init__(self, page_size: str = "letter",
                 width: Optional[float] = None,
                 height: Optional[float] = None):
        self._lock = threading.RLock()
        self._elements: List[Any]   = []
        self._pages: List[str]      = ["page-1"]
        self._element_counter: int  = 0
        self._undo_stack: List[str] = []
        self._redo_stack: List[str] = []
        self._asset_cache: Dict[str, str] = {}

        sizes = {"letter": letter, "A4": A4, "A3": A3}
        if page_size in sizes:
            self.page_width, self.page_height = sizes[page_size]
        else:
            self.page_width  = float(width  or 612)
            self.page_height = float(height or 792)

    def _next_id(self, prefix: str) -> str:
        eid = f"{prefix}_{self._element_counter}"
        self._element_counter += 1
        return eid

    def _register_page(self, page_id: str):
        if page_id not in self._pages:
            self._pages.append(page_id)
            # Reorder pages if they match 'page-X'
            def sort_key(k):
                try:
                    return int(k.split('-')[-1])
                except:
                    return 0
            self._pages.sort(key=sort_key)

    def _serialise_undo(self) -> str:
        snapshot_elements = []
        for e in self._elements:
            d = e.to_dict()
            if isinstance(e, ImageElement) and isinstance(d.get("image_path"), str) and d["image_path"].startswith("data:image/"):
                img_str = d["image_path"]
                h_key = "asset_hash:" + hashlib.sha256(img_str.encode('utf-8')).hexdigest()
                self._asset_cache[h_key] = img_str
                d["image_path"] = h_key
            snapshot_elements.append(d)
        return json.dumps({
            "elements": snapshot_elements,
            "pages": self._pages
        })

    def _serialise(self) -> str:
        return json.dumps({
            "elements": [e.to_dict() for e in self._elements],
            "pages": self._pages
        })

    def _prune_asset_cache(self):
        """
        Scans current elements and undo/redo stacks to purge unreferenced asset hashes
        and enforce a maximum cache capacity limit (max 100 entries).
        """
        referenced_keys = set()
        
        # 1. Collect references from active elements
        for el in self._elements:
            img_path = getattr(el, 'image_path', None)
            if isinstance(img_path, str) and img_path.startswith("asset_hash:"):
                referenced_keys.add(img_path)

        # 2. Collect references from undo and redo stacks
        for snap in self._undo_stack + self._redo_stack:
            try:
                data = json.loads(snap)
                for item in data.get("elements", []):
                    img_path = item.get("image_path")
                    if isinstance(img_path, str) and img_path.startswith("asset_hash:"):
                        referenced_keys.add(img_path)
            except Exception:
                pass

        # 3. Purge unreferenced keys from cache
        cache_keys = list(self._asset_cache.keys())
        for k in cache_keys:
            if k not in referenced_keys:
                del self._asset_cache[k]

        # 4. Enforce hard capacity limit (max 100 keys) by evicting unreferenced in active first
        MAX_CACHE_KEYS = 100
        if len(self._asset_cache) > MAX_CACHE_KEYS:
            excess = len(self._asset_cache) - MAX_CACHE_KEYS
            active_img_keys = {getattr(e, 'image_path', '') for e in self._elements if isinstance(getattr(e, 'image_path', None), str)}
            unreferenced_in_active = [k for k in self._asset_cache.keys() if k not in active_img_keys]
            for k in unreferenced_in_active[:excess]:
                del self._asset_cache[k]

    def push_undo_snapshot(self):
        with self._lock:
            self._undo_stack.append(self._serialise_undo())
            self._redo_stack.clear()
            if len(self._undo_stack) > 50:
                self._undo_stack.pop(0)
            self._prune_asset_cache()

    def _snapshot(self):
        self.push_undo_snapshot()

    def _restore(self, snapshot: str):
        with self._lock:
            data = json.loads(snapshot)
            raw_elements = data.get("elements", [])
            for d in raw_elements:
                if d.get("element_type") == "image" and isinstance(d.get("image_path"), str) and d["image_path"].startswith("asset_hash:"):
                    h_key = d["image_path"]
                    if h_key in self._asset_cache:
                        d["image_path"] = self._asset_cache[h_key]
            self._elements = [self._dict_to_element(d) for d in raw_elements]
            self._pages = data.get("pages", ["page-1"])
            
            if self._elements:
                nums = [int(e.id.rsplit("_", 1)[1])
                        for e in self._elements
                        if getattr(e, 'id', '').rsplit("_", 1)[-1].isdigit()]
                self._element_counter = (max(nums) + 1) if nums else 0

    def undo(self) -> bool:
        with self._lock:
            if not self._undo_stack:
                return False
            self._redo_stack.append(self._serialise_undo())
            self._restore(self._undo_stack.pop())
            return True

    def redo(self) -> bool:
        with self._lock:
            if not self._redo_stack:
                return False
            self._undo_stack.append(self._serialise_undo())
            self._restore(self._redo_stack.pop())
            return True
            
    # ------------------------------------------------------------------
    # Page CRUD API
    # ------------------------------------------------------------------
    
    def add_page(self, index: Optional[int] = None) -> str:
        with self._lock:
            self._snapshot()
            
            # Find next available numeric ID for clean naming
            nums = []
            for p in self._pages:
                try:
                    nums.append(int(p.split('-')[-1]))
                except ValueError:
                    pass
            next_num = max(nums) + 1 if nums else 1
            new_page_id = f"page-{next_num}"
            
            if index is not None and 0 <= index < len(self._pages):
                self._pages.insert(index, new_page_id)
            else:
                self._pages.append(new_page_id)
                
            return new_page_id

    def delete_page(self, page_id: str) -> bool:
        with self._lock:
            if page_id not in self._pages:
                return False
            if len(self._pages) <= 1:
                logger.warning("Cannot delete the last remaining page.")
                return False
                
            self._snapshot()
            
            # Cascading delete of all elements on this page
            self._elements = [el for el in self._elements if getattr(el, 'page_id', 'page-1') != page_id]
            self._reindex_z()
            
            # Remove from registry
            self._pages.remove(page_id)
            return True

    def reorder_pages(self, new_order: List[str]) -> bool:
        with self._lock:
            if set(new_order) != set(self._pages):
                logger.error("reorder_pages called with mismatched page list.")
                return False
                
            self._snapshot()
            self._pages = new_order
            return True
            
    # ------------------------------------------------------------------
    # Element creation
    # ------------------------------------------------------------------

    def _check_limits(self):
        if len(self._elements) >= MAX_ELEMENTS:
            logger.error(f"Engine element limit ({MAX_ELEMENTS}) exceeded.")
            raise ValueError("Maximum element count exceeded.")

    def add_text(self, x: float, y: float, text: str,
                 font_size: int = 12,
                 font_name: str = "Helvetica",
                 text_color: str = "#000000",
                 bold: bool = False,
                 italic: bool = False,
                 underline: bool = False,
                 width: float = 200,
                 height: float = 50,
                 page_id: str = "page-1") -> str:
        with self._lock:
            self._check_limits()
            if len(text) > MAX_TEXT_LEN:
                logger.error(f"Text length ({len(text)}) exceeds maximum {MAX_TEXT_LEN}")
                raise ValueError("Text length limit exceeded.")
                
            self._snapshot()
            self._register_page(page_id)
            eid = self._next_id("text")
            self._elements.append(TextElement(
                id=eid, x=x, y=y, text=text,
                font_size=font_size, font_name=font_name,
                text_color=text_color, bold=bold, italic=italic,
                underline=underline, width=width, height=height,
                z_index=len(self._elements), page_id=page_id
            ))
            return eid

    def add_rectangle(self, x: float, y: float,
                      width: float, height: float,
                      fill_color: str = "#FFFFFF",
                      border_color: str = "#000000",
                      border_width: float = 2.0,
                      page_id: str = "page-1") -> str:
        with self._lock:
            self._check_limits()
            self._snapshot()
            self._register_page(page_id)
            eid = self._next_id("rect")
            self._elements.append(ShapeElement(
                id=eid, shape_type="rectangle",
                x=x, y=y, width=width, height=height,
                fill_color=fill_color, border_color=border_color,
                border_width=border_width, z_index=len(self._elements),
                page_id=page_id
            ))
            return eid

    def add_circle(self, cx: float, cy: float, radius: float,
                   fill_color: str = "#FFFFFF",
                   border_color: str = "#000000",
                   border_width: float = 2.0,
                   page_id: str = "page-1") -> str:
        with self._lock:
            self._check_limits()
            self._snapshot()
            self._register_page(page_id)
            eid = self._next_id("circle")
            self._elements.append(ShapeElement(
                id=eid, shape_type="circle",
                x=cx, y=cy,
                width=radius * 2, height=radius * 2,
                fill_color=fill_color, border_color=border_color,
                border_width=border_width, z_index=len(self._elements),
                page_id=page_id
            ))
            return eid

    def add_line(self, x1: float, y1: float,
                 x2: float, y2: float,
                 color: str = "#000000",
                 width: float = 2.0,
                 page_id: str = "page-1") -> str:
        with self._lock:
            self._check_limits()
            self._snapshot()
            self._register_page(page_id)
            eid = self._next_id("line")
            self._elements.append(ShapeElement(
                id=eid, shape_type="line",
                x=x1, y=y1, x2=x2, y2=y2,
                border_color=color, border_width=width,
                z_index=len(self._elements), page_id=page_id
            ))
            return eid

    def add_image(self, x: float, y: float,
                  width: float, height: float,
                  image_path: str,
                  page_id: str = "page-1") -> str:
        with self._lock:
            self._check_limits()
            
            if not image_path.startswith("data:image/"):
                abs_path = os.path.realpath(image_path)
                abs_whitelist = os.path.realpath(ALLOWED_IMAGE_DIR)
                
                if not abs_path.startswith(abs_whitelist + os.sep) and abs_path != abs_whitelist:
                    logger.warning(f"Path outside allowed directory: {image_path}")
                    raise PermissionError("Access denied.")
                    
                if not os.path.exists(abs_path):
                    logger.error(f"Image not found: {image_path}")
                    raise FileNotFoundError(f"Image not found: {image_path}")
            
            self._snapshot()
            self._register_page(page_id)
            eid = self._next_id("image")
            self._elements.append(ImageElement(
                id=eid, x=x, y=y, width=width, height=height,
                image_path=image_path, z_index=len(self._elements),
                page_id=page_id
            ))
            return eid

    def update_element(self, element_id: str, **kwargs) -> bool:
        IMMUTABLE_FIELDS = {"id", "element_type"}
        
        with self._lock:
            for el in self._elements:
                if el.id == element_id:
                    el_type = type(el)
                    field_types = {f.name: f.type for f in dataclasses.fields(el_type)}
                    
                    for key, value in kwargs.items():
                        if key in IMMUTABLE_FIELDS:
                            continue
                            
                        if value is not None and hasattr(el, key):
                            expected_type = field_types.get(key)
                            
                            try:
                                if expected_type in (float, Optional[float]) and value != "":
                                    value = float(value)
                                elif expected_type in (int, Optional[int]) and value != "":
                                    value = int(value)
                                elif expected_type in (bool, Optional[bool]):
                                    if isinstance(value, str):
                                        value = value.strip().lower() in ("true", "1", "yes")
                                    else:
                                        value = bool(value)
                            except (ValueError, TypeError) as e:
                                logger.warning(f"Failed to coerce {key}={value} for {element_id}: {e}")
                                continue
                                
                            setattr(el, key, value)
                            if key == "page_id":
                                self._register_page(value)
                                
                    return True
            return False

    def update_element_with_undo(self, element_id: str, **kwargs) -> bool:
        with self._lock:
            self._snapshot()
            return self.update_element(element_id, **kwargs)

    def delete_element(self, element_id: str) -> bool:
        with self._lock:
            self._snapshot()
            for i, el in enumerate(self._elements):
                if el.id == element_id:
                    self._elements.pop(i)
                    self._reindex_z()
                    return True
            return False

    def duplicate_element(self, element_id: str) -> Optional[str]:
        with self._lock:
            self._check_limits()
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
        with self._lock:
            for i, el in enumerate(self._elements):
                if el.id == element_id and i < len(self._elements) - 1:
                    self._snapshot()
                    self._elements[i], self._elements[i+1] = self._elements[i+1], self._elements[i]
                    self._reindex_z()
                    return True
            return False

    def move_element_backward(self, element_id: str) -> bool:
        with self._lock:
            for i, el in enumerate(self._elements):
                if el.id == element_id and i > 0:
                    self._snapshot()
                    self._elements[i], self._elements[i-1] = self._elements[i-1], self._elements[i]
                    self._reindex_z()
                    return True
            return False

    def _reindex_z(self):
        for i, el in enumerate(self._elements):
            el.z_index = i

    def get_all_elements(self) -> List[Dict[str, Any]]:
        with self._lock:
            return [e.to_dict() for e in sorted(self._elements, key=lambda e: e.z_index)]

    def get_element(self, element_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            for e in self._elements:
                if e.id == element_id:
                    return e.to_dict()
            return None

    def get_page_size(self) -> tuple:
        return (self.page_width, self.page_height)

    def export_state(self) -> str:
        with self._lock:
            return json.dumps({
                "page_width":  self.page_width,
                "page_height": self.page_height,
                "pages":       self._pages,
                "elements":    [e.to_dict() for e in self._elements],
            }, indent=2)

    def import_state(self, json_state: str) -> bool:
        with self._lock:
            try:
                payload = json.loads(json_state)
                if isinstance(payload, list):
                    elements_data = payload
                    pages_data = ["page-1"]
                    new_width = self.page_width
                    new_height = self.page_height
                elif isinstance(payload, dict):
                    new_width  = float(payload.get("page_width",  self.page_width))
                    new_height = float(payload.get("page_height", self.page_height))
                    elements_data    = payload.get("elements", [])
                    pages_data       = payload.get("pages", ["page-1"])
                else:
                    logger.error("Invalid JSON payload type for import_state")
                    return False

                if not isinstance(elements_data, list) or len(elements_data) > MAX_ELEMENTS:
                    logger.error(f"Engine element limit ({MAX_ELEMENTS}) exceeded in import or invalid elements list.")
                    return False

                new_elements = []
                new_counter = 0
                temp_pages = list(pages_data) if isinstance(pages_data, list) and pages_data else ["page-1"]
                
                for item in elements_data:
                    if not isinstance(item, dict):
                        logger.error("Invalid element item format in import_state")
                        return False
                        
                    if item.get("element_type", item.get("type")) == "text":
                        if len(item.get("text", "")) > MAX_TEXT_LEN:
                            logger.error(f"Text length exceeds maximum {MAX_TEXT_LEN} in import")
                            return False
                            
                    el = self._dict_to_element(item)
                    new_elements.append(el)
                    
                    pid = getattr(el, 'page_id', 'page-1')
                    if pid not in temp_pages:
                        temp_pages.append(pid)
                        
                    parts = el.id.rsplit("_", 1)
                    if len(parts) == 2 and parts[1].isdigit():
                        new_counter = max(new_counter, int(parts[1]) + 1)

                def sort_key(k):
                    try:
                        return int(str(k).split('-')[-1])
                    except Exception:
                        return 0
                temp_pages.sort(key=sort_key)

                # Apply atomically ONLY after full validation succeeds
                self.page_width       = new_width
                self.page_height      = new_height
                self._elements        = new_elements
                self._element_counter = new_counter
                self._pages           = temp_pages
                self._undo_stack.clear()
                self._redo_stack.clear()
                self._prune_asset_cache()
                return True
            except Exception as e:
                logger.error(f"import_state error: {e}", exc_info=True)
                return False

    def clear_all(self):
        with self._lock:
            self._snapshot()
            self._elements        = []
            self._element_counter = 0
            self._pages           = ["page-1"]
            self._prune_asset_cache()

    def render_to_pdf(self, output_path: str) -> bool:
        with self._lock:
            try:
                c = rl_canvas.Canvas(output_path, pagesize=(self.page_width, self.page_height))
                self._render_all(c)
                c.save()
                return True
            except Exception as e:
                logger.error(f"render_to_pdf error: {e}", exc_info=True)
                return False

    def render_to_bytes(self) -> Optional[bytes]:
        with self._lock:
            try:
                buf = io.BytesIO()
                c   = rl_canvas.Canvas(buf, pagesize=(self.page_width, self.page_height))
                self._render_all(c)
                c.save()
                buf.seek(0)
                return buf.read()
            except Exception as e:
                logger.error(f"render_to_bytes error: {e}", exc_info=True)
                return None

    def _render_all(self, c: rl_canvas.Canvas):
        page_contents = {pid: [] for pid in self._pages}
        sorted_elements = sorted(self._elements, key=lambda e: e.z_index)
        for el in sorted_elements:
            pid = getattr(el, 'page_id', 'page-1')
            if pid not in page_contents:
                page_contents[pid] = []
            page_contents[pid].append(el)
            
        # Ensure any newly discovered pages (via import) are at the end, if not in registry
        for pid in page_contents:
            if pid not in self._pages:
                self._pages.append(pid)
                
        # We don't sort _pages here; we respect the CRUD API reorder_pages order.
        # But we do sort only if they are entirely implicit 'page-X' that were injected.
        
        for i, pid in enumerate(self._pages):
            if i > 0:
                c.showPage()
                
            for el in page_contents[pid]:
                if isinstance(el, TextElement):
                    self._draw_text(c, el)
                elif isinstance(el, ShapeElement):
                    self._draw_shape(c, el)
                elif isinstance(el, ImageElement):
                    self._draw_image(c, el)

    def _is_encodable(self, text: str, font_name: str, font_size: float) -> bool:
        try:
            stringWidth(text, font_name, font_size)
            return True
        except Exception:
            return False

    def _chunk_line(self, line: str, primary_font: str, fallback_font: str, font_size: float) -> List[tuple]:
        runs = []
        current_run = ""
        current_font = primary_font
        
        for char in line:
            if self._is_encodable(char, primary_font, font_size):
                char_font = primary_font
            else:
                char_font = fallback_font
                
            if char_font == current_font:
                current_run += char
            else:
                if current_run:
                    runs.append((current_run, current_font))
                current_run = char
                current_font = char_font
                
        if current_run:
            runs.append((current_run, current_font))
            
        return runs

    def _draw_text(self, c: rl_canvas.Canvas, el: TextElement):
        primary_font = self._resolve_font(el.font_name, el.bold, el.italic)
        fallback_font = self._resolve_font("NotoSans", el.bold, el.italic) if HAS_UNICODE_FONT else primary_font
        font_size = el.font_size
        line_height = font_size * getattr(el, 'line_height', 1.4)
            
        c.setFillColor(self._hex_to_color(el.text_color))

        lines = self._wrap_text(el.text, el.width, primary_font, fallback_font, font_size)

        current_y = el.y + el.height - ((line_height - font_size) / 2.0) - (font_size * 0.8)
        char_space = getattr(el, 'letter_spacing', 0.0)

        for line in lines:
            runs = self._chunk_line(line, primary_font, fallback_font, font_size)
            
            # calculate total line width for alignment
            line_w = 0.0
            for text, f in runs:
                try:
                    w = stringWidth(text, f, font_size)
                except Exception:
                    w = len(text) * font_size * 0.5
                line_w += w
                
            if char_space != 0 and len(line) > 1:
                line_w += (len(line) - 1) * char_space

            offset_x = 0
            if el.align == "center":
                offset_x = (el.width - line_w) / 2.0
            elif el.align == "right":
                offset_x = el.width - line_w
            
            current_x = el.x + offset_x
            
            for text, f in runs:
                t = c.beginText()
                t.setTextOrigin(current_x, current_y)
                t.setFont(f, font_size)
                if char_space != 0:
                    t.setCharSpace(char_space)
                
                try:
                    t.textOut(text)
                    c.drawText(t)
                except Exception as e:
                    logger.warning(f"Skipping rendering text segment due to encoding issue: {e}")
                    
                try:
                    w = stringWidth(text, f, font_size)
                except Exception:
                    w = len(text) * font_size * 0.5
                current_x += w + (len(text) * char_space)

            if el.underline:
                c.setLineWidth(0.5)
                # Note: current_x already includes trailing char_space for the last char, 
                # but we just draw a line over the full line_w
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
                
                p = c.beginPath()
                p.moveTo(el.x2, el.y2)
                p.lineTo(p1x, p1y)
                p.lineTo(p2x, p2y)
                p.close()
                c.setFillColor(self._hex_to_color(el.border_color))
                c.drawPath(p, fill=1, stroke=1)

        elif el.shape_type == "polygon":
            points = getattr(el, 'points', [])
            if len(points) >= 4:
                c.saveState()
                c.translate(el.x or 0, el.y or 0)
                if el.fill_color and el.fill_color != "transparent":
                    c.setFillColor(self._hex_to_color(el.fill_color))
                p = c.beginPath()
                p.moveTo(points[0], points[1])
                for i in range(2, len(points), 2):
                    p.lineTo(points[i], points[i+1])
                p.close()
                fill = 1 if el.fill_color and el.fill_color != "transparent" else 0
                stroke = 1 if el.border_width and el.border_width > 0 else 0
                c.drawPath(p, stroke=stroke, fill=fill)
                c.restoreState()

        elif el.shape_type == "path":
            path_d = getattr(el, 'path_d', '')
            if path_d:
                if el.fill_color and el.fill_color != "transparent":
                    c.setFillColor(self._hex_to_color(el.fill_color))
                p = c.beginPath()
                
                import re
                tokens = re.findall(r'[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?', path_d)
                
                i = 0
                current_x = 0.0
                current_y = 0.0
                start_x = 0.0
                start_y = 0.0
                last_cmd = None
                
                try:
                    while i < len(tokens):
                        cmd = tokens[i]
                        if not cmd.isalpha():
                            if last_cmd:
                                cmd = last_cmd
                            else:
                                i += 1
                                continue
                        else:
                            i += 1

                        last_cmd = cmd
                        cmd_upper = cmd.upper()
                        is_relative = cmd.islower()

                        if cmd_upper == 'M':
                            while i + 1 < len(tokens) and not tokens[i].isalpha():
                                nx = float(tokens[i])
                                ny = float(tokens[i+1])
                                i += 2
                                if is_relative:
                                    current_x += nx
                                    current_y += ny
                                else:
                                    current_x = nx
                                    current_y = ny
                                p.moveTo(current_x, current_y)
                                start_x, start_y = current_x, current_y
                                last_cmd = 'l' if is_relative else 'L'

                        elif cmd_upper == 'L':
                            while i + 1 < len(tokens) and not tokens[i].isalpha():
                                nx = float(tokens[i])
                                ny = float(tokens[i+1])
                                i += 2
                                if is_relative:
                                    current_x += nx
                                    current_y += ny
                                else:
                                    current_x = nx
                                    current_y = ny
                                p.lineTo(current_x, current_y)

                        elif cmd_upper == 'H':
                            while i < len(tokens) and not tokens[i].isalpha():
                                nx = float(tokens[i])
                                i += 1
                                if is_relative:
                                    current_x += nx
                                else:
                                    current_x = nx
                                p.lineTo(current_x, current_y)

                        elif cmd_upper == 'V':
                            while i < len(tokens) and not tokens[i].isalpha():
                                ny = float(tokens[i])
                                i += 1
                                if is_relative:
                                    current_y += ny
                                else:
                                    current_y = ny
                                p.lineTo(current_x, current_y)

                        elif cmd_upper == 'C':
                            while i + 5 < len(tokens) and not tokens[i].isalpha():
                                x1 = float(tokens[i]) + (current_x if is_relative else 0)
                                y1 = float(tokens[i+1]) + (current_y if is_relative else 0)
                                x2 = float(tokens[i+2]) + (current_x if is_relative else 0)
                                y2 = float(tokens[i+3]) + (current_y if is_relative else 0)
                                ex = float(tokens[i+4]) + (current_x if is_relative else 0)
                                ey = float(tokens[i+5]) + (current_y if is_relative else 0)
                                i += 6
                                p.curveTo(x1, y1, x2, y2, ex, ey)
                                current_x, current_y = ex, ey

                        elif cmd_upper == 'Q':
                            while i + 3 < len(tokens) and not tokens[i].isalpha():
                                qcx = float(tokens[i]) + (current_x if is_relative else 0)
                                qcy = float(tokens[i+1]) + (current_y if is_relative else 0)
                                qex = float(tokens[i+2]) + (current_x if is_relative else 0)
                                qey = float(tokens[i+3]) + (current_y if is_relative else 0)
                                i += 4
                                cp1_x = current_x + (2.0/3.0) * (qcx - current_x)
                                cp1_y = current_y + (2.0/3.0) * (qcy - current_y)
                                cp2_x = qex + (2.0/3.0) * (qcx - qex)
                                cp2_y = qey + (2.0/3.0) * (qcy - qey)
                                p.curveTo(cp1_x, cp1_y, cp2_x, cp2_y, qex, qey)
                                current_x, current_y = qex, qey

                        elif cmd_upper == 'Z':
                            p.close()
                            current_x, current_y = start_x, start_y
                except Exception as ex:
                    logger.warning(f"Error parsing SVG path string '{path_d[:30]}...': {ex}")

                fill = 1 if el.fill_color and el.fill_color != "transparent" else 0
                stroke = 1 if el.border_width and el.border_width > 0 else 0
                
                c.saveState()
                c.translate(el.x or 0, el.y or 0)
                c.drawPath(p, stroke=stroke, fill=fill)
                c.restoreState()

    def _draw_image(self, c: rl_canvas.Canvas, el: ImageElement):
        try:
            if not el.image_path:
                return

            c.saveState()
            
            rotation = getattr(el, 'rotation', 0)
            if rotation != 0:
                cx = el.x + el.width / 2.0
                cy = el.y + el.height / 2.0
                c.translate(cx, cy)
                c.rotate(-rotation) 
                c.translate(-cx, -cy)
                
            radius = getattr(el, 'border_radius', 0)

            if getattr(el, 'shadow', False):
                c.saveState()
                c.setFillColorRGB(0, 0, 0, alpha=0.3)
                if el.mask_shape == "circle":
                    c.circle(el.x + el.width/2 + 4, el.y + el.height/2 - 4, min(el.width, el.height)/2, fill=1, stroke=0)
                elif el.mask_shape == "rounded" or radius > 0:
                    r = radius if radius > 0 else 15
                    c.roundRect(el.x + 4, el.y - 4, el.width, el.height, r, fill=1, stroke=0)
                elif el.mask_shape == "heart":
                    pass 
                else:
                    c.rect(el.x + 4, el.y - 4, el.width, el.height, fill=1, stroke=0)
                c.restoreState()

            img_source = el.image_path
            opacity = getattr(el, 'opacity', 1.0)
            
            from reportlab.lib.utils import ImageReader
            try:
                if Image is not None:
                    if img_source.startswith("data:image"):
                        header, encoded = img_source.split(",", 1)
                        img_data = base64.b64decode(encoded)
                        img_pil = Image.open(io.BytesIO(img_data))
                    else:
                        img_pil = Image.open(img_source)
                        
                    img_pil = img_pil.convert("RGBA")
                    if opacity < 1.0:
                        alpha = img_pil.split()[3]
                        alpha = ImageEnhance.Brightness(alpha).enhance(opacity)
                        img_pil.putalpha(alpha)
                        
                    temp_io = io.BytesIO()
                    img_pil.save(temp_io, format="PNG")
                    temp_io.seek(0)
                    final_img_source = ImageReader(temp_io)
                else:
                    final_img_source = img_source
            except Exception as e:
                # User Request: "I'd either skip the element entirely (matching the decompression-bomb case...)"
                logger.error(f"Failed to process image (skipping render): {e}")
                c.restoreState()
                return

            if el.mask_shape == "circle":
                p = c.beginPath()
                p.circle(el.x + el.width/2, el.y + el.height/2, min(el.width, el.height)/2)
                c.clipPath(p, stroke=0, fill=0)
            elif el.mask_shape == "rounded":
                p = c.beginPath()
                r = radius if radius > 0 else 15
                p.roundRect(el.x, el.y, el.width, el.height, r)
                c.clipPath(p, stroke=0, fill=0)
            elif el.mask_shape == "none" and radius > 0:
                p = c.beginPath()
                p.roundRect(el.x, el.y, el.width, el.height, radius)
                c.clipPath(p, stroke=0, fill=0)

            c.drawImage(final_img_source,
                        el.x, el.y,
                        width=el.width, height=el.height,
                        preserveAspectRatio=False,
                        mask="auto")
            c.restoreState()
        except Exception as e:
            logger.error(f"draw_image error: {e}", exc_info=True)

    @staticmethod
    def _resolve_font(base: str, bold: bool, italic: bool) -> str:
        mapping = {
            "Helvetica": "Helvetica",
            "Times": "Times-Roman",
            "Times New Roman": "Times-Roman",
            "Courier": "Courier",
            "NotoSans": "NotoSans"
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
            "NotoSans": {
                (False, False): "NotoSans",
                (True, False): "NotoSans-Bold",
                (False, True): "NotoSans-Italic",
                (True, True): "NotoSans-BoldItalic",
            }
        }

        family = table.get(base, table["Helvetica"])
        return family.get((bold, italic), "Helvetica")

    def _measure_text_width(self, text: str, primary_font: str, fallback_font: str, font_size: float) -> float:
        runs = self._chunk_line(text, primary_font, fallback_font, font_size)
        w = 0.0
        for r_text, r_font in runs:
            try:
                w += stringWidth(r_text, r_font, font_size)
            except Exception:
                w += len(r_text) * font_size * 0.5
        return w

    def _find_max_fit_index(self, word: str, max_width: float, primary_font: str, fallback_font: str, font_size: float) -> int:
        # Minimum character width is at least font_size * 0.1 points.
        # Cap search window so binary search never evaluates huge text slices needlessly.
        max_possible_chars = max(10, int(max_width / max(0.5, font_size * 0.1)) + 20)
        search_word = word[:min(len(word), max_possible_chars)]

        low = 1
        high = len(search_word)
        best = 1
        while low <= high:
            mid = (low + high) // 2
            w = self._measure_text_width(search_word[:mid], primary_font, fallback_font, font_size)
            if w <= max_width:
                best = mid
                low = mid + 1
            else:
                high = mid - 1
        return best

    def _wrap_text(self, text: str, max_width: float,
                   primary_font: str, fallback_font: str, font_size: float) -> List[str]:
        result: List[str] = []
        for paragraph in text.split("\n"):
            if not paragraph.strip():
                result.append("")
                continue

            words   = paragraph.split()
            current = ""

            for word in words:
                candidate = (current + " " + word).strip()
                w = self._measure_text_width(candidate, primary_font, fallback_font, font_size)
                    
                if w <= max_width:
                    current = candidate
                else:
                    if current:
                        result.append(current)
                    
                    max_eval = max(10, int(max_width / max(0.5, font_size * 0.1)) + 20)
                    while word:
                        chunk_eval = word[:min(len(word), max_eval)]
                        if self._measure_text_width(chunk_eval, primary_font, fallback_font, font_size) <= max_width and len(word) <= max_eval:
                            current = word
                            word = ""
                            break

                        k = self._find_max_fit_index(word, max_width, primary_font, fallback_font, font_size)
                        if k == 1 and self._measure_text_width(word[:1], primary_font, fallback_font, font_size) > max_width:
                            result.append(word[:1])
                            word = word[1:]
                        else:
                            result.append(word[:k])
                            word = word[k:]
                            
                    continue

            if current:
                result.append(current)

        return result

    @staticmethod
    def _hex_to_color(hex_color: Any) -> 'Color':
        if not hex_color:
            return Color(0, 0, 0, 1)
            
        try:
            h = str(hex_color).strip().lower()
            if h in ("transparent", "none"):
                return Color(0, 0, 0, 0)
            
            if h.startswith("rgba("):
                parts = h.replace("rgba(", "").replace(")", "").split(",")
                if len(parts) >= 4:
                    return Color(
                        float(parts[0].strip()) / 255.0,
                        float(parts[1].strip()) / 255.0,
                        float(parts[2].strip()) / 255.0,
                        float(parts[3].strip())
                    )
            elif h.startswith("rgb("):
                parts = h.replace("rgb(", "").replace(")", "").split(",")
                if len(parts) >= 3:
                    return Color(
                        float(parts[0].strip()) / 255.0,
                        float(parts[1].strip()) / 255.0,
                        float(parts[2].strip()) / 255.0,
                        1.0
                    )
            
            if not h.startswith("#"):
                h = "#" + h
                
            h = h[1:]
            if len(h) == 3:
                h = h[0]*2 + h[1]*2 + h[2]*2 + "ff"
            elif len(h) == 4:
                h = h[0]*2 + h[1]*2 + h[2]*2 + h[3]*2
            elif len(h) == 6:
                h = h + "ff"
                
            if len(h) == 8:
                r = int(h[0:2], 16) / 255.0
                g = int(h[2:4], 16) / 255.0
                b = int(h[4:6], 16) / 255.0
                a = int(h[6:8], 16) / 255.0
                return Color(r, g, b, a)
        except Exception as e:
            logger.warning(f"Invalid color format '{hex_color}': {e}. Falling back to default black.")
            
        return Color(0, 0, 0, 1)

    @staticmethod
    def _dict_to_element(item: Dict[str, Any]):
        if not isinstance(item, dict):
            raise ValueError("Element state item must be a dictionary")
        d     = dict(item)
        etype = d.get("element_type") or d.pop("type", None)

        if etype == "text":
            valid = {f.name for f in dataclasses.fields(TextElement)}
            kwargs = {k: v for k, v in d.items() if k in valid}
            if "id" not in kwargs:
                kwargs["id"] = "text_0"
            if "x" not in kwargs or kwargs["x"] is None:
                kwargs["x"] = 0.0
            if "y" not in kwargs or kwargs["y"] is None:
                kwargs["y"] = 0.0
            if "text" not in kwargs:
                kwargs["text"] = ""
            return TextElement(**kwargs)

        if etype in ("shape", "rectangle", "circle", "line", "arrow", "polygon", "path"):
            valid = {f.name for f in dataclasses.fields(ShapeElement)}
            kwargs = {k: v for k, v in d.items() if k in valid}
            if "id" not in kwargs:
                kwargs["id"] = "shape_0"
            if "x" not in kwargs or kwargs["x"] is None:
                kwargs["x"] = 0.0
            if "y" not in kwargs or kwargs["y"] is None:
                kwargs["y"] = 0.0
            if "shape_type" not in kwargs:
                kwargs["shape_type"] = etype if etype in ("rectangle", "circle", "line", "arrow", "polygon", "path") else "rectangle"
            return ShapeElement(**kwargs)

        if etype == "image":
            valid = {f.name for f in dataclasses.fields(ImageElement)}
            kwargs = {k: v for k, v in d.items() if k in valid}
            if "id" not in kwargs:
                kwargs["id"] = "image_0"
            if "x" not in kwargs or kwargs["x"] is None:
                kwargs["x"] = 0.0
            if "y" not in kwargs or kwargs["y"] is None:
                kwargs["y"] = 0.0
            if "image_path" not in kwargs:
                kwargs["image_path"] = ""
            return ImageElement(**kwargs)

        raise ValueError(f"Unknown element_type: '{etype}'")

