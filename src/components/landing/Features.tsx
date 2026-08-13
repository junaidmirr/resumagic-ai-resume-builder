import { motion } from 'framer-motion';
import { Award, Sparkles, Upload, ShieldCheck, Target, Layout, CheckCircle2, TrendingUp } from 'lucide-react';

const features = [
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "100% Recruiter ATS Pass Guarantee",
    description: "Built to pass automated Applicant Tracking Systems (Workday, Greenhouse, Lever). Never get rejected by invisible tables or bad formatting again.",
    color: "from-teal-500/20 text-teal-500"
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "STAR-Format Bullet Enhancer",
    description: "Transforms passive job duties into quantifiable achievement bullets. Automatically adds revenue metrics, team size, and growth KPIs hiring managers want to see.",
    color: "from-emerald-500/20 text-emerald-500"
  },
  {
    icon: <Target className="w-6 h-6" />,
    title: "Job Keyword Matcher",
    description: "Paste any job posting URL or description to align your resume with the exact skill keywords hiring managers filter for.",
    color: "from-amber-500/20 text-amber-500"
  },
  {
    icon: <Upload className="w-6 h-6" />,
    title: "1-Click PDF Resume Upgrader",
    description: "Upload your old PDF resume to instantly extract work history, correct syntax flaws, and upgrade your layout into an executive template.",
    color: "from-cyan-500/20 text-cyan-500"
  },
  {
    icon: <Layout className="w-6 h-6" />,
    title: "6-Second Eye-Scan Canvas",
    description: "Designed around eye-tracking research on how recruiters review candidates. Visual hierarchy that immediately highlights your top wins.",
    color: "from-purple-500/20 text-purple-500"
  },
  {
    icon: <Award className="w-6 h-6" />,
    title: "20+ Industry-Tested Templates",
    description: "Curated layouts for Tech & Engineering, Executive Corporate, Marketing, Data Science, and Creative Portfolios.",
    color: "from-rose-500/20 text-rose-500"
  }
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-app-surface border-y border-app-border relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-bold mb-6"
          >
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Built with HR & Hiring Managers</span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-extrabold text-app-text mb-6"
          >
            Features Designed to Get You Interviewed
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-app-text-secondary"
          >
            Stop guessing what recruiters want. Resumagic incorporates real hiring standards so your application stands out in every stack.
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
              className="group glass-card p-8 rounded-3xl hover-lift relative overflow-hidden border border-app-border hover:border-teal-500/40 transition-all"
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
