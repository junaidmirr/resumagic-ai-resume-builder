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
 *  /analytics/signupMethods   – method breakdown
 *  /analytics/loginMethods    – method breakdown
 */

import { rtdb } from "./firebase";
import { ref, runTransaction, serverTimestamp, set } from "firebase/database";

// ─── Helpers ────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
}

/**
 * Atomically increment a numeric counter at path.
 * Guarantees integer safety and provides fallback if transaction encounters conflict.
 */
async function increment(path: string, by = 1): Promise<void> {
  try {
    const r = ref(rtdb, path);
    await runTransaction(r, (current) => {
      const val = typeof current === "number" && !isNaN(current) ? current : 0;
      return val + by;
    });
  } catch (err) {
    console.warn(`[Analytics] increment transaction notice on ${path}:`, err);
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

  await Promise.allSettled([
    increment(`analytics/overview/totalVisits`),
    increment(`analytics/daily/${d}/visits`),
    increment(`analytics/pages/${safeSlug}`),
  ]);

  if (!_session.visitCounted) {
    _session.visitCounted = true;
    void increment(`analytics/overview/sessionCount`);
  }

  if (!_session.uniqueVisitorChecked) {
    _session.uniqueVisitorChecked = true;
    if (isUniqueVisitor()) {
      await Promise.allSettled([
        increment(`analytics/overview/uniqueVisitors`),
        increment(`analytics/daily/${d}/uniqueVisitors`),
      ]);
    }
  }

  void touch(`analytics/overview/lastUpdated`);
}

/** Call after successful signup */
export async function trackSignup(
  method: "email" | "google" = "email",
): Promise<void> {
  const d = today();
  await Promise.allSettled([
    increment(`analytics/overview/totalSignups`),
    increment(`analytics/daily/${d}/signups`),
    increment(`analytics/signupMethods/${method}`),
  ]);
  void touch(`analytics/overview/lastUpdated`);
}

/** Call after successful login */
export async function trackLogin(
  method: "email" | "google" = "email",
): Promise<void> {
  const d = today();
  await Promise.allSettled([
    increment(`analytics/overview/totalLogins`),
    increment(`analytics/daily/${d}/logins`),
    increment(`analytics/loginMethods/${method}`),
  ]);
  void touch(`analytics/overview/lastUpdated`);
}

/** Track a specific feature being used */
export async function trackFeature(
  feature:
    | "aiArchitect"
    | "aiAssistant"
    | "resumeTemplate"
    | "careerDoc"
    | "careerDocDownload"
    | "coverLetter"
    | "pdfDownload"
    | "imageDownload"
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
    | "referralUsed"
    | "readArticle",
): Promise<void> {
  const d = today();
  await Promise.allSettled([
    increment(`analytics/features/${feature}`),
    increment(`analytics/daily/${d}/featureUsage`),
  ]);
  void touch(`analytics/overview/lastUpdated`);
}

/** Track which resume template was selected / used */
export async function trackTemplateUse(templateId: string): Promise<void> {
  const safe = (templateId || "default").replace(/[.#$/[\]\s]/g, "_");
  const d = today();
  await Promise.allSettled([
    increment(`analytics/templates/${safe}`),
    increment(`analytics/daily/${d}/templateUses`),
    increment(`analytics/overview/totalTemplateUses`),
    increment(`analytics/features/resumeTemplate`),
  ]);
  void touch(`analytics/overview/lastUpdated`);
}

/** Track which career-doc type was generated */
export async function trackCareerDocGenerate(docType: string): Promise<void> {
  const safe = (docType || "career_doc").replace(/[.#$/[\]\s]/g, "_");
  const d = today();
  await Promise.allSettled([
    increment(`analytics/careerDocs/${safe}`),
    increment(`analytics/daily/${d}/careerDocGenerations`),
    increment(`analytics/overview/totalCareerDocs`),
    increment(`analytics/features/careerDoc`),
  ]);
  void touch(`analytics/overview/lastUpdated`);
}

/** Track document downloads (PDF, PNG, JPEG, Markdown) */
export async function trackPdfDownload(format = "pdf"): Promise<void> {
  const d = today();
  await Promise.allSettled([
    increment(`analytics/overview/totalPdfDownloads`),
    increment(`analytics/daily/${d}/pdfDownloads`),
    increment(`analytics/features/pdfDownload`),
    format !== "pdf"
      ? increment(`analytics/features/export_${format}`)
      : Promise.resolve(),
  ]);
  void touch(`analytics/overview/lastUpdated`);
}

/** Track AI credit consumption */
export async function trackAiCreditsConsumed(amount = 1): Promise<void> {
  const d = today();
  await Promise.allSettled([
    increment(`analytics/overview/totalAiCreditsConsumed`, amount),
    increment(`analytics/daily/${d}/aiCreditsConsumed`, amount),
    increment(`analytics/features/aiCreditsUsed`, amount),
  ]);
  void touch(`analytics/overview/lastUpdated`);
}

/** Track active users (call once per authenticated session) */
export async function trackActiveUser(uid: string): Promise<void> {
  const d = today();
  const sessionKey = `rmg_au_${d}`;
  if (sessionStorage.getItem(sessionKey)) return;
  sessionStorage.setItem(sessionKey, "1");
  await Promise.allSettled([
    increment(`analytics/daily/${d}/activeUsers`),
    increment(`analytics/overview/totalActiveUsers`),
  ]);
  try {
    await set(ref(rtdb, `analytics/activeUsersList/${uid}`), {
      ts: serverTimestamp(),
      day: d,
    });
  } catch {
    /* silent */
  }
}
