import { useState } from "react";
import { Navbar } from "../components/landing/Navbar";
import { Footer } from "../components/landing/Footer";
import { Search, BookOpen, Clock, ArrowRight, Sparkles, Tag, TrendingUp, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: "ATS Optimization" | "Resume Writing" | "AI & Tech" | "Career Strategy";
  readTime: string;
  date: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  featured?: boolean;
}

const ARTICLES: Article[] = [
  {
    id: "ats-secrets-2026",
    title: "10 ATS Secrets to Pass Scanner Systems in 2026",
    excerpt: "Discover how modern Applicant Tracking Systems parse resume coordinates, keyword density, and typography, and how our AI Architect Engine guarantees 99%+ ATS pass rates.",
    category: "ATS Optimization",
    readTime: "6 min read",
    date: "July 20, 2026",
    author: {
      name: "Dr. Elena Rostova",
      role: "Lead HR Tech Researcher",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
    },
    featured: true
  },
  {
    id: "ai-prompt-engineering-resumes",
    title: "How to Prompt AI for High-Converting Impact Bullet Points",
    excerpt: "Learn the exact prompt structures top candidates use to generate quantifiable achievements, STAR format bullets, and executive summaries.",
    category: "AI & Tech",
    readTime: "5 min read",
    date: "July 18, 2026",
    author: {
      name: "Marcus Vance",
      role: "AI Prompt Architect",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
    },
    featured: true
  },
  {
    id: "vector-pdf-formatting",
    title: "Why High-Resolution Vector PDFs Outperform Word Docs",
    excerpt: "Why standard Word exports fail layout checks, and how precise layout rendering keeps elements aligned across all ATS software.",
    category: "Resume Writing",
    readTime: "4 min read",
    date: "July 14, 2026",
    author: {
      name: "Sophia Chen",
      role: "Core Design Architect",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80"
    }
  },
  {
    id: "executive-resume-transformation",
    title: "From Mid-Level to VP: Restructuring Your Leadership Story",
    excerpt: "A step-by-step breakdown of how senior leaders format executive summaries, strategic initiatives, and multi-million dollar revenue metrics.",
    category: "Career Strategy",
    readTime: "8 min read",
    date: "July 10, 2026",
    author: {
      name: "David Miller",
      role: "Executive Career Coach",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
    }
  },
  {
    id: "linkedin-pdf-import-guide",
    title: "Instant Resume Creation: Harnessing LinkedIn PDF Import",
    excerpt: "How to export your LinkedIn profile PDF and let our AI parser distill experience data into bespoke visual canvas designs in under 30 seconds.",
    category: "AI & Tech",
    readTime: "4 min read",
    date: "July 05, 2026",
    author: {
      name: "Marcus Vance",
      role: "AI Prompt Architect",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
    }
  },
  {
    id: "color-psychology-resumes",
    title: "Color Psychology in Resume Design: Dark Mode vs Classic Light",
    excerpt: "Choosing between Stark Brutalist, Obsidian Night, and Modern Emerald themes depending on your industry and corporate culture.",
    category: "Resume Writing",
    readTime: "5 min read",
    date: "June 28, 2026",
    author: {
      name: "Sophia Chen",
      role: "Design System Lead",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80"
    }
  }
];

