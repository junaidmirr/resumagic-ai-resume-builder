import { requestGlobalCaptchaChallenge } from "../context/CaptchaContext";

/**
 * Enhanced fetch wrapper that transparently handles rate limits (HTTP 429).
 * If the server responds with a rate limit requiring a Cloudflare Turnstile solve,
 * this function automatically triggers the Turnstile challenge modal, captures the token,
 * and retries the request with the 'X-Turnstile-Token' header.
 */
export async function fetchWithCaptcha(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const originalInit = { ...init };
  const res = await fetch(input, init);

  if (res.status === 429) {
    try {
      const cloned = res.clone();
      const data = await cloned.json().catch(() => ({}));
      if (data && (data.require_captcha || data.status === "rate_limited")) {
        const errorReason =
          data.error ||
          "Rate limit reached. Please complete the quick security check to continue.";

        // Prompt the user with the Cloudflare Turnstile challenge modal
        const turnstileToken = await requestGlobalCaptchaChallenge(errorReason);

        if (turnstileToken) {
          // Retry the request with the verified Turnstile token in headers
          const headers = new Headers(originalInit.headers || {});
          headers.set("X-Turnstile-Token", turnstileToken);

          const retryInit: RequestInit = {
            ...originalInit,
            headers,
          };

          return await fetch(input, retryInit);
        }
      }
    } catch (e: any) {
      if (e?.message?.includes("cancelled")) {
        throw new Error(
          "Action cancelled: Security verification was not completed.",
        );
      }
      console.warn("[fetchWithCaptcha] Challenge handling error:", e);
    }
  }

  return res;
}
