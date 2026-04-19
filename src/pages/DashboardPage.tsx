import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { resumeService, type Resume } from "../lib/resumeService";
import {
  Plus,
  Clock,
  LogOut,
  Sparkles,
  Search,
  ExternalLink,
  Trash2,
  User as UserIcon,
  ShieldAlert,
  CreditCard,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

export function DashboardPage() {
  const { user, logout, credits } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchResumes() {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const data = await resumeService.getUserResumes(user.uid);
        setResumes(data);
      } catch (err: any) {
        console.error("[Dashboard] Fetch failed:", err);
        setError("Failed to sync resumes from cloud. Please try refreshing.");
      } finally {
        setLoading(false);
      }
    }
    fetchResumes();
  }, [user]);

  const handleCreateNew = async () => {
    navigate("/build");
  };

  const handleEdit = (id: string) => {
    localStorage.setItem("current_resume_id", id);
    navigate("/editor");
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (
      confirm(
        "Are you sure you want to delete this resume? This action cannot be undone.",
      )
    ) {
      await resumeService.deleteResume(id);
      setResumes(resumes.filter((r) => r.id !== id));
    }
  };

  const filteredResumes = resumes.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar / Left Margin for SaaS look if needed, but we'll go with a clean Header + Centered Grid */}

      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-teal-500 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white">
              AI Resume Builder
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/pricing"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/5 dark:to-orange-500/5 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-500/20 hover:border-amber-500/40 transition-all shadow-sm group"
            >
              <CreditCard
                size={14}
                className="group-hover:scale-110 transition-transform"
              />
              <span className="text-xs font-black tracking-tight uppercase">
                {credits} Credits
              </span>
            </Link>

            <div className="flex items-center gap-3 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <Link
                to="/profile"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-7 h-7 rounded-xl border border-white dark:border-slate-700 shadow-sm"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white uppercase shadow-sm">
                    {user?.email?.[0] || "?"}
                  </div>
                )}
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 mr-2 max-sm:hidden">
                  {user?.displayName?.split(" ")[0] ||
                    user?.email?.split("@")[0] ||
                    "User"}
                </span>
              </Link>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20"
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {!user?.emailVerified && (
          <div className="group mb-12 p-1 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 rounded-[2rem] border border-amber-500/10 animate-in slide-in-from-top-4 duration-700">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-[1.75rem] flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-amber-700 dark:text-amber-400">
                <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center shadow-inner">
                  <ShieldAlert size={24} className="animate-pulse" />
                </div>
                <div>
                  <p className="text-lg font-black tracking-tight">
                    Account Protection Required
                  </p>
                  <p className="text-sm font-medium opacity-70 leading-tight">
                    Verify your email to unlock multi-device syncing and
                    advanced AI features.
                  </p>
                </div>
              </div>
              <Link
                to="/profile"
                className="w-full sm:w-auto px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl hover:scale-105 transition-all shadow-xl active:scale-95 text-center"
              >
                VERIFY NOW
              </Link>
            </div>
          </div>
        )}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Welcome back,{" "}
              {user?.displayName?.split(" ")[0] ||
                user?.email?.split("@")[0] ||
                "User"}
              ! 👋
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Manage your professional profile and resume drafts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
              <input
                type="text"
                placeholder="Search resumes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 pl-10 pr-4 py-2.5 rounded-2xl text-sm outline-none focus:ring-2 ring-teal-500/20 focus:border-teal-500 transition-all w-full sm:w-64"
              />
            </div>
            <button
              onClick={handleCreateNew}
              className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-semibold shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={18} />
              Create New
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center shrink-0">
              <span className="text-lg">⚠️</span>
            </div>
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="ml-auto px-4 py-1.5 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            Array(4)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 animate-pulse h-64 flex flex-col justify-between"
                >
                  <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                  <div className="h-32 bg-slate-50 dark:bg-slate-800/50 rounded-2xl my-4" />
                  <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                </div>
              ))
          ) : (
            <>
              {filteredResumes.length === 0 && searchQuery === "" && (
                <div
                  onClick={handleCreateNew}
                  className="group bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-4 cursor-pointer hover:border-teal-500/50 hover:bg-teal-50/10 transition-all h-64"
                >
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-teal-500/10 group-hover:text-teal-500 transition-all">
                    <Plus size={32} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      New Resume
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[150px]">
                      Build your career with AI assistance
                    </p>
                  </div>
                </div>
              )}

              {filteredResumes.map((resume) => (
                <div
                  key={resume.id}
                  onClick={() => handleEdit(resume.id)}
                  className="group relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden cursor-pointer hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all hover:-translate-y-1"
                >
                  <div className="h-48 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center p-6 transition-colors group-hover:bg-teal-50/20">
                    <div className="w-full h-full bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 overflow-hidden mask-fade-bottom">
                      <div className="space-y-2 opacity-20">
                        <div className="h-2 w-1/2 bg-slate-400 dark:bg-slate-600 rounded" />
                        <div className="h-2 w-full bg-slate-300 dark:bg-slate-700 rounded" />
                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                        <div className="h-2 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                      </div>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 dark:text-white truncate">
                        {resume.title}
                      </h3>
                      <button
                        onClick={(e) => handleDelete(e, resume.id)}
                        className="p-1.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock size={12} />
                      <span>
                        {resume.updatedAt?.toDate().toLocaleDateString() ||
                          "Just now"}
                      </span>
                    </div>
                  </div>

                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-2 bg-teal-500 text-white rounded-xl shadow-lg">
                      <ExternalLink size={14} />
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
