import { useState, useEffect, useCallback, useRef } from "react";
import { toPng, toJpeg } from "html-to-image";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../components/onboarding/AuthModalContext";
import { useTheme } from "../components/theme-provider";
import { resumeService } from "../lib/resumeService";
import { ErrorBoundary } from "../components/ui/ErrorBoundary";
import { MiniPreview } from "../components/ui/MiniPreview";
import { EditorCanvas } from "../components/editor/EditorCanvas";
import { useDialog } from "../context/DialogContext";
import { Chatbot } from "../components/Chatbot";
import { AIAssistantSidebar } from "../components/editor/AIAssistantSidebar";
import { AssetsPanel } from "../components/editor/AssetsPanel";
import type { EditorElement, Page, ShapeElement } from "../types/editor";
import { ImageCropModal } from "../components/editor/ImageCropModal";
import { RESUME_BLOCKS } from "../utils/blocks";
import { templates as RESUME_TEMPLATES } from "../lib/templates";
import { TemplateThumbnailPreview } from "../components/dashboard/TemplateThumbnailPreview";
import { extractTextFromPDF } from "../lib/pdfParser";
import { buildResumeFromImportedText } from "../lib/aiArchitect";
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

type PanelId = "elements" | "layers" | "properties" | "sections" | "pages" | "templates" | "ai" | "menu" | "assets";

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
    <div className="flex items-center justify-between bg-app-surface rounded-lg p-2.5 border border-app-border">
      <span className="text-[11px] font-medium text-app-text-secondary select-none">
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
          className="flex items-center gap-2 bg-app-surface border border-app-border rounded-lg px-2 py-1.5 hover:border-teal-400 transition-colors shadow-xs"
        >
          <div
            className="w-5 h-5 rounded-md border border-app-border shadow-xs shrink-0"
            style={{ backgroundColor: value }}
          />
          <span className="text-[11px] font-mono text-app-text-secondary select-none">
            #{hex.toUpperCase()}
          </span>
        </button>

        {open && (
          <div
            className="absolute right-0 bottom-full mb-2 z-[300] bg-app-surface rounded-2xl shadow-2xl border border-app-border p-4 w-56"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Custom Color Section */}
            <div className="mb-4">
              <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest mb-2 block select-none">
                Custom Color
              </span>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={value}
                  onChange={(e) => {
                    onChange(e.target.value);
                    setHex(e.target.value.replace("#", ""));
                  }}
                  className="h-9 flex-1 rounded cursor-pointer border-0 p-0 bg-transparent shadow-xs hover:scale-105 transition-transform"
                  title="Click to open color wheel"
                />
                <div className="flex items-center gap-1.5 bg-app-bg rounded-lg px-2.5 h-9 border border-app-border">
                  <span className="text-app-text-muted text-xs font-mono select-none">
                    #
                  </span>
                  <input
                    type="text"
                    value={hex.toUpperCase()}
                    onChange={(e) => applyHex(e.target.value)}
                    maxLength={6}
                    className="w-14 bg-transparent text-xs font-mono text-app-text outline-none uppercase"
                    placeholder="000000"
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            </div>

            {/* Presets Section */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block select-none">
                Theme Presets
              </span>
              <div className="grid grid-cols-6 gap-1.5">
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
  step = 1,
  unit = "",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  onCommit?: () => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}) {
  const [local, setLocal] = useState(String(step < 1 ? value : Math.round(value)));
  useEffect(() => {
    setLocal(String(step < 1 ? value : Math.round(value)));
  }, [value, step]);

  const commit = (v: string) => {
    const n = parseFloat(v.replace(unit, ""));
    if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
    setLocal(String(step < 1 ? value : Math.round(value)));
    onCommit?.();
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold text-app-text-muted select-none">
        {label}
      </span>
      <div className="flex items-center bg-app-surface border border-app-border rounded-lg overflow-hidden">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={() => {
            onCommit?.();
            onChange(Math.max(min, value - step));
          }}
          className="px-2.5 py-1.5 text-app-text-muted hover:text-teal-500 hover:bg-app-bg text-sm font-bold select-none transition-colors border-r border-app-border"
        >
          −
        </button>
        <input
          type="text"
          inputMode={step < 1 ? "decimal" : "numeric"}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit(e.currentTarget.value);
            if (e.key === "ArrowUp") {
              e.preventDefault();
              onChange(Math.min(max, value + step));
              onCommit?.();
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              onChange(Math.max(min, value - step));
              onCommit?.();
            }
          }}
          className="w-full bg-transparent text-center text-xs font-bold text-app-text focus:outline-none"
        />
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={() => {
            onCommit?.();
            onChange(Math.min(max, value + step));
          }}
          className="px-2.5 py-1.5 text-app-text-muted hover:text-teal-500 hover:bg-app-bg text-sm font-bold select-none transition-colors border-l border-app-border"
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
      <span className="text-[10px] font-semibold text-app-text-muted select-none">
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
        className="bg-app-surface border border-app-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-app-text outline-none focus:border-teal-400 cursor-pointer"
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
      className="flex flex-col items-center gap-1 py-2 rounded-xl bg-app-surface
        border border-app-border hover:bg-app-bg
        text-app-text-secondary hover:text-app-text transition-all
        text-[9px] font-semibold select-none w-full"
    >
      <Icon size={13} />
      {label}
    </button>
  );
}


