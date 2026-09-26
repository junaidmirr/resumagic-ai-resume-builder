import { useState, useEffect } from "react";
import {
  Sparkles,
  X,
  Wand2,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  Loader2,
  Clock,
  Layers,
  Palette,
  QrCode,
  BarChart3,
  Sliders,
  Layout,
  FileText,
  Compass,
  ShieldCheck,
  Terminal,
  Brain,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAuthModal } from "./AuthModalContext";
import {
  generateArchitectPlanDirect,
  buildArchitectResumeDirect,
  buildArchitectResumeWithStream,
  generateFallbackElements,
  createFallbackPlan,
  type DesignPlan,
} from "../../lib/aiArchitect";
import type { EditorElement } from "../../types/editor";
import { trackFeature, trackAiCreditsConsumed } from "../../lib/analytics";

interface AIArchitectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (elements: EditorElement[], title: string) => void;
}

const INSPIRATION_CHIPS = [
  "Tech Lead resume with Dark Sidebar & Skill Progress Loaders",
  "Executive Resume with Portfolio QR Code & Clean Dividers",
  "Creative Developer with Vibrant Accents & Impact Metric Graphs",
  "Minimalist ATS Developer Resume with Two-Column Skills",
];

export function AIArchitectModal({
  isOpen,
  onClose,
  onSuccess,
}: AIArchitectModalProps) {
  const { user, credits, userPlan, deductCredits, refreshCredits } = useAuth();
  const { openModal } = useAuthModal();

  const [step, setStep] = useState<"prompt" | "review" | "building">("prompt");
  const [prompt, setPrompt] = useState("");
  const [refinementInput, setRefinementInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<DesignPlan | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  // Live AI Stream state
  const [streamLogs, setStreamLogs] = useState<{ id: string; time: string; text: string; agent?: string }[]>([]);
  const [activeAgent, setActiveAgent] = useState<string>("planner");
  const [activeStep, setActiveStep] = useState<number>(1);
  const [liveMetrics, setLiveMetrics] = useState<{ quality?: number; symmetry?: number } | null>(null);
  const [streamMessage, setStreamMessage] = useState<string>("Connecting to Multi-Agent AI Pipeline...");

  // Fallback decision prompt state
  const [fallbackDialog, setFallbackDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onRetry: () => void;
    onUseDefault: () => void;
  } | null>(null);

  useEffect(() => {
    if (!loading) {
      setElapsedMs(0);
      return;
    }
    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - startTime);
    }, 100);
    return () => clearInterval(interval);
  }, [loading]);

  const formattedTimer = `${(elapsedMs / 1000).toFixed(1)}s`;

  if (!isOpen) return null;

  const isProTier =
    userPlan === "pro" || userPlan === "career_pro" || userPlan === "lifetime";

  if (!isProTier) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <div className="bg-app-surface border border-brand-primary/30 rounded-3xl p-8 max-w-md w-full text-center relative shadow-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-app-text-muted hover:text-app-text"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-brand-primary/25">
            <Wand2 className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-black text-app-text mb-2">
            AI Architect 2.0 (Pro Feature)
          </h3>
          <p className="text-xs text-app-text-secondary leading-relaxed mb-6">
            Single-prompt bespoke resume generation is exclusive to Pro &
            Lifetime plans. Upgrade to generate multi-section resumes with skill
            progress bars and custom themes.
          </p>
          <a
            href="/pricing"
            onClick={onClose}
            className="block w-full py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-black text-xs rounded-xl shadow-lg shadow-brand-primary/20 hover:scale-[1.02] transition-all"
          >
            Upgrade to Pro (₹199/mo)
          </a>
        </div>
      </div>
    );
  }

  const handleGeneratePlan = async (
    userPrompt: string = prompt,
    refinement: string = "",
  ) => {
    if (!userPrompt.trim()) return;
    setLoading(true);

    try {
      const planResult = await generateArchitectPlanDirect(
        userPrompt,
        refinement,
        plan || undefined,
      );

      if (planResult.fallback_triggered) {
        setLoading(false);
        setFallbackDialog({
          isOpen: true,
          title: "AI Generation Failed",
          message:
            planResult.fallback_message ||
            "The AI model failed to generate a custom design plan. Would you like to use the default template or retry again?",
          onRetry: () => {
            setFallbackDialog(null);
            handleGeneratePlan(userPrompt, refinement);
          },
          onUseDefault: () => {
            setFallbackDialog(null);
            setPlan(planResult);
            setStep("review");
            setRefinementInput("");
          },
        });
        return;
      }

      setPlan(planResult);
      setStep("review");
      setRefinementInput("");
    } catch (err: any) {
      console.error("[AI-Architect] Plan error:", err);
      setLoading(false);
      setFallbackDialog({
        isOpen: true,
        title: "AI Generation Failed",
        message:
          "The AI model encountered an issue. Would you like to use the default template or retry again?",
        onRetry: () => {
          setFallbackDialog(null);
          handleGeneratePlan(userPrompt, refinement);
        },
        onUseDefault: () => {
          setFallbackDialog(null);
          setPlan(createFallbackPlan(userPrompt, refinement));
          setStep("review");
          setRefinementInput("");
        },
      });
      return;
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

    if (user && credits < 10) {
      alert("Insufficient credits (10 required). Please recharge.");
      return;
    }

    // Instantly start loader & lock UI
    setStep("building");
    setLoading(true);
    setStreamLogs([]);
    setActiveStep(1);
    setActiveAgent("planner");
    setLiveMetrics(null);
    setStreamMessage("Connecting to Multi-Agent AI stream pipeline...");

    let streamFallbackTriggered = false;

    try {
      const elements = await buildArchitectResumeWithStream(
        plan,
        prompt,
        (event) => {
          if (event.type === "fallback_prompt" || event.fallback_triggered) {
            streamFallbackTriggered = true;
          }
          if (event.agent) setActiveAgent(event.agent);
          if (event.step_index) setActiveStep(event.step_index);
          if (event.message) setStreamMessage(event.message);
          if (event.quality_score) {
            setLiveMetrics({
              quality: event.quality_score,
              symmetry: event.symmetry_score,
            });
          }
          if (event.message) {
            setStreamLogs((prev) => [
              ...prev,
              {
                id: Math.random().toString(36).substring(2, 9),
                time: new Date().toLocaleTimeString([], { hour12: false, minute: "2-digit", second: "2-digit" }),
                text: event.message || "",
                agent: event.agent || event.stage,
              },
            ]);
          }
        },
      );

      if (streamFallbackTriggered) {
        setLoading(false);
        setFallbackDialog({
          isOpen: true,
          title: "AI Synthesis Failed",
          message:
            "The AI streaming pipeline failed to generate customized elements. Would you like to use the default template or retry again?",
          onRetry: () => {
            setFallbackDialog(null);
            handleProceedAndBuild();
          },
          onUseDefault: async () => {
            setFallbackDialog(null);
            if (user) {
              await deductCredits(10).catch(console.error);
              refreshCredits();
            }
            void trackFeature("aiArchitect");
            void trackAiCreditsConsumed(10);
            onSuccess(elements, plan.title || "AI Architect Resume");
            onClose();
          },
        });
        return;
      }

      // ONLY DEBIT CREDITS ON SUCCESSFUL COMPLETION
      if (user) {
        await deductCredits(10).catch(console.error);
        refreshCredits();
      }

      void trackFeature("aiArchitect");
      void trackAiCreditsConsumed(10);

      onSuccess(elements, plan.title || "AI Architect Resume");
      onClose();
    } catch (err: any) {
      console.error("[AI-Architect] Build error:", err);
      setLoading(false);
      setFallbackDialog({
        isOpen: true,
        title: "AI Synthesis Failed",
        message:
          "The AI model failed during synthesis. Would you like to use the default template or retry again?",
        onRetry: () => {
          setFallbackDialog(null);
          handleProceedAndBuild();
        },
        onUseDefault: async () => {
          setFallbackDialog(null);
          const fallbackEls = generateFallbackElements(plan, prompt);
          if (user) {
            await deductCredits(10).catch(console.error);
            refreshCredits();
          }
          void trackFeature("aiArchitect");
          void trackAiCreditsConsumed(10);
          onSuccess(fallbackEls, plan.title || "AI Architect Resume");
          onClose();
        },
      });
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
              <p className="text-xs text-app-text-muted">
                Mathematical layout, progress loaders, charts & bespoke styling
              </p>
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
                <span className="text-[11px] font-semibold text-app-text-muted block mb-2">
                  Or click an idea to start:
                </span>
                <div className="flex flex-wrap gap-2">
                  {INSPIRATION_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPrompt(chip)}
                      className="text-xs px-3 py-1.5 bg-app-surface border border-app-border hover:border-indigo-500/50 text-app-text-muted hover:text-app-text rounded-lg transition-all text-left"
                    >
                      {chip}
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
                  <h4 className="font-bold text-base text-app-text">
                    {plan.title}
                  </h4>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-500/10 text-indigo-500 rounded-md border border-indigo-500/20 capitalize">
                    <Layout className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" />
                    {plan.layout_type.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-xs text-app-text-secondary leading-relaxed">
                  {plan.theme_summary}
                </p>

                {/* Palette Badges */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-app-text-muted flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-indigo-500" /> Palette:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {Object.entries(plan.color_palette).map(([key, hex]) => (
                      <div
                        key={key}
                        className="flex items-center gap-1"
                        title={`${key}: ${hex}`}
                      >
                        <div
                          className="w-4 h-4 rounded-full border border-app-border shadow-xs"
                          style={{ backgroundColor: hex }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visual Architecture Badges */}
                {(plan.header_style || plan.heading_decoration || plan.skills_style || plan.experience_style) && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-app-border">
                    {plan.header_style && (
                      <span className="text-[11px] font-medium bg-app-bg text-app-text px-2.5 py-1 rounded-md border border-app-border flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-indigo-400" /> Header: <strong className="capitalize">{plan.header_style.replace(/_/g, " ")}</strong>
                      </span>
                    )}
                    {plan.heading_decoration && (
                      <span className="text-[11px] font-medium bg-app-bg text-app-text px-2.5 py-1 rounded-md border border-app-border flex items-center gap-1.5">
                        <Compass className="w-3 h-3 text-sky-400" /> Headings: <strong className="capitalize">{plan.heading_decoration.replace(/_/g, " ")}</strong>
                      </span>
                    )}
                    {plan.experience_style && (
                      <span className="text-[11px] font-medium bg-app-bg text-app-text px-2.5 py-1 rounded-md border border-app-border flex items-center gap-1.5">
                        <Layers className="w-3 h-3 text-emerald-400" /> Experience: <strong className="capitalize">{plan.experience_style.replace(/_/g, " ")}</strong>
                      </span>
                    )}
                    {plan.skills_style && (
                      <span className="text-[11px] font-medium bg-app-bg text-app-text px-2.5 py-1 rounded-md border border-app-border flex items-center gap-1.5">
                        <Sliders className="w-3 h-3 text-purple-400" /> Skills: <strong className="capitalize">{plan.skills_style.replace(/_/g, " ")}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Planned Sections */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-app-text-muted mb-3 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" /> Planned
                  Sections & Components ({plan.sections.length})
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {plan.sections.map((sec) => (
                    <div
                      key={sec.id}
                      className="p-3 bg-app-surface border border-app-border rounded-xl space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        {sec.component_type === "skill_loader" && (
                          <Sliders className="w-4 h-4 text-indigo-500 shrink-0" />
                        )}
                        {sec.component_type === "chart" && (
                          <BarChart3 className="w-4 h-4 text-sky-500 shrink-0" />
                        )}
                        {sec.component_type === "qr_code" && (
                          <QrCode className="w-4 h-4 text-emerald-500 shrink-0" />
                        )}
                        {sec.component_type !== "skill_loader" &&
                          sec.component_type !== "chart" &&
                          sec.component_type !== "qr_code" && (
                            <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                          )}
                        <span className="text-xs font-bold text-app-text">
                          {sec.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-app-text-muted leading-snug">
                        {sec.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Features */}
              {plan.special_elements && plan.special_elements.length > 0 && (
                <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl">
                  <span className="text-[11px] font-bold text-indigo-500 block mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Engine Capabilities
                    Activated:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {plan.special_elements.map((feat, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium bg-app-surface border border-app-border text-app-text px-2 py-0.5 rounded-md flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-indigo-500" />{" "}
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Refinement Control Box */}
              <div className="p-3.5 bg-app-surface border border-app-border rounded-xl space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-app-text-muted flex items-center gap-1">
                  <Wand2 className="w-3.5 h-3.5 text-indigo-500" /> Refine or
                  Modify Plan
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
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                    Refine
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: BUILDING STAGE - LIVE AI DESIGN STREAM */}
          {step === "building" && (
            <div className="space-y-4 animate-in fade-in py-1">
              {/* Header Status Row */}
              <div className="flex items-center justify-between p-3.5 bg-app-surface border border-app-border rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    </div>
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-500 absolute -top-1 -left-1" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-app-text flex items-center gap-2">
                      Multi-Agent AI Streaming Engine
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> LIVE
                      </span>
                    </h4>
                    <p className="text-xs text-app-text-muted">
                      Synthesizing bespoke vector layout & streaming live agent tokens
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {liveMetrics?.symmetry && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-mono font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                      Symmetry: {liveMetrics.symmetry}/100
                    </span>
                  )}
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-app-bg border border-app-border text-app-text rounded-lg font-mono text-xs font-bold">
                    <Clock className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                    {formattedTimer}
                  </div>
                </div>
              </div>

              {/* Multi-Agent Stepper */}
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {[
                  { id: "planner", label: "Planner", stepNum: 1, icon: Brain },
                  { id: "foundation", label: "Foundation", stepNum: 2, icon: Compass },
                  { id: "design", label: "Design", stepNum: 3, icon: Palette },
                  { id: "review", label: "Review", stepNum: 4, icon: ShieldCheck },
                  { id: "assembly", label: "Assembly", stepNum: 5, icon: Layers },
                ].map((st) => {
                  const isDone = activeStep > st.stepNum;
                  const isCurrent = activeStep === st.stepNum;
                  return (
                    <div
                      key={st.id}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        isCurrent
                          ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-400 shadow-sm"
                          : isDone
                            ? "bg-emerald-500/5 border-emerald-500/25 text-emerald-400"
                            : "bg-app-surface/40 border-app-border/40 text-app-text-muted/60"
                      }`}
                    >
                      <div className="flex items-center justify-center mb-1">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : isCurrent ? (
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                        ) : (
                          <st.icon className="w-4 h-4 text-app-text-muted/50" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold block truncate">
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Streaming Terminal Console */}
              <div className="w-full bg-[#070B14] border border-indigo-500/20 rounded-xl overflow-hidden shadow-2xl text-left">
                {/* Terminal Window Header */}
                <div className="flex items-center justify-between px-3.5 py-2 bg-[#0E1526] border-b border-indigo-500/20 text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="ml-2 font-semibold text-slate-300 flex items-center gap-1">
                      <Terminal className="w-3 h-3 text-indigo-400" />
                      resumagic_agent_stream.log
                    </span>
                  </div>
                  <span className="text-[10px] text-indigo-300 font-mono">
                    Agent: <strong className="text-white uppercase">{activeAgent}</strong>
                  </span>
                </div>

                {/* Terminal Body */}
                <div className="p-3.5 font-mono text-[11px] space-y-1.5 max-h-56 overflow-y-auto select-text">
                  {streamLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-slate-500 shrink-0 select-none">[{log.time}]</span>
                      {log.agent && (
                        <span className="text-indigo-400 font-bold uppercase shrink-0">
                          [{log.agent}]:
                        </span>
                      )}
                      <span className="text-slate-200">{log.text}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 text-indigo-400 pt-1">
                    <span className="text-slate-500">
                      [{new Date().toLocaleTimeString([], { hour12: false, minute: "2-digit", second: "2-digit" })}]
                    </span>
                    <span className="text-indigo-400 font-bold uppercase">[{activeAgent}]:</span>
                    <span className="text-indigo-300 italic">{streamMessage}</span>
                    <span className="inline-block w-1.5 h-3.5 bg-indigo-400 animate-pulse ml-0.5" />
                  </div>
                </div>
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
                {loading ? (
                  <span className="flex items-center gap-1.5 font-mono">
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating (
                    {formattedTimer})
                  </span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Generate Design Plan
                  </>
                )}
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
                {loading ? (
                  <span className="flex items-center gap-1.5 font-mono">
                    <Loader2 className="w-4 h-4 animate-spin" /> Building (
                    {formattedTimer})
                  </span>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" /> Proceed & Build Resume
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Fallback Decision Modal Overlay */}
        {fallbackDialog?.isOpen && (
          <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-app-surface border border-amber-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-app-text">
                    {fallbackDialog.title}
                  </h3>
                  <p className="text-xs text-app-text-muted leading-relaxed">
                    {fallbackDialog.message}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setFallbackDialog(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-app-text-muted hover:text-app-text hover:bg-app-bg border border-app-border rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={fallbackDialog.onUseDefault}
                  className="px-4 py-2 text-xs font-bold text-app-text bg-app-bg hover:bg-app-surface border border-app-border rounded-xl shadow-sm transition-all"
                >
                  Use Default Template
                </button>
                <button
                  type="button"
                  onClick={fallbackDialog.onRetry}
                  className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Retry Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
