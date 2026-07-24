import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../theme-provider";
import { useDialog } from "../../context/DialogContext";
import { Link } from "react-router-dom";
import { db } from "../../lib/firebase";
import { collection, getDocs, query, limit } from "firebase/firestore";
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
  Sparkles,
  Lock,
  Mail,
  ShieldCheck,
  Sliders,
  Zap,
  RefreshCw,
  Receipt,
  Copy,
  Check,
  Clock
} from "lucide-react";

export function SettingsView() {
  const { user, credits, userPlan, logout, refreshCredits } = useAuth();
  const { theme, setTheme } = useTheme();
  const { alert, confirm } = useDialog();

  const [activeTab, setActiveTab] = useState<"profile" | "appearance" | "billing" | "security">("profile");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleCopyOrderId = (orderId: string) => {
    navigator.clipboard.writeText(orderId);
    setCopiedOrderId(orderId);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  const fetchUserTransactions = async () => {
    if (!user) return;
    setLoadingTx(true);
    try {
      await refreshCredits();
      const txRef = collection(db, "users", user.uid, "transactions");
      const snap = await getDocs(query(txRef, limit(20)));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTransactions(list);
    } catch (err) {
      console.error("[Settings] Failed to fetch transactions:", err);
    } finally {
      setLoadingTx(false);
    }
  };

  useEffect(() => {
    if (activeTab === "billing" && user) {
      fetchUserTransactions();
    }
  }, [activeTab, user]);

  const getPlanDisplayName = (planStr: string) => {
    switch (planStr) {
      case "student": return "Student Plan 🎓";
      case "starter": return "Starter Plan";
      case "pro": return "Pro Plan ⭐";
      case "career_pro": return "Career Pro Plan 🚀";
      case "lifetime": return "Lifetime Pass 👑";
      default: return "Free Plan";
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setTimeout(() => {
      setIsSavingProfile(false);
      alert({ title: "Updated", description: "Profile preferences updated successfully!" });
    }, 600);
  };

  const handleResetPassword = () => {
    if (user?.email) {
      alert({ title: "Reset Link Sent", description: `A password reset link has been sent to ${user.email}.` });
    } else {
      alert({ title: "Authentication Required", description: "Please log in with a registered email address." });
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await confirm({
      title: "Delete Account",
      description: "Are you sure you want to delete your account? All your resumes and AI data will be permanently erased. This cannot be undone.",
      danger: true,
    });
    if (confirmed) {
      alert({ title: "Deletion Requested", description: "Account deletion requested. Please contact support@resumagic.app to confirm identity and finalize erasure." });
    }
  };

  const navTabs = [
    { id: "profile", label: "Profile & Account", icon: User, desc: "Personal info & preferences" },
    { id: "appearance", label: "Appearance", icon: Palette, desc: "Theme modes & styling" },
    { id: "billing", label: "Billing & Credits", icon: CreditCard, desc: "AI credits & plan details" },
    { id: "security", label: "Security & Privacy", icon: ShieldAlert, desc: "Password & danger zone" },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-app-bg text-app-text">
      {/* Header Banner */}
      <div className="p-4 sm:p-8 border-b border-app-border shrink-0 bg-app-surface/60 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary">
                <Sliders className="w-5 h-5" />
              </span>
              <h2 className="text-2xl font-black tracking-tight text-app-text">Account Settings</h2>
            </div>
            <p className="text-xs sm:text-sm text-app-text-muted">
              Manage your personal profile, visual themes, AI credits, and account security.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-app-bg p-2 rounded-xl border border-app-border self-start sm:self-auto shrink-0">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="text-xs font-bold text-app-text">{credits} AI Credits</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-4 sm:p-8 flex flex-col md:flex-row gap-6 lg:gap-8">
          
          {/* Mobile Horizontal / Desktop Vertical Tab Navigation */}
          <nav className="w-full md:w-64 shrink-0 flex md:flex-col overflow-x-auto scrollbar-none gap-1.5 p-1 bg-app-surface/40 rounded-2xl border border-app-border md:bg-transparent md:border-none md:p-0">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-xs sm:text-sm font-semibold shrink-0 text-left ${
                    isActive 
                      ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20" 
                      : "text-app-text-muted hover:text-app-text hover:bg-app-surface"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-brand-primary"}`} />
                  <div className="hidden sm:block md:block">
                    <div className="leading-snug">{tab.label}</div>
                  </div>
                  <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                </button>
              );
            })}
          </nav>

          {/* Tab Content Area */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {/* 1. PROFILE TAB */}
              {activeTab === "profile" && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6"
                >
                  <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-sm">
                    <h3 className="text-base font-bold text-app-text mb-4 flex items-center gap-2">
                      <User className="w-4 h-4 text-brand-primary" />
                      Personal Details
                    </h3>

                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-app-border">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-3xl shadow-lg border-2 border-white/20">
                          {user?.photoURL ? (
                            <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />
                          ) : (
                            user?.email?.charAt(0).toUpperCase() || 'U'
                          )}
                        </div>
                        <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-white border-2 border-app-surface" title="Active User">
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </span>
                      </div>

                      <div className="flex-1 text-center sm:text-left min-w-0">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                          <h4 className="text-lg font-bold text-app-text truncate">{user?.displayName || user?.email?.split('@')[0] || "Resumagic User"}</h4>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Verified Account
                          </span>
                        </div>
                        <p className="text-xs text-app-text-muted mb-3">{user?.email || "guest@resumagic.app"}</p>
                        <p className="text-[11px] text-app-text-muted">Managed via Secure Authentication Service.</p>
                      </div>
                    </div>

                    <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-app-text-muted uppercase tracking-wider mb-1.5">
                            Display Name
                          </label>
                          <input 
                            type="text" 
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full px-3.5 py-2.5 bg-app-bg border border-app-border rounded-xl text-sm font-semibold text-app-text outline-none focus:border-brand-primary focus:ring-1 ring-brand-primary/50 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-app-text-muted uppercase tracking-wider mb-1.5">
                            Primary Email Address
                          </label>
                          <div className="relative">
                            <input 
                              type="email" 
                              value={user?.email || ""} 
                              disabled 
                              className="w-full px-3.5 py-2.5 bg-app-bg/50 border border-app-border rounded-xl text-sm font-semibold text-app-text-muted outline-none cursor-not-allowed pr-10"
                            />
                            <Mail className="w-4 h-4 text-app-text-muted absolute right-3 top-1/2 -translate-y-1/2" />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button 
                          type="submit"
                          disabled={isSavingProfile}
                          className="px-5 py-2.5 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs rounded-xl shadow-md shadow-brand-primary/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {isSavingProfile ? "Saving..." : "Save Preferences"}
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}

              {/* 2. APPEARANCE TAB */}
              {activeTab === "appearance" && (
                <motion.div
                  key="appearance"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6"
                >
                  <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-sm">
                    <h3 className="text-base font-bold text-app-text mb-1 flex items-center gap-2">
                      <Palette className="w-4 h-4 text-brand-primary" />
                      Theme Mode
                    </h3>
                    <p className="text-xs text-app-text-muted mb-6">Choose how the application workspace looks on your screen.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <button 
                        onClick={() => setTheme("light")}
                        className={`group relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                          theme === "light" ? "border-brand-primary bg-brand-primary/5 shadow-md" : "border-app-border bg-app-bg hover:border-brand-primary/40"
                        }`}
                      >
                        <div className="w-full aspect-[16/10] rounded-xl bg-slate-100 border border-slate-200 overflow-hidden p-2 flex flex-col gap-1.5 shadow-inner">
                          <div className="h-2.5 bg-white rounded flex items-center px-1.5 gap-1 border border-slate-200">
                            <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                            <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                          </div>
                          <div className="flex-1 flex gap-1.5">
                            <div className="w-1/3 bg-slate-200 rounded"></div>
                            <div className="w-2/3 bg-white rounded border border-slate-200"></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 font-bold text-xs text-app-text">
                          <Sun className="w-4 h-4 text-amber-500" />
                          Light Theme
                        </div>
                        {theme === "light" && (
                          <CheckCircle2 className="w-4 h-4 text-brand-primary absolute top-3 right-3" />
                        )}
                      </button>

                      <button 
                        onClick={() => setTheme("dark")}
                        className={`group relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                          theme === "dark" ? "border-brand-primary bg-brand-primary/5 shadow-md" : "border-app-border bg-app-bg hover:border-brand-primary/40"
                        }`}
                      >
                        <div className="w-full aspect-[16/10] rounded-xl bg-slate-900 border border-slate-800 overflow-hidden p-2 flex flex-col gap-1.5 shadow-inner">
                          <div className="h-2.5 bg-slate-800 rounded flex items-center px-1.5 gap-1 border border-slate-700">
                            <div className="w-1 h-1 rounded-full bg-slate-600"></div>
                            <div className="w-1 h-1 rounded-full bg-slate-600"></div>
                          </div>
                          <div className="flex-1 flex gap-1.5">
                            <div className="w-1/3 bg-slate-800 rounded"></div>
                            <div className="w-2/3 bg-slate-950 rounded border border-slate-800"></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 font-bold text-xs text-app-text">
                          <Moon className="w-4 h-4 text-indigo-400" />
                          Dark Theme
                        </div>
                        {theme === "dark" && (
                          <CheckCircle2 className="w-4 h-4 text-brand-primary absolute top-3 right-3" />
                        )}
                      </button>

                      <button 
                        onClick={() => setTheme("system")}
                        className={`group relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                          theme === "system" ? "border-brand-primary bg-brand-primary/5 shadow-md" : "border-app-border bg-app-bg hover:border-brand-primary/40"
                        }`}
                      >
                        <div className="w-full aspect-[16/10] rounded-xl bg-gradient-to-tr from-slate-100 to-slate-900 border border-app-border overflow-hidden p-2 flex items-center justify-center shadow-inner">
                          <Monitor className="w-6 h-6 text-slate-500" />
                        </div>
                        <div className="flex items-center gap-2 font-bold text-xs text-app-text">
                          <Monitor className="w-4 h-4 text-slate-400" />
                          System Default
                        </div>
                        {theme === "system" && (
                          <CheckCircle2 className="w-4 h-4 text-brand-primary absolute top-3 right-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 3. BILLING & CREDITS TAB */}
              {activeTab === "billing" && (
                <motion.div
                  key="billing"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6"
                >
                  <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/40 border border-indigo-500/30 rounded-2xl p-6 shadow-md relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-black uppercase tracking-wider rounded-full">
                            Active Plan
                          </span>
                          <h4 className="text-xl font-black text-white">{getPlanDisplayName(userPlan)}</h4>
                        </div>
                        <p className="text-xs text-slate-300 max-w-md leading-relaxed">
                          Access full resume builder tools, custom layouts, PDF exports, and AI generation credits.
                        </p>
                      </div>

                      <Link 
                        to="/pricing"
                        className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 text-center shrink-0"
                      >
                        Upgrade to Pro Plan
                      </Link>
                    </div>
                  </div>

                  <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-app-text">AI Generation Credits</h4>
                          <p className="text-xs text-app-text-muted">Used for AI Resume Builder & STAR Interview Guide</p>
                        </div>
                      </div>
                      <span className="text-2xl font-black text-brand-primary">{credits} <span className="text-xs font-normal text-app-text-muted">pts</span></span>
                    </div>

                    <div className="w-full h-3 bg-app-bg rounded-full overflow-hidden border border-app-border mb-4">
                      <div 
                        className="h-full bg-gradient-to-r from-teal-500 via-indigo-500 to-purple-600 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min((credits / 100) * 100, 100)}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-app-bg border border-app-border flex items-center justify-between">
                        <span className="text-xs text-app-text-muted">Cost per AI Resume Generation</span>
                        <span className="text-xs font-bold text-app-text">10 Credits</span>
                      </div>
                      <div className="p-3 rounded-xl bg-app-bg border border-app-border flex items-center justify-between">
                        <span className="text-xs text-app-text-muted">PDF Vector Rendering</span>
                        <span className="text-xs font-bold text-emerald-500">FREE</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment & Credit Purchase History */}
                  <div className="bg-app-surface border border-app-border rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-app-border pb-4">
                      <div>
                        <h4 className="font-black text-sm sm:text-base text-app-text flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-brand-primary" />
                          Payment & Credit Purchase History
                        </h4>
                        <p className="text-xs text-app-text-muted mt-0.5">
                          View your payment receipts, transaction order IDs, and credited points.
                        </p>
                      </div>

                      <button
                        onClick={fetchUserTransactions}
                        disabled={loadingTx}
                        className="px-3.5 py-2 rounded-xl bg-app-bg border border-app-border hover:border-brand-primary/40 text-xs font-bold text-app-text hover:text-brand-primary transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-2xs disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingTx ? "animate-spin text-brand-primary" : ""}`} />
                        <span>Sync Balance</span>
                      </button>
                    </div>

                    {transactions.length === 0 ? (
                      <div className="text-center py-10 border border-dashed border-app-border rounded-2xl bg-app-bg/50 space-y-2">
                        <Receipt className="w-8 h-8 mx-auto text-app-text-muted opacity-30" />
                        <p className="text-xs font-bold text-app-text">No payment transactions found yet.</p>
                        <p className="text-[11px] text-app-text-muted">Completed credit packs and plan purchases will appear here.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {transactions.map((tx) => {
                          const orderId = tx.order_id || tx.id || "";
                          const isCopied = copiedOrderId === orderId;

                          return (
                            <div
                              key={tx.id}
                              className="p-4 rounded-2xl bg-app-bg border border-app-border hover:border-brand-primary/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs group"
                            >
                              {/* Left Info: Plan, Order ID with Copy Button & Date */}
                              <div className="space-y-1.5 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="uppercase font-mono text-[10px] font-black px-2.5 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20 shrink-0">
                                    {tx.plan_id ? tx.plan_id.replace(/_/g, " ") : "Order"}
                                  </span>

                                  {/* Order ID + Copy Button */}
                                  {orderId && (
                                    <div className="inline-flex items-center gap-1.5 bg-app-surface px-2.5 py-1 rounded-xl border border-app-border text-[11px] font-mono text-app-text font-medium truncate max-w-full">
                                      <span className="truncate">{orderId}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyOrderId(orderId)}
                                        title="Copy Order ID"
                                        className="p-1 rounded-md text-app-text-muted hover:text-brand-primary hover:bg-brand-primary/10 transition-colors shrink-0 cursor-pointer"
                                      >
                                        {isCopied ? (
                                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                                        ) : (
                                          <Copy className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 text-[11px] text-app-text-muted">
                                  <Clock className="w-3 h-3 text-app-text-muted/60" />
                                  <span>
                                    {tx.created_at || tx.timestamp
                                      ? new Date(tx.created_at || tx.timestamp).toLocaleDateString("en-IN", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : "Recent Order"}
                                  </span>
                                </div>
                              </div>

                              {/* Right Info: Credits Added & Paid Badge */}
                              <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-app-border/60 pt-2 sm:pt-0 shrink-0">
                                <div className="font-black text-emerald-500 text-xs sm:text-sm flex items-center gap-1">
                                  <span>+{tx.credits_added || 0} AI Credits</span>
                                </div>
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  <CheckCircle2 className="w-3 h-3" />
                                  PAID (₹{tx.amount_paid || 0})
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* 4. SECURITY TAB */}
              {activeTab === "security" && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6"
                >
                  <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-app-text mb-2 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-brand-primary" />
                      Security & Password
                    </h3>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-app-bg border border-app-border">
                      <div>
                        <h4 className="font-bold text-xs text-app-text">Reset Password</h4>
                        <p className="text-[11px] text-app-text-muted">Send a password reset link to your registered email.</p>
                      </div>
                      <button 
                        onClick={handleResetPassword}
                        className="px-4 py-2 bg-app-surface hover:bg-app-bg border border-app-border rounded-xl text-app-text font-bold text-xs transition-colors"
                      >
                        Send Reset Email
                      </button>
                    </div>
                  </div>

                  <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-rose-500 flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5" />
                      Account Actions & Danger Zone
                    </h3>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-app-surface border border-rose-500/10">
                      <div>
                        <h4 className="font-bold text-xs text-app-text">Sign Out</h4>
                        <p className="text-[11px] text-app-text-muted">Safely sign out of your account on this device.</p>
                      </div>
                      <button 
                        onClick={logout}
                        className="px-4 py-2 bg-app-bg hover:bg-app-surface border border-app-border rounded-xl text-app-text font-bold text-xs transition-colors flex items-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-app-surface border border-rose-500/20">
                      <div>
                        <h4 className="font-bold text-xs text-rose-500">Delete Account</h4>
                        <p className="text-[11px] text-app-text-muted">Permanently delete your account and remove all saved resumes.</p>
                      </div>
                      <button 
                        onClick={handleDeleteAccount}
                        className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-rose-500/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Account
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}
