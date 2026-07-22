import { useState } from "react";
import { Navbar } from "../components/landing/Navbar";
import { Footer } from "../components/landing/Footer";
import { Briefcase, MapPin, Clock, ArrowRight, Sparkles, CheckCircle2, X } from "lucide-react";

interface JobOpening {
  id: string;
  title: string;
  department: "Engineering" | "AI & ML" | "Product" | "Growth";
  location: "Remote (Global)" | "San Francisco, CA" | "New York, NY";
  type: "Full-Time";
  description: string;
}

const JOBS: JobOpening[] = [
  {
    id: "job-1",
    title: "Senior Full Stack Web Engineer",
    department: "Engineering",
    location: "Remote (Global)",
    type: "Full-Time",
    description: "Lead frontend canvas state architecture and high-speed PDF export rendering pipelines."
  },
  {
    id: "job-2",
    title: "AI Prompt Engineer & Career Researcher",
    department: "AI & ML",
    location: "San Francisco, CA",
    type: "Full-Time",
    description: "Design structured AI prompt workflows, ATS keyword optimization models, and resume content generators."
  },
  {
    id: "job-3",
    title: "Staff Graphics & PDF Layout Engineer",
    department: "Engineering",
    location: "Remote (Global)",
    type: "Full-Time",
    description: "Optimize vector canvas rendering primitives, layout positioning algorithms, and document export performance."
  },
  {
    id: "job-4",
    title: "Head of Product Growth & Acquisition",
    department: "Growth",
    location: "New York, NY",
    type: "Full-Time",
    description: "Drive viral referral loops, template conversion optimization, and SEO content engine strategy."
  }
];

export function CareersPage() {
  const [selectedJob, setSelectedJob] = useState<JobOpening | null>(null);
  const [applied, setApplied] = useState(false);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setApplied(true);
    setTimeout(() => {
      setApplied(false);
      setSelectedJob(null);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-brand-primary/10 via-app-bg to-app-bg text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 text-brand-primary text-sm font-semibold mb-6">
            <Briefcase className="w-4 h-4" />
            Join the Resumagic Team
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 bg-gradient-to-r from-slate-900 via-brand-primary to-brand-accent dark:from-white dark:via-brand-primary dark:to-teal-400 bg-clip-text text-transparent">
            Help Us Build the Future of AI Productivity
          </h1>
          <p className="text-lg md:text-xl text-app-text-secondary max-w-3xl mx-auto leading-relaxed">
            We are a remote-first team of engineers, designers, and AI researchers building the world's most advanced resume platform.
          </p>
        </div>
      </section>

      {/* Culture & Perks */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="p-6 rounded-2xl bg-app-surface border border-app-border">
            <h3 className="font-bold text-lg mb-2">Remote-First Culture</h3>
            <p className="text-xs text-app-text-secondary leading-relaxed">Work from anywhere in the world with flexible hours and asynchronous communication.</p>
          </div>
          <div className="p-6 rounded-2xl bg-app-surface border border-app-border">
            <h3 className="font-bold text-lg mb-2">Top Tier Compensation</h3>
            <p className="text-xs text-app-text-secondary leading-relaxed">Competitive salary, meaningful equity, 401(k) matching, and full health coverage.</p>
          </div>
          <div className="p-6 rounded-2xl bg-app-surface border border-app-border">
            <h3 className="font-bold text-lg mb-2">Learning & Setup Stipend</h3>
            <p className="text-xs text-app-text-secondary leading-relaxed">$3,000 home office budget + $2,000 annual budget for books, courses, and conferences.</p>
          </div>
        </div>
      </section>

      {/* Open Roles */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <h2 className="text-2xl font-black mb-8">Open Positions ({JOBS.length})</h2>

        <div className="space-y-4">
          {JOBS.map((job) => (
            <div
              key={job.id}
              className="bg-app-surface rounded-2xl p-6 border border-app-border hover:border-brand-primary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-brand-primary/10 text-brand-primary">
                    {job.department}
                  </span>
                  <span className="text-xs text-app-text-muted flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {job.location}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-app-text mb-2">{job.title}</h3>
                <p className="text-xs text-app-text-secondary">{job.description}</p>
              </div>

              <button
                onClick={() => setSelectedJob(job)}
                className="px-6 py-3 rounded-xl font-bold bg-brand-primary text-white hover:bg-brand-primary-hover transition-colors text-sm whitespace-nowrap shadow-md shrink-0 flex items-center gap-2"
              >
                Apply Now <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Application Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-app-surface border border-app-border rounded-3xl p-8 max-w-lg w-full relative shadow-2xl">
            <button
              onClick={() => setSelectedJob(null)}
              className="absolute top-6 right-6 p-2 rounded-xl text-app-text-muted hover:bg-app-bg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-xs font-bold text-brand-primary mb-1 block">{selectedJob.department}</span>
            <h3 className="text-xl font-bold mb-4">{selectedJob.title}</h3>

            {applied ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-teal-500 mx-auto mb-3" />
                <h4 className="font-bold text-lg mb-1">Application Submitted!</h4>
                <p className="text-xs text-app-text-secondary">Our recruiting team will reach out to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label className="text-xs font-bold block mb-1">Full Name</label>
                  <input type="text" className="w-full px-4 py-2.5 rounded-xl bg-app-bg border border-app-border text-sm" required />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">Email Address</label>
                  <input type="email" className="w-full px-4 py-2.5 rounded-xl bg-app-bg border border-app-border text-sm" required />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">LinkedIn / Portfolio URL</label>
                  <input type="url" className="w-full px-4 py-2.5 rounded-xl bg-app-bg border border-app-border text-sm" required />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-bold bg-brand-primary text-white hover:bg-brand-primary-hover transition-colors text-sm shadow-md mt-4"
                >
                  Submit Application
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default CareersPage;
