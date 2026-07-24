import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Check, ArrowRight, Palette, Layers, Lock } from "lucide-react";
import { COVER_LETTER_TEMPLATES } from "../../lib/coverLetterTemplates";
import type { CoverLetterTemplate } from "../../lib/coverLetterTemplates";
import { useAuth } from "../../context/AuthContext";
import { UpgradeTriggerModal } from "../common/UpgradeTriggerModal";

interface CoverLetterTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  docTitle: string;
  onSelectTemplate: (templateId: string) => void;
}

type Category = "all" | "executive" | "modern" | "minimal" | "creative" | "academic";

export function CoverLetterTemplateModal({
  isOpen,
  onClose,
  docTitle,
  onSelectTemplate,
}: CoverLetterTemplateModalProps) {
  const { userPlan } = useAuth();
  const isProTier = userPlan === "pro" || userPlan === "career_pro" || userPlan === "lifetime";

  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("slate_minimalist");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (!isOpen) return null;

  const filteredTemplates = COVER_LETTER_TEMPLATES.filter(
    (t) => selectedCategory === "all" || t.category === selectedCategory
  );

  const handleTemplateClick = (tmpl: CoverLetterTemplate) => {
    if (tmpl.isPremium && !isProTier) {
      setShowUpgradeModal(true);
      return;
    }
    setSelectedTemplateId(tmpl.id);
  };

  const handleConfirm = () => {
    const selected = COVER_LETTER_TEMPLATES.find((t) => t.id === selectedTemplateId);
    if (selected?.isPremium && !isProTier) {
      setShowUpgradeModal(true);
      return;
    }
    onSelectTemplate(selectedTemplateId);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-app-surface border border-app-border rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="p-5 sm:p-6 border-b border-app-border flex items-center justify-between bg-app-bg/50 shrink-0">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[11px] font-black uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                15 Professional Canvas Layouts
              </div>
              <h3 className="text-lg sm:text-xl font-black text-app-text">
                Choose Template for "{docTitle || "Cover Letter"}"
              </h3>
              <p className="text-xs text-app-text-muted mt-0.5">
                Select your favorite layout and color theme to open directly in the Visual Canvas Editor.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-app-text-muted hover:text-app-text hover:bg-app-bg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Category Filter Bar */}
          <div className="p-4 border-b border-app-border flex items-center gap-1.5 overflow-x-auto shrink-0 bg-app-surface scrollbar-none">
            {[
              { id: "all", label: "✨ All (15)" },
              { id: "executive", label: "💼 Executive" },
              { id: "modern", label: "🚀 Modern" },
              { id: "minimal", label: "📄 Minimal" },
              { id: "creative", label: "🎨 Creative" },
              { id: "academic", label: "🎓 Academic" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as Category)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-brand-primary text-white shadow-sm"
                    : "bg-app-bg text-app-text-muted hover:text-app-text border border-app-border"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Template Grid */}
          <div className="p-5 sm:p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
            {filteredTemplates.map((tmpl) => {
              const isSelected = selectedTemplateId === tmpl.id;
              const isLocked = tmpl.isPremium && !isProTier;

              return (
                <button
                  key={tmpl.id}
                  onClick={() => handleTemplateClick(tmpl)}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between group cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? "bg-brand-primary/10 border-brand-primary ring-2 ring-brand-primary/40 shadow-md"
                      : isLocked
                      ? "bg-app-bg/60 border-app-border hover:border-amber-500/50 opacity-90"
                      : "bg-app-bg border-app-border hover:border-brand-primary/40 shadow-2xs"
                  }`}
                >
                  <div>
                    {/* Visual Miniature Template Card Header */}
                    <div
                      className="h-20 rounded-xl mb-3 p-3 flex flex-col justify-between relative overflow-hidden border border-black/10 shadow-inner"
                      style={{ backgroundColor: tmpl.bg_color }}
                    >
                      {/* Top Banner simulation */}
                      <div
                        className="h-6 rounded-md w-full flex items-center px-2 text-[9px] font-bold text-white shadow-xs justify-between"
                        style={{ backgroundColor: tmpl.header_bg }}
                      >
                        <span className="truncate">{tmpl.name}</span>
                        {isLocked && <Lock className="w-3 h-3 text-amber-300 shrink-0 ml-1" />}
                      </div>

                      {/* Accent Stripe simulation */}
                      <div
                        className="h-1 rounded-full w-full"
                        style={{ backgroundColor: tmpl.accent_color }}
                      />

                      {/* Paragraph text simulation lines */}
                      <div className="space-y-1">
                        <div className="h-1 bg-current opacity-30 rounded w-full" style={{ color: tmpl.text_color }} />
                        <div className="h-1 bg-current opacity-30 rounded w-3/4" style={{ color: tmpl.text_color }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className={`font-black text-sm ${isSelected ? "text-brand-primary" : "text-app-text"}`}>
                        {tmpl.name}
                      </h4>

                      {isLocked ? (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          PRO
                        </span>
                      ) : (
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          tmpl.isPremium
                            ? "bg-brand-primary/10 text-brand-primary border border-brand-primary/20"
                            : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        }`}>
                          {tmpl.isPremium ? "PRO" : "FREE"}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-app-text-muted leading-relaxed line-clamp-2 mb-3">
                      {tmpl.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-app-border flex items-center justify-between text-xs font-bold">
                    <span className="text-[10px] text-app-text-muted font-mono">{tmpl.font_family}</span>
                    <span className={isSelected ? "text-brand-primary" : isLocked ? "text-amber-500 flex items-center gap-1" : "text-app-text-muted"}>
                      {isSelected ? "✓ Selected" : isLocked ? "🔒 Unlock PRO" : "Select"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Modal Footer Controls */}
          <div className="p-4 sm:p-5 border-t border-app-border flex items-center justify-between bg-app-bg/50 shrink-0">
            <div className="text-xs text-app-text-muted hidden sm:block">
              Selected: <span className="font-bold text-app-text">{COVER_LETTER_TEMPLATES.find((t) => t.id === selectedTemplateId)?.name}</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-app-border text-xs font-bold text-app-text hover:bg-app-surface transition-all"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirm}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-primary to-indigo-600 hover:from-indigo-600 hover:to-brand-primary text-white text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-brand-primary/25 active:scale-95 cursor-pointer"
              >
                <Palette className="w-4 h-4" />
                <span>Apply & Open in Canvas</span>
              </button>
            </div>
          </div>
        </motion.div>

        <UpgradeTriggerModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          title="Unlock PRO Cover Letter Templates"
          description="Upgrade to Pro access to unlock all 15 executive cover letter templates and design suite."
          featureName="PRO Templates"
        />
      </div>
    </AnimatePresence>
  );
}
