import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../theme-provider";
import { Link } from "react-router-dom";
import { 
  User, 
  Palette, 
  CreditCard, 
  ShieldAlert, 
  Moon, 
  Sun, 
  Monitor,
  CheckCircle2,
  Trash2,
  LogOut,
  AlertTriangle
} from "lucide-react";

export function SettingsView() {
  const { user, credits, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"profile" | "appearance" | "billing">("profile");

  const handleDeleteAccount = () => {
    if (confirm("Are you absolutely sure you want to delete your account? This action cannot be undone and will erase all your resumes.")) {
      // In a real app, call deleteAccount()
      alert("Account deletion requested. Please contact support to complete this process.");
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-8 border-b border-app-border shrink-0 bg-app-surface/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-app-text mb-1 tracking-tight">Settings</h2>
          <p className="text-sm text-app-text-muted">Manage your account preferences and billing.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-4 sm:p-8 flex flex-col md:flex-row gap-8">
          
          {/* Vertical Navigation */}
          <nav className="w-full md:w-64 shrink-0 space-y-1">
            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
                activeTab === "profile" 
                  ? "bg-brand-primary/10 text-brand-primary font-bold shadow-sm" 
                  : "text-app-text-muted hover:text-app-text hover:bg-app-surface"
              }`}
            >
              <User className="w-4 h-4" />
              Profile & Account
            </button>
            <button
              onClick={() => setActiveTab("appearance")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
                activeTab === "appearance" 
                  ? "bg-brand-primary/10 text-brand-primary font-bold shadow-sm" 
                  : "text-app-text-muted hover:text-app-text hover:bg-app-surface"
              }`}
            >
              <Palette className="w-4 h-4" />
              Appearance
            </button>
            <button
              onClick={() => setActiveTab("billing")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
                activeTab === "billing" 
                  ? "bg-brand-primary/10 text-brand-primary font-bold shadow-sm" 
                  : "text-app-text-muted hover:text-app-text hover:bg-app-surface"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Billing & Subscription
            </button>
          </nav>

          {/* Main Content Area */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {/* PROFILE TAB */}
              {activeTab === "profile" && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  <section>
                    <h3 className="text-lg font-bold text-app-text mb-4">Personal Information</h3>
                    <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-sm flex items-center gap-6">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center text-white font-bold text-3xl shadow-inner shrink-0">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-app-text-muted uppercase tracking-widest mb-1">
                          Email Address
                        </label>
                        <div className="text-app-text font-medium text-lg">{user?.email || "guest@resumagic.app"}</div>
                        <p className="text-xs text-app-text-muted mt-2">Your email is managed securely via Firebase Auth.</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-brand-danger mb-4 flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5" />
                      Danger Zone
                    </h3>
                    <div className="bg-brand-danger/5 border border-brand-danger/20 rounded-2xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-app-text">Sign Out</h4>
                          <p className="text-sm text-app-text-muted">Sign out of your account on this device.</p>
                        </div>
                        <button 
                          onClick={logout}
                          className="px-4 py-2 bg-app-surface hover:bg-app-bg border border-app-border rounded-lg text-app-text font-semibold text-sm transition-colors flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                      
                      <div className="w-full h-px bg-brand-danger/10"></div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-app-text">Delete Account</h4>
                          <p className="text-sm text-app-text-muted">Permanently delete your account and all resumes.</p>
                        </div>
                        <button 
                          onClick={handleDeleteAccount}
                          className="px-4 py-2 bg-brand-danger hover:bg-brand-danger/90 text-white rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </section>
                </motion.div>
              )}

              {/* APPEARANCE TAB */}
              {activeTab === "appearance" && (
                <motion.div
                  key="appearance"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  <section>
                    <h3 className="text-lg font-bold text-app-text mb-4">Theme Preferences</h3>
                    <p className="text-sm text-app-text-muted mb-6">Select how Resumagic looks on your device.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      
                      {/* Light Theme Option */}
                      <button 
                        onClick={() => setTheme("light")}
                        className={`group relative flex flex-col items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                          theme === "light" ? "border-brand-primary bg-brand-primary/5" : "border-app-border bg-app-surface hover:border-brand-primary/30"
                        }`}
                      >
                        <div className="w-full aspect-[4/3] rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shadow-sm flex flex-col group-hover:scale-[1.02] transition-transform">
                          <div className="h-4 bg-white border-b border-slate-200 flex items-center px-2 gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                          </div>
                          <div className="flex-1 p-2 flex gap-2">
                            <div className="w-1/4 h-full bg-slate-200 rounded-sm"></div>
                            <div className="w-3/4 h-full bg-white rounded-sm border border-slate-100"></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                          <Sun className="w-4 h-4" />
                          Light Mode
                        </div>
                        {theme === "light" && (
                          <div className="absolute top-3 right-3 text-brand-primary">
                            <CheckCircle2 className="w-5 h-5" fill="currentColor" className="text-white" />
                            <CheckCircle2 className="w-5 h-5 absolute inset-0" />
                          </div>
                        )}
                      </button>

                      {/* Dark Theme Option */}
                      <button 
                        onClick={() => setTheme("dark")}
                        className={`group relative flex flex-col items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                          theme === "dark" ? "border-brand-primary bg-brand-primary/5" : "border-app-border bg-app-surface hover:border-brand-primary/30"
                        }`}
                      >
                        <div className="w-full aspect-[4/3] rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-sm flex flex-col group-hover:scale-[1.02] transition-transform">
                          <div className="h-4 bg-slate-900 border-b border-slate-800 flex items-center px-2 gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                          </div>
                          <div className="flex-1 p-2 flex gap-2">
                            <div className="w-1/4 h-full bg-slate-800 rounded-sm"></div>
                            <div className="w-3/4 h-full bg-slate-900 rounded-sm border border-slate-800"></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 font-bold text-white">
                          <Moon className="w-4 h-4" />
                          Dark Mode
                        </div>
                        {theme === "dark" && (
                          <div className="absolute top-3 right-3 text-brand-primary">
                            <CheckCircle2 className="w-5 h-5 absolute inset-0 text-brand-primary" />
                          </div>
                        )}
                      </button>

                      {/* System Theme Option */}
                      <button 
                        onClick={() => setTheme("system")}
                        className={`group relative flex flex-col items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                          theme === "system" ? "border-brand-primary bg-brand-primary/5" : "border-app-border bg-app-surface hover:border-brand-primary/30"
                        }`}
                      >
                        <div className="w-full aspect-[4/3] rounded-xl bg-gradient-to-br from-slate-50 to-slate-950 border border-app-border overflow-hidden shadow-sm flex flex-col group-hover:scale-[1.02] transition-transform">
                          <div className="h-4 bg-app-surface border-b border-app-border flex items-center px-2 gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                          </div>
                          <div className="flex-1 flex items-center justify-center">
                            <Monitor className="w-8 h-8 text-slate-400" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 font-bold text-app-text">
                          <Monitor className="w-4 h-4" />
                          System
                        </div>
                        {theme === "system" && (
                          <div className="absolute top-3 right-3 text-brand-primary">
                            <CheckCircle2 className="w-5 h-5 absolute inset-0 text-brand-primary" />
                          </div>
                        )}
                      </button>

                    </div>
                  </section>
                </motion.div>
              )}

              {/* BILLING TAB */}
              {activeTab === "billing" && (
                <motion.div
                  key="billing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  <section>
                    <h3 className="text-lg font-bold text-app-text mb-4">Current Plan</h3>
                    
                    <div className="bg-app-surface border border-brand-primary/20 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-2xl font-black text-app-text">Free Tier</h4>
                            <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-widest rounded-full">Active</span>
                          </div>
                          <p className="text-sm text-app-text-muted max-w-sm">
                            You are currently on the Free plan, which includes essential resume building tools and limited AI generations.
                          </p>
                        </div>
                        
                        <Link 
                          to="/pricing"
                          className="shrink-0 px-6 py-3 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-xl shadow-lg shadow-brand-primary/20 transition-all hover:-translate-y-0.5"
                        >
                          Upgrade to Pro
                        </Link>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-app-text mb-4">AI Credits</h3>
                    <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-brand-primary" />
                          <h4 className="font-bold text-app-text">Available Credits</h4>
                        </div>
                        <span className="text-2xl font-black text-brand-primary">{credits}</span>
                      </div>
                      
                      <div className="w-full h-3 bg-app-bg rounded-full overflow-hidden border border-app-border mb-4">
                        <div 
                          className="h-full bg-gradient-to-r from-brand-primary to-brand-accent rounded-full transition-all duration-1000"
                          style={{ width: `${Math.min((credits / 100) * 100, 100)}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex items-start gap-2 text-sm text-app-text-muted bg-brand-primary/5 p-4 rounded-xl border border-brand-primary/10">
                        <AlertTriangle className="w-5 h-5 text-brand-primary shrink-0" />
                        <p>Credits are used when generating AI content (like summaries and bullet points). Pro users receive unlimited credits!</p>
                      </div>
                    </div>
                  </section>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}
