import React, { useState } from "react";
import { CreditCard, Sparkles, Zap, Crown, Check, Info } from "lucide-react";

const plans = [
  {
    id: "basic",
    name: "Starter",
    credits: 50,
    price: 199,
    icon: <Zap className="text-teal-500" />,
    features: ["50 AI Credits", "Valid for 1 Month", "Standard Support"],
    color: "border-slate-200",
  },
  {
    id: "pro",
    name: "Professional",
    credits: 150,
    price: 299,
    icon: <Sparkles className="text-teal-600" />,
    features: [
      "150 AI Credits",
      "Priority AI Queue",
      "Valid for 3 Months",
      "Premium Support",
    ],
    color: "border-teal-200 bg-teal-50/30",
    popular: true,
  },
  {
    id: "expert",
    name: "Expert",
    credits: 350,
    price: 599,
    icon: <Crown className="text-amber-500" />,
    features: [
      "350 AI Credits",
      "Unlimited Drafts",
      "Valid for 6 Months",
      "Priority Support",
    ],
    color: "border-slate-200",
  },
  {
    id: "ultimate",
    name: "Ultimate",
    credits: 500,
    price: 999,
    icon: <Crown className="text-indigo-500" />,
    features: [
      "500 AI Credits",
      "Custom AI Templates",
      "Lifetime Validity",
      "Dedicated Support",
    ],
    color: "border-indigo-100 bg-indigo-50/20",
  },
];

export default function PricingPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl">
          Fuel Your Professional Journey
        </h1>
        <p className="mt-4 text-xl text-slate-600 max-w-2xl mx-auto">
          Choose a credit pack that fits your needs. Every AI action consumes 5
          credits.
        </p>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col p-8 rounded-3xl border-2 transition-all hover:shadow-xl ${plan.color}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-teal-600 text-white text-sm font-bold rounded-full">
                  MOST POPULAR
                </div>
              )}

              <div className="mb-6">{plan.icon}</div>
              <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">
                  ₹{plan.price}
                </span>
                <span className="text-slate-500 font-medium">/ pack</span>
              </div>
              <p className="mt-2 text-teal-600 font-bold text-lg">
                {plan.credits} Credits
              </p>

              <ul className="mt-8 space-y-4 mb-8 flex-1 text-left">
                {plan.features.map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-slate-600 text-sm"
                  >
                    <Check size={16} className="text-teal-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setShowModal(true)}
                className={`w-full py-4 rounded-2xl font-bold transition-all ${
                  plan.popular
                    ? "bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-200"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                Buy Now
              </button>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-100 max-w-3xl mx-auto flex items-start gap-4 text-left">
          <Info className="text-slate-400 mt-1 flex-shrink-0" />
          <p className="text-sm text-slate-600 leading-relaxed">
            Note: Credits are applied instantly to your account after purchase.
            Each AI feature usage (Resume Parsing, AI Chat Edits, Summary
            Generation, Skill Extraction) consumes 5 credits. Standard PDF
            rendering is free for 500+ templates.
          </p>
        </div>
      </div>

      {/* Coming Soon Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Coming Soon!
            </h2>
            <p className="text-slate-600 mb-8 leading-relaxed">
              We're currently integrating with our payment gateway providers in
              India. Direct credit recharge will be available in 2-3 days.
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="w-full py-4 bg-teal-600 text-white font-bold rounded-2xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-100"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
