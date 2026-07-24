import { BrowserRouter, Routes, Route } from "react-router-dom";
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

// Resource & Company Pages
import { CareerBlogPage } from "./pages/CareerBlogPage";
import { InterviewGuidePage } from "./pages/InterviewGuidePage";
import { ResumeExamplesPage } from "./pages/ResumeExamplesPage";
import { HelpCenterPage } from "./pages/HelpCenterPage";
import { StatusPage } from "./pages/StatusPage";
import { AboutUsPage } from "./pages/AboutUsPage";
import { ContactPage } from "./pages/ContactPage";

import { AuthModal } from "./components/onboarding/AuthModal";
import { DialogProvider } from "./context/DialogContext";
import { NotificationProvider } from "./context/NotificationContext";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <DialogProvider>
        <AuthModalProvider>
          <AuthProvider>
            <NotificationProvider>
              <BrowserRouter>
                <AuthModal />
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/admin_login" element={<AdminLoginPage />} />
                  <Route path="/admin" element={<AdminDashboardPage />} />

                {/* Resource Pages */}
                <Route path="/resources/blog" element={<CareerBlogPage />} />
                <Route path="/blog" element={<CareerBlogPage />} />
                <Route path="/resources/interview-guide" element={<InterviewGuidePage />} />
                <Route path="/interview-guide" element={<InterviewGuidePage />} />
                <Route path="/resources/examples" element={<ResumeExamplesPage />} />
                <Route path="/examples" element={<ResumeExamplesPage />} />
                <Route path="/resume-examples" element={<ResumeExamplesPage />} />
                <Route path="/resources/help" element={<HelpCenterPage />} />
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
              </Routes>
            </BrowserRouter>
          </NotificationProvider>
        </AuthProvider>
        </AuthModalProvider>
      </DialogProvider>
    </ThemeProvider>
  );
}

export default App;
