import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  ArrowRight,
  Loader2,
  Globe,
  ShieldCheck,
} from "lucide-react";

export function LoginPage() {
  const { user, login, loginWithEmail, signup, verifyAccount, loading } =
    useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetMode, setResetMode] = useState<
    "none" | "request" | "verify" | "reset"
  >("none");
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [signupVerifyMode, setSignupVerifyMode] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  // Initialize Turnstile
  useEffect(() => {
    const siteKey = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY;
    if (!siteKey || siteKey === "your_site_key_here") {
      console.warn(
        "Turnstile Site Key not configured. Bot protection is in 'bypass' mode.",
      );
      return;
    }

    const renderTurnstile = () => {
      if (window.turnstile && turnstileRef.current && !widgetId.current) {
        widgetId.current = window.turnstile.render(turnstileRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            setTurnstileToken(token);
            setError("");
          },
          "expired-callback": () => {
            setTurnstileToken(null);
            setError("Verification expired. Please try again.");
          },
          "error-callback": () => {
            setTurnstileToken(null);
            setError("Bot protection failed to load. Please refresh.");
          },
        });
      }
    };

    if (window.turnstile) {
      renderTurnstile();
    } else {
      const interval = setInterval(() => {
        if (window.turnstile) {
          renderTurnstile();
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  const verifyWithBackend = async (token: string) => {
    try {
      const response = await fetch("/api/verify-turnstile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const result = await response.json();
      return result.success;
    } catch (err) {
      console.error("Backend verification failed:", err);
      return true;
    }
  };

  const handleSendOTP = async () => {
    if (!resetEmail) {
      setError("Please enter your email");
      return;
    }
    setIsLoggingIn(true);
    setError("");
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await response.json();
      if (data.success) {
        setResetMode("verify");
        setStatusMessage("OTP sent to your email!");
      } else {
        setError(data.error || "Failed to send OTP");
      }
    } catch (err) {
      setError("Server unreachable. Please try again later.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleVerifyAndReset = async () => {
    if (!otp || !newPassword) {
      setError("Please fill in all fields");
      return;
    }
    setIsLoggingIn(true);
    setError("");
    try {
      const response = await fetch("/api/auth/verify-otp-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail,
          otp,
          password: newPassword,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setResetMode("none");
        setAuthMode("login");
        setStatusMessage("Password reset successful! You can now login.");
        setError("");
      } else {
        setError(data.error || "Verification failed");
      }
    } catch (err) {
      setError("Server unreachable. Please try again later.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleVerifySignup = async () => {
    if (!otp) {
      setError("Please enter the verification code");
      return;
    }
    setIsLoggingIn(true);
    setError("");
    try {
      const success = await verifyAccount(resetEmail, otp);
      if (success) {
        setSignupVerifyMode(false);
        setResetMode("none");
        setAuthMode("login");
        setStatusMessage("Account verified successfully! You can now login.");
      } else {
        setError("Invalid or expired verification code.");
      }
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (user) return <Navigate to="/dashboard" replace />;

  const handleGoogleLogin = async () => {
    if (
      !turnstileToken &&
      import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY !==
        "your_site_key_here"
    ) {
      setError("Please complete the bot protection challenge.");
      return;
    }

    setIsLoggingIn(true);
    setError("");
    try {
      if (turnstileToken) {
        const isVerified = await verifyWithBackend(turnstileToken);
        if (!isVerified) {
          setError("Bot protection verification failed. Please try again.");
          return;
        }
      }
      await login();
    } catch (error: any) {
      setError(error.message || "Login failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (
      !turnstileToken &&
      import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY !==
        "your_site_key_here"
    ) {
      setError("Please complete the bot protection challenge.");
      return;
    }

    setIsLoggingIn(true);
    setError("");
    try {
      if (turnstileToken) {
        const isVerified = await verifyWithBackend(turnstileToken);
        if (!isVerified) {
          setError("Bot protection verification failed. Please try again.");
          return;
        }
      }

      if (authMode === "login") {
        await loginWithEmail(email, password);
      } else {
        await signup(email, password);
        setSignupVerifyMode(true);
        setResetMode("verify");
        setResetEmail(email);
        setStatusMessage("Sent! Please check email for verification code.");
      }
    } catch (error: any) {
      setError(error.message || "Authentication failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6 bg-linear-to-b from-teal-50/50 to-white dark:from-slate-900/50 dark:to-slate-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-teal-500 rounded-2xl shadow-lg shadow-teal-500/20 mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
            {authMode === "login" ? "Welcome Back" : "Start Building"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {authMode === "login"
              ? "Sign in to access your cloud-synced resumes."
              : "Create an account to start your professional journey."}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-8">
            <button
              onClick={() => {
                setAuthMode("login");
                setError("");
                setSignupVerifyMode(false);
                setResetMode("none");
              }}
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${authMode === "login" ? "bg-white dark:bg-slate-700 text-teal-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setAuthMode("signup");
                setError("");
                setSignupVerifyMode(false);
                setResetMode("none");
              }}
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${authMode === "signup" ? "bg-white dark:bg-slate-700 text-teal-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4 mb-8">
            {resetMode === "none" ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 ring-teal-500/20 focus:border-teal-500 transition-all"
                    placeholder="name@example.com"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5 ml-1">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Password
                    </label>
                    {authMode === "login" && (
                      <button
                        type="button"
                        onClick={() => {
                          setResetMode("request");
                          setError("");
                          setStatusMessage("");
                        }}
                        className="text-[10px] font-bold text-teal-600 hover:text-teal-700 uppercase tracking-widest"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 ring-teal-500/20 focus:border-teal-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </>
            ) : resetMode === "request" ? (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                  Reset Email
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 ring-teal-500/20 focus:border-teal-500 transition-all"
                  placeholder="name@example.com"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                    {signupVerifyMode ? "Verification Code" : "6-Digit OTP"}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 text-center text-xl font-bold tracking-[8px] outline-none focus:ring-2 ring-teal-500/20 focus:border-teal-500 transition-all"
                    placeholder="000000"
                  />
                </div>
                {!signupVerifyMode && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 ring-teal-500/20 focus:border-teal-500 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Turnstile Widget Placeholder */}
            {resetMode === "none" &&
              import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY !==
                "your_site_key_here" && (
                <div className="flex justify-center py-2">
                  <div ref={turnstileRef}></div>
                </div>
              )}

            {statusMessage && (
              <p className="text-xs text-teal-600 font-medium ml-1">
                {statusMessage}
              </p>
            )}

            {error && (
              <p className="text-xs text-red-500 font-medium ml-1">{error}</p>
            )}

            {resetMode === "none" ? (
              <button
                type="submit"
                disabled={isLoggingIn || loading}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3.5 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-teal-500/20 disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : authMode === "login" ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </button>
            ) : resetMode === "request" ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={isLoggingIn}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3.5 rounded-2xl transition-all"
                >
                  {isLoggingIn ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    "Send Reset Code"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setResetMode("none")}
                  className="w-full text-slate-400 font-bold py-2 text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={
                    signupVerifyMode ? handleVerifySignup : handleVerifyAndReset
                  }
                  disabled={isLoggingIn}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3.5 rounded-2xl transition-all"
                >
                  {isLoggingIn ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : signupVerifyMode ? (
                    "Verify & Activate"
                  ) : (
                    "Verify & Reset"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResetMode("none");
                    setSignupVerifyMode(false);
                  }}
                  className="w-full text-slate-400 font-bold py-2 text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-4 text-slate-400 font-bold tracking-widest">
                Or continue with
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            type="button"
            disabled={isLoggingIn || loading}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-4 px-6 rounded-2xl font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isLoggingIn ? (
              <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
            ) : (
              <Globe className="w-5 h-5 text-teal-500 group-hover:rotate-12 transition-transform" />
            )}
            Google Account
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4 py-2 opacity-50">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Secured by Firebase, Cloudflare & Mailjet
            </span>
            <ShieldCheck size={10} className="text-teal-500" />
          </div>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>

        <div className="mt-12 group flex items-center justify-center gap-2 text-slate-400 hover:text-teal-500 transition-colors cursor-pointer">
          <span className="text-sm font-medium">
            Learn more about our AI Architect
          </span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
}
