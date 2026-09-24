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
  Gift,
  ArrowRight,
  Flame,
  CheckCircle2,
  Lock,
  Download,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDialog } from "../context/DialogContext";
import { UpgradeTriggerModal } from "../components/common/UpgradeTriggerModal";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Navbar } from "../components/landing/Navbar";
import { Footer } from "../components/landing/Footer";

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
    script.onerror = () =>
      reject(new Error("Failed to load Cashfree Payment SDK"));
    document.body.appendChild(script);
  });
};

const subscriptionPlans = [
  {
    id: "free",
    name: "Free Plan",
    monthlyPrice: 0,
    yearlyPrice: 0,
    creditsMonthly: 5,
    description: "Try the platform with basic features.",
    features: [
      "1 Resume Only",
      "2 Essential Templates",
      "Basic Canvas Editor",
      "Vector PDF Export (No Watermark)",
      "Resume Import & Parsing",
      "Light & Dark Themes",
      "5 AI Credits / month",
      "3 ATS Match Scans / month",
      "5 AI Chat messages / month",
    ],
    restricted: [
      "No Cover Letter or SOP",
      "No Portfolio",
      "No Keyword Gap Analysis",
      "No AI Architect",
    ],
    button: "CURRENT PLAN",
    badge: "FREE FOREVER",
  },
  {
    id: "starter",
    name: "Starter Plan",
    monthlyPrice: 149,
    yearlyPrice: 999,
    creditsMonthly: 150,
    description: "Best for students & entry-level applicants.",
    features: [
      "Unlimited Resumes",
      "Unlimited Templates",
      "Unlimited Vector PDF Export",
      "150 AI Credits / month",
      "20 ATS Match Scans",
      "AI STAR Bullet Point Rewrite",
      "AI Summary & Skill Extractor",
      "Resume Wizard Setup",
      "Priority PDF Render Queue",
    ],
    restricted: ["No AI Architect 2.0", "No Unlimited AI Chat"],
    button: "GET STARTER",
    badge: "BEST FOR STUDENTS",
  },
  {
    id: "pro",
    name: "Pro Plan",
    monthlyPrice: 199, // Launch promo price (regular ₹299)
    monthlyPriceOriginal: 299,
    yearlyPrice: 2499,
    creditsMonthly: 1000,
    popular: true,
    description: "Where most successful candidates land.",
    features: [
      "Everything in Starter",
      "1000 AI Credits / month",
      "AI Architect 2.0 (Single Prompt Generator)",
      "Unlimited AI Chat Assistant",
      "Cover Letter & SOP Generator",
      "LOR & Resignation Letter Generator",
      "Unlimited ATS & Keyword Gap Analysis",
      "Multiple Resume Versions per Job",
      "Premium Designer Templates",
      "Save Custom Color Schemes",
    ],
    button: "CLAIM PRO OFFER (₹199)",
    badge: "MOST POPULAR — LAUNCH PROMO",
  },
  {
    id: "career_pro",
    name: "Career Pro",
    monthlyPrice: 499,
    yearlyPrice: 3999,
    creditsMonthly: 3000,
    description: "For experienced professionals & power users.",
    features: [
      "Everything in Pro Plan",
      "3000 AI Credits / month",
      "Unlimited AI Generation",
      "All 20+ Career Documents (Cold Email, Salary Negotiation, LinkedIn Bio)",
      "Interview STAR Preparation Answers",
      "Highest AI Execution Speed",
      "Early Access to Beta Features",
    ],
    button: "GET CAREER PRO",
    badge: "UNLIMITED POWER",
  },
];

const creditPacks = [
  { id: "pack_50", price: 49, credits: 50, perCredit: "₹0.98 / credit" },
  {
    id: "pack_150",
    price: 99,
    credits: 150,
    perCredit: "₹0.66 / credit",
    popular: true,
  },
  { id: "pack_400", price: 199, credits: 400, perCredit: "₹0.49 / credit" },
  { id: "pack_1000", price: 399, credits: 1000, perCredit: "₹0.39 / credit" },
];

