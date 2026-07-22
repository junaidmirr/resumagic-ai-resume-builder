import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  Loader2,
  Plus,
  Trash2,
  X,
  Globe,
} from "lucide-react";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { templates } from "../lib/templates";
import { MiniPreview } from "../components/ui/MiniPreview";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { resumeService } from "../lib/resumeService";
import { generateWizardElements } from "../lib/wizardGenerator";
import defaultLogoLight from '../assets/default.png';
import defaultLogoDark from '../assets/default-dark.png';

// Types
export interface WizardData {
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    linkedin: string;
    website: string;
    country: string;
    state: string;
  };
  experienceLevel: string;
  experiences: {
    id: string;
    role: string;
    company: string;
    duration: string;
    location: string;
    description: string;
  }[];
  educations: {
    id: string;
    degree: string;
    school: string;
    startDate: string;
    endDate: string;
    gpa: string;
    note: string;
  }[];
  skills: string[];
  summary: string;
  additional: {
    languages: { id: string; language: string; proficiency: string }[];
    extracurriculars: string;
    certificates: string;
    awards: string;
    other: string;
  };
  templateLevel: "level1" | "level2" | "level3" | "level4";
}

const INITIAL_DATA: WizardData = {
  contact: {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    linkedin: "",
    website: "",
    country: "",
    state: "",
  },
  experienceLevel: "Entry Level",
  experiences: [],
  educations: [],
  skills: [],
  summary: "",
  additional: {
    languages: [],
    extracurriculars: "",
    certificates: "",
    awards: "",
    other: "",
  },
  templateLevel: "level1",
};

const EXP_LEVELS = [
  "Fresher",
  "Entry Level",
  "Junior",
  "Mid Level",
  "Senior",
  "Executive",
];

