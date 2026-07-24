import React, { useState } from "react";
import type { Page } from "../../types/editor";
import {
  FileText,
  RotateCcw,
  Sliders,
  Check,
  Palette,
  Maximize2,
  Copy,
  Trash2,
  Plus,
  Compass,
  Ruler,
  Grid
} from "lucide-react";

export const PAGE_FORMATS = [
  { id: "letter", label: "US Letter", width: 612, height: 792, desc: "8.5 × 11 in (US Standard)" },
  { id: "a4", label: "A4 Standard", width: 595, height: 842, desc: "210 × 297 mm (International)" },
  { id: "legal", label: "US Legal", width: 612, height: 1008, desc: "8.5 × 14 in (Legal Formal)" },
  { id: "executive", label: "Executive", width: 522, height: 756, desc: "7.25 × 10.5 in (Compact)" },
  { id: "a5", label: "A5 Booklet", width: 420, height: 595, desc: "148 × 210 mm (Half A4)" },
];

export const PAGE_BG_PRESETS = [
  { label: "White", color: "#ffffff", border: "#e2e8f0" },
  { label: "Cream", color: "#fdfbf7", border: "#f3ebd9" },
  { label: "Slate", color: "#f8fafc", border: "#cbd5e1" },
  { label: "Warm Sand", color: "#fafaf9", border: "#e7e5e4" },
  { label: "Mint", color: "#f0fdf4", border: "#bbf7d0" },
  { label: "Midnight", color: "#0f172a", border: "#334155" },
];

export const MARGIN_PRESETS = [
  { id: "normal", label: "Normal (0.75 in)", val: 54 },
  { id: "narrow", label: "Narrow (0.5 in)", val: 36 },
  { id: "wide", label: "Wide (1.0 in)", val: 72 },
  { id: "none", label: "Full Bleed (0 in)", val: 0 },
];

interface PagePropertiesPanelProps {
  pages: Page[];
  setPages: React.Dispatch<React.SetStateAction<Page[]>>;
  activePageId: string;
  setActivePageId: (id: string) => void;
  onSnapshot: () => void;
}

