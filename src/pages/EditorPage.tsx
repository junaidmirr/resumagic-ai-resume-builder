import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { resumeService } from "../lib/resumeService";
import { EditorCanvas } from "../components/editor/EditorCanvas";
import { Chatbot } from "../components/Chatbot";
import type { EditorElement } from "../types/editor";
import { ImageCropModal } from "../components/editor/ImageCropModal";
import {
  Trash2,
  RotateCcw,
  RotateCw,
  Copy,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  Smile,
  ArrowUpRight,
  Search,
  X,
  Blocks,
  Type,
  Square,
  Circle,
  Minus,
  Settings2,
  Layers,
  PanelLeftClose,
  PanelRightClose,
  ChevronRight,
  ChevronLeft,
  Menu,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  MousePointer2,
  Check,
  Magnet,
  RefreshCw,
  Cloud,
  Download,
  Loader2,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { renderToString } from "react-dom/server";
import { Link } from "react-router-dom";

const PROFESSIONAL_EMOJIS = [
  "🌐",
  "📍",
  "🏢",
  "🎓",
  "💼",
  "🤝",
  "📈",
  "📊",
  "💡",
  "🎯",
  "🏆",
  "🌟",
  "⭐",
  "✅",
  "✔️",
  "☑️",
  "📝",
  "✏️",
  "✒️",
  "📅",
  "📆",
  "🗓️",
  "🕒",
  "⏳",
  "🔗",
  "📎",
  "📂",
  "📁",
  "🔥",
  "🚀",
  "⚡",
  "✨",
  "🔑",
  "🔒",
  "💬",
  "🛑",
];

const PRESET_COLORS = [
  "#000000",
  "#ffffff",
  "#f8fafc",
  "#94a3b8",
  "#475569",
  "#1e293b",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#fca5a5",
  "#fed7aa",
  "#fde68a",
  "#bbf7d0",
  "#a5f3fc",
  "#bfdbfe",
  "#e0f2fe",
  "#fce7f3",
  "#ede9fe",
  "#dcfce7",
  "#fff7ed",
  "#fef9c3",
];

const FONT_FAMILIES = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Oswald",
  "Playfair Display",
  "Roboto Mono",
  "Helvetica",
  "Arial",
  "Times New Roman",
  "Courier New",
];

const FONT_SIZES = [
  6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 56, 64,
  72, 80, 96,
];
const STROKE_WIDTHS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20];

type PanelId = "elements" | "layers" | "properties";

