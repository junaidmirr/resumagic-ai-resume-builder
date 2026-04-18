import { Globe, Mail, MessageCircle, Heart, FileText } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-teal-500/10 p-2 text-teal-600 dark:bg-teal-400/10 dark:text-teal-400">
                <FileText className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                ResuMagic
                <span className="text-teal-600 dark:text-teal-400">.AI</span>
              </span>
            </div>
            <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
              Build professional, ATS-friendly resumes in minutes with the power
              of artificial intelligence. Stand out and get hired faster.
            </p>
            <div className="flex gap-x-5">
              <a
                href="#"
                className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
              >
                <span className="sr-only">Contact</span>
                <Mail className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
              >
                <span className="sr-only">Community</span>
                <MessageCircle className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
              >
                <span className="sr-only">Company</span>
                <Globe className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-slate-900 dark:text-slate-50">
                  Product
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li>
                    <a
                      href="#"
                      className="text-sm leading-6 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    >
                      Features
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-sm leading-6 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    >
                      Templates
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-sm leading-6 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    >
                      Pricing
                    </a>
                  </li>
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-slate-900 dark:text-slate-50">
                  Support
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li>
                    <a
                      href="#"
                      className="text-sm leading-6 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    >
                      Help Center
                    </a>
                  </li>
                  <li>
                    <Link
                      to="/privacy"
                      className="text-sm leading-6 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    >
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/terms"
                      className="text-sm leading-6 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    >
                      Terms
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-slate-200 dark:border-slate-800 pt-8 sm:mt-20 lg:mt-24 flex flex-col md:flex-row items-center justify-between">
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} ResuMagic.AI. All rights reserved.
          </p>
          <p className="mt-4 md:mt-0 items-center justify-center flex text-xs text-slate-500 dark:text-slate-400">
            Developer:{" "}
            <span className="font-bold text-teal-600 dark:text-teal-400 ml-1">
              Junaid Mir
            </span>
            <span className="mx-2 text-slate-300 dark:text-slate-700">|</span>
            Made with{" "}
            <Heart className="mx-1 h-3 w-3 text-red-500 fill-red-500" /> for
            developers
          </p>
        </div>
      </div>
    </footer>
  );
}
