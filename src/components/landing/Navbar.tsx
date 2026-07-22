import { useState, useEffect } from 'react';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight, LogOut, LayoutDashboard, Settings, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAuthModal } from '../onboarding/AuthModalContext';
import { useTheme } from '../theme-provider';
import defaultLogoLight from '../../assets/default.png';
import defaultLogoDark from '../../assets/default-dark.png';

export function Navbar() {
  const { user, logout } = useAuth();
  const { openModal } = useAuthModal();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setIsUserMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'py-3 bg-app-bg/80 backdrop-blur-xl border-b border-app-border shadow-sm' 
          : 'py-5 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-primary blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <img src={defaultLogoLight} alt="Resumagic" className="h-9 relative z-10 logo-light" />
              <img src={defaultLogoDark} alt="Resumagic" className="h-9 relative z-10 logo-dark" />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-app-text-secondary hover:text-brand-primary transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-app-text-secondary hover:text-brand-primary transition-colors">How it Works</a>
            <a href="#templates" className="text-sm font-medium text-app-text-secondary hover:text-brand-primary transition-colors">Templates</a>
            <a href="#pricing" className="text-sm font-medium text-app-text-secondary hover:text-brand-primary transition-colors">Pricing</a>
          </nav>

          {/* Auth Actions & Theme Toggle */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 text-app-text-secondary hover:text-brand-primary hover:bg-app-surface rounded-xl transition-colors"
              title="Toggle Dark Mode"
            >
              <Moon className="w-5 h-5 logo-dark" />
              <Sun className="w-5 h-5 logo-light" />
            </button>
            {user ? (
              <div className="flex items-center gap-3 relative">
                <NotificationCenter />
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-3 p-1.5 pr-3 rounded-full border border-app-border hover:bg-app-surface transition-colors focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center text-white font-bold text-sm">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-app-text max-w-[120px] truncate">
                    {user.email}
                  </span>
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 glass-card rounded-2xl overflow-hidden shadow-xl shadow-brand-primary/10 border border-app-border origin-top-right"
                    >
                      <div className="p-2 space-y-1">
                        <Link 
                          to="/dashboard" 
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-app-text hover:bg-brand-primary/10 hover:text-brand-primary rounded-xl transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </Link>
                        <Link 
                          to="/settings" 
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-app-text hover:bg-brand-primary/10 hover:text-brand-primary rounded-xl transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>
                        <div className="h-px bg-app-border my-1"></div>
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-brand-danger hover:bg-brand-danger/10 rounded-xl transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <button 
                  onClick={() => openModal({ title: "Welcome Back" })}
                  className="text-sm font-medium text-app-text hover:text-brand-primary transition-colors px-4 py-2"
                >
                  Log In
                </button>
                <button 
                  onClick={() => openModal({ title: "Create your account" })}
                  className="relative group px-5 py-2.5 rounded-xl font-semibold text-sm text-white overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-primary to-brand-secondary"></div>
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="relative flex items-center gap-2">
                    Start Building
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button & Theme Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 text-app-text hover:bg-app-surface rounded-xl transition-colors"
            >
              <Moon className="w-5 h-5 logo-dark" />
              <Sun className="w-5 h-5 logo-light" />
            </button>
            <button 
              className="p-2 text-app-text hover:bg-app-surface rounded-xl transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-app-bg/80 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed top-0 right-0 bottom-0 w-[80%] max-w-sm bg-app-surface border-l border-app-border shadow-2xl z-50 md:hidden flex flex-col"
            >
              <div className="p-5 flex items-center justify-between border-b border-app-border">
                <img src={defaultLogoLight} alt="Resumagic" className="h-8 logo-light" />
                <img src={defaultLogoDark} alt="Resumagic" className="h-8 logo-dark" />
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-app-text-muted hover:text-app-text hover:bg-app-bg rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-6 px-5 flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-app-text hover:text-brand-primary">Features</a>
                  <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-app-text hover:text-brand-primary">How it Works</a>
                  <a href="#templates" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-app-text hover:text-brand-primary">Templates</a>
                  <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-app-text hover:text-brand-primary">Pricing</a>
                </div>
              </div>

              <div className="p-5 border-t border-app-border bg-app-bg/50">
                {user ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center text-white font-bold text-lg">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-semibold text-app-text truncate">{user.email}</span>
                        <span className="text-xs text-app-text-muted">Pro Member</span>
                      </div>
                    </div>
                    <Link 
                      to="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-app-surface border border-app-border rounded-xl text-app-text font-medium hover:border-brand-primary transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <button 
                      onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-brand-danger/10 text-brand-danger rounded-xl font-medium"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => { setIsMobileMenuOpen(false); openModal({ title: "Welcome Back" }); }}
                      className="w-full py-3 bg-app-surface border border-app-border rounded-xl text-app-text font-medium"
                    >
                      Log In
                    </button>
                    <button 
                      onClick={() => { setIsMobileMenuOpen(false); openModal({ title: "Create your account" }); }}
                      className="w-full py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl font-medium shadow-lg shadow-brand-primary/25"
                    >
                      Start Building for Free
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
