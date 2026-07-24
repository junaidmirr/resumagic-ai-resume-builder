import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Copy,
  Check,
  Loader2,
  FileText,
  Send,
  Mail,
  GraduationCap,
  Briefcase,
  UserCheck,
  DollarSign,
  Share2,
  MessageSquare,
  History,
  Trash2,
  Download,
  Printer,
  Wand2,
  BookmarkCheck,
  ChevronDown,
  ArrowRight,
  Zap,
  Palette
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useDialog } from "../../context/DialogContext";
import { UpgradeTriggerModal } from "../common/UpgradeTriggerModal";
import { generateCareerDocumentClient, convertDocumentTextToCanvasElements } from "../../lib/careerDocGenerator";
import { CoverLetterTemplateModal } from "./CoverLetterTemplateModal";
import { buildCoverLetterCanvasElements } from "../../lib/coverLetterTemplates";

interface SavedDocument {
  id: string;
  doc_type: string;
  title: string;
  content: string;
  createdAt: string;
}

const mainDocTypes = [
  { id: "cover_letter", label: "Job Cover Letter", icon: FileText, emoji: "💼", hint: "Letter for job applications" },
  { id: "cold_email", label: "Recruiter Email", icon: Mail, emoji: "✉️", hint: "Outreach to HR & managers" },
  { id: "sop", label: "University SOP", icon: GraduationCap, emoji: "🎓", hint: "Admissions essay" },
  { id: "thank_you", label: "Thank You Email", icon: Send, emoji: "🙏", hint: "Follow-up after interview" },
  { id: "resignation", label: "Resignation Letter", icon: Briefcase, emoji: "📝", hint: "Official 2-week notice" },
  { id: "salary_negotiation", label: "Salary Negotiation", icon: DollarSign, emoji: "💰", hint: "Ask for higher pay" },
  { id: "linkedin_bio", label: "LinkedIn Bio", icon: Share2, emoji: "🌐", hint: "Profile about section" },
  { id: "lor", label: "Recommendation LOR", icon: UserCheck, emoji: "🌟", hint: "Reference letter" },
];

const quickExamples = [
  { label: "Software Engineer @ Google", doc_type: "cover_letter", role: "Senior Software Engineer", company: "Google" },
  { label: "Product Manager @ Stripe", doc_type: "cover_letter", role: "Lead Product Manager", company: "Stripe" },
  { label: "CS Masters @ Stanford", doc_type: "sop", role: "M.S. in Computer Science", company: "Stanford University" },
  { label: "Recruiter Email @ Meta", doc_type: "cold_email", role: "Full Stack Developer", company: "Meta" },
];

