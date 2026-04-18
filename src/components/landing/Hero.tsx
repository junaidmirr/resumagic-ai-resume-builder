import { ArrowRight, Sparkles, FileText, Wand2, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Hero() {
  const navigate = useNavigate();

  return (
    <div className="relative border-b border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300 pt-24 pb-32">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-500/10 dark:bg-teal-500/20 blur-3xl rounded-full mix-blend-multiply dark:mix-blend-screen opacity-70 animate-blob" />
        <div
          className="absolute top-48 -right-24 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/20 blur-3xl rounded-full mix-blend-multiply dark:mix-blend-screen opacity-70 animate-blob"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute -bottom-24 left-1/2 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/20 blur-3xl rounded-full mix-blend-multiply dark:mix-blend-screen opacity-70 animate-blob"
          style={{ animationDelay: "4s" }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
          <div className="md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left text-center">
            <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold text-teal-600 bg-teal-50 dark:bg-teal-500/10 dark:text-teal-400 mb-6 ring-1 ring-inset ring-teal-600/20 dark:ring-teal-400/20">
              <Sparkles className="mr-2 h-4 w-4" />
              AI-Powered Resume Builder
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl">
              <span className="block xl:inline">Land your dream job with</span>{" "}
              <span className="block text-transparent bg-clip-text bg-linear-to-r from-teal-600 to-cyan-500 dark:from-teal-400 dark:to-cyan-300 pb-2">
                ResuMagic.AI
              </span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 sm:max-w-xl mx-auto lg:mx-0">
              Create professional, ATS-optimized resumes in minutes. Let our AI
              write compelling bullet points, format flawlessly, and help you
              stand out to top employers.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button
                onClick={() => navigate("/login")}
                className="inline-flex items-center justify-center rounded-full border border-transparent bg-slate-900 px-8 py-3.5 text-base font-medium text-white shadow-sm hover:bg-slate-800 dark:bg-teal-500 dark:hover:bg-teal-600 transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 dark:focus:ring-teal-500 hover:scale-105 cursor-pointer"
              >
                Start Building Free
                <ArrowRight className="ml-2 -mr-1 h-5 w-5" />
              </button>
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-8 py-3.5 text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              >
                See Features
              </a>
            </div>
            <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
              No credit card required. Build your first resume free.
            </p>

            <div className="mt-8 flex items-center justify-center lg:justify-start gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
              <span>Powered by</span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-slate-700/50">
                <Sparkles className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                <span className="font-bold text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">
                  Gemini
                </span>
              </div>
            </div>
          </div>

          <div className="mt-20 lg:mt-0 lg:col-span-6 relative hidden md:block">
            {/* Beautiful abstract visual using lucide icons as art */}
            <div className="relative mx-auto w-full rounded-2xl shadow-2xl lg:max-w-md ring-1 ring-slate-200 dark:ring-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl aspect-square overflow-hidden flex items-center justify-center">
              {/* Grid Pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-size-[1rem_1rem] mask-[radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-50" />

              {/* Floating elements */}
              <div
                className="absolute top-1/4 left-1/4 animate-bounce"
                style={{ animationDuration: "3s" }}
              >
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 hover:scale-110 transition-transform cursor-pointer">
                  <FileText className="w-10 h-10 text-teal-500" />
                </div>
              </div>

              <div
                className="absolute bottom-1/3 right-1/4 animate-bounce"
                style={{ animationDuration: "4s", animationDelay: "1s" }}
              >
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 hover:scale-110 transition-transform cursor-pointer">
                  <Wand2 className="w-12 h-12 text-cyan-500" />
                </div>
              </div>

              <div
                className="absolute top-1/2 left-3/4 transform -translate-x-1/2 -translate-y-1/2 animate-bounce"
                style={{ animationDuration: "3.5s", animationDelay: "0.5s" }}
              >
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 hover:scale-110 transition-transform cursor-pointer">
                  <Briefcase className="w-8 h-8 text-emerald-500" />
                </div>
              </div>

              {/* Central Focus Circle */}
              <div className="w-48 h-48 rounded-full border border-teal-200 dark:border-teal-900/50 absolute flex items-center justify-center shadow-inner">
                <div className="w-32 h-32 rounded-full border border-cyan-200 dark:border-cyan-900/50 absolute z-0" />
                <div className="w-16 h-16 rounded-full bg-linear-to-tr from-teal-400 to-cyan-400 dark:from-teal-500 dark:to-cyan-500 flex items-center justify-center z-10 shadow-lg glow">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
