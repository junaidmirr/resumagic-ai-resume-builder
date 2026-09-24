"""
Production Observability, Structured JSON Logging & Telemetry Engine
====================================================================
Tracks correlation IDs, structured JSON events, p50/p95/p99 latency percentiles,
AI provider error rates, and centralized security alerts.
"""

import os
import time
import json
import uuid
import threading
from typing import Dict, Any, List
from collections import defaultdict
from flask import request, g


class ObservabilityEngine:
    def __init__(self):
        self._lock = threading.Lock()
        self._latencies = defaultdict(list)  # endpoint -> [ms, ms, ...]
        self._status_codes = defaultdict(lambda: defaultdict(int)) # endpoint -> status -> count
        self._ai_events = []
        self._security_events = []

    def start_request(self) -> str:
        """Assigns correlation ID and starts clock."""
        req_id = request.headers.get("X-Request-ID") or f"req_{uuid.uuid4().hex[:12]}"
        g.request_id = req_id
        g.start_time = time.time()
        return req_id

    def end_request(self, status_code: int, endpoint: str = ""):
        """Records latency and logs structured JSON."""
        t0 = getattr(g, "start_time", time.time())
        latency_ms = (time.time() - t0) * 1000
        req_id = getattr(g, "request_id", "unknown")
        ep = endpoint or request.path

        with self._lock:
            self._latencies[ep].append(latency_ms)
            if len(self._latencies[ep]) > 1000:
                self._latencies[ep] = self._latencies[ep][-1000:]
            self._status_codes[ep][status_code] += 1

        # Structured JSON Log Entry
        log_entry = {
            "timestamp": time.time(),
            "request_id": req_id,
            "method": request.method,
            "path": request.path,
            "status": status_code,
            "latency_ms": round(latency_ms, 2),
            "ip": request.headers.get("X-Forwarded-For", request.remote_addr or "127.0.0.1").split(",")[0].strip(),
            "user_id": getattr(getattr(g, "auth_ctx", None), "uid", None),
        }
        # In production environments, stdout logs are ingested by Datadog, CloudWatch, or Vercel
        print(f"[JSON_LOG] {json.dumps(log_entry)}")

    def record_ai_event(self, provider: str, latency_ms: float, success: bool, error: str | None = None):
        with self._lock:
            self._ai_events.append({
                "timestamp": time.time(),
                "provider": provider,
                "latency_ms": latency_ms,
                "success": success,
                "error": error
            })
            if len(self._ai_events) > 500:
                self._ai_events = self._ai_events[-500:]

    def record_security_event(self, event_type: str, details: Dict[str, Any]):
        entry = {
            "timestamp": time.time(),
            "type": event_type,
            "details": details,
            "request_id": getattr(g, "request_id", None)
        }
        with self._lock:
            self._security_events.append(entry)
            if len(self._security_events) > 200:
                self._security_events = self._security_events[-200:]
        print(f"[SECURITY_ALERT] {json.dumps(entry)}")

    def get_metrics_summary(self) -> Dict[str, Any]:
        """Calculates p50, p95, p99 percentiles and error rates."""
        summary = {}
        with self._lock:
            for ep, lats in self._latencies.items():
                if not lats: continue
                sorted_lats = sorted(lats)
                n = len(sorted_lats)
                p50 = sorted_lats[int(n * 0.50)]
                p95 = sorted_lats[min(int(n * 0.95), n - 1)]
                p99 = sorted_lats[min(int(n * 0.99), n - 1)]

                status_map = dict(self._status_codes[ep])
                total_reqs = sum(status_map.values())
                errors = sum(cnt for code, cnt in status_map.items() if code >= 400)
                err_rate = round((errors / total_reqs * 100), 2) if total_reqs else 0.0

                summary[ep] = {
                    "total_requests": total_reqs,
                    "error_rate_pct": err_rate,
                    "p50_ms": round(p50, 1),
                    "p95_ms": round(p95, 1),
                    "p99_ms": round(p99, 1),
                }

        # AI Provider metrics
        ai_summary = {}
        with self._lock:
            for ev in self._ai_events:
                p = ev["provider"]
                if p not in ai_summary:
                    ai_summary[p] = {"calls": 0, "errors": 0, "latencies": []}
                ai_summary[p]["calls"] += 1
                if not ev["success"]:
                    ai_summary[p]["errors"] += 1
                ai_summary[p]["latencies"].append(ev["latency_ms"])

        for p, data in ai_summary.items():
            lats = sorted(data["latencies"])
            calls = data["calls"]
            p50 = lats[int(calls * 0.50)] if lats else 0
            p95 = lats[min(int(calls * 0.95), calls - 1)] if lats else 0
            err_pct = round((data["errors"] / calls * 100), 2) if calls else 0
            ai_summary[p] = {
                "total_calls": calls,
                "error_rate_pct": err_pct,
                "p50_ms": round(p50, 1),
                "p95_ms": round(p95, 1),
            }

        return {
            "endpoints": summary,
            "ai_providers": ai_summary,
            "security_alerts_count": len(self._security_events),
        }


# Global Singleton
observability = ObservabilityEngine()
