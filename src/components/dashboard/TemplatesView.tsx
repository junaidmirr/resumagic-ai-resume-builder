import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { templates, type Template } from "../../lib/templates";
import { TemplateThumbnailPreview } from "./TemplateThumbnailPreview";
import { Search, Loader2, Star, Download, Crown, Lock } from "lucide-react";

interface TemplatesViewProps {
  onUseTemplate: (template: Template) => void;
  isCreating: boolean;
}

export function TemplatesView({ onUseTemplate, isCreating }: TemplatesViewProps) {
  const [filter, setFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const categories = ["All", ...Array.from(new Set(templates.map((t) => t.category)))];

  const filteredTemplates = templates.filter((t) => {
    const matchesCategory = filter === "All" || t.category === filter;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 sm:p-6 lg:p-8 border-b border-app-border shrink-0 bg-app-surface/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-app-text mb-1 tracking-tight">Template Library</h2>
            <p className="text-xs sm:text-sm text-app-text-muted">Choose from 20+ professional, ATS-optimized designs.</p>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-text-muted" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-app-bg border border-app-border rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none w-full md:w-64 transition-all placeholder:text-app-text-muted/50 text-app-text"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2 mb-6 sm:mb-8 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  filter === category
                    ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                    : "bg-app-surface border border-app-border text-app-text-muted hover:text-app-text hover:bg-app-bg"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pb-20">
            <AnimatePresence>
              {filteredTemplates.map((template) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  key={template.id}
                  className="group relative bg-app-surface rounded-2xl border border-app-border overflow-hidden hover:shadow-xl hover:shadow-brand-primary/10 transition-all duration-300 flex flex-col justify-between"
                  onMouseEnter={() => setHoveredId(template.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div className="aspect-[1/1.4] relative overflow-hidden bg-app-bg p-2.5 sm:p-3 flex items-center justify-center">
                    <TemplateThumbnailPreview template={template} />

                    {/* Premium Crown Tag Badge */}
                    {template.isPremium ? (
                      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-[10px] uppercase px-2.5 py-1 rounded-full shadow-lg shadow-amber-500/20 border border-amber-300">
                        <Crown className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                        PREMIUM
                      </div>
                    ) : (
                      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] uppercase px-2.5 py-1 rounded-full border border-emerald-500/20">
                        FREE
                      </div>
                    )}
                    
                    {/* Hover Overlay (Desktop) */}
                    <div className={`hidden md:flex absolute inset-0 bg-app-surface/80 backdrop-blur-[2px] items-center justify-center transition-opacity duration-300 ${hoveredId === template.id ? 'opacity-100' : 'opacity-0'}`}>
                      <button
                        onClick={() => onUseTemplate(template)}
                        disabled={isCreating}
                        className="translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2 bg-brand-primary hover:bg-brand-secondary text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-brand-primary/30 disabled:opacity-50"
                      >
                        {isCreating && hoveredId === template.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Star className="w-4 h-4" fill="currentColor" />
                            Use Template
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-3.5 sm:p-4 border-t border-app-border flex flex-col gap-2.5">
                    <h3 className="font-bold text-sm sm:text-base text-app-text truncate">{template.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 sm:py-1 bg-brand-primary/10 text-brand-primary rounded-md">
                        {template.category}
                      </span>
                      <div className="flex items-center gap-1 text-app-text-muted text-[11px] sm:text-xs">
                        <Download className="w-3 h-3" />
                        <span>PDF</span>
                      </div>
                    </div>

                    {/* Mobile Touch Use Template Button */}
                    <button
                      onClick={() => onUseTemplate(template)}
                      disabled={isCreating}
                      className="w-full py-2 bg-brand-primary text-white rounded-xl text-xs font-bold md:hidden flex items-center justify-center gap-1.5 shadow-md shadow-brand-primary/20 mt-1"
                    >
                      {isCreating && hoveredId === template.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Star className="w-3.5 h-3.5" fill="currentColor" />
                          Use Template
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
          
          {filteredTemplates.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-app-surface border border-app-border rounded-2xl flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-app-text-muted" />
              </div>
              <h3 className="text-lg font-bold text-app-text">Premium Templates Coming Soon!</h3>
              <p className="text-app-text-muted text-sm mt-1">We are currently crafting beautiful, pixel-perfect templates for you to use. Check back later!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
