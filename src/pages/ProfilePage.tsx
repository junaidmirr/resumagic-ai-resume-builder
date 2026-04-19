import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  User,
  Mail,
  CreditCard,
  Trash2,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Send,
  CheckCircle2,
  ChevronLeft,
  Settings,
  LogOut,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function ProfilePage() {
  const { user, credits, logout, verifyAccount } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete your account? This action is permanent and all your resumes will be lost.",
      )
    )
      return;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/user/delete", {
        method: "POST",
        headers: { "X-User-ID": user?.uid || "" },
      });
      if (response.ok) {
        await logout();
        window.location.href = "/";
      } else {
        throw new Error("Failed to delete account");
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: "Account deletion failed. Please contact support.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendCode = async () => {
    setIsVerifying(true);
    try {
      const response = await fetch("/api/auth/send-verification-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.email }),
      });
      if (response.ok) {
        setShowOtpInput(true);
        setMessage({
          type: "success",
          text: "Verification code sent to your email!",
        });
      } else {
        throw new Error("Failed to send code");
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to send verification code." });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyCode = async () => {
    if (otp.length !== 6) return;
    setIsVerifying(true);
    try {
      const success = await verifyAccount(user?.email || "", otp);
      if (success) {
        setMessage({ type: "success", text: "Account verified successfully!" });
        setShowOtpInput(false);
        setTimeout(() => window.location.reload(), 2000);
      } else {
        throw new Error("Invalid code");
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: "Invalid or expired verification code.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-teal-500/10 dark:bg-teal-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative max-w-4xl mx-auto pt-24 pb-20 px-4 sm:px-6">
        {/* Navigation Hero */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/dashboard"
            className="group flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors font-medium"
          >
            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 group-hover:border-teal-500/30 transition-all shadow-sm">
              <ChevronLeft size={20} />
            </div>
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <button className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-teal-600 transition-all shadow-sm">
              <Settings size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-8">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-teal-500 to-indigo-600 opacity-10" />
              <div className="relative flex flex-col items-center">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-3xl bg-teal-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-teal-500/40 relative z-10">
                    {user?.displayName?.[0] || user?.email?.[0] || "?"}
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-tr from-teal-400 to-indigo-400 rounded-[1.75rem] blur opacity-20 group-hover:opacity-40 transition duration-500" />
                </div>

                <h2 className="mt-6 text-xl font-bold text-slate-900 dark:text-white text-center truncate w-full">
                  {user?.displayName || "Adventurer"}
                </h2>
                <div className="mt-2 px-3 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-lg text-xs font-bold uppercase tracking-wider">
                  Premium Member
                </div>

                <div className="w-full mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <Mail size={16} />
                    <span className="text-sm truncate">{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <ShieldCheck
                      size={16}
                      className={
                        user?.emailVerified
                          ? "text-emerald-500"
                          : "text-amber-500"
                      }
                    />
                    <span className="text-sm font-medium">
                      {user?.emailVerified
                        ? "Verified Account"
                        : "Pending Verification"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="w-full mt-8 py-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 dark:hover:text-rose-400 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Details & Actions */}
          <div className="lg:col-span-2 space-y-8">
            {message && (
              <div
                className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500 ${
                  message.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50"
                    : "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-800/50"
                }`}
              >
                {message.type === "success" ? (
                  <ShieldCheck size={20} />
                ) : (
                  <AlertCircle size={20} />
                )}
                <p className="font-semibold">{message.text}</p>
              </div>
            )}

            {/* Credit Hub */}
            <div className="group relative overflow-hidden bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-8 transition-all hover:border-teal-500/30">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-gradient-to-tr from-teal-500/20 to-indigo-500/20 text-teal-600 dark:text-teal-400 rounded-3xl flex items-center justify-center relative">
                    <CreditCard size={32} />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 rounded-full border-2 border-white dark:border-slate-900" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                      Power Balance
                    </p>
                    <p className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {credits} Credits
                    </p>
                  </div>
                </div>
                <Link
                  to="/pricing"
                  className="w-full sm:w-auto px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl hover:scale-105 transition-all shadow-lg active:scale-95"
                >
                  UPGRADE
                </Link>
              </div>
            </div>

            {/* Security Section */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-8 space-y-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck size={20} className="text-teal-500" />
                Security & Verification
              </h3>

              <div
                className={`p-6 rounded-3xl border-2 transition-all ${
                  user?.emailVerified
                    ? "bg-emerald-50/30 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30"
                    : "bg-amber-50/30 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/30"
                }`}
              >
                {!user?.emailVerified ? (
                  <div className="space-y-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900 dark:text-white">
                          Email Identification
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-wide font-medium">
                          Verify your email to unlock all AI features and secure
                          your drafts.
                        </p>
                      </div>
                      {!showOtpInput && (
                        <button
                          onClick={handleSendCode}
                          disabled={isVerifying}
                          className="px-6 py-2.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                        >
                          {isVerifying ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <Send size={16} />
                          )}
                          SEND
                        </button>
                      )}
                    </div>

                    {showOtpInput && (
                      <div className="space-y-6 pt-6 border-t border-amber-200/50 dark:border-amber-800/50 animate-in zoom-in-95 duration-500">
                        <div className="flex flex-col sm:flex-row gap-4">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="6-DIGIT CODE"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="flex-1 px-6 py-4 bg-white dark:bg-slate-950 border-2 border-amber-200 dark:border-amber-800/50 rounded-2xl text-center text-2xl font-black tracking-[0.4em] outline-none focus:border-amber-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-200 dark:placeholder:text-slate-800"
                          />
                          <button
                            onClick={handleVerifyCode}
                            disabled={isVerifying || otp.length !== 6}
                            className="px-10 py-4 bg-teal-600 text-white font-black rounded-2xl hover:bg-teal-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-teal-500/20 disabled:opacity-50"
                          >
                            {isVerifying ? (
                              <Loader2 className="animate-spin" size={20} />
                            ) : (
                              <CheckCircle2 size={20} />
                            )}
                            ACTIVATE
                          </button>
                        </div>
                        <p
                          className="text-center text-xs font-bold text-amber-600/60 uppercase tracking-widest cursor-pointer hover:text-amber-600 transition-colors"
                          onClick={handleSendCode}
                        >
                          Resend Verification Code
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-lg leading-none">
                        Security Verified
                      </p>
                      <p className="text-xs font-bold text-emerald-600/70 uppercase tracking-widest mt-1">
                        Full access granted
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-rose-50/50 dark:bg-rose-950/10 rounded-[2rem] border border-rose-100 dark:border-rose-900/30 p-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-rose-600 flex items-center gap-2">
                    <AlertCircle size={20} />
                    Danger Zone
                  </h3>
                  <p className="text-sm text-rose-700/60 dark:text-rose-400 font-medium">
                    Permanently delete your account and all associated data.
                  </p>
                </div>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="px-6 py-3 border-2 border-rose-200 dark:border-rose-800 text-rose-600 font-bold rounded-2xl hover:bg-rose-600 hover:text-white transition-all flex items-center gap-2"
                >
                  {isDeleting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Trash2 size={18} />
                  )}
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
