import { FileText, Shield, Lock, Eye, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/landing/Navbar";
import { Footer } from "../components/landing/Footer";

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      {/* Header */}
      <div className="pt-32 pb-12 bg-app-surface/50 border-b border-app-border">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-teal-500/10 rounded-2xl">
              <Shield className="w-8 h-8 text-teal-600 dark:text-teal-400" />
            </div>
            <h1 className="text-4xl font-black text-app-text tracking-tight">
              Privacy Policy
            </h1>
          </div>
          <p className="text-app-text-muted text-lg">
            Last updated: July 22, 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16 flex-1 w-full">
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-12">
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-teal-600" />
              <h2 className="text-2xl font-bold m-0">Introduction</h2>
            </div>
            <p className="text-app-text-secondary leading-relaxed">
              Welcome to Resumagic.AI. This Privacy Policy explains how we
              collect, use, and safeguard your information when you use our
              service. ResuMagic.AI is developed and owned by{" "}
              <strong>Junaid Mir</strong>. We are committed to protecting your
              personal data and your privacy.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-teal-600" />
              <h2 className="text-2xl font-bold m-0">Information We Collect</h2>
            </div>
            <p className="text-app-text-secondary leading-relaxed">
              To provide a high-quality AI-driven resume building experience, we
              collect certain information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-app-text-secondary">
              <li>
                <strong>Account Data:</strong> Email address and profile
                information provided via Google Sign-In or manual signup.
              </li>
              <li>
                <strong>Resume Content:</strong> Any information you enter into
                the resume editor, including work history, education, and
                skills.
              </li>
              <li>
                <strong>Usage Data:</strong> Information about how you interact
                with our platform to help us improve the experience.
              </li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-teal-600" />
              <h2 className="text-2xl font-bold m-0">How We Use Your Data</h2>
            </div>
            <p className="text-app-text-secondary leading-relaxed">
              Your data is used strictly to provide and improve the services of
              ResuMagic.AI.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-app-text-secondary">
              <li>
                <strong>Synchronization:</strong> We use Google Firebase and
                Firestore to securely sync your resumes across devices.
              </li>
              <li>
                <strong>AI Processing:</strong> We use advanced AI services to help
                you generate and refine resume content. Your data is processed
                for the immediate purpose of generating your resume.
              </li>
              <li>
                <strong>Security:</strong> We use Cloudflare Turnstile to
                protect against bots and unauthorized access.
              </li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-teal-600" />
              <h2 className="text-2xl font-bold m-0">Contact Us</h2>
            </div>
            <p className="text-app-text-secondary leading-relaxed">
              If you have any questions about this Privacy Policy or the data
              practices of ResuMagic.AI, please contact the developer directly:
            </p>
            <div className="mt-6 p-6 bg-app-surface border border-app-border rounded-3xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-bold text-app-text uppercase tracking-widest text-[10px] mb-1">
                    Developer & Owner
                  </h4>
                  <p className="text-app-text-secondary font-medium">
                    Junaid Mir
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-app-text uppercase tracking-widest text-[10px] mb-1">
                    Email Support
                  </h4>
                  <p className="text-teal-600 dark:text-teal-400 font-bold">
                    junaidmeer055@gmail.com
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
