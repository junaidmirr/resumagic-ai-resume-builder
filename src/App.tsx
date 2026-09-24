import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { LandingPage } from "./pages/LandingPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { EditorPage } from "./pages/EditorPage";
import { WizardPage } from "./pages/WizardPage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AuthModalProvider } from "./components/onboarding/AuthModalContext";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { TermsOfService } from "./pages/TermsOfService";
import ProfilePage from "./pages/ProfilePage";
import PricingPage from "./pages/PricingPage";
import { ErrorPage } from "./pages/ErrorPage";

// Resource & Company Pages
import { CareerBlogPage } from "./pages/CareerBlogPage";
import { InterviewGuidePage } from "./pages/InterviewGuidePage";
import { ResumeExamplesPage } from "./pages/ResumeExamplesPage";
import { HelpCenterPage } from "./pages/HelpCenterPage";
import { StatusPage } from "./pages/StatusPage";
import { AboutUsPage } from "./pages/AboutUsPage";
import { ContactPage } from "./pages/ContactPage";

import React, { lazy, Suspense, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { AuthModal } from "./components/onboarding/AuthModal";
import { DialogProvider } from "./context/DialogContext";
import { NotificationProvider } from "./context/NotificationContext";
import { trackPageVisit } from "./lib/analytics";

// Dynamic Code-Splitting Lazy Imports for Secret Admin Panel (kept out of initial client bundle)
const AdminLoginPage = lazy(() =>
  import("./pages/AdminLoginPage").then((m) => ({ default: m.AdminLoginPage })),
);
const AdminDashboardPage = lazy(() =>
  import("./pages/AdminDashboardPage").then((m) => ({
    default: m.AdminDashboardPage,
  })),
);

function AdminLoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
        <span className="text-sm font-semibold tracking-wider uppercase text-slate-400">
          Loading Secret Admin Portal...
        </span>
      </div>
    </div>
  );
}

import { CaptchaProvider } from "./context/CaptchaContext";

const ROUTE_SEO: Record<string, { title: string; desc: string }> = {
  "/": {
    title: "Resumagic — AI-Powered Resume Builder & ATS Optimizer",
    desc: "Create job-winning, ATS-optimized resumes in seconds with AI. Professional designer templates, Google XYZ bullet points, vector PDF downloads, and career documents.",
  },
  "/pricing": {
    title: "Transparent Pricing & AI Plans | Resumagic",
    desc: "Explore Resumagic plans. Free tier available with 15 free AI credits, Starter, and Pro plans with unlimited resume exports.",
  },
  "/resources/blog": {
    title: "ATS Engineering & Career Documentation | Resumagic",
    desc: "In-depth research on Applicant Tracking System parsers, vector embeddings, Google XYZ formulas, and executive career strategy.",
  },
  "/blog": {
    title: "ATS Engineering & Career Documentation | Resumagic",
    desc: "In-depth research on Applicant Tracking System parsers, vector embeddings, Google XYZ formulas, and executive career strategy.",
  },
  "/resources/interview-guide": {
    title: "Interview Preparation & STAR Method Guide | Resumagic",
    desc: "Master system design, behavioral, and executive leadership interview questions with the STAR method and salary negotiation frameworks.",
  },
  "/interview-guide": {
    title: "Interview Preparation & STAR Method Guide | Resumagic",
    desc: "Master system design, behavioral, and executive leadership interview questions with the STAR method and salary negotiation frameworks.",
  },
  "/resources/examples": {
    title: "ATS-Approved Resume Examples by Industry | Resumagic",
    desc: "Browse high-converting resume examples for software engineers, product managers, executive directors, and cybersecurity architects.",
  },
  "/about": {
    title: "About Us | Resumagic AI Resume Builder",
    desc: "Learn about Resumagic's mission to empower job seekers with institutional-grade AI resume writing and ATS optimization technology.",
  },
  "/contact": {
    title: "Contact & Support | Resumagic",
    desc: "Get in touch with the Resumagic engineering and customer support team for assistance with your account or career documents.",
  },
  "/privacy": {
    title: "Privacy Policy | Resumagic",
    desc: "Learn how Resumagic safeguards your personal career data and privacy with enterprise encryption.",
  },
  "/terms": {
    title: "Terms of Service | Resumagic",
    desc: "Read the Terms of Service governing the use of the Resumagic AI platform and career tools.",
  },
};

