"""
Distributed Rate Limiter Module
===============================
Supports multi-instance Redis rate limiting with atomic sliding windows.
Gracefully falls back to thread-safe in-memory sliding window when Redis is not configured.
Includes Cloudflare Turnstile verification challenge.
"""

import os
import time
import threading
from collections import defaultdict
from flask import request, jsonify

# Check if redis-py is installed
try:
    import redis
    HAS_REDIS = True
except ImportError:
    HAS_REDIS = False
    redis = None


class DistributedRateLimiter:
    """
    Production-grade rate limiter that coordinates across instances using Redis,
    with atomic execution and TTL expiration to prevent race conditions.
    """
    def __init__(self, redis_url: str | None = None):
        self.redis_client = None
        self._lock = threading.Lock()
        self._requests = defaultdict(list)
        self._flagged = defaultdict(bool)

        url = redis_url or os.environ.get("REDIS_URL") or os.environ.get("UPSTASH_REDIS_REST_URL")
        if url and HAS_REDIS:
            try:
                self.redis_client = redis.from_url(url, decode_responses=True, socket_timeout=2)
                self.redis_client.ping()
                print("✅ Distributed Rate Limiter: Connected to Redis.")
            except Exception as e:
                print(f"⚠️ Redis connection failed ({e}). Falling back to local sliding window.")
                self.redis_client = None

        # Rate limits: (max_requests, window_seconds)
        self.limits = {
            "pdf": (8, 60),      # max 8 PDF exports per 60 seconds
            "ai": (15, 60),      # max 15 AI operations per 60 seconds
            "parse": (6, 60),    # max 6 document parses per 60 seconds
            "auth": (5, 60),     # max 5 auth/otp requests per 60 seconds
            "payment": (10, 60), # max 10 payment intents per 60 seconds
        }

    def _get_identity_key(self, req, category: str) -> str:
        # Prioritize verified identity from flask.g if available
        from flask import g
        ctx = getattr(g, "auth_ctx", None)
        uid = ctx.uid if ctx else ""
        client_ip = req.headers.get("X-Forwarded-For", req.remote_addr or "127.0.0.1").split(",")[0].strip()

        if category == "auth":
            return f"rl:{category}:ip:{client_ip}"
        if uid:
            return f"rl:{category}:uid:{uid}"
        return f"rl:{category}:ip:{client_ip}"

    def check_and_record(self, req, category: str = "ai") -> tuple[bool, tuple | None]:
        key = self._get_identity_key(req, category)
        max_reqs, window_sec = self.limits.get(category, (15, 60))
        now = time.time()

        # Check for Cloudflare Turnstile token
        turnstile_token = req.headers.get("X-Turnstile-Token", "").strip()
        if not turnstile_token and req.is_json:
            try:
                data = req.get_json(silent=True) or {}
                turnstile_token = str(data.get("turnstile_token", "")).strip()
            except Exception:
                turnstile_token = ""

        if turnstile_token:
            client_ip = req.headers.get("X-Forwarded-For", req.remote_addr or "127.0.0.1").split(",")[0].strip()
            if self.verify_turnstile(turnstile_token, client_ip):
                self._reset_key(key)
                return True, None

        # 1. Distributed Path via Redis Sorted Set
        if self.redis_client:
            try:
                pipe = self.redis_client.pipeline()
                cutoff = now - window_sec
                # Atomic zremrangebyscore, zadd, zcard, expire
                pipe.zremrangebyscore(key, 0, cutoff)
                pipe.zcard(key)
                pipe.zadd(key, {str(now): now})
                pipe.expire(key, window_sec + 10)
                results = pipe.execute()

                current_count = results[1]
                if current_count >= max_reqs:
                    error_payload = {
                        "status": "rate_limited",
                        "error": "Security verification required: High request volume detected. Please solve the Cloudflare check below to continue.",
                        "require_captcha": True,
                        "category": category,
                        "limit": max_reqs,
                        "window": window_sec
                    }
                    return False, (jsonify(error_payload), 429)
                return True, None
            except Exception as e:
                # If Redis times out, fall back safely to memory limiter
                pass

        # 2. Local Fallback Sliding Window
        with self._lock:
            cutoff = now - window_sec
            self._requests[key] = [ts for ts in self._requests[key] if ts > cutoff]

            if len(self._requests[key]) >= max_reqs or self._flagged[key]:
                self._flagged[key] = True
                error_payload = {
                    "status": "rate_limited",
                    "error": "Security verification required: High request volume detected. Please solve the Cloudflare check below to continue.",
                    "require_captcha": True,
                    "category": category,
                    "limit": max_reqs,
                    "window": window_sec
                }
                return False, (jsonify(error_payload), 429)

            self._requests[key].append(now)
            return True, None

    def _reset_key(self, key: str):
        if self.redis_client:
            try:
                self.redis_client.delete(key)
            except Exception:
                pass
        with self._lock:
            self._requests[key] = []
            self._flagged[key] = False

    def verify_turnstile(self, token: str, remote_ip: str) -> bool:
        if not token:
            return False
        secret_key = os.environ.get("CLOUDFLARE_TURNSTILE_SECRET_KEY")
        if not secret_key or secret_key == "your_secret_key_here":
            return True
        try:
            import requests
            resp = requests.post(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                data={"secret": secret_key, "response": token, "remoteip": remote_ip},
                timeout=3,
            )
            data = resp.json()
            return bool(data.get("success"))
        except Exception:
            return True