export function PagePropertiesPanel({
  pages,
  setPages,
  activePageId,
  setActivePageId,
  onSnapshot,
}: PagePropertiesPanelProps) {
  const activePage = pages.find((p) => p.id === activePageId) || pages[0] || {
    id: "page-1",
    width: 612,
    height: 792,
  };

  const isLandscape = activePage.width > activePage.height;
  const activeBgColor = activePage.bg_color || "#ffffff";
  const activeMargin = activePage.margin ?? 54;

  const updateActivePage = (updates: Partial<Page>) => {
    onSnapshot();
    setPages((prevPages) =>
      prevPages.map((p) => (p.id === activePage.id ? { ...p, ...updates } : p))
    );
  };

  // Change page format (Letter, A4, Legal, etc.)
  const handleFormatChange = (fmtId: string) => {
    const fmt = PAGE_FORMATS.find((f) => f.id === fmtId);
    if (!fmt) return;

    const newWidth = isLandscape ? Math.max(fmt.width, fmt.height) : Math.min(fmt.width, fmt.height);
    const newHeight = isLandscape ? Math.min(fmt.width, fmt.height) : Math.max(fmt.width, fmt.height);

    updateActivePage({
      format: fmtId as any,
      width: newWidth,
      height: newHeight,
    });
  };

  // Toggle Orientation between Portrait & Landscape
  const handleToggleOrientation = (targetOrientation: "portrait" | "landscape") => {
    if ((targetOrientation === "landscape" && isLandscape) || (targetOrientation === "portrait" && !isLandscape)) {
      return;
    }

    // Swap width and height smoothly
    updateActivePage({
      orientation: targetOrientation,
      width: activePage.height,
      height: activePage.width,
    });
  };

  // Handle Custom Width / Height Inputs
  const handleCustomWidthChange = (val: number) => {
    if (isNaN(val) || val < 100 || val > 3000) return;
    updateActivePage({ width: val, format: "custom" as any });
  };

  const handleCustomHeightChange = (val: number) => {
    if (isNaN(val) || val < 100 || val > 3000) return;
    updateActivePage({ height: val, format: "custom" as any });
  };

  return (
    <div className="flex flex-col gap-5 p-4 text-app-text select-none overflow-y-auto">
      {/* Panel Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-app-border">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand-primary/10 text-brand-primary">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-app-text">
              Page Properties
            </h3>
            <span className="text-[10px] text-app-text-muted">
              Page {pages.findIndex((p) => p.id === activePage.id) + 1} of {pages.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-app-bg text-app-text-secondary border border-app-border font-bold">
            {activePage.width} × {activePage.height} pt
          </span>
        </div>
      </div>

      {/* 1. Page Format Preset Picker */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-app-text flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-brand-primary" />
          Page Format / Paper Size
        </label>
        <div className="grid grid-cols-1 gap-1.5">
          {PAGE_FORMATS.map((fmt) => {
            const isSelected =
              activePage.format === fmt.id ||
              (!activePage.format &&
                Math.min(activePage.width, activePage.height) === fmt.width &&
                Math.max(activePage.width, activePage.height) === fmt.height);

            return (
              <button
                key={fmt.id}
                onClick={() => handleFormatChange(fmt.id)}
                className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? "bg-brand-primary/10 border-brand-primary text-brand-primary shadow-xs"
                    : "bg-app-bg border-app-border text-app-text hover:border-brand-primary/40"
                }`}
              >
                <div>
                  <div className="text-xs font-black">{fmt.label}</div>
                  <div className="text-[10px] opacity-75">{fmt.desc}</div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-brand-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Orientation Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-app-text flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-brand-primary" />
          Page Orientation
        </label>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleToggleOrientation("portrait")}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
              !isLandscape
                ? "bg-brand-primary/10 border-brand-primary text-brand-primary ring-1 ring-brand-primary/30"
                : "bg-app-bg border-app-border text-app-text-muted hover:text-app-text"
            }`}
          >
            {/* Portrait Miniature Icon */}
            <div className="w-5 h-7 rounded border-2 border-current flex items-center justify-center">
              <div className="w-3 h-1 bg-current opacity-40 rounded-xs" />
            </div>
            <span className="text-xs font-bold">Portrait</span>
          </button>

          <button
            onClick={() => handleToggleOrientation("landscape")}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
              isLandscape
                ? "bg-brand-primary/10 border-brand-primary text-brand-primary ring-1 ring-brand-primary/30"
                : "bg-app-bg border-app-border text-app-text-muted hover:text-app-text"
            }`}
          >
            {/* Landscape Miniature Icon */}
            <div className="w-7 h-5 rounded border-2 border-current flex items-center justify-center">
              <div className="w-4 h-1 bg-current opacity-40 rounded-xs" />
            </div>
            <span className="text-xs font-bold">Landscape</span>
          </button>
        </div>
      </div>

      {/* 3. Custom Dimensions Inputs */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-app-text flex items-center gap-1.5">
          <Ruler className="w-3.5 h-3.5 text-brand-primary" />
          Custom Page Dimensions (pt)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-app-text-muted font-bold block mb-1">Width</span>
            <input
              type="number"
              value={activePage.width}
              onChange={(e) => handleCustomWidthChange(parseInt(e.target.value))}
              className="w-full px-3 py-1.5 bg-app-bg border border-app-border rounded-xl text-xs font-mono font-bold text-app-text focus:outline-none focus:border-brand-primary"
            />
          </div>
          <div>
            <span className="text-[10px] text-app-text-muted font-bold block mb-1">Height</span>
            <input
              type="number"
              value={activePage.height}
              onChange={(e) => handleCustomHeightChange(parseInt(e.target.value))}
              className="w-full px-3 py-1.5 bg-app-bg border border-app-border rounded-xl text-xs font-mono font-bold text-app-text focus:outline-none focus:border-brand-primary"
            />
          </div>
        </div>
      </div>

      {/* 4. Background Color Picker */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-app-text flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-brand-primary" />
          Page Background Color
        </label>

        {/* Color Presets */}
        <div className="grid grid-cols-3 gap-2">
          {PAGE_BG_PRESETS.map((bg) => {
            const isSelected = activeBgColor.toLowerCase() === bg.color.toLowerCase();
            return (
              <button
                key={bg.color}
                onClick={() => updateActivePage({ bg_color: bg.color })}
                className={`p-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? "border-brand-primary ring-2 ring-brand-primary/30 shadow-xs"
                    : "border-app-border hover:border-brand-primary/40"
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full border shrink-0 shadow-xs"
                  style={{ backgroundColor: bg.color, borderColor: bg.border }}
                />
                <span className="text-[11px] font-bold text-app-text truncate">{bg.label}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Hex Color Input */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-app-border">
          <input
            type="color"
            value={activeBgColor.startsWith("#") ? activeBgColor : "#ffffff"}
            onChange={(e) => updateActivePage({ bg_color: e.target.value })}
            className="w-8 h-8 rounded-lg cursor-pointer border border-app-border bg-transparent p-0 overflow-hidden"
          />
          <input
            type="text"
            value={activeBgColor}
            onChange={(e) => updateActivePage({ bg_color: e.target.value })}
            placeholder="#ffffff"
            className="flex-1 px-3 py-1.5 bg-app-bg border border-app-border rounded-xl text-xs font-mono text-app-text font-bold uppercase focus:outline-none focus:border-brand-primary"
          />
        </div>
      </div>

      {/* 5. Page Margins Setting */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-app-text flex items-center gap-1.5">
          <Grid className="w-3.5 h-3.5 text-brand-primary" />
          Printable Page Margins
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {MARGIN_PRESETS.map((m) => {
            const isSelected = activeMargin === m.val;
            return (
              <button
                key={m.id}
                onClick={() => updateActivePage({ margin: m.val })}
                className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-brand-primary/10 border-brand-primary text-brand-primary"
                    : "bg-app-bg border-app-border text-app-text-muted hover:text-app-text"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
