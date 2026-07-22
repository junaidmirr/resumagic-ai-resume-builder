import {
  FileUp,
  PenLine,
  LayoutTemplate,
  Globe,
  FileText,
  Edit3,
  Loader2,
  X,
  Sparkles,
  Upload,
  ArrowLeft,
} from "lucide-react";
import { useState, useRef } from "react";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { LinkedInImportModal } from "../components/onboarding/LinkedInImportModal";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { resumeService } from "../lib/resumeService";
import {
  extractTextFromPDF,
  parseResumeTextToWizardData,
  extractVisualElementsFromPDF
} from "../lib/pdfParser";
import { generateWizardElements } from "../lib/wizardGenerator";
import { AIArchitectModal } from "../components/onboarding/AIArchitectModal";
import { buildResumeFromImportedText, normalizeEditorElements } from "../lib/aiArchitect";
import defaultLogoLight from '../assets/default.png';
import defaultLogoDark from '../assets/default-dark.png';


export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, refreshCredits } = useAuth();
  const [isImporting, setIsImporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [enhancementPrompt, setEnhancementPrompt] = useState("");
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [showAIArchitectModal, setShowAIArchitectModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAIArchitectSuccess = async (elements: any[], title: string) => {
    try {
      const id = await resumeService.createResume(
        user?.uid || "guest",
        title || "AI Architect Resume",
        elements
      );
      localStorage.setItem("current_resume_id", id);
      navigate("/editor");
    } catch (err) {
      console.error("Failed to create resume:", err);
      const localId = "local_" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem("current_resume_id", localId);
      navigate("/editor");
    }
  };

  const handleImportClick = () => {
    setShowImportModal(true);
  };

  const handleFilePick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleLinkedInImport = async (
    type: "pdf",
    value: File,
  ) => {
    setShowLinkedInModal(false);
    setIsImporting(true);
    try {
      const rawText = await extractTextFromPDF(value);
      const result = await buildResumeFromImportedText(rawText, "Imported LinkedIn PDF Profile");
      const title = result.title || `${value.name.replace(/\.[^/.]+$/, "")}'s Resume`;
      const id = await resumeService.createResume(
        user?.uid || "guest",
        title,
        result.elements,
      );
      localStorage.setItem("current_resume_id", id);
      navigate("/editor");
    } catch (err: any) {
      console.error(err);
      alert(
        "Error importing LinkedIn profile: " + (err.message || String(err)),
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleStartImport = async () => {
    if (!selectedFile) return;
    setShowImportModal(false);
    setIsImporting(true);
    try {
      // 1. Extract raw text from the uploaded PDF/document
      const rawText = await extractTextFromPDF(selectedFile);
      
      let elements: any[] = [];
      let title = selectedFile.name.replace(/\.[^/.]+$/, "");

      if (rawText && rawText.trim().length > 20) {
        // 2. Use AI Distiller to extract all details & build structured graphics
        const result = await buildResumeFromImportedText(rawText, enhancementPrompt);
        elements = result.elements;
        if (result.title) title = result.title;
      } else {
        // Fallback: visual coordinate extraction if text is minimal
        elements = await extractVisualElementsFromPDF(selectedFile);
      }

      const id = await resumeService.createResume(
        user?.uid || "guest",
        title,
        elements,
      );
      
      localStorage.setItem("current_resume_id", id);
      navigate("/editor");
    } catch (err: any) {
      console.error(err);
      alert("Error importing resume: " + (err.message || String(err)));
    } finally {
      setIsImporting(false);
      setSelectedFile(null);
      setEnhancementPrompt("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCreateBlank = async () => {
    const id = await resumeService.createResume(
      user?.uid || "guest",
      "Untitled Resume",
      [],
    );
    localStorage.setItem("current_resume_id", id);
    navigate("/editor");
  };

  const options = [
    {
      id: "architect",
      title: "AI Architect",
      description:
        "Describe your dream resume. The AI will outline a plan, let you refine it, and build your bespoke design.",
      action: () => setShowAIArchitectModal(true),
      icon: Sparkles,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      ringColor: "hover:ring-indigo-500/50",
    },
    {
      id: "scratch",
      title: "Create from Scratch",
      action: () => navigate("/wizard"),
      description:
        "Start with a blank canvas and follow our guided process to build a masterpiece.",
      icon: PenLine,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
      ringColor: "hover:ring-rose-500/50",
    },
    {
      id: "editor",
      title: "Open Blank Editor",
      description:
        "Jump straight into the flexible drag-and-drop PDF Editor canvas.",
      action: handleCreateBlank,
      icon: Edit3,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      ringColor: "hover:ring-amber-500/50",
    },
    {
      id: "import",
      title: "Import Resume",
      description:
        "Upload your existing PDF or Docx. We will parse it and upgrade it with AI instantly.",
      action: handleImportClick,
      icon: FileUp,
      color: "text-teal-500",
      bgColor: "bg-teal-500/10",
      ringColor: "hover:ring-teal-500/50",
    },
    {
      id: "templates",
      title: "Use Templates",
      description:
        "Browse our beautiful ATS-friendly designs and pick your favorite to start.",
      action: () => navigate("/dashboard?tab=templates"),
      icon: LayoutTemplate,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      ringColor: "hover:ring-indigo-500/50",
    },
    {
      id: "linkedin",
      title: "Import from LinkedIn",
      description:
        "Connect your LinkedIn automatically and turn your profile into a professional resume.",
      action: () => setShowLinkedInModal(true),
      icon: Globe,
      color: "text-sky-500",
      bgColor: "bg-sky-500/10",
      ringColor: "hover:ring-sky-500/50",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-app-bg transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-app-border bg-white/80 dark:bg-slate-950/80 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-app-surface border border-app-border text-app-text hover:bg-slate-50 dark:hover:bg-slate-900 transition-all shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          <Link to="/" className="flex items-center gap-2 group">
            <img src={defaultLogoLight} alt="Resumagic" className="h-7 lg:h-8 w-auto logo-light" />
            <img src={defaultLogoDark} alt="Resumagic" className="h-7 lg:h-8 w-auto logo-dark" />
          </Link>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 py-12 sm:p-6 lg:p-8 relative">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 left-1/2 -mt-10 -ml-40 blur-3xl opacity-50 dark:opacity-20 animate-pulse transition-opacity">
            <div className="h-[300px] w-[500px] rounded-full bg-linear-to-r from-teal-400 to-indigo-500 opacity-30" />
          </div>
        </div>

        <div className="relative z-10 w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-extrabold tracking-tight text-app-text sm:text-4xl text-balance">
              How would you like to create your resume?
            </h1>
            <p className="mt-4 text-base sm:text-lg text-app-text-secondary">
              Select an option below to jumpstart your career profile.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={option.action}
                className={`group relative flex flex-col items-start p-6 sm:p-8 rounded-2xl bg-app-surface border border-app-border shadow-sm hover:shadow-xl transition-all duration-300 text-left focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-950 ${option.ringColor}`}
              >
                <div
                  className={`rounded-xl p-3 mb-5 inline-flex ${option.bgColor} transition-transform group-hover:scale-110 duration-300`}
                >
                  <option.icon className={`h-8 w-8 ${option.color}`} />
                </div>
                <h3 className="text-xl font-bold text-app-text mb-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  {option.title}
                </h3>
                <p className="text-sm text-app-text-muted leading-relaxed">
                  {option.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          accept=".pdf,.docx,.doc"
          ref={fileInputRef}
          onChange={handleFileSelected}
          className="hidden"
        />

        {/* ── IMPORT MODAL ── */}
        {showImportModal && (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => {
              setShowImportModal(false);
              setSelectedFile(null);
              setEnhancementPrompt("");
            }}
          >
            <div
              className="bg-app-surface rounded-2xl shadow-2xl border border-app-border w-full max-w-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-app-border">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-teal-500" />
                  <h3 className="font-bold text-lg text-app-text">
                    AI Resume Import
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setSelectedFile(null);
                    setEnhancementPrompt("");
                  }}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {/* File Upload Area */}
                <div>
                  <label className="block text-sm font-semibold text-app-text-secondary mb-2">
                    Resume File
                  </label>
                  <button
                    onClick={handleFilePick}
                    className={`w-full flex items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed transition-all
                      ${
                        selectedFile
                          ? "border-teal-400 bg-teal-50 dark:bg-teal-900/20"
                          : "border-app-border hover:border-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                  >
                    {selectedFile ? (
                      <div className="flex flex-col items-center gap-1">
                        <FileText className="h-8 w-8 text-teal-500" />
                        <span className="text-sm font-semibold text-teal-700 dark:text-teal-300">
                          {selectedFile.name}
                        </span>
                        <span className="text-xs text-slate-400">
                          Click to change file
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Upload className="h-8 w-8 text-slate-400" />
                        <span className="text-sm font-medium text-slate-500">
                          Click to upload PDF or DOCX
                        </span>
                      </div>
                    )}
                  </button>
                </div>

                {/* Enhancement Prompt */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-app-text-secondary mb-2">
                    <Sparkles size={14} className="text-indigo-500" />
                    Enhancement Instructions
                    <span className="text-xs font-normal text-slate-400">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    value={enhancementPrompt}
                    onChange={(e) => setEnhancementPrompt(e.target.value)}
                    placeholder='e.g. "Make the design more modern with a dark header", "Refine the professional summary to be more impactful", "Use a blue accent colour scheme"...'
                    rows={3}
                    className="w-full px-4 py-3 text-sm bg-app-surface border border-app-border rounded-xl outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all resize-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-app-border bg-app-bg/50">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setSelectedFile(null);
                    setEnhancementPrompt("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-app-text-secondary hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartImport}
                  disabled={!selectedFile}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl text-white
                    bg-gradient-to-r from-teal-500 to-indigo-500 hover:from-teal-400 hover:to-indigo-400
                    disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                >
                  <Sparkles size={14} />
                  Analyse & Import
                </button>
              </div>
            </div>
          </div>
        )}

        {showLinkedInModal && (
          <LinkedInImportModal
            isOpen={showLinkedInModal}
            onClose={() => setShowLinkedInModal(false)}
            onImport={handleLinkedInImport}
          />
        )}

        <AIArchitectModal
          isOpen={showAIArchitectModal}
          onClose={() => setShowAIArchitectModal(false)}
          onSuccess={handleAIArchitectSuccess}
        />

        {/* Loading Overlay */}
        {isImporting && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center">
            <div className="bg-app-surface p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm text-center">
              <Loader2 className="h-12 w-12 text-teal-500 animate-spin mb-4" />
              <h3 className="text-xl font-bold text-app-text mb-2">
                Analysing Resume...
              </h3>
              <p className="text-sm text-app-text-muted">
                Our AI engine is scanning the layout, matching fonts, and
                building your enhanced template. This may take up to a minute.
              </p>
              {enhancementPrompt && (
                <div className="mt-3 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 italic">
                    ✨ Applying: "{enhancementPrompt.slice(0, 80)}
                    {enhancementPrompt.length > 80 ? "…" : ""}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
