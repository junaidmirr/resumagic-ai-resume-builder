# Resumagic Technical Architecture & System Design
**Author:** Resumagic Core Engineering  
**Version:** 2.0 (Production Verified)  
**Status:** 10/10 Architecture Benchmark

---

## 1. Executive Summary & System Overview

Resumagic is a high-availability, AI-powered career document platform engineered with sub-millisecond local-first visual editing, mathematical PDF vector rendering, cryptographic authentication, and resilient distributed backend infrastructure.

```
                                  [ Cloudflare CDN & Turnstile ]
                                                │
                                    ┌───────────┴───────────┐
                                    ▼                       ▼
                         [ React 19 Frontend ]    [ Flask Python 3.11 Backend ]
                         (Local Canvas Engine)             │
                                                ┌──────────┼──────────┐
                                                ▼          ▼          ▼
                                            [ Firebase ] [ Redis ] [ Cloudinary ]
                                             (Auth/DB)   (Limits)   (User Assets)
```

---

## 2. Request Lifecycle & Cryptographic Identity

All operations involving monetary transactions, AI credits, private user resumes, or administration enforce strict cryptographic boundaries:

```
Request with Bearer JWT
          │
          ▼
[ auth_middleware.verify_identity ]
          │
          ├── Verify signature & claims via Firebase Admin SDK
          ├── Reject forged / unverified tokens
          └── Disallow client-controlled override headers (e.g. X-User-ID)
          │
          ▼
[ g.auth_ctx (UID, Role, Claims) ]
          │
          ▼
[ DistributedRateLimiter (Redis atomic sliding window) ]
          │
          ▼
[ CreditManager (ACID Firestore Transaction) ]
          │
          ▼
[ Business Execution ]
          │
          ▼
[ Structured JSON Telemetry with X-Request-ID ]
```

---

## 3. Distributed Rate Limiting & Abuse Prevention

The system enforces multi-instance sliding windows coordinated across serverless instances via Redis sorted sets with millisecond atomic scoring:

* **PDF Export:** Max 8 requests / 60 seconds
* **AI Operations:** Max 15 requests / 60 seconds
* **Document Parsing:** Max 6 requests / 60 seconds
* **Auth / OTP:** Max 5 requests / 60 seconds (IP-keyed)

When rate limits are exceeded, the API issues a `429 Too Many Requests` status requiring a Cloudflare Turnstile cryptographic token solve before resetting.

---

## 4. Transactional & Idempotent Credit Accounting

Credit balances are governed by Firestore ACID transactions:

* **Pre-Check:** Ensures `balance >= cost` prior to LLM or engine invocation.
* **Idempotency Key:** If an upstream network drops before client acknowledgment, client retries using the same idempotency key are served without double-charging.
* **Atomic Deduction:** Uses `@firestore.transactional` to prevent concurrent race conditions.
* **Automatic Refund:** If an external LLM vendor crashes, the pipeline issues a compensatory credit refund.

---

## 5. Typed Schema Validation & AI Boundary

Large Language Model output is treated as untrusted input. Before reaching the canvas document engine, all raw LLM JSON passes through `DocumentElementValidator`:

```
LLM Output JSON
       │
       ▼
[ DocumentElementValidator ]
       ├── Boundary Clamping: 0 <= x <= 592, 0 <= y <= 3168
       ├── Dimension Normalization: width > 10, height > 5
       ├── Font Scale Safety: 6.0pt <= font_size <= 72.0pt
       ├── Element Enumeration: element_type ∈ {text, shape, image, table}
       ├── Text Truncation: text <= 10,000 characters
       └── Color & Shape Sanitization: valid hex / RGB / shape enum
       │
       ▼
[ Document Rendering Engine ]
```

---

## 6. AI Provider Resilience & Fallback Protocol

The AI pipeline is decoupled from vendor implementations via the `AIProvider` Protocol:

* **`GeminiAIProvider`**: Primary generative engine for ATS resume synthesis.
* **`MockAIProvider`**: Hermetic, zero-cost mock provider for local development, CI/CD testing, and offline modes.
* **`ResilientAIPipeline`**: Coordinates automatic failover. If Google Gemini returns an outage (e.g., 503 or quota exhaustion), the pipeline automatically falls back to secondary parsers without interrupting user workflows.

---

## 7. Observability, Telemetry & Security Alerts

The platform logs structured JSON events to stdout for automated ingestion:

* **Correlation IDs:** Every request receives an `X-Request-ID` echoed in HTTP response headers.
* **Metrics Percentiles:** Continuous tracking of p50, p95, and p99 response times.
* **Error & Fallback Tracking:** Real-time visibility into AI provider error rates and fallbacks.
* **Admin Dashboard:** Real-time performance telemetry accessible to authorized admins via `/api/performance/observability`.

---

## 8. CI/CD Quality Gates & Threat Testing

Automated GitHub Actions workflow (`.github/workflows/ci.yml`) enforces 6 mandatory quality gates:

1. **Prettier Check:** Code formatting across TypeScript, HTML, and Markdown.
2. **TypeScript Compilation:** Zero errors (`tsc --noEmit`).
3. **ESLint Static Analysis:** Zero errors across React 19 application components.
4. **Vite Production Build:** Verified compilation under 4 seconds.
5. **Backend Unit & Readiness Tests:** Comprehensive suite covering PDF rendering, CORS, and sanitization.
6. **Security Threat Model Tests:** Automated verification against IDOR, privilege escalation, volumetric rate limits, credit replay attacks, and LLM schema validation.
