import { FileCheck, AlertCircle, Scale, ShieldAlert, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/landing/Navbar";
import { Footer } from "../components/landing/Footer";

export function TermsOfService() {
  return (
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      {/* Header */}
      <div className="pt-32 pb-12 bg-app-surface/50 border-b border-app-border">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-teal-500/10 rounded-2xl">
              <Scale className="w-8 h-8 text-teal-600 dark:text-teal-400" />
            </div>
            <h1 className="text-4xl font-black text-app-text tracking-tight">
              Terms of Service
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
              <FileCheck className="w-6 h-6 text-teal-600" />
              <h2 className="text-2xl font-bold m-0">Acceptance of Terms</h2>
            </div>
            <p className="text-app-text-secondary leading-relaxed">
              By accessing or using Resumagic.AI, you agree to be bound by these
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
            <p className="text-app-text-secondary leading-relaxed">
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
            <p className="text-app-text-secondary leading-relaxed">
              Resumagic.AI is provided "as is" without any warranties. While we
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
            <p className="text-app-text-secondary leading-relaxed">
              For any legal or technical inquiries regarding these terms, please
              reach out to the owner:
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
      </div>

      <Footer />
    </div>
  );
}
