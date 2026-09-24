"""
Identity & Authentication Boundaries Module
===========================================
Strict, cryptographic identity verification and authorization context.
Prevents header spoofing, IDOR, privilege escalation, and unauthorized credit consumption.
"""

import os
import json
import base64
from functools import wraps
from flask import request, jsonify, g

try:
    import firebase_admin
    from firebase_admin import auth as fb_auth, firestore as fb_firestore
    HAS_FIREBASE_ADMIN = True
except ImportError:
    HAS_FIREBASE_ADMIN = False
    fb_auth = None
    fb_firestore = None


class AuthContext:
    def __init__(self, uid: str, is_admin: bool = False, email: str = "", auth_method: str = "firebase"):
        self.uid = uid
        self.is_admin = is_admin
        self.email = email
        self.auth_method = auth_method

    def to_dict(self):
        return {
            "uid": self.uid,
            "is_admin": self.is_admin,
            "email": self.email,
            "auth_method": self.auth_method,
        }


def extract_bearer_token(req) -> str | None:
    """Extracts raw JWT bearer token from Authorization header."""
    auth_header = req.headers.get("Authorization", "")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split("Bearer ", 1)[1].strip()
        if token:
            return token
    return None


def verify_identity(req, db_admin=None) -> AuthContext | None:
    """
    Cryptographically verifies user identity.
    NO trust is placed in client-controllable headers like X-User-ID.
    """
    token = extract_bearer_token(req)
    if not token:
        # Development / test environment fallback ONLY when explicitly enabled
        if os.environ.get("FLASK_ENV") == "test" or os.environ.get("ALLOW_DEV_AUTH") == "true":
            dev_uid = req.headers.get("X-Test-User-ID")
            if dev_uid:
                is_admin = dev_uid == os.environ.get("ADMIN_UID") or req.headers.get("X-Test-Is-Admin") == "true"
                return AuthContext(uid=dev_uid, is_admin=is_admin, email="test@resumagic.test", auth_method="test_header")
        return None

    # Production verification via Firebase Admin SDK
    if HAS_FIREBASE_ADMIN and fb_auth:
        try:
            decoded = fb_auth.verify_id_token(token, clock_skew_seconds=60)
            uid = decoded.get("uid")
            email = decoded.get("email", "")
            if not uid:
                return None

            # Determine administrative status
            is_admin = False
            env_admin = os.environ.get("ADMIN_UID")
            if env_admin and uid == env_admin:
                is_admin = True
            elif db_admin:
                try:
                    doc = db_admin.collection("users").document(uid).get()
                    if doc.exists and doc.to_dict().get("admin") is True:
                        is_admin = True
                except Exception:
                    pass

            return AuthContext(uid=uid, is_admin=is_admin, email=email, auth_method="firebase_verified")
        except Exception as e:
            # Token failed cryptographic validation
            return None

    # Fallback for dev without Firebase Admin credentials
    if os.environ.get("FLASK_ENV") in ("development", "test"):
        try:
            parts = token.split(".")
            if len(parts) >= 2:
                payload_b64 = parts[1] + "=="
                payload_json = base64.urlsafe_b64decode(payload_b64).decode("utf-8")
                payload = json.loads(payload_json)
                uid = payload.get("user_id") or payload.get("sub") or payload.get("uid")
                if uid:
                    is_admin = uid == os.environ.get("ADMIN_UID")
                    return AuthContext(uid=uid, is_admin=is_admin, email=payload.get("email", ""), auth_method="dev_decoded")
        except Exception:
            pass

    return None


def require_auth(cost: int = 0):
    """
    Decorator that enforces verified authentication.
    Injects `auth_ctx` into flask.g.auth_ctx.
    Optionally validates credits before entering operation.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from backend.server import db_admin
            ctx = verify_identity(request, db_admin=db_admin)
            if not ctx:
                return jsonify({
                    "status": "error",
                    "error": "Authentication required. Valid Bearer ID token must be provided."
                }), 401

            g.auth_ctx = ctx

            # If credit cost required, perform transactional pre-check
            if cost > 0:
                from backend.credit_manager import CreditManager
                cm = CreditManager(db_admin)
                has_credits, balance = cm.check_credits(ctx.uid, cost)
                if not has_credits:
                    return jsonify({
                        "status": "error",
                        "error": f"Insufficient credits. Required: {cost}, Available: {balance}.",
                        "code": "INSUFFICIENT_CREDITS",
                        "required": cost,
                        "available": balance
                    }), 402

            return f(*args, **kwargs)
        return decorated_function
    return decorator


def require_admin():
    """
    Decorator requiring verified administrative identity.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from backend.server import db_admin
            ctx = verify_identity(request, db_admin=db_admin)
            if not ctx or not ctx.is_admin:
                return jsonify({
                    "status": "error",
                    "error": "Forbidden. Administrative privileges required."
                }), 403

            g.auth_ctx = ctx
            return f(*args, **kwargs)
        return decorated_function
    return decorator
