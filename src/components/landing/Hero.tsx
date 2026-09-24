import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  ChevronRight,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Terminal,
  AlignLeft,
} from "lucide-react";
import { useAuthModal } from "../onboarding/AuthModalContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export function Hero() {
  const { openModal } = useAuthModal();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "preview" | "ats_parser" | "bullet_guide"
  >("preview");

  const handleCTA = () => {
    if (user) {
      navigate("/build");
    } else {
      openModal({ title: "Start Building Your Resume" });
    }
  };

  const handleImportCTA = () => {
    if (user) {
      navigate("/onboarding?action=import");
    } else {
      openModal({ title: "Import Your Existing Resume" });
    }
  };

  return (
    <section className="pt-28 pb-16 md:pt-36 md:pb-20 border-b border-app-border bg-app-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Header Section */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-medium mb-6 border border-app-border">
            <span>ATS-Compliant Document Engine</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-app-text leading-[1.12] mb-6">
            Resumes formatted for how recruiters actually read.
          </h1>

          <p className="text-base sm:text-lg text-app-text-secondary leading-relaxed mb-8">
            Applicant tracking systems and hiring managers look for clear
            structural hierarchy, standard typography, and quantified impact.
            Resumagic outputs clean vector PDFs that parse accurately on
            Workday, Greenhouse, and Lever without broken layouts.
          </p>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleCTA}
              className="px-5 py-3 rounded-lg font-medium text-sm text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Create Resume</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleImportCTA}
              className="px-5 py-3 rounded-lg font-medium text-sm text-app-text bg-app-surface border border-app-border hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Upload className="w-4 h-4 text-app-text-secondary" />
              <span>Import Existing PDF</span>
            </button>
          </div>
        </div>

        {/* Real Product Proof & Interactive Preview */}
        <div className="bg-app-surface border border-app-border rounded-lg shadow-sm overflow-hidden">
          {/* Navigation Bar inside Preview */}
          <div className="flex items-center justify-between border-b border-app-border bg-slate-50/70 dark:bg-slate-900/40 px-4 py-2 text-xs">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1.5 rounded font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === "preview"
                    ? "bg-app-surface text-app-text border border-app-border shadow-2xs font-semibold"
                    : "text-app-text-secondary hover:text-app-text"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Document Layout
              </button>

              <button
                onClick={() => setActiveTab("ats_parser")}
                className={`px-3 py-1.5 rounded font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === "ats_parser"
                    ? "bg-app-surface text-app-text border border-app-border shadow-2xs font-semibold"
                    : "text-app-text-secondary hover:text-app-text"
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                ATS Parser View
              </button>

              <button
                onClick={() => setActiveTab("bullet_guide")}
                className={`px-3 py-1.5 rounded font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === "bullet_guide"
                    ? "bg-app-surface text-app-text border border-app-border shadow-2xs font-semibold"
                    : "text-app-text-secondary hover:text-app-text"
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
                Bullet Point Rewriter
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-slate-500 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Vector Standard 100% Readable</span>
            </div>
          </div>

          {/* Interactive Pane Content */}
          <div className="p-6 md:p-8 bg-app-bg/30">
            <AnimatePresence mode="wait">
              {/* Tab 1: Authentic Clean Document Preview */}
              {activeTab === "preview" && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-app-border p-8 rounded shadow-xs text-left"
                >
                  <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-5">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                      Elena Rostova
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-mono">
                      San Francisco, CA • elena.rostova@example.com • +1 (415)
                      555-0182 • linkedin.com/in/erostova
                    </p>
                  </div>

                  <div className="space-y-5 text-xs text-slate-700 dark:text-slate-300">
                    <div>
                      <h3 className="font-bold uppercase tracking-wider text-[11px] text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-1 mb-2">
                        Professional Experience
                      </h3>

                      <div className="mb-3">
                        <div className="flex justify-between items-baseline font-semibold text-slate-900 dark:text-slate-100">
                          <span>Staff Product Engineer • Meridian Systems</span>
                          <span className="text-slate-500 font-normal font-mono text-[11px]">
                            2022 — Present
                          </span>
                        </div>
                        <ul className="list-disc list-outside ml-4 space-y-1 mt-1.5 text-slate-600 dark:text-slate-300 leading-relaxed">
                          <li>
                            Architected distributed document rendering service
                            handling 1.8M exports monthly, decreasing
                            99th-percentile PDF generation latency by 42%.
                          </li>
                          <li>
                            Introduced strict UTF-8 bounding boxes for automated
                            parsers, achieving zero field-extraction errors
                            across 4 major enterprise ATS platforms.
                          </li>
                          <li>
                            Mentored 6 engineers through technical design
                            reviews and established standardized automated unit
                            testing for document pipelines.
                          </li>
                        </ul>
                      </div>

                      <div>
                        <div className="flex justify-between items-baseline font-semibold text-slate-900 dark:text-slate-100">
                          <span>
                            Software Engineer • ScalePoint Technologies
                          </span>
                          <span className="text-slate-500 font-normal font-mono text-[11px]">
                            2019 — 2022
                          </span>
                        </div>
                        <ul className="list-disc list-outside ml-4 space-y-1 mt-1.5 text-slate-600 dark:text-slate-300 leading-relaxed">
                          <li>
                            Redesigned billing and subscription state machines
                            in TypeScript, reducing client checkout
                            reconciliation mismatches from 2.4% to 0.05%.
                          </li>
                          <li>
                            Collaborated directly with customer success and
                            hiring leads to develop custom data export pipelines
                            for recruiting compliance.
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold uppercase tracking-wider text-[11px] text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-1 mb-2">
                        Education & Technical Skills
                      </h3>
                      <div className="flex justify-between items-baseline font-semibold text-slate-900 dark:text-slate-100">
                        <span>
                          B.S. in Computer Science • University of Washington
                        </span>
                        <span className="text-slate-500 font-normal font-mono text-[11px]">
                          2015 — 2019
                        </span>
                      </div>
                      <p className="mt-1 text-slate-600 dark:text-slate-300">
                        <strong>Technical Proficiencies:</strong> TypeScript,
                        React, Node.js, PostgreSQL, Docker, AWS (S3, Lambda,
                        ECS), Vector PDF standards, CI/CD pipelines.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tab 2: ATS Machine Parser View */}
              {activeTab === "ats_parser" && (
                <motion.div
                  key="ats_parser"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="max-w-3xl mx-auto font-mono text-xs text-left"
                >
                  <div className="bg-slate-950 text-slate-200 rounded p-6 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400 text-[11px]">
                      <span>
                        PARSER: Greenhouse & Workday Tokenizer (RFC-compliant
                        text layer)
                      </span>
                      <span className="text-emerald-400 font-semibold">
                        STATUS: 100% EXTRACTED
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="text-slate-400">
                        // Extracted Candidate Header:
                      </div>
                      <div className="pl-3 border-l-2 border-slate-700 text-slate-300">
                        NAME: "Elena Rostova"
                        <br />
                        EMAIL: "elena.rostova@example.com"
                        <br />
                        PHONE: "+14155550182"
                        <br />
                        LOCATION: "San Francisco, CA"
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-slate-400">
                        // Experience Chronology (Zero Column Collisions):
                      </div>
                      <div className="pl-3 border-l-2 border-emerald-600/60 text-slate-300 space-y-1">
                        <div>
                          [0] ROLE: "Staff Product Engineer" | COMPANY:
                          "Meridian Systems" | DURATION: "2022 - Present"
                        </div>
                        <div className="text-slate-400 pl-4">
                          → METRIC DETECTED: "1.8M exports monthly", "latency
                          reduced by 42%"
                        </div>
                        <div>
                          [1] ROLE: "Software Engineer" | COMPANY: "ScalePoint
                          Technologies" | DURATION: "2019 - 2022"
                        </div>
                        <div className="text-slate-400 pl-4">
                          → METRIC DETECTED: "reconciliation errors 2.4% to
                          0.05%"
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 text-slate-400 text-[11px]">
                      Result: Clean linear stream without nested layout tables,
                      header collision, or missing metadata.
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tab 3: Bullet Guide */}
              {activeTab === "bullet_guide" && (
                <motion.div
                  key="bullet_guide"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="max-w-3xl mx-auto space-y-4 text-left"
                >
                  <div className="p-4 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <span className="text-[11px] font-mono font-semibold uppercase text-rose-600 dark:text-rose-400 block mb-1">
                      Ineffective Phrasing (Passive Job Description)
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                      "Responsible for working on backend PDF export code and
                      fixing bugs for customers."
                    </p>
                    <p className="text-[11px] text-slate-500 mt-2">
                      Recruiter review issue: Contains no evidence of scope,
                      volume, or business result.
                    </p>
                  </div>

                  <div className="p-4 rounded border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20">
                    <span className="text-[11px] font-mono font-semibold uppercase text-emerald-700 dark:text-emerald-400 block mb-1">
                      Structured Phrasing (Action + Context + Quantifiable
                      Result)
                    </span>
                    <p className="text-xs text-slate-900 dark:text-slate-100 font-medium">
                      "Architected distributed document rendering service
                      handling 1.8M exports monthly, decreasing 99th-percentile
                      PDF generation latency by 42%."
                    </p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-2 font-medium">
                      ✓ Clear ownership ("Architected") • Scale demonstrated
                      ("1.8M monthly") • Verifiable result ("42% latency
                      reduction").
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
