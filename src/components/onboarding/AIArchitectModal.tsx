import { useState } from "react";
import { 
  Sparkles, 
  X, 
  Wand2, 
  ArrowRight, 
  CheckCircle2, 
  RotateCcw, 
  Loader2, 
  Layers, 
  Palette, 
  QrCode, 
  BarChart3, 
  Sliders, 
  Layout, 
  FileText 
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAuthModal } from "./AuthModalContext";
import { generateArchitectPlanDirect, buildArchitectResumeDirect, type DesignPlan } from "../../lib/aiArchitect";
import type { EditorElement } from "../../types/editor";

interface AIArchitectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (elements: EditorElement[], title: string) => void;
}

const INSPIRATION_CHIPS = [
  "Tech Lead resume with Dark Sidebar & Skill Progress Loaders",
  "Executive Resume with Portfolio QR Code & Clean Dividers",
  "Creative Developer with Vibrant Accents & Impact Metric Graphs",
  "Minimalist ATS Developer Resume with Two-Column Skills"
];

export function AIArchitectModal({ isOpen, onClose, onSuccess }: AIArchitectModalProps) {
  const { user, deductCredits, refreshCredits } = useAuth();
  const { openModal } = useAuthModal();

  const [step, setStep] = useState<"prompt" | "review" | "building">("prompt");
  const [prompt, setPrompt] = useState("");
  const [refinementInput, setRefinementInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<DesignPlan | null>(null);

  if (!isOpen) return null;

  const handleGeneratePlan = async (userPrompt: string = prompt, refinement: string = "") => {
    if (!userPrompt.trim()) return;
    setLoading(true);

    try {
      const planResult = await generateArchitectPlanDirect(userPrompt, refinement, plan || undefined);
      setPlan(planResult);
      setStep("review");
      setRefinementInput("");
    } catch (err: any) {
      console.error("[AI-Architect] Plan error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefinePlan = () => {
    if (!refinementInput.trim()) return;
    handleGeneratePlan(prompt, refinementInput);
  };

  const handleProceedAndBuild = async () => {
    if (!plan) return;

    if (user) {
      await deductCredits(10).catch(() => {});
    }

    setStep("building");
    setLoading(true);

    try {
      const elements = await buildArchitectResumeDirect(plan, prompt);
      refreshCredits();
      onSuccess(elements, plan.title || "AI Architect Resume");
      onClose();
    } catch (err: any) {
      console.error("[AI-Architect] Build error:", err);
      setStep("review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-app-bg border border-app-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-app-border bg-app-surface/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-app-text flex items-center gap-2">
                AI Architect Builder
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded-md border border-indigo-500/20">
                  Direct AI Generation
                </span>
              </h3>
              <p className="text-xs text-app-text-muted">Mathematical layout, progress loaders, charts & bespoke styling</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-app-text-muted hover:text-app-text rounded-lg hover:bg-app-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* STEP 1: PROMPT INPUT */}
          {step === "prompt" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-app-text-muted mb-2">
                  Describe Your Ideal Resume
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g. Create a sleek Tech Lead resume with a dark sidebar, skill progress bar loaders, clear project section, and an executive font scheme..."
                  className="w-full h-36 p-4 text-sm bg-app-surface border border-app-border rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none text-app-text placeholder:text-app-text-muted/60 resize-none"
                />
              </div>

              {/* Inspiration Chips */}
              <div>
                <span className="text-[11px] font-semibold text-app-text-muted block mb-2">Or click an idea to start:</span>
                <div className="flex flex-wrap gap-2">
                  {INSPIRATION_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPrompt(chip)}
                      className="text-xs px-3 py-1.5 bg-app-surface border border-app-border hover:border-indigo-500/50 text-app-text-muted hover:text-app-text rounded-lg transition-all text-left"
                    >
                      💡 {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: REVIEW & REFINE PLAN */}
          {step === "review" && plan && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
              <div className="p-4 bg-app-surface border border-app-border rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-base text-app-text">{plan.title}</h4>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-500/10 text-indigo-500 rounded-md border border-indigo-500/20 capitalize">
                    <Layout className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" />
                    {plan.layout_type.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-xs text-app-text-secondary leading-relaxed">{plan.theme_summary}</p>
                
                {/* Palette Badges */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-app-text-muted flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-indigo-500" /> Palette:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {Object.entries(plan.color_palette).map(([key, hex]) => (
                      <div key={key} className="flex items-center gap-1" title={`${key}: ${hex}`}>
                        <div className="w-4 h-4 rounded-full border border-app-border shadow-xs" style={{ backgroundColor: hex }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Planned Sections */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-app-text-muted mb-3 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" /> Planned Sections & Components ({plan.sections.length})
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {plan.sections.map((sec) => (
                    <div key={sec.id} className="p-3 bg-app-surface border border-app-border rounded-xl space-y-1">
                      <div className="flex items-center gap-2">
                        {sec.component_type === "skill_loader" && <Sliders className="w-4 h-4 text-indigo-500 shrink-0" />}
                        {sec.component_type === "chart" && <BarChart3 className="w-4 h-4 text-sky-500 shrink-0" />}
                        {sec.component_type === "qr_code" && <QrCode className="w-4 h-4 text-emerald-500 shrink-0" />}
                        {sec.component_type !== "skill_loader" && sec.component_type !== "chart" && sec.component_type !== "qr_code" && <FileText className="w-4 h-4 text-indigo-500 shrink-0" />}
                        <span className="text-xs font-bold text-app-text">{sec.title}</span>
                      </div>
                      <p className="text-[11px] text-app-text-muted leading-snug">{sec.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Features */}
              {plan.special_elements && plan.special_elements.length > 0 && (
                <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl">
                  <span className="text-[11px] font-bold text-indigo-500 block mb-1">✨ Engine Capabilities Activated:</span>
                  <div className="flex flex-wrap gap-2">
                    {plan.special_elements.map((feat, idx) => (
                      <span key={idx} className="text-[10px] font-medium bg-app-surface border border-app-border text-app-text px-2 py-0.5 rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-indigo-500" /> {feat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Refinement Control Box */}
              <div className="p-3.5 bg-app-surface border border-app-border rounded-xl space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-app-text-muted flex items-center gap-1">
                  <Wand2 className="w-3.5 h-3.5 text-indigo-500" /> Refine or Modify Plan
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={refinementInput}
                    onChange={(e) => setRefinementInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRefinePlan()}
                    placeholder="E.g. Change primary color to emerald, add certifications section..."
                    className="flex-1 text-xs px-3 py-2 bg-app-bg border border-app-border rounded-lg outline-none focus:border-indigo-500 text-app-text"
                  />
                  <button
                    onClick={handleRefinePlan}
                    disabled={loading || !refinementInput.trim()}
                    className="px-3 py-2 bg-app-bg border border-app-border hover:bg-app-surface text-app-text text-xs font-bold rounded-lg disabled:opacity-50 flex items-center gap-1.5 transition-all"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    Refine
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: BUILDING STAGE */}
          {step === "building" && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 animate-in fade-in">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 animate-pulse">
                  <Sparkles className="w-8 h-8" />
                </div>
                <Loader2 className="w-20 h-20 animate-spin text-indigo-500 absolute -top-2 -left-2" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-app-text">AI Architect is Building Your Resume</h4>
                <p className="text-xs text-app-text-muted mt-1 max-w-sm">
                  Composing custom layout elements, skill progress bar loaders, typography, and section graphics via AI...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-app-border bg-app-surface/50 flex items-center justify-between shrink-0">
          {step === "prompt" && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-app-text-muted hover:text-app-text transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleGeneratePlan()}
                disabled={loading || !prompt.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate Design Plan
              </button>
            </>
          )}

          {step === "review" && (
            <>
              <button
                onClick={() => setStep("prompt")}
                className="px-4 py-2 text-xs font-semibold text-app-text-muted hover:text-app-text transition-colors"
              >
                ← Back to Prompt
              </button>
              <button
                onClick={handleProceedAndBuild}
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Proceed & Build Resume 🚀
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
