import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Lock, Zap, Check, ArrowRight, ShieldCheck, X } from "lucide-react";
import { Link } from "react-router-dom";

interface UpgradeTriggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  featureName?: string;
}

export function UpgradeTriggerModal({
  isOpen,
  onClose,
  title = "Unlock Premium Feature",
  description = "Upgrade to Pro to unlock unlimited AI tools, career document generators, and ATS gap analysis.",
  featureName = "Pro Feature",
}: UpgradeTriggerModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          className="relative bg-app-surface border border-brand-primary/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-app-text-muted hover:text-app-text hover:bg-app-bg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Lock Icon Badge */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center text-white shadow-lg shadow-brand-primary/25 mb-5">
            <Lock className="w-7 h-7" />
          </div>

          {/* Feature Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[11px] font-black uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            {featureName}
          </div>

          <h3 className="text-2xl font-black text-app-text mb-2 tracking-tight">
            {title}
          </h3>

          <p className="text-xs sm:text-sm text-app-text-secondary leading-relaxed mb-6">
            {description}
          </p>

          {/* Value Highlights */}
          <div className="space-y-2.5 mb-8 bg-app-bg p-4 rounded-2xl border border-app-border">
            <div className="flex items-center gap-2.5 text-xs font-bold text-app-text">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>1000 AI Credits / month (1-click STAR bullet points)</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-bold text-app-text">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>AI Architect 2.0 & Unlimited Chat Assistant</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-bold text-app-text">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Cover Letter, SOP, LOR & Resignation Generators</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-bold text-app-text">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Unlimited Resumes & ATS Keyword Gap Analysis</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/pricing"
              onClick={onClose}
              className="flex-1 py-3.5 px-5 bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-secondary hover:to-brand-primary text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-brand-primary/25 transition-all text-center flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-current" />
              Upgrade to Pro (₹199 Launch Offer) <ArrowRight className="w-4 h-4 ml-0.5" />
            </Link>

            <button
              onClick={onClose}
              className="py-3.5 px-4 bg-app-bg hover:bg-app-surface border border-app-border text-app-text-muted hover:text-app-text font-bold text-xs rounded-xl transition-all"
            >
              Maybe Later
            </button>
          </div>

          <div className="mt-4 text-center">
            <span className="text-[11px] font-medium text-app-text-muted flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Cashfree 256-Bit Encrypted Payment
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
