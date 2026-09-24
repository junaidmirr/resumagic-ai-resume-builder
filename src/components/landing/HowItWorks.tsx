import React from "react";
import { Upload, Edit3, Target, Download } from "lucide-react";

const workflowSteps = [
  {
    number: "01",
    title: "Input Career Milestones",
    description:
      "Upload an existing resume PDF or start clean. The parser accurately extracts job titles, companies, dates, and duties into editable fields.",
    icon: Upload,
  },
  {
    number: "02",
    title: "Quantify Impact",
    description:
      "Refine passive responsibilities into verifiable achievements using the STAR methodology (Situation, Task, Action, Result).",
    icon: Edit3,
  },
  {
    number: "03",
    title: "Align with Target Role",
    description:
      "Input the job description to inspect keyword coverage. Verify that required skills, frameworks, and methodologies are explicitly represented.",
    icon: Target,
  },
  {
    number: "04",
    title: "Export Vector PDF",
    description:
      "Download a crisp, vector-standard PDF with preserved text selectable layers that pass automated screeners without layout corruption.",
    icon: Download,
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-20 bg-app-bg border-b border-app-border"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-16">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-medium mb-4 border border-app-border">
            <span>Workflow</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-app-text mb-4">
            How Resumagic prepares your application.
          </h2>
          <p className="text-base text-app-text-secondary leading-relaxed">
            A structured four-step process built to turn raw work history into a
            recruiter-ready document.
          </p>
        </div>

        {/* Linear Step Progression */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {workflowSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="bg-app-surface border border-app-border rounded-lg p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500">
                      STEP {step.number}
                    </span>
                    <div className="w-8 h-8 rounded border border-app-border bg-app-bg flex items-center justify-center text-slate-700 dark:text-slate-300">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-app-text mb-2">
                    {step.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-app-text-secondary leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
