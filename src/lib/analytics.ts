/**
 * Resumagic Analytics Service
 * Tracks user events and aggregates them in Firebase Realtime Database.
 *
 * RTDB Structure:
 *  /analytics/overview        – cumulative counters
 *  /analytics/daily/YYYY-MM-DD – per-day counters
 *  /analytics/features        – per-feature usage counts
 *  /analytics/templates       – per-template usage counts
 *  /analytics/careerDocs      – per-career-doc-type counts
 *  /analytics/pages           – per-page visit counts
 *  /analytics/sources         – traffic source counts
 */

import { rtdb } from "./firebase";
import { ref, runTransaction, serverTimestamp, set } from "firebase/database";

// ─── Helpers ────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
}

/** Atomically increment a numeric counter at path. Creates it if missing. */
async function increment(path: string, by = 1): Promise<void> {
  try {
    const r = ref(rtdb, path);
    await runTransaction(r, (current) => (current ?? 0) + by);
  } catch {
    // Never throw – analytics failures must not disrupt UX
  }
}

/** Safely set a timestamp at a path */
async function touch(path: string): Promise<void> {
  try {
    await set(ref(rtdb, path), serverTimestamp());
  } catch {
    /* silent */
  }
}

// ─── Session deduplication (per browser session) ────────────────────────────

const _session = {
  visitCounted: false,
  uniqueVisitorChecked: false,
};

function isUniqueVisitor(): boolean {
  const key = "rmg_uv";
  if (localStorage.getItem(key)) return false;
  localStorage.setItem(key, "1");
  return true;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/** Call once per page load / route change */
export async function trackPageVisit(page: string): Promise<void> {
  const safeSlug = page.replace(/[.#$/[\]]/g, "_").toLowerCase() || "home";
  const d = today();

  void increment(`analytics/overview/totalVisits`);
  void increment(`analytics/daily/${d}/visits`);
  void increment(`analytics/pages/${safeSlug}`);

  if (!_session.visitCounted) {
    _session.visitCounted = true;
    void increment(`analytics/overview/sessionCount`);
  }

  if (!_session.uniqueVisitorChecked) {
    _session.uniqueVisitorChecked = true;
    if (isUniqueVisitor()) {
      void increment(`analytics/overview/uniqueVisitors`);
      void increment(`analytics/daily/${d}/uniqueVisitors`);
    }
  }

  void touch(`analytics/overview/lastUpdated`);
}

/** Call after successful signup */
export async function trackSignup(
  method: "email" | "google" = "email",
): Promise<void> {
  const d = today();
  void increment(`analytics/overview/totalSignups`);
  void increment(`analytics/daily/${d}/signups`);
  void increment(`analytics/signupMethods/${method}`);
}

/** Call after successful login */
export async function trackLogin(
  method: "email" | "google" = "email",
): Promise<void> {
  const d = today();
  void increment(`analytics/overview/totalLogins`);
  void increment(`analytics/daily/${d}/logins`);
  void increment(`analytics/loginMethods/${method}`);
}

/** Track a specific feature being used */
export async function trackFeature(
  feature:
    | "aiArchitect"
    | "aiAssistant"
    | "resumeTemplate"
    | "careerDoc"
    | "coverLetter"
    | "pdfDownload"
    | "linkedInImport"
    | "onboarding"
    | "wizardBuild"
    | "imageUpload"
    | "customSection"
    | "colorCustomize"
    | "fontCustomize"
    | "qrCode"
    | "aiCreditsUsed"
    | "promoRedeemed"
    | "referralUsed",
): Promise<void> {
  const d = today();
  void increment(`analytics/features/${feature}`);
  void increment(`analytics/daily/${d}/featureUsage`);
}

/** Track which resume template was selected / used */
export async function trackTemplateUse(templateId: string): Promise<void> {
  const safe = templateId.replace(/[.#$/[\]\s]/g, "_");
  const d = today();
  void increment(`analytics/templates/${safe}`);
  void increment(`analytics/daily/${d}/templateUses`);
  void increment(`analytics/overview/totalTemplateUses`);
}

/** Track which career-doc type was generated */
export async function trackCareerDocGenerate(docType: string): Promise<void> {
  const safe = docType.replace(/[.#$/[\]\s]/g, "_");
  const d = today();
  void increment(`analytics/careerDocs/${safe}`);
  void increment(`analytics/daily/${d}/careerDocGenerations`);
  void increment(`analytics/overview/totalCareerDocs`);
}

/** Track PDF downloads */
export async function trackPdfDownload(): Promise<void> {
  const d = today();
  void increment(`analytics/overview/totalPdfDownloads`);
  void increment(`analytics/daily/${d}/pdfDownloads`);
}

/** Track AI credit consumption */
export async function trackAiCreditsConsumed(amount = 1): Promise<void> {
  const d = today();
  void increment(`analytics/overview/totalAiCreditsConsumed`, amount);
  void increment(`analytics/daily/${d}/aiCreditsConsumed`, amount);
}

/** Track active users (call once per authenticated session) */
export async function trackActiveUser(uid: string): Promise<void> {
  const d = today();
  const sessionKey = `rmg_au_${d}`;
  if (sessionStorage.getItem(sessionKey)) return;
  sessionStorage.setItem(sessionKey, "1");
  void increment(`analytics/daily/${d}/activeUsers`);
  void increment(`analytics/overview/totalActiveUsers`);
  void set(ref(rtdb, `analytics/activeUsersList/${uid}`), {
    ts: serverTimestamp(),
    day: d,
  });
}
