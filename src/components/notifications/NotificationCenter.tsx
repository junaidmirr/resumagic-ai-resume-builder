import { useState, useRef, useEffect } from "react";
import { useNotifications, type AppNotification } from "../../context/NotificationContext";
import { Bell, Sparkles, Gift, CheckCircle2, ShieldAlert, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, claimReward } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClaim = async (notif: AppNotification) => {
    setClaimingId(notif.id);
    try {
      await claimReward(notif);
    } catch (err) {
      console.error(err);
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl text-app-text-secondary hover:text-app-text hover:bg-app-surface transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-brand-primary text-white text-[10px] font-extrabold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-app-surface border border-app-border rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-app-border flex items-center justify-between bg-app-bg/50">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-brand-primary" />
                <h3 className="font-bold text-app-text text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-app-text-muted hover:text-app-text p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-app-border">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-app-text-muted text-xs">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={`p-4 transition-colors relative cursor-pointer ${
                      !notif.read ? "bg-brand-primary/5 hover:bg-brand-primary/10" : "hover:bg-app-bg"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary shrink-0 mt-0.5">
                        {notif.type === "verification" || notif.type === "reward" ? (
                          <Gift className="w-4 h-4" />
                        ) : notif.type === "welcome" ? (
                          <Sparkles className="w-4 h-4" />
                        ) : (
                          <ShieldAlert className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="text-xs font-bold text-app-text truncate">{notif.title}</h4>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-brand-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-app-text-secondary leading-relaxed mb-2">
                          {notif.message}
                        </p>

                        {(notif.rewardAmount || notif.type === "verification") && (
                          <div>
                            {notif.claimed ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Claimed {notif.rewardAmount || 50} Credits
                              </span>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClaim(notif);
                                }}
                                disabled={claimingId === notif.id}
                                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-md transition-all disabled:opacity-50"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                {claimingId === notif.id
                                  ? "Claiming..."
                                  : `Claim ${notif.rewardAmount || 50} AI Credits`}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NotificationCenter;
