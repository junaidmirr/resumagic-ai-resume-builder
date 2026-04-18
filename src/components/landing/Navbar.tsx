import { Link, useNavigate } from "react-router-dom";
import { FileText, Menu, X } from "lucide-react";
import { ThemeToggle } from "../ui/ThemeToggle";
import { useState } from "react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80 transition-colors duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="rounded-xl bg-teal-500/10 p-2 text-teal-600 dark:bg-teal-400/10 dark:text-teal-400 group-hover:bg-teal-500/20 transition-colors">
              <FileText className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              ResuMagic
              <span className="text-teal-600 dark:text-teal-400">.AI</span>
            </span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <div className="flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a
              href="#features"
              className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
              Features
            </a>
            <a
              href="#templates"
              className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
              Templates
            </a>
            <a
              href="#pricing"
              className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
              Pricing
            </a>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={() => navigate("/login")}
              className="inline-flex h-9 items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-slate-50 shadow transition-colors hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 cursor-pointer"
            >
              Build Resume
            </button>
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-4 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center justify-center rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50 focus:outline-none transition-colors"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-colors duration-300">
          <div className="space-y-1 px-4 pb-4 pt-2 shadow-lg">
            <a
              href="#features"
              className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900 transition-colors"
            >
              Features
            </a>
            <a
              href="#templates"
              className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900 transition-colors"
            >
              Templates
            </a>
            <a
              href="#pricing"
              className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900 transition-colors"
            >
              Pricing
            </a>
            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/login");
              }}
              className="mt-4 block w-full rounded-full bg-teal-600 px-3 py-2 text-center text-base font-medium text-white shadow-sm hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
