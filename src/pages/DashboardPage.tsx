import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

import { resumeService, type Resume } from "../lib/resumeService";
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
import defaultLogoLight from '../assets/default.png';
import defaultLogoDark from '../assets/default-dark.png';
import emptyStateImg from '../assets/empty-state.png';
import { NotificationCenter } from "../components/notifications/NotificationCenter";
import { TemplatesView } from "../components/dashboard/TemplatesView";
import { SettingsView } from "../components/dashboard/SettingsView";
import { AIArchitectModal } from "../components/onboarding/AIArchitectModal";
import type { Template } from "../lib/templates";

export function DashboardPage() {
  const { user, logout, credits, sendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const { confirm, alert } = useDialog();
  const [resumes, setResumes] = useState<ResumeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"resumes" | "templates" | "settings">("resumes");
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
      alert("Verification Error", err.message || "Failed to resend verification email.");
    } finally {
      setIsSendingVerification(false);
    }
  };

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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab === "templates") {
      setActiveTab("templates");
    } else if (tab === "resumes") {
      setActiveTab("resumes");
    } else if (tab === "settings") {
      setActiveTab("settings");
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

  const handleUseTemplate = async (template: Template) => {
    setIsCreatingTemplate(true);
    try {
      const elements = template.generateElements();
      localStorage.setItem("designed_resume", JSON.stringify(elements));
      localStorage.removeItem("current_resume_id");
      navigate("/editor");
    } catch (err) {
      console.error("Failed to create from template:", err);
      alert({ title: "Error", description: "Failed to create from template." });
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  const handleCreateBlank = async () => {
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
    navigate("/build");
  };

  const handleEdit = (id: string) => {
    localStorage.setItem("current_resume_id", id);
    navigate("/editor");
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (await confirm({ title: "Delete Resume", description: "Are you sure you want to delete this resume? This cannot be undone.", danger: true })) {
      try {
        await resumeService.deleteResume(id);
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
            <img src={defaultLogoLight} alt="Resumagic" className="h-8 logo-light" />
            <img src={defaultLogoDark} alt="Resumagic" className="h-8 logo-dark" />
          </Link>
          <button
            onClick={handleCreateNew}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-primary hover:bg-brand-secondary text-white rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-brand-primary/25"
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
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-app-text truncate">{user?.email}</span>
              <span className="text-[10px] text-app-text-muted uppercase tracking-wider">{credits} Credits</span>
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
                <img src={defaultLogoLight} alt="Resumagic" className="h-8 logo-light" />
                <img src={defaultLogoDark} alt="Resumagic" className="h-8 logo-dark" />
                <button 
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-2 text-app-text-muted hover:text-app-text bg-app-bg rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                <button
                  onClick={() => { setIsMobileSidebarOpen(false); handleCreateNew(); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-primary text-white rounded-xl font-semibold"
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
                Your email (<strong>{user.email}</strong>) is not verified yet. Please check your inbox for the Firebase verification link.
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
                {isSendingVerification ? "Sending..." : "Resend Verification Email"}
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
            <h1 className="text-lg font-bold text-app-text hidden sm:block">Workspace</h1>
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
              <span className="text-xs font-bold uppercase tracking-wider">{credits}</span>
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
          <TemplatesView onUseTemplate={handleUseTemplate} isCreating={isCreatingTemplate} />
        ) : (
          <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8 pb-20">
            
            {/* Welcome Banner */}
            <div className="relative overflow-hidden bg-app-surface border border-app-border rounded-3xl p-8 sm:p-10">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                  <h2 className="text-3xl font-black text-app-text mb-2 tracking-tight">
                    Welcome back, {user?.email?.split('@')[0] || "Creator"}! 👋
                  </h2>
                  <p className="text-app-text-secondary text-lg max-w-xl">
                    Ready to land your dream job? Let's build something amazing today.
                  </p>
                </div>
                
                {/* Stats Row */}
                <div className="flex gap-4 sm:gap-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-app-text-muted uppercase tracking-widest">Total Docs</span>
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-brand-primary" />
                      <span className="text-2xl font-black text-app-text">{resumes.length}</span>
                    </div>
                  </div>
                  
                  <div className="w-px bg-app-border hidden sm:block"></div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-app-text-muted uppercase tracking-widest">AI Credits</span>
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-brand-accent" />
                      <span className="text-2xl font-black text-app-text">{credits}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Hub */}
            <div>
              <h3 className="text-sm font-bold text-app-text-muted uppercase tracking-widest mb-4 px-2">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <button 
                  onClick={handleCreateBlank}
                  className="group relative overflow-hidden bg-app-surface border border-app-border hover:border-brand-primary/50 rounded-2xl p-6 text-left transition-all hover:shadow-lg hover:shadow-brand-primary/10 hover:-translate-y-1"
                >
                  <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FilePlus className="w-6 h-6 text-brand-primary" />
                  </div>
                  <h4 className="font-bold text-app-text text-lg mb-1">Start from Scratch</h4>
                  <p className="text-sm text-app-text-muted">Jump straight into the blank editor.</p>
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                    <ArrowRight className="w-5 h-5 text-brand-primary" />
                  </div>
                </button>

                <button 
                  onClick={() => setShowAIArchitectModal(true)}
                  className="group relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-left transition-all hover:shadow-xl hover:shadow-indigo-500/20 hover:-translate-y-1 border border-white/10"
                >
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform backdrop-blur-sm">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-bold text-white text-lg mb-1 flex items-center gap-2">
                    AI Architect
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 bg-white/20 text-white rounded">New</span>
                  </h4>
                  <p className="text-sm text-white/80">Plan, refine & build bespoke graphics resume.</p>
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                    <ArrowRight className="w-5 h-5 text-white" />
                  </div>
                </button>

                <button 
                  onClick={() => navigate("/wizard")}
                  className="group relative overflow-hidden bg-gradient-to-br from-brand-primary to-brand-accent rounded-2xl p-6 text-left transition-all hover:shadow-xl hover:shadow-brand-primary/20 hover:-translate-y-1 border border-white/10"
                >
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform backdrop-blur-sm">
                    <Wand2 className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-bold text-white text-lg mb-1">Use AI Wizard</h4>
                  <p className="text-sm text-white/80">Answer a few questions and let AI build it.</p>
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                    <ArrowRight className="w-5 h-5 text-white" />
                  </div>
                </button>

                <button 
                  onClick={() => navigate("/onboarding")}
                  className="group relative overflow-hidden bg-app-surface border border-app-border hover:border-[#0A66C2]/30 rounded-2xl p-6 text-left transition-all hover:shadow-lg hover:shadow-[#0A66C2]/10 hover:-translate-y-1"
                >
                  <div className="w-12 h-12 bg-[#0A66C2]/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <DownloadCloud className="w-6 h-6 text-[#0A66C2]" />
                  </div>
                  <h4 className="font-bold text-app-text text-lg mb-1">Import Resume / Profile</h4>
                  <p className="text-sm text-app-text-muted">AI distills your PDF/LinkedIn data into a new resume.</p>
                  <div className="absolute top-4 right-4 bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                    AI Enabled
                  </div>
                </button>

              </div>
            </div>

            {/* Recent Documents */}
            <div>
              <div className="flex items-center justify-between mb-6 px-2">
                <h3 className="text-sm font-bold text-app-text-muted uppercase tracking-widest">Recent Documents</h3>
                
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
                    <div key={i} className="bg-app-surface rounded-2xl h-64 p-6 flex flex-col relative overflow-hidden border border-app-border">
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_1.5s_infinite]"></div>
                      <div className="flex-1 bg-app-bg rounded-lg animate-pulse mb-4" />
                      <div className="h-4 bg-app-border rounded w-3/4 animate-pulse mb-2" />
                      <div className="h-3 bg-app-border rounded w-1/2 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : filteredResumes.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-app-surface rounded-3xl p-12 text-center border-dashed border-2 border-app-border flex flex-col items-center justify-center min-h-[400px]"
                >
                  <img src={emptyStateImg} alt="No Documents" className="w-64 h-64 object-contain mb-8 hover:scale-105 transition-transform duration-500" />
                  <h3 className="text-2xl font-black text-app-text mb-2 tracking-tight">
                    {searchQuery ? "No matches found" : "Your workspace is empty"}
                  </h3>
                  <p className="text-app-text-secondary mb-8 max-w-md mx-auto">
                    {searchQuery 
                      ? "Try adjusting your search term."
                      : "Create your first professional resume in minutes using our AI tools or blank canvas."}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={handleCreateBlank}
                      className="px-8 py-4 bg-brand-primary hover:bg-brand-secondary text-white rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-brand-primary/20 flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Create New Document
                    </button>
                  )}
                </motion.div>
              ) : (
                <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  <AnimatePresence>
                    {filteredResumes.map((resume) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        key={resume.id}
                        onClick={() => handleEdit(resume.id!)}
                        className="group bg-app-surface rounded-2xl overflow-hidden cursor-pointer hover:shadow-2xl hover:shadow-brand-primary/10 transition-all duration-300 border border-app-border hover:-translate-y-1 flex flex-col h-[280px]"
                      >
                        <div className="flex-1 bg-app-bg p-4 relative overflow-hidden flex items-center justify-center">
                          <div className="w-full h-full bg-white rounded-lg shadow-sm border border-slate-200 p-2 flex flex-col gap-2 relative">
                             {/* Mini skeleton UI to represent the document */}
                             <div className="w-1/3 h-2 bg-slate-200 rounded"></div>
                             <div className="w-1/2 h-2 bg-slate-200 rounded"></div>
                             <div className="w-full h-px bg-slate-100 my-2"></div>
                             <div className="w-full h-2 bg-slate-100 rounded"></div>
                             <div className="w-full h-2 bg-slate-100 rounded"></div>
                             <div className="w-3/4 h-2 bg-slate-100 rounded"></div>
                             
                             {/* Hover Overlay */}
                             <div className="absolute inset-0 bg-brand-primary/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                               <div className="flex items-center gap-2 text-white font-bold bg-white/20 px-4 py-2 rounded-lg backdrop-blur-md">
                                 <ExternalLink className="w-4 h-4" />
                                 Open Editor
                               </div>
                             </div>
                          </div>
                        </div>
                        <div className="p-4 border-t border-app-border flex items-start justify-between bg-app-surface">
                          <div>
                            <h3 className="font-bold text-app-text mb-1 truncate group-hover:text-brand-primary transition-colors">
                              {resume.title}
                            </h3>
                            <div className="flex items-center text-xs text-app-text-muted gap-1">
                              <Clock className="w-3 h-3" />
                              Last edited {new Date(resume.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDelete(e, resume.id!)}
                            className="p-2 text-app-text-muted hover:text-brand-danger hover:bg-brand-danger/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete resume"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
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
  </div>
  );
}
