import { motion } from 'framer-motion';
import { LayoutTemplate, Sparkles, Target, Download } from 'lucide-react';

const steps = [
  {
    id: 1,
    title: "Select HR-Approved Layout",
    description: "Start with executive, modern, or tech layouts crafted by Talent Acquisition Directors.",
    icon: <LayoutTemplate className="w-6 h-6 text-teal-500" />,
    color: "from-teal-500/20 to-teal-500/5 border-teal-500/30"
  },
  {
    id: 2,
    title: "Import PDF or Let AI Draft",
    description: "Upload your current PDF resume or enter your target role to generate STAR-format bullets.",
    icon: <Sparkles className="w-6 h-6 text-emerald-500" />,
    color: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30"
  },
  {
    id: 3,
    title: "Tailor to Target Job",
    description: "Paste the job description to automatically match keywords recruiters screen for.",
    icon: <Target className="w-6 h-6 text-amber-500" />,
    color: "from-amber-500/20 to-amber-500/5 border-amber-500/30"
  },
  {
    id: 4,
    title: "Download ATS-Compliant PDF",
    description: "Export a 100% vector PDF guaranteed to pass automated screeners and land interviews.",
    icon: <Download className="w-6 h-6 text-cyan-500" />,
    color: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30"
  }
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-app-bg relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-extrabold text-app-text mb-6"
          >
            From Blank Canvas to Interview Invite in 3 Steps
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-app-text-secondary"
          >
            A simple, recruiter-proven process designed to land your application at the top of the pile.
          </motion.p>
        </div>

        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent -translate-y-1/2 z-0"></div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, index) => (
              <motion.div 
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                className="flex flex-col items-center text-center group glass-card p-6 rounded-3xl border border-app-border hover:border-teal-500/40 transition-all"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} border flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                  {step.icon}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-teal-500 uppercase tracking-widest">STEP 0{step.id}</span>
                </div>
                <h3 className="text-lg font-bold text-app-text mb-2">{step.title}</h3>
                <p className="text-sm text-app-text-secondary leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
