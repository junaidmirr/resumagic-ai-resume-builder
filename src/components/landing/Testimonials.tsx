import React, { useState } from "react";
import {
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    question: "What actually happens when an ATS scans a resume?",
    answer:
      "Applicant Tracking Systems (such as Workday, Greenhouse, and Lever) strip away graphical styling and parse the underlying text stream into structured fields: candidate name, contact info, job titles, employers, dates, and bullet points. If a document uses complex HTML tables, canvas flattening, or non-standard fonts, the parser drops or scrambles text, leading to automated rejection before a recruiter ever reviews it.",
  },
  {
    question: "Why does Resumagic use single-page vector PDF export?",
    answer:
      "Vector PDFs preserve crisp, resolution-independent typography on high-DPI screens while maintaining 100% selectable UTF-8 text underneath. This ensures both automated machine parsers and human recruiters receive the exact same clean, uncorrupted reading experience.",
  },
  {
    question: "What is the STAR format, and why do recruiters demand it?",
    answer:
      "STAR stands for Situation, Task, Action, and Result. Traditional resumes list passive responsibilities (e.g. 'Handled customer support'). Recruiters look for business outcomes (e.g. 'Resolved 40+ daily enterprise tickets, maintaining 99% CSAT rating and reducing churn by 12%'). Resumagic prompts you to include measurable metrics in every bullet.",
  },
  {
    question: "Can I import my existing PDF resume to make updates?",
    answer:
      "Yes. You can upload an existing PDF resume at any time. Our parser extracts your work history, dates, degrees, and skills into structured form elements so you can edit, polish, and export without starting from scratch.",
  },
  {
    question:
      "Is my personal data or resume sold to recruiters or data brokers?",
    answer:
      "No. Your documents and data remain strictly yours. We do not sell candidate resumes, scrape your contact information, or monetize your job search history.",
  },
];

export function Testimonials() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      id="faq"
      className="py-20 bg-app-surface border-b border-app-border"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-medium mb-4 border border-app-border">
            <span>ATS Standards & Answers</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-app-text mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-base text-app-text-secondary leading-relaxed">
            Everything you need to know about resume parsing, formatting
            standards, and how Resumagic prepares your application.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="border border-app-border rounded-lg bg-app-bg transition-colors"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-semibold text-app-text">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-app-text" : ""
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 text-xs sm:text-sm text-app-text-secondary leading-relaxed border-t border-app-border/60 pt-3">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Direct Standards Checklist */}
        <div className="mt-12 p-6 rounded-lg border border-app-border bg-app-bg">
          <h3 className="text-sm font-mono uppercase font-bold text-app-text mb-4">
            Resumagic Pre-Flight Export Checklist
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-app-text-secondary">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>Standard reverse-chronological work history flow</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Searchable UTF-8 vector text layers without rasterization
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Standard section labels (Experience, Education, Skills)
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>Zero table boundaries or floating text box overlaps</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
