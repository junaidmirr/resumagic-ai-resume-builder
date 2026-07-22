import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Navigate, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Eye,
  EyeOff,
  X,
} from "lucide-react";

export function LoginPage() {
  const { user, login, loginWithEmail, signup, resetPassword, sendVerificationEmail, verifyAccount, loading } =
    useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      console.warn("[Turnstile] Site key not configured. Captcha disabled.");
      return;
    }

    if (resetMode !== "none") return;

    let active = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const renderTurnstile = () => {
      if (!window.turnstile || !turnstileRef.current || !active) return;

      // Clean up any existing widget first
      if (widgetId.current) {
        try { window.turnstile.remove(widgetId.current); } catch {}
        widgetId.current = null;
      }
      turnstileRef.current.innerHTML = "";

      try {
        const wid = window.turnstile.render(turnstileRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            setTurnstileToken(token);
            setError("");
          },
          "expired-callback": () => {
            setTurnstileToken(null);
          },
          "error-callback": () => {
            setTurnstileToken(null);
          },
        });
        widgetId.current = wid;
      } catch (e) {
        console.error("[Turnstile] Render error:", e);
      }
    };

    if (window.turnstile) {
      renderTurnstile();
    } else {
      intervalId = setInterval(() => {
        if (window.turnstile) {
          if (intervalId) clearInterval(intervalId);
          intervalId = null;
          renderTurnstile();
        }
      }, 300);
    }

    return () => {
      active = false;
      if (intervalId) clearInterval(intervalId);
      if (widgetId.current && window.turnstile) {
        try { window.turnstile.remove(widgetId.current); } catch {}
        widgetId.current = null;
      }
      setTurnstileToken(null);
    };
  }, [resetMode, authMode]);

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
      await resetPassword(resetEmail);
      setStatusMessage("Firebase Password reset link sent to your email!");
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to send password reset email.");
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
    const siteKey = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY;
    if (!turnstileToken && siteKey && siteKey !== "your_site_key_here") {
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
    if (authMode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const siteKey = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY;
    if (!turnstileToken && siteKey && siteKey !== "your_site_key_here") {
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-app-bg">
      {/* Left Column - Brand & Immersion (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-brand-primary overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-linear-to-br from-brand-secondary to-brand-accent opacity-90 z-0"></div>
        {/* Animated abstract circles / blur */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/20 blur-3xl rounded-full mix-blend-overlay"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-brand-accent/50 blur-3xl rounded-full mix-blend-overlay"></div>
        
        <div className="relative z-10 w-full max-w-lg">
          <Link to="/" className="inline-flex items-center gap-3 mb-16 hover:opacity-80 transition-opacity">
            <img src="/favicon.svg" alt="Resumagic" className="h-10 w-10 brightness-0 invert" />
            <span className="text-2xl font-bold text-white tracking-tight">Resumagic</span>
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
              Build your professional future with AI.
            </h1>
            <p className="text-lg text-white/80 leading-relaxed mb-12">
              Join thousands of professionals landing their dream jobs with Resumagic's intelligent, beautiful resume builder.
            </p>

            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                <div className="w-10 h-10 rounded-full border-2 border-brand-primary bg-slate-300"></div>
                <div className="w-10 h-10 rounded-full border-2 border-brand-primary bg-slate-400"></div>
                <div className="w-10 h-10 rounded-full border-2 border-brand-primary bg-slate-500 flex items-center justify-center text-xs font-bold text-white">+2k</div>
              </div>
              <div className="text-sm font-medium text-white/90">
                Professionals hired this month
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Column - Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-6 sm:p-12 lg:p-24 relative bg-app-bg">
        {/* Exit / Back to Home Button */}
        <Link
          to="/"
          className="absolute top-6 right-6 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-app-text-secondary hover:text-brand-primary bg-app-surface border border-app-border hover:border-brand-primary/40 transition-all shadow-xs group z-20"
          title="Return to Home Page"
        >
          <X className="w-4 h-4 group-hover:rotate-90 transition-transform" />
          <span>Exit to Home</span>
        </Link>

        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-8 left-8">
          <Link to="/">
            <img src="/favicon.svg" alt="Resumagic" className="h-8 w-8" />
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-app-text mb-3 tracking-tight">
                {authMode === "login" ? "Welcome back" : "Create an account"}
              </h2>
              <p className="text-app-text-muted text-sm">
                {authMode === "login"
                  ? "Enter your details to access your account."
                  : "Start building your professional resume today."}
              </p>
            </div>

            {/* Segmented Control */}
            <div className="relative flex p-1 bg-app-surface/50 border border-app-border rounded-xl mb-8">
              <button
                onClick={() => {
                  setAuthMode("login");
                  setError("");
                  setSignupVerifyMode(false);
                  setResetMode("none");
                }}
                className={`relative flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors z-10 ${
                  authMode === "login" ? "text-app-text" : "text-app-text-muted hover:text-app-text"
                }`}
              >
                {authMode === "login" && (
                  <motion.div
                    layoutId="auth-tab-indicator"
                    className="absolute inset-0 bg-app-surface shadow-sm border border-app-border rounded-lg -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                Login
              </button>
              <button
                onClick={() => {
                  setAuthMode("signup");
                  setError("");
                  setSignupVerifyMode(false);
                  setResetMode("none");
                }}
                className={`relative flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors z-10 ${
                  authMode === "signup" ? "text-app-text" : "text-app-text-muted hover:text-app-text"
                }`}
              >
                {authMode === "signup" && (
                  <motion.div
                    layoutId="auth-tab-indicator"
                    className="absolute inset-0 bg-app-surface shadow-sm border border-app-border rounded-lg -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                Sign Up
              </button>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-5 mb-8">
              {resetMode === "none" ? (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-app-text ml-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-sm text-app-text outline-none focus:ring-2 ring-brand-primary/20 focus:border-brand-primary transition-all placeholder:text-app-text-muted/50 shadow-sm"
                      placeholder="name@example.com"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                      <label className="block text-sm font-medium text-app-text">
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
                          className="text-xs font-semibold text-brand-primary hover:text-brand-secondary transition-colors"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 pr-10 text-sm text-app-text outline-none focus:ring-2 ring-brand-primary/20 focus:border-brand-primary transition-all placeholder:text-app-text-muted/50 shadow-sm"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-app-text-muted hover:text-app-text transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {authMode === "signup" && (
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-app-text ml-1">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 pr-10 text-sm text-app-text outline-none focus:ring-2 ring-brand-primary/20 focus:border-brand-primary transition-all placeholder:text-app-text-muted/50 shadow-sm"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-app-text-muted hover:text-app-text transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : resetMode === "request" ? (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-app-text ml-1">
                    Reset Email
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-sm text-app-text outline-none focus:ring-2 ring-brand-primary/20 focus:border-brand-primary transition-all placeholder:text-app-text-muted/50 shadow-sm"
                    placeholder="name@example.com"
                  />
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-app-text ml-1">
                      {signupVerifyMode ? "Verification Code" : "6-Digit OTP"}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] outline-none focus:ring-2 ring-brand-primary/20 focus:border-brand-primary transition-all shadow-sm"
                      placeholder="000000"
                    />
                  </div>
                  {!signupVerifyMode && (
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-app-text ml-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-sm text-app-text outline-none focus:ring-2 ring-brand-primary/20 focus:border-brand-primary transition-all placeholder:text-app-text-muted/50 shadow-sm"
                        placeholder="••••••••"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Turnstile Widget Placeholder */}
              {resetMode === "none" && (
                <div className="flex justify-center py-2">
                  <div ref={turnstileRef}></div>
                </div>
              )}

              {statusMessage && (
                <p className="text-sm text-brand-success font-medium bg-brand-success/10 p-3 rounded-lg border border-brand-success/20">
                  {statusMessage}
                </p>
              )}

              {error && (
                <p className="text-sm text-brand-danger font-medium bg-brand-danger/10 p-3 rounded-lg border border-brand-danger/20 flex items-start gap-2">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  {error}
                </p>
              )}

              {resetMode === "none" ? (
                <button
                  type="submit"
                  disabled={isLoggingIn || loading}
                  className="relative w-full bg-brand-primary hover:bg-brand-secondary text-white font-semibold py-3.5 rounded-xl transition-all shadow-md shadow-brand-primary/20 disabled:opacity-70 flex justify-center items-center overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                  {isLoggingIn ? (
                    <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                  ) : (
                    <span className="relative z-10">
                      {authMode === "login" ? "Sign In" : "Create Account"}
                    </span>
                  )}
                </button>
              ) : resetMode === "request" ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={isLoggingIn}
                    className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-semibold py-3.5 rounded-xl transition-all shadow-md shadow-brand-primary/20 flex justify-center items-center"
                  >
                    {isLoggingIn ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Send Password Reset Email"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetMode("none")}
                    className="w-full text-app-text-muted hover:text-app-text font-medium py-2.5 text-sm transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={signupVerifyMode ? handleVerifySignup : handleVerifyAndReset}
                    disabled={isLoggingIn}
                    className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-semibold py-3.5 rounded-xl transition-all shadow-md shadow-brand-primary/20 flex justify-center items-center"
                  >
                    {isLoggingIn ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
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
                    className="w-full text-app-text-muted hover:text-app-text font-medium py-2.5 text-sm transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              )}
            </form>

            <div className="relative my-8 flex items-center">
              <div className="flex-grow border-t border-app-border"></div>
              <span className="shrink-0 px-4 text-xs font-medium text-app-text-muted uppercase tracking-widest">
                Or continue with
              </span>
              <div className="flex-grow border-t border-app-border"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              type="button"
              disabled={isLoggingIn || loading}
              className="w-full flex items-center justify-center gap-3 bg-app-surface border border-app-border py-3.5 px-6 rounded-xl font-semibold text-app-text hover:bg-app-bg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isLoggingIn ? (
                <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-hover:scale-105 transition-transform">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              Google Account
            </button>
            
            <p className="mt-8 text-center text-xs text-app-text-muted">
              By continuing, you agree to Resumagic's{" "}
              <Link to="/terms" className="text-app-text hover:underline hover:text-brand-primary transition-colors">Terms of Service</Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-app-text hover:underline hover:text-brand-primary transition-colors">Privacy Policy</Link>.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
