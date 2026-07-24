import { useState, useEffect } from 'react';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, ChevronRight, LogOut, LayoutDashboard, Settings, Moon, Sun,
  Sparkles, FileText, Layers, ShieldCheck, Award, Target, HelpCircle, 
  CreditCard, Briefcase, ShieldAlert, BookOpen, Mail, UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAuthModal } from '../onboarding/AuthModalContext';
import { useTheme } from '../theme-provider';
import defaultLogoLight from '../../assets/default.png';
import defaultLogoDark from '../../assets/default-dark.png';

export function Navbar() {
  const { user, credits, logout } = useAuth();
  const { openModal } = useAuthModal();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
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

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      setIsUserMenuOpen(false);
      setIsMobileMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleNavAnchor = (hash: string) => {
    setIsMobileMenuOpen(false);
    if (location.pathname !== "/") {
      navigate(`/${hash}`);
    } else {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const isNavActive = (path: string) => location.pathname === path;

  return (
    <>
      <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'py-3 bg-app-bg/85 backdrop-blur-xl border-b border-app-border shadow-sm' 
          : 'py-4 md:py-5 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-primary blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <img src={defaultLogoLight} alt="Resumagic" className="h-8 sm:h-9 relative z-10 logo-light" />
              <img src={defaultLogoDark} alt="Resumagic" className="h-8 sm:h-9 relative z-10 logo-dark" />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-7">
            <button onClick={() => handleNavAnchor("#features")} className="text-sm font-medium text-app-text-secondary hover:text-brand-primary transition-colors">Features</button>
            <button onClick={() => handleNavAnchor("#how-it-works")} className="text-sm font-medium text-app-text-secondary hover:text-brand-primary transition-colors">How it Works</button>
            <button onClick={() => handleNavAnchor("#templates")} className="text-sm font-medium text-app-text-secondary hover:text-brand-primary transition-colors">Templates</button>
            <Link to="/resources/interview-guide" className={`text-sm font-medium transition-colors ${isNavActive('/resources/interview-guide') ? 'text-brand-primary font-bold' : 'text-app-text-secondary hover:text-brand-primary'}`}>
              Interview Guide
            </Link>
            <Link to="/resume-examples" className={`text-sm font-medium transition-colors ${isNavActive('/resume-examples') ? 'text-brand-primary font-bold' : 'text-app-text-secondary hover:text-brand-primary'}`}>
              Examples
            </Link>
            <Link to="/pricing" className={`text-sm font-medium transition-colors ${isNavActive('/pricing') ? 'text-brand-primary font-bold' : 'text-app-text-secondary hover:text-brand-primary'}`}>
              Pricing
            </Link>
          </nav>

          {/* Auth Actions & Theme Toggle (Desktop) */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4">
            <button
              onClick={toggleTheme}
              className="p-2.5 text-app-text-secondary hover:text-brand-primary hover:bg-app-surface rounded-xl transition-colors"
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
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full border border-app-border hover:bg-app-surface transition-colors focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-app-text max-w-[110px] truncate">
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
                      className="absolute right-0 mt-2 w-56 glass-card rounded-2xl overflow-hidden shadow-xl shadow-brand-primary/10 border border-app-border origin-top-right z-50"
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
                          to="/resources/interview-guide" 
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-app-text hover:bg-brand-primary/10 hover:text-brand-primary rounded-xl transition-colors"
                        >
                          <Target className="w-4 h-4 text-brand-primary" />
                          Interview Prep Guide
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
                  className="text-sm font-medium text-app-text hover:text-brand-primary transition-colors px-3 py-2"
                >
                  Log In
                </button>
                <button 
                  onClick={() => openModal({ title: "Create your account" })}
                  className="relative group px-4 py-2 rounded-xl font-semibold text-sm text-white overflow-hidden shadow-md shadow-brand-primary/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-primary to-brand-secondary"></div>
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="relative flex items-center gap-1.5">
                    Start Building
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            {user && (
              <Link
                to="/pricing"
                className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold border border-amber-500/20 shadow-sm shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                <span>{credits}</span>
              </Link>
            )}
            <button
              onClick={toggleTheme}
              className="p-2 text-app-text hover:bg-app-surface rounded-xl transition-colors"
              aria-label="Toggle Theme"
            >
              <Moon className="w-5 h-5 logo-dark" />
              <Sun className="w-5 h-5 logo-light" />
            </button>
            <button 
              className="p-2 text-app-text hover:bg-app-surface rounded-xl transition-colors border border-app-border/60"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open Navigation Drawer"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </motion.header>

    {/* Mobile Side Opening Drawer (Outside Header Stacking Context for Full Screen Viewport Fixed Placement) */}
    <AnimatePresence>
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Slide-in Drawer Container */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 bottom-0 w-[85vw] max-w-sm bg-app-surface border-l border-app-border shadow-2xl z-[100] md:hidden flex flex-col overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-app-border bg-app-bg/50">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2">
                <img src={defaultLogoLight} alt="Resumagic" className="h-7 logo-light" />
                <img src={defaultLogoDark} alt="Resumagic" className="h-7 logo-dark" />
              </Link>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className="p-2 text-app-text hover:bg-app-bg rounded-xl transition-colors"
                >
                  <Moon className="w-4 h-4 logo-dark" />
                  <Sun className="w-4 h-4 logo-light" />
                </button>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-app-text-secondary hover:text-app-text hover:bg-app-bg rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Category 1: Resume Builder & Core Tools */}
              <div>
                <span className="text-[11px] font-bold tracking-wider uppercase text-app-text-muted px-2 mb-2 block">
                  Resume Tools & Builder
                </span>
                <div className="space-y-1">
                  <Link
                    to={user ? "/dashboard" : "/build"}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-app-text hover:bg-brand-primary/10 hover:text-brand-primary transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-brand-primary" />
                    AI Resume Builder
                    <span className="ml-auto text-[10px] bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full font-bold">PRO</span>
                  </Link>
                  <button
                    onClick={() => handleNavAnchor("#templates")}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-app-text hover:bg-brand-primary/10 hover:text-brand-primary transition-colors text-left"
                  >
                    <Layers className="w-4 h-4 text-teal-500" />
                    Template Library (20+)
                  </button>
                  <Link
                    to="/resume-examples"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-app-text hover:bg-brand-primary/10 hover:text-brand-primary transition-colors"
                  >
                    <FileText className="w-4 h-4 text-indigo-500" />
                    Resume Examples
                  </Link>
                </div>
              </div>

              {/* Category 2: Career Prep & Guides */}
              <div>
                <span className="text-[11px] font-bold tracking-wider uppercase text-app-text-muted px-2 mb-2 block">
                  Interview & Resources
                </span>
                <div className="space-y-1">
                  <Link
                    to="/resources/interview-guide"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-app-text hover:bg-brand-primary/10 hover:text-brand-primary transition-colors"
                  >
                    <Target className="w-4 h-4 text-rose-500" />
                    Interview Guide (STAR)
                  </Link>
                  <button
                    onClick={() => handleNavAnchor("#how-it-works")}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-app-text hover:bg-brand-primary/10 hover:text-brand-primary transition-colors text-left"
                  >
                    <HelpCircle className="w-4 h-4 text-amber-500" />
                    How It Works
                  </button>
                  <button
                    onClick={() => handleNavAnchor("#features")}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-app-text hover:bg-brand-primary/10 hover:text-brand-primary transition-colors text-left"
                  >
                    <Award className="w-4 h-4 text-sky-500" />
                    Features & AI Engine
                  </button>
                  <Link
                    to="/pricing"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-app-text hover:bg-brand-primary/10 hover:text-brand-primary transition-colors"
                  >
                    <CreditCard className="w-4 h-4 text-emerald-500" />
                    Pricing & Credits
                  </Link>
                </div>
              </div>

              {/* Category 3: Support & Help */}
              <div>
                <span className="text-[11px] font-bold tracking-wider uppercase text-app-text-muted px-2 mb-2 block">
                  Support & Help
                </span>
                <div className="space-y-1">
                  <Link
                    to="/contact"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-app-text hover:bg-brand-primary/10 hover:text-brand-primary transition-colors"
                  >
                    <Mail className="w-4 h-4 text-slate-400" />
                    Contact & Support
                  </Link>
                </div>
              </div>

            </div>

            {/* Drawer Footer (Auth & User Status) */}
            <div className="p-4 sm:p-5 border-t border-app-border bg-app-bg/80 backdrop-blur-md mt-auto">
              {user ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex flex-col overflow-hidden min-w-0">
                      <span className="text-sm font-bold text-app-text truncate">{user.email}</span>
                      <span className="text-xs text-brand-primary font-medium">Verified Account</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Link 
                      to="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 py-2.5 bg-brand-primary text-white rounded-xl text-xs font-bold shadow-md shadow-brand-primary/20"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-2 py-2.5 bg-brand-danger/10 text-brand-danger rounded-xl text-xs font-bold hover:bg-brand-danger/20 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <button 
                    onClick={() => { setIsMobileMenuOpen(false); openModal({ title: "Welcome Back" }); }}
                    className="w-full py-3 bg-app-surface border border-app-border rounded-xl text-app-text font-bold text-sm hover:border-brand-primary transition-colors"
                  >
                    Log In
                  </button>
                  <button 
                    onClick={() => { setIsMobileMenuOpen(false); openModal({ title: "Create your account" }); }}
                    className="w-full py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-primary/25 hover:opacity-95 transition-opacity"
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
    </>
  );
}
