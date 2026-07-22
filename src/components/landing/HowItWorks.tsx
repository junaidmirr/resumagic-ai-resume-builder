import { motion } from 'framer-motion';
import { LayoutTemplate, Sparkles, SlidersHorizontal, Download } from 'lucide-react';

const steps = [
  {
    id: 1,
    title: "Choose a Template",
    description: "Start with one of our premium, ATS-optimized templates designed by industry experts.",
    icon: <LayoutTemplate className="w-6 h-6 text-brand-primary" />,
    color: "from-brand-primary/20 to-brand-primary/5 border-brand-primary/20"
  },
  {
    id: 2,
    title: "AI Drafts Content",
    description: "Provide your job title and brief context. Our AI generates a full professional draft in seconds.",
    icon: <Sparkles className="w-6 h-6 text-brand-accent" />,
    color: "from-brand-accent/20 to-brand-accent/5 border-brand-accent/20"
  },
  {
    id: 3,
    title: "Edit Visually",
    description: "Tweak colors, spacing, and use the AI Assistant to refine specific bullets and keywords.",
    icon: <SlidersHorizontal className="w-6 h-6 text-brand-secondary" />,
    color: "from-brand-secondary/20 to-brand-secondary/5 border-brand-secondary/20"
  },
  {
    id: 4,
    title: "Export & Apply",
    description: "Download a pixel-perfect PDF that looks exactly like it does on your screen.",
    icon: <Download className="w-6 h-6 text-brand-success" />,
    color: "from-brand-success/20 to-brand-success/5 border-brand-success/20"
  }
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-app-bg relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-extrabold text-app-text mb-6"
          >
            How it works
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-app-text-secondary"
          >
            A streamlined workflow designed to get you from a blank page to a stunning PDF in minutes.
          </motion.p>
        </div>

        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-app-border to-transparent -translate-y-1/2 z-0"></div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, index) => (
              <motion.div 
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                className="flex flex-col items-center text-center group"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} border flex items-center justify-center mb-6 shadow-xl shadow-black/5 group-hover:scale-110 transition-transform duration-300`}>
                  {step.icon}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-app-text-muted">STEP 0{step.id}</span>
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