/** Fires a page-visit event whenever the URL pathname changes, updates SEO meta, and monitors offline state */
function RouteAnalytics() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Remove dynamic segments like /editor?id=xxx → just use pathname
    const slug = location.pathname.replace(/^\//, "") || "home";
    void trackPageVisit(slug);

    // Dynamic SEO page title and meta description updates
    const seo = ROUTE_SEO[location.pathname];
    if (seo) {
      document.title = seo.title;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute("content", seo.desc);
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleOffline = () => {
      navigate("/offline");
    };
    window.addEventListener("offline", handleOffline);
    return () => window.removeEventListener("offline", handleOffline);
  }, [navigate]);

  return null;
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <DialogProvider>
        <CaptchaProvider>
          <AuthModalProvider>
            <AuthProvider>
              <NotificationProvider>
                <BrowserRouter>
                  <RouteAnalytics />
                  <AuthModal />
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />

                    {/* Code-Split Secret Admin Routes */}
                    <Route
                      path="/worklabs_adminforresumagic"
                      element={
                        <Suspense fallback={<AdminLoadingFallback />}>
                          <AdminLoginPage />
                        </Suspense>
                      }
                    />
                    <Route
                      path="/worklabs_adminforresumagic/dashboard"
                      element={
                        <Suspense fallback={<AdminLoadingFallback />}>
                          <AdminDashboardPage />
                        </Suspense>
                      }
                    />

                    {/* Resource Pages */}
                    <Route
                      path="/resources/blog"
                      element={<CareerBlogPage />}
                    />
                    <Route path="/blog" element={<CareerBlogPage />} />
                    <Route
                      path="/resources/interview-guide"
                      element={<InterviewGuidePage />}
                    />
                    <Route
                      path="/interview-guide"
                      element={<InterviewGuidePage />}
                    />
                    <Route
                      path="/resources/examples"
                      element={<ResumeExamplesPage />}
                    />
                    <Route path="/examples" element={<ResumeExamplesPage />} />
                    <Route
                      path="/resume-examples"
                      element={<ResumeExamplesPage />}
                    />
                    <Route
                      path="/resources/help"
                      element={<HelpCenterPage />}
                    />
                    <Route path="/help" element={<HelpCenterPage />} />
                    <Route path="/status" element={<StatusPage />} />

                    {/* Company Pages */}
                    <Route path="/about" element={<AboutUsPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/careers" element={<AboutUsPage />} />

                    {/* Protected SaaS Routes */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <DashboardPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/build"
                      element={
                        <ProtectedRoute>
                          <OnboardingPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/editor"
                      element={
                        <ProtectedRoute>
                          <EditorPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/wizard"
                      element={
                        <ProtectedRoute>
                          <WizardPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <ProfilePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/pricing"
                      element={
                        <ProtectedRoute>
                          <PricingPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Legal Routes */}
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />

                    {/* Dedicated Error Pages */}
                    <Route path="/404" element={<ErrorPage type="404" />} />
                    <Route path="/403" element={<ErrorPage type="403" />} />
                    <Route path="/500" element={<ErrorPage type="500" />} />
                    <Route path="/503" element={<ErrorPage type="503" />} />
                    <Route
                      path="/maintenance"
                      element={<ErrorPage type="503" />}
                    />
                    <Route
                      path="/offline"
                      element={<ErrorPage type="offline" />}
                    />

                    {/* Catch-All Unmatched Route -> 404 */}
                    <Route path="*" element={<ErrorPage type="404" />} />
                  </Routes>
                </BrowserRouter>
              </NotificationProvider>
            </AuthProvider>
          </AuthModalProvider>
        </CaptchaProvider>
      </DialogProvider>
    </ThemeProvider>
  );
}

export default App;
