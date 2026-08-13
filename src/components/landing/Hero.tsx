import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Upload, ChevronRight, Wand2, ShieldCheck, Award, CheckCircle2, Star, TrendingUp, Users, Eye, Target } from 'lucide-react';
import { useAuthModal } from '../onboarding/AuthModalContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export function Hero() {
  const { openModal } = useAuthModal();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'ats_score' | 'bullet_booster' | 'import' | 'templates'>('ats_score');

  const handleCTA = () => {
    if (user) {
      navigate('/build');
    } else {
      openModal({ title: "Log In to Build Your Recruiter-Approved Resume" });
    }
  };

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-24 overflow-hidden flex flex-col items-center justify-center min-h-[92vh]">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-teal-500/15 rounded-full blur-[140px] opacity-70 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-500/15 rounded-full blur-[120px] opacity-50"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="text-center max-w-4xl mx-auto">
          {/* Recruiter Trust Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs md:text-sm font-bold mb-8 shadow-sm"
          >
            <Award className="w-4 h-4 text-emerald-500" />
            <span>Designed by Talent Acquisition Leaders • 99.4% ATS Interview Pass Rate</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tight text-app-text mb-8 leading-[1.08]"
          >
            Build a Resume That Hiring Managers <br className="hidden md:block" />
            <span className="text-gradient">Say YES To in 6 Seconds.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-app-text-secondary mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            88% of resumes get filtered out by automated ATS screeners before a human recruiter sees them. 
            Resumagic formats your real impact into recruiter-approved bullet points that guarantee top interview callbacks.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
          >
            <button 
              onClick={handleCTA}
              className="relative group px-8 py-4 rounded-2xl font-bold text-white overflow-hidden w-full sm:w-auto shadow-xl shadow-teal-500/25 hover:shadow-teal-500/40 transition-all hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500"></div>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="relative flex items-center justify-center gap-2 text-lg">
                Create My Resume Now
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>

            <button
              onClick={handleCTA}
              className="px-8 py-4 rounded-2xl font-bold text-app-text bg-app-surface border border-app-border shadow-sm hover:border-teal-500/50 transition-all w-full sm:w-auto flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <Upload className="w-5 h-5 text-teal-500" />
              Upload Existing PDF to Upgrade
            </button>
          </motion.div>

          {/* HR Proof Metrics Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-16 p-4 rounded-2xl bg-app-surface/60 border border-app-border backdrop-blur-md"
          >
            <div className="p-3 text-center">
              <div className="text-2xl md:text-3xl font-black text-teal-500 flex items-center justify-center gap-1">
                <TrendingUp className="w-5 h-5 text-emerald-500" /> 3.4x
              </div>
              <div className="text-xs text-app-text-secondary font-medium mt-1">More Interview Calls</div>
            </div>
            <div className="p-3 text-center">
              <div className="text-2xl md:text-3xl font-black text-teal-500 flex items-center justify-center gap-1">
                <Eye className="w-5 h-5 text-teal-500" /> 6 Sec
              </div>
              <div className="text-xs text-app-text-secondary font-medium mt-1">Recruiter Eye-Scan Optim</div>
            </div>
            <div className="p-3 text-center">
              <div className="text-2xl md:text-3xl font-black text-teal-500 flex items-center justify-center gap-1">
                <ShieldCheck className="w-5 h-5 text-cyan-500" /> 99.4%
              </div>
              <div className="text-xs text-app-text-secondary font-medium mt-1">ATS Parser Compatibility</div>
            </div>
            <div className="p-3 text-center">
              <div className="text-2xl md:text-3xl font-black text-teal-500 flex items-center justify-center gap-1">
                <Users className="w-5 h-5 text-amber-500" /> 45,000+
              </div>
              <div className="text-xs text-app-text-secondary font-medium mt-1">Hired at Top Companies</div>
            </div>
          </motion.div>
        </div>

        {/* Live Interactive Recruiter Audit Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="max-w-5xl mx-auto glass-card rounded-3xl border border-app-border shadow-2xl overflow-hidden bg-app-surface/90"
        >
          {/* Recruiter Tabs */}
          <div className="flex items-center justify-between border-b border-app-border bg-app-bg/60 px-4 pt-3 overflow-x-auto scrollbar-none gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('ats_score')}
                className={`px-4 py-3 rounded-t-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 border-b-2 ${
                  activeTab === 'ats_score'
                    ? 'border-teal-500 text-teal-500 bg-app-surface shadow-sm'
                    : 'border-transparent text-app-text-muted hover:text-app-text'
                }`}
              >
                <Target className="w-4 h-4 text-emerald-500" /> 🎯 Live Recruiter ATS Audit (98/100)
              </button>
              <button
                onClick={() => setActiveTab('bullet_booster')}
                className={`px-4 py-3 rounded-t-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 border-b-2 ${
                  activeTab === 'bullet_booster'
                    ? 'border-teal-500 text-teal-500 bg-app-surface shadow-sm'
                    : 'border-transparent text-app-text-muted hover:text-app-text'
                }`}
              >
                <Wand2 className="w-4 h-4 text-amber-500" /> ✨ HR Achievement Booster
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`px-4 py-3 rounded-t-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 border-b-2 ${
                  activeTab === 'import'
                    ? 'border-teal-500 text-teal-500 bg-app-surface shadow-sm'
                    : 'border-transparent text-app-text-muted hover:text-app-text'
                }`}
              >
                <Upload className="w-4 h-4 text-cyan-500" /> 📄 1-Click PDF Resume Importer
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`px-4 py-3 rounded-t-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 border-b-2 ${
                  activeTab === 'templates'
                    ? 'border-teal-500 text-teal-500 bg-app-surface shadow-sm'
                    : 'border-transparent text-app-text-muted hover:text-app-text'
                }`}
              >
                <Award className="w-4 h-4 text-teal-500" /> 💼 Recruiter-Approved Layouts
              </button>
            </div>
          </div>

          {/* Interactive Content Panel */}
          <div className="p-6 md:p-10 min-h-[380px] flex items-center justify-center relative bg-app-bg/40">
            <AnimatePresence mode="wait">
              {activeTab === 'ats_score' && (
                <motion.div
                  key="ats_score"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-center"
                >
                  <div className="md:col-span-5 space-y-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1.5 border border-emerald-500/20">
                      <ShieldCheck className="w-3.5 h-3.5" /> Fortune 500 Screener Standard
                    </span>
                    <h3 className="text-2xl font-black text-app-text">Real-Time Recruiter Scan Audit</h3>
                    <p className="text-xs text-app-text-secondary leading-relaxed">
                      Our system checks your formatting, action verb density, impact metrics, and target job keywords before you submit to ensure you pass automated screeners.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-app-text">ATS Keyword Match</span>
                        <span className="text-emerald-500">98% Match</span>
                      </div>
                      <div className="w-full bg-app-border h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[98%] rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-7 p-6 rounded-2xl bg-app-surface border border-app-border shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-app-border pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span className="font-bold text-app-text text-sm">Recruiter Audit Summary</span>
                      </div>
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full font-black text-xs">98/100 ATS PASS</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-app-bg border border-app-border">
                        <div className="text-app-text-muted font-medium">Header & Contact</div>
                        <div className="font-bold text-emerald-500 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 100% Readable
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-app-bg border border-app-border">
                        <div className="text-app-text-muted font-medium">Impact Metrics</div>
                        <div className="font-bold text-emerald-500 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Quantified Impact
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-app-bg border border-app-border">
                        <div className="text-app-text-muted font-medium">Typography & Hierarchy</div>
                        <div className="font-bold text-emerald-500 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 6-Sec Scan Compliant
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-app-bg border border-app-border">
                        <div className="text-app-text-muted font-medium">Job Keyword Alignment</div>
                        <div className="font-bold text-teal-500 mt-1 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" /> Optimized for Role
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'bullet_booster' && (
                <motion.div
                  key="bullet_booster"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="w-full space-y-6 max-w-3xl mx-auto"
                >
                  <div className="text-center space-y-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 inline-flex items-center gap-1 border border-amber-500/20">
                      <Sparkles className="w-3.5 h-3.5" /> Transform Duty Statements into Hiring Bullet Points
                    </span>
                    <h3 className="text-xl font-bold text-app-text">Recruiter Impact Rewriter</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-2">
                      <div className="text-rose-500 font-bold uppercase tracking-wider text-[10px]">❌ Before (Weak Duty Statement)</div>
                      <p className="text-app-text-secondary leading-relaxed font-mono">
                        "Responsible for managing customer support tickets and talking to clients on phone."
                      </p>
                      <div className="text-[11px] text-rose-500/80 italic">Recruiter verdict: Lacks metric proof, sounds like a passive job description.</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 shadow-lg">
                      <div className="text-emerald-500 font-bold uppercase tracking-wider text-[10px]">✅ After (Recruiter-Approved Impact)</div>
                      <p className="text-app-text font-medium leading-relaxed">
                        "Spearheaded multi-channel support operations across 10k+ enterprise clients, accelerating ticket resolution by 34% and sustaining a 98% CSAT rating over 4 consecutive quarters."
                      </p>
                      <div className="text-[11px] text-emerald-500 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Highlights leadership, quantitative metrics, and revenue retention!
                      </div>
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
                  <div className="p-8 rounded-3xl border-2 border-dashed border-teal-500/40 bg-teal-500/5 flex flex-col items-center justify-center space-y-3">
                    <Upload className="w-12 h-12 text-teal-500 mb-1" />
                    <h4 className="font-bold text-xl text-app-text">Upgrade Your Current Resume in 10 Seconds</h4>
                    <p className="text-xs text-app-text-secondary max-w-md leading-relaxed">
                      Upload your existing PDF or Word resume. Our parser instantly extracts your history, organizes your achievements, and places it into an executive layout.
                    </p>
                    <button onClick={handleCTA} className="px-6 py-2.5 rounded-xl font-bold bg-teal-500 text-white text-xs hover:bg-teal-600 transition-colors shadow-md">
                      Upload PDF Resume
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'templates' && (
                <motion.div
                  key="templates"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="w-full grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <div className="p-5 rounded-2xl bg-app-surface border border-app-border space-y-2 text-center hover:border-teal-500/50 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center mx-auto font-bold text-lg">💼</div>
                    <div className="font-bold text-app-text text-sm">Executive Corporate</div>
                    <div className="text-xs text-app-text-muted">Clean structure optimized for Directors, VPs, and Senior Management.</div>
                  </div>
                  <div className="p-5 rounded-2xl bg-app-surface border border-app-border space-y-2 text-center hover:border-teal-500/50 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto font-bold text-lg">⚡</div>
                    <div className="font-bold text-app-text text-sm">Modern Tech & Engineering</div>
                    <div className="text-xs text-app-text-muted">High-density bullet points designed for Software Engineers, Product & Data.</div>
                  </div>
                  <div className="p-5 rounded-2xl bg-app-surface border border-app-border space-y-2 text-center hover:border-teal-500/50 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto font-bold text-lg">🎨</div>
                    <div className="font-bold text-app-text text-sm">Creative Portfolio</div>
                    <div className="text-xs text-app-text-muted">Balanced aesthetics for Designers, Content Strategists & Marketing Leads.</div>
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
