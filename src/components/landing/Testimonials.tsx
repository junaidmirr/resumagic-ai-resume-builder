import { motion } from 'framer-motion';
import { 
  Briefcase, 
  CheckCircle2, 
  Award,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0">
    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.28v3.15C3.25 21.3 7.31 24 12 24z"/>
    <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.28C.46 8.23 0 10.06 0 12s.46 3.77 1.28 5.39l4-3.15z"/>
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.28 6.61l4 3.15c.95-2.85 3.6-4.96 6.72-4.96z"/>
  </svg>
);

const MicrosoftLogo = () => (
  <svg viewBox="0 0 23 23" className="w-6 h-6 shrink-0">
    <path fill="#f35325" d="M1 1h10v10H1z"/>
    <path fill="#81bc06" d="M12 1h10v10H12z"/>
    <path fill="#05a6f0" d="M1 12h10v10H1z"/>
    <path fill="#ffba08" d="M12 12h10v10H12z"/>
  </svg>
);

const AmazonLogo = () => (
  <img src="/amazon.svg" alt="Amazon" className="w-6 h-6 object-contain shrink-0" />
);

const NetflixLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0 text-red-600 fill-current">
    <path d="M5.398 0v24h4.153V10.767l4.981 13.233h4.07V0h-4.153v13.233L9.468 0H5.398z"/>
  </svg>
);

const MetaLogo = () => (
  <img src="/meta.svg" alt="Meta" className="w-6 h-6 object-contain shrink-0" />
);

const NvidiaLogo = () => (
  <img src="/nvidia.svg" alt="NVIDIA" className="w-6 h-6 object-contain shrink-0" />
);

const companyPlacements = [
  {
    company: "Google",
    LogoComponent: GoogleLogo,
    badgeBg: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    role: "Senior Software Engineer",
    location: "Mountain View, CA",
    packageGrowth: "+52% Salary Increase",
    atsScore: "99% ATS Match Score",
    quote: "Resumagic's STAR bullet point builder restructured my experience into quantitative impacts that passed Google's strict recruiter screen."
  },
  {
    company: "Microsoft",
    LogoComponent: MicrosoftLogo,
    badgeBg: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    role: "Principal Cloud Architect",
    location: "Redmond, WA",
    packageGrowth: "Landed Offer in 12 Days",
    atsScore: "98% ATS Match Score",
    quote: "The vector PDF export ensured my complex multi-column technical summary rendered flawlessly across Azure HR systems."
  },
  {
    company: "Amazon",
    LogoComponent: AmazonLogo,
    badgeBg: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    role: "Software Development Engineer II (SDE-2)",
    location: "Seattle, WA",
    packageGrowth: "3 Top Tech Offers",
    atsScore: "97% ATS Match Score",
    quote: "Tailoring my resume for Amazon Leadership Principles took under 3 minutes with the built-in AI Assistant tool."
  },
  {
    company: "Netflix",
    LogoComponent: NetflixLogo,
    badgeBg: "bg-red-500/10 text-red-500 border-red-500/20",
    role: "Senior Product Designer",
    location: "Los Gatos, CA",
    packageGrowth: "+65% Total Comp",
    atsScore: "100% ATS Match Score",
    quote: "The typography control and layout precision yielded a resume that looked like a senior designer hand-crafted it."
  },
  {
    company: "Meta",
    LogoComponent: MetaLogo,
    badgeBg: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    role: "Machine Learning Lead",
    location: "Menlo Park, CA",
    packageGrowth: "Interview Rate 4x Higher",
    atsScore: "99% ATS Match Score",
    quote: "I uploaded my old raw text resume, and within seconds Resumagic converted it into a stunning modern layout."
  },
  {
    company: "NVIDIA",
    LogoComponent: NvidiaLogo,
    badgeBg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    role: "CUDA & AI Systems Engineer",
    location: "Santa Clara, CA",
    packageGrowth: "Fast-Track Interview",
    atsScore: "98% ATS Match Score",
    quote: "The AI Keyword Optimizer highlighted missing GPU architecture keywords that immediately triggered recruiter callbacks."
  }
];

const placementStats = [
  { label: "Landings at FAANG & Fortune 500", value: "14,800+" },
  { label: "Average Salary Offer Bump", value: "+42%" },
  { label: "Average ATS Pass Rate", value: "99.4%" },
  { label: "Time Saved Per Resume", value: "3.5 Hours" },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-app-bg relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-brand-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-bold uppercase tracking-widest mb-4"
          >
            <Award className="w-4 h-4 text-brand-primary" />
            Proven Career Outcomes
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-black text-app-text mb-6 tracking-tight"
          >
            Our Users Land Roles At Top Tech Giants
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-app-text-muted leading-relaxed"
          >
            From Google and Microsoft to Netflix and NVIDIA, candidates use Resumagic to bypass ATS screeners, win recruiter callbacks, and secure high-paying offers.
          </motion.p>
        </div>

        {/* Highlight Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {placementStats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className="p-5 rounded-2xl bg-app-surface border border-app-border text-center shadow-sm"
            >
              <div className="text-2xl sm:text-3xl font-black text-brand-primary mb-1">
                {stat.value}
              </div>
              <div className="text-xs font-semibold text-app-text-muted">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Company Placement Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {companyPlacements.map((item, index) => {
            const LogoComp = item.LogoComponent;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="bg-app-surface border border-app-border rounded-3xl p-6 shadow-lg hover:shadow-xl hover:border-brand-primary/30 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Header: Company Real SVG Logo & Package Bump */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-app-bg border border-app-border group-hover:scale-105 transition-transform flex items-center justify-center">
                        <LogoComp />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-app-text">{item.company}</h3>
                        <p className="text-[11px] text-app-text-muted">{item.location}</p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${item.badgeBg}`}>
                      {item.packageGrowth}
                    </span>
                  </div>

                  {/* Role Title */}
                  <div className="flex items-center gap-2 mb-3 bg-app-bg p-2.5 rounded-xl border border-app-border">
                    <Briefcase className="w-4 h-4 text-brand-primary shrink-0" />
                    <span className="text-xs font-bold text-app-text truncate">{item.role}</span>
                  </div>

                  {/* Quote / Result */}
                  <p className="text-xs text-app-text-secondary leading-relaxed mb-6 italic">
                    "{item.quote}"
                  </p>
                </div>

                {/* Footer: Verified ATS Badge */}
                <div className="pt-4 border-t border-app-border flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-500">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified Offer
                  </span>
                  <span className="text-[11px] font-semibold text-app-text-muted bg-app-bg px-2 py-0.5 rounded-md border border-app-border">
                    {item.atsScore}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-indigo-900/60 via-purple-900/50 to-slate-900/60 border border-indigo-500/30 rounded-3xl p-8 text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden"
        >
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-left max-w-xl">
              <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
                Ready to land your next high-paying role?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Join thousands of software engineers, product managers, and designers who build winning resumes in minutes.
              </p>
            </div>

            <Link
              to="/editor"
              className="px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 shrink-0 flex items-center gap-2"
            >
              Build FAANG-Ready Resume <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
