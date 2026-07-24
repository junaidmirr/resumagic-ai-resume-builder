import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAuthModal } from "../onboarding/AuthModalContext";
import { useDialog } from "../../context/DialogContext";
import { 
  Sparkles, 
  Briefcase, 
  Target, 
  Code, 
  FileText, 
  Search, 
  TrendingUp, 
  Send,
  Loader2,
  Clock,
  Copy,
  Check,
  PlusCircle,
  Wand2,
  AlertTriangle,
  Wrench
} from "lucide-react";
import type { EditorElement, AIFixItem, AIResponsePayload } from "../../types/editor";

interface AIAssistantSidebarProps {
  elements: EditorElement[];
  linkedinUrl: string;
  setLinkedinUrl: (val: string) => void;
  handleATSUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleLinkedInImport: () => void;
  onInsertToCanvas?: (text: string) => void;
  onApplyFix?: (fix: AIFixItem) => Promise<void> | void;
}

interface TabCache {
  result: string | null;
  fixes: AIFixItem[];
  lastAction: string | null;
  rejectionReason: string | null;
}

interface AISessionCache {
  activeTab: Tab;
  jobDescription: string;
  chatInput: string;
  followUpPrompt: string;
  tabStates: Record<string, TabCache>;
}

const defaultTabStates: Record<string, TabCache> = {
  tools: { result: null, fixes: [], lastAction: null, rejectionReason: null },
  generate: { result: null, fixes: [], lastAction: null, rejectionReason: null },
  ats: { result: null, fixes: [], lastAction: null, rejectionReason: null },
  analyze: { result: null, fixes: [], lastAction: null, rejectionReason: null },
  fix: { result: null, fixes: [], lastAction: null, rejectionReason: null },
  architect: { result: null, fixes: [], lastAction: null, rejectionReason: null },
};

const aiSessionCache: AISessionCache = {
  activeTab: "generate",
  jobDescription: "",
  chatInput: "",
  followUpPrompt: "",
  tabStates: JSON.parse(JSON.stringify(defaultTabStates)),
};