export default function PricingPage() {
  const { user, credits, userPlan, refreshCredits } = useAuth();
  const { alert } = useDialog();

  const [billingCycle, setBillingCycle] = useState<"yearly" | "monthly">(
    "yearly",
  );
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Promo Code State
  const [promoInput, setPromoInput] = useState("");
  const [promoValidating, setPromoValidating] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discount_type: "percent" | "fixed";
    discount_value: number;
    message: string;
  } | null>(null);

  const getDiscountedPrice = (basePrice: number) => {
    if (!appliedPromo || basePrice <= 0) return basePrice;
    if (appliedPromo.discount_type === "percent") {
      const val = basePrice * (1 - appliedPromo.discount_value / 100);
      return Math.max(1, Math.round(val));
    } else {
      const val = basePrice - appliedPromo.discount_value;
      return Math.max(1, Math.round(val));
    }
  };

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const orderId = searchParams.get("order_id");
    const planId = searchParams.get("plan_id") || "";
    if (orderId && user) {
      verifyPaymentOnServer(orderId, planId);
    }
  }, [searchParams, user]);

  const handleApplyPromoCode = async () => {
    if (!promoInput.trim()) return;
    setPromoValidating(true);
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAppliedPromo(data);
        await alert({ title: "Coupon Applied!", description: data.message });
      } else {
        await alert({
          title: "Invalid Coupon",
          description: data.error || "Failed to apply promo code.",
        });
      }
    } catch (err: any) {
      await alert({ title: "Error", description: err.message });
    } finally {
      setPromoValidating(false);
    }
  };

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
        if (user?.uid) {
          try {
            const addedCredits = data.credits_added || 150;
            const rawId = (planId || "").toLowerCase();
            const normTier = rawId.includes("pro")
              ? rawId.includes("career")
                ? "career_pro"
                : "pro"
              : rawId.includes("starter")
                ? "starter"
                : rawId.includes("lifetime")
                  ? "lifetime"
                  : null;

            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            const currentCredits = userSnap.exists()
              ? userSnap.data()?.credits || 0
              : 0;
            const newTotal = currentCredits + addedCredits;

            const updatePayload: any = { credits: newTotal };
            if (normTier) {
              updatePayload.plan = normTier;
              updatePayload.userPlan = normTier;
              updatePayload.lastPurchasedPlan = normTier;
            }

            await setDoc(userRef, updatePayload, { merge: true });

            const txRef = doc(db, "users", user.uid, "transactions", orderId);
            await setDoc(
              txRef,
              {
                order_id: orderId,
                plan_id: planId || "purchase",
                tier: normTier || "credit_pack",
                credits_added: addedCredits,
                amount_paid: data.amount_paid || 0,
                status: "PAID",
                created_at: new Date().toISOString(),
              },
              { merge: true },
            );
          } catch (err) {
            console.error("[Client] Failed fallback transaction write:", err);
          }
        }

        await refreshCredits(true);
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
        await alert({
          title: "Payment Successful!",
          description:
            data.message ||
            `Payment verified and ${data.credits_added || ""} AI credits added to your account!`,
        });
      } else {
        await alert({
          title: "Payment Status",
          description: data.message || "Payment verification complete.",
        });
      }
    } catch (err: any) {
      console.error("Verification error:", err);
    }
  };

  const handlePurchase = async (planId: string) => {
    if (!user) {
      await alert({
        title: "Login Required",
        description: "Please log in to complete your purchase.",
      });
      return;
    }

    if (planId === "free") return;

    setLoadingPlan(planId);
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
          plan_id: planId,
          customer_email: user.email || "user@resumagic.app",
          promo_code: appliedPromo?.code || "",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.error || "Failed to launch Cashfree order session.",
        );
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
              description:
                result.error.message || "Payment process was cancelled.",
            });
          } else {
            await verifyPaymentOnServer(data.order_id, planId);
          }
        });
    } catch (err: any) {
      await alert({
        title: "Checkout Error",
        description: err.message || "Unable to launch Cashfree Checkout.",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleReferralRedeem = async () => {
    if (!referralCode) return;
    setReferralRedeeming(true);
    try {
      const token = await user?.getIdToken().catch(() => "");
      const res = await fetch("/api/referral/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ referral_code: referralCode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await refreshCredits();
        await alert({
          title: "Referral Claimed!",
          description: data.message,
        });
      } else {
        await alert({ title: "Referral Error", description: data.error });
      }
    } catch (err: any) {
      await alert({ title: "Error", description: err.message });
    } finally {
      setReferralRedeeming(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg transition-colors duration-200 pb-24 overflow-hidden text-app-text flex flex-col">
      <Navbar />

      {/* Launch Promo Notice */}
      <div className="pt-20 bg-slate-100 dark:bg-slate-900 border-b border-app-border text-slate-700 dark:text-slate-300 text-center py-2 px-4 text-xs font-mono font-medium">
        <span>
          Transparent Plans • Free Forever Option • No Automatic Recurring
          Charges without Consent
        </span>
      </div>

      <div className="relative max-w-7xl mx-auto pt-12 px-4 sm:px-6 lg:px-8">
        {/* Navigation & Balance */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/dashboard"
            className="group inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-mono text-xs"
          >
            <div className="p-1.5 rounded border border-app-border bg-app-surface">
              <ChevronLeft size={14} />
            </div>
            Back to Dashboard
          </Link>

          {user && (
            <div className="flex items-center gap-2 bg-app-surface px-3 py-1.5 rounded border border-app-border font-mono text-xs">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>
                Available: <strong>{credits} Credits</strong>
              </span>
            </div>
          )}
        </div>

        {/* Main Title */}
        <div className="text-center space-y-3 mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-app-text tracking-tight">
            Plans & Credit Pricing
          </h1>
          <p className="max-w-xl mx-auto text-app-text-secondary text-sm sm:text-base leading-relaxed">
            Free vector PDF exports with standard templates. Upgrade to access
            role keyword gap audits and AI assistant tools.
          </p>

          {/* Billing Switcher */}
          <div className="pt-3 flex items-center justify-center">
            <div className="bg-slate-100 dark:bg-slate-800 border border-app-border p-1 rounded-lg inline-flex items-center gap-1">
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${
                  billingCycle === "yearly"
                    ? "bg-app-surface text-app-text border border-app-border shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-app-text"
                }`}
              >
                Annual Billing (Save ~40%)
              </button>

              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${
                  billingCycle === "monthly"
                    ? "bg-app-surface text-app-text border border-app-border shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-app-text"
                }`}
              >
                Monthly Billing
              </button>
            </div>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {subscriptionPlans.map((plan) => {
            const planKey =
              plan.id === "free" ? "free" : `${plan.id}_${billingCycle}`;
            const displayPrice =
              billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
            const isEnrolled =
              userPlan === plan.id ||
              (userPlan === "free" && plan.id === "free");

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col bg-app-surface rounded-lg border transition-colors ${
                  isEnrolled
                    ? "border-emerald-500 ring-1 ring-emerald-500 shadow-2xs"
                    : plan.popular
                      ? "border-slate-800 dark:border-slate-200 ring-1 ring-slate-800 dark:ring-slate-200 shadow-2xs"
                      : "border-app-border hover:border-slate-400 dark:hover:border-slate-600 shadow-2xs"
                }`}
              >
                {isEnrolled ? (
                  <div className="absolute -top-3 left-4 px-2.5 py-0.5 bg-emerald-600 text-white text-[10px] font-mono uppercase tracking-wider rounded font-semibold z-10 flex items-center gap-1">
                    <Check className="w-3 h-3" /> CURRENT PLAN
                  </div>
                ) : plan.popular ? (
                  <div className="absolute -top-3 left-4 px-2.5 py-0.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-mono uppercase tracking-wider rounded font-semibold z-10">
                    RECOMMENDED
                  </div>
                ) : null}

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-app-text mb-1">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-app-text-secondary mb-5 leading-relaxed">
                      {plan.description}
                    </p>

                    {/* Price Block */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-app-text">
                          ₹{getDiscountedPrice(displayPrice)}
                        </span>
                        {appliedPromo && plan.id !== "free" && (
                          <span className="text-sm font-bold text-slate-400 line-through ml-1">
                            ₹{displayPrice}
                          </span>
                        )}
                        <span className="text-slate-400 font-bold uppercase text-[11px]">
                          {plan.id === "free"
                            ? ""
                            : billingCycle === "yearly"
                              ? "/year"
                              : "/month"}
                        </span>
                      </div>

                      {appliedPromo && plan.id !== "free" ? (
                        <div className="text-[11px] font-bold text-emerald-500 mt-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Coupon '
                          {appliedPromo.code}' Applied!
                        </div>
                      ) : plan.monthlyPriceOriginal ? (
                        <div className="text-xs font-bold text-slate-400 line-through mt-0.5">
                          Regular ₹{plan.monthlyPriceOriginal}/month
                        </div>
                      ) : null}
                    </div>

                    {/* Features List */}
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 text-xs font-bold text-app-text leading-tight"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}

                      {plan.restricted?.map((restr, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 text-xs font-medium text-app-text-muted opacity-70"
                        >
                          <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>{restr}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Purchase Action Button */}
                  <button
                    onClick={() => handlePurchase(planKey)}
                    disabled={loadingPlan === planKey || isEnrolled}
                    className={`w-full py-2.5 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-2 ${
                      isEnrolled
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-default border border-app-border"
                        : plan.popular
                          ? "bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white"
                          : "bg-app-surface border border-app-border hover:bg-slate-50 dark:hover:bg-slate-800 text-app-text"
                    } disabled:opacity-60`}
                  >
                    {loadingPlan === planKey ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Launching Cashfree...
                      </>
                    ) : isEnrolled ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Active Enrolled Plan
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-3.5 h-3.5" />
                        {plan.button}{" "}
                        {appliedPromo
                          ? `(₹${getDiscountedPrice(displayPrice)})`
                          : ""}
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* How AI Credits & Plans Work Guide */}
        <div className="bg-app-surface border border-app-border rounded-lg p-6 sm:p-8 mb-20 shadow-2xs">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-app-text mb-2">
              Credit System Breakdown
            </h2>
            <p className="text-xs text-app-text-secondary leading-relaxed">
              Credits are only deducted when you invoke AI analysis or
              formatting actions. Core editing, vector PDF downloads, and layout
              customization are always free.
            </p>
          </div>

          {/* Feature Credit Cost Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
            <div className="p-4 rounded-lg bg-app-bg border border-app-border flex items-start gap-3">
              <div className="p-2 rounded border border-app-border bg-app-surface text-slate-700 dark:text-slate-300 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-app-text">
                  AI Architect & Wizard
                </h4>
                <p className="text-[11px] text-app-text-secondary mt-0.5">
                  Generates a complete multi-section resume from prompt or PDF
                  import.
                </p>
                <span className="inline-block mt-2 font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  5 Credits / Resume
                </span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-app-bg border border-app-border flex items-start gap-3">
              <div className="p-2 rounded border border-app-border bg-app-surface text-slate-700 dark:text-slate-300 shrink-0">
                <Star className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-app-text">
                  STAR Bullet Point Enhancer
                </h4>
                <p className="text-[11px] text-app-text-secondary mt-0.5">
                  Transforms weak work experience bullets into metric-driven
                  statements.
                </p>
                <span className="inline-block mt-2 font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  2 Credits / Action
                </span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-app-bg border border-app-border flex items-start gap-3">
              <div className="p-2 rounded border border-app-border bg-app-surface text-slate-700 dark:text-slate-300 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-app-text">
                  ATS Keyword & Gap Audit
                </h4>
                <p className="text-[11px] text-app-text-secondary mt-0.5">
                  Compares your resume against target job descriptions and
                  computes match score.
                </p>
                <span className="inline-block mt-2 font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  1 Credit / Audit
                </span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-app-bg border border-app-border flex items-start gap-3">
              <div className="p-2 rounded border border-app-border bg-app-surface text-slate-700 dark:text-slate-300 shrink-0">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-app-text">
                  Executive Summary
                </h4>
                <p className="text-[11px] text-app-text-secondary mt-0.5">
                  Drafts role-tailored professional summary paragraphs.
                </p>
                <span className="inline-block mt-2 font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  2 Credits / Summary
                </span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-app-bg border border-app-border flex items-start gap-3">
              <div className="p-2 rounded border border-app-border bg-app-surface text-slate-700 dark:text-slate-300 shrink-0">
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-app-text">
                  Cover Letter & Documents
                </h4>
                <p className="text-[11px] text-app-text-secondary mt-0.5">
                  Writes structured 1-page cover letters aligned with your
                  resume experience.
                </p>
                <span className="inline-block mt-2 font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  3 Credits / Document
                </span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-app-bg border border-app-border flex items-start gap-3">
              <div className="p-2 rounded border border-app-border bg-app-surface text-slate-700 dark:text-slate-300 shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-app-text">
                  Vector PDF Exporting
                </h4>
                <p className="text-[11px] text-app-text-secondary mt-0.5">
                  Downloading and exporting your resume to vector PDF is always
                  included.
                </p>
                <span className="inline-block mt-2 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  Included (Free)
                </span>
              </div>
            </div>
          </div>

          {/* 3 Step Process */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-app-border">
            <div className="flex gap-4">
              <div className="w-9 h-9 rounded-2xl bg-brand-primary text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                1
              </div>
              <div>
                <h5 className="font-bold text-sm text-app-text mb-1">
                  Get Free Credits or Pick a Plan
                </h5>
                <p className="text-xs text-app-text-muted leading-relaxed">
                  Sign up & verify your email to get 15 Free credits instantly,
                  or select a Pro plan for monthly credit resets.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-9 h-9 rounded-2xl bg-brand-primary text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                2
              </div>
              <div>
                <h5 className="font-bold text-sm text-app-text mb-1">
                  Use AI Features in Editor
                </h5>
                <p className="text-xs text-app-text-muted leading-relaxed">
                  Click any AI button in the Canvas Editor, Wizard, or Tools to
                  generate bullets, summaries, or audit ATS score.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-9 h-9 rounded-2xl bg-brand-primary text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                3
              </div>
              <div>
                <h5 className="font-bold text-sm text-app-text mb-1">
                  Credits Rollover & Top-Up
                </h5>
                <p className="text-xs text-app-text-muted leading-relaxed">
                  Need extra credits? Purchase a top-up credit pack anytime.
                  Purchased credits never expire.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lifetime Deal Section */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/40 rounded-3xl p-8 sm:p-12 mb-20 shadow-2xl relative overflow-hidden text-white">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-widest">
                <Crown className="w-4 h-4 text-amber-400" />
                Lifetime Access Deal
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Pay Once. Build Resumes & Career Docs Forever.
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Get unlimited access to all features, 3,000 monthly AI credit
                resets, unlimited vector PDF exports, AI Architect 2.0, and free
                updates forever.
              </p>
              <div className="flex flex-wrap gap-4 text-xs font-extrabold text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" /> No Monthly
                  Subscriptions
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" /> 3000 Monthly
                  Credit Reset
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" /> All Future
                  Features Included
                </span>
              </div>
            </div>

            <div className="text-center lg:text-right shrink-0">
              <div className="text-4xl sm:text-5xl font-black text-white mb-1">
                ₹{getDiscountedPrice(1999)}{" "}
                <span className="text-sm font-bold text-slate-400 line-through">
                  ₹{appliedPromo ? "1,999" : "2,999"}
                </span>
              </div>
              {appliedPromo && (
                <div className="text-xs font-bold text-emerald-400 mb-2 flex items-center justify-center lg:justify-end gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Coupon '
                  {appliedPromo.code}' Applied!
                </div>
              )}
              <p className="text-xs text-slate-400 mb-6">
                One-time payment • Lifetime validity
              </p>
              <button
                onClick={() => handlePurchase("lifetime")}
                disabled={loadingPlan === "lifetime"}
                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-amber-500/25 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                {loadingPlan === "lifetime" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Launching Cashfree...
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4 fill-white" />
                    GET LIFETIME PASS (₹{getDiscountedPrice(1999)})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Credit Packs & Pay-Per-Download Pass */}
        <div className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl font-black text-app-text tracking-tight mb-2">
              Don't Want a Subscription? Get Credit Packs
            </h2>
            <p className="text-xs sm:text-sm text-app-text-muted">
              Top up AI credits separately or buy a single premium export pass.
              Credits never expire.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {creditPacks.map((pack) => (
              <div
                key={pack.id}
                className="bg-app-surface border border-app-border rounded-2xl p-5 text-center flex flex-col justify-between hover:border-brand-primary/40 transition-all shadow-sm"
              >
                <div>
                  <div className="text-2xl font-black text-brand-primary mb-1">
                    ₹{getDiscountedPrice(pack.price)}{" "}
                    {appliedPromo && (
                      <span className="text-xs font-bold text-slate-400 line-through">
                        ₹{pack.price}
                      </span>
                    )}
                  </div>
                  <div className="text-base font-extrabold text-app-text">
                    {pack.credits} AI Credits
                  </div>
                  <div className="text-[11px] font-medium text-app-text-muted mt-1 mb-4">
                    {pack.perCredit}
                  </div>
                </div>

                <button
                  onClick={() => handlePurchase(pack.id)}
                  disabled={loadingPlan === pack.id}
                  className="w-full py-2.5 rounded-xl font-bold bg-brand-primary/10 text-brand-primary hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 text-xs transition-all cursor-pointer border border-brand-primary/20 hover:border-transparent"
                >
                  BUY PACK (₹{getDiscountedPrice(pack.price)})
                </button>
              </div>
            ))}

            {/* Pay Per Download Card */}
            <div className="bg-gradient-to-br from-teal-500/10 to-indigo-500/10 border border-teal-500/30 rounded-2xl p-5 text-center flex flex-col justify-between shadow-sm">
              <div>
                <div className="text-2xl font-black text-teal-600 dark:text-teal-400 mb-1">
                  ₹{getDiscountedPrice(49)}{" "}
                  {appliedPromo && (
                    <span className="text-xs font-bold text-slate-400 line-through">
                      ₹49
                    </span>
                  )}
                </div>
                <div className="text-base font-extrabold text-app-text flex items-center justify-center gap-1">
                  <Download className="w-4 h-4 text-teal-500" />
                  Single Export Pass
                </div>
                <div className="text-[11px] font-medium text-app-text-muted mt-1 mb-4">
                  1 Premium Export + 50 AI Credits
                </div>
              </div>

              <button
                onClick={() => handlePurchase("pay_per_download")}
                disabled={loadingPlan === "pay_per_download"}
                className="w-full py-2.5 rounded-xl font-bold bg-teal-600 text-white hover:bg-teal-700 text-xs transition-all"
              >
                BUY PASS (₹{getDiscountedPrice(49)})
              </button>
            </div>
          </div>
        </div>

        {/* Promo Code Coupon Box */}
        <div className="max-w-2xl mx-auto bg-app-surface border border-app-border rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-app-text">
                Have a Promo Code?
              </h3>
              <p className="text-xs text-app-text-muted">
                Apply discount codes (e.g. SAVE20, LAUNCH50)
              </p>
            </div>
          </div>

          <p className="text-xs text-app-text-secondary leading-relaxed mb-6">
            Enter your promotional discount coupon code below to apply instant
            price reduction during Cashfree checkout.
          </p>

          {appliedPromo ? (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="font-black text-xs text-emerald-600 dark:text-emerald-400">
                  Coupon '{appliedPromo.code}' Active! (
                  {appliedPromo.discount_value}
                  {appliedPromo.discount_type === "percent" ? "%" : " ₹"} OFF)
                </span>
              </div>
              <button
                onClick={() => setAppliedPromo(null)}
                className="text-xs font-bold text-app-text-muted hover:text-brand-danger underline"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. SAVE20 or LAUNCH50"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-app-bg border border-app-border text-xs text-app-text font-medium uppercase tracking-wider"
              />
              <button
                onClick={handleApplyPromoCode}
                disabled={promoValidating}
                className="px-5 py-2.5 bg-amber-500 text-slate-900 font-bold text-xs rounded-xl shadow-md shrink-0 disabled:opacity-60"
              >
                {promoValidating ? "Checking..." : "Apply Coupon"}
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
