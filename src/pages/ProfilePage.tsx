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
} from "lucide-react";

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
        // Refresh page to update Firebase auth state
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
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-teal-600 px-8 py-10 text-white">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center border-4 border-teal-400/30">
                <User size={40} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {user?.displayName || "User Profile"}
                </h1>
                <p className="text-teal-100 flex items-center gap-2 mt-1">
                  <Mail size={16} /> {user?.email}
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {message && (
              <div
                className={`p-4 rounded-xl flex items-center gap-3 ${
                  message.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    : "bg-rose-50 text-rose-700 border border-rose-100"
                }`}
              >
                {message.type === "success" ? (
                  <ShieldCheck size={20} />
                ) : (
                  <AlertCircle size={20} />
                )}
                <p className="font-medium">{message.text}</p>
              </div>
            )}

            {/* Credits Section */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center">
                  <CreditCard size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Available Credits
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {credits} Credits
                  </p>
                </div>
              </div>
              <button
                onClick={() => (window.location.href = "/pricing")}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
              >
                Recharge
              </button>
            </div>

            {/* Verification Status */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 px-1">
                Account Security
              </h2>
              <div className="p-6 border border-slate-200 rounded-2xl space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {user?.emailVerified ? (
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                        <ShieldCheck size={20} />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                        <AlertCircle size={20} />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-900">
                        Email Verification
                      </p>
                      <p className="text-sm text-slate-500">
                        {user?.emailVerified
                          ? "Your account is fully verified."
                          : "Verification is pending."}
                      </p>
                    </div>
                  </div>
                  {!user?.emailVerified && !showOtpInput && (
                    <button
                      onClick={handleSendCode}
                      disabled={isVerifying}
                      className="px-4 py-2 bg-teal-50 text-teal-600 font-bold rounded-xl hover:bg-teal-100 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {isVerifying ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Send size={16} />
                      )}
                      Verify Now
                    </button>
                  )}
                </div>

                {!user?.emailVerified && showOtpInput && (
                  <div className="space-y-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
                    <p className="text-sm text-slate-600 font-medium">
                      Enter the 6-digit code sent to your email:
                    </p>
                    <div className="flex gap-4">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="000000"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-2xl font-bold tracking-[0.5em] outline-none focus:ring-2 ring-teal-500/20 focus:border-teal-500 transition-all"
                      />
                      <button
                        onClick={handleVerifyCode}
                        disabled={isVerifying || otp.length !== 6}
                        className="px-6 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-teal-500/20"
                      >
                        {isVerifying ? (
                          <Loader2 className="animate-spin" size={20} />
                        ) : (
                          <CheckCircle2 size={20} />
                        )}
                        Verify
                      </button>
                    </div>
                    <button
                      onClick={handleSendCode}
                      className="text-xs text-slate-400 hover:text-teal-600 font-medium transition-colors"
                    >
                      Didn't receive code? Resend
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="pt-4 border-t border-slate-100">
              <h2 className="text-lg font-bold text-rose-600 px-1 mb-4">
                Danger Zone
              </h2>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="w-full sm:w-auto px-6 py-3 bg-rose-50 text-rose-600 font-semibold rounded-xl hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Trash2 size={20} />
                )}
                Delete Account PERMANENTLY
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
