import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";

import { resumeService, type Resume } from "../lib/resumeService";
import { extractTextFromPDF } from "../lib/pdfParser";
import { buildResumeFromImportedText } from "../lib/aiArchitect";
import {
  Plus,
  ArrowRight,
  Zap,
  Target,
  FilePlus,
  Wand2,
  DownloadCloud,
  FileText,
  Clock,
  LogOut,
  Sparkles,
  Search,
  ExternalLink,
  Trash2,
  User as UserIcon,
  ShieldAlert,
  CreditCard,
  LayoutDashboard,
  Settings,
  LayoutTemplate,
  Menu,
  X,
  Loader2,
  Copy,
  Edit,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { useDialog } from "../context/DialogContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import defaultLogoLight from "../assets/default.png";
import defaultLogoDark from "../assets/default-dark.png";
import { trackTemplateUse, trackFeature } from "../lib/analytics";
import emptyStateImg from "../assets/empty-state.png";
import { NotificationCenter } from "../components/notifications/NotificationCenter";
import { TemplatesView } from "../components/dashboard/TemplatesView";
import { SettingsView } from "../components/dashboard/SettingsView";
import { CareerDocumentsView } from "../components/dashboard/CareerDocumentsView";
import { AIArchitectModal } from "../components/onboarding/AIArchitectModal";
import { UpgradeTriggerModal } from "../components/common/UpgradeTriggerModal";
import type { Template } from "../lib/templates";

export function DashboardPage() {
  const { user, logout, credits, userPlan, sendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const { confirm, alert } = useDialog();
  const [resumes, setResumes] = useState<ResumeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<
    "resumes" | "templates" | "career_docs" | "settings"
  >("resumes");
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showAIArchitectModal, setShowAIArchitectModal] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const location = useLocation();

  const handleResendVerification = async () => {
    setIsSendingVerification(true);
    try {
      await sendVerificationEmail();
      setVerificationSent(true);
    } catch (err: any) {
      alert(
        "Verification Error",
        err.message || "Failed to resend verification email.",
      );
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handleAIArchitectSuccess = async (elements: any[], title: string) => {
    try {
      const id = await resumeService.createResume(
        user?.uid || "guest",
        title || "AI Architect Resume",
        elements,
      );
      localStorage.setItem("current_resume_id", id);
      localStorage.setItem(
        `resumagic_canvas_cache_${id}`,
        JSON.stringify({
          elements,
          pages: [{ id: "page-1", width: 612, height: 792 }],
          resumeTitle: title || "AI Architect Resume",
          timestamp: Date.now(),
        }),
      );
      navigate("/editor");
    } catch (err) {
      console.error("Failed to create resume:", err);
      const localId = "local_" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem("current_resume_id", localId);
      localStorage.setItem(
        `resumagic_canvas_cache_${localId}`,
        JSON.stringify({
          elements,
          pages: [{ id: "page-1", width: 612, height: 792 }],
          resumeTitle: title || "AI Architect Resume",
          timestamp: Date.now(),
        }),
      );
      navigate("/editor");
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab === "templates") {
      setActiveTab("templates");
    } else if (tab === "resumes") {
      setActiveTab("resumes");
    } else if (tab === "settings") {
      setActiveTab("settings");
    } else if (tab === "career_docs") {
      setActiveTab("career_docs");
    }
  }, [location]);

  useEffect(() => {
    async function fetchResumes() {
      setLoading(true);
      setError(null);
      try {
        const data = await resumeService.getUserResumes(user?.uid || "guest");
        setResumes(data);
      } catch (err: any) {
        console.error("[Dashboard] Fetch failed:", err);
        setError("Failed to sync resumes. Please try refreshing.");
      } finally {
        setLoading(false);
      }
    }
    fetchResumes();
  }, [user]);

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeConfig, setUpgradeConfig] = useState({
    title: "Unlock Pro Feature",
    description: "Upgrade to unlock unlimited tools.",
    featureName: "Pro Tool",
  });

  const triggerUpgrade = (
    title: string,
    description: string,
    featureName: string,
  ) => {
    setUpgradeConfig({ title, description, featureName });
    setUpgradeModalOpen(true);
  };

  const isFree = !userPlan || userPlan === "free";

  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportResumeClick = () => {
    if (isFree && resumes.length >= 1) {
      triggerUpgrade(
        "Resume Limit Reached (1/1)",
        "The Free Plan is limited to 1 resume. Upgrade to Starter or Pro to create unlimited resumes!",
        "Unlimited Resumes",
      );
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      let rawText = "";
      if (
        file.name.toLowerCase().endsWith(".pdf") ||
        file.type.includes("pdf")
      ) {
        rawText = await extractTextFromPDF(file);
      } else {
        rawText = await file.text();
      }

      const result = await buildResumeFromImportedText(rawText, "");
      const title =
        result.title || `${file.name.replace(/\.[^/.]+$/, "")} (Imported)`;
      const id = await resumeService.createResume(
        user?.uid || "guest",
        title,
        result.elements,
      );
      localStorage.setItem("current_resume_id", id);
      navigate("/editor");
    } catch (err: any) {
      console.error("[Dashboard] Resume Import Failed:", err);
      await alert({
        title: "Import Failed",
        description:
          err.message ||
          "Could not parse or import the selected resume file. Please ensure it is a valid PDF or document.",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUseTemplate = async (template: Template) => {
    if (isFree && resumes.length >= 1) {
      triggerUpgrade(
        "Resume Limit Reached (1/1)",
        "The Free Plan is limited to 1 resume. Upgrade to Starter or Pro to create unlimited resumes!",
        "Unlimited Resumes",
      );
      return;
    }
    const freeTemplateIds = ["minimalist_grid", "corporate_hierarchy"];
    if (isFree && !freeTemplateIds.includes(template.id)) {
      triggerUpgrade(
        "Unlock Premium Template",
        `'${template.name}' is a Premium Layout. Upgrade to Starter or Pro to unlock all 20+ designer templates!`,
        "Pro Template",
      );
      return;
    }

    setIsCreatingTemplate(true);
    try {
      const elements = template.generateElements();
      localStorage.setItem("designed_resume", JSON.stringify(elements));
      localStorage.removeItem("current_resume_id");
      void trackTemplateUse(template.id);
      void trackFeature("resumeTemplate");
      navigate("/editor");
    } catch (err) {
      console.error("Failed to create from template:", err);
      alert({ title: "Error", description: "Failed to create from template." });
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  const handleCreateBlank = async () => {
    if (isFree && resumes.length >= 1) {
      triggerUpgrade(
        "Resume Limit Reached (1/1)",
        "The Free Plan is limited to 1 resume. Upgrade to Starter or Pro to create unlimited resumes!",
        "Unlimited Resumes",
      );
      return;
    }

    try {
      localStorage.setItem("designed_resume", JSON.stringify([]));
      localStorage.removeItem("current_resume_id");
      navigate("/editor");
    } catch (err) {
      console.error("Failed to create blank resume:", err);
      alert({ title: "Error", description: "Failed to start blank document." });
    }
  };

  const handleCreateNew = async () => {
    if (isFree && resumes.length >= 1) {
      triggerUpgrade(
        "Resume Limit Reached (1/1)",
        "The Free Plan is limited to 1 resume. Upgrade to Starter or Pro to create unlimited resumes!",
        "Unlimited Resumes",
      );
      return;
    }
    navigate("/build");
  };

  const handleEdit = (id: string) => {
    localStorage.setItem("current_resume_id", id);
    navigate("/editor");
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      await confirm({
        title: "Delete Resume",
        description:
          "Are you sure you want to delete this resume? This cannot be undone.",
        danger: true,
      })
    ) {
      try {
        await resumeService.deleteResume(id, user?.uid);
        setResumes(resumes.filter((r) => r.id !== id));
      } catch (err) {
        console.error("Failed to delete resume:", err);
        alert({ title: "Error", description: "Failed to delete resume." });
      }
    }
  };

  const filteredResumes = resumes.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const NavLinks = () => (
    <>
      <button
        onClick={() => setActiveTab("resumes")}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
          activeTab === "resumes"
            ? "bg-brand-primary/10 text-brand-primary font-semibold"
            : "text-app-text-secondary hover:text-app-text hover:bg-app-surface font-medium"
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        Dashboard
      </button>
      <button
        onClick={() => setActiveTab("templates")}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
          activeTab === "templates"
            ? "bg-brand-primary/10 text-brand-primary font-semibold"
            : "text-app-text-secondary hover:text-app-text hover:bg-app-surface font-medium"
        }`}
      >
        <LayoutTemplate className="w-5 h-5" />
        Templates
      </button>
      <button
        onClick={() => setActiveTab("career_docs")}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
          activeTab === "career_docs"
            ? "bg-brand-primary/10 text-brand-primary font-semibold"
            : "text-app-text-secondary hover:text-app-text hover:bg-app-surface font-medium"
        }`}
      >
        <Sparkles className="w-5 h-5" />
        Career Docs
      </button>
      <button
        onClick={() => setActiveTab("settings")}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
          activeTab === "settings"
            ? "bg-brand-primary/10 text-brand-primary font-semibold"
            : "text-app-text-secondary hover:text-app-text hover:bg-app-surface font-medium"
        }`}
      >
        <Settings className="w-5 h-5" />
        Settings
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-app-bg flex overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-app-border bg-app-surface shrink-0 h-screen sticky top-0">
        <div className="p-6">
          <Link to="/" className="block mb-8">
            <img
              src={defaultLogoLight}
              alt="Resumagic"
              className="h-8 logo-light"
            />
            <img
              src={defaultLogoDark}
              alt="Resumagic"
              className="h-8 logo-dark"
            />
          </Link>
          <button
            onClick={handleCreateNew}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-slate-900/25 dark:hover:shadow-white/10 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            New Document
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <NavLinks />
        </nav>

        <div className="p-4 border-t border-app-border">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-app-bg border border-app-border">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-app-text truncate">
                {user?.email}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-amber-500 font-extrabold uppercase">
                  {credits} PTS
                </span>
                <span className="text-[9px] px-1.5 py-0.2 bg-brand-primary/10 text-brand-primary font-black uppercase rounded border border-brand-primary/20">
                  {userPlan || "FREE"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-app-bg/80 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-app-surface border-r border-app-border shadow-2xl z-50 md:hidden flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-app-border">
                <img
                  src={defaultLogoLight}
                  alt="Resumagic"
                  className="h-8 logo-light"
                />
                <img
                  src={defaultLogoDark}
                  alt="Resumagic"
                  className="h-8 logo-dark"
                />
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-2 text-app-text-muted hover:text-app-text bg-app-bg rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                <button
                  onClick={() => {
                    setIsMobileSidebarOpen(false);
                    handleCreateNew();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-xl font-semibold transition-all cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  New Document
                </button>
              </div>
              <nav className="flex-1 px-4 space-y-1">
                <div onClick={() => setIsMobileSidebarOpen(false)}>
                  <NavLinks />
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        {user && !user.emailVerified && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex items-center justify-between gap-4 text-xs shrink-0">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium">
              <Mail className="w-4 h-4 shrink-0" />
              <span>
                Your email (<strong>{user.email}</strong>) is not verified yet.
                Please check your inbox for the Firebase verification link.
              </span>
            </div>
            {verificationSent ? (
              <span className="flex items-center gap-1 text-emerald-500 font-bold">
                <CheckCircle2 className="w-4 h-4" /> Link Sent!
              </span>
            ) : (
              <button
                onClick={handleResendVerification}
                disabled={isSendingVerification}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors shrink-0 disabled:opacity-50"
              >
                {isSendingVerification
                  ? "Sending..."
                  : "Resend Verification Email"}
              </button>
            )}
          </div>
        )}

        {/* Header */}
        <header className="sticky top-0 z-30 bg-app-bg/80 backdrop-blur-xl border-b border-app-border h-16 shrink-0 flex items-center px-4 sm:px-8 justify-between">
          <div className="flex items-center gap-4 flex-1">
            <button
              className="md:hidden p-2 text-app-text-secondary hover:text-app-text hover:bg-app-surface rounded-lg transition-colors"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-app-text hidden sm:block">
              Workspace
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-text-muted" />
              <input
                type="text"
                placeholder="Search resumes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-9 pr-4 py-1.5 bg-app-surface border border-app-border rounded-lg text-sm text-app-text placeholder-app-text-muted focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
              />
            </div>

            <NotificationCenter />

            <Link
              to="/pricing"
              className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 rounded-lg transition-colors border border-brand-primary/20"
            >
              <CreditCard size={14} />
              <span className="text-xs font-bold uppercase tracking-wider">
                {credits}
              </span>
            </Link>

            <button
              onClick={logout}
              className="p-1.5 text-app-text-muted hover:text-brand-danger hover:bg-brand-danger/10 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Views */}
        {activeTab === "settings" ? (
          <SettingsView />
        ) : activeTab === "templates" ? (
          <TemplatesView
            onUseTemplate={handleUseTemplate}
            isCreating={isCreatingTemplate}
          />
        ) : activeTab === "career_docs" ? (
          <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full pb-20">
            <CareerDocumentsView />
          </div>
        ) : (
          <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8 pb-20">
            {/* Workspace Header */}
            <div className="bg-app-surface border border-app-border rounded-lg p-6 sm:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-bold text-app-text tracking-tight mb-1">
                    Workspace
                  </h2>
                  <p className="text-app-text-secondary text-sm">
                    Manage your resumes, review keyword ATS requirements, and
                    export vector documents.
                  </p>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-6 font-mono text-xs">
                  <div className="flex flex-col">
                    <span className="text-slate-500 uppercase tracking-wider text-[11px]">
                      Resumes
                    </span>
                    <span className="text-xl font-bold text-app-text">
                      {resumes.length}
                    </span>
                  </div>

                  <div className="w-px h-8 bg-app-border"></div>

                  <div className="flex flex-col">
                    <span className="text-slate-500 uppercase tracking-wider text-[11px]">
                      Credits
                    </span>
                    <span className="text-xl font-bold text-app-text">
                      {credits}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Hub */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xs font-mono font-semibold uppercase text-slate-500 tracking-wider">
                  Create or Import
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={handleCreateBlank}
                  className="bg-app-surface border border-app-border hover:border-slate-400 dark:hover:border-slate-600 rounded-lg p-5 text-left transition-colors shadow-2xs group"
                >
                  <div className="w-9 h-9 rounded border border-app-border bg-app-bg flex items-center justify-center mb-3 text-slate-700 dark:text-slate-300">
                    <FilePlus className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-app-text text-sm mb-1">
                    Blank Canvas
                  </h4>
                  <p className="text-xs text-app-text-secondary">
                    Open empty editor to design manually.
                  </p>
                </button>

                <button
                  onClick={() => setShowAIArchitectModal(true)}
                  className="bg-app-surface border border-app-border hover:border-slate-400 dark:hover:border-slate-600 rounded-lg p-5 text-left transition-colors shadow-2xs group"
                >
                  <div className="w-9 h-9 rounded border border-app-border bg-app-bg flex items-center justify-center mb-3 text-slate-700 dark:text-slate-300">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-app-text text-sm mb-1">
                    AI Architect
                  </h4>
                  <p className="text-xs text-app-text-secondary">
                    Generate complete layout from role specs.
                  </p>
                </button>

                <button
                  onClick={() => navigate("/wizard")}
                  className="bg-app-surface border border-app-border hover:border-slate-400 dark:hover:border-slate-600 rounded-lg p-5 text-left transition-colors shadow-2xs group"
                >
                  <div className="w-9 h-9 rounded border border-app-border bg-app-bg flex items-center justify-center mb-3 text-slate-700 dark:text-slate-300">
                    <Wand2 className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-app-text text-sm mb-1">
                    Guided Wizard
                  </h4>
                  <p className="text-xs text-app-text-secondary">
                    Step-by-step form for career details.
                  </p>
                </button>

                <button
                  onClick={handleImportResumeClick}
                  disabled={isImporting}
                  className="bg-app-surface border border-app-border hover:border-slate-400 dark:hover:border-slate-600 rounded-lg p-5 text-left transition-colors shadow-2xs group disabled:opacity-50"
                >
                  <div className="w-9 h-9 rounded border border-app-border bg-app-bg flex items-center justify-center mb-3 text-slate-700 dark:text-slate-300">
                    {isImporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <DownloadCloud className="w-4 h-4" />
                    )}
                  </div>
                  <h4 className="font-semibold text-app-text text-sm mb-1">
                    Import PDF
                  </h4>
                  <p className="text-xs text-app-text-secondary">
                    Extract text & formatting from existing file.
                  </p>
                </button>
              </div>
            </div>

            {/* Recent Documents */}
            <div>
              <div className="flex items-center justify-between mb-6 px-2">
                <h3 className="text-sm font-bold text-app-text-muted uppercase tracking-widest">
                  Recent Documents
                </h3>

                {/* Mobile Search - moved here to align with Recents */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-text-muted" />
                  <input
                    type="text"
                    placeholder="Search resumes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-app-surface border border-app-border rounded-xl text-sm text-app-text placeholder-app-text-muted focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              {error && (
                <div className="mb-8 p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-xl flex items-center gap-3 text-brand-danger">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-app-surface rounded-2xl h-64 p-6 flex flex-col relative overflow-hidden border border-app-border"
                    >
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_1.5s_infinite]"></div>
                      <div className="flex-1 bg-app-bg rounded-lg animate-pulse mb-4" />
                      <div className="h-4 bg-app-border rounded w-3/4 animate-pulse mb-2" />
                      <div className="h-3 bg-app-border rounded w-1/2 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : filteredResumes.length === 0 ? (
                <div className="bg-app-surface rounded-lg p-12 text-center border border-dashed border-app-border flex flex-col items-center justify-center min-h-[340px]">
                  <FileText className="w-12 h-12 text-slate-400 mb-4 stroke-1" />
                  <h3 className="text-lg font-bold text-app-text mb-1">
                    {searchQuery ? "No matches found" : "No documents yet"}
                  </h3>
                  <p className="text-xs sm:text-sm text-app-text-secondary mb-6 max-w-sm">
                    {searchQuery
                      ? "Try adjusting your search query."
                      : "Create a resume using the blank canvas or guided questionnaire."}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={handleCreateBlank}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create Blank Document
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <AnimatePresence>
                    {filteredResumes.map((resume) => (
                      <div
                        key={resume.id}
                        onClick={() => handleEdit(resume.id!)}
                        className="group bg-app-surface rounded-lg overflow-hidden cursor-pointer border border-app-border hover:border-slate-400 dark:hover:border-slate-600 transition-colors flex flex-col h-[260px] shadow-2xs"
                      >
                        <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 p-4 relative overflow-hidden flex items-center justify-center border-b border-app-border">
                          <div className="w-full h-full bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 p-3 flex flex-col gap-2 relative">
                            {/* Mini skeleton UI */}
                            <div className="w-1/3 h-1.5 bg-slate-300 dark:bg-slate-700 rounded"></div>
                            <div className="w-1/2 h-1 bg-slate-200 dark:bg-slate-800 rounded"></div>
                            <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-1"></div>
                            <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded"></div>
                            <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded"></div>
                            <div className="w-3/4 h-1 bg-slate-200 dark:bg-slate-800 rounded"></div>

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-slate-900/80 dark:bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="flex items-center gap-1.5 text-white font-medium text-xs bg-slate-800/80 px-3 py-1.5 rounded">
                                <ExternalLink className="w-3.5 h-3.5" />
                                Open Editor
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="p-3.5 flex items-start justify-between bg-app-surface">
                          <div className="min-w-0 pr-2">
                            <h3 className="font-semibold text-xs text-app-text truncate">
                              {resume.title}
                            </h3>
                            <div className="flex items-center text-[11px] text-slate-500 font-mono gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              {new Date(resume.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDelete(e, resume.id!)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors shrink-0"
                            title="Delete resume"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <AIArchitectModal
        isOpen={showAIArchitectModal}
        onClose={() => setShowAIArchitectModal(false)}
        onSuccess={handleAIArchitectSuccess}
      />

      <UpgradeTriggerModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        title={upgradeConfig.title}
        description={upgradeConfig.description}
        featureName={upgradeConfig.featureName}
      />

      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,.txt,.doc,.docx"
        onChange={handleFileSelected}
        className="hidden"
      />

      {isImporting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-app-surface border border-brand-primary/30 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl space-y-4 relative">
            <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center mx-auto text-brand-primary shadow-lg shadow-brand-primary/20">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h3 className="text-xl font-black text-app-text">
              AI Resume Import
            </h3>
            <p className="text-xs text-app-text-muted leading-relaxed">
              Extracting candidate details & distilling into high-impact
              graphics... Please wait a moment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
