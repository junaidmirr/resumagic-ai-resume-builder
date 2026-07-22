import { useState } from "react";
import { Navbar } from "../components/landing/Navbar";
import { Footer } from "../components/landing/Footer";
import { MessageSquare, Target, Zap, CheckCircle2, ChevronRight, HelpCircle, Award, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

interface QuestionCard {
  question: string;
  category: "Behavioral" | "System Design" | "Leadership" | "Salary Negotiation";
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
    question: "Tell me about a time you led a complex technical migration under a tight deadline.",
    category: "System Design",
    difficulty: "Hard",
    starBreakdown: {
      situation: "Our legacy monolith database was experiencing 3000ms p99 latency during peak traffic.",
      task: "I was tasked with migrating high-frequency user state queries to Redis microservices within 4 weeks.",
      action: "Designed a shadow-write caching pipeline, authored fallback circuit breakers in Python, and led load-testing sprints.",
      result: "Reduced p99 response times by 84% (down to 48ms) and eliminated database downtime with zero data loss."
    }
  },
  {
    question: "Describe a situation where you had conflicting priorities with a Product Manager.",
    category: "Behavioral",
    difficulty: "Medium",
    starBreakdown: {
      situation: "Product requested 5 new features before Q3 launch, but engineering debt posed high outage risks.",
      task: "Align product scope with technical reliability without delaying the key product milestone.",
      action: "Created a data-driven ROI Matrix ranking features by user value vs engineering cost, facilitating a joint tradeoff workshop.",
      result: "Delivered top 3 revenue-impacting features on schedule while allocating 25% bandwidth to resolve core technical debt."
    }
  },
  {
    question: "How do you handle underperforming team members on high-stakes projects?",
    category: "Leadership",
    difficulty: "Expert",
    starBreakdown: {
      situation: "A senior developer was missing sprint deliverables on a key client deployment.",
      task: "Identify root cause, provide constructive feedback, and return sprint velocity to 100%.",
      action: "Initiated private 1-on-1 coaching, discovered setup friction in legacy test environments, pair-programmed to resolve bottlenecks, and set weekly micro-goals.",
      result: "Developer surpassed sprint velocity targets within 3 weeks and authored the team's new automated onboarding playbook."
    }
  },
  {
    question: "What are your salary expectations for this Senior Architect role?",
    category: "Salary Negotiation",
    difficulty: "Hard",
    starBreakdown: {
      situation: "Recruiter requests exact base salary expectations during the initial phone screen.",
      task: "Maintain leverage while signaling interest and anchoring market value.",
      action: "Politely reframe around total compensation: 'I am looking for a competitive package aligned with top-tier market rates for senior architects delivering scale.'",
      result: "Secured top-of-band base offer with an additional $35,000 performance equity grant."
    }
  }
];

