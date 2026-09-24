import { useState } from "react";
import { Navbar } from "../components/landing/Navbar";
import { Footer } from "../components/landing/Footer";
import {
  Layout,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Search,
  Filter,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../components/onboarding/AuthModalContext";
import { trackTemplateUse, trackFeature } from "../lib/analytics";

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
    highlights: [
      "Microservices architecture",
      "Distributed caching",
      "p99 latency reduction",
    ],
  },
  {
    id: "ex-pm-lead",
    title: "Lead Product Manager Resume Example",
    role: "Product Manager",
    industry: "Product & Growth",
    templatePreset: "Cyberpunk Edge",
    atsScore: 98,
    thumbnailUrl: cyberpunkEdgeThumb,
    highlights: [
      "PLG growth loops",
      "0-to-1 product launch",
      "$12M ARR metrics",
    ],
  },
  {
    id: "ex-data-scientist",
    title: "AI / ML Data Scientist Resume Example",
    role: "Data Scientist",
    industry: "AI & Data",
    templatePreset: "Neon Coder",
    atsScore: 99,
    thumbnailUrl: neonCoderThumb,
    highlights: [
      "LLM fine-tuning",
      "PyTorch pipeline",
      "RAG evaluation frameworks",
    ],
  },
  {
    id: "ex-executive-vp",
    title: "VP of Engineering Leadership Resume Example",
    role: "VP Engineering",
    industry: "Executive",
    templatePreset: "Crimson Executive",
    atsScore: 97,
    thumbnailUrl: crimsonExecutiveThumb,
    highlights: ["50+ team scaling", "Org restructuring", "SOC2 compliance"],
  },
  {
    id: "ex-designer-lead",
    title: "Principal UX / UI Product Designer Example",
    role: "UI/UX Designer",
    industry: "Design & Creative",
    templatePreset: "Geometric Tech",
    atsScore: 96,
    thumbnailUrl: geometricTechThumb,
    highlights: [
      "Figma design tokens",
      "Accessibility compliance",
      "Design system lead",
    ],
  },
  {
    id: "ex-marketing-head",
    title: "Head of Growth Marketing Resume Example",
    role: "Marketing Director",
    industry: "Marketing",
    templatePreset: "Emerald Pro",
    atsScore: 98,
    thumbnailUrl: emeraldProThumb,
    highlights: [
      "Multi-channel acquisition",
      "CAC reduction",
      "SEO & Paid Growth",
    ],
  },
  {
    id: "ex-cyber-security",
    title: "Lead Cybersecurity Architect Resume Example",
    role: "Security Architect",
    industry: "Software & SaaS",
    templatePreset: "Obsidian Night",
    atsScore: 99,
    thumbnailUrl: obsidianNightThumb,
    highlights: [
      "Zero Trust Security",
      "SIEM & Threat Intel",
      "Compliance audits",
    ],
  },
  {
    id: "ex-finance-director",
    title: "Director of Corporate Finance Example",
    role: "Finance Director",
    industry: "Executive",
    templatePreset: "Corporate Hierarchy",
    atsScore: 97,
    thumbnailUrl: corporateHierarchyThumb,
    highlights: [
      "M&A Due Diligence",
      "Financial Modeling",
      "Capital Allocation",
    ],
  },
  {
    id: "ex-devops-lead",
    title: "Principal DevOps & Cloud Engineer Example",
    role: "DevOps Engineer",
    industry: "Software & SaaS",
    templatePreset: "Retro Terminal",
    atsScore: 98,
    thumbnailUrl: retroTerminalThumb,
    highlights: ["Kubernetes GitOps", "Terraform IaC", "99.999% SLA Uptime"],
  },
];

export function ResumeExamplesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openModal } = useAuthModal();
  const [selectedIndustry, setSelectedIndustry] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const industries = [
    "All",
    "Software & SaaS",
    "Product & Growth",
    "AI & Data",
    "Executive",
    "Design & Creative",
    "Marketing",
  ];

  const filteredExamples = EXAMPLES.filter((ex) => {
    const matchesIndustry =
      selectedIndustry === "All" || ex.industry === selectedIndustry;
    const matchesSearch =
      ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesIndustry && matchesSearch;
  });

  const handleUseExample = (preset: string) => {
    if (!user) {
      openModal({ title: "Log In to Use Resume Template" });
      return;
    }
    void trackTemplateUse(preset);
    void trackFeature("resumeTemplate");
    localStorage.setItem("selected_template_preset", preset);
    navigate("/dashboard?tab=templates");
  };

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      {/* Hero Header */}
      <section className="pt-24 sm:pt-32 pb-10 sm:pb-12 bg-app-surface border-b border-app-border text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-medium mb-4 border border-app-border">
            <Layout className="w-3.5 h-3.5" />
            Standard Document Layouts
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-app-text mb-3">
            Resume Examples & Formats
          </h1>
          <p className="text-sm sm:text-base text-app-text-secondary max-w-2xl mx-auto leading-relaxed mb-8">
            Review production resume formats designed for software engineering,
            product management, and executive applications.
          </p>

          {/* Search bar */}
          <div className="max-w-xl mx-auto relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by role or domain (e.g., Engineer, Product, Data)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-app-bg border border-app-border focus:border-slate-400 dark:focus:border-slate-600 focus:outline-none text-xs sm:text-sm text-app-text transition-colors shadow-2xs"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Industry Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {industries.map((ind) => (
            <button
              key={ind}
              onClick={() => setSelectedIndustry(ind)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap border ${
                selectedIndustry === ind
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white font-semibold"
                  : "bg-app-surface text-app-text-secondary border-app-border hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {ind}
            </button>
          ))}
        </div>

        {/* Examples Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExamples.map((ex) => (
            <div
              key={ex.id}
              className="bg-app-surface rounded-lg overflow-hidden border border-app-border hover:border-slate-400 dark:hover:border-slate-600 transition-colors shadow-2xs group flex flex-col justify-between"
            >
              <div>
                <div className="relative h-64 bg-slate-900 overflow-hidden border-b border-app-border p-4 flex items-center justify-center">
                  <img
                    src={ex.thumbnailUrl}
                    alt={ex.title}
                    className="w-full h-full object-contain object-top rounded shadow-xs"
                  />
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800/90 text-emerald-400 border border-slate-700 flex items-center gap-1 z-10">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ATS Ready
                  </div>
                </div>

                <div className="p-5">
                  <span className="text-[11px] font-mono uppercase text-slate-500 block mb-1">
                    {ex.industry}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold mb-2.5 sm:mb-3 leading-snug group-hover:text-brand-primary transition-colors">
                    {ex.title}
                  </h3>

                  <div className="space-y-1.5 mb-4 sm:mb-6">
                    {ex.highlights.map((h, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-xs text-app-text-secondary"
                      >
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
                  className="w-full py-2.5 sm:py-3 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  Use This Template{" "}
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
