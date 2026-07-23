import { useState } from "react";
import { Navbar } from "../components/landing/Navbar";
import { Footer } from "../components/landing/Footer";
import { Mail, Clock, MapPin, Copy, Check, ExternalLink, Sparkles, MessageSquare } from "lucide-react";

export function ContactPage() {
  const [copied, setCopied] = useState(false);
  const supportEmail = "support@worklabs.studio";

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(supportEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      {/* Hero Header */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-brand-primary/10 via-app-bg to-app-bg text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 text-brand-primary text-xs sm:text-sm font-semibold mb-6 border border-brand-primary/20">
            <Mail className="w-4 h-4" />
            Direct Email Support
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 bg-gradient-to-r from-slate-900 via-brand-primary to-brand-accent dark:from-white dark:via-brand-primary dark:to-teal-400 bg-clip-text text-transparent tracking-tight">
            We'd Love to Hear From You
          </h1>
          <p className="text-base sm:text-xl text-app-text-secondary max-w-2xl mx-auto leading-relaxed">
            Have questions about Resumagic, technical inquiries, or need support? Reach out to us directly via email and our team will get back to you.
          </p>
        </div>
      </section>

      {/* Main Support Section */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 w-full">
        <div className="bg-app-surface border border-app-border rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden text-center">
          
          {/* Ambient Glow */}
          <div className="absolute top-0 right-1/2 translate-x-1/2 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
            
            {/* Mail Icon Badge */}
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center text-white shadow-xl shadow-brand-primary/25 mb-6">
              <Mail className="w-10 h-10" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-app-text mb-3">
              Get in Touch
            </h2>
            <p className="text-sm sm:text-base text-app-text-secondary mb-8 leading-relaxed">
              Send us an email at our dedicated support address. We read every message and will get back to you as soon as possible!
            </p>

            {/* Email Box */}
            <div className="w-full bg-app-bg border border-app-border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 shadow-inner">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-brand-primary/10 text-brand-primary shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <span className="text-base sm:text-lg font-extrabold text-app-text select-all truncate">
                  {supportEmail}
                </span>
              </div>

              <button
                onClick={handleCopyEmail}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-app-surface hover:bg-app-bg border border-app-border text-app-text font-bold text-xs transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-500">Copied to Clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-brand-primary" />
                    <span>Copy Address</span>
                  </>
                )}
              </button>
            </div>

            {/* Action Button */}
            <a
              href={`mailto:${supportEmail}`}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-secondary hover:to-brand-primary text-white font-black text-sm rounded-2xl shadow-xl shadow-brand-primary/25 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Send Email Now <ExternalLink className="w-4 h-4 ml-1 opacity-80" />
            </a>

            {/* Response Time Indicator */}
            <div className="mt-8 pt-6 border-t border-app-border w-full flex flex-wrap items-center justify-center gap-6 text-xs text-app-text-muted">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-brand-primary" /> Fast Response (&lt; 24 hours)
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-4 h-4 text-amber-500" /> Dedicated Technical Support
              </span>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default ContactPage;
