import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";
import { ShieldCheck, X, Loader2 } from "lucide-react";

interface CaptchaContextType {
  challenge: (reason?: string) => Promise<string>;
}

const CaptchaContext = createContext<CaptchaContextType | undefined>(undefined);

// Global trigger reference for non-component calls (e.g. lib utilities)
let globalCaptchaHandler: ((reason?: string) => Promise<string>) | null = null;

export function requestGlobalCaptchaChallenge(
  reason?: string,
): Promise<string> {
  if (globalCaptchaHandler) {
    return globalCaptchaHandler(reason);
  }
  return Promise.reject(
    new Error("Security verification handler is not mounted."),
  );
}

export function CaptchaProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const resolverRef = useRef<((token: string) => void) | null>(null);
  const rejecterRef = useRef<((err: Error) => void) | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const challenge = (customReason?: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      // If another challenge is already pending, reject previous
      if (rejecterRef.current) {
        rejecterRef.current(
          new Error("Superseded by new verification challenge"),
        );
      }

      resolverRef.current = resolve;
      rejecterRef.current = reject;
      setReason(
        customReason ||
          "Security verification required. Please solve the Cloudflare check below to continue.",
      );
      setIsOpen(true);
      setIsVerifying(false);
    });
  };

  useEffect(() => {
    globalCaptchaHandler = challenge;
    return () => {
      globalCaptchaHandler = null;
    };
  }, []);

  const handleClose = () => {
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {}
      widgetIdRef.current = null;
    }
    setIsOpen(false);
    if (rejecterRef.current) {
      rejecterRef.current(
        new Error("Security verification cancelled by user."),
      );
      rejecterRef.current = null;
      resolverRef.current = null;
    }
  };

  const handleSuccess = (token: string) => {
    setIsVerifying(true);
    setTimeout(() => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
        widgetIdRef.current = null;
      }
      setIsOpen(false);
      setIsVerifying(false);
      if (resolverRef.current) {
        resolverRef.current(token);
        resolverRef.current = null;
        rejecterRef.current = null;
      }
    }, 400);
  };

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (!turnstileContainerRef.current) return;

      const siteKey =
        import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY ||
        "0x4AAAAAAC94u7BeJiQhw-i8";

      if (window.turnstile && siteKey) {
        try {
          turnstileContainerRef.current.innerHTML = "";
          widgetIdRef.current = window.turnstile.render(
            turnstileContainerRef.current,
            {
              sitekey: siteKey,
              theme: "auto",
              callback: (token: string) => {
                handleSuccess(token);
              },
              "error-callback": () => {
                console.warn("[Turnstile] Challenge error encountered");
              },
              "expired-callback": () => {
                console.warn("[Turnstile] Challenge expired");
              },
            },
          );
        } catch (e) {
          console.error("[Turnstile] Render error:", e);
        }
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [isOpen]);

  return (
    <CaptchaContext.Provider value={{ challenge }}>
      {children}

      {/* Cloudflare Turnstile Verification Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-app-surface border border-brand-primary/30 rounded-2xl shadow-2xl p-6 text-center overflow-hidden">
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-app-text-muted hover:text-app-text transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Shield Icon */}
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/25">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-app-text mb-1">
              Security Verification Required
            </h3>
            <p className="text-xs text-app-text-secondary leading-relaxed mb-5 max-w-sm mx-auto">
              {reason}
            </p>

            {/* Turnstile Container */}
            <div className="min-h-[75px] flex items-center justify-center my-2">
              <div ref={turnstileContainerRef} id="cf-captcha-challenge"></div>
            </div>

            {isVerifying && (
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-teal-500 mt-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verification confirmed. Resuming request...</span>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-app-border text-[11px] text-app-text-muted flex items-center justify-center gap-1">
              <span>Protected by</span>
              <span className="font-semibold text-app-text">
                Cloudflare Turnstile
              </span>
            </div>
          </div>
        </div>
      )}
    </CaptchaContext.Provider>
  );
}

export function useCaptcha() {
  const context = useContext(CaptchaContext);
  if (!context) {
    throw new Error("useCaptcha must be used within a CaptchaProvider");
  }
  return context;
}
