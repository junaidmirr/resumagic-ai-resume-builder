import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Sparkles,
  Send,
  Copy,
  Check,
  Loader2,
  Mail,
  GraduationCap,
  Briefcase,
  UserCheck,
  DollarSign,
  Share2,
  MessageSquare,
  Lock,
  Plus,
  Download,
  Printer,
  History,
  Trash2,
  Sliders,
  Award,
  CheckCircle2,
  Wand2
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useDialog } from "../../context/DialogContext";
import { UpgradeTriggerModal } from "../common/UpgradeTriggerModal";

interface SavedDocument {
  id: string;
  doc_type: string;
  title: string;
  content: string;
  createdAt: string;
}

const docTypes = [
  { id: "cover_letter", label: "Cover Letter", icon: FileText, desc: "Tailored cover letter matching target job description", badge: "POPULAR" },
  { id: "sop", label: "Statement of Purpose (SOP)", icon: GraduationCap, desc: "Academic & university admissions statement", badge: "ACADEMIC" },
  { id: "lor", label: "Letter of Recommendation (LOR)", icon: UserCheck, desc: "Professors & managers reference letter", badge: "EXECUTIVE" },
  { id: "resignation", label: "Resignation Letter", icon: Briefcase, desc: "Polite two-week notice & transition document", badge: "ESSENTIAL" },
  { id: "cold_email", label: "Cold Outreach Email", icon: Mail, desc: "High-converting email to recruiters & hiring managers", badge: "OUTREACH" },
  { id: "thank_you", label: "Thank You Email", icon: Send, desc: "Post-interview follow-up email script", badge: "INTERVIEW" },
  { id: "salary_negotiation", label: "Salary Negotiation", icon: DollarSign, desc: "Counter-offer email & negotiation script", badge: "CAREER" },
  { id: "linkedin_bio", label: "LinkedIn Bio & Headline", icon: Share2, desc: "High-visibility LinkedIn profile copy", badge: "SOCIAL" },
  { id: "interview_answers", label: "Interview STAR Answers", icon: MessageSquare, desc: "Behavioral interview prep STAR scripts", badge: "PREP" },
];

const toneOptions = [
  "Executive & Persuasive",
  "Professional & Concise",
  "Academic & Formal",
  "High-Energy & Creative",
];

const quickPresets = [
  { label: "FAANG SDE II", title: "Senior Software Engineer", company: "Google", notes: "Highlight 5+ yrs distributed systems & 99.99% uptime." },
  { label: "Stanford SOP", title: "Master of Science in Computer Science", company: "Stanford University", notes: "Focus on AI research, machine learning projects & GPA 3.9." },
  { label: "Product Manager", title: "Principal Product Manager", company: "Microsoft", notes: "Emphasis on cross-functional roadmap & 2M DAU growth." },
];

