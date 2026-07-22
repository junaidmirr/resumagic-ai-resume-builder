import React from "react";

export const MiniPreview = ({ elements, scale = 0.22 }: { elements?: any[]; scale?: number }) => {

  if (!elements || !Array.isArray(elements)) {
    return (
      <div
        className="relative bg-white shadow-sm overflow-hidden rounded mx-auto pointer-events-none"
        style={{ width: 612 * scale, height: 792 * scale }}
      />
    );
  }

  return (
    <div 
      className="relative bg-white shadow-sm overflow-hidden rounded mx-auto pointer-events-none"
      style={{ width: 612 * scale, height: 792 * scale }}
    >
      {elements.map((el, i) => {
        if (!el) return null;

        const x = Number.isNaN(Number(el.x)) ? 0 : Number(el.x);
        const y = Number.isNaN(Number(el.y)) ? 0 : Number(el.y);
        const width = Number.isNaN(Number(el.width)) ? 100 : Number(el.width);
        const height = Number.isNaN(Number(el.height)) ? 20 : Number(el.height);
        const zIndex = el.z_index ?? 1;

        if (el.element_type === "shape" && el.shape_type === "rectangle") {
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x * scale,
                bottom: y * scale,
                width: width * scale,
                height: height * scale,
                backgroundColor: el.fill_color || "transparent",
                border: el.border_width ? `${el.border_width * scale}px solid ${el.border_color || "#000"}` : "none",
                borderRadius: el.border_radius ? el.border_radius * scale : 0,
                zIndex,
              }}
            />
          );
        }

        if (el.element_type === "shape" && el.shape_type === "line") {
          const x2 = Number.isNaN(Number(el.x2)) ? x : Number(el.x2);
          const minX = Math.min(x, x2);
          const bw = Math.abs(x2 - x) || 1;
          const bh = (Number(el.border_width) || 1);

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: minX * scale,
                bottom: y * scale,
                width: bw * scale,
                height: bh * scale,
                backgroundColor: el.border_color || "#000",
                zIndex,
              }}
            />
          );
        }

        if (el.element_type === "shape" && el.shape_type === "circle") {
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x * scale,
                bottom: y * scale,
                width: width * scale,
                height: width * scale,
                backgroundColor: el.fill_color || "transparent",
                borderRadius: "50%",
                border: el.border_width ? `${el.border_width * scale}px solid ${el.border_color || "#000"}` : "none",
                zIndex,
              }}
            />
          );
        }

        if (el.element_type === "shape" && (el.shape_type === "path" || el.shape_type === "polygon")) {
          const pts = Array.isArray(el.points)
            ? el.points.filter((p: any) => !Number.isNaN(Number(p))).join(" ")
            : (typeof el.points === "string" ? el.points : "");

          return (
            <svg
              key={i}
              style={{
                position: "absolute",
                left: 0,
                bottom: 0,
                width: 612 * scale,
                height: 792 * scale,
                zIndex,
                overflow: "visible",
              }}
            >
              <g transform={`scale(1, -1) translate(${x}, -${792 - y})`}>
                {el.shape_type === "path" ? (
                  <path
                    d={el.path_d || ""}
                    fill={el.fill_color || "transparent"}
                    stroke={el.border_color || "none"}
                    strokeWidth={el.border_width || 0}
                  />
                ) : (
                  <polygon
                    points={pts}
                    fill={el.fill_color || "transparent"}
                    stroke={el.border_color || "none"}
                    strokeWidth={el.border_width || 0}
                  />
                )}
              </g>
            </svg>
          );
        }

        if (el.element_type === "text") {
          const fontSize = (Number(el.font_size) || 12) * scale;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x * scale,
                bottom: y * scale,
                width: width * scale,
                height: height * scale,
                fontSize,
                color: el.text_color || "#000",
                fontWeight: el.bold ? "bold" : "normal",
                fontStyle: el.italic ? "italic" : "normal",
                textAlign: (el.align as any) || "left",
                lineHeight: el.line_height || 1,
                overflow: "hidden",
                whiteSpace: "pre-wrap",
                zIndex,
              }}
            >
              {el.text || ""}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};
