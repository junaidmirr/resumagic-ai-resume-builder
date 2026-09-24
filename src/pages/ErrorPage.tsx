import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileQuestion,
  ShieldAlert,
  ServerCrash,
  Wrench,
  WifiOff,
  ArrowLeft,
  Home,
  RefreshCw,
  HelpCircle,
  Activity,
  ChevronRight,
} from "lucide-react";
import { Navbar } from "../components/landing/Navbar";
import { Footer } from "../components/landing/Footer";

export type ErrorType = "404" | "403" | "500" | "503" | "offline";

interface ErrorConfig {
  code: string;
  badge: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  glowColor: string;
  primaryAction: {
    label: string;
    action: () => void;
    icon: React.ElementType;
  };
  secondaryAction?: {
    label: string;
    href: string;
    icon: React.ElementType;
  };
  troubleshootTips: string[];
}

interface ErrorPageProps {
  type?: ErrorType;
  customTitle?: string;
  customMessage?: string;
  onRetry?: () => void;
}

export function ErrorPage({
  type: propType,
  customTitle,
  customMessage,
  onRetry,
}: ErrorPageProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Determine error type: prop > query param > fallback to 404
  const queryType = searchParams.get("type") as ErrorType | null;
  const errorType: ErrorType = propType || queryType || "404";

  const getErrorConfig = (): ErrorConfig => {
    switch (errorType) {
      case "403":
        return {
          code: "403",
          badge: "Access Denied",
          title: customTitle || "Forbidden Area",
          description:
            customMessage ||
            "You do not have the required permissions or authentication level to access this secure resource.",
          icon: ShieldAlert,
          iconColor: "text-amber-500",
          glowColor: "from-amber-500/20 to-orange-500/10",
          primaryAction: {
            label: "Return to Home",
            action: () => navigate("/"),
            icon: Home,
          },
          secondaryAction: {
            label: "Sign In With Admin Account",
            href: "/login",
            icon: ChevronRight,
          },
          troubleshootTips: [
            "Confirm you are logged in with the appropriate account.",
            "Verify your subscription plan includes access to this feature.",
            "Contact your administrator if you believe this is in error.",
          ],
        };

      case "500":
        return {
          code: "500",
          badge: "System Error",
          title: customTitle || "Internal Server Error",
          description:
            customMessage ||
            "Our servers encountered an unexpected condition while processing your request. Our engineering team has been notified.",
          icon: ServerCrash,
          iconColor: "text-rose-500",
          glowColor: "from-rose-500/20 to-pink-500/10",
          primaryAction: {
            label: onRetry ? "Try Again" : "Reload Application",
            action: onRetry ? onRetry : () => window.location.reload(),
            icon: RefreshCw,
          },
          secondaryAction: {
            label: "Check System Status",
            href: "/status",
            icon: Activity,
          },
          troubleshootTips: [
            "Refresh your browser to resubmit the operation.",
            "Clear your browser cache if the issue persists.",
            "Check our status page to see if all services are operational.",
          ],
        };

      case "503":
        return {
          code: "503",
          badge: "Maintenance Mode",
          title: customTitle || "Service Temporarily Unavailable",
          description:
            customMessage ||
            "Resumagic is currently undergoing scheduled infrastructure upgrades. We will be back online shortly.",
          icon: Wrench,
          iconColor: "text-indigo-400",
          glowColor: "from-indigo-500/20 to-purple-500/10",
          primaryAction: {
            label: "Check Status & Refresh",
            action: () => window.location.reload(),
            icon: RefreshCw,
          },
          secondaryAction: {
            label: "Live System Status",
            href: "/status",
            icon: Activity,
          },
          troubleshootTips: [
            "Upgrades typically take between 5 to 15 minutes.",
            "Your existing documents and saved edits are completely safe.",
            "Live server status updates are published on our status page.",
          ],
        };

      case "offline":
        return {
          code: "OFFLINE",
          badge: "Connection Lost",
          title: customTitle || "No Internet Connection",
          description:
            customMessage ||
            "It appears your device has lost connection to the internet. Please check your network cables or Wi-Fi settings.",
          icon: WifiOff,
          iconColor: "text-cyan-400",
          glowColor: "from-cyan-500/20 to-blue-500/10",
          primaryAction: {
            label: "Retry Connection",
            action: () => window.location.reload(),
            icon: RefreshCw,
          },
          secondaryAction: {
            label: "Back to Dashboard",
            href: "/dashboard",
            icon: Home,
          },
          troubleshootTips: [
            "Verify your Wi-Fi or mobile data is switched on.",
            "Check if airplane mode is turned off.",
            "Restart your router or connect to an alternate network.",
          ],
        };

      case "404":
      default:
        return {
          code: "404",
          badge: "Page Not Found",
          title: customTitle || "Lost in Digital Space",
          description:
            customMessage ||
            "The document, template, or page you are looking for has been moved, renamed, or never existed.",
          icon: FileQuestion,
          iconColor: "text-brand-primary dark:text-cyan-400",
          glowColor: "from-indigo-500/20 to-teal-500/10",
          primaryAction: {
            label: "Go Back Home",
            action: () => navigate("/"),
            icon: Home,
          },
          secondaryAction: {
            label: "Explore Templates",
            href: "/dashboard?tab=templates",
            icon: ChevronRight,
          },
          troubleshootTips: [
            "Double-check the web address for any typos.",
            "Use the navigation bar above to explore existing pages.",
            "Return to your dashboard to view your saved resumes.",
          ],
        };
    }
  };

  const config = getErrorConfig();
  const IconComponent = config.icon;

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col font-sans selection:bg-brand-primary/20">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden py-16 sm:py-24">
        {/* Ambient Animated Background Glow */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr ${config.glowColor} rounded-full blur-3xl pointer-events-none opacity-60 animate-pulse`}
          style={{ animationDuration: "5s" }}
        />

        <div className="max-w-2xl w-full text-center relative z-10 space-y-8">
          {/* Animated Floating Icon Container */}
          <div className="flex justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative"
            >
              {/* Outer Pulsing Ring */}
              <div
                className="absolute inset-0 rounded-3xl bg-brand-primary/10 dark:bg-slate-800/60 blur-xl animate-ping opacity-30"
                style={{ animationDuration: "3s" }}
              />

              {/* Main Animated Icon Badge */}
              <motion.div
                animate={{
                  y: [0, -8, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-app-surface border-2 border-app-border shadow-2xl flex items-center justify-center relative backdrop-blur-md"
              >
                <IconComponent
                  className={`w-12 h-12 sm:w-14 sm:h-14 ${config.iconColor}`}
                />

                {/* Sub-badge code indicator */}
                <div className="absolute -bottom-3 px-3 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-white text-[10px] font-black tracking-widest uppercase shadow-md">
                  {config.code}
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Error Text Block */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="space-y-3"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary dark:text-cyan-400 text-xs font-bold tracking-wide">
              <span>{config.badge}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-app-text">
              {config.title}
            </h1>

            <p className="text-sm sm:text-base text-app-text-muted max-w-lg mx-auto leading-relaxed">
              {config.description}
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
          >
            <button
              onClick={config.primaryAction.action}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <config.primaryAction.icon className="w-4 h-4" />
              {config.primaryAction.label}
            </button>

            {config.secondaryAction && (
              <Link
                to={config.secondaryAction.href}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-app-surface hover:bg-app-border border border-app-border text-app-text font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <config.secondaryAction.icon className="w-4 h-4 text-app-text-muted" />
                {config.secondaryAction.label}
              </Link>
            )}

            <button
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto px-4 py-3.5 rounded-xl text-app-text-muted hover:text-app-text text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Go Back
            </button>
          </motion.div>

          {/* Helpful Guidance Tips Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="p-5 rounded-2xl bg-app-surface/60 border border-app-border text-left max-w-lg mx-auto shadow-sm"
          >
            <h4 className="text-xs font-bold text-app-text uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              Helpful Troubleshooting Steps
            </h4>
            <ul className="space-y-1.5 text-xs text-app-text-muted">
              {config.troubleshootTips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary dark:bg-cyan-400 mt-1.5 shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default ErrorPage;
