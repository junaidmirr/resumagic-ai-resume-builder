import { useState } from "react";
import { Navbar } from "../components/landing/Navbar";
import { Footer } from "../components/landing/Footer";
import { HelpCircle, Search, FileText, Sparkles, Upload, Download, Settings, ChevronDown, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

interface FAQItem {
  id: string;
  category: "AI Architect 2.0" | "PDF Import" | "Canvas Editor" | "Account & Credits";
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: "faq-1",
    category: "AI Architect 2.0",
    question: "How does the AI Resume Architect work?",
    answer: "AI Architect analyzes your career details (work history, key projects, target position) and automatically structures your content into executive summaries, STAR-format bullet points, and customized visual sections."
  },
  {
    id: "faq-2",
    category: "PDF Import",
    question: "Can I upload my existing LinkedIn or PDF resume?",
    answer: "Yes! Simply navigate to Create Resume -> Import Document PDF. Our engine reads text from your uploaded document, normalizes section titles, and places candidate data into editable design elements."
  },
  {
    id: "faq-3",
    category: "Canvas Editor",
    question: "How do page breaks and multi-page resumes work?",
    answer: "The visual canvas supports multi-page resume layouts. Elements placed on Page 1 render on the first page, while elements placed on Page 2 render cleanly on the second page during export."
  },
  {
    id: "faq-4",
    category: "Account & Credits",
    question: "How are AI Credits deducted?",
    answer: "Every new user receives 50 free credits upon signup. Generating new AI plans and importing resumes cost 1 credit per action. Editing and downloading PDFs are 100% free with unlimited exports."
  },
  {
    id: "faq-5",
    category: "Canvas Editor",
    question: "Why does my downloaded PDF match the on-screen design exactly?",
    answer: "Resumagic uses high-resolution vector PDF rendering. Your on-screen layout, colors, and typography convert 1:1 into crisp vector PDF documents."
  }
];

export function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>("faq-1");

  const categories = ["All", "AI Architect 2.0", "PDF Import", "Canvas Editor", "Account & Credits"];

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCategory = activeCategory === "All" || faq.category === activeCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      {/* Hero Search Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-brand-primary/10 via-app-bg to-app-bg text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 text-brand-primary text-sm font-semibold mb-6">
            <HelpCircle className="w-4 h-4" />
            Resumagic Help Center & Knowledge Base
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 bg-gradient-to-r from-slate-900 via-brand-primary to-brand-accent dark:from-white dark:via-brand-primary dark:to-teal-400 bg-clip-text text-transparent">
            How Can We Help You Build Today?
          </h1>

          <div className="max-w-2xl mx-auto relative mt-8">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted" />
            <input
              type="text"
              placeholder="Search help topics (e.g., PDF export, AI credits, import)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-app-surface border border-app-border focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-app-text transition-all shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Quick Guides Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-app-surface border border-app-border hover:border-brand-primary/40 transition-colors">
            <Sparkles className="w-8 h-8 text-brand-primary mb-4" />
            <h3 className="font-bold text-lg mb-2">Getting Started with AI Architect</h3>
            <p className="text-xs text-app-text-secondary leading-relaxed">
              Learn how to type natural prompts and let AI build customized layout sections.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-app-surface border border-app-border hover:border-brand-primary/40 transition-colors">
            <Upload className="w-8 h-8 text-brand-accent mb-4" />
            <h3 className="font-bold text-lg mb-2">Importing PDF & LinkedIn Data</h3>
            <p className="text-xs text-app-text-secondary leading-relaxed">
              Step-by-step instructions on extracting existing PDF resumes into canvas elements.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-app-surface border border-app-border hover:border-brand-primary/40 transition-colors">
            <Download className="w-8 h-8 text-teal-500 mb-4" />
            <h3 className="font-bold text-lg mb-2">Exporting Vector PDFs</h3>
            <p className="text-xs text-app-text-secondary leading-relaxed">
              How high-resolution vector rendering guarantees maximum ATS compatibility.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <h2 className="text-2xl font-black mb-8 text-center">Frequently Asked Questions</h2>

        {/* Category Pills */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-6 mb-8 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? "bg-brand-primary text-white shadow-md"
                  : "bg-app-surface text-app-text-secondary border border-app-border hover:bg-brand-primary/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accordion */}
        <div className="space-y-4">
          {filteredFaqs.map((faq) => {
            const isExpanded = expandedId === faq.id;
            return (
              <div
                key={faq.id}
                className="bg-app-surface rounded-2xl border border-app-border overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                  className="w-full p-6 text-left font-bold text-base flex items-center justify-between gap-4"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-brand-primary" />
                    {faq.question}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-app-text-muted transition-transform ${isExpanded ? "rotate-180 text-brand-primary" : ""}`} />
                </button>
                {isExpanded && (
                  <div className="px-6 pb-6 pt-0 text-sm text-app-text-secondary leading-relaxed border-t border-app-border/50 mt-2 pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still Have Questions? */}
        <div className="mt-16 text-center glass-card rounded-3xl p-10 border border-app-border">
          <MessageSquare className="w-10 h-10 text-brand-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Still Need Help?</h3>
          <p className="text-xs text-app-text-secondary mb-6">Our support engineers respond within 24 hours.</p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-brand-primary text-white hover:bg-brand-primary-hover transition-colors text-sm shadow-md"
          >
            Contact Support Team
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default HelpCenterPage;
