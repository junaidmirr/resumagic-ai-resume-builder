export interface ElementBase {
  id: string;
  element_type: 'text' | 'shape' | 'image';
  x: number;
  y: number;
  z_index: number;
  groupId?: string;
  locked?: boolean;
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
  width?: number;
  height?: number;
}

export interface ShapeElement extends ElementBase {
  element_type: 'shape';
  shape_type: 'rectangle' | 'circle' | 'line' | 'arrow';
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
}

export type EditorElement = TextElement | ShapeElement | ImageElement;
