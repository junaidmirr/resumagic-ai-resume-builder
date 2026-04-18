import { FileCheck, AlertCircle, Scale, ShieldAlert, Mail } from "lucide-react";
import { Link } from "react-router-dom";

export function TermsOfService() {
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
              <Scale className="w-8 h-8 text-teal-600 dark:text-teal-400" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Terms of Service
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
              <FileCheck className="w-6 h-6 text-teal-600" />
              <h2 className="text-2xl font-bold m-0">Acceptance of Terms</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              By accessing or using ResuMagic.AI, you agree to be bound by these
              Terms of Service. This platform is developed and owned by{" "}
              <strong>Junaid Mir</strong>. If you do not agree to these terms,
              please do not use the service.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <ShieldAlert className="w-6 h-6 text-teal-600" />
              <h2 className="text-2xl font-bold m-0">User Responsibilities</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              You are responsible for the information you provide in your
              resumes. You agree not to use the service for any illegal or
              unauthorized purpose.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-teal-600" />
              <h2 className="text-2xl font-bold m-0">
                Disclaimer of Warranties
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              ResuMagic.AI is provided "as is" without any warranties. While we
              strive to provide the best AI-driven design experience, we do not
              guarantee that the generated resumes will result in employment or
              specific professional outcomes.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-teal-600" />
              <h2 className="text-2xl font-bold m-0">Contact Information</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              For any legal or technical inquiries regarding these terms, please
              reach out to the owner:
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
                    Legal Support
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