export function CareerBlogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", "ATS Optimization", "Resume Writing", "AI & Tech", "Career Strategy"];

  const filteredArticles = ARTICLES.filter((article) => {
    const matchesCategory = selectedCategory === "All" || article.category === selectedCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-b from-brand-primary/10 via-app-bg to-app-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 text-brand-primary text-sm font-semibold mb-6">
            <Sparkles className="w-4 h-4" />
            Resumagic Career & AI Engineering Journal
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 bg-gradient-to-r from-slate-900 via-brand-primary to-brand-accent dark:from-white dark:via-brand-primary dark:to-teal-400 bg-clip-text text-transparent">
            Master the Art & Science of High-Impact Resumes
          </h1>
          <p className="text-lg md:text-xl text-app-text-secondary max-w-3xl mx-auto mb-10 leading-relaxed">
            Expert insights on ATS algorithms, smart resume writing, document design, and career growth strategies.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted" />
            <input
              type="text"
              placeholder="Search articles on ATS, AI prompts, formatting..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-app-surface border border-app-border focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-app-text placeholder-app-text-muted transition-all shadow-lg shadow-brand-primary/5"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-6 mb-12 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/25 scale-105"
                  : "bg-app-surface text-app-text-secondary border border-app-border hover:bg-brand-primary/10 hover:text-brand-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured Articles Grid */}
        {selectedCategory === "All" && !searchQuery && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-brand-primary" />
              Featured Insights
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {ARTICLES.filter((a) => a.featured).map((article) => (
                <article
                  key={article.id}
                  className="glass-card rounded-3xl p-8 border border-app-border hover:border-brand-primary/50 transition-all hover:shadow-xl hover:shadow-brand-primary/10 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-primary/10 text-brand-primary">
                        {article.category}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-app-text-muted">
                        <Clock className="w-3.5 h-3.5" />
                        {article.readTime}
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold mb-3 group-hover:text-brand-primary transition-colors leading-tight">
                      {article.title}
                    </h3>
                    <p className="text-app-text-secondary text-sm leading-relaxed mb-6">
                      {article.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-app-border">
                    <div className="flex items-center gap-3">
                      <img
                        src={article.author.avatar}
                        alt={article.author.name}
                        className="w-10 h-10 rounded-full object-cover border border-brand-primary/20"
                      />
                      <div>
                        <div className="text-sm font-bold text-app-text">{article.author.name}</div>
                        <div className="text-xs text-app-text-muted">{article.author.role}</div>
                      </div>
                    </div>
                    <Link
                      to={`/build`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary group-hover:translate-x-1 transition-transform"
                    >
                      Read Article <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* All Articles Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-8">
            {selectedCategory === "All" ? "Latest Articles" : `${selectedCategory} Articles`}
          </h2>
          {filteredArticles.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-3xl border border-app-border">
              <BookOpen className="w-12 h-12 text-app-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">No articles found</h3>
              <p className="text-sm text-app-text-secondary">Try searching for keywords like "ATS", "PDF", or "AI".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredArticles.map((article) => (
                <article
                  key={article.id}
                  className="bg-app-surface rounded-2xl p-6 border border-app-border hover:border-brand-primary/40 transition-all hover:shadow-lg flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-brand-primary/10 text-brand-primary">
                        {article.category}
                      </span>
                      <span className="text-xs text-app-text-muted">{article.readTime}</span>
                    </div>
                    <h3 className="text-lg font-bold mb-2 group-hover:text-brand-primary transition-colors leading-snug">
                      {article.title}
                    </h3>
                    <p className="text-xs text-app-text-secondary leading-relaxed mb-4 line-clamp-3">
                      {article.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-app-border flex items-center justify-between text-xs text-app-text-muted">
                    <span>{article.date}</span>
                    <span className="font-semibold text-brand-primary group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      Read <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Newsletter Callout */}
        <section className="mt-20 glass-card rounded-3xl p-10 border border-brand-primary/20 bg-gradient-to-r from-brand-primary/10 via-app-surface to-brand-accent/10 relative overflow-hidden text-center">
          <div className="max-w-2xl mx-auto relative z-10">
            <Sparkles className="w-10 h-10 text-brand-primary mx-auto mb-4" />
            <h3 className="text-2xl md:text-3xl font-black mb-4">
              Get Weekly AI Resume & Career Hacks
            </h3>
            <p className="text-sm text-app-text-secondary mb-8">
              Join 45,000+ engineers, product managers, and executives receiving our weekly ATS breakdown.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your work email..."
                className="flex-1 px-4 py-3 rounded-xl bg-app-surface border border-app-border focus:border-brand-primary focus:outline-none text-sm"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl font-bold bg-brand-primary text-white hover:bg-brand-primary-hover transition-colors text-sm whitespace-nowrap shadow-lg shadow-brand-primary/20"
              >
                Subscribe Free
              </button>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default CareerBlogPage;
