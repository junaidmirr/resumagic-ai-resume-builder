import { motion } from 'framer-motion';
import { Bot, FileEdit, Zap, Layout, Search, Sparkles, Cpu, Upload, Layers, CheckCircle2 } from 'lucide-react';

const features = [
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "AI Resume Architect",
    description: "Generate professionally formatted resume drafts instantly. Type your job title and background to create tailored summary sections and achievement bullet points.",
    color: "from-brand-primary/20 text-brand-primary"
  },
  {
    icon: <Upload className="w-6 h-6" />,
    title: "Resume & LinkedIn PDF Importer",
    description: "Upload existing PDF resumes or LinkedIn profiles to extract work experience, skills, and education into editable design elements automatically.",
    color: "from-brand-accent/20 text-brand-accent"
  },
  {
    icon: <Layout className="w-6 h-6" />,
    title: "Visual Drag-and-Drop Editor",
    description: "Interactive canvas editor with drag-and-drop element positioning, custom font controls, multi-page support, and full undo/redo stack.",
    color: "from-brand-secondary/20 text-brand-secondary"
  },
  {
    icon: <Bot className="w-6 h-6" />,
    title: "Smart Career Assistant",
    description: "Integrated AI writing coach that enhances bullet points into STAR-format achievements, polishes executive summaries, and checks grammar.",
    color: "from-teal-500/20 text-teal-500"
  },
  {
    icon: <CheckCircle2 className="w-6 h-6" />,
    title: "99%+ ATS Score Optimization",
    description: "Built-in ATS scanner validation ensuring your resume structure, keyword density, and formatting pass recruiter screening systems flawlessly.",
    color: "from-purple-500/20 text-purple-500"
  },
  {
    icon: <Layers className="w-6 h-6" />,
    title: "20+ Professional Design Templates",
    description: "Choose from modern, minimal, executive, and creative theme presets designed to make a memorable impression.",
    color: "from-pink-500/20 text-pink-500"
  }
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-app-surface border-y border-app-border relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-accent/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-app-border bg-app-bg text-app-text-secondary text-sm font-semibold mb-6"
          >
            <Zap className="w-4 h-4 text-brand-warning" />
            <span>Complete Resume Platform</span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-extrabold text-app-text mb-6"
          >
            Everything Needed to Build Winning Resumes
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-app-text-secondary"
          >
            An intelligent suite of career writing tools, visual design controls, and ATS optimization.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group glass-card p-8 rounded-3xl hover-lift relative overflow-hidden border border-app-border hover:border-brand-primary/40 transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} border border-app-border flex items-center justify-center mb-6 shadow-sm`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-app-text mb-3">{feature.title}</h3>
              <p className="text-sm text-app-text-secondary leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
