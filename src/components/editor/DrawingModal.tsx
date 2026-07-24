import React, { useState, useRef } from "react";
import { 
  X, 
  RotateCcw, 
  Trash2, 
  Check, 
  PenTool, 
  Highlighter, 
  Sparkles, 
  Scissors, 
  Feather,
  Eraser
} from "lucide-react";

export type PenType = "pen" | "highlighter" | "neon" | "dashed" | "calligraphy";

interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  size: number;
  opacity: number;
  penType: PenType;
  pathD: string;
}

interface DrawingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (drawingData: {
    path_d: string;
    border_color: string;
    border_width: number;
    opacity: number;
    pen_type: PenType;
    x: number;
    y: number;
    width: number;
    height: number;
  }) => void;
}

const PRESET_COLORS = [
  "#000000",
  "#ffffff",
  "#ef4444",
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
];

export function DrawingModal({ isOpen, onClose, onSave }: DrawingModalProps) {
  const [penType, setPenType] = useState<PenType>("pen");
  const [penColor, setPenColor] = useState("#000000");
  const [penSize, setPenSize] = useState(4);
  const [penOpacity, setPenOpacity] = useState(1);
  const [isEraser, setIsEraser] = useState(false);

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);

  if (!isOpen) return null;

  // Convert array of points into smooth Quadratic Bezier SVG path data
  const pointsToPathD = (pts: { x: number; y: number }[]): string => {
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y} L ${pts[0].x + 0.1} ${pts[0].y + 0.1}`;

    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2;
      const yc = (pts[i].y + pts[i + 1].y) / 2;
      d += ` Q ${pts[i].x} ${pts[i].y}, ${xc} ${yc}`;
    }
    d += ` L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;
    return d;
  };

  const getSVGCoordinates = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 612;
    const y = ((e.clientY - rect.top) / rect.height) * 792;
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  };

  const startPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const pt = getSVGCoordinates(e);
    setIsDrawing(true);
    setCurrentPoints([pt]);
  };

  const movePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawing) return;
    const pt = getSVGCoordinates(e);
    setCurrentPoints((prev) => [...prev, pt]);
  };

  const endPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPoints.length > 0) {
      if (isEraser) {
        const lastPt = currentPoints[currentPoints.length - 1];
        setStrokes((prev) =>
          prev.filter((s) =>
            !s.points.some((p) => Math.hypot(p.x - lastPt.x, p.y - lastPt.y) < penSize * 2)
          )
        );
      } else {
        const pathD = pointsToPathD(currentPoints);
        const opacityToUse = penType === "highlighter" ? 0.45 : penOpacity;
        const newStroke: Stroke = {
          points: currentPoints,
          color: penColor,
          size: penSize,
          opacity: opacityToUse,
          penType,
          pathD,
        };
        setStrokes((prev) => [...prev, newStroke]);
      }
    }
    setCurrentPoints([]);
  };

  const handleUndo = () => setStrokes((prev) => prev.slice(0, -1));

  const handleClear = () => {
    setStrokes([]);
    setCurrentPoints([]);
  };

  const handleSave = () => {
    if (strokes.length === 0) {
      onClose();
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    strokes.forEach((st) => {
      st.points.forEach((p) => {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      });
    });

    const pad = 10;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(612, maxX + pad);
    maxY = Math.min(792, maxY + pad);

    const width = Math.max(30, maxX - minX);
    const height = Math.max(30, maxY - minY);

    const combinedPathD = strokes.map((s) => s.pathD).join(" ");
    const primaryStroke = strokes[strokes.length - 1];

    onSave({
      path_d: combinedPathD,
      border_color: primaryStroke.color,
      border_width: primaryStroke.size,
      opacity: primaryStroke.opacity,
      pen_type: primaryStroke.penType,
      x: minX,
      y: minY,
      width,
      height,
    });

    onClose();
  };

  const renderStrokeElement = (st: Stroke, idx: number) => {
    const strokeDash = st.penType === "dashed" ? `${st.size * 2},${st.size * 1.5}` : undefined;
    const filterStyle = st.penType === "neon" ? `drop-shadow(0 0 6px ${st.color})` : undefined;

    return (
      <path
        key={idx}
        d={st.pathD}
        fill="none"
        stroke={st.color}
        strokeWidth={st.size}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={strokeDash}
        opacity={st.opacity}
        style={{
          filter: filterStyle,
          mixBlendMode: st.penType === "highlighter" ? "multiply" : "normal",
        }}
      />
    );
  };

  const currentPathD = pointsToPathD(currentPoints);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-app-surface border border-app-border rounded-2xl sm:rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Compact Header */}
        <div className="py-2.5 px-4 border-b border-app-border flex items-center justify-between bg-app-surface shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <PenTool size={16} />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-app-text">Freehand Vector Studio</h3>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleUndo}
              disabled={strokes.length === 0}
              title="Undo Stroke"
              className="p-1.5 rounded-lg bg-app-bg hover:bg-slate-200 dark:hover:bg-slate-800 text-app-text-secondary disabled:opacity-30 transition-colors"
            >
              <RotateCcw size={15} />
            </button>
            <button
              onClick={handleClear}
              disabled={strokes.length === 0 && currentPoints.length === 0}
              title="Clear All"
              className="p-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 disabled:opacity-30 transition-colors"
            >
              <Trash2 size={15} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-app-text-muted hover:text-app-text transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Compact Ergonomic Control Bar */}
        <div className="p-2.5 border-b border-app-border bg-app-surface/60 space-y-2 shrink-0">
          {/* Row 1: Pen Type Pills */}
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-0.5">
            {[
              { type: "pen", label: "Pen", icon: PenTool },
              { type: "highlighter", label: "Marker", icon: Highlighter },
              { type: "neon", label: "Glow", icon: Sparkles },
              { type: "dashed", label: "Dashed", icon: Scissors },
              { type: "calligraphy", label: "Chisel", icon: Feather },
            ].map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => {
                  setPenType(type as PenType);
                  setIsEraser(false);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                  !isEraser && penType === type
                    ? "bg-teal-500 text-white shadow-sm"
                    : "bg-app-bg text-app-text-muted hover:text-app-text border border-app-border"
                }`}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}

            <button
              onClick={() => setIsEraser(!isEraser)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                isEraser
                  ? "bg-red-500 text-white shadow-sm"
                  : "bg-app-bg text-app-text-muted hover:text-app-text border border-app-border"
              }`}
            >
              <Eraser size={12} />
              Eraser
            </button>
          </div>

          {/* Row 2: Sliders & Color Palette */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-app-border/40 text-[11px]">
            {/* Size Slider */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-400">Size:</span>
              <input
                type="range"
                min={1}
                max={36}
                value={penSize}
                onChange={(e) => setPenSize(Number(e.target.value))}
                className="w-16 sm:w-24 accent-teal-500 cursor-pointer"
              />
              <span className="font-mono font-bold text-app-text w-6 text-right">{penSize}px</span>
            </div>

            {/* Opacity Slider */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-400">Opacity:</span>
              <input
                type="range"
                min={0.1}
                max={1.0}
                step={0.05}
                value={penOpacity}
                onChange={(e) => setPenOpacity(Number(e.target.value))}
                className="w-16 sm:w-20 accent-teal-500 cursor-pointer"
              />
              <span className="font-mono font-bold text-app-text w-8 text-right">{Math.round(penOpacity * 100)}%</span>
            </div>

            {/* Color Swatches & Picker */}
            <div className="flex items-center gap-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setPenColor(c);
                    setIsEraser(false);
                  }}
                  className={`w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 transition-transform ${
                    penColor === c && !isEraser ? "scale-125 ring-2 ring-teal-500" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={penColor}
                onChange={(e) => {
                  setPenColor(e.target.value);
                  setIsEraser(false);
                }}
                className="w-5 h-5 rounded-full border-0 cursor-pointer bg-transparent"
                title="Custom Color"
              />
            </div>
          </div>
        </div>

        {/* Compact Drawing Surface Bounding Container */}
        <div className="flex-1 min-h-0 p-3 sm:p-4 flex items-center justify-center bg-slate-950/70 overflow-hidden relative">
          <div className="aspect-[612/792] max-h-full max-w-full bg-white shadow-2xl rounded-xl relative border border-slate-200 overflow-hidden select-none">
            <svg
              ref={svgRef}
              viewBox="0 0 612 792"
              className="w-full h-full cursor-crosshair touch-none select-none"
              onPointerDown={startPointerDown}
              onPointerMove={movePointer}
              onPointerUp={endPointerUp}
              onPointerCancel={endPointerUp}
            >
              {/* Subtle Grid Background */}
              <defs>
                <pattern id="draw-grid-sm" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#f1f5f9" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#draw-grid-sm)" />

              {/* Render Saved Strokes */}
              {strokes.map((st, idx) => renderStrokeElement(st, idx))}

              {/* Render Active Stroke */}
              {isDrawing && currentPoints.length > 0 && (
                <path
                  d={currentPathD}
                  fill="none"
                  stroke={isEraser ? "#ef4444" : penColor}
                  strokeWidth={penSize}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={penType === "dashed" ? `${penSize * 2},${penSize * 1.5}` : undefined}
                  opacity={penType === "highlighter" ? 0.45 : penOpacity}
                  style={{
                    filter: penType === "neon" ? `drop-shadow(0 0 6px ${penColor})` : undefined,
                    mixBlendMode: penType === "highlighter" ? "multiply" : "normal",
                  }}
                />
              )}
            </svg>
          </div>
        </div>

        {/* Compact Footer Action Bar */}
        <div className="py-2.5 px-4 border-t border-app-border flex items-center justify-between bg-app-surface shrink-0">
          <span className="text-[11px] text-app-text-muted font-medium">
            {strokes.length} stroke{strokes.length === 1 ? "" : "s"}
          </span>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-app-border hover:bg-app-bg text-app-text text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={strokes.length === 0}
              className="px-5 py-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-xs font-bold transition-all shadow-md shadow-teal-500/20 disabled:opacity-40 flex items-center gap-1.5"
            >
              <Check size={14} />
              Add to Resume
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
