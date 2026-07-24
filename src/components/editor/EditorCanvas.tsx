import {
  useState,
  useRef,
  useEffect,
  type PointerEvent as ReactPointerEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { EditorElement, Page } from "../../types/editor";
import * as Lucide from "lucide-react";
import { Sparkles, Loader2 } from "lucide-react";

interface EditorCanvasProps {
  elements: EditorElement[];
  setElements: Dispatch<SetStateAction<EditorElement[]>>;
  pages: Page[];
  activePageId: string;
  setActivePageId: (id: string) => void;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  pageWidth: number;
  pageHeight: number;
  onSnapshot: () => void;
  zoom?: number;
  snapEnabled?: boolean;
  isGroupingMode?: boolean;
  processingIds: string[];
  onContextMenu?: (e: React.MouseEvent, elId: string | null) => void;
}

const MIN_DIM_PDF = 10;
const HANDLE_SIZE = 8;
const HANDLE_OFFSET = -HANDLE_SIZE / 2;

export function EditorCanvas({
  elements,
  setElements,
  pages = [{ id: "page-1", width: 612, height: 792 }],
  activePageId = "page-1",
  setActivePageId = () => {},
  selectedIds,
  setSelectedIds,
  pageWidth,
  pageHeight,
  onSnapshot,
  zoom = 100,
  snapEnabled = true,
  isGroupingMode = false,
  processingIds,
  onContextMenu,
}: EditorCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  // baseScale = scale that fits the page into the wrapper at 100% zoom
  const [baseScale, setBaseScale] = useState<number | null>(null);

  const [action, setAction] = useState<"move" | "resize" | null>(null);
  const [handleType, setHandleType] = useState("");
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [origEls, setOrigEls] = useState<EditorElement[]>([]);
  const [snapTargets, setSnapTargets] = useState<{ x: number[]; y: number[] }>({
    x: [],
    y: [],
  });
  const [guides, setGuides] = useState<{ axis: "x" | "y"; coord: number }[]>(
    [],
  );
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Local state for dragging to prevent full app re-renders
  const [localElements, setLocalElements] = useState<EditorElement[]>(elements);
  const localElementsRef = useRef<EditorElement[]>(elements);
  
  useEffect(() => {
    // Only sync if not actively dragging, to avoid stuttering
    if (!action) {
      setLocalElements(elements);
      localElementsRef.current = elements;
    }
  }, [elements, action]);

  // ── Measure wrapper → baseScale ───────────────────────────
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const compute = (width: number, height: number) => {
      if (width === 0 || height === 0) return;
      const pad = 32;
      const sx = (width - pad) / pageWidth;
      const sy = (height - pad) / pageHeight;
      setBaseScale(Math.min(sx, sy));
    };

    const rect = wrapper.getBoundingClientRect();
    compute(rect.width, rect.height);

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        compute(width, height);
      }
    });
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [pageWidth, pageHeight]);

  // Final scale = base × zoom factor
  // baseScale already fits the page; zoom% multiplies on top of that
  const scale = baseScale === null ? null : baseScale * (zoom / 100);

  // ── Pointer handlers ──────────────────────────────────────
  const startDrag = (e: ReactPointerEvent, el: EditorElement) => {
    e.stopPropagation();
    if (el.locked) return; // Prevent interaction if locked

    let nextIds = [...selectedIds];
    if (e.shiftKey || isGroupingMode) {
      if (nextIds.includes(el.id)) {
        nextIds = nextIds.filter((id) => id !== el.id);
      } else {
        nextIds.push(el.id);
      }
    } else {
      if (!selectedIds.includes(el.id)) {
        nextIds = [el.id];
      }
    }

    // Expand selection to include whole groups
    const expanded = new Set<string>();
    nextIds.forEach((id) => {
      const item = localElements.find((x) => x.id === id);
      if (item?.groupId) {
        localElements
          .filter((x) => x.groupId === item.groupId)
          .forEach((g) => expanded.add(g.id));
      } else {
        expanded.add(id);
      }
    });
    const finalIds = Array.from(expanded);
    setSelectedIds(finalIds);

    if (snapEnabled) {
      const xT: number[] = [pageWidth / 2];
      const yT: number[] = [pageHeight / 2];
      localElements.forEach((x) => {
        if (finalIds.includes(x.id)) return;
        const ew = (x as any).width || 100;
        const eh = (x as any).height || 100;
        xT.push(x.x, x.x + ew / 2, x.x + ew);
        yT.push(x.y, x.y + eh / 2, x.y + eh);
      });
      setSnapTargets({ x: xT, y: yT });
    }

    onSnapshot();
    setAction("move");
    setOrigEls(localElements.filter((x) => finalIds.includes(x.id)));
    setDragStart({ x: e.clientX, y: e.clientY });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const startResize = (
    e: ReactPointerEvent,
    el: EditorElement,
    handle: string,
  ) => {
    e.stopPropagation();
    if (el.locked) return; // Prevent interaction if locked
    setSelectedIds([el.id]); // Resize stays single-element for now or group-aware late
    if (snapEnabled) {
      const xT: number[] = [pageWidth / 2];
      const yT: number[] = [pageHeight / 2];
      localElements.forEach((x) => {
        if (x.id === el.id) return;
        const ew = (x as any).width || 100;
        const eh = (x as any).height || 100;
        xT.push(x.x, x.x + ew / 2, x.x + ew);
        yT.push(x.y, x.y + eh / 2, x.y + eh);
      });
      setSnapTargets({ x: xT, y: yT });
    }

    onSnapshot();
    setAction("resize");
    setHandleType(handle);
    setOrigEls([el]);
    setDragStart({ x: e.clientX, y: e.clientY });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: ReactPointerEvent) => {
    if (!action || origEls.length === 0 || scale === null) return;
    const dpx = (e.clientX - dragStart.x) / scale;
    const dpy = -(e.clientY - dragStart.y) / scale;

    if (action === "move") {
      // For snapping, we use the "primary" element (the one we clicked first/last)
      // or just the first in origEls.
      const primaryOrig = origEls[0];
      let nx = primaryOrig.x + dpx;
      let ny = primaryOrig.y + dpy;
      const nw = (primaryOrig as any).width || 100;
      const nh = (primaryOrig as any).height || 100;

      let newGuides: { axis: "x" | "y"; coord: number }[] = [];
      if (snapEnabled) {
        const threshold = 5 / scale;
        
        const myX = [nx, nx + nw / 2, nx + nw];
        const myY = [ny, ny + nh / 2, ny + nh];

        let bestX = nx;
        let minDx = Infinity;
        let snapXCoord = -1;
        for (const t of snapTargets.x) {
          for (let i = 0; i < 3; i++) {
            const d = Math.abs(myX[i] - t);
            if (d < threshold && d < minDx) {
              minDx = d;
              snapXCoord = t;
              bestX = i === 0 ? t : i === 1 ? t - nw / 2 : t - nw;
            }
          }
        }
        if (minDx < Infinity) {
          nx = bestX;
          newGuides.push({ axis: "x", coord: snapXCoord });
        }

        let bestY = ny;
        let minDy = Infinity;
        let snapYCoord = -1;
        for (const t of snapTargets.y) {
          for (let i = 0; i < 3; i++) {
            const d = Math.abs(myY[i] - t);
            if (d < threshold && d < minDy) {
              minDy = d;
              snapYCoord = t;
              bestY = i === 0 ? t : i === 1 ? t - nh / 2 : t - nh;
            }
          }
        }
        if (minDy < Infinity) {
          ny = bestY;
          newGuides.push({ axis: "y", coord: snapYCoord });
        }
      }
      setGuides(newGuides);

      // Re-calculate final DPX/DPY after snapping
      const finalDpx = nx - primaryOrig.x;
      const finalDpy = ny - primaryOrig.y;

      setLocalElements((prev) => {
        const nextState = prev.map((el) => {
          const orig = origEls.find((x) => x.id === el.id);
          if (!orig) return el;

          const nex = orig.x + finalDpx;
          const ney = orig.y + finalDpy;

          if (el.element_type === "shape" && (el.shape_type === "line" || el.shape_type === "arrow")) {
            return {
              ...el,
              x: nex,
              y: ney,
              x2: (orig as any).x2 + finalDpx,
              y2: (orig as any).y2 + finalDpy,
              control_x:
                (orig as any).control_x !== undefined
                  ? (orig as any).control_x + finalDpx
                  : undefined,
              control_y:
                (orig as any).control_y !== undefined
                  ? (orig as any).control_y + finalDpy
                  : undefined,
            };
          }
          return { ...el, x: nex, y: ney };
        });
        localElementsRef.current = nextState;
        return nextState;
      });
    } else {
      doResize(origEls[0], dpx, dpy, handleType, e.shiftKey);
    }
  };

  const doResize = (o: any, dpx: number, dpy: number, handle: string, shiftKey: boolean = false) => {
    setLocalElements((prev) => {
      const nextState = prev.map((el) => {
        if (el.id !== o.id) return el;
        const copy = { ...el } as any;

        if (copy.element_type === "shape" && (copy.shape_type === "line" || copy.shape_type === "arrow")) {
          if (handle === "start") {
            copy.x = o.x + dpx;
            copy.y = o.y + dpy;
          } else if (handle === "end") {
            copy.x2 = o.x2 + dpx;
            copy.y2 = o.y2 + dpy;
          } else if (handle === "bezier") {
            copy.control_x = (o.control_x ?? (o.x + o.x2) / 2) + dpx;
            copy.control_y = (o.control_y ?? (o.y + o.y2) / 2) + dpy;
          }

          if (shiftKey && (handle === "start" || handle === "end")) {
            const dx = copy.x2 - copy.x;
            const dy = copy.y2 - copy.y;
            const angle = Math.atan2(dy, dx);
            const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (handle === "end") {
                copy.x2 = copy.x + Math.cos(snapAngle) * dist;
                copy.y2 = copy.y + Math.sin(snapAngle) * dist;
            } else {
                copy.x = copy.x2 - Math.cos(snapAngle) * dist;
                copy.y = copy.y2 - Math.sin(snapAngle) * dist;
            }
          }
          return copy;
        }

        if (copy.element_type === "shape" && copy.shape_type === "circle") {
          const orig_d = o.width || 100;
          let delta = 0;
          if (["mr", "br", "tr"].includes(handle)) delta = dpx;
          else if (["ml", "bl", "tl"].includes(handle)) delta = -dpx;
          else if (handle === "bm") delta = -dpy;
          else delta = dpy;
          const nd = Math.max(MIN_DIM_PDF, orig_d + delta * 2);
          copy.width = nd;
          copy.height = nd;
          return copy;
        }

        let nx = o.x,
          ny = o.y;
        let nw = o.width || 100,
          nh = o.height || 100;

        if (["tl", "ml", "bl"].includes(handle)) {
          let rw = nw - dpx;
          if (rw < MIN_DIM_PDF) {
            nx = o.x + (nw - MIN_DIM_PDF);
            rw = MIN_DIM_PDF;
          } else nx = o.x + dpx;
          nw = rw;
        }
        if (["tr", "mr", "br"].includes(handle))
          nw = Math.max(MIN_DIM_PDF, nw + dpx);
        if (["bl", "bm", "br"].includes(handle)) {
          let rh = nh - dpy;
          if (rh < MIN_DIM_PDF) {
            ny = o.y + (nh - MIN_DIM_PDF);
            rh = MIN_DIM_PDF;
          } else ny = o.y + dpy;
          nh = rh;
        }
        if (["tl", "tm", "tr"].includes(handle))
          nh = Math.max(MIN_DIM_PDF, nh + dpy);

        copy.x = nx;
        copy.y = ny;
        copy.width = nw;
        copy.height = nh;
        return copy;
      });
      localElementsRef.current = nextState;
      return nextState;
    });
  };

  const handlePointerUp = (e: ReactPointerEvent) => {
    if (action) {
      setElements(localElementsRef.current);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setAction(null);
      setHandleType("");
      setOrigEls([]);
      setGuides([]);
    }
  };

  // ── Handles ───────────────────────────────────────────────
  const renderHandles = (el: EditorElement) => {
    if (!selectedIds.includes(el.id)) return null;
    if (el.element_type === "shape" && el.shape_type === "line") return null;

    const hCls = `absolute bg-teal-500 border-2 border-white shadow-md z-50 rounded-sm
                  hover:bg-teal-300 active:bg-teal-600 transition-colors touch-none`;
    const s = { width: HANDLE_SIZE, height: HANDLE_SIZE };

    return (
      <>
        <div
          onPointerDown={(e) => startResize(e, el, "tl")}
          className={`${hCls} cursor-nwse-resize`}
          style={{ ...s, top: HANDLE_OFFSET, left: HANDLE_OFFSET }}
        />
        <div
          onPointerDown={(e) => startResize(e, el, "tm")}
          className={`${hCls} cursor-ns-resize`}
          style={{
            ...s,
            top: HANDLE_OFFSET,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        />
        <div
          onPointerDown={(e) => startResize(e, el, "tr")}
          className={`${hCls} cursor-nesw-resize`}
          style={{ ...s, top: HANDLE_OFFSET, right: HANDLE_OFFSET }}
        />
        <div
          onPointerDown={(e) => startResize(e, el, "ml")}
          className={`${hCls} cursor-ew-resize`}
          style={{
            ...s,
            top: "50%",
            left: HANDLE_OFFSET,
            transform: "translateY(-50%)",
          }}
        />
        <div
          onPointerDown={(e) => startResize(e, el, "mr")}
          className={`${hCls} cursor-ew-resize`}
          style={{
            ...s,
            top: "50%",
            right: HANDLE_OFFSET,
            transform: "translateY(-50%)",
          }}
        />
        <div
          onPointerDown={(e) => startResize(e, el, "bl")}
          className={`${hCls} cursor-nesw-resize`}
          style={{ ...s, bottom: HANDLE_OFFSET, left: HANDLE_OFFSET }}
        />
        <div
          onPointerDown={(e) => startResize(e, el, "bm")}
          className={`${hCls} cursor-ns-resize`}
          style={{
            ...s,
            bottom: HANDLE_OFFSET,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        />
        <div
          onPointerDown={(e) => startResize(e, el, "br")}
          className={`${hCls} cursor-nwse-resize`}
          style={{ ...s, bottom: HANDLE_OFFSET, right: HANDLE_OFFSET }}
        />
      </>
    );
  };

  // ── Render ────────────────────────────────────────────────
  return (
    /*
      wrapperRef = full available space, measured by ResizeObserver.
      overflow-auto = allows scrolling when zoomed in beyond 100%.
    */
    <div
      ref={wrapperRef}
      className="relative w-full h-full overflow-auto touch-pan-x touch-pan-y custom-canvas-scroll select-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerDown={(e) => {
        if (e.target === wrapperRef.current) setSelectedIds([]);
      }}
    >
      {/*
        Inner centering div — always at least as big as the wrapper so
        the page is centred even when zoomed out, but scrollable when zoomed in.
      */}
      <div
        className="flex flex-col items-center py-6 sm:py-12 gap-6 sm:gap-12"
        style={{
          minWidth: "100%",
          minHeight: "100%",
          width: scale !== null ? Math.max(pageWidth * scale + 48, pageWidth) : "100%",
        }}
      >
        {scale === null ? (
          <div style={{ width: pageWidth, height: pageHeight, opacity: 0 }} />
        ) : (
          pages.map((page) => {
            const isActive = page.id === activePageId;
            const pageElements = localElements.filter(el => pages.length === 1 || (el.page_id || pages[0].id) === page.id);
            
            return (
              <div
                key={page.id}
                id={page.id}
                data-page-id={page.id}
                className={`bg-white shadow-2xl relative select-none flex-shrink-0 transition-all overflow-hidden ${isActive ? 'ring-2 ring-teal-500 ring-offset-4 ring-offset-[#1e1e1e]' : 'opacity-90 hover:opacity-100'}`}
                onPointerDown={() => {
                  setActivePageId(page.id);
                  setSelectedIds([]);
                }}
                onContextMenu={(e) => onContextMenu?.(e, null)}
                style={{
                  width: page.width * scale,
                  height: page.height * scale,
                  backgroundColor: page.bg_color || "#ffffff",
                }}
              >
                {/* Printable Margin Guideline box */}
                {page.margin ? (
                  <div
                    className="absolute border border-dashed border-indigo-400/30 pointer-events-none z-0"
                    style={{
                      left: page.margin * scale,
                      top: page.margin * scale,
                      width: (page.width - page.margin * 2) * scale,
                      height: (page.height - page.margin * 2) * scale,
                    }}
                  />
                ) : null}
                {pageElements.map((el) => {
              const isSel = selectedIds.includes(el.id);
              const baseStyle: React.CSSProperties = {
                position: "absolute",
                left: el.x * scale,
                bottom: el.y * scale,
                width: ((el as any).width || 100) * scale,
                height: ((el as any).height || 100) * scale,
                zIndex: el.z_index,
              };

              // ── TEXT ──────────────────────────────────────
              if (el.element_type === "text") {
                const isEditing = editingTextId === el.id;

                return (
                  <div
                    key={el.id}
                    onPointerDown={(e) => {
                      if (!isEditing) startDrag(e, el);
                    }}
                    onContextMenu={(e) => { e.stopPropagation(); onContextMenu?.(e, el.id); }}
                    onDoubleClick={() => setEditingTextId(el.id)}
                    className={`absolute ${!isEditing ? "cursor-move" : ""}
                      ${isSel ? "ring-2 ring-teal-500 z-40" : "hover:ring-1 hover:ring-slate-300"}`}
                    style={{
                      ...baseStyle,
                      overflow: "visible",
                      display: "flex",
                      alignItems: "flex-start",
                      color: el.text_color || "#000000",
                      fontSize: (el.font_size || 12) * scale,
                      fontWeight: el.bold ? "bold" : "normal",
                      fontStyle: el.italic ? "italic" : "normal",
                      fontFamily:
                        el.font_name || "Helvetica, Arial, sans-serif",
                      textDecorationLine: el.underline ? "underline" : "none",
                      lineHeight: el.line_height ?? 1.4,
                      letterSpacing: `${(el.letter_spacing ?? 0) * scale}px`,
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {isEditing ? (
                      <textarea
                        autoFocus
                        defaultValue={el.text}
                        onPointerDown={(e) => e.stopPropagation()}
                        onBlur={(e) => {
                          const newText = e.target.value;
                          if (newText !== el.text) {
                            onSnapshot();
                            setElements((prev) =>
                              prev.map((x) =>
                                x.id === el.id ? ({ ...x, text: newText } as any) : x
                              )
                            );
                          }
                          setEditingTextId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            setEditingTextId(null);
                          }
                        }}
                        onChange={(e) => {
                          e.target.style.height = "auto";
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        ref={(ref) => {
                          if (ref) {
                            ref.style.height = "auto";
                            ref.style.height = `${ref.scrollHeight}px`;
                          }
                        }}
                        style={{
                          width: "100%",
                          minHeight: "100%",
                          background: "transparent",
                          border: "none",
                          outline: "none",
                          resize: "none",
                          color: "inherit",
                          font: "inherit",
                          padding: 0,
                          margin: 0,
                          textAlign: (el as any).align || "left",
                          lineHeight: el.line_height ?? 1.4,
                          letterSpacing: `${(el.letter_spacing ?? 0) * scale}px`,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          textAlign: (el as any).align || "left",
                          lineHeight: el.line_height ?? 1.4,
                          letterSpacing: `${(el.letter_spacing ?? 0) * scale}px`,
                        }}
                      >
                        {el.text}
                      </div>
                    )}
                    {renderHandles(el)}
                  </div>
                );
              }

              // ── SHAPES ────────────────────────────────────
              if (el.element_type === "shape") {
                if (el.shape_type === "rectangle") {
                  return (
                    <div
                      key={el.id}
                      onPointerDown={(e) => startDrag(e, el)}
                      onContextMenu={(e) => { e.stopPropagation(); onContextMenu?.(e, el.id); }}
                      className={`absolute cursor-move
                        ${isSel ? "ring-2 ring-teal-500 z-40" : "hover:ring-1 hover:ring-slate-300"}`}
                      style={{
                        ...baseStyle,
                        backgroundColor: el.fill_color || "#ffffff",
                        border: `${(el.border_width || 2) * scale}px solid ${el.border_color || "#000000"}`,
                        borderRadius: (el.border_radius || 0) * scale,
                      }}
                    >
                      {renderHandles(el)}
                    </div>
                  );
                }                if (el.shape_type === "path" || el.shape_type === "polygon") {
                  return (
                    <div
                      key={el.id}
                      className="absolute pointer-events-none"
                      style={{
                        left: 0,
                        bottom: 0,
                        width: pageWidth * scale,
                        height: pageHeight * scale,
                        zIndex: el.z_index,
                      }}
                    >
                      <svg
                        className="w-full h-full overflow-visible"
                        viewBox={`0 0 ${pageWidth} ${pageHeight}`}
                        style={{ display: "block" }}
                      >
                        <g transform={`scale(1, -1) translate(${el.x || 0}, -${pageHeight - (el.y || 0)})`}>
                          {el.shape_type === "path" && el.path_d && (
                            <path
                              className={`pointer-events-auto cursor-move ${isSel ? 'stroke-teal-500' : ''}`}
                              onPointerDown={(e) => startDrag(e, el)}
                              onContextMenu={(e) => { e.stopPropagation(); onContextMenu?.(e, el.id); }}
                              d={el.path_d}
                              fill={el.fill_color || "transparent"}
                              stroke={isSel ? "#14b8a6" : (el.border_color || "transparent")}
                              strokeWidth={isSel ? Math.max((el.border_width || 0) + 2, 2) : (el.border_width || 0)}
                            />
                          )}
                          {el.shape_type === "polygon" && el.points && (
                            <polygon
                              className={`pointer-events-auto cursor-move ${isSel ? 'stroke-teal-500' : ''}`}
                              onPointerDown={(e) => startDrag(e, el)}
                              onContextMenu={(e) => { e.stopPropagation(); onContextMenu?.(e, el.id); }}
                              points={Array.isArray(el.points) ? el.points.reduce((acc, val, i) => acc + (i % 2 === 0 ? val + "," : val + " "), "") : el.points}
                              fill={el.fill_color || "transparent"}
                              stroke={isSel ? "#14b8a6" : (el.border_color || "transparent")}
                              strokeWidth={isSel ? Math.max((el.border_width || 0) + 2, 2) : (el.border_width || 0)}
                            />
                          )}
                        </g>
                      </svg>
                    </div>
                  );
                }

                if (el.shape_type === "circle") {
                  const d = ((el as any).width || 100) * scale;
                  return (
                    <div
                      key={el.id}
                      onPointerDown={(e) => startDrag(e, el)}
                      onContextMenu={(e) => { e.stopPropagation(); onContextMenu?.(e, el.id); }}
                      className={`absolute cursor-move rounded-full
                        ${isSel ? "ring-2 ring-teal-500 z-40" : "hover:ring-1 hover:ring-slate-300"}`}
                      style={{
                        position: "absolute",
                        left: (el.x - ((el as any).width || 100) / 2) * scale,
                        bottom: (el.y - ((el as any).width || 100) / 2) * scale,
                        width: d,
                        height: d,
                        backgroundColor: el.fill_color || "#ffffff",
                        border: `${(el.border_width || 2) * scale}px solid ${el.border_color || "#000000"}`,
                        zIndex: el.z_index,
                      }}
                    >
                      <div className="relative w-full h-full">
                        {renderHandles(el)}
                      </div>
                    </div>
                  );
                }

                if (el.shape_type === "line" || el.shape_type === "arrow") {
                  const x2 = el.x2 ?? el.x;
                  const y2 = el.y2 ?? el.y;
                  const pad = el.shape_type === "arrow" ? 20 : 2;
                  const minX = Math.min(el.x, x2) - pad;
                  const minY = Math.min(el.y, y2) - pad;
                  const maxX = Math.max(el.x, x2) + pad;
                  const maxY = Math.max(el.y, y2) + pad;
                  const bw = Math.max(10, maxX - minX);
                  const bh = Math.max(10, maxY - minY);
                  const px1 = (el.x - minX) * scale;
                  const py1 = (el.y - minY) * scale;
                  const px2 = (x2 - minX) * scale;
                  const py2 = (y2 - minY) * scale;
                  const sy1 = bh * scale - py1;
                  const sy2 = bh * scale - py2;

                  return (
                    <div
                      key={el.id}
                      className="absolute"
                      onContextMenu={(e) => { e.stopPropagation(); onContextMenu?.(e, el.id); }}
                      style={{
                        left: minX * scale,
                        bottom: minY * scale,
                        width: bw * scale,
                        height: bh * scale,
                        zIndex: el.z_index,
                      }}
                    >
                      <svg
                        className="w-full h-full overflow-visible"
                        style={{ display: "block" }}
                      >
                        {el.shape_type === "arrow" && (
                          <defs>
                            <marker
                              id={`ah-${el.id}`}
                              markerWidth="10"
                              markerHeight="7"
                              refX="9"
                              refY="3.5"
                              orient="auto"
                            >
                              <polygon
                                points="0 0,10 3.5,0 7"
                                fill={
                                  isSel ? "#0d9488" : el.border_color || "#000"
                                }
                              />
                            </marker>
                          </defs>
                        )}
                        {el.control_x !== undefined &&
                        el.control_y !== undefined ? (
                          <>
                            <path
                              d={`M ${px1} ${sy1} Q ${
                                ((el.control_x as number) - minX) * scale
                              } ${
                                bh * scale - ((el.control_y as number) - minY) * scale
                              } ${px2} ${sy2}`}
                              stroke="transparent"
                              strokeWidth={Math.max(
                                (el.border_width || 2) * scale,
                                16,
                              )}
                              fill="none"
                              className="cursor-move"
                              onPointerDown={(e) => startDrag(e, el)}
                            />
                            <path
                              d={`M ${px1} ${sy1} Q ${
                                ((el.control_x as number) - minX) * scale
                              } ${
                                bh * scale - ((el.control_y as number) - minY) * scale
                              } ${px2} ${sy2}`}
                              stroke={
                                isSel ? "#0d9488" : el.border_color || "#000"
                              }
                              strokeWidth={(el.border_width || 2) * scale}
                              strokeLinecap="round"
                              fill="none"
                              markerEnd={
                                el.shape_type === "arrow"
                                  ? `url(#ah-${el.id})`
                                  : undefined
                              }
                              className="pointer-events-none"
                            />
                          </>
                        ) : (
                          <>
                            <line
                              x1={px1}
                              y1={sy1}
                              x2={px2}
                              y2={sy2}
                              stroke="transparent"
                              strokeWidth={Math.max(
                                (el.border_width || 2) * scale,
                                16,
                              )}
                              className="cursor-move"
                              onPointerDown={(e) => startDrag(e, el)}
                            />
                            <line
                              x1={px1}
                              y1={sy1}
                              x2={px2}
                              y2={sy2}
                              stroke={
                                isSel ? "#0d9488" : el.border_color || "#000"
                              }
                              strokeWidth={(el.border_width || 2) * scale}
                              strokeLinecap="round"
                              markerEnd={
                                el.shape_type === "arrow"
                                  ? `url(#ah-${el.id})`
                                  : undefined
                              }
                              className="pointer-events-none"
                            />
                          </>
                        )}
                      </svg>
                      {isSel && (
                        <>
                          <div
                            onPointerDown={(e) => startResize(e, el, "start")}
                            className="absolute bg-teal-500 border-2 border-white shadow-md z-50 cursor-crosshair rounded-sm hover:bg-teal-300 touch-none"
                            style={{
                              width: HANDLE_SIZE,
                              height: HANDLE_SIZE,
                              left: px1 - HANDLE_SIZE / 2,
                              top: sy1 - HANDLE_SIZE / 2,
                            }}
                          />
                          <div
                            onPointerDown={(e) => startResize(e, el, "bezier")}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setElements((prev) =>
                                prev.map((x) =>
                                  x.id === el.id
                                    ? { ...x, control_x: undefined, control_y: undefined }
                                    : x
                                )
                              );
                              onSnapshot();
                            }}
                            title="Double-click to straighten line"
                            className="absolute bg-white border-2 border-teal-500 shadow-md z-50 cursor-crosshair rounded-full hover:bg-teal-50 touch-none"
                            style={{
                              width: HANDLE_SIZE,
                              height: HANDLE_SIZE,
                              left:
                                (el.control_x !== undefined
                                  ? (el.control_x - minX) * scale
                                  : (px1 + px2) / 2) -
                                HANDLE_SIZE / 2,
                              top:
                                (el.control_y !== undefined
                                  ? bh * scale - (el.control_y - minY) * scale
                                  : (sy1 + sy2) / 2) -
                                HANDLE_SIZE / 2,
                            }}
                          />
                          <div
                            onPointerDown={(e) => startResize(e, el, "end")}
                            className="absolute bg-teal-500 border-2 border-white shadow-md z-50 cursor-crosshair rounded-sm hover:bg-teal-300 touch-none"
                            style={{
                              width: HANDLE_SIZE,
                              height: HANDLE_SIZE,
                              left: px2 - HANDLE_SIZE / 2,
                              top: sy2 - HANDLE_SIZE / 2,
                            }}
                          />
                        </>
                      )}
                    </div>
                  );
                }
              }

              // ── IMAGE ─────────────────────────────────────
              if (el.element_type === "image") {
                return (
                  <div
                    key={el.id}
                    onPointerDown={(e) => startDrag(e, el)}
                    onContextMenu={(e) => { e.stopPropagation(); onContextMenu?.(e, el.id); }}
                    className={`absolute cursor-move
                      ${isSel ? "ring-2 ring-teal-500 z-40" : "hover:ring-1 hover:ring-slate-300"}`}
                    style={{
                      ...baseStyle,
                      opacity: el.opacity ?? 1,
                      filter: el.shadow ? "drop-shadow(0px 4px 12px rgba(0,0,0,0.35))" : "none",
                      transform: `rotate(${el.rotation || 0}deg)`,
                    }}
                  >
                    {el.is_icon && el.icon_name ? (
                      (() => {
                        const IconComponent = (Lucide as any)[el.icon_name];
                        return IconComponent ? (
                          <div
                            className="w-full h-full flex items-center justify-center p-1"
                            style={{
                              color: (el as any).text_color || "#334155",
                            }}
                          >
                            <IconComponent size="100%" />
                          </div>
                        ) : (
                          <div className="w-full h-full border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400">
                            {el.icon_name}
                          </div>
                        );
                      })()
                    ) : (
                      <img
                        src={el.image_path}
                        alt=""
                        className="w-full h-full object-contain pointer-events-none"
                        style={{
                          borderRadius: el.border_radius ? `${el.border_radius * scale}px` : undefined,
                          clipPath:
                            el.mask_shape === "circle"
                              ? "circle(50% at 50% 50%)"
                              : el.mask_shape === "rounded" && !el.border_radius
                                ? "inset(0 0 0 0 round 15px)"
                                : el.mask_shape === "heart"
                                  ? "path('M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.41,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.59,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z')"
                                  : "none",
                        }}
                        draggable={false}
                      />
                    )}

                    {processingIds.includes(el.id) && (
                      <div className="absolute inset-0 z-50 bg-black/20 flex flex-col items-center justify-center overflow-hidden">
                        <div
                          className="absolute w-full h-[2px] bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.8)]"
                          style={{
                            animation: "scan 2s linear infinite",
                          }}
                        />
                        <div className="bg-white/90 backdrop-blur-md p-2.5 rounded-xl flex flex-col items-center gap-1.5 shadow-xl border border-white/50">
                          <Loader2
                            className="text-teal-500 animate-spin"
                            size={18}
                          />
                          <div className="flex items-center gap-1 text-teal-600 font-bold text-[8px] uppercase tracking-tighter">
                            <Sparkles size={10} />
                            <span>AI Scanning</span>
                          </div>
                        </div>
                        <style>{`
                          @keyframes scan {
                            0% { top: -10%; }
                            100% { top: 110%; }
                          }
                        `}</style>
                      </div>
                    )}

                    {renderHandles(el)}
                  </div>
                );
              }

              return null;
            })}

            {guides.map((g, i) => (
              <div
                key={`guide-${i}`}
                className="absolute pointer-events-none z-50"
                style={{
                  left: g.axis === "x" ? Math.floor(g.coord * scale) : 0,
                  bottom: g.axis === "y" ? Math.floor(g.coord * scale) : 0,
                  width: g.axis === "x" ? 0 : "100%",
                  height: g.axis === "y" ? 0 : "100%",
                  borderLeft: g.axis === "x" ? "1px dashed #6366f1" : "none",
                  borderBottom: g.axis === "y" ? "1px dashed #6366f1" : "none",
                }}
              />
            ))}
          </div>
            );
          })
        )}
      </div>
    </div>
  );
}
