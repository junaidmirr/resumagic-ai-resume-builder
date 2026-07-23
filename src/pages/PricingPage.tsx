import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Sparkles,
  Zap,
  Crown,
  Check,
  Info,
  ChevronLeft,
  Star,
  Loader2,
  ShieldCheck,
  Lock
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDialog } from "../context/DialogContext";

const loadCashfreeSDK = (mode: string = "sandbox"): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).Cashfree) {
      resolve((window as any).Cashfree({ mode }));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.onload = () => {
      if ((window as any).Cashfree) {
        resolve((window as any).Cashfree({ mode }));
      } else {
        reject(new Error("Cashfree SDK object failed to initialize"));
      }
    };
    script.onerror = () => reject(new Error("Failed to load Cashfree Payment SDK"));
    document.body.appendChild(script);
  });
};

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
      "Full Template Access",
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
      "Ultra Priority Queue",
      "Valid for 180 Days",
      "VIP Dedicated Support",
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
      "No Expiration Date",
      "1-on-1 Career Consultation",
      "Early Access Features",
    ],
    gradient: "from-blue-600/20 to-indigo-700/20",
    border: "group-hover:border-indigo-600/50",
    button: "bg-slate-900 border-2 border-slate-900 hover:bg-slate-800 text-white",
    color: "text-indigo-700",
  },
];

export default function PricingPage() {
  const { user, credits, refreshCredits } = useAuth();
  const { alert } = useDialog();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const orderId = searchParams.get("order_id");
    if (orderId && user) {
      verifyPaymentOnServer(orderId, "pro");
    }
  }, [searchParams, user]);

  const verifyPaymentOnServer = async (orderId: string, planId: string) => {
    try {
      const token = await user?.getIdToken().catch(() => "");
      const res = await fetch("/api/cashfree/verify-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user?.uid || "",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ order_id: orderId, plan_id: planId }),
      });
      const data = await res.json();
      if (data.success) {
        await refreshCredits();
        await alert({
          title: "Payment Successful! 🎉",
          description: data.message || "AI credits added to your balance!",
        });
      } else {
        await alert({
          title: "Payment Verification",
          description: data.message || "Payment status processing.",
        });
      }
    } catch (err: any) {
      console.error("Verification error:", err);
    }
  };

  const handlePurchasePack = async (plan: typeof plans[0]) => {
    if (!user) {
      await alert({
        title: "Login Required",
        description: "Please log in or register an account to purchase AI credits.",
      });
      return;
    }

    setLoadingPlan(plan.id);
    try {
      const token = await user.getIdToken().catch(() => "");
      const res = await fetch("/api/cashfree/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user.uid,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          plan_id: plan.id,
          customer_email: user.email || "user@resumagic.app",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to initialize payment session");
      }

      const mode = data.environment === "production" ? "production" : "sandbox";
      const cashfree = await loadCashfreeSDK(mode);

      cashfree
        .checkout({
          paymentSessionId: data.payment_session_id,
          redirectTarget: "_modal",
        })
        .then(async (result: any) => {
          if (result.error) {
            await alert({
              title: "Payment Cancelled",
              description: result.error.message || "Payment process was cancelled.",
            });
          } else {
            await verifyPaymentOnServer(data.order_id, plan.id);
          }
        });
    } catch (err: any) {
      await alert({
        title: "Payment Gateway Error",
        description: err.message || "Unable to launch Cashfree Checkout.",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg transition-colors duration-500 pb-20 overflow-hidden text-app-text">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 left-[-10%] w-[40%] h-[40%] bg-teal-500/10 dark:bg-teal-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto pt-24 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <Link
            to="/dashboard"
            className="group inline-flex items-center gap-2 text-app-text-muted hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-bold uppercase tracking-widest text-xs"
          >
            <div className="p-2 rounded-xl bg-app-surface border border-app-border group-hover:border-indigo-500/30 transition-all shadow-sm">
              <ChevronLeft size={16} />
            </div>
            Exit to Dashboard
          </Link>

          {user && (
            <div className="flex items-center gap-2 bg-app-surface px-4 py-2 rounded-xl border border-app-border font-bold text-xs">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Current Balance: <strong className="text-brand-primary">{credits} Credits</strong></span>
            </div>
          )}
        </div>

        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider mb-2">
            <Lock className="w-3.5 h-3.5" />
            256-Bit Encrypted Cashfree Checkout
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-app-text tracking-tighter">
            Level Up Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-indigo-600">
              Career Power.
            </span>
          </h1>
          <p className="max-w-xl mx-auto text-app-text-muted text-base sm:text-lg font-medium">
            Unlock professional-tier AI tools with a high-octane credit recharge. Powered by Cashfree (UPI, Cards, NetBanking).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`group relative flex flex-col p-1 bg-app-surface rounded-[2.5rem] border border-app-border transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10 ${plan.border}`}
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

                <h3 className="text-2xl font-black text-app-text tracking-tight">
                  {plan.name}
                </h3>

                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-5xl font-black text-app-text">
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
                      className="flex items-center gap-3 text-app-text-secondary font-bold text-sm"
                    >
                      <div className="w-5 h-5 bg-app-surface rounded-full flex items-center justify-center flex-shrink-0 border border-app-border">
                        <Check size={12} className={plan.color} />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePurchasePack(plan)}
                  disabled={loadingPlan === plan.id}
                  className={`mt-10 w-full py-5 rounded-2xl font-black tracking-widest text-sm transition-all shadow-lg active:scale-95 text-white flex items-center justify-center gap-2 ${plan.button} disabled:opacity-60`}
                >
                  {loadingPlan === plan.id ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Launching Cashfree...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      BUY PACK
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-16 p-8 bg-app-surface border border-app-border rounded-[2rem] max-w-4xl mx-auto shadow-md">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0">
              <ShieldCheck size={36} />
            </div>
            <div>
              <p className="text-app-text font-black text-lg tracking-tight flex items-center justify-center sm:justify-start gap-2">
                100% Safe & Secure Cashfree Payment Gateway
              </p>
              <p className="mt-1 text-app-text-muted font-medium text-sm leading-relaxed">
                Supports UPI (Google Pay, PhonePe, Paytm), NetBanking, Credit/Debit Cards, and Wallets. Recharges are verified server-side and credited instantly to your account.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
