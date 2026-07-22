export interface Page {
  id: string;
  width: number;
  height: number;
}

export interface ElementBase {
  id: string;
  element_type: 'text' | 'shape' | 'image';
  page_id?: string;
  x: number;
  y: number;
  z_index: number;
  groupId?: string;
  locked?: boolean;
  rotation?: number;
  opacity?: number;
}

export interface TextElement extends ElementBase {
  element_type: 'text';
  text: string;
  font_size?: number;
  font_name?: string;
  text_color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right' | 'justify';
  line_height?: number;
  letter_spacing?: number;
  width?: number;
  height?: number;
}

export interface ShapeElement extends ElementBase {
  element_type: 'shape';
  shape_type: 'rectangle' | 'circle' | 'line' | 'arrow' | 'path' | 'polygon';
  width?: number;
  height?: number;
  fill_color?: string;
  border_color?: string;
  border_width?: number;
  border_radius?: number;
  x2?: number;
  y2?: number;
  control_x?: number; // Quadratic Bezier control point X
  control_y?: number; // Quadratic Bezier control point Y
  path_d?: string; // For custom SVG paths (e.g. bezier waves)
  points?: number[]; // For polygons: [x1, y1, x2, y2, ...]
}

export interface ImageElement extends ElementBase {
  element_type: 'image';
  width: number;
  height: number;
  image_path: string;
  is_icon?: boolean;
  icon_name?: string;
  emoji_char?: string;
  border_color?: string;
  mask_shape?: 'circle' | 'rounded' | 'heart' | 'none';
  remove_bg?: boolean;
  opacity?: number;
  shadow?: boolean;
  rotation?: number;
  border_radius?: number;
}

export type EditorElement = TextElement | ShapeElement | ImageElement;

export interface AIFixItem {
  id: string;
  title: string;
  description: string;
  target_field?: string;
  suggested_value?: string;
  target_element_id?: string;
}

export interface AIResponsePayload {
  status: 'success' | 'rejected' | 'error';
  result?: string;
  reason?: string;
  fixes?: AIFixItem[];
  error?: string;
}
