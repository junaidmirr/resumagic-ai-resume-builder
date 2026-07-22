import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Upload, ChevronRight, Wand2, Cpu, Zap, Activity, CheckCircle2, Layout, Layers, ShieldCheck } from 'lucide-react';
import { useAuthModal } from '../onboarding/AuthModalContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export function Hero() {
  const { openModal } = useAuthModal();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'architect' | 'import' | 'canvas' | 'assistant' | 'pdf'>('architect');

  const handleCTA = () => {
    if (user) {
      navigate('/build');
    } else {
      openModal({ title: "Log In to Build Your Resume" });
    }
  };

  return (
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-28 overflow-hidden flex flex-col items-center justify-center min-h-[92vh]">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-brand-primary/20 rounded-full blur-[140px] opacity-60 dark:opacity-45 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-brand-accent/20 rounded-full blur-[120px] opacity-40 dark:opacity-30"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-primary/30 bg-brand-primary/10 text-brand-primary text-xs md:text-sm font-bold mb-8 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-brand-primary animate-spin-slow" />
            <span>AI-Powered Resume Studio & ATS Optimization</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tight text-app-text mb-8 leading-[1.08]"
          >
            Create High-Impact Resumes <br className="hidden md:block" />
            <span className="text-gradient">That Land Top Interviews</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-app-text-secondary mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            Intelligent career content generation, instant LinkedIn & PDF resume import, visual drag-and-drop design customization, and 99%+ ATS pass rates.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <button 
              onClick={handleCTA}
              className="relative group px-8 py-4 rounded-2xl font-bold text-white overflow-hidden w-full sm:w-auto shadow-xl shadow-brand-primary/25 hover:shadow-brand-primary/40 transition-all hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent"></div>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="relative flex items-center justify-center gap-2 text-lg">
                Create Your Resume Now
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>

            <button
              onClick={handleCTA}
              className="px-8 py-4 rounded-2xl font-bold text-app-text bg-app-surface border border-app-border shadow-sm hover:border-brand-primary/50 transition-all w-full sm:w-auto flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <Upload className="w-5 h-5 text-brand-primary" />
              Import Existing PDF
            </button>
          </motion.div>
        </div>

        {/* Live Interactive Feature Mockup Showcase */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="max-w-5xl mx-auto glass-card rounded-3xl border border-app-border shadow-2xl overflow-hidden bg-app-surface/90"
        >
          {/* Feature Tabs */}
          <div className="flex items-center justify-between border-b border-app-border bg-app-bg/50 px-4 pt-3 overflow-x-auto scrollbar-none gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('architect')}
                className={`px-4 py-2.5 rounded-t-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 border-b-2 ${
                  activeTab === 'architect'
                    ? 'border-brand-primary text-brand-primary bg-app-surface'
                    : 'border-transparent text-app-text-muted hover:text-app-text'
                }`}
              >
                <Sparkles className="w-4 h-4" /> AI Content Builder
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`px-4 py-2.5 rounded-t-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 border-b-2 ${
                  activeTab === 'import'
                    ? 'border-brand-primary text-brand-primary bg-app-surface'
                    : 'border-transparent text-app-text-muted hover:text-app-text'
                }`}
              >
                <Upload className="w-4 h-4" /> Resume PDF Importer
              </button>
              <button
                onClick={() => setActiveTab('canvas')}
                className={`px-4 py-2.5 rounded-t-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 border-b-2 ${
                  activeTab === 'canvas'
                    ? 'border-brand-primary text-brand-primary bg-app-surface'
                    : 'border-transparent text-app-text-muted hover:text-app-text'
                }`}
              >
                <Layout className="w-4 h-4" /> Visual Layout Editor
              </button>
              <button
                onClick={() => setActiveTab('assistant')}
                className={`px-4 py-2.5 rounded-t-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 border-b-2 ${
                  activeTab === 'assistant'
                    ? 'border-brand-primary text-brand-primary bg-app-surface'
                    : 'border-transparent text-app-text-muted hover:text-app-text'
                }`}
              >
                <Wand2 className="w-4 h-4" /> Smart Career Assistant
              </button>
              <button
                onClick={() => setActiveTab('pdf')}
                className={`px-4 py-2.5 rounded-t-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 border-b-2 ${
                  activeTab === 'pdf'
                    ? 'border-brand-primary text-brand-primary bg-app-surface'
                    : 'border-transparent text-app-text-muted hover:text-app-text'
                }`}
              >
                <ShieldCheck className="w-4 h-4" /> ATS Optimization
              </button>
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="p-6 md:p-10 min-h-[360px] flex items-center justify-center relative bg-app-bg/40">
            <AnimatePresence mode="wait">
              {activeTab === 'architect' && (
                <motion.div
                  key="architect"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-center"
                >
                  <div className="space-y-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-primary/10 text-brand-primary inline-flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Intelligent Section Synthesis
                    </span>
                    <h3 className="text-2xl font-black text-app-text">Automated Resume Generation</h3>
                    <p className="text-xs text-app-text-secondary leading-relaxed">
                      Transform your job title and background into custom structured sections, quantifiable achievement metrics, and executive summaries.
                    </p>
                    <div className="p-3 rounded-xl bg-app-surface border border-app-border text-xs space-y-1 text-brand-primary font-semibold">
                      <div>✓ Professional Summary Generated</div>
                      <div>✓ Work History & Key Achievements Formatted</div>
                      <div>✓ Technical & Soft Skills Categorized</div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-app-surface border border-app-border shadow-lg space-y-3 text-xs text-app-text-secondary">
                    <div className="text-teal-500 font-bold text-sm">Generated Resume Preview</div>
                    <div className="p-4 rounded-xl bg-app-bg border border-app-border space-y-2">
                      <div className="font-bold text-app-text text-sm">Senior Full Stack Engineer</div>
                      <p className="text-app-text-secondary leading-relaxed">
                        Led cloud infrastructure migration reducing system response times by 84% and scaling architecture to support 2M+ active users.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'import' && (
                <motion.div
                  key="import"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="w-full text-center space-y-6 max-w-xl mx-auto"
                >
                  <div className="p-8 rounded-3xl border-2 border-dashed border-brand-primary/40 bg-brand-primary/5 flex flex-col items-center justify-center">
                    <Upload className="w-12 h-12 text-brand-primary mb-3" />
                    <h4 className="font-bold text-lg text-app-text mb-1">Instant Resume Import</h4>
                    <p className="text-xs text-app-text-secondary max-w-md">
                      Upload your existing PDF or LinkedIn resume to instantly extract work experience, skills, and contact details into your editable layout.
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'canvas' && (
                <motion.div
                  key="canvas"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="w-full space-y-4"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-app-text-muted pb-2 border-b border-app-border">
                    <span>VISUAL CANVAS EDITOR</span>
                    <span className="text-teal-500">What You See Is What You Export</span>
                  </div>
                  <div className="h-56 rounded-2xl bg-app-surface border border-app-border p-6 flex flex-col justify-between shadow-inner">
                    <div className="flex items-center justify-between">
                      <div className="h-6 w-48 bg-brand-primary/20 rounded-md"></div>
                      <div className="h-4 w-24 bg-brand-accent/20 rounded-md"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-full bg-app-border rounded"></div>
                      <div className="h-3 w-5/6 bg-app-border rounded"></div>
                      <div className="h-3 w-4/6 bg-app-border rounded"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded bg-brand-primary/10 text-brand-primary text-xs font-bold">Drag & Drop Positioning</span>
                      <span className="px-2.5 py-1 rounded bg-brand-primary/10 text-brand-primary text-xs font-bold">Multi-Page Support</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'assistant' && (
                <motion.div
                  key="assistant"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="w-full max-w-lg mx-auto p-5 rounded-2xl bg-app-surface border border-app-border shadow-xl space-y-4"
                >
                  <div className="flex items-center gap-3 text-sm font-bold text-app-text">
                    <Wand2 className="w-5 h-5 text-brand-primary" />
                    AI Assistant Recommendation
                  </div>
                  <p className="text-xs text-app-text-secondary leading-relaxed bg-app-bg p-3 rounded-xl border border-app-border">
                    "Architected microservice caching layer, reducing p99 response times by 84% with zero downtime."
                  </p>
                  <div className="flex justify-end gap-2">
                    <button onClick={handleCTA} className="px-4 py-1.5 rounded-lg text-xs font-bold bg-brand-primary text-white">Apply Bullet Point</button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'pdf' && (
                <motion.div
                  key="pdf"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="w-full grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <div className="p-5 rounded-xl bg-app-surface border border-app-border text-center">
                    <Zap className="w-6 h-6 text-brand-primary mx-auto mb-2" />
                    <div className="text-xl font-black text-app-text">Instant Export</div>
                    <div className="text-xs text-app-text-muted mt-1">High-Resolution PDF Downloads</div>
                  </div>
                  <div className="p-5 rounded-xl bg-app-surface border border-app-border text-center">
                    <ShieldCheck className="w-6 h-6 text-brand-accent mx-auto mb-2" />
                    <div className="text-xl font-black text-app-text">99.4% Pass Rate</div>
                    <div className="text-xs text-app-text-muted mt-1">ATS Scanner Compliance</div>
                  </div>
                  <div className="p-5 rounded-xl bg-app-surface border border-app-border text-center">
                    <CheckCircle2 className="w-6 h-6 text-teal-500 mx-auto mb-2" />
                    <div className="text-xl font-black text-app-text">Perfect Layout</div>
                    <div className="text-xs text-app-text-muted mt-1">Clean Vector Printing</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
