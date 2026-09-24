import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "../components/landing/Navbar";
import { Footer } from "../components/landing/Footer";
import {
  Search,
  BookOpen,
  Clock,
  ArrowRight,
  Sparkles,
  Tag,
  Share2,
  Check,
  X,
  ChevronRight,
  BookmarkCheck,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  BarChart3,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ARTICLES, type Article } from "../data/blogArticles";
import { trackFeature } from "../lib/analytics";

export function CareerBlogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const categories = [
    "All",
    "ATS Optimization",
    "Resume Writing",
    "AI & Tech",
    "Career Strategy",
  ];

  // Sync state with URL parameter `article` if directly linked
  useEffect(() => {
    const articleId = searchParams.get("article");
    if (articleId) {
      const found = ARTICLES.find(
        (a) => a.id === articleId || a.slug === articleId,
      );
      if (found) {
        setSelectedArticle(found);
      }
    } else {
      setSelectedArticle(null);
    }
  }, [searchParams]);

  const openArticle = (article: Article) => {
    setSelectedArticle(article);
    setSearchParams({ article: article.id });
    void trackFeature("readArticle");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeArticle = () => {
    setSelectedArticle(null);
    setSearchParams({});
  };

  const handleShare = async (article: Article) => {
    const url = `${window.location.origin}/resources/blog?article=${article.id}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const filteredArticles = useMemo(() => {
    return ARTICLES.filter((article) => {
      const matchesCategory =
        selectedCategory === "All" || article.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        article.title.toLowerCase().includes(q) ||
        article.excerpt.toLowerCase().includes(q) ||
        article.tags.some((t) => t.toLowerCase().includes(q)) ||
        article.sections.some(
          (s) =>
            s.heading.toLowerCase().includes(q) ||
            s.body.some((b) => b.toLowerCase().includes(q)),
        );
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col">
        {selectedArticle ? (
          /* ========================================================================= */
          /* FULL ARTICLE READER VIEW (Interactive, Responsive, Clean Reading Mode)    */
          /* ========================================================================= */
          <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16">
            {/* Breadcrumb Navigation */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-app-text-muted mb-6">
              <button
                onClick={closeArticle}
                className="hover:text-app-text transition-colors flex items-center gap-1 cursor-pointer font-medium"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Knowledge Base
              </button>
              <ChevronRight className="w-3 h-3 opacity-50" />
              <button
                onClick={() => {
                  setSelectedCategory(selectedArticle.category);
                  closeArticle();
                }}
                className="hover:text-app-text transition-colors font-medium"
              >
                {selectedArticle.category}
              </button>
              <ChevronRight className="w-3 h-3 opacity-50" />
              <span className="truncate max-w-[200px] sm:max-w-xs text-app-text font-semibold">
                {selectedArticle.title}
              </span>
            </div>

            {/* Back button + Action bar */}
            <div className="flex items-center justify-between gap-4 mb-8 pb-4 border-b border-app-border">
              <button
                onClick={closeArticle}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-app-surface hover:bg-slate-100 dark:hover:bg-slate-800 border border-app-border transition-colors cursor-pointer text-app-text"
              >
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                All Articles
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShare(selectedArticle)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-app-surface hover:bg-slate-100 dark:hover:bg-slate-800 border border-app-border transition-colors cursor-pointer text-app-text-secondary"
                  title="Copy share link"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Copied Link!
                      </span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Article Header */}
            <header className="mb-10">
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-app-border text-slate-800 dark:text-slate-200">
                  {selectedArticle.category}
                </span>
                <span className="flex items-center gap-1 text-xs text-app-text-muted">
                  <Clock className="w-3 h-3" />
                  {selectedArticle.readTime}
                </span>
                <span className="text-xs text-app-text-muted">·</span>
                <span className="text-xs text-app-text-muted">
                  {selectedArticle.date}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-app-text mb-4 leading-tight">
                {selectedArticle.title}
              </h1>

              <p className="text-base sm:text-lg text-app-text-secondary leading-relaxed mb-6 font-normal">
                {selectedArticle.excerpt}
              </p>

              {/* Author Card */}
              <div className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl bg-app-surface border border-app-border">
                <img
                  src={selectedArticle.author.avatar}
                  alt={selectedArticle.author.name}
                  className="w-11 h-11 rounded-full object-cover border border-app-border"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-app-text truncate">
                    {selectedArticle.author.name}
                  </div>
                  <div className="text-xs text-app-text-muted truncate">
                    {selectedArticle.author.role}
                  </div>
                </div>
                <Link
                  to="/wizard"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Build Resume
                </Link>
              </div>
            </header>

            {/* Article Body Content */}
            <article className="space-y-10 text-app-text">
              {selectedArticle.sections.map((sec, idx) => (
                <section key={idx} className="space-y-4">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-app-text pt-2 border-t border-app-border/40">
                    {sec.heading}
                  </h2>

                  {sec.body.map((paragraph, pIdx) => (
                    <p
                      key={pIdx}
                      className="text-sm sm:text-base text-app-text-secondary leading-relaxed"
                    >
                      {paragraph}
                    </p>
                  ))}

                  {/* Bullet Points */}
                  {sec.bullets && sec.bullets.length > 0 && (
                    <ul className="space-y-2.5 my-4 pl-2">
                      {sec.bullets.map((b, bIdx) => (
                        <li
                          key={bIdx}
                          className="flex items-start gap-2.5 text-xs sm:text-sm text-app-text-secondary leading-relaxed"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Optional Callout Block */}
                  {sec.callout && (
                    <div
                      className={`p-4 sm:p-5 rounded-xl border my-4 ${
                        sec.callout.type === "warning"
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
                          : sec.callout.type === "metric"
                            ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-950 dark:text-indigo-200"
                            : sec.callout.type === "example"
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                              : "bg-slate-100 dark:bg-slate-800/60 border-app-border text-app-text"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs sm:text-sm mb-1.5">
                        {sec.callout.type === "warning" && (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        {sec.callout.type === "metric" && (
                          <BarChart3 className="w-4 h-4 text-indigo-500 shrink-0" />
                        )}
                        {sec.callout.type === "example" && (
                          <BookmarkCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        )}
                        {sec.callout.type === "tip" && (
                          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        <span>{sec.callout.title}</span>
                      </div>
                      <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line opacity-90">
                        {sec.callout.text}
                      </p>
                    </div>
                  )}

                  {/* Optional Responsive Data Table */}
                  {sec.table && (
                    <div className="overflow-x-auto rounded-xl border border-app-border bg-app-surface my-4 shadow-2xs">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-app-border text-app-text font-bold">
                          <tr>
                            {sec.table.headers.map((th, hIdx) => (
                              <th
                                key={hIdx}
                                className="px-4 py-3 font-semibold"
                              >
                                {th}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-app-border">
                          {sec.table.rows.map((row, rIdx) => (
                            <tr
                              key={rIdx}
                              className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                            >
                              {row.map((cell, cIdx) => (
                                <td
                                  key={cIdx}
                                  className={`px-4 py-3 leading-relaxed ${
                                    cIdx === 0
                                      ? "font-medium text-app-text"
                                      : "text-app-text-secondary"
                                  }`}
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              ))}
            </article>

            {/* Tags footer */}
            <div className="mt-12 pt-6 border-t border-app-border">
              <div className="flex flex-wrap items-center gap-2 mb-8">
                <span className="text-xs text-app-text-muted flex items-center gap-1 mr-1">
                  <Tag className="w-3.5 h-3.5" />
                  Filed Under:
                </span>
                {selectedArticle.tags.map((tag, tIdx) => (
                  <span
                    key={tIdx}
                    className="px-2.5 py-1 rounded-md text-xs font-mono bg-app-surface border border-app-border text-app-text-secondary"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* In-Article Call to Action */}
              <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 to-slate-800 text-white dark:from-slate-900 dark:to-slate-950 border border-slate-700/60 shadow-xl text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Sparkles className="w-3 h-3" />
                    AI Architect Verified
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold">
                    Build Your ATS-Ready Resume in Seconds
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-md">
                    Apply the principles outlined in this article automatically
                    with Resumagic's neural resume builder.
                  </p>
                </div>
                <Link
                  to="/wizard"
                  className="px-6 py-3 rounded-xl font-bold bg-white text-slate-900 hover:bg-slate-100 transition-all text-xs sm:text-sm whitespace-nowrap shadow-lg shrink-0"
                >
                  Create My Resume Free
                </Link>
              </div>

              {/* Related Articles navigation */}
              <div className="mt-12">
                <h3 className="text-base sm:text-lg font-bold mb-4 text-app-text">
                  More Articles in {selectedArticle.category}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ARTICLES.filter(
                    (a) =>
                      a.id !== selectedArticle.id &&
                      (a.category === selectedArticle.category || a.featured),
                  )
                    .slice(0, 2)
                    .map((related) => (
                      <div
                        key={related.id}
                        onClick={() => openArticle(related)}
                        className="p-4 rounded-xl bg-app-surface border border-app-border hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-pointer group flex flex-col justify-between"
                      >
                        <div>
                          <div className="text-[11px] font-mono text-app-text-muted mb-1">
                            {related.readTime} · {related.category}
                          </div>
                          <h4 className="text-sm font-bold text-app-text group-hover:text-brand-primary transition-colors line-clamp-2">
                            {related.title}
                          </h4>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary mt-3">
                          Read Now{" "}
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </main>
        ) : (
          /* ========================================================================= */
          /* BLOG CATALOG VIEW (Header, Responsive Filters, Articles Grid)             */
          /* ========================================================================= */
          <>
            {/* Hero Header */}
            <section className="pt-24 sm:pt-32 pb-10 sm:pb-12 bg-app-surface border-b border-app-border text-center">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-medium mb-4 border border-app-border shadow-2xs">
                  <BookOpen className="w-3.5 h-3.5" />
                  ATS Knowledge & Engineering Hub
                </div>
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-app-text mb-3 leading-tight">
                  ATS Engineering & Career Documentation
                </h1>
                <p className="text-xs sm:text-base text-app-text-secondary max-w-2xl mx-auto mb-8 leading-relaxed">
                  In-depth breakdowns of Applicant Tracking System parsers,
                  vector embeddings, quantified bullet formulas, and executive
                  career strategy.
                </p>

                {/* Responsive Search Bar */}
                <div className="max-w-xl mx-auto relative px-2 sm:px-0">
                  <Search className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search articles by title, ATS concept, prompt formula, tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl bg-app-bg border border-app-border focus:border-slate-500 dark:focus:border-slate-400 focus:outline-none text-xs sm:text-sm text-app-text transition-colors shadow-2xs placeholder:text-app-text-muted"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-app-text-muted hover:text-app-text p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 w-full">
              {/* Category Filter Pills (Responsive scroll on mobile) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer border ${
                      selectedCategory === cat
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs"
                        : "bg-app-surface text-app-text-secondary border-app-border hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Active Search & Filter Feedback */}
              {(searchQuery || selectedCategory !== "All") && (
                <div className="flex items-center justify-between gap-4 mb-6 pb-2 border-b border-app-border text-xs text-app-text-muted">
                  <span>
                    Showing {filteredArticles.length} article
                    {filteredArticles.length === 1 ? "" : "s"}
                    {selectedCategory !== "All" && ` in "${selectedCategory}"`}
                    {searchQuery && ` matching "${searchQuery}"`}
                  </span>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("All");
                    }}
                    className="text-brand-primary font-medium hover:underline cursor-pointer"
                  >
                    Clear Filters
                  </button>
                </div>
              )}

              {/* Featured Articles Section (Only on main All view with no active search) */}
              {selectedCategory === "All" && !searchQuery && (
                <section className="mb-14">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-app-text">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Featured Analysis
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {ARTICLES.filter((a) => a.featured).map((article) => (
                      <article
                        key={article.id}
                        onClick={() => openArticle(article)}
                        className="bg-app-surface rounded-2xl p-6 sm:p-7 border border-app-border hover:border-slate-400 dark:hover:border-slate-600 transition-all shadow-2xs hover:shadow-md group flex flex-col justify-between cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-4 mb-3">
                            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-app-border">
                              {article.category}
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] font-mono text-app-text-muted">
                              <Clock className="w-3 h-3" />
                              {article.readTime}
                            </div>
                          </div>
                          <h3 className="text-xl sm:text-2xl font-bold mb-3 group-hover:text-brand-primary transition-colors leading-snug text-app-text">
                            {article.title}
                          </h3>
                          <p className="text-app-text-secondary text-xs sm:text-sm leading-relaxed mb-6 line-clamp-3">
                            {article.excerpt}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-5 border-t border-app-border">
                          <div className="flex items-center gap-3">
                            <img
                              src={article.author.avatar}
                              alt={article.author.name}
                              className="w-9 h-9 rounded-full object-cover border border-app-border shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-bold text-app-text truncate">
                                {article.author.name}
                              </div>
                              <div className="text-[11px] text-app-text-muted truncate">
                                {article.author.role}
                              </div>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-brand-primary group-hover:translate-x-1 transition-transform shrink-0">
                            Read Full Guide <ArrowRight className="w-4 h-4" />
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {/* All Articles Grid */}
              <section>
                <h2 className="text-lg sm:text-xl font-bold mb-6 text-app-text">
                  {selectedCategory === "All"
                    ? "Complete Technical Documentation"
                    : `${selectedCategory} Articles`}
                </h2>

                {filteredArticles.length === 0 ? (
                  <div className="text-center py-16 px-4 bg-app-surface rounded-2xl border border-app-border">
                    <BookOpen className="w-12 h-12 text-app-text-muted mx-auto mb-3 opacity-60" />
                    <h3 className="text-base font-bold mb-1 text-app-text">
                      No articles found
                    </h3>
                    <p className="text-xs sm:text-sm text-app-text-secondary max-w-sm mx-auto mb-4">
                      No guides match your search query. Try searching for terms
                      like "ATS", "Vector", "XYZ", or "Salary".
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("All");
                      }}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    >
                      Reset Search Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                    {filteredArticles.map((article) => (
                      <article
                        key={article.id}
                        onClick={() => openArticle(article)}
                        className="bg-app-surface rounded-2xl p-5 sm:p-6 border border-app-border hover:border-slate-400 dark:hover:border-slate-600 transition-all hover:shadow-md flex flex-col justify-between group cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-app-border">
                              {article.category}
                            </span>
                            <span className="text-[11px] font-mono text-app-text-muted">
                              {article.readTime}
                            </span>
                          </div>
                          <h3 className="text-base sm:text-lg font-bold mb-2 group-hover:text-brand-primary transition-colors leading-snug text-app-text">
                            {article.title}
                          </h3>
                          <p className="text-xs text-app-text-secondary leading-relaxed mb-4 line-clamp-3">
                            {article.excerpt}
                          </p>
                        </div>

                        <div>
                          {/* Tags snippet */}
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {article.tags.slice(0, 3).map((tag, tIdx) => (
                              <span
                                key={tIdx}
                                className="text-[10px] font-mono px-2 py-0.5 rounded bg-app-bg text-app-text-muted border border-app-border"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>

                          <div className="pt-3 border-t border-app-border flex items-center justify-between text-xs text-app-text-muted">
                            <span className="truncate">{article.date}</span>
                            <span className="font-semibold text-brand-primary group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 shrink-0">
                              Read Full <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              {/* Newsletter / ATS Updates Callout */}
              <section className="mt-16 sm:mt-20 rounded-3xl p-6 sm:p-10 border border-app-border bg-app-surface relative overflow-hidden text-center shadow-xs">
                <div className="max-w-2xl mx-auto relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 border border-app-border">
                    <Sparkles className="w-6 h-6 text-brand-primary" />
                  </div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-black mb-3 text-app-text">
                    Get Bi-Weekly ATS Engineering Insights
                  </h3>
                  <p className="text-xs sm:text-sm text-app-text-secondary mb-6 max-w-lg mx-auto leading-relaxed">
                    Join 45,000+ software engineers, data scientists, product
                    managers, and directors receiving our parser analysis and
                    resume architecture updates.
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      alert(
                        "Thank you for subscribing to Resumagic Career Notes!",
                      );
                    }}
                    className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto"
                  >
                    <input
                      type="email"
                      placeholder="Enter your email address..."
                      className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl bg-app-bg border border-app-border focus:border-slate-500 dark:focus:border-slate-400 focus:outline-none text-xs sm:text-sm text-app-text"
                      required
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 sm:py-3 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors text-xs sm:text-sm whitespace-nowrap shadow-md cursor-pointer"
                    >
                      Subscribe
                    </button>
                  </form>
                </div>
              </section>
            </main>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default CareerBlogPage;
