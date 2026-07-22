import { Navbar } from "../components/landing/Navbar";
import { Footer } from "../components/landing/Footer";
import { Sparkles, Code2, Zap, Shield, Globe2, Award, Heart, Cpu } from "lucide-react";
import { Link } from "react-router-dom";
import defaultLogoLight from "../assets/default.png";
import defaultLogoDark from "../assets/default-dark.png";

export function AboutUsPage() {
  return (
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-brand-primary/10 via-app-bg to-app-bg text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 text-brand-primary text-sm font-semibold mb-6">
            <Sparkles className="w-4 h-4" />
            Empowering Global Careers with Generative AI
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 bg-gradient-to-r from-slate-900 via-brand-primary to-brand-accent dark:from-white dark:via-brand-primary dark:to-teal-400 bg-clip-text text-transparent">
            We Are Redefining How Professionals Build Resumes
          </h1>
          <p className="text-lg md:text-xl text-app-text-secondary max-w-3xl mx-auto leading-relaxed">
            Resumagic was created to replace broken Word templates and clunky PDF tools with high-performance vector rendering, smart AI content generation, and ATS-optimized visual designs.
          </p>
        </div>
      </section>

      {/* Mission & Story Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <span className="text-xs font-bold text-brand-primary tracking-widest uppercase mb-2 block">Our Core Mission</span>
            <h2 className="text-3xl font-black mb-6 leading-tight">
              Giving Every Candidate Top 1% Career Presentation
            </h2>
            <p className="text-sm text-app-text-secondary leading-relaxed mb-4">
              Traditional resume builders output low-quality print layouts or broken formatting that gets rejected by Applicant Tracking Systems before a recruiter ever reads it.
            </p>
            <p className="text-sm text-app-text-secondary leading-relaxed mb-6">
              We built Resumagic from the ground up leveraging generative AI models, high-resolution vector PDF rendering, and instant document text extraction.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-app-border">
              <div>
                <div className="text-3xl font-black text-brand-primary">99.2%</div>
                <div className="text-xs text-app-text-muted">Average ATS Pass Rate</div>
              </div>
              <div>
                <div className="text-3xl font-black text-brand-accent">250,000+</div>
                <div className="text-xs text-app-text-muted">Resumes Generated</div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-8 border border-app-border relative overflow-hidden bg-gradient-to-br from-brand-primary/5 via-app-surface to-brand-accent/5">
            <div className="flex items-center gap-3 mb-6">
              <img src={defaultLogoLight} alt="Resumagic" className="h-10 logo-light" />
              <img src={defaultLogoDark} alt="Resumagic" className="h-10 logo-dark" />
            </div>
            <h3 className="text-xl font-bold mb-4">Product Innovation Meets Human Career Coaching</h3>
            <p className="text-xs text-app-text-secondary leading-relaxed mb-4">
              Our platform combines intuitive visual design controls, fast document processing, and cloud database sync to make resume creation enjoyable and effective.
            </p>
            <div className="p-4 rounded-2xl bg-app-bg border border-app-border flex items-center gap-3">
              <Cpu className="w-8 h-8 text-brand-primary shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-app-text block">AI Resume Architect</span>
                <span className="text-app-text-muted">Smart career content and design synthesis</span>
              </div>
            </div>
          </div>
        </div>

        {/* Company Pillars */}
        <section className="mb-20">
          <h2 className="text-2xl font-black mb-10 text-center">Our Engineering Pillars</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-app-surface border border-app-border">
              <Zap className="w-8 h-8 text-brand-primary mb-4" />
              <h3 className="font-bold text-lg mb-2">Sub-Second Speed</h3>
              <p className="text-xs text-app-text-secondary leading-relaxed">
                Instant PDF imports, fast canvas element updates, and rapid vector rendering.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-app-surface border border-app-border">
              <Shield className="w-8 h-8 text-brand-accent mb-4" />
              <h3 className="font-bold text-lg mb-2">Privacy & Security First</h3>
              <p className="text-xs text-app-text-secondary leading-relaxed">
                Your data is protected by Firebase authentication and encrypted database storage.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-app-surface border border-app-border">
              <Award className="w-8 h-8 text-teal-500 mb-4" />
              <h3 className="font-bold text-lg mb-2">ATS Guaranteed Compliance</h3>
              <p className="text-xs text-app-text-secondary leading-relaxed">
                Vector PDFs pass Workday, Taleo, Greenhouse, and Lever parsers flawlessly.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center glass-card rounded-3xl p-10 border border-brand-primary/20 bg-gradient-to-r from-brand-primary/10 via-app-surface to-brand-accent/10">
          <h2 className="text-3xl font-black mb-4">Ready to Build Your Winning Resume?</h2>
          <p className="text-sm text-app-text-secondary max-w-xl mx-auto mb-8">
            Join thousands of professionals landing interviews at top technology companies and Fortune 500s.
          </p>
          <Link
            to="/build"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold bg-brand-primary text-white hover:bg-brand-primary-hover transition-colors shadow-lg shadow-brand-primary/25"
          >
            Start Building Free
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default AboutUsPage;