// ─── Color Picker ─────────────────────────────────────────────────────────────
function ColorPicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState(value.replace("#", ""));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHex(value.replace("#", ""));
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    const t = setTimeout(() => document.addEventListener("mousedown", fn), 100);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", fn);
    };
  }, [open]);

  const applyHex = (raw: string) => {
    const v = raw.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
    setHex(v);
    if (v.length === 6) onChange("#" + v);
  };

  return (
    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5 border border-slate-100 dark:border-slate-700">
      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 select-none">
        {label}
      </span>
      <div ref={ref} className="relative">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((p) => !p);
          }}
          className="flex items-center gap-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 hover:border-teal-400 transition-colors shadow-sm"
        >
          <div
            className="w-5 h-5 rounded-md border border-slate-200 dark:border-slate-500 shadow-inner shrink-0"
            style={{ backgroundColor: value }}
          />
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-300 select-none">
            #{hex.toUpperCase()}
          </span>
        </button>

        {open && (
          <div
            className="absolute right-0 bottom-full mb-2 z-[300] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 w-56"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-3">
              <input
                type="color"
                value={value}
                onChange={(e) => {
                  onChange(e.target.value);
                  setHex(e.target.value.replace("#", ""));
                }}
                className="w-28 h-28 rounded-xl cursor-pointer border-0 p-0 bg-transparent"
              />
            </div>
            <div className="grid grid-cols-6 gap-1.5 mb-3">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange(c);
                    setHex(c.replace("#", ""));
                  }}
                  className="w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 active:scale-95 relative flex items-center justify-center"
                  style={{
                    backgroundColor: c,
                    borderColor:
                      c === value
                        ? "#14b8a6"
                        : c === "#ffffff"
                          ? "#e2e8f0"
                          : "transparent",
                  }}
                >
                  {c === value && (
                    <Check
                      size={10}
                      className="text-white"
                      style={{ filter: "drop-shadow(0 0 1px #000)" }}
                    />
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700 rounded-lg px-2.5 py-2 border border-slate-200 dark:border-slate-600">
              <span className="text-slate-400 text-xs font-mono select-none">
                #
              </span>
              <input
                type="text"
                value={hex.toUpperCase()}
                onChange={(e) => applyHex(e.target.value)}
                maxLength={6}
                className="flex-1 bg-transparent text-xs font-mono text-slate-700 dark:text-slate-200 outline-none uppercase w-16"
                placeholder="000000"
                onMouseDown={(e) => e.stopPropagation()}
              />
              <div
                className="w-4 h-4 rounded border border-slate-200 dark:border-slate-500"
                style={{ backgroundColor: value }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Number Input ─────────────────────────────────────────────────────────────
function NumberInput({
  label,
  value,
  onChange,
  onCommit,
  min = 1,
  max = 9999,
  unit = "",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  onCommit?: () => void;
  min?: number;
  max?: number;
  unit?: string;
}) {
  const [local, setLocal] = useState(String(Math.round(value)));
  useEffect(() => {
    setLocal(String(Math.round(value)));
  }, [value]);

  const commit = (v: string) => {
    const n = parseInt(v.replace(unit, ""));
    if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
    setLocal(String(Math.round(value)));
    onCommit?.();
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold text-slate-400 select-none">
        {label}
      </span>
      <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={() => {
            onCommit?.();
            onChange(Math.max(min, value - 1));
          }}
          className="px-2.5 py-1.5 text-slate-400 hover:text-teal-500 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-bold select-none transition-colors border-r border-slate-200 dark:border-slate-700"
        >
          −
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={local}
          onChange={(e) => setLocal(e.target.value.replace(/[^0-9-]/g, ""))}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit((e.target as HTMLInputElement).value);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onFocus={(e) => e.target.select()}
          className="flex-1 text-center text-xs font-mono text-slate-700 dark:text-slate-200 bg-transparent outline-none py-1.5 w-0 min-w-0"
        />
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={() => {
            onCommit?.();
            onChange(Math.min(max, value + 1));
          }}
          className="px-2.5 py-1.5 text-slate-400 hover:text-teal-500 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-bold select-none transition-colors border-l border-slate-200 dark:border-slate-700"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ─── Dropdown Select ──────────────────────────────────────────────────────────
function DropdownSelect({
  label,
  value,
  options,
  onChange,
  onCommit,
}: {
  label: string;
  value: number | string;
  options: (number | string)[];
  onChange: (v: any) => void;
  onCommit?: () => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold text-slate-400 select-none">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => {
          onCommit?.();
          onChange(
            typeof options[0] === "number"
              ? Number(e.target.value)
              : e.target.value,
          );
        }}
        onMouseDown={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-700 dark:text-slate-200 outline-none focus:border-teal-400 cursor-pointer"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Icon Button ──────────────────────────────────────────────────────────────
function IconBtn({
  icon: Icon,
  onClick,
  disabled,
  title,
  className = "",
}: {
  icon: any;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30
        text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors
        flex items-center justify-center select-none ${className}`}
    >
      <Icon size={15} />
    </button>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest select-none">
        {title}
      </p>
      {children}
    </div>
  );
}

// ─── Action Button ────────────────────────────────────────────────────────────
function ActionBtn({
  icon: Icon,
  label,
  onClick,
}: {
  icon: any;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={onClick}
      className="flex flex-col items-center gap-1 py-2 rounded-xl bg-slate-50 dark:bg-slate-800
        border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700
        text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-all
        text-[9px] font-semibold select-none w-full"
    >
      <Icon size={13} />
      {label}
    </button>
  );
}
// ─── Main Editor Page ─────────────────────────────────────────────────────────
export function EditorPage() {
  const { user } = useAuth();
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [resumeId] = useState<string | null>(
    localStorage.getItem("current_resume_id"),
  );
  const [resumeTitle, setResumeTitle] = useState("Untitled Resume");
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const counterRef = useRef(0);
  const [undoStack, setUndoStack] = useState<EditorElement[][]>([]);
  const [redoStack, setRedoStack] = useState<EditorElement[][]>([]);

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<PanelId | null>(null);
  const [zoom, setZoom] = useState(100);
  const [showIconModal, setShowIconModal] = useState(false);
  const [iconSearch, setIconSearch] = useState("");
  const [layersCollapsed, setLayersCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [isGroupingMode, setIsGroupingMode] = useState(false);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [cropSource, setCropSource] = useState<string | null>(null);

  // Keep selectedIds in a ref so updateProp never needs it as dependency
  const selectedIdsRef = useRef<string[]>([]);
  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  // Keep elements in a ref for snapshot
  const elementsRef = useRef(elements);
  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Cloud Loading
  useEffect(() => {
    if (resumeId) {
      resumeService.getResume(resumeId).then((res) => {
        if (res) {
          setElements(res.elements);
          setResumeTitle(res.title);
          setUndoStack([res.elements]);
          const maxNum = Math.max(
            0,
            ...res.elements.map((e) => {
              const parts = e.id?.split("_") || [];
              return parseInt(parts[parts.length - 1]) || 0;
            }),
          );
          counterRef.current = maxNum;
        }
      });
    } else {
      // Check for AI-designed resume from Wizard (legacy/transition)
      const designed = localStorage.getItem("designed_resume");
      if (designed) {
        try {
          const parsed = JSON.parse(designed);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setElements(parsed);
            setUndoStack([parsed]);
          }
        } catch (e) {
          console.error("[Editor] Failed to parse designed resume:", e);
        } finally {
          localStorage.removeItem("designed_resume");
        }
      }
    }
  }, [resumeId]);

  // Debounced Auto-Save
  useEffect(() => {
    if (!resumeId || !user) return;

    const timer = setTimeout(async () => {
      setIsSyncing(true);
      try {
        await resumeService.updateResume(resumeId, elements, resumeTitle);
        setLastSaved(new Date());
      } catch (err) {
        console.error("Cloud Save Failed:", err);
      } finally {
        setIsSyncing(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [elements, resumeTitle, resumeId, user]);

  // ── History ───────────────────────────────────────────────
  const _snapshot = useCallback(() => {
    setUndoStack((prev) => {
      const copy = JSON.parse(JSON.stringify(elementsRef.current));
      const n = [...prev, copy];
      if (n.length > 50) n.shift();
      return n;
    });
    setRedoStack([]);
  }, []);

  const undo = useCallback(() => {
    setUndoStack((prev) => {
      if (!prev.length) return prev;
      const previous = prev[prev.length - 1];
      setRedoStack((r) => [
        ...r,
        JSON.parse(JSON.stringify(elementsRef.current)),
      ]);
      setElements(previous);
      setSelectedIds([]);
      return prev.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setRedoStack((prev) => {
      if (!prev.length) return prev;
      const next = prev[prev.length - 1];
      setUndoStack((u) => [
        ...u,
        JSON.parse(JSON.stringify(elementsRef.current)),
      ]);
      setElements(next);
      setSelectedIds([]);
      return prev.slice(0, -1);
    });
  }, []);

  // ── Update prop — applies to ALL selected elements ───────
  const updateProp = useCallback((key: string, value: any) => {
    setElements((prev) => {
      const ids = selectedIdsRef.current;
      if (ids.length === 0) return prev;
      return prev.map((el) =>
        ids.includes(el.id) ? ({ ...el, [key]: value } as any) : el,
      );
    });
  }, []);

  const sel = elements.find((e) => e.id === selectedIds[0]) as any;

  // ── Keyboard shortcuts ────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "Backspace" || e.key === "Delete") deleteSelected();
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "z") {
          e.preventDefault();
          undo();
        }
        if (e.key === "y" || (e.shiftKey && e.key === "z")) {
          e.preventDefault();
          redo();
        }
        if (e.key === "d") {
          e.preventDefault();
          duplicate();
        }
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [undo, redo]);

  const getNextId = (prefix: string) => `${prefix}_${++counterRef.current}`;

  // ── Add Elements ──────────────────────────────────────────
  const addText = () => {
    _snapshot();
    const id = getNextId("text");
    setElements((p) => [
      ...p,
      {
        id,
        element_type: "text",
        text: "New Text",
        x: 100,
        y: 650,
        width: 220,
        height: 44,
        font_size: 16,
        font_name: "Helvetica",
        text_color: "#1e293b",
        z_index: p.length,
      },
    ]);
    setSelectedIds([id]);
    if (isMobile) setMobilePanel("properties");
  };

  const addRect = () => {
    _snapshot();
    const id = getNextId("rect");
    setElements((p) => [
      ...p,
      {
        id,
        element_type: "shape",
        shape_type: "rectangle",
        x: 180,
        y: 550,
        width: 200,
        height: 120,
        fill_color: "#e0f2fe",
        border_color: "#0284c7",
        border_width: 2,
        z_index: p.length,
      },
    ]);
    setSelectedIds([id]);
    if (isMobile) setMobilePanel("properties");
  };

  const addCircle = () => {
    _snapshot();
    const id = getNextId("circle");
    setElements((p) => [
      ...p,
      {
        id,
        element_type: "shape",
        shape_type: "circle",
        x: 306,
        y: 500,
        width: 120,
        height: 120,
        fill_color: "#fce7f3",
        border_color: "#db2777",
        border_width: 2,
        z_index: p.length,
      },
    ]);
    setSelectedIds([id]);
    if (isMobile) setMobilePanel("properties");
  };

  const addLine = () => {
    _snapshot();
    const id = getNextId("line");
    setElements((p) => [
      ...p,
      {
        id,
        element_type: "shape",
        shape_type: "line",
        x: 100,
        y: 400,
        x2: 500,
        y2: 400,
        border_color: "#475569",
        border_width: 2,
        z_index: p.length,
      },
    ]);
    setSelectedIds([id]);
  };

  const addImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        setCropSource(evt.target?.result as string);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleCropComplete = async (dataUrl: string) => {
    _snapshot();
    const id = getNextId("img");
    setElements((p) => [
      ...p,
      {
        id,
        element_type: "image",
        image_path: dataUrl,
        x: 156,
        y: 400,
        width: 300,
        height: 300,
        z_index: p.length,
      },
    ]);
    setSelectedIds([id]);
    setCropSource(null);
    if (isMobile) setMobilePanel("properties");
  };

  const deleteSelected = useCallback(() => {
    const ids = selectedIdsRef.current;
    if (ids.length === 0) return;
    _snapshot();
    setElements((p) =>
      p
        .filter((e) => !ids.includes(e.id))
        .map((e, i) => ({ ...e, z_index: i })),
    );
    setSelectedIds([]);
  }, [_snapshot]);

  const duplicate = useCallback(() => {
    const ids = selectedIdsRef.current;
    if (ids.length === 0) return;
    _snapshot();
    const newElements: EditorElement[] = [];
    const newIds: string[] = [];

    ids.forEach((id) => {
      const orig = elementsRef.current.find((e) => e.id === id);
      if (!orig) return;
      const nid = getNextId(orig.id.split("_")[0]);
      const dupe: any = {
        ...JSON.parse(JSON.stringify(orig)),
        id: nid,
        x: orig.x + 15,
        y: orig.y - 15,
        z_index: elementsRef.current.length + newElements.length,
      };
      if (dupe.x2 !== undefined) {
        dupe.x2 += 15;
        dupe.y2 -= 15;
      }
      newElements.push(dupe);
      newIds.push(nid);
    });

    setElements((p) => [...p, ...newElements]);
    setSelectedIds(newIds);
  }, [_snapshot]);

  const moveForward = useCallback(() => {
    const ids = selectedIdsRef.current;
    if (ids.length === 0) return;
    setElements((prev) => {
      const a = [...prev];
      // Move each selected element forward if possible
      // We process from back to front to avoid multiple moves affecting each other
      const indices = ids
        .map((id) => a.findIndex((e) => e.id === id))
        .sort((a, b) => b - a);
      indices.forEach((idx) => {
        if (idx < a.length - 1) {
          [a[idx], a[idx + 1]] = [a[idx + 1], a[idx]];
        }
      });
      _snapshot();
      return a.map((e, i) => ({ ...e, z_index: i }));
    });
  }, [_snapshot]);

  const moveBackward = useCallback(() => {
    const ids = selectedIdsRef.current;
    if (ids.length === 0) return;
    setElements((prev) => {
      const a = [...prev];
      const indices = ids
        .map((id) => a.findIndex((e) => e.id === id))
        .sort((a, b) => a - b);
      indices.forEach((idx) => {
        if (idx > 0) {
          [a[idx], a[idx - 1]] = [a[idx - 1], a[idx]];
        }
      });
      _snapshot();
      return a.map((e, i) => ({ ...e, z_index: i }));
    });
  }, [_snapshot]);

  const groupElements = useCallback(() => {
    const ids = selectedIdsRef.current;
    if (ids.length === 0) return;

    if (ids.length === 1 && !isGroupingMode) {
      setIsGroupingMode(true);
      return;
    }

    _snapshot();
    const gId = `group_${Date.now()}`;
    setElements((prev) =>
      prev.map((el) => {
        if (ids.includes(el.id)) return { ...el, groupId: gId };
        return el;
      }),
    );
    setIsGroupingMode(false);
    setSelectedIds([]);
  }, [isGroupingMode, _snapshot]);

  const ungroupElements = useCallback(() => {
    const ids = selectedIdsRef.current;
    if (ids.length === 0) return;
    _snapshot();
    setElements((prev) =>
      prev.map((el) => {
        if (ids.includes(el.id) && el.groupId) {
          const { groupId, ...rest } = el;
          return rest as any;
        }
        return el;
      }),
    );
    setIsGroupingMode(false);
  }, [_snapshot]);

  // ── Icons & Emoji ─────────────────────────────────────────
  const generateVectorPNG = async (svgString: string): Promise<string> =>
    new Promise((resolve) => {
      const blob = new Blob([svgString], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = c.height = 120;
        c.getContext("2d")?.drawImage(img, 0, 0, 120, 120);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/png"));
      };
      img.src = url;
    });

  const handleIconColorChange = async (eid: string, color: string) => {
    const el = elementsRef.current.find((e) => e.id === eid) as any;
    if (!el?.is_icon || !el?.icon_name) return;
    const IC = (LucideIcons as any)[el.icon_name];
    if (!IC) return;
    const svg = renderToString(
      <IC
        color={color}
        size={120}
        strokeWidth={2}
        xmlns="http://www.w3.org/2000/svg"
      />,
    );
    const dataUrl = await generateVectorPNG(svg);
    setElements((p) =>
      p.map((e) =>
        e.id === eid
          ? ({ ...e, border_color: color, image_path: dataUrl } as any)
          : e,
      ),
    );
  };

  const handleRemoveBG = useCallback(
    async (id: string) => {
      const el = elementsRef.current.find((e) => e.id === id);
      if (!el || el.element_type !== "image") return;

      setProcessingIds((p) => [...p, id]);
      try {
        const resp = await fetch("/api/remove-bg", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_path: el.image_path }),
        });
        const data = await resp.json();
        if (data.new_path) {
          _snapshot();
          setElements((prev) =>
            prev.map((e) =>
              e.id === id ? { ...e, image_path: data.new_path } : e,
            ),
          );
        }
      } catch (err) {
        console.error("BG Removal failed", err);
      } finally {
        setProcessingIds((p) => p.filter((x) => x !== id));
      }
    },
    [setElements, _snapshot],
  );

  const addEmojiDirect = (chars: string) => {
    const c = document.createElement("canvas");
    c.width = c.height = 120;
    const ctx = c.getContext("2d")!;
    ctx.font = "80px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(chars, 60, 65);
    _snapshot();
    const id = getNextId("emoji");
    setElements((p) => [
      ...p,
      {
        id,
        element_type: "image",
        image_path: c.toDataURL(),
        x: 250,
        y: 450,
        width: 64,
        height: 64,
        emoji_char: chars,
        is_icon: true,
        z_index: p.length,
      } as any,
    ]);
    setSelectedIds([id]);
    setShowIconModal(false);
  };

  const addLucideIcon = async (iconName: string) => {
    const IC = (LucideIcons as any)[iconName];
    if (!IC) return;
    const color = "#3b82f6";
    const svg = renderToString(
      <IC
        color={color}
        size={120}
        strokeWidth={2}
        xmlns="http://www.w3.org/2000/svg"
      />,
    );
    const dataUrl = await generateVectorPNG(svg);
    _snapshot();
    const id = getNextId("icon");
    setElements((p) => [
      ...p,
      {
        id,
        element_type: "image",
        image_path: dataUrl,
        x: 250,
        y: 450,
        width: 64,
        height: 64,
        is_icon: true,
        icon_name: iconName,
        border_color: color,
        z_index: p.length,
      } as any,
    ]);
    setSelectedIds([id]);
    setShowIconModal(false);
  };

  // ── Export / Import ───────────────────────────────────────
  const handleExport = async () => {
    try {
      setIsExporting(true);
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(elements),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "export.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      alert("Export failed. Ensure Python backend is running on port 5001.");
    } finally {
      setIsExporting(false);
    }
  };

  // Removed legacy JSON handling as per user request (SaaS Migration)

  // ── Tools ─────────────────────────────────────────────────
  const tools = [
    {
      id: "text",
      icon: Type,
      label: "Text",
      hoverCls:
        "hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600",
      action: addText,
    },
    {
      id: "image",
      icon: ImageIcon,
      label: "Image",
      hoverCls:
        "hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600",
      action: addImage,
    },
    {
      id: "icon",
      icon: Smile,
      label: "Icons",
      hoverCls:
        "hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-600",
      action: () => setShowIconModal(true),
    },
    {
      id: "rect",
      icon: Square,
      label: "Rect",
      hoverCls: "hover:bg-sky-50 dark:hover:bg-sky-900/30 hover:text-sky-600",
      action: addRect,
    },
    {
      id: "circle",
      icon: Circle,
      label: "Circle",
      hoverCls:
        "hover:bg-pink-50 dark:hover:bg-pink-900/30 hover:text-pink-600",
      action: addCircle,
    },
    {
      id: "line",
      icon: Minus,
      label: "Line",
      hoverCls:
        "hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-800",
      action: addLine,
    },
  ];

  // ── Properties panel renderer ─────────────────────────────
  const renderProperties = () => {
    if (!sel) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <MousePointer2
            size={40}
            className="mb-3 text-slate-200 dark:text-slate-700"
          />
          <p className="text-sm font-semibold text-slate-400 select-none">
            Nothing selected
          </p>
          <p className="text-xs mt-1 text-slate-300 dark:text-slate-600 select-none">
            Tap any element on the canvas
          </p>
        </div>
      );
    }

    return (
      <div className="p-4 space-y-5">
        {/* Position & Size */}
        <Section title="Position & Size">
          <div className="grid grid-cols-2 gap-2">
            <NumberInput
              label="X"
              value={sel.x ?? 0}
              min={-9999}
              max={9999}
              onChange={(v) => updateProp("x", v)}
              onCommit={_snapshot}
            />
            <NumberInput
              label="Y"
              value={sel.y ?? 0}
              min={-9999}
              max={9999}
              onChange={(v) => updateProp("y", v)}
              onCommit={_snapshot}
            />
            {sel.width !== undefined && (
              <>
                <NumberInput
                  label="Width"
                  value={sel.width ?? 0}
                  min={1}
                  max={9999}
                  onChange={(v) => updateProp("width", v)}
                  onCommit={_snapshot}
                />
                <NumberInput
                  label="Height"
                  value={sel.height ?? 0}
                  min={1}
                  max={9999}
                  onChange={(v) => updateProp("height", v)}
                  onCommit={_snapshot}
                />
              </>
            )}
            {sel.shape_type === "rectangle" && (
              <NumberInput
                label="Corner Radius"
                value={sel.border_radius ?? 0}
                min={0}
                max={9999}
                onChange={(v) => updateProp("border_radius", v)}
                onCommit={_snapshot}
              />
            )}
          </div>
          {(sel.shape_type === "line" || sel.shape_type === "arrow") && (
            <div className="mt-2">
              <NumberInput
                label="Angle (°)"
                value={Math.round(
                  (Math.atan2((sel.y2 ?? 0) - sel.y, (sel.x2 ?? 0) - sel.x) *
                    180) /
                    Math.PI,
                )}
                min={-180}
                max={180}
                onChange={(v) => {
                  const a = (v * Math.PI) / 180;
                  const l = Math.sqrt(
                    ((sel.x2 ?? 0) - sel.x) ** 2 + ((sel.y2 ?? 0) - sel.y) ** 2,
                  );
                  updateProp("x2", sel.x + Math.cos(a) * l);
                  updateProp("y2", sel.y + Math.sin(a) * l);
                }}
                onCommit={_snapshot}
              />
            </div>
          )}
        </Section>

        {/* Typography */}
        {sel.element_type === "text" && (
          <Section title="Typography">
            <div
              className="relative"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <textarea
                className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700
                  rounded-lg p-3 text-sm focus:outline-none focus:border-teal-400 min-h-[80px]
                  resize-none transition-colors text-slate-800 dark:text-slate-100"
                value={sel.text ?? ""}
                onChange={(e) => updateProp("text", e.target.value)}
                onBlur={_snapshot}
                placeholder="Type your text here..."
              />
            </div>
            <div className="mt-2 text-slate-800 dark:text-slate-100 mb-2">
              <DropdownSelect
                label="Font Family"
                value={sel.font_name ?? "Helvetica"}
                options={FONT_FAMILIES}
                onChange={(v) => {
                  _snapshot();
                  updateProp("font_name", v);
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <DropdownSelect
                label="Font Size"
                value={sel.font_size ?? 16}
                options={FONT_SIZES}
                onChange={(v) => {
                  _snapshot();
                  updateProp("font_size", v);
                }}
              />
              <NumberInput
                label="Custom (pt)"
                value={sel.font_size ?? 16}
                min={6}
                max={200}
                onChange={(v) => updateProp("font_size", v)}
                onCommit={_snapshot}
              />
            </div>
            <div className="flex gap-2 mt-1">
              {[
                { key: "bold", label: "B", cls: "font-bold" },
                { key: "italic", label: "I", cls: "italic" },
                { key: "underline", label: "U", cls: "underline" },
              ].map(({ key, label, cls }) => (
                <button
                  key={key}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => {
                    _snapshot();
                    updateProp(key, !sel[key]);
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm transition-all border-2 select-none ${cls} ${
                    sel[key]
                      ? "bg-teal-500 text-white border-teal-500 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-teal-300 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Section>
        )}

        {/* Colors */}
        <Section title="Colors">
          <div className="space-y-2">
            {sel.element_type === "text" && (
              <ColorPicker
                label="Text Color"
                value={sel.text_color || "#000000"}
                onChange={(v) => {
                  _snapshot();
                  updateProp("text_color", v);
                }}
              />
            )}
            {sel.element_type === "shape" &&
              sel.shape_type !== "line" &&
              sel.shape_type !== "arrow" && (
                <ColorPicker
                  label="Fill"
                  value={sel.fill_color || "#ffffff"}
                  onChange={(v) => {
                    _snapshot();
                    updateProp("fill_color", v);
                  }}
                />
              )}
            {sel.element_type === "shape" && (
              <>
                <ColorPicker
                  label="Stroke"
                  value={sel.border_color || "#000000"}
                  onChange={(v) => {
                    _snapshot();
                    updateProp("border_color", v);
                  }}
                />
                <div className="grid grid-cols-2 gap-2">
                  <DropdownSelect
                    label="Stroke Width"
                    value={sel.border_width ?? 2}
                    options={STROKE_WIDTHS}
                    onChange={(v) => {
                      _snapshot();
                      updateProp("border_width", v);
                    }}
                  />
                  <NumberInput
                    label="Custom (px)"
                    value={sel.border_width ?? 2}
                    min={1}
                    max={50}
                    onChange={(v) => updateProp("border_width", v)}
                    onCommit={_snapshot}
                  />
                </div>
              </>
            )}

            {sel.element_type === "image" && sel.is_icon && sel.icon_name && (
              <ColorPicker
                label="Icon Color"
                value={sel.border_color || "#3b82f6"}
                onChange={(v) => {
                  _snapshot();
                  handleIconColorChange(selectedIds[0]!, v);
                }}
              />
            )}

            {sel.element_type === "image" && !sel.is_icon && (
              <>
                <div className="pt-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 select-none">
                    Photo Masking
                  </p>
                  <div className="grid grid-cols-4 gap-1">
                    {["none", "circle", "rounded", "heart"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          _snapshot();
                          updateProp("mask_shape", m);
                        }}
                        className={`py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border-2
                          ${
                            (sel.mask_shape || "none") === m
                              ? "bg-teal-500 text-white border-teal-500 shadow-sm"
                              : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-teal-200 text-slate-500 dark:text-slate-400"
                          }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveBG(sel.id)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[10px]
                    font-bold text-teal-600 border-2 border-teal-100 dark:border-teal-900/50
                    bg-teal-50/50 dark:bg-teal-900/10 hover:bg-teal-100 dark:hover:bg-teal-900/20
                    transition-all select-none group mt-2"
                >
                  <LucideIcons.Sparkles
                    size={12}
                    className="animate-pulse group-hover:scale-110 transition-transform"
                  />
                  AI Remove Background
                </button>
              </>
            )}
          </div>
        </Section>

        {/* Actions */}
        <Section title="Actions">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <ActionBtn icon={Copy} label="Duplicate" onClick={duplicate} />
            <ActionBtn icon={ChevronUp} label="Forward" onClick={moveForward} />
            <ActionBtn
              icon={ChevronDown}
              label="Backward"
              onClick={moveBackward}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <ActionBtn
              icon={isGroupingMode ? Check : Layers}
              label={isGroupingMode ? "Finish Group" : "Group"}
              onClick={groupElements}
            />
            <ActionBtn icon={X} label="Ungroup" onClick={ungroupElements} />
          </div>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={deleteSelected}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs
              font-bold text-red-500 border-2 border-red-200 dark:border-red-900/50
              bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20
              transition-colors select-none"
          >
            <Trash2 size={13} /> Delete Element
          </button>
        </Section>
      </div>
    );
  };

  // ── Layers panel renderer ─────────────────────────────────
  const renderLayers = () => (
    <div
      className="flex flex-col border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
      style={{ height: layersCollapsed ? "auto" : "38%" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-950/60 shrink-0 cursor-pointer"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setLayersCollapsed((p) => !p)}
      >
        <div className="flex items-center gap-2">
          <Layers size={13} className="text-slate-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 select-none">
            Layers
          </span>
          <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-500 rounded-full px-1.5 py-0.5 font-mono select-none">
            {elements.length}
          </span>
        </div>
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {sel && !layersCollapsed && (
            <>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={duplicate}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
              >
                <Copy size={11} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={moveForward}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
              >
                <ChevronUp size={11} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={moveBackward}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
              >
                <ChevronDown size={11} />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={deleteSelected}
                className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-500"
              >
                <Trash2 size={11} />
              </button>
            </>
          )}
          <span className="ml-1 text-slate-400 select-none">
            {layersCollapsed ? (
              <ChevronUp size={13} />
            ) : (
              <ChevronDown size={13} />
            )}
          </span>
        </div>
      </div>

      {/* Layer list */}
      {!layersCollapsed && (
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {elements.length === 0 && (
            <div className="py-8 text-center text-slate-400 select-none">
              <Grid size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">No layers yet</p>
            </div>
          )}
          {[...elements].reverse().map((el) => {
            const isSelected = selectedIds.includes(el.id);
            const label =
              el.element_type === "shape"
                ? (el as any).shape_type
                : el.element_type === "image" && (el as any).is_icon
                  ? "icon"
                  : el.element_type;
            const LIcon =
              el.element_type === "text"
                ? Type
                : el.element_type === "shape" &&
                    (el as any).shape_type === "circle"
                  ? Circle
                  : el.element_type === "shape" &&
                      (el as any).shape_type === "line"
                    ? Minus
                    : el.element_type === "shape" &&
                        (el as any).shape_type === "arrow"
                      ? ArrowUpRight
                      : el.element_type === "image"
                        ? ImageIcon
                        : Square;
            return (
              <button
                key={el.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setSelectedIds([el.id]);
                  if (isMobile) setMobilePanel("properties");
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left
                  transition-all text-[11px] font-medium select-none
                  ${
                    isSelected
                      ? "bg-teal-50 dark:bg-teal-900/25 text-teal-700 dark:text-teal-300 ring-1 ring-teal-200 dark:ring-teal-800"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500"
                  }`}
              >
                <LIcon size={11} className="shrink-0 opacity-60" />
                <span className="capitalize truncate flex-1">{label}</span>
                <span className="font-mono text-[10px] opacity-40">
                  #{el.id.split("_")[1]}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col font-sans text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-950"
      style={{ height: "100dvh", overflow: "hidden" }}
    >
      {/* ── TOP BAR ── */}
      <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 px-3 shrink-0 z-30 shadow-sm">
        {/* Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/dashboard"
            className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 transition-all text-slate-500 hover:text-teal-500 border border-slate-200 dark:border-slate-700"
            title="Back to Dashboard"
          >
            <ChevronLeft size={18} />
          </Link>
          <div className="flex items-center gap-3 pl-1 pr-3 border-r border-slate-200 dark:border-slate-700">
            <input
              type="text"
              value={resumeTitle}
              onChange={(e) => setResumeTitle(e.target.value)}
              className="bg-transparent font-bold text-sm tracking-tight outline-none focus:text-teal-500 transition-colors w-32 sm:w-48"
              placeholder="Resume Title"
            />
          </div>
        </div>

        {/* Undo / Redo + panel toggles */}
        <div className="flex items-center gap-1 shrink-0">
          <IconBtn
            icon={RotateCcw}
            onClick={undo}
            disabled={!undoStack.length}
            title="Undo (⌘Z)"
          />
          <IconBtn
            icon={RotateCw}
            onClick={redo}
            disabled={!redoStack.length}
            title="Redo (⌘Y)"
          />
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block" />
          <IconBtn
            icon={leftOpen ? PanelLeftClose : ChevronRight}
            onClick={() => setLeftOpen((p) => !p)}
            className="hidden md:flex"
            title="Toggle Tools"
          />
          <IconBtn
            icon={rightOpen ? PanelRightClose : ChevronLeft}
            onClick={() => setRightOpen((p) => !p)}
            className="hidden md:flex"
            title="Toggle Properties"
          />
        </div>

        {/* Zoom (desktop only) */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono ml-1 select-none">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setZoom((z) => Math.max(25, z - 10))}
            className="text-slate-500 hover:text-teal-500 transition-colors"
          >
            <ZoomOut size={13} />
          </button>
          <span className="w-10 text-center text-slate-600 dark:text-slate-300">
            {zoom}%
          </span>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setZoom((z) => Math.min(200, z + 10))}
            className="text-slate-500 hover:text-teal-500 transition-colors"
          >
            <ZoomIn size={13} />
          </button>
        </div>

        <div className="flex-1" />

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-[10px] font-bold text-slate-400">
            {isSyncing ? (
              <>
                <RefreshCw size={12} className="animate-spin text-teal-500" />
                <span className="uppercase tracking-widest text-teal-600/70">
                  Syncing...
                </span>
              </>
            ) : (
              <>
                <Cloud size={12} className="text-slate-300" />
                <span className="uppercase tracking-widest">
                  Saved{" "}
                  {lastSaved
                    ? `at ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                    : ""}
                </span>
              </>
            )}
          </div>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-teal-500/10
              bg-teal-500 hover:bg-teal-600 text-white transition-all disabled:opacity-50 select-none"
          >
            {isExporting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            {isExporting ? "Rendering..." : "Export PDF"}
          </button>

          {/* Mobile menu toggle */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setMobilePanel((p) => (p ? null : "elements"))}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      {/* ── WORKSPACE ROW ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* LEFT TOOLS SIDEBAR */}
        <aside
          className={`
            ${leftOpen ? "w-[68px]" : "w-0"}
            hidden md:flex flex-col shrink-0 bg-white dark:bg-slate-900
            border-r border-slate-200 dark:border-slate-800 z-20
            overflow-hidden transition-all duration-200
          `}
        >
          <div className="flex flex-col items-center py-3 gap-0.5 overflow-y-auto">
            {tools.map(({ id, icon: Icon, label, hoverCls, action }) => (
              <button
                key={id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={action}
                title={label}
                className={`flex flex-col items-center gap-1 w-14 py-3 rounded-xl
                  text-slate-400 transition-all group select-none ${hoverCls}`}
              >
                <Icon
                  size={20}
                  strokeWidth={1.8}
                  className="transition-transform group-hover:scale-110 group-hover:-translate-y-0.5"
                />
                <span className="text-[9px] font-bold tracking-wide uppercase">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* CENTER: CANVAS */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-slate-200 dark:bg-slate-950 relative">
          {/*
            This div is exactly what EditorCanvas measures via ResizeObserver.
            - flex-1 + min-h-0: fills remaining height without overflowing
            - overflow-hidden: never grows beyond parent (immune to keyboard resize)
            - The dot-grid background is visual only
          */}
          <div
            className="flex-1 min-h-0 overflow-hidden relative"
            style={{
              backgroundImage:
                "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          >
            <EditorCanvas
              elements={elements}
              setElements={setElements}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              pageWidth={612}
              pageHeight={792}
              onSnapshot={_snapshot}
              zoom={zoom}
              snapEnabled={snapEnabled}
              isGroupingMode={isGroupingMode}
              processingIds={processingIds}
            />
          </div>

          {/* Status bar */}
          <div className="h-8 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center px-4 gap-4 text-[11px] text-slate-400 shrink-0 select-none">
            <span>
              {elements.length} element{elements.length !== 1 ? "s" : ""}
            </span>
            {sel && (
              <span className="text-teal-500 font-semibold">
                ● {sel.element_type}
                {sel.shape_type ? ` / ${sel.shape_type}` : ""}
              </span>
            )}
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setSnapEnabled((p) => !p)}
                title="Toggle Smart Snapping"
                className={`mr-2 hover:opacity-100 transition-opacity ${snapEnabled ? "text-teal-500 opacity-100" : "text-slate-400 opacity-50"}`}
              >
                <Magnet size={13} />
              </button>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setZoom((z) => Math.max(25, z - 10))}
                className="hover:text-teal-500"
              >
                <ZoomOut size={12} />
              </button>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setZoom(100)}
                className="font-mono hover:text-teal-500"
              >
                {zoom}%
              </button>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setZoom((z) => Math.min(200, z + 10))}
                className="hover:text-teal-500"
              >
                <ZoomIn size={12} />
              </button>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setZoom(100)}
                title="Reset zoom"
                className="hover:text-teal-500 ml-1"
              >
                <Maximize2 size={12} />
              </button>
            </div>
          </div>
        </main>

        {/* RIGHT SIDEBAR: Properties + Layers */}
        <aside
          className={`
            ${rightOpen ? "w-72 xl:w-80" : "w-0"}
            hidden md:flex flex-col shrink-0 bg-white dark:bg-slate-900
            border-l border-slate-200 dark:border-slate-800 z-20
            overflow-hidden transition-all duration-200
          `}
        >
          <div className="flex flex-col h-full overflow-hidden">
            {/* Properties header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 shrink-0 select-none">
              <Settings2 size={13} className="text-slate-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Properties
              </span>
              {sel && (
                <span className="ml-auto text-[10px] bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full px-2 py-0.5 font-semibold capitalize">
                  {sel.element_type}
                </span>
              )}
            </div>

            {/* Scrollable properties area */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {renderProperties()}
            </div>

            {/* Layers pinned to bottom */}
            {renderLayers()}
          </div>
        </aside>
      </div>

      {/* ── MOBILE BOTTOM TAB BAR ── */}
      <div className="md:hidden flex items-center justify-around bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 shrink-0 z-30 select-none">
        {[
          { id: "elements" as PanelId, icon: Blocks, label: "Add" },
          { id: "layers" as PanelId, icon: Layers, label: "Layers" },
          { id: "properties" as PanelId, icon: Settings2, label: "Edit" },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setMobilePanel((p) => (p === id ? null : id))}
            className={`flex flex-col items-center gap-1 px-5 py-1.5 rounded-xl transition-all ${
              mobilePanel === id
                ? "text-teal-600 dark:text-teal-400"
                : "text-slate-400"
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px] font-semibold">{label}</span>
          </button>
        ))}
        {sel && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={deleteSelected}
            className="flex flex-col items-center gap-1 px-5 py-1.5 rounded-xl text-red-400"
          >
            <Trash2 size={20} />
            <span className="text-[10px] font-semibold">Delete</span>
          </button>
        )}
      </div>

      {/* ── MOBILE SLIDE-UP SHEET ── */}
      {mobilePanel && (
        <div className="md:hidden fixed inset-0 z-40 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobilePanel(null)}
          />
          <div
            className="relative bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl flex flex-col"
            style={{ maxHeight: "75dvh" }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0 select-none">
              <span className="font-bold text-sm text-slate-700 dark:text-slate-200">
                {mobilePanel === "elements"
                  ? "➕ Add Element"
                  : mobilePanel === "layers"
                    ? "📚 Layers"
                    : "🎨 Properties"}
              </span>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setMobilePanel(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {mobilePanel === "elements" && (
                <div className="grid grid-cols-4 gap-3 p-4">
                  {tools.map(({ id, icon: Icon, label, hoverCls, action }) => (
                    <button
                      key={id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        action();
                        if (id !== "icon") setMobilePanel(null);
                      }}
                      className={`flex flex-col items-center gap-2 py-4 rounded-2xl bg-slate-50
                        dark:bg-slate-800 text-slate-500 transition-all select-none ${hoverCls}`}
                    >
                      <Icon size={24} strokeWidth={1.8} />
                      <span className="text-[10px] font-bold uppercase">
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {mobilePanel === "layers" && (
                <div className="p-3 space-y-1">
                  {elements.length === 0 && (
                    <p className="text-center text-slate-400 text-sm py-8 select-none">
                      No layers yet
                    </p>
                  )}
                  {[...elements].reverse().map((el) => {
                    const isSelected = selectedIds.includes(el.id);
                    const label =
                      el.element_type === "shape"
                        ? (el as any).shape_type
                        : el.element_type;
                    return (
                      <button
                        key={el.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setSelectedIds([el.id]);
                          setMobilePanel("properties");
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm
                          font-medium transition-all select-none ${
                            isSelected
                              ? "bg-teal-50 dark:bg-teal-900/30 text-teal-700"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600"
                          }`}
                      >
                        <span className="capitalize">{label}</span>
                        <span className="text-xs text-slate-400 font-mono ml-auto">
                          #{el.id.split("_")[1]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {mobilePanel === "properties" && renderProperties()}
            </div>
          </div>
        </div>
      )}

      {/* ── ICON / EMOJI MODAL ── */}
      {showIconModal && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
          onMouseDown={() => setShowIconModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full sm:rounded-2xl sm:max-w-2xl flex flex-col
              shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden rounded-t-2xl"
            style={{ maxHeight: "85dvh" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 shrink-0 select-none">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Blocks size={16} className="text-teal-500" /> Insert Icon or
                Emoji
              </h3>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowIconModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search icons…"
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  autoFocus
                  onMouseDown={(e) => e.stopPropagation()}
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-100 dark:bg-slate-800 rounded-xl
                    border-2 border-transparent focus:border-teal-400 outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {!iconSearch && (
                <div className="mb-6">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 select-none">
                    Emoji
                  </p>
                  <div className="grid grid-cols-8 sm:grid-cols-10 gap-1">
                    {PROFESSIONAL_EMOJIS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onMouseDown={(ev) => ev.preventDefault()}
                        onClick={() => addEmojiDirect(e)}
                        className="text-2xl sm:text-3xl flex justify-center py-2.5 rounded-xl
                          hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-110 active:scale-95"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 select-none">
                Lucide Icons
              </p>
              <div className="grid grid-cols-5 sm:grid-cols-8 gap-1.5">
                {Object.keys(LucideIcons)
                  .filter((k) => {
                    const v = (LucideIcons as any)[k];
                    return (
                      (typeof v === "function" || typeof v === "object") &&
                      !k.endsWith("Icon") &&
                      k.toLowerCase().includes(iconSearch.toLowerCase())
                    );
                  })
                  .slice(0, 120)
                  .map((iconKey) => {
                    const IC = (LucideIcons as any)[iconKey];
                    if (!IC) return null;
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addLucideIcon(iconKey)}
                        title={iconKey}
                        className="flex flex-col items-center justify-center p-2.5 hover:bg-teal-50
                          dark:hover:bg-teal-900/20 rounded-xl group transition-all text-slate-500
                          hover:text-teal-600 border border-transparent hover:border-teal-200
                          dark:hover:border-teal-800"
                      >
                        <IC
                          size={22}
                          strokeWidth={1.5}
                          className="transition-transform group-hover:scale-110"
                        />
                        <span className="text-[8px] mt-1 text-center truncate w-full opacity-50 group-hover:opacity-100 select-none">
                          {iconKey}
                        </span>
                      </button>
                    );
                  })}
                {iconSearch &&
                  Object.keys(LucideIcons).filter((k) =>
                    k.toLowerCase().includes(iconSearch.toLowerCase()),
                  ).length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400 select-none">
                      <Search size={28} className="mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No icons for "{iconSearch}"</p>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
      <Chatbot
        elements={elements}
        onUpdateElements={(newEls) => {
          _snapshot();
          setElements(newEls);
        }}
      />

      {cropSource && (
        <ImageCropModal
          imageSrc={cropSource}
          onCrop={handleCropComplete}
          onClose={() => setCropSource(null)}
        />
      )}
    </div>
  );
}
