import React from "react";
import {
  ShieldCheck,
  AlignLeft,
  Search,
  Layers,
  FileCheck,
} from "lucide-react";

const technicalCapabilities = [
  {
    icon: ShieldCheck,
    title: "Vector PDF Layering",
    tagline: "Readable by every standard ATS engine",
    description:
      "Many design tools export flattened raster images or convoluted nested HTML tables that break text parsers. Resumagic compiles clean single-stream vector PDFs with strict unicode character encoding, ensuring systems like Workday, Greenhouse, and Lever parse every line flawlessly.",
  },
  {
    icon: AlignLeft,
    title: "Action-Driven Bullet Structure",
    tagline: "Designed for 6-second recruiter scans",
    description:
      "Hiring managers scan resumes in seconds, looking for tangible outcomes rather than job descriptions. The built-in assistant checks your phrasing for strong action verbs, project scope, and quantified percentages to demonstrate clear business impact.",
  },
  {
    icon: Search,
    title: "Job Requirement Gap Analysis",
    tagline: "Align with role-specific competencies",
    description:
      "Compare your draft against the exact requirements of a target job description. Identify missing domain skills, certifications, and technical tools to ensure your application reflects the qualifications the hiring team is filtering for.",
  },
];

export function Features() {
  return (
    <section
      id="features"
      className="py-20 bg-app-surface border-b border-app-border"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-16">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-medium mb-4 border border-app-border">
            <span>Core Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-app-text mb-4">
            Engineered around recruiter evaluation standards.
          </h2>
          <p className="text-base text-app-text-secondary leading-relaxed">
            Every feature in Resumagic serves a functional purpose: eliminating
            technical formatting errors that cause automated disqualifications
            and structuring your experience for maximum readability.
          </p>
        </div>

        {/* Technical Capabilities Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {technicalCapabilities.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="bg-app-bg border border-app-border rounded-lg p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded border border-app-border bg-app-surface flex items-center justify-center text-slate-800 dark:text-slate-200 mb-5">
                    <Icon className="w-5 h-5" />
                  </div>

                  <span className="text-[11px] font-mono font-semibold uppercase text-slate-500 tracking-wider block mb-1.5">
                    {item.tagline}
                  </span>

                  <h3 className="text-lg font-bold text-app-text mb-3">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-app-text-secondary leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-app-border flex items-center gap-2 text-xs font-mono text-slate-500">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Verified Standard</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison / Verification Box */}
        <div className="mt-12 bg-app-bg border border-app-border rounded-lg p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5">
              <span className="text-[11px] font-mono font-semibold uppercase text-slate-500 block mb-1">
                Technical Specification
              </span>
              <h4 className="text-xl font-bold text-app-text mb-3">
                Why typical Canva & design-tool resumes fail ATS screeners
              </h4>
              <p className="text-xs sm:text-sm text-app-text-secondary leading-relaxed">
                Design tools prioritize visual freedom over document structure,
                producing overlapping text boxes, unindexed glyphs, and
                irregular reading orders. When an ATS strips these files,
                critical experience entries get scrambled or lost.
              </p>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded border border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20">
                <span className="text-rose-700 dark:text-rose-400 font-bold block mb-2">
                  ✕ Generic Graphic Templates
                </span>
                <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
                  <li>• Multi-column text flow confuses parsers</li>
                  <li>• Icons used without alt-text tags</li>
                  <li>• Unlinked header contact fields</li>
                  <li>• Flattens text into unsearchable images</li>
                </ul>
              </div>

              <div className="p-4 rounded border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20">
                <span className="text-emerald-700 dark:text-emerald-400 font-bold block mb-2">
                  ✓ Resumagic Clean Vector Spec
                </span>
                <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
                  <li>• Linear sequential reading order</li>
                  <li>• 100% selectable UTF-8 text layer</li>
                  <li>• Standard section heading tokens</li>
                  <li>• Standard margin and line-height grid</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Features;
