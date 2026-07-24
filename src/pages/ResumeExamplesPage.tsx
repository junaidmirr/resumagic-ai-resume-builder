import { useState } from "react";
import { Navbar } from "../components/landing/Navbar";
import { Footer } from "../components/landing/Footer";
import { Layout, Sparkles, ArrowRight, CheckCircle2, Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../components/onboarding/AuthModalContext";

import starkBrutalistThumb from "../assets/templates/stark_brutalist.png";
import cyberpunkEdgeThumb from "../assets/templates/cyberpunk_edge.png";
import neonCoderThumb from "../assets/templates/neon_coder.png";
import crimsonExecutiveThumb from "../assets/templates/crimson_executive.png";
import geometricTechThumb from "../assets/templates/geometric_tech.png";
import emeraldProThumb from "../assets/templates/emerald_pro.png";
import obsidianNightThumb from "../assets/templates/obsidian_night.png";
import corporateHierarchyThumb from "../assets/templates/corporate_hierarchy.png";
import retroTerminalThumb from "../assets/templates/retro_terminal.png";

interface ResumeExample {
  id: string;
  title: string;
  role: string;
  industry: string;
  templatePreset: string;
  atsScore: number;
  thumbnailUrl: string;
  highlights: string[];
}

const EXAMPLES: ResumeExample[] = [
  {
    id: "ex-swe-senior",
    title: "Senior Full Stack Engineer Resume Example",
    role: "Senior Software Engineer",
    industry: "Software & SaaS",
    templatePreset: "Stark Brutalist",
    atsScore: 99,
    thumbnailUrl: starkBrutalistThumb,
    highlights: ["Microservices architecture", "Distributed caching", "p99 latency reduction"]
  },
  {
    id: "ex-pm-lead",
    title: "Lead Product Manager Resume Example",
    role: "Product Manager",
    industry: "Product & Growth",
    templatePreset: "Cyberpunk Edge",
    atsScore: 98,
    thumbnailUrl: cyberpunkEdgeThumb,
    highlights: ["PLG growth loops", "0-to-1 product launch", "$12M ARR metrics"]
  },
  {
    id: "ex-data-scientist",
    title: "AI / ML Data Scientist Resume Example",
    role: "Data Scientist",
    industry: "AI & Data",
    templatePreset: "Neon Coder",
    atsScore: 99,
    thumbnailUrl: neonCoderThumb,
    highlights: ["LLM fine-tuning", "PyTorch pipeline", "RAG evaluation frameworks"]
  },
  {
    id: "ex-executive-vp",
    title: "VP of Engineering Leadership Resume Example",
    role: "VP Engineering",
    industry: "Executive",
    templatePreset: "Crimson Executive",
    atsScore: 97,
    thumbnailUrl: crimsonExecutiveThumb,
    highlights: ["50+ team scaling", "Org restructuring", "SOC2 compliance"]
  },
  {
    id: "ex-designer-lead",
    title: "Principal UX / UI Product Designer Example",
    role: "UI/UX Designer",
    industry: "Design & Creative",
    templatePreset: "Geometric Tech",
    atsScore: 96,
    thumbnailUrl: geometricTechThumb,
    highlights: ["Figma design tokens", "Accessibility compliance", "Design system lead"]
  },
  {
    id: "ex-marketing-head",
    title: "Head of Growth Marketing Resume Example",
    role: "Marketing Director",
    industry: "Marketing",
    templatePreset: "Emerald Pro",
    atsScore: 98,
    thumbnailUrl: emeraldProThumb,
    highlights: ["Multi-channel acquisition", "CAC reduction", "SEO & Paid Growth"]
  },
  {
    id: "ex-cyber-security",
    title: "Lead Cybersecurity Architect Resume Example",
    role: "Security Architect",
    industry: "Software & SaaS",
    templatePreset: "Obsidian Night",
    atsScore: 99,
    thumbnailUrl: obsidianNightThumb,
    highlights: ["Zero Trust Security", "SIEM & Threat Intel", "Compliance audits"]
  },
  {
    id: "ex-finance-director",
    title: "Director of Corporate Finance Example",
    role: "Finance Director",
    industry: "Executive",
    templatePreset: "Corporate Hierarchy",
    atsScore: 97,
    thumbnailUrl: corporateHierarchyThumb,
    highlights: ["M&A Due Diligence", "Financial Modeling", "Capital Allocation"]
  },
  {
    id: "ex-devops-lead",
    title: "Principal DevOps & Cloud Engineer Example",
    role: "DevOps Engineer",
    industry: "Software & SaaS",
    templatePreset: "Retro Terminal",
    atsScore: 98,
    thumbnailUrl: retroTerminalThumb,
    highlights: ["Kubernetes GitOps", "Terraform IaC", "99.999% SLA Uptime"]
  }
];

export function ResumeExamplesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openModal } = useAuthModal();
  const [selectedIndustry, setSelectedIndustry] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const industries = ["All", "Software & SaaS", "Product & Growth", "AI & Data", "Executive", "Design & Creative", "Marketing"];

  const filteredExamples = EXAMPLES.filter((ex) => {
    const matchesIndustry = selectedIndustry === "All" || ex.industry === selectedIndustry;
    const matchesSearch = ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ex.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesIndustry && matchesSearch;
  });

  const handleUseExample = (preset: string) => {
    if (!user) {
      openModal({ title: "Log In to Use Resume Template" });
      return;
    }
    localStorage.setItem("selected_template_preset", preset);
    navigate("/dashboard?tab=templates");
  };

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      {/* Hero Header */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-16 bg-gradient-to-b from-brand-primary/10 via-app-bg to-app-bg text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-brand-primary/10 text-brand-primary text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
            <Layout className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Curated Industry Resume Examples & Templates
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 bg-gradient-to-r from-slate-900 via-brand-primary to-brand-accent dark:from-white dark:via-brand-primary dark:to-teal-400 bg-clip-text text-transparent leading-tight">
            Proven Resume Examples Rated 98%+ ATS Pass
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-app-text-secondary max-w-3xl mx-auto leading-relaxed mb-6 sm:mb-8 px-2">
            Explore battle-tested resume layouts crafted for Software Engineers, Product Leaders, Data Scientists, and Executives.
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto relative px-2 sm:px-0">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-6 sm:left-4 top-1/2 -translate-y-1/2 text-app-text-muted" />
            <input
              type="text"
              placeholder="Search by title, role (e.g., Engineer, Product, Data)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 sm:pl-12 pr-4 py-3 sm:py-4 rounded-2xl bg-app-surface border border-app-border focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-xs sm:text-sm md:text-base text-app-text transition-all shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 w-full">
        {/* Industry Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 sm:pb-6 mb-8 sm:mb-12 scrollbar-none">
          {industries.map((ind) => (
            <button
              key={ind}
              onClick={() => setSelectedIndustry(ind)}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                selectedIndustry === ind
                  ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/25 scale-105"
                  : "bg-app-surface text-app-text-secondary border border-app-border hover:bg-brand-primary/10 hover:text-brand-primary"
              }`}
            >
              {ind}
            </button>
          ))}
        </div>

        {/* Examples Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredExamples.map((ex) => (
            <div
              key={ex.id}
              className="bg-app-surface rounded-2xl sm:rounded-3xl overflow-hidden border border-app-border hover:border-brand-primary/50 transition-all hover:shadow-xl group flex flex-col justify-between"
            >
              <div>
                <div className="relative h-64 sm:h-72 bg-slate-950 overflow-hidden border-b border-app-border p-3 sm:p-4 flex items-center justify-center">
                  <img
                    src={ex.thumbnailUrl}
                    alt={ex.title}
                    className="w-full h-full object-contain object-top rounded-lg shadow-xl group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-black bg-teal-500 text-white shadow-md flex items-center gap-1 z-10">
                    <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    {ex.atsScore}% ATS
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  <span className="text-[11px] sm:text-xs font-bold text-brand-primary block mb-1.5 sm:mb-2">{ex.industry}</span>
                  <h3 className="text-base sm:text-lg font-bold mb-2.5 sm:mb-3 leading-snug group-hover:text-brand-primary transition-colors">
                    {ex.title}
                  </h3>

                  <div className="space-y-1.5 mb-4 sm:mb-6">
                    {ex.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-app-text-secondary">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0" />
                        <span className="truncate">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 pt-0">
                <button
                  onClick={() => handleUseExample(ex.templatePreset)}
                  className="w-full py-2.5 sm:py-3 rounded-xl font-bold bg-brand-primary text-white hover:bg-brand-primary-hover transition-colors text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20"
                >
                  Use This Template <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default ResumeExamplesPage;
