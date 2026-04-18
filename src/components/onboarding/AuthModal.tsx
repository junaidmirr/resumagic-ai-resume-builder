import { useState, useEffect } from 'react';
import { X, Mail, Lock, ArrowRight, User } from 'lucide-react';
import { useAuthModal } from './AuthModalContext';
import { useNavigate } from 'react-router-dom';

export function AuthModal() {
  const { isOpen, closeModal } = useAuthModal();
  const [view, setView] = useState<'prompt' | 'login' | 'signup'>('prompt');
  const navigate = useNavigate();

  // Reset view to prompt when closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setView('prompt'), 300);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleContinueGuest = () => {
    closeModal();
    navigate('/build');
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    closeModal();
    navigate('/build');
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-0">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
        onClick={closeModal}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl transition-all border border-slate-200 dark:border-slate-800 flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
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
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Save your progress?</h2>
            <p className="mb-8 text-sm text-slate-500 dark:text-slate-400">
              Create an account to securely save your resumes and access them from any device.
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
                className="inline-flex w-full items-center justify-center rounded-xl bg-white dark:bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                Log In to Existing Account
              </button>
            </div>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white dark:bg-slate-900 px-4 text-xs text-slate-500 dark:text-slate-400">OR</span>
              </div>
            </div>

            <button
              onClick={handleContinueGuest}
              className="group inline-flex w-full items-center justify-center rounded-xl border border-transparent px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              Continue without saving
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}

        {/* View: Login / Signup */}
        {(view === 'login' || view === 'signup') && (
          <form className="px-8 pb-8 pt-10" onSubmit={handleAuthSubmit}>
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {view === 'login' ? 'Welcome back' : 'Create an account'}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {view === 'login' ? 'Enter your details to sign in.' : 'Start building your career today.'}
              </p>
            </div>

            <div className="space-y-4">
              {view === 'signup' && (
                <div>
                  <label gap-1 htmlFor="name" className="sr-only">Full Name</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      className="block w-full rounded-xl border-0 py-2.5 pl-10 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6 bg-transparent"
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
                    className="block w-full rounded-xl border-0 py-2.5 pl-10 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6 bg-transparent"
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
                    type="password"
                    name="password"
                    id="password"
                    className="block w-full rounded-xl border-0 py-2.5 pl-10 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6 bg-transparent"
                    placeholder="Password"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
            >
              {view === 'login' ? 'Sign in' : 'Create account'}
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