export function InterviewGuidePage() {
  const [activeTab, setActiveTab] = useState<string>("All");

  const categories = ["All", "Behavioral", "System Design", "Leadership", "Salary Negotiation"];

  const filteredQuestions = activeTab === "All"
    ? QUESTIONS
    : QUESTIONS.filter(q => q.category === activeTab);

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-brand-primary/10 via-app-bg to-app-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 text-brand-primary text-sm font-semibold mb-6">
            <Target className="w-4 h-4" />
            Ultimate Tech & Executive Interview Playbook
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 bg-gradient-to-r from-slate-900 via-brand-primary to-brand-accent dark:from-white dark:via-brand-primary dark:to-teal-400 bg-clip-text text-transparent">
            Ace Every Interview with STAR Framework Precision
          </h1>
          <p className="text-lg md:text-xl text-app-text-secondary max-w-3xl mx-auto leading-relaxed">
            Turn resume bullets into compelling interview answers. Master behavioral questions, system design breakdowns, and high-leverage compensation negotiations.
          </p>
        </div>
      </section>

      {/* STAR Framework Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass-card rounded-3xl p-8 border border-brand-primary/20 bg-gradient-to-r from-brand-primary/5 via-app-surface to-brand-accent/5">
          <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
            <Zap className="w-6 h-6 text-brand-primary" />
            The STAR Method Blueprint
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-app-surface border border-app-border">
              <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary font-bold flex items-center justify-center mb-3">S</div>
              <h3 className="font-bold mb-1 text-sm">Situation</h3>
              <p className="text-xs text-app-text-secondary">Set the scene and provide necessary background context.</p>
            </div>
            <div className="p-5 rounded-2xl bg-app-surface border border-app-border">
              <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary font-bold flex items-center justify-center mb-3">T</div>
              <h3 className="font-bold mb-1 text-sm">Task</h3>
              <p className="text-xs text-app-text-secondary">Describe your specific responsibility and core challenge.</p>
            </div>
            <div className="p-5 rounded-2xl bg-app-surface border border-app-border">
              <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary font-bold flex items-center justify-center mb-3">A</div>
              <h3 className="font-bold mb-1 text-sm">Action</h3>
              <p className="text-xs text-app-text-secondary">Detail the step-by-step initiative and technical decisions you executed.</p>
            </div>
            <div className="p-5 rounded-2xl bg-app-surface border border-app-border">
              <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary font-bold flex items-center justify-center mb-3">R</div>
              <h3 className="font-bold mb-1 text-sm">Result</h3>
              <p className="text-xs text-app-text-secondary">Share quantifiable outcomes, metrics (%), and lessons learned.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
        {/* Category Tabs */}
        <div className="flex items-center gap-3 mb-10 overflow-x-auto pb-4 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === cat
                  ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/25 scale-105"
                  : "bg-app-surface text-app-text-secondary border border-app-border hover:bg-brand-primary/10 hover:text-brand-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Questions Cards */}
        <div className="space-y-8">
          {filteredQuestions.map((q, idx) => (
            <div
              key={idx}
              className="bg-app-surface rounded-3xl p-8 border border-app-border hover:border-brand-primary/40 transition-all shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-primary/10 text-brand-primary">
                    {q.category}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-app-bg text-app-text-muted border border-app-border">
                    {q.difficulty}
                  </span>
                </div>
                <span className="text-xs font-bold text-app-text-muted">STAR Breakdown</span>
              </div>

              <h3 className="text-xl font-bold mb-6 flex items-start gap-3">
                <HelpCircle className="w-6 h-6 text-brand-primary shrink-0 mt-0.5" />
                {q.question}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-app-border">
                <div className="p-4 rounded-xl bg-app-bg/60 border border-app-border">
                  <span className="text-xs font-bold text-brand-primary block mb-1">Situation & Task</span>
                  <p className="text-xs text-app-text-secondary leading-relaxed mb-2">{q.starBreakdown.situation}</p>
                  <p className="text-xs text-app-text-secondary leading-relaxed">{q.starBreakdown.task}</p>
                </div>
                <div className="p-4 rounded-xl bg-app-bg/60 border border-app-border">
                  <span className="text-xs font-bold text-brand-accent block mb-1">Action & Quantified Result</span>
                  <p className="text-xs text-app-text-secondary leading-relaxed mb-2">{q.starBreakdown.action}</p>
                  <p className="text-xs text-app-text font-bold text-teal-600 dark:text-teal-400 leading-relaxed flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    {q.starBreakdown.result}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Banner */}
        <section className="mt-16 text-center glass-card rounded-3xl p-10 border border-brand-primary/20 bg-gradient-to-r from-brand-primary/10 via-app-surface to-brand-accent/10">
          <Sparkles className="w-10 h-10 text-brand-primary mx-auto mb-4" />
          <h2 className="text-3xl font-black mb-4">Want AI to Craft Your STAR Story Arguments?</h2>
          <p className="text-sm text-app-text-secondary max-w-xl mx-auto mb-8">
            Our AI Assistant analyzes your work experience and formats bullet points directly into STAR-compliant achievements.
          </p>
          <Link
            to="/build"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold bg-brand-primary text-white hover:bg-brand-primary-hover transition-colors shadow-lg shadow-brand-primary/25"
          >
            Generate STAR Resume Now <ChevronRight className="w-5 h-5" />
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default InterviewGuidePage;
