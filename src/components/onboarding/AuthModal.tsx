import { useState, useEffect, useRef } from 'react';
import { X, Mail, Lock, ArrowRight, User, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuthModal } from './AuthModalContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { resumeService } from '../../lib/resumeService';

export function AuthModal() {
  const { isOpen, config, closeModal } = useAuthModal();
  const [view, setView] = useState<'prompt' | 'login' | 'signup'>('prompt');
  const navigate = useNavigate();
  const { login, loginWithEmail, signup, user } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  // Initialize Turnstile for AuthModal
  useEffect(() => {
    const siteKey = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY;
    if (!siteKey || siteKey === "your_site_key_here") {
      console.warn("[Turnstile] Site key not configured for AuthModal.");
      return;
    }

    if (!isOpen || (view !== 'login' && view !== 'signup')) return;

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
        console.error("[Turnstile] AuthModal render error:", e);
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
  }, [isOpen, view]);

  // Reset view to prompt when closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setView('prompt');
        setError('');
        setEmail('');
        setPassword('');
        setName('');
        setTurnstileToken(null);
      }, 300);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateBlank = async () => {
    try {
      const id = await resumeService.createResume(user?.uid || "guest", "Untitled Resume", []);
      localStorage.setItem("current_resume_id", id);
      closeModal();
      navigate('/editor');
    } catch (err) {
      console.error(err);
    }
  };

  const handleGoogleLogin = async () => {
    const siteKey = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY;
    if (!turnstileToken && siteKey && siteKey !== "your_site_key_here") {
      setError("Please complete the bot protection challenge.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      if (turnstileToken) {
        const response = await fetch("/api/verify-turnstile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: turnstileToken }),
        });
        const result = await response.json();
        if (!result.success) {
          setError("Bot protection verification failed. Please try again.");
          return;
        }
      }
      await login();
      closeModal();
      if (window.location.pathname === '/') {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || "Google Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (view === 'signup' && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const siteKey = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY;
    if (!turnstileToken && siteKey && siteKey !== "your_site_key_here") {
      setError("Please complete the bot protection challenge.");
      return;
    }

    setLoading(true);
    try {
      if (turnstileToken) {
        const response = await fetch("/api/verify-turnstile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: turnstileToken }),
        });
        const result = await response.json();
        if (!result.success) {
          setError("Bot protection verification failed. Please try again.");
          return;
        }
      }

      if (view === 'login') {
        await loginWithEmail(email, password);
      } else {
        await signup(email, password, name);
      }
      closeModal();
      // If we are on landing page, redirect to dashboard.
      // If we are already in editor, just stay in editor.
      if (window.location.pathname === '/') {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
        onClick={closeModal}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-app-surface shadow-2xl transition-all border border-app-border flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Options */}
        <div className="absolute right-4 top-4">
          <button 
            onClick={closeModal}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* View: Prompt */}
        {view === 'prompt' && (
          <div className="px-8 pb-10 pt-12 text-center">
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-app-text">
              {config?.title || "Save your progress?"}
            </h2>
            <p className="mb-8 text-sm text-app-text-muted">
              {config?.subtitle || "Create an account to securely save your resumes and access them from any device."}
            </p>

            <div className="mt-4 flex flex-col gap-3">
              <button
                onClick={() => setView('signup')}
                className="inline-flex w-full items-center justify-center rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 hover:shadow-md transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
              >
                Sign Up for Free
              </button>
              <button
                onClick={() => setView('login')}
                className="inline-flex w-full items-center justify-center rounded-xl bg-white dark:bg-slate-800 px-4 py-3 text-sm font-semibold text-app-text shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                Log In to Existing Account
              </button>
            </div>
            
            {config?.showBlankOption && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-app-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-app-surface px-4 text-xs text-app-text-muted">OR</span>
                  </div>
                </div>

                <button
                  onClick={handleCreateBlank}
                  className="group inline-flex w-full items-center justify-center rounded-xl border border-transparent px-4 py-3 text-sm font-medium text-app-text-secondary hover:text-slate-900 dark:hover:text-white transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  Create from blank template
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </>
            )}
          </div>
        )}

        {/* View: Login / Signup */}
        {(view === 'login' || view === 'signup') && (
          <form className="px-8 pb-8 pt-10" onSubmit={handleAuthSubmit}>
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-app-text">
                {view === 'login' ? 'Welcome back' : 'Create an account'}
              </h2>
              <p className="mt-1 text-sm text-app-text-muted">
                {view === 'login' ? 'Enter your details to sign in.' : 'Start building your career today.'}
              </p>
            </div>

            {error && (
              <div className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800 text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {view === 'signup' && (
                <div>
                  <label htmlFor="name" className="sr-only">Full Name</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full rounded-xl border-0 py-2.5 pl-10 text-app-text ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6 bg-transparent"
                      placeholder="Full Name"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="sr-only">Email address</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border-0 py-2.5 pl-10 text-app-text ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6 bg-transparent"
                    placeholder="Email address"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border-0 py-2.5 pl-10 pr-10 text-app-text ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6 bg-transparent"
                    placeholder="Password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {view === 'signup' && (
                <div>
                  <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full rounded-xl border-0 py-2.5 pl-10 pr-10 text-app-text ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6 bg-transparent"
                      placeholder="Confirm Password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Turnstile Widget Placeholder */}
            <div className="flex justify-center py-3">
              <div ref={turnstileRef}></div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50"
            >
              {loading ? 'Processing...' : (view === 'login' ? 'Sign in' : 'Create account')}
            </button>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-app-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-app-surface px-3 text-slate-400 font-bold tracking-widest">
                  Or
                </span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              type="button"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-app-border py-3 px-4 rounded-xl font-semibold text-slate-750 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-hover:scale-110 transition-transform">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              Continue with Google
            </button>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setView('prompt')}
                className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Go back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
