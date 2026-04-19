import React, { useState } from "react";
import {
  CreditCard,
  Sparkles,
  Zap,
  Crown,
  Check,
  Info,
  ChevronLeft,
  ArrowRight,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    id: "basic",
    name: "Starter",
    credits: 50,
    price: 199,
    icon: <Zap className="w-8 h-8 text-teal-500" />,
    features: ["50 AI Credits", "Standard Queue", "Valid for 30 Days"],
    gradient: "from-teal-500/20 to-teal-600/20",
    border: "group-hover:border-teal-500/50",
    button: "bg-teal-600 hover:bg-teal-700 shadow-teal-500/20",
    color: "text-teal-600",
  },
  {
    id: "pro",
    name: "Professional",
    credits: 150,
    price: 299,
    icon: <Sparkles className="w-8 h-8 text-indigo-500" />,
    features: [
      "150 AI Credits",
      "Priority AI Queue",
      "Valid for 90 Days",
      "Template Access",
    ],
    gradient: "from-indigo-500/20 to-purple-600/20",
    border: "group-hover:border-indigo-500/50",
    button: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20",
    color: "text-indigo-600",
    popular: true,
  },
  {
    id: "expert",
    name: "Expert",
    credits: 350,
    price: 599,
    icon: <Crown className="w-8 h-8 text-amber-500" />,
    features: [
      "350 AI Credits",
      "Ultra Priority",
      "Valid for 180 Days",
      "VIP Support",
    ],
    gradient: "from-amber-500/20 to-orange-600/20",
    border: "group-hover:border-amber-500/50",
    button: "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20",
    color: "text-amber-600",
  },
  {
    id: "ultimate",
    name: "Ultimate",
    credits: 500,
    price: 999,
    icon: <Star className="w-8 h-8 text-indigo-600" />,
    features: [
      "500 AI Credits",
      "No Experiration",
      "1-on-1 Consulting",
      "Beta Features",
    ],
    gradient: "from-blue-600/20 to-indigo-700/20",
    border: "group-hover:border-indigo-600/50",
    button:
      "bg-slate-900 border-2 border-slate-900 hover:bg-white hover:text-slate-900",
    color: "text-indigo-700",
  },
];

export default function PricingPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500 pb-20 overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 left-[-10%] w-[40%] h-[40%] bg-teal-500/10 dark:bg-teal-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto pt-24 px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <Link
            to="/dashboard"
            className="group inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-bold uppercase tracking-widest text-xs"
          >
            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 group-hover:border-indigo-500/30 transition-all shadow-sm">
              <ChevronLeft size={16} />
            </div>
            Exit to Dashboard
          </Link>
        </div>

        <div className="text-center space-y-4 mb-20">
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter">
            Level Up Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-indigo-600">
              Career Power.
            </span>
          </h1>
          <p className="max-w-xl mx-auto text-slate-500 dark:text-slate-400 text-lg font-medium">
            Unlock professional-tier AI tools with a high-octane credit
            recharge.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`group relative flex flex-col p-1 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10 ${plan.border}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-indigo-600 text-white text-xs font-black rounded-full shadow-lg shadow-indigo-600/40 z-10 tracking-widest leading-none">
                  MOST POPULAR
                </div>
              )}

              <div className="p-8 flex-1 flex flex-col">
                <div
                  className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}
                >
                  {plan.icon}
                </div>

                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {plan.name}
                </h3>

                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-5xl font-black text-slate-900 dark:text-white">
                    ₹{plan.price}
                  </span>
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                    INR
                  </span>
                </div>

                <p className={`mt-2 font-black text-lg ${plan.color}`}>
                  {plan.credits} AI CREDITS
                </p>

                <ul className="mt-8 space-y-4 flex-1">
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 text-slate-600 dark:text-slate-400 font-bold text-sm"
                    >
                      <div className="w-5 h-5 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check size={12} className={plan.color} />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => setShowModal(true)}
                  className={`mt-10 w-full py-5 rounded-2xl font-black tracking-widest text-sm transition-all shadow-lg active:scale-95 text-white ${plan.button}`}
                >
                  GET PACK
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-20 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <Info size={32} />
            </div>
            <div>
              <p className="text-slate-900 dark:text-white font-black text-lg tracking-tight">
                How power works?
              </p>
              <p className="mt-1 text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed">
                Recharges are instant. AI actions (Parsing, Edits, Summaries)
                consume{" "}
                <span className="text-indigo-500 font-bold">5 credits</span>.
                High-performance standard PDF rendering remains free for all
                users with 500+ templates.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Glassmorphic Coming Soon Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xl transition-all duration-500"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-[3rem] p-10 max-w-md w-full text-center shadow-2xl border border-white/20 dark:border-slate-800 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-500 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-500/40">
              <CreditCard size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tighter">
              Under Construction.
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-10 font-medium leading-relaxed">
              We're integrating UPI, Razorpay & Stripe for seamless
              transactions. Direct recharges will be active within{" "}
              <span className="text-indigo-500 font-bold">48 hours</span>.
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group shadow-xl"
            >
              ROGER THAT
              <ArrowRight
                size={20}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