export function WizardPage() {
  const navigate = useNavigate();
  const { user, refreshCredits } = useAuth();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(INITIAL_DATA);
  const totalSteps = 8;

  // AI states
  const [skillCategory, setSkillCategory] = useState("Software Engineering");
  const [aiSkills, setAiSkills] = useState<string[]>([]);
  const [generatingSkills, setGeneratingSkills] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [extendingSummary, setExtendingSummary] = useState(false);
  const [isDesigning, setIsDesigning] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("wizardData");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Map from AI Parser (experience -> experiences, education -> educations)
        const hydratedData: WizardData = {
          ...INITIAL_DATA,
          contact: {
            ...INITIAL_DATA.contact,
            firstName: parsed.full_name?.split(" ")[0] || "",
            lastName: parsed.full_name?.split(" ").slice(1).join(" ") || "",
            email: parsed.email || "",
            phone: parsed.phone || "",
            linkedin: parsed.linkedin || "",
          },
          summary: parsed.summary || "",
          experiences: (parsed.experience || []).map((e: any) => ({
            id: generateId(),
            role: e.title || "",
            company: e.company || "",
            duration: e.dates || "",
            location: "",
            description: e.desc || "",
          })),
          educations: (parsed.education || []).map((e: any) => ({
            id: generateId(),
            degree: e.degree || "",
            school: e.school || "",
            startDate: e.dates?.split("-")[0]?.trim() || "",
            endDate: e.dates?.split("-")[1]?.trim() || "",
            gpa: "",
            note: "",
          })),
          skills: parsed.skills || [],
        };
        setData(hydratedData);
        sessionStorage.removeItem("wizardData");
      } catch (err) {
        console.error("Failed to hydrate wizard data", err);
      }
    }
  }, []);

  function generateId() {
    return Math.random().toString(36).substring(2, 9);
  }

  const handleNext = () => {
    if (step === 1) {
      if (
        !data.contact.firstName ||
        !data.contact.email ||
        !data.contact.phone
      ) {
        alert("First Name, Email, and Phone No are mandatory.");
        return;
      }
    }
    setStep(Math.min(step + 1, totalSteps));
  };
  const handleBack = () => setStep(Math.max(step - 1, 1));
  const handleCancel = () => navigate("/build");

  const handleFinish = async () => {
    setIsDesigning(true);
    try {
      // Mock AI Layout Design Pass
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const selectedTemplate = templates.find(t => t.id === data.templateId) || templates[0];
      const elements = selectedTemplate.generateElements(data);
      
      const title = data.contact.firstName
          ? `${data.contact.firstName}'s Resume`
          : "My AI Resume";
          
      const id = await resumeService.createResume(
        user?.uid || "guest",
        title,
        elements
      );
      localStorage.setItem("current_resume_id", id);
      navigate("/editor");
    } catch (error) {
      console.error("[Wizard] AI Error:", error);
      alert("AI Design failed. Please try again.");
    } finally {
      setIsDesigning(false);
    }
  };

  const updateContact = (f: keyof WizardData["contact"], v: string) =>
    setData((p) => ({ ...p, contact: { ...p.contact, [f]: v } }));
  const updateExperience = (id: string, f: string, v: string) =>
    setData((p) => ({
      ...p,
      experiences: p.experiences.map((e) =>
        e.id === id ? { ...e, [f]: v } : e,
      ),
    }));
  const updateEducation = (id: string, f: string, v: string) =>
    setData((p) => ({
      ...p,
      educations: p.educations.map((e) => (e.id === id ? { ...e, [f]: v } : e)),
    }));
  const updateAdditional = (f: string, v: string) =>
    setData((p) => ({
      ...p,
      additional: { ...p.additional, [f]: v },
    }));

  const fetchAiSkills = async (loadMore = false) => {
    setGeneratingSkills(true);
    try {
      // Mock AI Delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      const categoryLower = skillCategory.toLowerCase();
      let mockSkills = [];
      if (categoryLower.includes("software") || categoryLower.includes("engineer")) {
        mockSkills = ["React.js", "Node.js", "TypeScript", "Python", "Docker", "AWS", "GraphQL", "System Design"];
      } else if (categoryLower.includes("design") || categoryLower.includes("ui")) {
        mockSkills = ["Figma", "User Research", "Wireframing", "Prototyping", "Adobe Creative Suite", "Design Systems"];
      } else if (categoryLower.includes("product") || categoryLower.includes("manager")) {
        mockSkills = ["Agile/Scrum", "Product Roadmapping", "Jira", "A/B Testing", "Data Analysis", "Stakeholder Management"];
      } else {
        mockSkills = ["Project Management", "Leadership", "Communication", "Problem Solving", "Strategic Planning", "Data Analysis", "Public Speaking", "Negotiation"];
      }

      if (loadMore) {
        mockSkills = mockSkills.map(s => "Advanced " + s); // just to show different ones
        setAiSkills((prev) => Array.from(new Set([...prev, ...mockSkills])));
      } else {
        setAiSkills(mockSkills);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingSkills(false);
    }
  };

  
  const extendSummary = async () => {
    if (!data.summary) return;
    setExtendingSummary(true);
    try {
      const resp = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-User-ID": user?.uid || "anonymous",
          "X-Skip-Credit-Check": "true"
        },
        body: JSON.stringify({ action: "enhance", text: data.summary }),
      });
      if (resp.ok) {
        const result = await resp.json();
        setData((p) => ({ ...p, summary: result.result || p.summary }));
      }
    } catch (e) {
      console.error("Failed to extend summary:", e);
    } finally {
      setExtendingSummary(false);
    }
  };

  const generateSummary = async () => {
    setGeneratingSummary(true);
    try {
      // Mock AI Delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const role = data.experiences?.length > 0 ? data.experiences[0].role : "Professional";
      const exp = data.experienceLevel;
      const skills = (data.skills || []).slice(0, 3).join(", ");
      
      let mockSummary = `Highly motivated and detail-oriented ${role} with a strong foundation in their field. Proven ability to adapt quickly and deliver high-quality results.`;
      
      if (exp === "Senior" || exp === "Executive") {
        mockSummary = `Accomplished ${role} with extensive experience driving strategic initiatives and leading cross-functional teams. Expert in ${skills || 'industry best practices'}, with a proven track record of optimizing processes and exceeding performance metrics.`;
      } else if (exp === "Entry Level" || exp === "Fresher") {
        mockSummary = `Ambitious ${role} eager to leverage strong academic background and foundational knowledge to contribute to a dynamic team. Passionate about learning and growing within the industry.`;
      }

      setData((p) => ({ ...p, summary: mockSummary }));
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingSummary(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg flex flex-col font-sans transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-app-border bg-white/80 dark:bg-slate-950/80 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2 group">
          <img src={defaultLogoLight} alt="Resumagic" className="h-8 logo-light" />
            <img src={defaultLogoDark} alt="Resumagic" className="h-8 logo-dark" />
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center text-sm font-medium text-app-text-muted mb-2">
            <span>
              Step {step} of {totalSteps}
            </span>
            <span>{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-teal-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-app-surface rounded-2xl shadow-sm border border-app-border p-6 sm:p-8 mb-8 overflow-hidden flex flex-col relative animate-in fade-in slide-in-from-bottom-4">
          {isDesigning && (
            <div className="absolute inset-0 z-[60] bg-white/90 dark:bg-slate-900/90 flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm animate-in fade-in duration-300">
              <div className="relative mb-8">
                <div className="w-16 h-16 rounded-full border-4 border-teal-500/20 border-t-teal-500 animate-spin" />
                <Sparkles
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-teal-500 animate-pulse"
                  size={24}
                />
              </div>
              <h3 className="text-xl font-bold text-app-text mb-2">
                Designing Your Dream Resume...
              </h3>
              <p className="text-app-text-muted max-w-sm">
                Our AI Architect is planning your layout, selecting professional
                typography, and aligning every detail perfectly.
              </p>
            </div>
          )}

          {/* Scraper Restriction Warning */}
          {data?.summary?.includes("LinkedIn has restricted") && (
            <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl flex gap-4 animate-in slide-in-from-top-2">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg h-fit">
                <Globe
                  className="text-amber-600 dark:text-amber-400"
                  size={18}
                />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                  Partial Import (Scraping Blocked)
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-400 mt-1 leading-relaxed">
                  LinkedIn restricted direct access to your profile. We've
                  extracted your name from the URL, but for a{" "}
                  <strong>solid as accurate</strong> resume with all experience,
                  please use the
                  <strong>"LinkedIn PDF"</strong> option on the start screen.
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="mt-2 text-xs font-bold text-amber-900 dark:text-amber-200 underline underline-offset-2 hover:text-amber-700"
                >
                  Go Back to Upload PDF
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: CONTACT */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-app-text mb-2">
                  Contact Details
                </h2>
                <p className="text-app-text-muted">
                  Let's start with the basics. How can employers reach you?
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-app-text-secondary mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={data.contact.firstName}
                    onChange={(e) => updateContact("firstName", e.target.value)}
                    className="w-full rounded-lg border border-app-border bg-app-bg p-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-app-text-secondary mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={data.contact.lastName}
                    onChange={(e) => updateContact("lastName", e.target.value)}
                    className="w-full rounded-lg border border-app-border bg-app-bg p-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-app-text-secondary mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={data.contact.email}
                    onChange={(e) => updateContact("email", e.target.value)}
                    className="w-full rounded-lg border border-app-border bg-app-bg p-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-app-text-secondary mb-1">
                    Phone No *
                  </label>
                  <input
                    type="tel"
                    value={data.contact.phone}
                    onChange={(e) => updateContact("phone", e.target.value)}
                    className="w-full rounded-lg border border-app-border bg-app-bg p-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-app-text-secondary mb-1">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={data.contact.linkedin}
                    onChange={(e) => updateContact("linkedin", e.target.value)}
                    className="w-full rounded-lg border border-app-border bg-app-bg p-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-app-text-secondary mb-1">
                    Personal Website
                  </label>
                  <input
                    type="url"
                    value={data.contact.website}
                    onChange={(e) => updateContact("website", e.target.value)}
                    className="w-full rounded-lg border border-app-border bg-app-bg p-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-app-text-secondary mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={data.contact.country}
                    onChange={(e) => updateContact("country", e.target.value)}
                    className="w-full rounded-lg border border-app-border bg-app-bg p-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-app-text-secondary mb-1">
                    State/Region
                  </label>
                  <input
                    type="text"
                    value={data.contact.state}
                    onChange={(e) => updateContact("state", e.target.value)}
                    className="w-full rounded-lg border border-app-border bg-app-bg p-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: EXPERIENCE */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-app-text mb-2">
                  Work Experience
                </h2>
                <p className="text-app-text-muted">
                  Tell us about your professional background.
                </p>
              </div>

              <div className="w-full max-w-sm">
                <label className="block text-sm font-medium text-app-text-secondary mb-1">
                  Experience Level
                </label>
                <select
                  value={data.experienceLevel}
                  onChange={(e) =>
                    setData((p) => ({ ...p, experienceLevel: e.target.value }))
                  }
                  className="w-full rounded-lg border border-app-border bg-app-bg p-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 dark:text-white"
                >
                  {EXP_LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              {data.experienceLevel !== "Fresher" ? (
                <div className="space-y-6 mt-6">
                  {(data.experiences || []).map((exp, i) => (
                    <div
                      key={exp.id}
                      className="p-4 rounded-xl border border-app-border bg-app-surface/50 relative"
                    >
                      <button
                        onClick={() =>
                          setData((p) => ({
                            ...p,
                            experiences: p.experiences.filter(
                              (e) => e.id !== exp.id,
                            ),
                          }))
                        }
                        className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                      <h4 className="font-semibold text-app-text mb-4">
                        Experience #{i + 1}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-app-text-secondary mb-1">
                            Role / Job Title
                          </label>
                          <input
                            type="text"
                            value={exp.role}
                            onChange={(e) =>
                              updateExperience(exp.id, "role", e.target.value)
                            }
                            className="w-full rounded-lg border border-app-border bg-app-bg p-2 text-sm outline-none focus:border-teal-500 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-app-text-secondary mb-1">
                            Company Name
                          </label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) =>
                              updateExperience(
                                exp.id,
                                "company",
                                e.target.value,
                              )
                            }
                            className="w-full rounded-lg border border-app-border bg-app-bg p-2 text-sm outline-none focus:border-teal-500 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-app-text-secondary mb-1">
                            Duration
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Jan 2020 - Present"
                            value={exp.duration}
                            onChange={(e) =>
                              updateExperience(
                                exp.id,
                                "duration",
                                e.target.value,
                              )
                            }
                            className="w-full rounded-lg border border-app-border bg-app-bg p-2 text-sm outline-none focus:border-teal-500 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-app-text-secondary mb-1">
                            Location
                          </label>
                          <input
                            type="text"
                            value={exp.location}
                            onChange={(e) =>
                              updateExperience(
                                exp.id,
                                "location",
                                e.target.value,
                              )
                            }
                            className="w-full rounded-lg border border-app-border bg-app-bg p-2 text-sm outline-none focus:border-teal-500 dark:text-white"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-app-text-secondary mb-1">
                            Work Done / Highlights
                          </label>
                          <textarea
                            value={exp.description}
                            onChange={(e) =>
                              updateExperience(
                                exp.id,
                                "description",
                                e.target.value,
                              )
                            }
                            className="w-full rounded-lg border border-app-border bg-app-bg p-2 text-sm outline-none focus:border-teal-500 dark:text-white min-h-[80px]"
                            placeholder="Summarize your achievements..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      setData((p) => ({
                        ...p,
                        experiences: [
                          ...p.experiences,
                          {
                            id: generateId(),
                            role: "",
                            company: "",
                            duration: "",
                            location: "",
                            description: "",
                          },
                        ],
                      }))
                    }
                    className="flex items-center gap-2 px-4 py-2 text-teal-600 dark:text-teal-400 text-sm font-semibold rounded-lg bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors"
                  >
                    <Plus size={16} /> Add Experience
                  </button>
                </div>
              ) : (
                <div className="p-6 bg-teal-50 dark:bg-teal-900/10 rounded-xl border border-teal-100 dark:border-teal-900 text-teal-800 dark:text-teal-300 italic">
                  Since you're a fresher, we will skip the professional
                  experience section.
                </div>
              )}
            </div>
          )}

          {/* STEP 3: EDUCATION */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-app-text mb-2">
                  Education Background
                </h2>
                <p className="text-app-text-muted">
                  List your degrees, certifications, or schools.
                </p>
              </div>

              <div className="space-y-6">
                {(data.educations || []).map((edu, i) => (
                  <div
                    key={edu.id}
                    className="p-4 rounded-xl border border-app-border bg-app-surface/50 relative"
                  >
                    <button
                      onClick={() =>
                        setData((p) => ({
                          ...p,
                          educations: p.educations.filter(
                            (e) => e.id !== edu.id,
                          ),
                        }))
                      }
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                    <h4 className="font-semibold text-app-text mb-4">
                      Education #{i + 1}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-app-text-secondary mb-1">
                          Degree / Qualification
                        </label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) =>
                            updateEducation(edu.id, "degree", e.target.value)
                          }
                          className="w-full rounded-lg border border-app-border bg-app-bg p-2 text-sm outline-none focus:border-teal-500 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-app-text-secondary mb-1">
                          School / University
                        </label>
                        <input
                          type="text"
                          value={edu.school}
                          onChange={(e) =>
                            updateEducation(edu.id, "school", e.target.value)
                          }
                          className="w-full rounded-lg border border-app-border bg-app-bg p-2 text-sm outline-none focus:border-teal-500 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-app-text-secondary mb-1">
                          Start Date
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Sep 2018"
                          value={edu.startDate}
                          onChange={(e) =>
                            updateEducation(edu.id, "startDate", e.target.value)
                          }
                          className="w-full rounded-lg border border-app-border bg-app-bg p-2 text-sm outline-none focus:border-teal-500 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-app-text-secondary mb-1">
                          End Date
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. May 2022"
                          value={edu.endDate}
                          onChange={(e) =>
                            updateEducation(edu.id, "endDate", e.target.value)
                          }
                          className="w-full rounded-lg border border-app-border bg-app-bg p-2 text-sm outline-none focus:border-teal-500 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-app-text-secondary mb-1">
                          GPA / Grade (Optional)
                        </label>
                        <input
                          type="text"
                          value={edu.gpa}
                          onChange={(e) =>
                            updateEducation(edu.id, "gpa", e.target.value)
                          }
                          className="w-full rounded-lg border border-app-border bg-app-bg p-2 text-sm outline-none focus:border-teal-500 dark:text-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-app-text-secondary mb-1">
                          Additional Note (Awards, honors, etc)
                        </label>
                        <textarea
                          value={edu.note}
                          onChange={(e) =>
                            updateEducation(edu.id, "note", e.target.value)
                          }
                          className="w-full rounded-lg border border-app-border bg-app-bg p-2 text-sm outline-none focus:border-teal-500 dark:text-white min-h-[60px]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() =>
                    setData((p) => ({
                      ...p,
                      educations: [
                        ...p.educations,
                        {
                          id: generateId(),
                          degree: "",
                          school: "",
                          startDate: "",
                          endDate: "",
                          gpa: "",
                          note: "",
                        },
                      ],
                    }))
                  }
                  className="flex items-center gap-2 px-4 py-2 text-teal-600 dark:text-teal-400 text-sm font-semibold rounded-lg bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors"
                >
                  <Plus size={16} /> Add Education
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SKILLS */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-app-text mb-2">
                  Technical & Soft Skills
                </h2>
                <p className="text-app-text-muted">
                  Add skills that match your target role. Use AI to generate
                  suggestions.
                </p>
              </div>

              <div className="p-5 border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                    Skill Category / Job Title
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={skillCategory}
                      onChange={(e) => setSkillCategory(e.target.value)}
                      placeholder="e.g. Software Engineer, Marketing, Design..."
                      className="flex-1 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-app-bg p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white"
                    />
                    <button
                      onClick={() => fetchAiSkills()}
                      disabled={generatingSkills}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      {generatingSkills ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Sparkles size={16} />
                      )}
                      Generate Ideas
                    </button>
                  </div>
                  {!generatingSkills && (
                    <p className="text-xs text-slate-500 mt-2">
                      Professional AI suggestions available.
                    </p>
                  )}
                </div>

                {aiSkills.length > 0 && (
                  <div className="pt-2 border-t border-indigo-100 dark:border-indigo-800/50">
                    <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-400 mb-3 uppercase tracking-wider">
                      Suggested (Click to Add)
                    </p>
                    <div className="flex flex-wrap gap-2 text-sm">
                      {aiSkills.map((skill) => {
                        const added = (data.skills || []).includes(skill);
                        return (
                          <button
                            key={skill}
                            onClick={() => {
                              if (added) return;
                              setData((p) => ({
                                ...p,
                                skills: [...p.skills, skill],
                              }));
                            }}
                            className={`px-3 py-1.5 rounded-full border transition-all ${added ? "bg-indigo-100 border-indigo-200 text-indigo-400 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-500 cursor-not-allowed" : "bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 dark:bg-slate-900 dark:border-indigo-700 dark:text-indigo-300 shadow-sm"}`}
                          >
                            {skill} {added && "✓"}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => fetchAiSkills(true)}
                      disabled={generatingSkills}
                      className="mt-4 text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 underline decoration-indigo-300 underline-offset-4"
                    >
                      + Load 10 more suggestions
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-app-text-secondary mb-3">
                  Your Selected Skills
                </label>
                <div className="flex flex-wrap gap-2 p-4 min-h-[120px] rounded-xl border-2 border-dashed border-app-border bg-app-surface/50">
                  {data.skills.length === 0 && (
                    <span className="text-slate-400 text-sm m-auto">
                      No skills added yet. Select from above or type below.
                    </span>
                  )}
                  {data.skills.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-500 text-white text-sm shadow-sm group"
                    >
                      {s}
                      <button
                        onClick={() =>
                          setData((p) => ({
                            ...p,
                            skills: p.skills.filter((_, idx) => idx !== i),
                          }))
                        }
                        className="bg-teal-600 rounded-full p-0.5 opacity-70 hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    id="manual-skill"
                    placeholder="Type a skill..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const val = (
                          e.currentTarget as HTMLInputElement
                        ).value.trim();
                        if (val && !data.skills.includes(val))
                          setData((p) => ({
                            ...p,
                            skills: [...p.skills, val],
                          }));
                        e.currentTarget.value = "";
                      }
                    }}
                    className="flex-1 rounded-lg border border-app-border bg-app-bg p-2.5 text-sm outline-none focus:border-teal-500 dark:text-white"
                  />
                  <button
                    onClick={() => {
                      const el = document.getElementById(
                        "manual-skill",
                      ) as HTMLInputElement;
                      const val = el.value.trim();
                      if (val && !data.skills.includes(val))
                        setData((p) => ({ ...p, skills: [...p.skills, val] }));
                      el.value = "";
                    }}
                    className="px-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-app-text rounded-lg text-sm font-semibold transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: SUMMARY */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-app-text mb-2">
                  Professional Summary
                </h2>
                <p className="text-app-text-muted">
                  Write a quick summary. You can use AI to build a strong
                  professional profile based on your inputs.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                <button
                  onClick={generateSummary}
                  disabled={generatingSummary}
                  className="p-2.5 bg-linear-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2 group"
                  title="AI Rewrite & Expand"
                >
                  {generatingSummary ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Sparkles size={18} />
                  )}
                  AI Generate Summary
                </button>

                <button
                  onClick={extendSummary}
                  disabled={extendingSummary || !data.summary}
                  className="flex items-center gap-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50 border border-indigo-200 dark:border-indigo-800/50"
                >
                  {extendingSummary ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Sparkles size={18} />
                  )}
                  Extend AI
                </button>

              </div>
                <textarea
                  value={data.summary}
                  onChange={(e) =>
                    setData((p) => ({ ...p, summary: e.target.value }))
                  }
                  className="w-full rounded-xl border border-app-border bg-app-bg p-4 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 dark:text-white min-h-[200px] leading-relaxed resize-y"
                  placeholder="A highly motivated professional with..."
                />
              </div>
            </div>
          )}

          {/* STEP 6: ADDITIONAL */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-app-text mb-2">
                  Additional Information
                </h2>
                <p className="text-app-text-muted">
                  Fill in any extra details that add value to your resume.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-app-text-secondary">
                      Languages
                    </label>
                    <button
                      onClick={() =>
                        setData((p) => ({
                          ...p,
                          additional: {
                            ...p.additional,
                            languages: [
                              ...p.additional.languages,
                              {
                                id: generateId(),
                                language: "",
                                proficiency: "",
                              },
                            ],
                          },
                        }))
                      }
                      className="text-teal-600 dark:text-teal-400 text-xs font-semibold hover:underline"
                    >
                      + Add Language
                    </button>
                  </div>
                  {(data.additional?.languages || []).map((lang, index) => (
                    <div key={lang.id} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Language (e.g. Spanish)"
                        value={lang.language}
                        onChange={(e) =>
                          setData((p) => ({
                            ...p,
                            additional: {
                              ...p.additional,
                              languages: p.additional.languages.map((l) =>
                                l.id === lang.id
                                  ? { ...l, language: e.target.value }
                                  : l,
                              ),
                            },
                          }))
                        }
                        className="w-1/2 rounded-lg border border-app-border bg-app-bg p-2 text-sm outline-none focus:border-teal-500 dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="Proficiency (e.g. Fluent)"
                        value={lang.proficiency}
                        onChange={(e) =>
                          setData((p) => ({
                            ...p,
                            additional: {
                              ...p.additional,
                              languages: p.additional.languages.map((l) =>
                                l.id === lang.id
                                  ? { ...l, proficiency: e.target.value }
                                  : l,
                              ),
                            },
                          }))
                        }
                        className="w-1/2 rounded-lg border border-app-border bg-app-bg p-2 text-sm outline-none focus:border-teal-500 dark:text-white"
                      />
                      <button
                        onClick={() =>
                          setData((p) => ({
                            ...p,
                            additional: {
                              ...p.additional,
                              languages: p.additional.languages.filter(
                                (l) => l.id !== lang.id,
                              ),
                            },
                          }))
                        }
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-app-text-secondary mb-1">
                    Certificates (URLs or Names)
                  </label>
                  <textarea
                    value={data.additional?.certificates || ""}
                    onChange={(e) =>
                      updateAdditional("certificates", e.target.value)
                    }
                    className="w-full rounded-lg border border-app-border bg-app-bg p-3 text-sm outline-none focus:border-teal-500 dark:text-white min-h-[80px]"
                    placeholder="AWS Certified Architect, https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-app-text-secondary mb-1">
                    Extracurricular Activities
                  </label>
                  <textarea
                    value={data.additional.extracurriculars}
                    onChange={(e) =>
                      updateAdditional("extracurriculars", e.target.value)
                    }
                    className="w-full rounded-lg border border-app-border bg-app-bg p-3 text-sm outline-none focus:border-teal-500 dark:text-white min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-app-text-secondary mb-1">
                    Awards
                  </label>
                  <textarea
                    value={data.additional.awards}
                    onChange={(e) => updateAdditional("awards", e.target.value)}
                    className="w-full rounded-lg border border-app-border bg-app-bg p-3 text-sm outline-none focus:border-teal-500 dark:text-white min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-app-text-secondary mb-1">
                    Other (Hobbies, Volunteering)
                  </label>
                  <textarea
                    value={data.additional.other}
                    onChange={(e) => updateAdditional("other", e.target.value)}
                    className="w-full rounded-lg border border-app-border bg-app-bg p-3 text-sm outline-none focus:border-teal-500 dark:text-white min-h-[80px]"
                  />
                </div>
              </div>
            </div>
          )}

          
          {/* STEP 7: ADDITIONAL */}
          {step === 7 && (
            <div className="space-y-6 animate-in slide-in-from-right">
              <div>
                <h2 className="text-2xl font-bold text-app-text mb-2">
                  Additional Information (Optional)
                </h2>
                <p className="text-app-text-secondary">
                  Add any other sections you'd like on your resume.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-app-text mb-1">
                    Languages
                  </label>
                  <p className="text-xs text-app-text-secondary mb-3">
                    Click "Next" to skip if not applicable.
                  </p>
                  
                  {data.additional.languages.map((lang, index) => (
                    <div key={lang.id} className="flex items-center gap-3 mb-3">
                      <input
                        value={lang.language}
                        onChange={(e) => {
                          const newLangs = [...data.additional.languages];
                          newLangs[index].language = e.target.value;
                          setData((p) => ({ ...p, additional: { ...p.additional, languages: newLangs } }));
                        }}
                        className="flex-1 rounded-lg border border-app-border bg-app-bg p-3 text-sm outline-none focus:border-teal-500 dark:text-white"
                        placeholder="e.g. Spanish"
                      />
                      <select
                        value={lang.proficiency}
                        onChange={(e) => {
                          const newLangs = [...data.additional.languages];
                          newLangs[index].proficiency = e.target.value;
                          setData((p) => ({ ...p, additional: { ...p.additional, languages: newLangs } }));
                        }}
                        className="w-40 rounded-lg border border-app-border bg-app-bg p-3 text-sm outline-none focus:border-teal-500 dark:text-white"
                      >
                        <option>Native</option>
                        <option>Fluent</option>
                        <option>Intermediate</option>
                        <option>Basic</option>
                      </select>
                      <button
                        onClick={() => {
                          const newLangs = data.additional.languages.filter(l => l.id !== lang.id);
                          setData((p) => ({ ...p, additional: { ...p.additional, languages: newLangs } }));
                        }}
                        className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => {
                      setData((p) => ({
                        ...p,
                        additional: {
                          ...p.additional,
                          languages: [...p.additional.languages, { id: generateId(), language: "", proficiency: "Fluent" }]
                        }
                      }));
                    }}
                    className="flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400 font-semibold hover:underline"
                  >
                    <Plus size={16} /> Add Language
                  </button>
                </div>

                <div className="pt-4 border-t border-app-border">
                  <label className="block text-sm font-medium text-app-text mb-1">
                    Certifications & Awards
                  </label>
                  <textarea
                    value={data.additional.certificates}
                    onChange={(e) => updateAdditional("certificates", e.target.value)}
                    className="w-full rounded-lg border border-app-border bg-app-bg p-3 text-sm outline-none focus:border-teal-500 dark:text-white min-h-[80px]"
                    placeholder="e.g. AWS Certified Solutions Architect (2023)"
                  />
                </div>

                <div className="pt-4 border-t border-app-border">
                  <label className="block text-sm font-medium text-app-text mb-1">
                    Extracurriculars / Volunteering
                  </label>
                  <textarea
                    value={data.additional.extracurriculars}
                    onChange={(e) => updateAdditional("extracurriculars", e.target.value)}
                    className="w-full rounded-lg border border-app-border bg-app-bg p-3 text-sm outline-none focus:border-teal-500 dark:text-white min-h-[80px]"
                  />
                </div>

                <div className="pt-4 border-t border-app-border">
                  <label className="block text-sm font-medium text-app-text mb-1">
                    Other Notes
                  </label>
                  <textarea
                    value={data.additional.other}
                    onChange={(e) => updateAdditional("other", e.target.value)}
                    className="w-full rounded-lg border border-app-border bg-app-bg p-3 text-sm outline-none focus:border-teal-500 dark:text-white min-h-[80px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: TEMPLATE SELECTION */}
          {step === 8 && (
            <div className="space-y-6 animate-in slide-in-from-right">
              <div>
                <h2 className="text-2xl font-bold text-app-text mb-2">
                  Select Template Design
                </h2>
                <p className="text-app-text-secondary">
                  Choose a visual layout for your resume.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => setData({ ...data, templateId: tpl.id })}
                    className={`flex flex-col text-left p-3 rounded-xl bg-app-surface border shadow-sm transition-all group overflow-hidden relative ${
                      data.templateId === tpl.id
                        ? "border-teal-500 ring-2 ring-teal-500 ring-offset-2 ring-offset-app-bg"
                        : "border-app-border hover:border-app-accent hover:shadow-md"
                    }`}
                  >
                    <div className="flex justify-center bg-white dark:bg-slate-700/50 rounded overflow-hidden w-full relative pt-2 border border-slate-200 dark:border-slate-600 mb-3">
                      <MiniPreview elements={tpl.elements("preview-page", data)} />
                    </div>
                    <h4 className={`text-sm font-semibold ${data.templateId === tpl.id ? "text-teal-600 dark:text-teal-400" : "text-app-text"}`}>{tpl.name}</h4>
                    <p className="text-xs text-app-text-secondary line-clamp-1">{tpl.category}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center bg-app-surface p-4 rounded-2xl shadow-sm border border-app-border z-10 sticky bottom-4">
          {step === 1 ? (
            <button
              onClick={handleCancel}
              className="px-6 py-2.5 rounded-xl font-semibold text-app-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-app-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft size={18} /> Back
            </button>
          )}

          {step < totalSteps ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-semibold transition-transform hover:scale-105 active:scale-95 shadow-md shadow-teal-500/20"
            >
              Next <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-2 px-8 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold transition-transform hover:scale-105 active:scale-95 shadow-md shadow-indigo-500/20"
            >
              Finish & Download JSON <Check size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
