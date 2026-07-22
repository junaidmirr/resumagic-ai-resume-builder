import { useState } from "react";
import type { Template } from "../../lib/templates";

interface Props {
  template: Template;
  className?: string;
}

export function TemplateThumbnailPreview({ template, className = "" }: Props) {
  const [imgError, setImgError] = useState(false);

  if (template.thumbnailUrl && !imgError) {
    return (
      <img
        src={template.thumbnailUrl}
        alt={template.name}
        onError={() => setImgError(true)}
        className={`w-full h-full object-contain rounded-lg shadow-sm border border-app-border ${className}`}
      />
    );
  }

  // Dynamic Mini-Canvas Preview fallback from elements
  const rawElements = template.generateElements ? template.generateElements() : [];
  // Sort elements by z_index so background shapes render first, then lines and text on top
  const elements = [...rawElements].sort((a, b) => (a.z_index || 0) - (b.z_index || 0));
  
  const svgWidth = 612;
  const svgHeight = 792;

  // Find page background color if specified, default to white
  const bgShape = elements.find(
    (el) => el.element_type === "shape" && el.shape_type === "rectangle" && (el.width || 0) >= 600 && (el.height || 0) >= 700
  );
  const bgColor = bgShape ? bgShape.fill_color || "#FFFFFF" : "#FFFFFF";

  return (
    <div className={`w-full h-full bg-slate-900 rounded-lg overflow-hidden relative shadow-md border border-app-border ${className}`}>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <rect width={svgWidth} height={svgHeight} fill={bgColor} />

        {elements.map((el, i) => {
          const key = el.id || `el-${i}`;
          const elHeight = el.height || 10;
          const svgY = svgHeight - (el.y || 0) - elHeight;

          if (el.element_type === "shape") {
            if (el.shape_type === "rectangle") {
              return (
                <rect
                  key={key}
                  x={el.x || 0}
                  y={svgY}
                  width={el.width || 10}
                  height={elHeight}
                  fill={el.fill_color || "transparent"}
                  stroke={el.border_color || "none"}
                  strokeWidth={el.border_width || 0}
                  rx={el.border_radius || 0}
                />
              );
            }
            if (el.shape_type === "circle") {
              const r = (el.width || 10) / 2;
              return (
                <circle
                  key={key}
                  cx={(el.x || 0) + r}
                  cy={svgY + r}
                  r={r}
                  fill={el.fill_color || "transparent"}
                  stroke={el.border_color || "none"}
                  strokeWidth={el.border_width || 0}
                />
              );
            }
            if (el.shape_type === "line") {
              const y1 = svgHeight - (el.y || 0);
              const y2 = svgHeight - (el.y2 !== undefined ? el.y2 : el.y || 0);
              return (
                <line
                  key={key}
                  x1={el.x || 0}
                  y1={y1}
                  x2={el.x2 !== undefined ? el.x2 : el.x || 0}
                  y2={y2}
                  stroke={el.border_color || "#CBD5E1"}
                  strokeWidth={el.border_width || 1.5}
                />
              );
            }
            if (el.shape_type === "path" && el.path_d) {
              return (
                <path
                  key={key}
                  d={el.path_d}
                  fill={el.fill_color || "transparent"}
                  stroke={el.border_color || "none"}
                  strokeWidth={el.border_width || 0}
                />
              );
            }
          }

          if (el.element_type === "text" && el.text) {
            const textY = svgY + (el.font_size || 12);
            return (
              <text
                key={key}
                x={
                  el.align === "center"
                    ? (el.x || 0) + (el.width || 100) / 2
                    : el.align === "right"
                    ? (el.x || 0) + (el.width || 100)
                    : el.x || 0
                }
                y={textY}
                fill={el.text_color || "#1E293B"}
                fontSize={el.font_size || 12}
                fontWeight={el.bold ? "bold" : "normal"}
                textAnchor={
                  el.align === "center"
                    ? "middle"
                    : el.align === "right"
                    ? "end"
                    : "start"
                }
                style={{
                  fontFamily: el.font_name?.includes("Times")
                    ? "Times New Roman, serif"
                    : el.font_name?.includes("Courier")
                    ? "Courier New, monospace"
                    : "sans-serif"
                }}
              >
                {el.text.length > 45 ? `${el.text.slice(0, 45)}...` : el.text}
              </text>
            );
          }

          return null;
        })}
      </svg>
    </div>
  );
}

export default TemplateThumbnailPreview;