export function CareerDocumentsView() {
  const { user, credits, userPlan, refreshCredits } = useAuth();
  const { alert, confirm } = useDialog();

  const [selectedType, setSelectedType] = useState("cover_letter");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [experience, setExperience] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedTone, setSelectedTone] = useState("Executive & Persuasive");

  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [savedDocs, setSavedDocs] = useState<SavedDocument[]>([]);
  const [viewHistory, setViewHistory] = useState(false);

  // Load saved documents from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`saved_career_docs_${user?.uid || "guest"}`);
      if (stored) {
        setSavedDocs(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  const saveToHistory = (title: string, content: string, type: string) => {
    const newDoc: SavedDocument = {
      id: "doc_" + Math.random().toString(36).substring(2, 9),
      doc_type: type,
      title: title,
      content: content,
      createdAt: new Date().toLocaleDateString(),
    };
    const updated = [newDoc, ...savedDocs];
    setSavedDocs(updated);
    try {
      localStorage.setItem(`saved_career_docs_${user?.uid || "guest"}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const deleteSavedDoc = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Delete Document?",
      description: "Are you sure you want to remove this saved document from history?",
    });
    if (isConfirmed) {
      const updated = savedDocs.filter((d) => d.id !== id);
      setSavedDocs(updated);
      try {
        localStorage.setItem(`saved_career_docs_${user?.uid || "guest"}`, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const applyPreset = (preset: typeof quickPresets[0]) => {
    setJobTitle(preset.title);
    setCompany(preset.company);
    setNotes(preset.notes);
  };

  const handleGenerate = async () => {
    if (!user) {
      await alert({ title: "Login Required", description: "Please log in to generate AI career documents." });
      return;
    }

    const isProTier = userPlan === "pro" || userPlan === "career_pro" || userPlan === "lifetime";
    if (!isProTier) {
      setShowUpgradeModal(true);
      return;
    }

    if (credits < 10) {
      setShowUpgradeModal(true);
      return;
    }

    if (!jobTitle || !company) {
      await alert({ title: "Missing Information", description: "Please enter both Target Role/Title and Target Company/Institution." });
      return;
    }

    setGenerating(true);
    setGeneratedContent("");

    try {
      const token = await user.getIdToken().catch(() => "");
      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user.uid,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          doc_type: selectedType,
          job_title: jobTitle,
          company: company,
          user_experience: experience,
          additional_notes: `Tone: ${selectedTone}. ${notes}`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedContent(data.content);
        saveToHistory(data.title || `${selectedType} for ${company}`, data.content, selectedType);
        await refreshCredits();
      } else {
        throw new Error(data.error || "Failed to generate document");
      }
    } catch (err: any) {
      await alert({ title: "Generation Error", description: err.message || "Failed to generate document." });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedContent], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${selectedType}_${company.replace(/\s+/g, "_")}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${selectedType} - ${company}</title>
            <style>
              body { font-family: sans-serif; padding: 40px; line-height: 1.6; color: #111; max-width: 800px; margin: 0 auto; }
              pre { white-space: pre-wrap; font-family: sans-serif; font-size: 14px; }
            </style>
          </head>
          <body>
            <pre>${generatedContent}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6 text-app-text">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-app-surface border border-app-border rounded-3xl p-6 sm:p-8 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-4 h-4 text-brand-primary" />
            AI Career Document Suite
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-app-text tracking-tight">
            Cover Letters, SOPs, LORs & Communications
          </h2>
          <p className="text-xs sm:text-sm text-app-text-muted mt-1 leading-relaxed max-w-2xl">
            Generate tailored executive cover letters, admissions SOPs, reference LORs, resignation notices, and cold outreach scripts in seconds.
          </p>
        </div>

        <button
          onClick={() => setViewHistory(!viewHistory)}
          className="px-4 py-2.5 rounded-2xl bg-app-bg border border-app-border hover:border-brand-primary/40 text-app-text font-bold text-xs transition-all flex items-center justify-center gap-2 shrink-0 shadow-sm"
        >
          <History className="w-4 h-4 text-brand-primary" />
          <span>{viewHistory ? "New Generator" : `Saved Docs (${savedDocs.length})`}</span>
        </button>
      </div>

      {viewHistory ? (
        /* Saved Documents History Grid */
        <div className="bg-app-surface border border-app-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-app-border pb-4">
            <h3 className="text-lg font-black text-app-text flex items-center gap-2">
              <History className="w-5 h-5 text-brand-primary" />
              Saved Career Documents ({savedDocs.length})
            </h3>
            <button
              onClick={() => setViewHistory(false)}
              className="text-xs font-bold text-brand-primary hover:underline"
            >
              + Create New Document
            </button>
          </div>

          {savedDocs.length === 0 ? (
            <div className="py-16 text-center text-app-text-muted space-y-3">
              <FileText className="w-12 h-12 mx-auto text-app-text-muted opacity-40" />
              <p className="font-bold text-sm">No saved career documents yet.</p>
              <p className="text-xs">Generated cover letters, SOPs, and emails will automatically be saved here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-5 rounded-2xl bg-app-bg border border-app-border flex flex-col justify-between hover:border-brand-primary/30 transition-all shadow-sm group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                        {doc.doc_type.replace(/_/g, " ")}
                      </span>
                      <span className="text-[11px] text-app-text-muted font-medium">{doc.createdAt}</span>
                    </div>

                    <h4 className="font-black text-sm text-app-text mb-2 truncate">{doc.title}</h4>
                    <p className="text-xs text-app-text-muted line-clamp-3 font-mono leading-relaxed mb-4">
                      {doc.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-app-border">
                    <button
                      onClick={() => {
                        setGeneratedContent(doc.content);
                        setViewHistory(false);
                      }}
                      className="text-xs font-bold text-brand-primary hover:underline"
                    >
                      View & Export
                    </button>
                    <button
                      onClick={() => deleteSavedDoc(doc.id)}
                      className="p-1.5 rounded-lg text-app-text-muted hover:text-brand-danger hover:bg-brand-danger/10 transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Generator Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Document Type Selector */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-app-text-muted px-1">
              1. Choose Document Type
            </h3>

            <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
              {docTypes.map((doc) => {
                const Icon = doc.icon;
                const isSelected = selectedType === doc.id;
                return (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedType(doc.id)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 group relative ${
                      isSelected
                        ? "bg-brand-primary/10 border-brand-primary shadow-md"
                        : "bg-app-surface border-app-border hover:border-brand-primary/40 shadow-sm"
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                        isSelected ? "bg-brand-primary text-white shadow-sm" : "bg-app-bg text-app-text-muted group-hover:text-brand-primary"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h4 className={`font-black text-xs truncate ${isSelected ? "text-brand-primary" : "text-app-text"}`}>
                          {doc.label}
                        </h4>
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-app-bg text-app-text-muted border border-app-border shrink-0">
                          {doc.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-app-text-muted leading-tight line-clamp-2">{doc.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form & Result Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Input Form Card */}
            <div className="bg-app-surface border border-app-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
              
              <div className="flex items-center justify-between border-b border-app-border pb-3">
                <h3 className="font-extrabold text-sm text-app-text flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-brand-primary" />
                  2. Customize Document Parameters
                </h3>

                {/* Quick Presets */}
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-app-text-muted">Presets:</span>
                  {quickPresets.map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => applyPreset(preset)}
                      className="px-2.5 py-1 rounded-lg bg-app-bg border border-app-border text-[10px] font-bold text-app-text hover:border-brand-primary/40 transition-all"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold block mb-1 text-app-text">Target Job Title / Academic Program</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Software Engineer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-app-bg border border-app-border text-xs text-app-text font-medium focus:border-brand-primary focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1 text-app-text">Target Company / University</label>
                  <input
                    type="text"
                    placeholder="e.g. Google / Stanford University"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-app-bg border border-app-border text-xs text-app-text font-medium focus:border-brand-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1 text-app-text">Tone & Style</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {toneOptions.map((tone) => (
                    <button
                      key={tone}
                      onClick={() => setSelectedTone(tone)}
                      className={`p-2.5 rounded-xl border text-[11px] font-bold transition-all text-center ${
                        selectedTone === tone
                          ? "bg-brand-primary/10 border-brand-primary text-brand-primary"
                          : "bg-app-bg border-app-border text-app-text-muted hover:text-app-text"
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1 text-app-text">Candidate Key Accomplishments / Highlights (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Led cloud infrastructure team, scaled API to 10M users, reduced latency by 40%..."
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-app-bg border border-app-border text-xs text-app-text font-medium focus:border-brand-primary focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1 text-app-text">Additional Directives (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Emphasize leadership, keep under 300 words..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-app-bg border border-app-border text-xs text-app-text font-medium focus:border-brand-primary focus:outline-none transition-colors"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-4 rounded-2xl font-black bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-secondary hover:to-brand-primary text-white text-xs sm:text-sm shadow-xl shadow-brand-primary/25 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Drafting Executive Document...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate {docTypes.find((d) => d.id === selectedType)?.label} (10 Credits)
                  </>
                )}
              </button>
            </div>

            {/* Generated Result Display */}
            {generatedContent && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-app-surface border border-brand-primary/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-app-border pb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-app-text">AI Generated Output</h4>
                      <p className="text-[11px] text-app-text-muted">100% Ready to copy or export</p>
                    </div>
                  </div>

                  {/* Toolbar Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleCopy}
                      className="px-3.5 py-2 rounded-xl bg-app-bg border border-app-border text-xs font-bold text-app-text hover:border-brand-primary/40 transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-brand-primary" />
                          <span>Copy Text</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleDownloadTxt}
                      className="px-3.5 py-2 rounded-xl bg-app-bg border border-app-border text-xs font-bold text-app-text hover:border-brand-primary/40 transition-all flex items-center gap-1.5 shadow-sm"
                      title="Download Markdown file"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Download .md</span>
                    </button>

                    <button
                      onClick={handlePrint}
                      className="px-3.5 py-2 rounded-xl bg-app-bg border border-app-border text-xs font-bold text-app-text hover:border-brand-primary/40 transition-all flex items-center gap-1.5 shadow-sm"
                      title="Print / Save as PDF"
                    >
                      <Printer className="w-3.5 h-3.5 text-teal-500" />
                      <span>Print / PDF</span>
                    </button>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-app-bg border border-app-border text-xs leading-relaxed text-app-text font-mono whitespace-pre-wrap max-h-[500px] overflow-y-auto shadow-inner">
                  {generatedContent}
                </div>
              </motion.div>
            )}

          </div>
        </div>
      )}

      <UpgradeTriggerModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Unlock AI Career Document Suite"
        description="You have run out of AI credits or need Pro access to generate Cover Letters, SOPs, LORs, and Cold Emails."
        featureName="Career Document Suite"
      />
    </div>
  );
}
