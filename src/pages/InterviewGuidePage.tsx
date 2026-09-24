import { useState } from "react";
import { Navbar } from "../components/landing/Navbar";
import { Footer } from "../components/landing/Footer";
import {
  Target,
  Zap,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

interface QuestionCard {
  question: string;
  category:
    "Behavioral" | "System Design" | "Leadership" | "Salary Negotiation";
  difficulty: "Medium" | "Hard" | "Expert";
  starBreakdown: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
}

const QUESTIONS: QuestionCard[] = [
  {
    question:
      "Tell me about a time you led a complex technical migration under a tight deadline.",
    category: "System Design",
    difficulty: "Hard",
    starBreakdown: {
      situation:
        "Our legacy monolith database was experiencing 3000ms p99 latency during peak traffic.",
      task: "I was tasked with migrating high-frequency user state queries to Redis microservices within 4 weeks.",
      action:
        "Designed a shadow-write caching pipeline, authored fallback circuit breakers in Python, and led load-testing sprints.",
      result:
        "Reduced p99 response times by 84% (down to 48ms) and eliminated database downtime with zero data loss.",
    },
  },
  {
    question:
      "Describe a situation where you had conflicting priorities with a Product Manager.",
    category: "Behavioral",
    difficulty: "Medium",
    starBreakdown: {
      situation:
        "Product requested 5 new features before Q3 launch, but engineering debt posed high outage risks.",
      task: "Align product scope with technical reliability without delaying the key product milestone.",
      action:
        "Created a data-driven ROI Matrix ranking features by user value vs engineering cost, facilitating a joint tradeoff workshop.",
      result:
        "Delivered top 3 revenue-impacting features on schedule while allocating 25% bandwidth to resolve core technical debt.",
    },
  },
  {
    question:
      "How do you handle underperforming team members on high-stakes projects?",
    category: "Leadership",
    difficulty: "Expert",
    starBreakdown: {
      situation:
        "A senior developer was missing sprint deliverables on a key client deployment.",
      task: "Identify root cause, provide constructive feedback, and return sprint velocity to 100%.",
      action:
        "Initiated private 1-on-1 coaching, discovered setup friction in legacy test environments, pair-programmed to resolve bottlenecks, and set weekly micro-goals.",
      result:
        "Developer surpassed sprint velocity targets within 3 weeks and authored the team's new automated onboarding playbook.",
    },
  },
  {
    question:
      "What are your salary expectations for this Senior Architect role?",
    category: "Salary Negotiation",
    difficulty: "Hard",
    starBreakdown: {
      situation:
        "Recruiter requests exact base salary expectations during the initial phone screen.",
      task: "Maintain leverage while signaling interest and anchoring market value.",
      action:
        "Politely reframe around total compensation: 'I am looking for a competitive package aligned with top-tier market rates for senior architects delivering scale.'",
      result:
        "Secured top-of-band base offer with an additional $35,000 performance equity grant.",
    },
  },
];

export function InterviewGuidePage() {
  const [activeTab, setActiveTab] = useState<string>("All");

  const categories = [
    "All",
    "Behavioral",
    "System Design",
    "Leadership",
    "Salary Negotiation",
  ];

  const filteredQuestions =
    activeTab === "All"
      ? QUESTIONS
      : QUESTIONS.filter((q) => q.category === activeTab);

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col font-sans transition-colors duration-200 overflow-x-hidden w-full">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 sm:pt-32 pb-10 sm:pb-12 bg-app-surface border-b border-app-border px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-medium mb-4 border border-app-border">
            <Target className="w-3.5 h-3.5" />
            Interview Preparation Playbook
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-app-text mb-3">
            The STAR Framework Interview Guide
          </h1>
          <p className="text-sm sm:text-base text-app-text-secondary max-w-2xl mx-auto leading-relaxed">
            Turn your resume bullet points into structured, high-signal
            interview answers across behavioral, technical, and leadership
            discussions.
          </p>
        </div>
      </section>

      {/* STAR Framework Blueprint */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="rounded-lg p-6 border border-app-border bg-app-surface shadow-2xs">
          <h2 className="text-base font-bold text-app-text mb-4 flex items-center gap-2">
            <span>The STAR Method Breakdown</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-app-bg border border-app-border">
              <div className="w-7 h-7 rounded border border-app-border bg-app-surface text-slate-800 dark:text-slate-200 font-mono font-bold text-xs flex items-center justify-center mb-2">
                S
              </div>
              <h3 className="font-semibold mb-1 text-xs text-app-text">
                Situation
              </h3>
              <p className="text-xs text-app-text-secondary leading-relaxed">
                Set the scene and provide necessary background context.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-app-bg border border-app-border">
              <div className="w-7 h-7 rounded border border-app-border bg-app-surface text-slate-800 dark:text-slate-200 font-mono font-bold text-xs flex items-center justify-center mb-2">
                T
              </div>
              <h3 className="font-semibold mb-1 text-xs text-app-text">Task</h3>
              <p className="text-xs text-app-text-secondary leading-relaxed">
                Describe your specific responsibility and core challenge.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-app-bg border border-app-border">
              <div className="w-7 h-7 rounded border border-app-border bg-app-surface text-slate-800 dark:text-slate-200 font-mono font-bold text-xs flex items-center justify-center mb-2">
                A
              </div>
              <h3 className="font-semibold mb-1 text-xs text-app-text">
                Action
              </h3>
              <p className="text-xs text-app-text-secondary leading-relaxed">
                Detail the step-by-step initiative and technical decisions
                executed.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-app-bg border border-app-border">
              <div className="w-7 h-7 rounded border border-app-border bg-app-surface text-slate-800 dark:text-slate-200 font-mono font-bold text-xs flex items-center justify-center mb-2">
                R
              </div>
              <h3 className="font-semibold mb-1 text-xs text-app-text">
                Result
              </h3>
              <p className="text-xs text-app-text-secondary leading-relaxed">
                Share quantifiable outcomes, metrics (%), and business impact.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 flex-1 w-full">
        {/* Category Tabs */}
        <div className="w-full max-w-full overflow-x-auto pb-3 mb-6 scrollbar-none flex items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap border ${
                activeTab === cat
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white font-semibold"
                  : "bg-app-surface text-app-text-secondary border-app-border hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Questions Cards */}
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => (
            <div
              key={idx}
              className="bg-app-surface rounded-lg p-5 sm:p-6 border border-app-border shadow-2xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-app-border">
                    {q.category}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono text-slate-500 border border-app-border">
                    {q.difficulty}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  STAR Breakdown
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-app-text mb-4 leading-snug">
                {q.question}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-app-border">
                <div className="p-3.5 rounded bg-app-bg border border-app-border">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Situation & Task
                  </span>
                  <p className="text-xs text-app-text-secondary leading-relaxed mb-1.5">
                    {q.starBreakdown.situation}
                  </p>
                  <p className="text-xs text-app-text-secondary leading-relaxed">
                    {q.starBreakdown.task}
                  </p>
                </div>
                <div className="p-3.5 rounded bg-app-bg border border-app-border">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Action & Quantified Result
                  </span>
                  <p className="text-xs text-app-text-secondary leading-relaxed mb-1.5">
                    {q.starBreakdown.action}
                  </p>
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 leading-relaxed flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{q.starBreakdown.result}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Banner */}
        <section className="mt-10 text-center rounded-lg p-6 sm:p-8 border border-app-border bg-app-surface shadow-2xs">
          <h2 className="text-lg sm:text-xl font-bold text-app-text mb-2">
            Structure Your Experience with STAR
          </h2>
          <p className="text-xs text-app-text-secondary max-w-md mx-auto mb-5 leading-relaxed">
            The Resumagic editor checks every bullet point for strong action
            verbs and quantified metric outcomes.
          </p>
          <Link
            to="/build"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-2xs"
          >
            <span>Open Resume Builder</span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default InterviewGuidePage;
