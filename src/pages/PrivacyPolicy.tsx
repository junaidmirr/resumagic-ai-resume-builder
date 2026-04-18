import { FileText, Shield, Lock, Eye, Mail } from "lucide-react";
import { Link } from "react-router-dom";

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300 antialiased">
      {/* Header */}
      <div className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <Link
            to="/"
            className="inline-flex items-center gap-2 mb-8 text-teal-600 hover:text-teal-700 font-bold transition-colors"
          >
            <span className="text-xl tracking-tight">
              ResuMagic<span className="text-teal-600">.AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-teal-500/10 rounded-2xl">
              <Shield className="w-8 h-8 text-teal-600 dark:text-teal-400" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Privacy Policy
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            Last updated: April 19, 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-12">
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-teal-600" />
              <h2 className="text-2xl font-bold m-0">Introduction</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Welcome to ResuMagic.AI. This Privacy Policy explains how we
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
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              To provide a high-quality AI-driven resume building experience, we
              collect certain information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
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
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Your data is used strictly to provide and improve the services of
              ResuMagic.AI.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
              <li>
                <strong>Synchronization:</strong> We use Google Firebase and
                Firestore to securely sync your resumes across devices.
              </li>
              <li>
                <strong>AI Processing:</strong> We use Google Gemini API to help
                you generate and redesign resume content. Your data is processed
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
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              If you have any questions about this Privacy Policy or the data
              practices of ResuMagic.AI, please contact the developer directly:
            </p>
            <div className="mt-6 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-widest text-[10px] mb-1">
                    Developer & Owner
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">
                    Junaid Mir
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-widest text-[10px] mb-1">
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

        <div className="mt-20 pt-8 border-t border-slate-200 dark:border-slate-800 text-center">
          <Link
            to="/"
            className="text-sm font-bold text-slate-500 hover:text-teal-600 transition-colors uppercase tracking-widest"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