export function AIAssistantSidebar({ 
  elements,
  linkedinUrl,
  setLinkedinUrl,
  handleATSUpload,
  handleLinkedInImport,
  onInsertToCanvas,
  onApplyFix
}: AIAssistantSidebarProps) {
  const { user, credits, refreshCredits, deductCredits } = useAuth();
  const { openModal } = useAuthModal();
  const { alert } = useDialog();

  const [activeTab, setActiveTabState] = useState<Tab>(aiSessionCache.activeTab);
  const [jobDescription, setJobDescriptionState] = useState(aiSessionCache.jobDescription);
  const [chatInput, setChatInputState] = useState(aiSessionCache.chatInput);
  
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (loadingAction === null) {
      setElapsedMs(0);
      return;
    }
    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - startTime);
    }, 100);
    return () => clearInterval(interval);
  }, [loadingAction]);

  const formattedTimer = `${(elapsedMs / 1000).toFixed(1)}s`;

  const [tabStates, setTabStates] = useState<Record<string, TabCache>>(aiSessionCache.tabStates);
  const [followUpPrompt, setFollowUpPromptState] = useState(aiSessionCache.followUpPrompt);
  const [copied, setCopied] = useState(false);

  // Computed per-tab state
  const currentTabState = tabStates[activeTab] || { result: null, fixes: [], lastAction: null, rejectionReason: null };
  const result = currentTabState.result;
  const fixes = currentTabState.fixes;
  const lastAction = currentTabState.lastAction;
  const rejectionReason = currentTabState.rejectionReason;

  const updateCurrentTabState = (patch: Partial<TabCache>) => {
    setTabStates((prev) => {
      const existing = prev[activeTab] || { result: null, fixes: [], lastAction: null, rejectionReason: null };
      const updated = { ...existing, ...patch };
      const next = { ...prev, [activeTab]: updated };
      aiSessionCache.tabStates = next;
      return next;
    });
  };

  const setActiveTab = (t: Tab) => {
    aiSessionCache.activeTab = t;
    setActiveTabState(t);
  };

  const setJobDescription = (val: string) => {
    aiSessionCache.jobDescription = val;
    setJobDescriptionState(val);
  };

  const setChatInput = (val: string) => {
    aiSessionCache.chatInput = val;
    setChatInputState(val);
  };

  const setResult = (val: string | null) => updateCurrentTabState({ result: val });
  const setFixes = (val: AIFixItem[]) => updateCurrentTabState({ fixes: val });
  const setRejectionReason = (val: string | null) => updateCurrentTabState({ rejectionReason: val });
  const setLastAction = (val: string | null) => updateCurrentTabState({ lastAction: val });

  const setFollowUpPrompt = (val: string) => {
    aiSessionCache.followUpPrompt = val;
    setFollowUpPromptState(val);
  };

  const handleApplyFix = async (fix: AIFixItem) => {
    if (!onApplyFix) return;
    setLoadingAction("applying_fix");
    try {
      await onApplyFix(fix);
    } catch (err: any) {
      alert(err.message || "Failed to apply fix");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAction = async (action: string, text: string = "") => {
    if (!user) {
      openModal({ title: "Login Required", subtitle: "Please log in to use AI Assistant features.", showBlankOption: false });
      return;
    }

    if (credits < 10) {
      alert("Insufficient credits (10 required). Please recharge.");
      return;
    }

    // Instantly start loader & lock buttons
    setLoadingAction(action);
    setLastAction(action);
    setResult(null);
    setFixes([]);
    setRejectionReason(null);

    try {
      const idToken = user ? await user.getIdToken().catch(() => "") : "";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-User-ID": user.uid,
        "X-Skip-Credit-Check": "true",
      };
      if (idToken) {
        headers["Authorization"] = `Bearer ${idToken}`;
      }

      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action,
          text: text || chatInput,
          context: elements,
          job_description: jobDescription,
        }),
      });

      let data: AIResponsePayload;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        throw new Error(`Server returned an error (${res.status}). Please restart your local Python backend.`);
      }

      if (!res.ok) throw new Error(data?.error || `Generation failed (${res.status})`);
      
      if (data.status === "rejected") {
        setRejectionReason(data.reason || "I am a dedicated Resume AI Assistant and can only assist with career, resume, and job application requests.");
      } else {
        setResult(data.result || null);
        setFixes(data.fixes || []);
        // ONLY DEBIT CREDITS ON SUCCESSFUL COMPLETION
        await deductCredits(10).catch(console.error);
        refreshCredits();
      }

      if (action === "write_resume") {
        setChatInput("");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleFollowUp = () => {
    if (!followUpPrompt.trim() || !lastAction) return;
    const combinedText = `Previous Output:\n${result || ""}\n\nUser Instruction for Refinement: ${followUpPrompt}`;
    setFollowUpPrompt("");
    handleAction(lastAction, combinedText);
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-app-surface text-app-text">
      {/* Header */}
      <div className="p-4 border-b border-app-border shrink-0 bg-app-bg/50 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-brand-primary/10 rounded-lg">
            <Sparkles className="w-5 h-5 text-brand-primary" />
          </div>
          <h3 className="font-bold text-app-text">AI Assistant</h3>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-app-bg rounded-xl overflow-x-auto whitespace-nowrap scrollbar-hide border border-app-border">
          {(["generate", "analyze", "chat", "import"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setResult(null); setFixes([]); setRejectionReason(null); }}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg capitalize transition-all ${
                activeTab === tab
                  ? "bg-app-surface text-brand-primary shadow-sm border border-brand-primary/20"
                  : "text-app-text-secondary hover:bg-app-surface hover:text-app-text"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        
        {/* Import Tab */}
        {activeTab === "import" && (
          <div className="flex flex-col gap-4 h-full">
            <div className="p-4 bg-app-bg border border-app-border rounded-xl shadow-sm hover:border-brand-primary/30 transition-colors">
              <h4 className="text-xs font-bold text-app-text mb-2 flex items-center gap-2">
                <div className="p-1.5 bg-brand-primary/10 rounded-md"><Target className="w-3.5 h-3.5 text-brand-primary"/></div>
                Import Existing Resume
              </h4>
              <p className="text-[10px] text-app-text-secondary mb-3 leading-relaxed">Upload a PDF or DOCX to automatically parse and layout your existing resume.</p>
              <label className="w-full bg-app-surface hover:bg-brand-primary/5 text-app-text text-xs py-2.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center justify-center border border-app-border hover:border-brand-primary/50">
                Choose File...
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleATSUpload} className="hidden" />
              </label>
            </div>

            <div className="p-4 bg-app-bg border border-app-border rounded-xl shadow-sm hover:border-brand-secondary/30 transition-colors">
              <h4 className="text-xs font-bold text-app-text mb-2 flex items-center gap-2">
                <div className="p-1.5 bg-[#0a66c2]/10 rounded-md">
                  <div className="w-3.5 h-3.5 font-bold text-[#0a66c2] flex items-center justify-center text-[10px]">in</div>
                </div>
                Import from LinkedIn
              </h4>
              <p className="text-[10px] text-app-text-secondary mb-3 leading-relaxed">Paste your public profile URL to generate a resume instantly.</p>
              <input 
                type="text" 
                placeholder="https://linkedin.com/in/..." 
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-app-border bg-app-surface mb-3 outline-none focus:border-brand-primary text-app-text placeholder:text-app-text-muted" 
              />
              <button onClick={handleLinkedInImport} className="w-full bg-[#0a66c2] text-white text-xs py-2.5 rounded-lg font-bold hover:bg-[#004182] transition-colors shadow-lg shadow-[#0a66c2]/20">
                Import Profile
              </button>
            </div>
          </div>
        )}
        
        {/* Generate Tab */}
        {activeTab === "generate" && (
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "generate_summary", label: "Summary", icon: FileText },
              { id: "generate_objective", label: "Objective", icon: Target },
              { id: "generate_skills", label: "Skills", icon: Code },
              { id: "generate_experience", label: "Experience", icon: Briefcase },
            ].map((btn) => (
              <button key={btn.id} onClick={() => handleAction(btn.id)} disabled={loadingAction !== null} className="p-3 bg-app-bg border border-app-border rounded-xl hover:border-brand-primary/50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed hover-lift">
                {loadingAction === btn.id ? <Loader2 className="w-4 h-4 animate-spin text-brand-primary mb-2" /> : <btn.icon className="w-4 h-4 text-app-text-muted group-hover:text-brand-primary mb-2 transition-colors" />}
                <span className="text-xs font-semibold text-app-text">{btn.label}</span>
              </button>
            ))}
            
            <button onClick={() => handleAction("generate_projects", jobDescription)} disabled={loadingAction !== null} className="p-3 bg-app-bg border border-app-border rounded-xl hover:border-brand-accent/50 transition-all text-left group col-span-2 disabled:opacity-50 disabled:cursor-not-allowed hover-lift">
              {loadingAction === "generate_projects" ? <Loader2 className="w-4 h-4 animate-spin text-brand-accent mb-2" /> : <Sparkles className="w-4 h-4 text-app-text-muted group-hover:text-brand-accent mb-2 transition-colors" />}
              <span className="text-xs font-semibold text-app-text">Generate Projects</span>
            </button>
            
            <button onClick={() => handleAction("generate_cover_letter")} disabled={loadingAction !== null} className="p-3 bg-brand-primary/10 border border-brand-primary/20 rounded-xl hover:border-brand-primary/50 hover:bg-brand-primary/20 transition-all text-left group col-span-2 disabled:opacity-50 disabled:cursor-not-allowed hover-lift">
              {loadingAction === "generate_cover_letter" ? <Loader2 className="w-4 h-4 animate-spin text-brand-primary mb-2" /> : <FileText className="w-4 h-4 text-brand-primary mb-2" />}
              <span className="text-xs font-bold text-brand-primary">Write Cover Letter</span>
              <p className="text-[10px] text-brand-primary/70 mt-1">Based on resume & job description</p>
            </button>
          </div>
        )}

        {/* Analyze Tab */}
        {activeTab === "analyze" && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-app-text-muted uppercase tracking-wider">Target Job Description</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here to tailor analysis..."
                className="w-full h-24 p-3 text-sm bg-app-bg border border-app-border rounded-xl focus:ring-2 focus:ring-brand-primary/50 resize-none text-app-text placeholder:text-app-text-muted"
              />
            </div>
            
            {[
              { id: "ats_optimization", label: "ATS Optimization", sub: "Find missing keywords & flaws", icon: Search, color: "text-brand-secondary", bg: "bg-brand-secondary/10" },
              { id: "match_resume", label: "Match to Job", sub: "Get a fit score & tailored advice", icon: Target, color: "text-brand-primary", bg: "bg-brand-primary/10" },
              { id: "analyze_job", label: "Analyze Job", sub: "Extract core requirements", icon: Briefcase, color: "text-brand-accent", bg: "bg-brand-accent/10" },
              { id: "suggest_improvements", label: "Suggest Improvements", sub: "Strict reviewer feedback", icon: TrendingUp, color: "text-brand-warning", bg: "bg-brand-warning/10" },
            ].map((btn) => (
              <button key={btn.id} onClick={() => handleAction(btn.id)} disabled={(btn.id === 'match_resume' || btn.id === 'analyze_job') ? (!jobDescription || loadingAction !== null) : loadingAction !== null} className="flex items-center gap-3 p-3 bg-app-bg border border-app-border rounded-xl hover:border-brand-primary/50 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed hover-lift">
                <div className={`p-2 rounded-lg ${btn.bg}`}>
                  {loadingAction === btn.id ? <Loader2 className={`w-4 h-4 animate-spin ${btn.color}`} /> : <btn.icon className={`w-4 h-4 ${btn.color}`} />}
                </div>
                <div>
                  <span className="text-sm font-semibold text-app-text block">{btn.label}</span>
                  <span className="text-xs text-app-text-secondary block">{btn.sub}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Chat / Write Resume Tab */}
        {activeTab === "chat" && (
          <div className="flex flex-col gap-3 h-full">
            <p className="text-sm text-app-text-secondary">
              Ask the AI to write a resume from scratch, outline a specific role, or brainstorm ideas.
            </p>
            <div className="relative mt-2 flex-1">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="E.g. Write a resume for a Senior Frontend Developer specializing in React..."
                className="w-full h-full min-h-[150px] p-3 pb-12 text-sm bg-app-bg border border-app-border rounded-xl focus:ring-2 focus:ring-brand-primary/50 resize-none text-app-text placeholder:text-app-text-muted"
              />
              <button 
                onClick={() => handleAction("write_resume")}
                disabled={!chatInput.trim() || loadingAction !== null}
                className="absolute bottom-2 right-2 p-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-lg hover:shadow-lg hover:shadow-brand-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loadingAction === "write_resume" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Rejection Policy Guardrail Alert */}
        {rejectionReason && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2 animate-in fade-in">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Request Denied</span>
              <span>{rejectionReason}</span>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loadingAction !== null && loadingAction !== "write_resume" && loadingAction !== "applying_fix" && (
          <div className="flex flex-col items-center justify-center p-8 text-app-text-muted space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
            <span className="text-xs font-medium animate-pulse">AI is working on it...</span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-full font-mono text-xs font-bold">
              <Clock className="w-3 h-3 animate-pulse" /> Elapsed: {formattedTimer}
            </div>
          </div>
        )}

        {/* Actionable Fixes Cards */}
        {fixes.length > 0 && (loadingAction === null || loadingAction === "applying_fix") && (
          <div className="mt-4 flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-primary flex items-center gap-1.5">
              <Wrench size={14} /> Recommended Fixes ({fixes.length})
            </h4>
            {fixes.map((fix) => (
              <div key={fix.id} className="p-3 bg-app-bg border border-app-border rounded-xl flex flex-col gap-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-app-text">{fix.title}</span>
                  {onApplyFix && (
                    <button
                      onClick={() => handleApplyFix(fix)}
                      disabled={loadingAction === "applying_fix"}
                      className="px-2.5 py-1 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-md text-[10px] font-bold hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {loadingAction === "applying_fix" ? <Loader2 size={12} className="animate-spin" /> : null}
                      Apply Fix
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-app-text-secondary">{fix.description}</p>
                {fix.suggested_value && (
                  <div className="p-2 bg-app-surface border border-app-border/60 rounded text-[10px] font-mono text-app-text-muted truncate">
                    {fix.suggested_value}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Result & Actions Area */}
        {result && loadingAction === null && (
          <div className="mt-4 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-primary">Result</h4>
              <div className="flex items-center gap-2">
                {onInsertToCanvas && (
                  <button 
                    onClick={() => onInsertToCanvas(result)}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-all shadow-sm"
                  >
                    <PlusCircle className="w-3 h-3" />
                    Insert to Canvas
                  </button>
                )}
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold bg-app-bg border border-app-border rounded-md hover:bg-app-surface transition-colors text-app-text"
                >
                  {copied ? <Check className="w-3 h-3 text-brand-success" /> : <Copy className="w-3 h-3 text-app-text-muted" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <div className="p-3 bg-app-bg border border-app-border rounded-xl text-sm text-app-text whitespace-pre-wrap max-h-[300px] overflow-y-auto font-mono">
              {result}
            </div>

            {/* Modify with Follow-up prompt */}
            <div className="mt-2 flex flex-col gap-1.5 bg-app-bg p-3 rounded-xl border border-app-border">
              <label className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted flex items-center gap-1">
                <Wand2 size={12} className="text-brand-primary" /> Modify with Follow-up
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={followUpPrompt}
                  onChange={(e) => setFollowUpPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFollowUp()}
                  placeholder="E.g. Make it more executive, add Python..."
                  className="flex-1 text-xs px-2.5 py-1.5 bg-app-surface border border-app-border rounded-lg outline-none focus:border-brand-primary text-app-text"
                />
                <button
                  onClick={handleFollowUp}
                  disabled={!followUpPrompt.trim()}
                  className="px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-lg disabled:opacity-50 hover:bg-brand-primary/90 transition-colors"
                >
                  Refine
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