export function CareerDocumentsView() {
  const { user, credits, userPlan, refreshCredits } = useAuth();
  const { alert, confirm } = useDialog();
  const navigate = useNavigate();

  const [selectedType, setSelectedType] = useState("cover_letter");
  const [promptInput, setPromptInput] = useState("");
  
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [savedDocs, setSavedDocs] = useState<SavedDocument[]>([]);
  const [viewHistory, setViewHistory] = useState(false);

  const activeDoc = mainDocTypes.find((d) => d.id === selectedType) || mainDocTypes[0];

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [pendingTextToDesign, setPendingTextToDesign] = useState("");
  const [pendingTitleToDesign, setPendingTitleToDesign] = useState("");

  const handleOpenInCanvas = (contentToDesign?: string, docTitle?: string) => {
    const textToUse = contentToDesign || generatedContent;
    if (!textToUse) return;
    const titleToUse = docTitle || activeDoc.label;
    setPendingTextToDesign(textToUse);
    setPendingTitleToDesign(titleToUse);
    setIsTemplateModalOpen(true);
  };

  const handleSelectTemplate = (templateId: string) => {
    if (!pendingTextToDesign) return;
    const canvasElements = buildCoverLetterCanvasElements(pendingTitleToDesign, pendingTextToDesign, templateId);
    localStorage.setItem("designed_resume", JSON.stringify(canvasElements));
    navigate("/editor");
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`saved_career_docs_${user?.uid || "guest"}`);
      if (stored) setSavedDocs(JSON.parse(stored));
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
      description: "Remove this document from your history?",
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

  const handleGenerate = async () => {
    if (!user) {
      await alert({ title: "Login Required", description: "Please log in to generate documents." });
      return;
    }

    if (!promptInput.trim()) {
      await alert({
        title: "Enter Role & Company",
        description: "Please type the role and company (e.g. 'Software Engineer at Google').",
      });
      return;
    }

    setGenerating(true);
    setGeneratedContent("");

    // Parse role and company from user prompt
    const parts = promptInput.split(/ at | @ | for | - /i);
    const jobTitle = parts[0]?.trim() || promptInput.trim();
    const company = parts[1]?.trim() || "Target Organization";

    try {
      const token = await user.getIdToken().catch(() => "");
      const data = await generateCareerDocumentClient({
        doc_type: selectedType,
        job_title: jobTitle,
        company: company,
        user_experience: promptInput,
        additional_notes: "Professional & executive tone.",
        uid: user.uid,
        idToken: token,
      });

      if (data && data.success && data.content) {
        setGeneratedContent(data.content);
        saveToHistory(data.title || `${activeDoc.label} for ${company}`, data.content, selectedType);
        await refreshCredits().catch(() => {});
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
    element.download = `${selectedType}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-app-text pb-12">
      
      {/* Top Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-app-text flex items-center gap-2">
            <span>✨</span> What do you need written today?
          </h2>
          <p className="text-xs text-app-text-muted mt-0.5">
            Select a document type, type your target role & company, and AI does the rest.
          </p>
        </div>

        <button
          onClick={() => setViewHistory(!viewHistory)}
          className="px-3.5 py-2 rounded-xl bg-app-surface border border-app-border hover:border-brand-primary/40 text-xs font-bold text-app-text transition-all flex items-center gap-2 shadow-xs shrink-0"
        >
          <History className="w-4 h-4 text-brand-primary" />
          <span>{viewHistory ? "Writer" : `Saved (${savedDocs.length})`}</span>
        </button>
      </div>

      {viewHistory ? (
        /* SAVED HISTORY VIEW */
        <div className="bg-app-surface border border-app-border rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-app-border pb-3">
            <h3 className="font-black text-sm text-app-text flex items-center gap-2">
              <BookmarkCheck className="w-4 h-4 text-brand-primary" />
              Saved Documents ({savedDocs.length})
            </h3>
            <button
              onClick={() => setViewHistory(false)}
              className="text-xs font-bold text-brand-primary hover:underline"
            >
              + Create New
            </button>
          </div>

          {savedDocs.length === 0 ? (
            <div className="py-12 text-center text-app-text-muted space-y-2">
              <FileText className="w-10 h-10 mx-auto opacity-30 text-brand-primary" />
              <p className="font-bold text-xs">No saved documents yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-2xl bg-app-bg border border-app-border flex items-center justify-between gap-4 hover:border-brand-primary/40 transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary">
                        {doc.doc_type.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] text-app-text-muted">{doc.createdAt}</span>
                    </div>
                    <h4 className="font-bold text-xs text-app-text truncate">{doc.title}</h4>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenInCanvas(doc.content, doc.title)}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-primary to-indigo-600 hover:from-indigo-600 hover:to-brand-primary text-white font-bold text-xs flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                    >
                      <Palette className="w-3.5 h-3.5" />
                      <span>Design in Canvas</span>
                    </button>
                    <button
                      onClick={() => {
                        setGeneratedContent(doc.content);
                        setViewHistory(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-app-surface border border-app-border hover:border-brand-primary/40 text-app-text font-bold text-xs transition-all"
                    >
                      View Text
                    </button>
                    <button
                      onClick={() => deleteSavedDoc(doc.id)}
                      className="p-1.5 rounded-lg text-app-text-muted hover:text-rose-500 transition-colors"
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
        /* INTERACTIVE SINGLE-CARD ASSISTANT */
        <div className="space-y-6">

          {/* 1. DOCUMENT TYPE SELECTOR PILLS */}
          <div className="bg-app-surface border border-app-border rounded-3xl p-5 shadow-sm space-y-3">
            <label className="text-xs font-bold text-app-text-muted uppercase tracking-wider block">
              1. Select Document Type:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {mainDocTypes.map((doc) => {
                const isSelected = selectedType === doc.id;
                return (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedType(doc.id)}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                      isSelected
                        ? "bg-brand-primary text-white border-brand-primary shadow-md"
                        : "bg-app-bg border-app-border text-app-text hover:border-brand-primary/40"
                    }`}
                  >
                    <span className="text-lg shrink-0">{doc.emoji}</span>
                    <div className="min-w-0">
                      <div className={`font-black text-xs truncate ${isSelected ? "text-white" : "text-app-text"}`}>
                        {doc.label}
                      </div>
                      <div className={`text-[10px] truncate ${isSelected ? "text-white/80" : "text-app-text-muted"}`}>
                        {doc.hint}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. SINGLE PROMPT INPUT CARD */}
          <div className="bg-app-surface border border-app-border rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-app-text flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-brand-primary" />
                <span>2. Enter Role & Company for {activeDoc.label}:</span>
              </label>

              {/* Quick Sample Chips */}
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="text-[10px] text-app-text-muted font-bold">Try sample:</span>
                {quickExamples.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedType(ex.doc_type);
                      setPromptInput(`${ex.role} at ${ex.company}`);
                    }}
                    className="px-2 py-0.5 rounded-full bg-app-bg border border-app-border text-[10px] font-bold text-app-text hover:border-brand-primary/40 transition-all"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Single Conversational Box */}
            <div className="relative">
              <input
                type="text"
                placeholder={`e.g. Senior Software Engineer at Google`}
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleGenerate();
                }}
                className="w-full pl-4 pr-32 py-4 rounded-2xl bg-app-bg border border-app-border text-sm text-app-text font-medium focus:border-brand-primary focus:outline-none transition-colors shadow-inner"
              />

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-xl font-bold bg-brand-primary hover:bg-brand-secondary text-white text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Writing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 3. GENERATED RESULT CARD */}
          {generatedContent && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-app-surface border-2 border-brand-primary/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-app-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎉</span>
                  <div>
                    <h4 className="font-black text-sm text-app-text">Your Generated {activeDoc.label}</h4>
                    <p className="text-[10px] text-app-text-muted">Saved in history • Ready to copy</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleOpenInCanvas()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-primary to-indigo-600 hover:from-indigo-600 hover:to-brand-primary text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-brand-primary/20 active:scale-95 cursor-pointer"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span>Design in Canvas</span>
                  </button>

                  <button
                    onClick={handleCopy}
                    className="px-3.5 py-2 rounded-xl bg-app-bg border border-app-border hover:border-brand-primary/40 text-app-text font-bold text-xs transition-all flex items-center gap-1.5 shadow-2xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Copied!</span>
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
                    className="px-3 py-2 rounded-xl bg-app-bg border border-app-border hover:border-brand-primary/40 text-xs font-bold text-app-text transition-all flex items-center gap-1 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-500" />
                    <span>.md</span>
                  </button>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-app-bg border border-app-border text-xs leading-relaxed text-app-text font-sans whitespace-pre-wrap max-h-[500px] overflow-y-auto shadow-inner select-text">
                {generatedContent}
              </div>
            </motion.div>
          )}

        </div>
      )}

      <UpgradeTriggerModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Unlock AI Career Document Suite"
        description="You have run out of AI credits or need Pro access to generate Cover Letters, SOPs, LORs, and Cold Emails."
        featureName="Career Document Suite"
      />

      <CoverLetterTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        docTitle={pendingTitleToDesign}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  );
}

export default CareerDocumentsView;