// ─── Main Editor Page ─────────────────────────────────────────────────────────
export function EditorPage() {
  const { user, refreshCredits, credits, deductCredits } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showAuthModal } = useAuthModal();
  const { confirm, prompt, alert } = useDialog();
  const navigate = useNavigate();
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [pages, setPages] = useState<Page[]>([{ id: "page-1", width: 612, height: 792 }]);
  const [activePageId, setActivePageId] = useState<string>("page-1");
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
  const [activeLeftPanel, setActiveLeftPanel] = useState<string | null>("elements");
  const [showChatbot, setShowChatbot] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementId: string | null } | null>(null);

  useEffect(() => {
    const hideMenu = () => setContextMenu(null);
    window.addEventListener("click", hideMenu);
    return () => window.removeEventListener("click", hideMenu);
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, elId: string | null) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, elementId: elId });
      if (elId && !selectedIds.includes(elId)) {
        setSelectedIds([elId]);
      } else if (!elId) {
        setSelectedIds([]);
      }
    },
    [selectedIds]
  );
  const [mobilePanel, setMobilePanel] = useState<PanelId | null>(null);
  const [zoom, setZoom] = useState(100);
  const [showIconModal, setShowIconModal] = useState(false);
  const [iconSearch, setIconSearch] = useState("");
  const [layersCollapsed, setLayersCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [isGroupingMode, setIsGroupingMode] = useState(false);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [loadingAIAction, setLoadingAIAction] = useState<string | null>(null);
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
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        // Compute mobile auto-fit zoom so Letter page fits screen width
        const availWidth = window.innerWidth - 32;
        const fitZoom = Math.max(30, Math.min(85, Math.floor((availWidth / 612) * 100)));
        setZoom(fitZoom);
      }
    };
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

  const handleExit = async () => {
    const shouldSave = await confirm({
      title: "Save Resume?",
      description: "Do you want to save your progress to the cloud before exiting?",
      confirmText: "Save",
      cancelText: "Discard",
    });

    if (shouldSave) {
      const docName = await prompt({
        title: "Name your Document",
        description: "What would you like to call this resume?",
        defaultValue: resumeTitle || "Untitled Resume",
        confirmText: "Save & Exit",
        cancelText: "Cancel",
      });
      if (docName !== null && docName !== undefined) {
        setIsSyncing(true);
        try {
          let thumbnail;
          const pageNode = document.getElementById(`page-page-1`);
          if (pageNode) {
            try {
              thumbnail = await toJpeg(pageNode, { 
                quality: 0.2, 
                canvasWidth: 306, 
                canvasHeight: 396,
                fontEmbedCSS: '',
                skipFonts: true,
              });
            } catch (e) {
              console.error("Failed to generate thumbnail:", e);
            }
          }
          if (resumeId) {
             await resumeService.updateResume(resumeId, elements, docName || "Untitled", thumbnail);
          } else {
             await resumeService.createResume(user?.uid || "guest", docName || "Untitled", elements);
          }
          navigate("/dashboard");
        } catch (err) {
          console.error("Cloud Save Failed:", err);
          await alert({ title: "Error", description: "Failed to save resume." });
        } finally {
          setIsSyncing(false);
        }
      }
    } else {
      navigate("/dashboard");
    }
  };

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
        page_id: activePageId,
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
        page_id: activePageId,
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
        page_id: activePageId,
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
        page_id: activePageId,
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
    if (isMobile) setMobilePanel("properties");
  };

  const addQRCode = async () => {
    const url = await prompt({
      title: "Add QR Code",
      description: "Enter the URL for the QR Code (e.g. your LinkedIn or Portfolio):",
      defaultValue: "https://github.com/",
      confirmText: "Add QR Code",
    });
    if (!url) return;
    
    _snapshot();
    const id = getNextId("image");
    setElements((p) => [
      ...p,
      {
        id,
        element_type: "image",
        page_id: activePageId,
        image_path: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`,
        x: 100,
        y: 600,
        width: 100,
        height: 100,
        z_index: p.length,
      },
    ]);
    setSelectedIds([id]);
  };

  const addChart = async () => {
    const dataStr = await prompt({
      title: "Add Metric Chart",
      description: "Enter chart data values separated by commas (e.g. 50,75,100):",
      defaultValue: "30,70,45,90",
      confirmText: "Create Chart",
    });
    if (!dataStr) return;
    const values = dataStr.split(",").map(v => parseInt(v.trim())).filter(v => !isNaN(v));
    if (values.length === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw Bar Chart
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 300, 200);
    const maxVal = Math.max(...values, 1);
    const barWidth = 300 / values.length - 10;
    
    values.forEach((val, i) => {
      const height = (val / maxVal) * 160;
      ctx.fillStyle = "#0d9488"; // teal-600
      ctx.fillRect(i * (barWidth + 10) + 5, 200 - height - 10, barWidth, height);
      
      ctx.fillStyle = "#334155";
      ctx.font = "12px Helvetica, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(val.toString(), i * (barWidth + 10) + 5 + barWidth / 2, 200 - height - 15);
    });

    const dataUrl = canvas.toDataURL("image/png");
    
    _snapshot();
    const id = getNextId("image");
    setElements((p) => [
      ...p,
      {
        id,
        element_type: "image",
        page_id: activePageId,
        image_path: dataUrl,
        x: 100,
        y: 400,
        width: 300,
        height: 200,
        z_index: p.length,
      },
    ]);
    setSelectedIds([id]);
  };

  const addSignature = async () => {
    const name = await prompt({
      title: "Add Digital Signature",
      description: "Enter your name for the signature:",
      defaultValue: "John Doe",
      confirmText: "Add Signature",
    });
    if (!name) return;

    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 100;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, 400, 100);
    ctx.font = "italic 48px 'Brush Script MT', 'Cedarville Cursive', cursive, serif";
    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, 200, 50);

    const dataUrl = canvas.toDataURL("image/png");

    _snapshot();
    const id = getNextId("image");
    setElements((p) => [
      ...p,
      {
        id,
        element_type: "image",
        page_id: activePageId,
        image_path: dataUrl,
        x: 100,
        y: 600,
        width: 200,
        height: 50,
        z_index: p.length,
      },
    ]);
    setSelectedIds([id]);
  };

  const addBlock = async (blockId: string) => {
    const blockDef = RESUME_BLOCKS.find((b) => b.id === blockId);
    if (!blockDef) return;

    let dynamicData: any = null;

    if (blockId === "skill_bars") {
      const skillInput = await prompt({
        title: "Add Skill Progress Bar",
        description: "Enter the skill name and percentage (e.g. 'Python 90' or 'React 85'):",
        defaultValue: "Python 90",
        confirmText: "Add Progress Bar",
      });
      if (!skillInput) return;
      
      const match = skillInput.trim().match(/^(.*?)\s+(\d+)$/);
      if (match) {
        dynamicData = { name: match[1].trim(), percentage: parseInt(match[2], 10) };
      } else {
        dynamicData = { name: skillInput, percentage: 80 }; // fallback
      }
    } else if (blockId === "radar_chart") {
      const skillsInput = await prompt({
        title: "Add Skill Radar Chart",
        description: "Enter up to 6 skills and percentages separated by commas (e.g. 'Python 90, React 80, SQL 70'):",
        defaultValue: "Python 90, React 80, SQL 70",
        confirmText: "Add Radar Chart",
      });
      if (!skillsInput) return;
      
      const parsedSkills = skillsInput.split(",").map(s => {
        const match = s.trim().match(/^(.*?)\s+(\d+)$/);
        return match ? { name: match[1].trim(), percentage: parseInt(match[2], 10) } : { name: s.trim(), percentage: 80 };
      }).slice(0, 6);
      
      if (parsedSkills.length === 0) return;
      dynamicData = parsedSkills;
    }

    _snapshot();
    const groupId = `group_${Date.now()}`;
    
    // We need to pass dynamicData to elements() but our blocks.ts doesn't support that yet!
    // We'll update utils/blocks.ts to accept dynamicData as 4th parameter.
    const newEls = blockDef.elements(groupId, activePageId, elements.length, dynamicData).map((el, i) => {
      const isShape = el.element_type === "shape";
      return {
        ...el,
        id: getNextId(isShape ? "shape" : "text") + "_" + i,
      } as EditorElement;
    });

    setElements((p) => [...p, ...newEls]);
    setSelectedIds(newEls.map((e) => e.id));
  };

  const applyTemplate = async (templateId: string) => {
    const templateDef = RESUME_TEMPLATES.find((t) => t.id === templateId);
    if (!templateDef) return;

    if (!(await confirm({ title: "Apply Template", description: "Applying a template will replace all current elements on this page. Continue?", danger: true }))) {
      return;
    }

    _snapshot();
    const newEls = templateDef.elements(activePageId).map((el, i) => {
      const isShape = el.element_type === "shape";
      return {
        ...el,
        id: getNextId(isShape ? "shape" : "text") + "_tpl_" + i,
      } as EditorElement;
    });

    setElements((p) => [...p.filter(e => e.page_id !== activePageId), ...newEls]);
    setSelectedIds([]);
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
        const dataUrl = evt.target?.result as string;
        const img = new Image();
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          const MAX_W = 300;
          if (w > MAX_W) {
            h = (MAX_W / w) * h;
            w = MAX_W;
          }
          _snapshot();
          const id = getNextId("img");
          setElements((p) => [
            ...p,
            {
              id,
              element_type: "image",
              page_id: activePageId,
              image_path: dataUrl,
              x: 156,
              y: 400,
              width: w,
              height: h,
              z_index: p.length,
            },
          ]);
          setSelectedIds([id]);
          if (isMobile) setMobilePanel("properties");
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleCropComplete = async (dataUrl: string) => {
    const sel = selectedIds.length === 1 ? elementsRef.current.find(e => e.id === selectedIds[0]) : null;
    _snapshot();
    if (sel && sel.element_type === 'image') {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        const MAX_W = 300;
        if (w > MAX_W) {
          h = (MAX_W / w) * h;
          w = MAX_W;
        }
        setElements(prev => prev.map(e => e.id === sel.id ? {
          ...e,
          image_path: dataUrl,
          width: w,
          height: h
        } : e));
      };
      img.src = dataUrl;
    }
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
      const prefix = (orig.id && orig.id.includes("_")) ? orig.id.split("_")[0] : (orig.element_type || "el");
      const nid = getNextId(prefix);
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
          headers: {
            "Content-Type": "application/json",
            "X-User-ID": user?.uid || "",
          },
          body: JSON.stringify({ image_path: el.image_path }),
        });

        if (!resp.ok) {
          if (resp.status === 402)
            alert("Insufficient credits for BG removal.");
          throw new Error("BG removal failed");
        }

        // Refresh credits in background
        refreshCredits();
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

  const handleATSUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSyncing(true);
      const rawText = await extractTextFromPDF(file);
      let newEls: any[] = [];

      if (rawText && rawText.trim().length > 20) {
        const result = await buildResumeFromImportedText(rawText);
        newEls = result.elements;
      } else {
        const formData = new FormData();
        formData.append("file", file);
        const resp = await fetch("/api/parse-resume", {
          method: "POST",
          body: formData,
        });
        if (!resp.ok) throw new Error("Failed to parse resume");
        const data = await resp.json();
        newEls = data.elements || [];
      }

      if (newEls.length > 0) {
        _snapshot();
        const prepped = newEls.map((el: any, i: number) => ({
          ...el,
          page_id: activePageId,
          z_index: elementsRef.current.length + i,
        }));
        setElements((prev) => [...prev, ...prepped]);
        await alert({
          title: "Import Successful",
          description: "AI has distilled your resume details and created bespoke canvas elements!",
        });
      }
    } catch (err: any) {
      console.error(err);
      await alert({
        title: "Import Error",
        description: "Error parsing resume: " + (err.message || String(err)),
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const [linkedinUrl, setLinkedinUrl] = useState("");
  const handleLinkedInImport = async () => {
    if (!linkedinUrl) return;
    try {
      const resp = await fetch("/api/import-linkedin-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedin_url: linkedinUrl }),
      });
      if (!resp.ok) throw new Error("Failed to import LinkedIn");
      const data = await resp.json();
      if (data.wizard_data) {
        // Simple mapping to canvas for demo
        _snapshot();
        const startY = 700;
        const newEls: any[] = [];
        let curY = startY;
        
        // Add name
        if (data.wizard_data.personal_info?.name) {
          newEls.push({
            id: getNextId("text"),
            element_type: "text",
            text: data.wizard_data.personal_info.name,
            x: 50, y: curY, width: 300, height: 40,
            font_size: 24, font_family: "Helvetica-Bold", text_color: "#000",
            page_id: activePageId, z_index: elementsRef.current.length + newEls.length
          });
          curY -= 40;
        }
        
        setElements(prev => [...prev, ...newEls]);
        alert("LinkedIn profile imported!");
        setLinkedinUrl("");
      }
    } catch (err) {
      console.error(err);
      alert("Error importing LinkedIn.");
    }
  };

  const estimateTextHeight = (text: string, width: number = 400, fontSize: number = 12, lineHeight: number = 1.4) => {
    const charsPerLine = Math.max(1, Math.floor(width / (fontSize * 0.55)));
    const lines = text.split("\n").reduce((acc, line) => {
      return acc + Math.max(1, Math.ceil(line.length / charsPerLine));
    }, 0);
    return Math.max(20, Math.ceil(lines * fontSize * lineHeight));
  };

  const applyTextChangeWithLayoutShift = (elementId: string, newText: string) => {
    _snapshot();
    setElements((prev) => {
      const targetEl = prev.find((e) => e.id === elementId);
      if (!targetEl || targetEl.element_type !== "text") return prev;

      const oldHeight = targetEl.height || 20;
      const targetWidth = targetEl.width || 400;
      const fontSize = targetEl.font_size || 12;
      const lineHeight = targetEl.line_height || 1.4;

      const newHeight = estimateTextHeight(newText, targetWidth, fontSize, lineHeight);
      const heightDelta = newHeight - oldHeight; // Positive = expanded, Negative = shortened

      const pageId = targetEl.page_id || "page-1";
      const targetY = targetEl.y; // In bottom-left origin, Y decreases going down

      return prev.map((el) => {
        if (el.id === elementId) {
          return { ...el, text: newText, height: newHeight } as EditorElement;
        }
        // Shift elements on the same page located BELOW the target element (el.y < targetY)
        if ((el.page_id || "page-1") === pageId && el.y < targetY) {
          const newY = Math.max(0, el.y - heightDelta);
          if (el.element_type === "shape" && (el.shape_type === "line" || el.shape_type === "arrow")) {
            const y2Delta = (el.y2 ?? el.y) - el.y;
            return { ...el, y: newY, y2: newY + y2Delta } as EditorElement;
          }
          return { ...el, y: newY } as EditorElement;
        }
        return el;
      });
    });
  };

  const applySurgicalFix = async (fix: any) => {
    _snapshot();
    if (fix.target_element_id) {
      applyTextChangeWithLayoutShift(fix.target_element_id, fix.suggested_value || fix.description);
      return;
    } 
    
    // For structural fixes (like removing shapes, formatting), route to the AI Architect
    try {
      const resp = await fetch("/api/ai-chat-edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user?.uid || "",
          "X-Skip-Credit-Check": "true"
        },
        body: JSON.stringify({
          elements: elementsRef.current,
          prompt: `Apply this fix to the canvas: ${fix.title}. ${fix.description} ${fix.suggested_value || ""}`,
        }),
      });

      if (!resp.ok) {
        if (resp.status === 402) throw new Error("Insufficient credits. Please recharge.");
        throw new Error("Backend failed to process request");
      }

      refreshCredits();
      const result = await resp.json();
      
      if (result.elements) {
        setElements(result.elements);
      } else {
        alert({ title: "Fix Not Applied", description: "The AI Architect couldn't automatically resolve this fix." });
      }
    } catch (err: any) {
      alert({ title: "Error", description: err.message || "Failed to connect to AI Architect." });
    }
  };

  const handleInsertToCanvas = (textToInsert: string) => {
    _snapshot();
    const newEl: EditorElement = {
      id: getNextId("text") + "_ai",
      element_type: "text",
      page_id: activePageId,
      x: 50,
      y: 500,
      width: 450,
      height: 60,
      font_size: 11,
      font_name: "Helvetica",
      text_color: "#1e293b",
      text: textToInsert,
      z_index: elements.length + 10,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedIds([newEl.id]);
  };

  const handleAITextAction = async (action: string, elementId: string) => {
    if (!user) {
      openModal({ title: "Login Required", subtitle: "Please log in to use AI Text Assistant.", showBlankOption: false });
      return;
    }
    const el = elementsRef.current.find(e => e.id === elementId);
    if (!el || el.element_type !== "text") return;

    const success = await deductCredits(10);
    if (!success) {
      alert("Insufficient credits. Please recharge.");
      return;
    }
    
    setProcessingIds(p => [...p, elementId]);
    setLoadingAIAction(action);
    try {
      const resp = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-User-ID": user.uid,
          "X-Skip-Credit-Check": "true"
        },
        body: JSON.stringify({ action, text: el.text }),
      });
      if (!resp.ok) {
        let errorMsg = `AI Edit failed (${resp.status})`;
        const contentType = resp.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errData = await resp.json();
          errorMsg = errData.error || errorMsg;
        } else {
          errorMsg += " - Please restart your local Python backend to load the latest changes.";
        }
        throw new Error(errorMsg);
      }
      
      const data = await resp.json();

      if (data.status === "rejected") {
        await alert({ title: "Request Denied", description: data.reason || "I can only assist with resume building, career, and job application topics." });
        return;
      }
      
      if (data.result) {
        applyTextChangeWithLayoutShift(elementId, data.result);
        refreshCredits();
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setProcessingIds(p => p.filter(id => id !== elementId));
      setLoadingAIAction(null);
    }
  };

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
        page_id: activePageId,
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
        page_id: activePageId,
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

  const handleInsertAsset = (url: string) => {
    _snapshot();
    const id = getNextId("image");
    setElements((p) => [
      ...p,
      {
        id,
        element_type: "image",
        page_id: activePageId,
        image_path: url,
        x: 100,
        y: 100,
        width: 200,
        height: 200,
        z_index: p.length,
      } as any,
    ]);
    setSelectedIds([id]);
    if (mobilePanel) setMobilePanel(null);
  };

  // ── Export / Import ───────────────────────────────────────
  const exportImage = async (format: "png" | "jpeg") => {
    if (!user) {
      openModal({ title: "Login Required", subtitle: "Please log in to export your resume.", showBlankOption: false });
      return;
    }
    const pageEl = document.getElementById(`page-${activePageId}`);
    if (!pageEl) return;
    try {
      setIsExporting(true);
      const url = format === "png" 
        ? await toPng(pageEl, { pixelRatio: 2, fontEmbedCSS: '', skipFonts: true })
        : await toJpeg(pageEl, { pixelRatio: 2, quality: 1.0, fontEmbedCSS: '', skipFonts: true });
        
      const a = document.createElement("a");
      a.href = url;
      a.download = `resume.${format}`;
      a.click();
    } catch (e: any) {
      console.error(e);
      alert("Failed to export image: " + (e.message || String(e)));
    } finally {
      setIsExporting(false);
    }
  };
  const handleExport = async () => {
    if (!user) {
      openModal({ title: "Login Required", subtitle: "Please log in to export your resume.", showBlankOption: false });
      return;
    }
    setIsExporting(true);

    let serverSuccess = false;
    try {
      // 1. Primary Attempt: Python ReportLab High-Precision Vector Engine
      const res = await fetch("/api/render", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user?.uid || "",
        },
        body: JSON.stringify(elements),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${resumeTitle || "resume"}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        refreshCredits();
        serverSuccess = true;
      } else if (res.status === 402) {
        alert("Insufficient credits to export PDF. Please recharge.");
        setIsExporting(false);
        return;
      }
    } catch (e) {
      console.warn("Python backend PDF render unavailable. Executing client-side fallback:", e);
    }

    // 2. Self-Healing Fallback: Native High-DPI Canvas PDF Engine (Zero External Dependencies)
    if (!serverSuccess) {
      try {
        console.log("[Self-Healing System] Auto-executing Native Client PDF engine...");
        const pageEl = document.getElementById(`page-${activePageId}`) || document.querySelector(".editor-canvas");
        if (pageEl) {
          const imgUrl = await toPng(pageEl as HTMLElement, { pixelRatio: 2, fontEmbedCSS: '', skipFonts: true });
          
          const iframe = document.createElement("iframe");
          iframe.style.position = "fixed";
          iframe.style.right = "0";
          iframe.style.bottom = "0";
          iframe.style.width = "0";
          iframe.style.height = "0";
          iframe.style.border = "0";
          document.body.appendChild(iframe);
          
          const doc = iframe.contentWindow?.document;
          if (doc) {
            doc.open();
            doc.write(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>${resumeTitle || "resume"}</title>
                  <style>
                    @page { size: 612pt 792pt; margin: 0; }
                    body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; }
                    img { width: 100%; height: auto; display: block; }
                  </style>
                </head>
                <body>
                  <img src="${imgUrl}" />
                </body>
              </html>
            `);
            doc.close();
            
            iframe.contentWindow?.focus();
            setTimeout(() => {
              iframe.contentWindow?.print();
              setTimeout(() => iframe.remove(), 1000);
            }, 300);
          }
          serverSuccess = true;
        }
      } catch (fallbackErr) {
        console.error("Client PDF fallback error:", fallbackErr);
        alert("Export encountered an issue. Please try exporting as PNG.");
      }
    }

    setIsExporting(false);
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
      hoverCls: "hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300",
      action: addLine,
    },
    {
      id: "qr",
      icon: LucideIcons.QrCode,
      label: "QR Code",
      hoverCls: "hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-600",
      action: addQRCode,
    },
    {
      id: "chart",
      icon: LucideIcons.BarChart3,
      label: "Chart",
      hoverCls: "hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600",
      action: addChart,
    },
    {
      id: "signature",
      icon: LucideIcons.PenTool,
      label: "Signature",
      hoverCls: "hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600",
      action: addSignature,
    },
  ];

  // ── Properties panel renderer ─────────────────────────────
  const renderProperties = () => {
    if (!sel) {
      return (
        <div className="p-5 space-y-6">
          <div className="flex flex-col items-center justify-center py-6 text-center border-b border-app-border">
            <div className="w-12 h-12 bg-app-bg border border-app-border rounded-full flex items-center justify-center mb-3">
              <LucideIcons.FileText size={20} className="text-app-text-muted" />
            </div>
            <p className="text-[11px] font-bold text-app-text-secondary uppercase tracking-widest select-none">
              Document Setup
            </p>
          </div>
          
          <Section title="Page Setup">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between bg-app-surface p-3 rounded-xl border border-app-border shadow-sm">
                <span className="text-[11px] font-medium text-app-text">Format</span>
                <span className="text-[10px] font-mono font-bold text-app-text-secondary bg-app-bg px-2 py-1 rounded shadow-sm border border-app-border">US Letter</span>
              </div>
              <div className="flex items-center justify-between bg-app-surface p-3 rounded-xl border border-app-border shadow-sm">
                <span className="text-[11px] font-medium text-app-text">Orientation</span>
                <span className="text-[10px] font-mono font-bold text-app-text-secondary bg-app-bg px-2 py-1 rounded shadow-sm border border-app-border">Portrait</span>
              </div>
            </div>
          </Section>
          
          <Section title="Background">
            <div className="flex items-center justify-between bg-app-surface p-3 rounded-xl border border-app-border shadow-sm">
              <span className="text-[11px] font-medium text-app-text">Color</span>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded border border-app-border bg-white shadow-inner" />
                <span className="text-[10px] font-mono text-app-text-secondary uppercase">#FFFFFF</span>
              </div>
            </div>
          </Section>
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
            <div className="text-slate-800 dark:text-slate-100 mb-2">
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
                      : "bg-app-surface border-app-border hover:border-teal-300 text-app-text-secondary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            
            <div className="flex gap-1 mt-2 bg-app-surface border border-app-border p-1 rounded-lg">
              {[
                { key: "left", icon: LucideIcons.AlignLeft },
                { key: "center", icon: LucideIcons.AlignCenter },
                { key: "right", icon: LucideIcons.AlignRight },
                { key: "justify", icon: LucideIcons.AlignJustify },
              ].map(({ key, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={() => { _snapshot(); updateProp("align", key); }}
                  className={`flex-1 py-1.5 flex justify-center items-center rounded-md transition-colors ${
                    (sel.align || 'left') === key 
                      ? "bg-white dark:bg-slate-700 shadow-sm text-teal-600 dark:text-teal-400" 
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <NumberInput
                label="Line Height"
                value={sel.line_height ?? 1.4}
                min={0.5}
                max={3.0}
                step={0.1}
                onChange={(v) => updateProp("line_height", v)}
                onCommit={_snapshot}
              />
              <NumberInput
                label="Letter Spacing"
                value={sel.letter_spacing ?? 0}
                min={-10}
                max={50}
                onChange={(v) => updateProp("letter_spacing", v)}
                onCommit={_snapshot}
              />
            </div>
          </Section>
        )}

        {/* AI Assistant (Text Only) */}
        {sel.element_type === "text" && (
          <Section title="AI Assistant">
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => handleAITextAction("professional_tone", sel.id)}
                disabled={loadingAIAction !== null}
                className="flex items-center gap-2 text-xs text-left px-3 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-lg transition-colors font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingAIAction === "professional_tone" ? <LucideIcons.Loader2 size={14} className="animate-spin" /> : <LucideIcons.Sparkles size={14} />}
                Make Professional
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleAITextAction("improve_grammar", sel.id)}
                  disabled={loadingAIAction !== null}
                  className="flex items-center gap-1.5 text-[11px] px-2 py-2 bg-app-surface hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors font-medium border border-app-border disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingAIAction === "improve_grammar" ? <LucideIcons.Loader2 size={12} className="animate-spin text-teal-500" /> : <LucideIcons.CheckCircle size={12} className="text-teal-500" />}
                  Fix Grammar
                </button>
                <button 
                  onClick={() => handleAITextAction("rewrite", sel.id)}
                  disabled={loadingAIAction !== null}
                  className="flex items-center gap-1.5 text-[11px] px-2 py-2 bg-app-surface hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors font-medium border border-app-border disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingAIAction === "rewrite" ? <LucideIcons.Loader2 size={12} className="animate-spin text-blue-500" /> : <LucideIcons.RefreshCw size={12} className="text-blue-500" />}
                  Rewrite
                </button>
                <button 
                  onClick={() => handleAITextAction("expand", sel.id)}
                  disabled={loadingAIAction !== null}
                  className="flex items-center gap-1.5 text-[11px] px-2 py-2 bg-app-surface hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors font-medium border border-app-border disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingAIAction === "expand" ? <LucideIcons.Loader2 size={12} className="animate-spin text-purple-500" /> : <LucideIcons.Maximize2 size={12} className="text-purple-500" />}
                  Expand
                </button>
                <button 
                  onClick={() => handleAITextAction("shorten", sel.id)}
                  disabled={loadingAIAction !== null}
                  className="flex items-center gap-1.5 text-[11px] px-2 py-2 bg-app-surface hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors font-medium border border-app-border disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingAIAction === "shorten" ? <LucideIcons.Loader2 size={12} className="animate-spin text-orange-500" /> : <LucideIcons.Minimize2 size={12} className="text-orange-500" />}
                  Shorten
                </button>
                <button 
                  onClick={() => handleAITextAction("summarize", sel.id)}
                  disabled={loadingAIAction !== null}
                  className="flex items-center gap-1.5 text-[11px] px-2 py-2 bg-app-surface hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors font-medium border border-app-border disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingAIAction === "summarize" ? <LucideIcons.Loader2 size={12} className="animate-spin text-indigo-500" /> : <LucideIcons.AlignLeft size={12} className="text-indigo-500" />}
                  Summarize
                </button>
                <button 
                  onClick={() => handleAITextAction("translate", sel.id)}
                  disabled={loadingAIAction !== null}
                  className="flex items-center gap-1.5 text-[11px] px-2 py-2 bg-app-surface hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors font-medium border border-app-border disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingAIAction === "translate" ? <LucideIcons.Loader2 size={12} className="animate-spin text-pink-500" /> : <LucideIcons.Languages size={12} className="text-pink-500" />}
                  Translate
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button 
                  onClick={() => handleAITextAction("bullet_points", sel.id)}
                  disabled={loadingAIAction !== null}
                  className="flex items-center gap-2 text-xs text-left px-3 py-2 bg-app-surface hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors font-medium border border-app-border disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingAIAction === "bullet_points" ? <LucideIcons.Loader2 size={14} className="animate-spin text-slate-500" /> : <LucideIcons.List size={14} className="text-slate-500" />}
                  To Bullets
                </button>
                <button 
                  onClick={() => handleAITextAction("keywords", sel.id)}
                  disabled={loadingAIAction !== null}
                  className="flex items-center gap-2 text-xs text-left px-3 py-2 bg-app-surface hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors font-medium border border-app-border disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingAIAction === "keywords" ? <LucideIcons.Loader2 size={14} className="animate-spin text-yellow-500" /> : <LucideIcons.Key size={14} className="text-yellow-500" />}
                  Keywords
                </button>
              </div>
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
                              : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-teal-200 text-app-text-muted"
                          }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 select-none">
                    Image Adjustments
                  </p>
                  
                  {/* Opacity */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-app-text-muted">Opacity</span>
                    <span className="text-[10px] text-slate-400 font-mono">{Math.round((sel.opacity ?? 1) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={sel.opacity ?? 1}
                    onChange={(e) => updateProp("opacity", parseFloat(e.target.value))}
                    onMouseDown={_snapshot}
                    className="w-full accent-teal-500 mb-4 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />

                  {/* Rotation */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-app-text-muted">Rotation</span>
                    <span className="text-[10px] text-slate-400 font-mono">{sel.rotation || 0}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="1"
                    value={sel.rotation || 0}
                    onChange={(e) => updateProp("rotation", parseInt(e.target.value, 10))}
                    onMouseDown={_snapshot}
                    className="w-full accent-teal-500 mb-4 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />

                  {/* Border Radius */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-app-text-muted">Border Radius</span>
                    <span className="text-[10px] text-slate-400 font-mono">{sel.border_radius || 0}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={sel.border_radius || 0}
                    onChange={(e) => updateProp("border_radius", parseInt(e.target.value, 10))}
                    onMouseDown={_snapshot}
                    className="w-full accent-teal-500 mb-4 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />

                  {/* Drop Shadow */}
                  <label className="flex items-center justify-between cursor-pointer mb-2 group">
                    <span className="text-[11px] font-medium text-app-text-muted group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">Drop Shadow</span>
                    <input
                      type="checkbox"
                      checked={!!sel.shadow}
                      onChange={(e) => {
                        _snapshot();
                        updateProp("shadow", e.target.checked);
                      }}
                      className="accent-teal-500 w-3.5 h-3.5 cursor-pointer rounded"
                    />
                  </label>
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setCropSource(sel.image_path || null)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px]
                      font-bold text-slate-700 dark:text-slate-200 border-2 border-app-border
                      bg-white dark:bg-slate-800 hover:border-teal-400 hover:text-teal-600
                      transition-all select-none group"
                  >
                    <LucideIcons.Crop
                      size={12}
                      className="group-hover:scale-110 transition-transform"
                    />
                    Crop
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveBG(sel.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px]
                      font-bold text-teal-600 border-2 border-teal-100 dark:border-teal-900/50
                      bg-teal-50/50 dark:bg-teal-900/10 hover:bg-teal-100 dark:hover:bg-teal-900/20
                      transition-all select-none group"
                  >
                    <LucideIcons.Sparkles
                      size={12}
                      className="animate-pulse group-hover:scale-110 transition-transform"
                    />
                    AI Remove BG
                  </button>
                </div>
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
      className="flex flex-col border-t border-app-border bg-app-surface"
      style={{ height: layersCollapsed ? "auto" : "38%" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-app-bg/60 shrink-0 cursor-pointer"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setLayersCollapsed((p) => !p)}
      >
        <div className="flex items-center gap-2">
          <Layers size={13} className="text-slate-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-app-text-secondary select-none">
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
              <div
                key={el.id}
                className={`w-full flex items-center px-2.5 py-2 rounded-lg transition-all text-[11px] font-medium select-none
                  ${
                    isSelected
                      ? "bg-teal-50 dark:bg-teal-900/25 text-teal-700 dark:text-teal-300 ring-1 ring-teal-200 dark:ring-teal-800"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500"
                  }`}
              >
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setSelectedIds([el.id]);
                    if (isMobile) setMobilePanel("properties");
                  }}
                  className="flex-1 flex items-center gap-2 text-left truncate"
                >
                  <LIcon size={11} className="shrink-0 opacity-60" />
                  <span className="capitalize truncate flex-1">{label}</span>
                  <span className="font-mono text-[10px] opacity-40">
                    #{(el.id && el.id.includes("_")) ? el.id.split("_")[1] : (el.id ? el.id.slice(-4) : "1")}
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    _snapshot();
                    setElements(prev => prev.map(e => e.id === el.id ? { ...e, locked: !e.locked } : e));
                  }}
                  className={`p-1 rounded ml-1 transition-colors ${
                    el.locked ? "text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/20" : "text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                  title={el.locked ? "Unlock layer" : "Lock layer"}
                >
                  {el.locked ? <LucideIcons.Lock size={12} /> : <LucideIcons.Unlock size={12} />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col font-sans text-app-text bg-app-bg"
      style={{ height: "100dvh", overflow: "hidden" }}
    >
      {/* ── TOP BAR ── */}
      <header className="h-14 bg-app-surface/70 backdrop-blur-xl border-b border-app-border flex items-center justify-between px-4 shrink-0 z-30 shadow-sm select-none">
        {/* LEFT: Brand & Document Name */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleExit}
            className="p-1.5 rounded-lg hover:bg-app-bg transition-colors text-app-text-secondary hover:text-app-text"
            title="Back to Dashboard"
          >
            <LucideIcons.LayoutGrid size={18} />
          </button>
          
          <div className="w-px h-5 bg-app-border mx-1" />
          
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md border border-white/20">
              <span className="text-white font-black text-xs">Ai</span>
            </div>
            <input
              type="text"
              value={resumeTitle}
              onChange={(e) => setResumeTitle(e.target.value)}
              className="bg-transparent font-bold text-sm tracking-tight outline-none focus:bg-app-bg hover:bg-app-bg focus:px-2 hover:px-2 rounded transition-all w-32 sm:w-48 text-app-text"
              placeholder="Untitled Document"
            />
          </div>
          
          <div className="hidden lg:flex items-center gap-2 ml-2 px-2.5 py-1 bg-app-bg rounded-full border border-app-border text-[10px] font-bold text-app-text-muted">
            {isSyncing ? (
              <>
                <RefreshCw size={12} className="animate-spin text-indigo-500" />
                <span className="uppercase tracking-widest text-indigo-600/70 dark:text-indigo-400/70">Syncing...</span>
              </>
            ) : (
              <>
                <Cloud size={12} className="text-app-text-muted" />
                <span className="uppercase tracking-widest">
                  Saved {lastSaved ? `at ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
                </span>
              </>
            )}
          </div>
        </div>

        {/* CENTER: Tool Toggles */}
        <div className="hidden md:flex items-center justify-center gap-1 shrink-0 absolute left-1/2 -translate-x-1/2 bg-app-bg/80 backdrop-blur-md p-1 rounded-xl border border-app-border shadow-sm">
          <IconBtn icon={RotateCcw} onClick={undo} disabled={!undoStack.length} title="Undo (⌘Z)" />
          <IconBtn icon={RotateCw} onClick={redo} disabled={!redoStack.length} title="Redo (⌘Y)" />
          <div className="w-px h-5 bg-app-border mx-1" />
          
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 text-xs font-mono px-1">
            <button onClick={() => setZoom((z) => Math.max(25, z - 10))} className="p-1.5 hover:bg-app-surface rounded-lg shadow-sm text-app-text-secondary hover:text-indigo-500 transition-colors">
              <ZoomOut size={14} />
            </button>
            <span className="w-12 text-center text-app-text-secondary cursor-pointer hover:text-indigo-500 font-semibold" onClick={() => setZoom(100)}>
              {zoom}%
            </span>
            <button onClick={() => setZoom((z) => Math.min(200, z + 10))} className="p-1.5 hover:bg-app-surface rounded-lg shadow-sm text-app-text-secondary hover:text-indigo-500 transition-colors">
              <ZoomIn size={14} />
            </button>
          </div>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exportImage("png")}
            disabled={isExporting}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg shadow-sm bg-app-bg border border-app-border text-app-text-secondary hover:border-indigo-500 hover:text-indigo-500 transition-all disabled:opacity-50"
            title="Export as PNG"
          >
            <LucideIcons.Image size={14} />
          </button>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exportImage("jpeg")}
            disabled={isExporting}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg shadow-sm bg-app-bg border border-app-border text-app-text-secondary hover:border-indigo-500 hover:text-indigo-500 transition-all disabled:opacity-50"
            title="Export as JPG"
          >
            <LucideIcons.Camera size={14} />
          </button>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="hidden md:flex p-2 rounded-lg text-app-text-muted hover:text-app-text hover:bg-app-bg transition-colors"
            title="Toggle Dark Mode"
          >
            <LucideIcons.Moon size={16} />
          </button>
          
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowChatbot((p) => !p)}
            className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${showChatbot ? 'bg-indigo-500 border-indigo-600 text-white shadow-sm' : 'bg-app-bg border-app-border text-app-text-secondary hover:border-indigo-500 hover:text-indigo-500'}`}
          >
            <LucideIcons.Sparkles size={14} className={showChatbot ? 'animate-pulse' : ''} />
            AI Tools
          </button>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-lg shadow-[0_4px_12px_-4px_rgba(79,70,229,0.5)]
              bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white transition-all disabled:opacity-50"
          >
            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            <span className="hidden sm:inline">{isExporting ? "Exporting..." : "Export PDF"}</span>
          </button>
          
          <div className="w-px h-5 bg-app-border mx-1 hidden sm:block" />
          
          {user && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-yellow-100/50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-bold mr-1">
              <LucideIcons.Zap size={14} className="fill-yellow-500 text-yellow-500" />
              {credits}
            </div>
          )}

          <button className="hidden sm:flex w-7 h-7 rounded-full bg-app-bg border-2 border-app-border overflow-hidden shadow-sm items-center justify-center">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
            ) : (
              <LucideIcons.User size={14} className="text-app-text-muted" />
            )}
          </button>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setMobilePanel((p) => (p === "menu" ? null : "menu"))}
            className="md:hidden p-2 rounded-lg hover:bg-app-bg text-app-text-secondary transition-colors"
          >
            <LucideIcons.Menu size={18} />
          </button>
        </div>
      </header>

      {/* ── WORKSPACE ROW ── */}
<div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── LEFT SIDEBAR (DOCK + FLYOUT) ── */}
        <div className="flex h-full shrink-0 z-20 shadow-[4px_0_24px_-10px_rgba(0,0,0,0.05)]">
          {/* Dock */}
          <aside className="w-16 hidden md:flex flex-col bg-app-surface/70 backdrop-blur-xl border-r border-app-border relative z-30">
            <div className="flex flex-col items-center py-4 gap-2">
              {[
                { id: "elements", icon: LucideIcons.Blocks, label: "Elements" },
                { id: "sections", icon: LucideIcons.LayoutList, label: "Sections" },
                { id: "layers", icon: LucideIcons.Layers, label: "Layers" },
                { id: "pages", icon: LucideIcons.File, label: "Pages" },
                { id: "templates", icon: LucideIcons.LayoutTemplate, label: "Templates" },
                { id: "ai", icon: LucideIcons.Sparkles, label: "AI Tools" },
                { id: "assets", icon: LucideIcons.Image, label: "Assets" },
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveLeftPanel((p) => (p === id ? null : id))}
                  className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${
                    activeLeftPanel === id
                      ? "bg-app-accent/10 text-app-accent shadow-sm border border-app-accent/20"
                      : "text-app-text/40 hover:text-app-text hover:bg-app-surface border border-transparent"
                  }`}
                >
                  <Icon size={20} strokeWidth={activeLeftPanel === id ? 2.5 : 2} />
                  <span className="text-[8px] font-bold mt-1 uppercase tracking-wider">{label}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* Active Flyout Panel (Desktop) */}
          {activeLeftPanel && !isMobile && (
            <div className="w-72 bg-app-surface/95 backdrop-blur-xl border-r border-app-border flex flex-col h-full relative z-20 shadow-lg">
              {activeLeftPanel === "elements" && (
                <div className="p-4 flex flex-col h-full overflow-y-auto custom-scrollbar">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-app-text/50 mb-4 px-1">Add Elements</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {tools.map(({ id, icon: Icon, label, hoverCls, action }) => (
                      <button
                        key={id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={action}
                        title={label}
                        className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl bg-app-bg border border-app-border text-app-text/60 shadow-sm transition-all select-none hover:border-app-accent hover:text-app-accent hover:bg-app-surface ${hoverCls}`}
                      >
                        <Icon size={22} strokeWidth={1.8} />
                        <span className="text-[10px] font-bold tracking-wide uppercase">
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeLeftPanel === "sections" && (
                <div className="flex flex-col h-full overflow-hidden bg-transparent">
                  <div className="p-4 border-b border-app-border shrink-0">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-app-text/50">Block Builder</h3>
                    <p className="text-[10px] text-app-text/40 mt-1">Click to drop a grouped section</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
                    {RESUME_BLOCKS.map((block) => {
                      const Icon = (LucideIcons as any)[block.icon] || LucideIcons.LayoutTemplate;
                      return (
                        <button
                          key={block.id}
                          onClick={() => addBlock(block.id)}
                          className="flex flex-col text-left p-3 rounded-xl bg-app-bg border border-app-border shadow-sm hover:bg-app-surface hover:border-app-accent hover:shadow-md transition-all group"
                        >
                          <div className="flex items-center gap-2 mb-2 text-app-text/60 group-hover:text-app-accent">
                            <Icon size={16} />
                            <span className="font-bold text-xs uppercase tracking-wide">{block.name}</span>
                          </div>
                          <div className="flex items-center justify-center bg-app-surface rounded overflow-hidden border border-app-border/50 pt-2">
                            <ErrorBoundary fallback={<div className="text-[10px] text-app-text-muted p-2">Preview unavailable</div>}>
                              <MiniPreview elements={block.elements('preview-group', activePageId, 0)} />
                            </ErrorBoundary>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeLeftPanel === "layers" && (
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="p-4 border-b border-app-border shrink-0">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-app-text/50">Layers</h3>
                  </div>
                  <div className="flex-1 min-h-0">
                    {renderLayers()}
                  </div>
                </div>
              )}

              {activeLeftPanel === "templates" && (
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="p-4 border-b border-app-border shrink-0">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-app-text/50">Templates</h3>
                    <p className="text-[10px] text-app-text/40 mt-1">Start from a pre-designed layout</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                    {RESUME_TEMPLATES.map((tpl) => (
                      <div
                        key={tpl.id}
                        onClick={() => applyTemplate(tpl.id)}
                        className="w-full p-3 rounded-xl bg-app-bg border border-app-border shadow-sm hover:border-app-accent hover:shadow-md transition-all cursor-pointer group flex flex-col gap-2"
                      >
                        <div className="w-full h-44 bg-app-surface border border-app-border rounded-lg p-2 overflow-hidden flex items-center justify-center">
                          <TemplateThumbnailPreview template={tpl} />
                        </div>
                        <h4 className="text-xs font-bold text-app-text uppercase tracking-wide truncate">{tpl.name}</h4>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeLeftPanel === "pages" && (
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="p-4 border-b border-app-border flex items-center justify-between shrink-0">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-app-text/50">Pages</h3>
                    <button
                      onClick={() => {
                        const newPageId = `page-${Date.now()}`;
                        setPages([...pages, { id: newPageId, width: 612, height: 792 }]);
                        setActivePageId(newPageId);
                      }}
                      className="p-1.5 bg-app-accent/10 text-app-accent hover:bg-app-accent/20 rounded-lg transition-colors"
                    >
                      <LucideIcons.Plus size={14} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                    {pages.map((p, i) => (
                      <div
                        key={p.id}
                        onClick={() => setActivePageId(p.id)}
                        className={`group relative aspect-[0.77] w-full rounded-xl border-2 transition-all cursor-pointer overflow-hidden bg-white shadow-sm
                          ${activePageId === p.id ? 'border-app-accent shadow-md' : 'border-app-border hover:border-app-text/20'}`}
                      >
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/50 text-white text-[10px] rounded font-bold">
                          {i + 1}
                        </div>
                        
                        {pages.length > 1 && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (await confirm({ title: "Delete Page", description: "Are you sure you want to delete this page?", danger: true })) {
                                setPages(pages.filter(pg => pg.id !== p.id));
                                if (activePageId === p.id) {
                                  setActivePageId(pages[0].id === p.id ? pages[1].id : pages[0].id);
                                }
                                setElements(prev => prev.filter(el => (el.page_id || 'page-1') !== p.id));
                              }
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <LucideIcons.Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeLeftPanel === "ai" && (
                <AIAssistantSidebar 
                  elements={elements}
                  linkedinUrl={linkedinUrl}
                  setLinkedinUrl={setLinkedinUrl}
                  handleATSUpload={handleATSUpload}
                  handleLinkedInImport={handleLinkedInImport}
                  onInsertToCanvas={handleInsertToCanvas}
                  onApplyFix={applySurgicalFix}
                />
              )}

              {activeLeftPanel === "assets" && (
                <div className="flex-1 overflow-hidden">
                  <AssetsPanel onInsert={handleInsertAsset} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* CENTER: CANVAS */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-app-bg relative shadow-[inset_0_0_20px_rgba(0,0,0,0.02)]">
          <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          <div className="flex-1 min-h-0 overflow-hidden relative">
            <ErrorBoundary fallback={<div className="p-8 text-center text-rose-500 font-bold">Canvas Error. Please undo or refresh.</div>}>
              <EditorCanvas
                elements={elements}
                setElements={setElements}
                pages={pages}
                activePageId={activePageId}
                setActivePageId={setActivePageId}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
                pageWidth={612}
                pageHeight={792}
                onSnapshot={_snapshot}
                zoom={zoom}
                snapEnabled={snapEnabled}
                isGroupingMode={isGroupingMode}
                processingIds={processingIds}
                onContextMenu={handleContextMenu}
              />
            </ErrorBoundary>
          </div>

          {/* Status bar */}
          <div className="h-8 bg-app-surface border-t border-app-border flex items-center px-4 gap-4 text-[11px] text-app-text/50 shrink-0 select-none">
            <span>
              {elements.length} element{elements.length !== 1 ? "s" : ""}
            </span>
            {sel && (
              <span className="text-app-accent font-semibold">
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
                className={`mr-2 hover:opacity-100 transition-opacity ${snapEnabled ? "text-app-accent opacity-100" : "text-app-text/40 opacity-50"}`}
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

        {/* RIGHT SIDEBAR: Properties */}
        <aside
          className={`
            ${rightOpen ? "w-72 xl:w-80" : "w-0"}
            hidden md:flex flex-col shrink-0 bg-app-surface/90 backdrop-blur-md
            border-l border-app-border z-20 shadow-[-4px_0_24px_-10px_rgba(0,0,0,0.05)]
            overflow-hidden transition-all duration-200
          `}
        >
          <div className="flex flex-col h-full overflow-hidden">
            {/* Properties header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-app-border bg-app-bg/60 shrink-0 select-none">
              <Settings2 size={13} className="text-slate-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-app-text-secondary">
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
          </div>
        </aside>
      </div>

      {/* ── MOBILE BOTTOM TAB BAR ── */}
      <div className="md:hidden flex items-center bg-app-surface/90 backdrop-blur-xl border-t border-app-border px-2 py-1.5 shrink-0 z-30 select-none overflow-x-auto gap-1.5 shadow-lg" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {[
          { id: "elements" as PanelId, icon: Blocks, label: "Add" },
          { id: "sections" as PanelId, icon: LucideIcons.LayoutList, label: "Blocks" },
          { id: "properties" as PanelId, icon: Settings2, label: "Edit", badge: !!sel },
          { id: "layers" as PanelId, icon: Layers, label: "Layers" },
          { id: "templates" as PanelId, icon: LucideIcons.LayoutTemplate, label: "Templates" },
          { id: "pages" as PanelId, icon: LucideIcons.File, label: "Pages" },
          { id: "ai" as PanelId, icon: LucideIcons.Sparkles, label: "AI Tools" },
          { id: "assets" as PanelId, icon: LucideIcons.Image, label: "Assets" },
        ].map(({ id, icon: Icon, label, badge }) => (
          <button
            key={id}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setMobilePanel((p) => (p === id ? null : id))}
            className={`flex flex-col items-center justify-center gap-1 min-w-[68px] px-2 py-1.5 rounded-xl transition-all shrink-0 relative ${
              mobilePanel === id
                ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm"
                : badge
                ? "text-brand-primary font-bold bg-brand-primary/10"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <div className="relative">
              <Icon size={19} />
              {badge && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-brand-primary animate-ping" />
              )}
            </div>
            <span className="text-[10px] font-semibold tracking-tight">{label}</span>
          </button>
        ))}
        {sel && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={deleteSelected}
            className="flex flex-col items-center justify-center gap-1 min-w-[68px] px-2 py-1.5 rounded-xl text-red-500 shrink-0 hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            <Trash2 size={19} />
            <span className="text-[10px] font-semibold tracking-tight">Delete</span>
          </button>
        )}
      </div>

      {/* ── MOBILE SLIDE-UP SHEET ── */}
      {mobilePanel && (
        <div className="md:hidden fixed inset-0 z-40 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobilePanel(null)}
          />
          <div
            className="relative bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.15)] flex flex-col border-t border-white/20 dark:border-zinc-800/50"
            style={{ maxHeight: "85dvh" }}
          >
            {/* Sheet Handle */}
            <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2 shrink-0" />

            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200/50 dark:border-zinc-800/50 shrink-0 select-none">
              <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200 tracking-wide">
                {mobilePanel === "elements" ? "Add Element"
                  : mobilePanel === "layers" ? "Layers"
                  : mobilePanel === "sections" ? "Blocks"
                  : mobilePanel === "templates" ? "Templates"
                  : mobilePanel === "pages" ? "Pages"
                  : mobilePanel === "ai" ? "AI Tools"
                  : mobilePanel === "menu" ? "Menu"
                  : mobilePanel === "assets" ? "Assets"
                  : "Properties"}
              </span>
              <div className="flex items-center gap-2">
                {mobilePanel === "pages" && (
                  <button onClick={addPage} className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 transition-colors">
                    <LucideIcons.Plus size={16} />
                  </button>
                )}
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setMobilePanel(null)}
                  className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500"
                >
                  <X size={18} />
                </button>
              </div>
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
                          #{(el.id && el.id.includes("_")) ? el.id.split("_")[1] : (el.id ? el.id.slice(-4) : "1")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {mobilePanel === "properties" && renderProperties()}

              {mobilePanel === "sections" && (
                <div className="p-3 grid grid-cols-1 gap-3">
                  {RESUME_BLOCKS.map((block) => {
                    const Icon = (LucideIcons as any)[block.icon] || LucideIcons.LayoutTemplate;
                    return (
                      <button
                        key={block.id}
                        onClick={() => { addBlock(block.id); setMobilePanel(null); }}
                        className="flex flex-col text-left p-3 rounded-xl bg-app-surface border border-app-border shadow-sm hover:bg-white dark:hover:bg-zinc-800 transition-all"
                      >
                        <div className="flex items-center gap-2 mb-2 text-slate-700 dark:text-slate-200">
                          <Icon size={16} />
                          <span className="font-bold text-xs uppercase tracking-wide">{block.name}</span>
                        </div>
                        <div className="flex justify-center bg-white dark:bg-slate-700/50 rounded overflow-hidden pt-2 border border-slate-200 dark:border-slate-600">
                          <ErrorBoundary fallback={<div className="text-[10px] text-app-text-muted p-2">Preview unavailable</div>}>
                            <MiniPreview elements={block.elements('preview-group', activePageId, 0)} />
                          </ErrorBoundary>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {mobilePanel === "templates" && (
                <div className="p-3 grid grid-cols-2 gap-3">
                  {RESUME_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={async () => {
                        if (await confirm({ title: "Apply Template", description: "This will replace your current design. Continue?", danger: true })) {
                          applyTemplate(tpl.id);
                          setMobilePanel(null);
                        }
                      }}
                      className="flex flex-col text-left p-3 rounded-xl bg-app-surface border border-app-border shadow-sm transition-all"
                    >
                      <span className="font-bold text-xs uppercase tracking-wide text-slate-700 dark:text-slate-200 mb-1">{tpl.name}</span>
                      <div className="flex justify-center bg-white dark:bg-slate-700/50 rounded overflow-hidden w-full relative pt-2 border border-slate-200 dark:border-slate-600 mt-2">
                        <ErrorBoundary fallback={<div className="text-[10px] text-app-text-muted p-2">Preview unavailable</div>}>
                          <MiniPreview elements={tpl.elements(activePageId)} />
                        </ErrorBoundary>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {mobilePanel === "pages" && (
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {pages.map((p, i) => (
                    <div
                      key={p.id}
                      onClick={() => { setActivePageId(p.id); setMobilePanel(null); }}
                      className={`group relative aspect-[0.77] w-full rounded-xl border-2 transition-all cursor-pointer overflow-hidden bg-white shadow-sm ${activePageId === p.id ? 'border-teal-500 shadow-md' : 'border-app-border'}`}
                    >
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/50 text-white text-[10px] rounded font-bold">{i + 1}</div>
                      {pages.length > 1 && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (await confirm({ title: "Delete Page", description: "Are you sure you want to delete this page?", danger: true })) {
                              setPages(pages.filter(pg => pg.id !== p.id));
                              if (activePageId === p.id) setActivePageId(pages[0].id === p.id ? pages[1].id : pages[0].id);
                              setElements(prev => prev.filter(el => (el.page_id || 'page-1') !== p.id));
                            }
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-100 transition-opacity"
                        >
                          <LucideIcons.Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {mobilePanel === "ai" && (
                <div className="p-0 h-full flex flex-col min-h-[50vh]">
                  <AIAssistantSidebar
                    elements={elements}
                    linkedinUrl={linkedinUrl}
                    setLinkedinUrl={setLinkedinUrl}
                    handleATSUpload={handleATSUpload}
                    handleLinkedInImport={handleLinkedInImport}
                    onInsertToCanvas={handleInsertToCanvas}
                    onApplyFix={applySurgicalFix}
                  />
                </div>
              )}

              {mobilePanel === "menu" && (
                <div className="p-4 grid grid-cols-2 gap-3">
                  <button onClick={() => { undo(); setMobilePanel(null); }} disabled={!undoStack.length} className="flex flex-col items-center gap-2 py-4 rounded-xl bg-app-surface text-slate-600 disabled:opacity-50 transition-colors">
                    <RotateCcw size={20} />
                    <span className="text-[10px] font-bold">Undo</span>
                  </button>
                  <button onClick={() => { redo(); setMobilePanel(null); }} disabled={!redoStack.length} className="flex flex-col items-center gap-2 py-4 rounded-xl bg-app-surface text-slate-600 disabled:opacity-50 transition-colors">
                    <RotateCw size={20} />
                    <span className="text-[10px] font-bold">Redo</span>
                  </button>
                  <button onClick={() => setZoom(z => Math.min(200, z + 25))} className="flex flex-col items-center gap-2 py-4 rounded-xl bg-app-surface text-slate-600 transition-colors">
                    <ZoomIn size={20} />
                    <span className="text-[10px] font-bold">Zoom In ({zoom}%)</span>
                  </button>
                  <button onClick={() => setZoom(z => Math.max(25, z - 25))} className="flex flex-col items-center gap-2 py-4 rounded-xl bg-app-surface text-slate-600 transition-colors">
                    <ZoomOut size={20} />
                    <span className="text-[10px] font-bold">Zoom Out</span>
                  </button>
                  <button onClick={() => { exportImage("png"); setMobilePanel(null); }} className="flex flex-col items-center gap-2 py-4 rounded-xl bg-app-surface text-slate-600 transition-colors">
                    <LucideIcons.Image size={20} />
                    <span className="text-[10px] font-bold">Export PNG</span>
                  </button>
                  <button onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setMobilePanel(null); }} className="flex flex-col items-center gap-2 py-4 rounded-xl bg-app-surface text-slate-600 transition-colors">
                    <LucideIcons.Moon size={20} />
                    <span className="text-[10px] font-bold">Toggle Dark Mode</span>
                  </button>
                </div>
              )}

              {mobilePanel === "assets" && (
                <div className="flex-1 overflow-hidden">
                  <AssetsPanel onInsert={handleInsertAsset} />
                </div>
              )}
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
            className="bg-app-surface w-full sm:rounded-2xl sm:max-w-2xl flex flex-col
              shadow-2xl border border-app-border overflow-hidden rounded-t-2xl"
            style={{ maxHeight: "85dvh" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-app-border bg-app-surface/80 shrink-0 select-none">
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

            <div className="p-3 border-b border-app-border shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search icons…"
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  autoFocus
                  onMouseDown={(e) => e.stopPropagation()}
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-app-surface rounded-xl
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

      {contextMenu && (
        <div
          className="fixed z-[9999] bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-app-border w-48 overflow-hidden text-xs py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseDown={(e) => e.stopPropagation()} // Prevent canvas deselect
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.elementId ? (
            <>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-left text-slate-700 dark:text-slate-200"
                onClick={() => {
                  duplicate();
                  setContextMenu(null);
                }}
              >
                <Copy size={14} className="text-slate-400" />
                Duplicate
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-left text-slate-700 dark:text-slate-200"
                onClick={() => {
                  const isLocked = elements.find(el => el.id === contextMenu.elementId)?.locked;
                  _snapshot();
                  setElements(prev => prev.map(el => el.id === contextMenu.elementId ? { ...el, locked: !isLocked } : el));
                  setContextMenu(null);
                }}
              >
                {elements.find(el => el.id === contextMenu.elementId)?.locked ? (
                  <LucideIcons.Unlock size={14} className="text-slate-400" />
                ) : (
                  <LucideIcons.Lock size={14} className="text-slate-400" />
                )}
                {elements.find(el => el.id === contextMenu.elementId)?.locked ? "Unlock Element" : "Lock Element"}
              </button>
              <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
              <button
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-left text-slate-700 dark:text-slate-200"
                onClick={() => {
                  moveForward();
                  setContextMenu(null);
                }}
              >
                <ChevronUp size={14} className="text-slate-400" />
                Bring Forward
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-left text-slate-700 dark:text-slate-200"
                onClick={() => {
                  moveBackward();
                  setContextMenu(null);
                }}
              >
                <ChevronDown size={14} className="text-slate-400" />
                Send Backward
              </button>
              <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
              <button
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-left text-red-500"
                onClick={() => {
                  deleteSelected();
                  setContextMenu(null);
                }}
              >
                <Trash2 size={14} className="text-red-400" />
                Delete
              </button>
            </>
          ) : (
            <div className="px-3 py-2 text-slate-400 text-center select-none">
              Canvas Actions
            </div>
          )}
        </div>
      )}
    </div>
  );
}
