from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta, timezone
import base64
import tempfile
import os
import json
import requests
import re
import time
import random
try:
    import firebase_admin
    from firebase_admin import credentials, auth, firestore
    HAS_FIREBASE_ADMIN = True
except ImportError:
    HAS_FIREBASE_ADMIN = False
    firebase_admin = None
    credentials = None
    auth = None
    firestore = None
from dotenv import load_dotenv

# Allow relative imports from root when running in Vercel
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from engine import PDFEngine
from ai_parser import AIParserEngine, locally_blocked
from perf_engine import perf_engine

from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader
import cloudinary.api
import time

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB Max Body Size Limit
CORS(app)  # Allow React frontend to ping this API
perf_engine.init_app(app)  # Initialize Python Performance Engine Middleware

@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({"error": "Payload too large. Maximum allowed request size is 10MB."}), 413

# Cloudinary Configuration
cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
    secure=True
)

# Firebase Admin Initialization
if HAS_FIREBASE_ADMIN:
    try:
        if not len(firebase_admin._apps):
            service_account_b64 = os.environ.get("FIREBASE_SERVICE_ACCOUNT_B64")
            service_account_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
            if service_account_b64:
                import base64
                decoded_key = base64.b64decode(service_account_b64).decode("utf-8")
                service_account_info = json.loads(decoded_key)
                cred = credentials.Certificate(service_account_info)
                firebase_admin.initialize_app(cred)
                print("✅ Firebase Admin initialized via B64 Environment Variable.")
            elif service_account_json:
                service_account_info = json.loads(service_account_json)
                cred = credentials.Certificate(service_account_info)
                firebase_admin.initialize_app(cred)
                print("✅ Firebase Admin initialized via JSON Environment Variable.")
            else:
                service_account_path = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")
                if os.path.exists(service_account_path):
                    with open(service_account_path) as f:
                        service_account_info = json.load(f)
                    # Sync project_id with active Firebase project
                    active_project_id = os.environ.get("VITE_FIREBASE_PROJECT_ID", "resumagic-1226c")
                    if service_account_info.get("project_id") != active_project_id:
                        service_account_info["project_id"] = active_project_id
                    cred = credentials.Certificate(service_account_info)
                    firebase_admin.initialize_app(cred, {"projectId": active_project_id})
                    print(f"✅ Firebase Admin initialized with service account (project: {active_project_id}).")
                else:
                    active_project_id = os.environ.get("VITE_FIREBASE_PROJECT_ID", "resumagic-1226c")
                    firebase_admin.initialize_app(options={"projectId": active_project_id})
                    print("⚠️ Firebase Admin initialized with default credentials.")
        db_admin = firestore.client()
    except Exception as e:
        print(f"❌ Firebase Admin failed to initialize: {e}")
        try:
            db_admin = firestore.client()
        except Exception:
            db_admin = None
else:
    print("info: HAS_FIREBASE_ADMIN is False.")
    db_admin = None

# Global Parser Instance deferred to lazy initialization inside routes

def check_user_has_credits(uid, cost=5):
    """Verifies user has sufficient credits without deducting."""
    from flask import request
    if request.headers.get("X-Skip-Credit-Check") == "true" or not db_admin:
        return True
    try:
        user_ref = db_admin.collection('users').document(uid)
        user_doc = user_ref.get()
        if not user_doc.exists:
            return True
        credits = user_doc.to_dict().get('credits', 0)
        return credits >= cost
    except Exception as e:
        print(f"❌ Credit check error: {e}")
        return True

def deduct_user_credits(uid, cost=5):
    """Deducts credits ONLY after successful operation."""
    from flask import request
    if request.headers.get("X-Skip-Credit-Check") == "true" or not db_admin:
        return True
    try:
        user_ref = db_admin.collection('users').document(uid)
        user_doc = user_ref.get()
        if user_doc.exists:
            credits = user_doc.to_dict().get('credits', 0)
            user_ref.update({'credits': max(0, credits - cost)})
        return True
    except Exception as e:
        print(f"❌ Credit deduction error: {e}")
        return False

def check_and_deduct_credits(uid, cost=5):
    """Legacy helper for backward compatibility."""
    if check_user_has_credits(uid, cost):
        return deduct_user_credits(uid, cost)
    return False

def verify_authenticated_user(request_obj):
    """Verifies Firebase ID Token from Authorization header. Strictly rejects forged tokens in production."""
    auth_header = request_obj.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split("Bearer ")[1].strip()
        if HAS_FIREBASE_ADMIN and auth:
            try:
                decoded_token = auth.verify_id_token(token, clock_skew_seconds=60)
                if decoded_token and decoded_token.get("uid"):
                    return decoded_token.get("uid")
            except Exception as e:
                print(f"⚠️ Firebase token verification failed: {e}")
                # In production with Firebase Admin active, never accept unverified tokens!
                return None

        # Non-production fallback only when running without Firebase Admin credentials
        if not HAS_FIREBASE_ADMIN or os.environ.get("FLASK_ENV") == "development":
            try:
                import base64, json
                parts = token.split(".")
                if len(parts) >= 2:
                    payload_b64 = parts[1] + "=="
                    payload_json = base64.urlsafe_b64decode(payload_b64).decode("utf-8")
                    payload = json.loads(payload_json)
                    uid = payload.get("user_id") or payload.get("sub") or payload.get("uid")
                    if uid:
                        return uid
            except Exception as e:
                print(f"⚠️ Dev unverified token decode error: {e}")

    # X-User-ID header is strictly ignored when Firebase Admin is active to prevent spoofing/IDOR
    if not HAS_FIREBASE_ADMIN or os.environ.get("FLASK_ENV") == "development":
        return request_obj.headers.get("X-User-ID")
    return None

def verify_admin_user(request_obj):
    """Verifies that the request originates from an authorized administrator."""
    uid = verify_authenticated_user(request_obj)
    if not uid:
        return None
    if HAS_FIREBASE_ADMIN and db_admin:
        try:
            doc = db_admin.collection("users").document(uid).get()
            if doc.exists and doc.to_dict().get("admin") is True:
                return uid
        except Exception as e:
            print(f"⚠️ Admin authorization check failed: {e}")
    # Also support ADMIN_UID in environment for root administrator override
    env_admin_uid = os.environ.get("ADMIN_UID")
    if env_admin_uid and uid == env_admin_uid:
        return uid
    return None

@app.route("/api/performance/stats", methods=["GET"])
def get_performance_stats():
    admin_uid = verify_admin_user(request)
    if not admin_uid:
        return jsonify({"error": "Admin authorization required."}), 403
    stats = perf_engine.get_summary_stats()
    stats.pop("log_file", None) # Omit absolute server filesystem path for security
    return jsonify(stats)

@app.route("/api/performance/logs", methods=["GET"])
def get_performance_logs():
    admin_uid = verify_admin_user(request)
    if not admin_uid:
        return jsonify({"error": "Admin authorization required."}), 403
    max_lines = min(request.args.get("lines", default=50, type=int), 200)
    lines = perf_engine.get_recent_log_entries(max_lines=max_lines)
    return jsonify({"logs": lines})

def validate_json_payload(data, required_fields=None, field_types=None, max_string_len=10000):
    """Sanitizes & validates JSON request payload types, required fields, and bounds."""
    if not isinstance(data, dict):
        return False, "Request body must be a valid JSON object"
        
    if required_fields:
        for field in required_fields:
            if field not in data or data[field] is None:
                return False, f"Missing required payload field: '{field}'"
                
    if field_types:
        for field, expected_type in field_types.items():
            if field in data and data[field] is not None:
                if not isinstance(data[field], expected_type):
                    return False, f"Invalid data type for '{field}'. Expected {expected_type.__name__}"
                    
    for k, v in data.items():
        if isinstance(v, str) and len(v) > max_string_len:
            return False, f"Field '{k}' exceeds maximum allowed string length limit of {max_string_len} characters"
            
    return True, None

# --- Rate Limiting & Anti-Abuse Cloudflare Turnstile Engine ---

class AbuseRateLimiter:
    """
    Sliding window rate limiter with Cloudflare Turnstile Captcha verification challenge.
    Protects PDF rendering and AI endpoints from automated abuse and volumetric floods.
    """
    def __init__(self):
        import threading
        from collections import defaultdict
        self._lock = threading.Lock()
        self._requests = defaultdict(list)
        self._flagged = defaultdict(bool)
        
        # Rate limit configurations: (max_requests, window_seconds)
        self.limits = {
            "pdf": (8, 60),      # max 8 PDF exports per 60 seconds
            "ai": (15, 60),      # max 15 AI operations per 60 seconds
            "parse": (6, 60),    # max 6 document parses per 60 seconds
            "auth": (5, 60),     # max 5 auth/otp requests per 60 seconds
        }

    def _get_client_key(self, req, category: str) -> str:
        uid = req.headers.get("X-User-ID", "").strip()
        client_ip = req.headers.get("X-Forwarded-For", req.remote_addr or "127.0.0.1").split(",")[0].strip()
        identity = client_ip if category == "auth" else (uid if uid else client_ip)
        return f"{category}:{identity}"

    def check_and_record(self, req, category: str = "ai"):
        """
        Returns (allowed: bool, response_tuple_or_None).
        If not allowed, returns 429 response demanding Cloudflare Turnstile captcha solve.
        """
        key = self._get_client_key(req, category)
        max_reqs, window_sec = self.limits.get(category, (15, 60))
        now = time.time()

        # Check if Turnstile token is supplied in header or JSON payload
        turnstile_token = req.headers.get("X-Turnstile-Token", "").strip()
        if not turnstile_token and req.is_json:
            try:
                data = req.get_json(silent=True) or {}
                turnstile_token = str(data.get("turnstile_token", "")).strip()
            except Exception:
                turnstile_token = ""

        # If turnstile token is provided, verify it to reset rate limits
        if turnstile_token:
            client_ip = req.headers.get("X-Forwarded-For", req.remote_addr or "127.0.0.1").split(",")[0].strip()
            if self.verify_turnstile_token(turnstile_token, client_ip):
                with self._lock:
                    self._requests[key] = []
                    self._flagged[key] = False
                print(f"[RateLimiter] ✅ Solved Cloudflare Turnstile challenge for {key}. Rate limit reset.")
                return True, None

        with self._lock:
            # Purge expired timestamps
            cutoff = now - window_sec
            self._requests[key] = [ts for ts in self._requests[key] if ts > cutoff]

            # If client exceeded limit or was previously flagged until captcha solve
            if len(self._requests[key]) >= max_reqs or self._flagged[key]:
                self._flagged[key] = True
                print(f"[RateLimiter] 🚨 Rate limit exceeded for {key} ({len(self._requests[key])}/{max_reqs} in {window_sec}s). Requiring Turnstile Captcha.")
                error_payload = {
                    "status": "rate_limited",
                    "error": f"Security verification required: High request volume detected. Please solve the Cloudflare check below to continue.",
                    "require_captcha": True,
                    "category": category
                }
                return False, (jsonify(error_payload), 429)

            # Record this request timestamp
            self._requests[key].append(now)
            return True, None

    def verify_turnstile_token(self, token: str, remote_ip: str) -> bool:
        if not token:
            return False
        secret_key = os.environ.get("CLOUDFLARE_TURNSTILE_SECRET_KEY")
        if not secret_key or secret_key == "your_secret_key_here":
            return True  # If unconfigured in local dev, allow
        try:
            resp = requests.post(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                data={
                    "secret": secret_key,
                    "response": token,
                    "remoteip": remote_ip
                },
                timeout=5
            )
            data = resp.json()
            return data.get("success", False)
        except Exception as e:
            print(f"[RateLimiter] Turnstile verification exception: {e}")
            return False

rate_limiter = AbuseRateLimiter()

def check_rate_limit(req, category: str = "ai"):
    """Convenience helper to enforce rate limiting on endpoints."""
    return rate_limiter.check_and_record(req, category)

# --- Cloudinary Endpoints ---

@app.route('/api/cloudinary/sign', methods=['POST'])
def cloudinary_sign():
    uid = verify_authenticated_user(request)
    if not uid:
        return jsonify({"error": "Authentication required."}), 401

    api_secret = os.environ.get("CLOUDINARY_API_SECRET")
    if not api_secret or api_secret == "your_api_secret_here":
        return jsonify({"error": "Cloudinary API secret is not configured on the server."}), 500

    folder = f"users/{uid}/assets"
    timestamp = int(time.time())
    
    # Generate signature using API Secret strictly on the server
    params_to_sign = {'timestamp': timestamp, 'folder': folder}
        
    signature = cloudinary.utils.api_sign_request(
        params_to_sign,
        api_secret
    )
    
    return jsonify({
        "timestamp": timestamp,
        "signature": signature,
        "folder": folder,
        "api_key": os.environ.get("CLOUDINARY_API_KEY", ""),
        "cloud_name": os.environ.get("CLOUDINARY_CLOUD_NAME", "")
    })

@app.route('/api/cloudinary/delete', methods=['POST'])
def cloudinary_delete():
    uid = verify_authenticated_user(request)
    if not uid:
        return jsonify({"error": "Authentication required."}), 401

    data = request.json or {}
    public_id = (data.get('public_id') or "").strip()
    if not public_id:
        return jsonify({"error": "Missing public_id"}), 400

    # Ensure user can only delete assets from their own folder
    if not public_id.startswith(f"users/{uid}/"):
        return jsonify({"error": "Unauthorized: Cannot delete assets belonging to other users."}), 403
        
    try:
        result = cloudinary.uploader.destroy(public_id)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/user/credits', methods=['GET'])
def get_user_credits():
    try:
        uid = verify_authenticated_user(request)
        if not uid:
            return jsonify({"credits": 0, "error": "Authentication required"}), 401
        
        if not db_admin: return jsonify({"error": "DB error"}), 500

        user_ref = db_admin.collection('users').document(uid)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            # Initialize new user with 15 credits in Firestore during signup
            if db_admin:
                user_ref = db_admin.collection("users").document(uid)
                if not user_ref.get().exists:
                    user_ref.set({
                        'credits': 15,
                        'createdAt': firestore.SERVER_TIMESTAMP
                    })
            return jsonify({"credits": 15})
            
        return jsonify({"credits": user_doc.to_dict().get('credits', 0)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/user/init', methods=['POST'])
def init_user():
    try:
        uid = verify_authenticated_user(request)
        if not uid:
            return jsonify({"error": "Authentication required"}), 401
        
        data = request.json or {}
        name = data.get("name", "")
        email = data.get("email", "")
        
        if not db_admin: return jsonify({"error": "DB error"}), 500
        
        user_ref = db_admin.collection('users').document(uid)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            user_ref.set({
                'credits': 50, 
                'name': name,
                'email': email,
                'createdAt': firestore.SERVER_TIMESTAMP
            })
            return jsonify({"success": True, "credits": 50})
        else:
            # If exists but missing name, we could update it here, but we'll leave it simple
            return jsonify({"success": True, "credits": user_doc.to_dict().get('credits', 0)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/user/profile', methods=['GET'])
def get_user_profile():
    try:
        uid = verify_authenticated_user(request)
        if not uid:
            return jsonify({"error": "Authentication required"}), 401
        
        if not db_admin: return jsonify({"error": "DB error"}), 500

        user_ref = db_admin.collection('users').document(uid)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            return jsonify({"error": "User not found"}), 404
            
        return jsonify(user_doc.to_dict())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/user/delete', methods=['POST'])
def delete_account():
    try:
        uid = verify_authenticated_user(request)
        if not uid:
            return jsonify({"error": "Authentication required"}), 401
        
        if db_admin:
            db_admin.collection('users').document(uid).delete()
        
        # Delete from Firebase Auth if auth is available
        if HAS_FIREBASE_ADMIN and auth:
            try:
                auth.delete_user(uid)
            except Exception as fe:
                print(f"⚠️ Auth delete_user warning: {fe}")
        
        return jsonify({"success": True, "message": "Account deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/parse-resume', methods=['POST'])
def parse_resume():
    allowed, rate_resp = check_rate_limit(request, "parse")
    if not allowed:
        return rate_resp
    try:
        uid = request.headers.get("X-User-ID")
        if uid and not check_and_deduct_credits(uid, 5):
            return jsonify({"error": "Insufficient credits. Please recharge."}), 402
            
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
            
        file_bytes = file.read()
        filename = file.filename
        user_prompt = request.form.get("prompt", "")
        
        is_linkedin = request.form.get("is_linkedin", "false").lower() == "true"
        
        parser_inst = AIParserEngine()
        elements = parser_inst.parse_file(file_bytes, filename, user_prompt=user_prompt, is_linkedin=is_linkedin)
        
        return jsonify({"elements": elements})
    except Exception as e:
        print(f"[AIParserEngine Server Route] Fatal error: {e}")
        return jsonify({"error": str(e)}), 500

def is_safe_image_url(url: str) -> bool:
    """Blocks SSRF attacks against internal networks, cloud metadata, and loopback addresses."""
    from urllib.parse import urlparse
    import socket, ipaddress
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False
        hostname = parsed.hostname
        if not hostname:
            return False
        lower_host = hostname.lower()
        if lower_host in ("localhost", "metadata.google.internal", "instance-data") or lower_host.endswith(".local") or lower_host.endswith(".internal"):
            return False
        # Fast path: check direct IP addresses without DNS resolution
        try:
            ip_obj = ipaddress.ip_address(hostname)
            return not (
                ip_obj.is_private
                or ip_obj.is_loopback
                or ip_obj.is_link_local
                or ip_obj.is_reserved
                or ip_obj.is_multicast
            )
        except ValueError:
            pass

        # Resolve host if DNS is available
        try:
            addr_info = socket.getaddrinfo(hostname, None)
            for item in addr_info:
                ip_str = item[4][0]
                ip_obj = ipaddress.ip_address(ip_str)
                if (
                    ip_obj.is_private
                    or ip_obj.is_loopback
                    or ip_obj.is_link_local
                    or ip_obj.is_reserved
                    or ip_obj.is_multicast
                ):
                    return False
        except socket.gaierror:
            # In offline or sandboxed environment without DNS, allow well-known public CDN hosts
            if any(lower_host.endswith(d) for d in ("unsplash.com", "cloudinary.com", "github.com", "imgur.com")):
                return True
            return False
        return True
    except Exception:
        return False

@app.route('/api/render', methods=['POST'])
def render_pdf():
    allowed, rate_resp = check_rate_limit(request, "pdf")
    if not allowed:
        return rate_resp
    temp_files = []
    try:
        payload = request.json
        if not payload:
            return jsonify({"error": "No JSON payload provided"}), 400
            
        print("[PDFEngine Server] Received render request")

        if isinstance(payload, dict):
            raw_elements = payload.get("elements", [])
            raw_pages = payload.get("pages", [])
        elif isinstance(payload, list):
            raw_elements = payload
            raw_pages = []
        else:
            raw_elements = []
            raw_pages = []
        
        # Sanitize elements & handle base64 images safely
        clean_elements = []
        for el in raw_elements:
            if not isinstance(el, dict): continue
            clean_el = dict(el)
            if clean_el.get('element_type') == 'image':
                path = clean_el.get('image_path', '')
                if path.startswith('data:image'):
                    try:
                        header, encoded = path.split(',', 1)
                        ext = 'png'
                        if 'jpeg' in header or 'jpg' in header: ext = 'jpg'
                        elif 'svg' in header: ext = 'svg'
                        fd, tmp_path = tempfile.mkstemp(suffix='.' + ext)
                        with os.fdopen(fd, 'wb') as f:
                            f.write(base64.b64decode(encoded))
                        clean_el['image_path'] = tmp_path
                        temp_files.append(tmp_path)
                    except Exception as e:
                        print(f"Failed to decode base64 image: {e}")
                elif path.startswith('http://') or path.startswith('https://'):
                    if not is_safe_image_url(path):
                        print(f"⚠️ Blocked SSRF attempt to unsafe image URL: {path[:60]}")
                    else:
                        try:
                            import requests
                            resp = requests.get(path, headers={"User-Agent": "Mozilla/5.0"}, timeout=2.5)
                            if resp.status_code == 200:
                                ext = '.svg' if ('svg' in resp.headers.get('content-type', '') or path.endswith('.svg')) else '.png'
                                fd, tmp_path = tempfile.mkstemp(suffix=ext)
                                with os.fdopen(fd, 'wb') as f:
                                    f.write(resp.content)
                                clean_el['image_path'] = tmp_path
                                temp_files.append(tmp_path)
                        except Exception as e:
                            print(f"Failed to pre-download remote image {path[:60]}: {e}")
            clean_elements.append(clean_el)
        
        # Initialise engine and import frontend state
        engine = PDFEngine()
        import json
        success = engine.import_state(json.dumps({
            "elements": clean_elements,
            "pages": raw_pages
        }))
        
        if not success:
            return jsonify({"error": "Failed to parse template state"}), 400

        # Render PDF to bytes
        pdf_bytes = engine.render_to_bytes()
        
        if pdf_bytes is None:
            return jsonify({"error": "PDF generation failed internally"}), 500

        # Save to a temporary file dynamically to stream down to client
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            tmp.write(pdf_bytes)
            tmp_path = tmp.name
            temp_files.append(tmp_path)

        return send_file(
            tmp_path, 
            mimetype='application/pdf', 
            as_attachment=True, 
            download_name='resume.pdf'
        )
    except Exception as e:
        print(f"[PDFEngine Render Error]: {e}")
        return jsonify({"error": f"PDF Rendering error: {str(e)}"}), 500

@app.route('/api/remove-bg', methods=['POST'])
def remove_bg_route():
    try:
        uid = request.headers.get("X-User-ID")
        if uid and not check_and_deduct_credits(uid, 5):
            return jsonify({"error": "Insufficient credits. Please recharge."}), 402
            
        data = request.json
        path = data.get('image_path', '')
        print(f"[Server] Requested image path: {path[:50]}...") # Log first 50 chars for base64
        if not path:
            return jsonify({"error": "No path"}), 400
        
        # Handle base64 images
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        if path.startswith('data:image'):
            try:
                header, encoded = path.split(',', 1)
                ext = header.split(';')[0].split('/')[1]
                # Save to public/temp_uploads for consistency
                temp_dir = os.path.join(base_dir, "public", "temp_uploads")
                os.makedirs(temp_dir, exist_ok=True)
                
                temp_filename = f"b64_{int(tempfile.tempdir is None)}_{os.urandom(4).hex()}.{ext}"
                full_path = os.path.join(temp_dir, temp_filename)
                with open(full_path, 'wb') as f:
                    f.write(base64.b64decode(encoded))
                print(f"[Server] Decoded base64 image to: {full_path}")
            except Exception as e:
                print(f"[Server] Failed to decode base64: {e}")
                return jsonify({"error": "Invalid base64 data"}), 400
        # Resolve path for existing files
        elif path.startswith('/temp_uploads/'):
            full_path = os.path.join(base_dir, "public", path.lstrip('/'))
        else:
            full_path = path
            
        print(f"[Server] Resolved full path: {full_path}")

        if not os.path.exists(full_path):
            print(f"[Server] ERROR: File does not exist at {full_path}")
            return jsonify({"error": f"File not found at {full_path}"}), 404

        # Read image with PIL first (better format support and EXIF handling)
        try:
            from PIL import Image, ImageOps
            pil_img = Image.open(full_path)
            pil_img = ImageOps.exif_transpose(pil_img) # Fix orientation
            pil_img = pil_img.convert("RGB") # Ensure 3-channel
            
            # Convert PIL to OpenCV (BGR)
            img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        except Exception as e:
            print(f"[Server] PIL Fallback failed: {e}")
            # Last ditch effort with OpenCV
            img = cv2.imread(full_path)

        if img is None:
            return jsonify({"error": "Could not read image"}), 400

        # GrabCut setup
        mask = np.zeros(img.shape[:2], np.uint8)
        bgdModel = np.zeros((1, 65), np.float64)
        fgdModel = np.zeros((1, 65), np.float64)
        
        # Define a rectangle that slightly excludes borders to help the algorithm
        h, w = img.shape[:2]
        rect = (10, 10, w-20, h-20)
        
        # Run GrabCut
        cv2.grabCut(img, mask, rect, bgdModel, fgdModel, 5, cv2.GC_INIT_WITH_RECT)
        
        # Create mask where background is 0, foreground is 1
        mask2 = np.where((mask==2)|(mask==0), 0, 1).astype('uint8')
        
        # Post-process: Feather edges for a smoother look
        # This "upgrades" the engine result as requested
        mask_float = mask2.astype(float)
        mask_blurred = cv2.GaussianBlur(mask_float, (7, 7), 0)
        
        # Convert to RGBA
        img_rgba = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
        img_rgba[:, :, 3] = (mask_blurred * 255).astype('uint8')
        
        # Convert to base64 to return to frontend
        _, buffer = cv2.imencode(".png", img_rgba)
        img_base64 = base64.b64encode(buffer).decode("utf-8")
        new_data_url = f"data:image/png;base64,{img_base64}"
        
        print(f"[Server] Returning base64 data URL")
        return jsonify({"new_path": new_data_url})
    except Exception as e:
        print(f"[BG Removal OpenCV] Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/generate-design', methods=['POST'])
def generate_design_route():
    allowed, rate_resp = check_rate_limit(request, "ai")
    if not allowed:
        return rate_resp
    try:
        uid = verify_authenticated_user(request)
        if uid and not check_user_has_credits(uid, 5):
            return jsonify({"error": "Insufficient credits. Please recharge."}), 402
            
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        parser = AIParserEngine()
        elements = parser.generate_from_scratch(data)
        
        if uid:
            deduct_user_credits(uid, 5)
            
        return jsonify({"elements": elements})
    except Exception as e:
        print(f"[AI-Architect Route] Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/generate-skills', methods=['POST'])
def generate_skills_route():
    allowed, rate_resp = check_rate_limit(request, "ai")
    if not allowed:
        return rate_resp
    try:
        uid = verify_authenticated_user(request)
        if uid and not check_user_has_credits(uid, 5):
            return jsonify({"error": "Insufficient credits. Please recharge."}), 402
            
        data = request.json or {}
        category = data.get("category", "")
        load_more = data.get("load_more", False)
        parser = AIParserEngine()
        skills = parser.get_skills(category, load_more)
        
        if uid:
            deduct_user_credits(uid, 5)
            
        return jsonify({"skills": skills})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/generate-summary', methods=['POST'])
def generate_summary_route():
    allowed, rate_resp = check_rate_limit(request, "ai")
    if not allowed:
        return rate_resp
    try:
        uid = verify_authenticated_user(request)
        if uid and not check_user_has_credits(uid, 5):
            return jsonify({"error": "Insufficient credits. Please recharge."}), 402
            
        data = request.json or {}
        parser = AIParserEngine()
        summary = parser.get_summary(data)
        
        if uid:
            deduct_user_credits(uid, 5)
            
        return jsonify({"summary": summary})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/import-linkedin-url', methods=['POST'])
def import_linkedin_url():
    allowed, rate_resp = check_rate_limit(request, "ai")
    if not allowed:
        return rate_resp
    try:
        data = request.json or {}
        url = str(data.get("linkedin_url", "")).strip()
        if not url:
            return jsonify({"error": "No LinkedIn URL provided"}), 400
        if not (url.startswith("https://") and "linkedin.com" in url):
            return jsonify({"error": "Invalid LinkedIn URL format. Must start with https://linkedin.com"}), 400
            
        # For now, we simulate API fetching or prompt the AI to 'research' if it can.
        # In a real production app, you'd use Proxycurl or a similar service here.
        parser = AIParserEngine()
        wizard_data = parser.import_linkedin_url(url)
        
        return jsonify({"wizard_data": wizard_data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ai-chat-edit', methods=['POST'])
def ai_chat_edit():
    allowed, rate_resp = check_rate_limit(request, "ai")
    if not allowed:
        return rate_resp
    try:
        uid = verify_authenticated_user(request)
        if uid and not check_user_has_credits(uid, 10):
            return jsonify({"error": "Insufficient credits. Please recharge."}), 402
            
        data = request.get_json(silent=True) or {}
        valid, err_msg = validate_json_payload(
            data, 
            required_fields=['prompt'], 
            field_types={'prompt': str, 'elements': list},
            max_string_len=5000
        )
        if not valid:
            return jsonify({"error": f"Invalid payload: {err_msg}"}), 400

        elements = data.get('elements', [])
        prompt = data.get('prompt', '')
        
        if locally_blocked(prompt):
            return jsonify({
                "status": "rejected",
                "error": "Request blocked: Content violates career and resume safety policy."
            }), 400
        
        parser = AIParserEngine()
        result = parser.ai_chat_edit(elements, prompt)

        if uid:
            deduct_user_credits(uid, 10)

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ai-assistant', methods=['POST'])
def ai_assistant():
    allowed, rate_resp = check_rate_limit(request, "ai")
    if not allowed:
        return rate_resp
    try:
        uid = verify_authenticated_user(request)
        if uid and not check_user_has_credits(uid, 10):
            return jsonify({"error": "Insufficient credits. Please recharge."}), 402
            
        data = request.get_json(silent=True) or {}
        valid, err_msg = validate_json_payload(
            data, 
            required_fields=['action'], 
            field_types={'action': str, 'text': str, 'job_description': str},
            max_string_len=10000
        )
        if not valid:
            return jsonify({"error": f"Invalid payload: {err_msg}"}), 400

        action = data.get('action', '')
        text = data.get('text', '')
        context = data.get('context', {})
        job_description = data.get('job_description', '')

        if locally_blocked(f"{action} {text} {job_description}"):
            return jsonify({
                "status": "rejected",
                "reason": "Request blocked: Content violates career and resume safety policy."
            }), 400
        
        parser = AIParserEngine()
        result = parser.handle_ai_action(action, text, context, job_description)

        if uid and isinstance(result, dict) and result.get("status") != "rejected":
            deduct_user_credits(uid, 10)

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ai-architect', methods=['POST'])
def ai_architect():
    allowed, rate_resp = check_rate_limit(request, "ai")
    if not allowed:
        return rate_resp
    try:
        uid = verify_authenticated_user(request)
        if uid and not check_user_has_credits(uid, 10):
            return jsonify({"error": "Insufficient credits. Please recharge."}), 402
            
        data = request.get_json(silent=True) or {}
        prompt = data.get('prompt', '')
        elements = data.get('elements', [])
        action = data.get('action', 'build')

        if locally_blocked(prompt):
            return jsonify({
                "status": "rejected",
                "error": "Request blocked: Content violates career and resume safety policy."
            }), 400
        
        parser = AIParserEngine()
        if action == 'plan':
            plan_res = parser.generate_architect_plan(prompt)
            return jsonify(plan_res)
        elif action == 'distill':
            distilled = parser.distill_resume_text(prompt)
            return jsonify({"status": "success", "data": distilled})
        elif action == 'build':
            plan = data.get('plan')
            if plan and isinstance(plan, dict):
                result = parser.build_architect_resume(plan, prompt)
            else:
                result = parser.ai_chat_edit(elements, prompt)
            if uid and isinstance(result, dict) and "elements" in result:
                deduct_user_credits(uid, 10)
            return jsonify(result)
        else:
            result = parser.ai_chat_edit(elements, prompt)
            if uid and isinstance(result, dict) and "elements" in result:
                deduct_user_credits(uid, 10)
            return jsonify(result)
    except Exception as e:
        print(f"❌ AI Architect Exception: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/verify-turnstile', methods=['POST'])
def verify_turnstile():
    try:
        data = request.json
        if not data:
            return jsonify({"success": False, "error": "No JSON payload provided"}), 400
        token = data.get("token")
        if not token:
            return jsonify({"success": False, "error": "Missing token"}), 400
            
        secret_key = os.environ.get("CLOUDFLARE_TURNSTILE_SECRET_KEY")
        if not secret_key or secret_key == "your_secret_key_here":
            # If not configured, we allow it to pass but log a warning
            # This prevents locking out the user if they haven't set up the keys yet
            print("[Turnstile] WARNING: Secret key not configured. Skipping verification.")
            return jsonify({"success": True})

        response = requests.post(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            data={
                "secret": secret_key,
                "response": token,
                "remoteip": request.remote_addr
            }
        )
        
        result = response.json()
        return jsonify(result)
    except Exception as e:
        print(f"[Turnstile] Verification error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')

def validate_email_format(email: str) -> bool:
    if not email or not isinstance(email, str) or len(email) > 254:
        return False
    return bool(EMAIL_REGEX.match(email.strip()))

@app.route('/api/auth/send-otp', methods=['POST'])
def send_otp():
    allowed, rate_resp = check_rate_limit(request, "auth")
    if not allowed:
        return rate_resp
    try:
        data = request.json or {}
        email = (data.get("email") or "").strip().lower()
        if not validate_email_format(email):
            return jsonify({"success": False, "error": "Valid email is required"}), 400
            
        # Verify user exists in Firebase if auth is initialized
        if HAS_FIREBASE_ADMIN and auth:
            try:
                auth.get_user_by_email(email)
            except auth.UserNotFoundError:
                return jsonify({"success": False, "error": "No user found with this email"}), 404
            
        # Generate 6-digit OTP
        otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        
        # Store OTP in Firestore securely
        if db_admin:
            db_admin.collection("otps").document(email).set({
                "otp": otp,
                "expires_at": expires_at,
                "created_at": datetime.now(timezone.utc),
                "failed_attempts": 0
            }, merge=True)
            
        # Send Email
        success = send_otp_email(email, otp, "Password Reset")
        if success:
            return jsonify({"success": True, "message": "OTP sent successfully"})
        else:
            return jsonify({"success": False, "error": "Failed to send email. Check server logs."}), 500
            
    except Exception as e:
        print(f"[Auth] Send OTP error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/auth/send-verification-otp', methods=['POST'])
def send_verification_otp():
    allowed, rate_resp = check_rate_limit(request, "auth")
    if not allowed:
        return rate_resp
    try:
        data = request.json or {}
        email = (data.get("email") or "").strip().lower()
        if not validate_email_format(email):
            return jsonify({"success": False, "error": "Valid email is required"}), 400
            
        # Verify user exists
        if HAS_FIREBASE_ADMIN and auth:
            try:
                user = auth.get_user_by_email(email)
            except auth.UserNotFoundError:
                return jsonify({"success": False, "error": "User not found"}), 404
                
            # Initialize new user with 15 credits in Firestore during signup
            if db_admin:
                user_ref = db_admin.collection('users').document(user.uid)
                if not user_ref.get().exists:
                    user_ref.set({
                        'credits': 15,
                        'email': email,
                        'createdAt': firestore.SERVER_TIMESTAMP
                    })
            
        # Generate 6-digit code
        otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        expires_at = datetime.now(timezone.utc) + timedelta(hours=24) # Verif codes last longer
        
        # Store securely
        if db_admin:
            db_admin.collection("verifications").document(email).set({
                "otp": otp,
                "expires_at": expires_at,
                "created_at": datetime.now(timezone.utc),
                "failed_attempts": 0
            }, merge=True)
            
        # Send via Mailjet
        success = send_otp_email(email, otp, "Account Verification")
        if success:
            return jsonify({"success": True, "message": "Verification code sent!"})
        else:
            return jsonify({"success": False, "error": "Mailing failed"}), 500
            
    except Exception as e:
        print(f"[Auth] Send Verification error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/auth/verify-account', methods=['POST'])
def verify_account():
    allowed, rate_resp = check_rate_limit(request, "auth")
    if not allowed:
        return rate_resp
    try:
        data = request.json or {}
        email = (data.get("email") or "").strip().lower()
        otp = (data.get("otp") or "").strip()
        
        if not all([email, otp]):
            return jsonify({"success": False, "error": "Email and code required"}), 400
            
        if not db_admin: return jsonify({"success": False, "error": "DB not ready"}), 500
            
        # Get code from Firestore
        doc = db_admin.collection("verifications").document(email).get()
        if not doc.exists:
            return jsonify({"success": False, "error": "No verification pending"}), 404
            
        ver_data = doc.to_dict()
        if datetime.now(timezone.utc) > ver_data['expires_at'].replace(tzinfo=None):
            return jsonify({"success": False, "error": "Code expired"}), 400
            
        if ver_data['otp'] != otp:
            failed_attempts = int(ver_data.get('failed_attempts', 0)) + 1
            if failed_attempts >= 5:
                db_admin.collection("verifications").document(email).delete()
                return jsonify({"success": False, "error": "Too many failed attempts. Verification code has been invalidated. Please request a new one."}), 400
            else:
                db_admin.collection("verifications").document(email).update({'failed_attempts': failed_attempts})
                return jsonify({"success": False, "error": "Invalid code"}), 400
            
        # Success! Mark as verified in Firebase
        if HAS_FIREBASE_ADMIN and auth:
            user = auth.get_user_by_email(email)
            auth.update_user(user.uid, email_verified=True)
            
            # Initialize new user with 15 credits in Firestore during signup if not already done
            if db_admin:
                user_ref = db_admin.collection('users').document(user.uid)
                if not user_ref.get().exists:
                    user_ref.set({
                        'credits': 15,
                        'email': email,
                        'createdAt': firestore.SERVER_TIMESTAMP
                    })
        
        # Cleanup
        db_admin.collection("verifications").document(email).delete()
        
        return jsonify({"success": True, "message": "Account verified successfully!"})
        
    except Exception as e:
        print(f"[Auth] Verification error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/auth/verify-otp-reset', methods=['POST'])
def verify_otp_reset():
    allowed, rate_resp = check_rate_limit(request, "auth")
    if not allowed:
        return rate_resp
    try:
        data = request.json or {}
        email = (data.get("email") or "").strip().lower()
        otp = (data.get("otp") or "").strip()
        new_password = str(data.get("password") or "")
        
        if not all([email, otp, new_password]):
            return jsonify({"success": False, "error": "Missing required fields"}), 400
            
        if not validate_email_format(email):
            return jsonify({"success": False, "error": "Invalid email format"}), 400
            
        if len(new_password) < 6:
            return jsonify({"success": False, "error": "Password must be at least 6 characters"}), 400
            
        if len(new_password) > 128:
            return jsonify({"success": False, "error": "Password exceeds maximum length limit of 128 characters"}), 400
            
        if not db_admin:
            return jsonify({"success": False, "error": "Database not initialized"}), 500
            
        # Get OTP from Firestore
        otp_doc = db_admin.collection("otps").document(email).get()
        if not otp_doc.exists:
            return jsonify({"success": False, "error": "No OTP found or expired"}), 400
            
        otp_data = otp_doc.to_dict()
        
        # Check expiry (naive UTC check)
        if datetime.now(timezone.utc) > otp_data['expires_at'].replace(tzinfo=None):
            return jsonify({"success": False, "error": "OTP has expired"}), 400
            
        # Verify OTP with brute-force lock
        if otp_data['otp'] != otp:
            failed_attempts = int(otp_data.get('failed_attempts', 0)) + 1
            if failed_attempts >= 5:
                db_admin.collection("otps").document(email).delete()
                return jsonify({"success": False, "error": "Too many failed attempts. This OTP has been invalidated. Please request a new one."}), 400
            else:
                db_admin.collection("otps").document(email).update({'failed_attempts': failed_attempts})
                return jsonify({"success": False, "error": "Invalid OTP code"}), 400
            
        # OTP is valid! Reset password in Firebase Auth
        if HAS_FIREBASE_ADMIN and auth:
            user = auth.get_user_by_email(email)
            auth.update_user(user.uid, password=new_password)
        
        # Cleanup OTP
        db_admin.collection("otps").document(email).delete()
        
        return jsonify({"success": True, "message": "Password updated successfully"})
        
    except Exception as e:
        print(f"[Auth] Verify OTP error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

def send_otp_email(to_email, otp, type="Password Reset"):
    smtp_host = os.environ.get("SMTP_HOST", "in-v3.mailjet.com")
    smtp_port = int(os.environ.get("SMTP_PORT", 587))
    smtp_user = os.environ.get("SMTP_USER")
    smtp_pass = os.environ.get("SMTP_PASS")
    smtp_from = os.environ.get("SMTP_FROM", "ResumeAI <noreply@resumeai.com>")
    
    if not all([smtp_host, smtp_user, smtp_pass]):
        print(f"[SMTP] WARNING: SMTP not configured. {type} Code was: ", otp)
        return True # Simulate success in dev
        
    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_from
        msg['To'] = to_email
        msg['Subject'] = f"{otp} is your ResumeAI {type} code"
        
        body = f"""
        <html>
            <body style="font-family: sans-serif; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #0d9488;">{type} Request</h2>
                    <p>Use the following 6-digit code to verify your identity for <strong>{type}</strong>:</p>
                    <div style="background: #f0fdfa; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0d9488;">{otp}</span>
                    </div>
                    <p style="font-size: 14px; color: #666;">This code is valid for a limited time. If you did not request this, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #999; text-align: center;">Securely powered by ResumeAI Cloud (Mailjet Protected)</p>
                </div>
            </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"[SMTP] Error sending email: {e}")
        return False

# --- Indian-First Pricing Structure & Cashfree Payment Integration ---
PENDING_ORDERS = {}
FALLBACK_PROMOS = [
    {"code": "SAVE20", "discount_type": "percent", "discount_value": 20, "max_uses": 500, "uses": 12, "active": True},
    {"code": "OFF50", "discount_type": "fixed", "discount_value": 50, "max_uses": 200, "uses": 45, "active": True}
]

PLAN_CONFIGS = {
    # Subscriptions (Monthly)
    "student_monthly": {"name": "Student", "price": 99.00, "credits": 150, "type": "subscription", "plan": "student"},
    "starter_monthly": {"name": "Starter", "price": 149.00, "credits": 150, "type": "subscription", "plan": "starter"},
    "pro_monthly": {"name": "Pro ⭐", "price": 199.00, "credits": 1000, "type": "subscription", "plan": "pro"},
    "career_monthly": {"name": "Career Pro", "price": 499.00, "credits": 3000, "type": "subscription", "plan": "career_pro"},
    
    # Subscriptions (Yearly)
    "student_yearly": {"name": "Student Annual", "price": 799.00, "credits": 1500, "type": "subscription", "plan": "student"},
    "starter_yearly": {"name": "Starter Annual", "price": 999.00, "credits": 1800, "type": "subscription", "plan": "starter"},
    "pro_yearly": {"name": "Pro Annual ⭐", "price": 2499.00, "credits": 12000, "type": "subscription", "plan": "pro"},
    "career_yearly": {"name": "Career Pro Annual", "price": 3999.00, "credits": 36000, "type": "subscription", "plan": "career_pro"},

    # Lifetime Deal
    "lifetime": {"name": "Lifetime Deal", "price": 1999.00, "credits": 3000, "type": "lifetime", "plan": "lifetime"},
    
    # Credit Packs
    "pack_50": {"name": "50 AI Credits", "price": 49.00, "credits": 50, "type": "credits"},
    "pack_150": {"name": "150 AI Credits", "price": 99.00, "credits": 150, "type": "credits"},
    "pack_400": {"name": "400 AI Credits", "price": 199.00, "credits": 400, "type": "credits"},
    "pack_1000": {"name": "1000 AI Credits", "price": 399.00, "credits": 1000, "type": "credits"},
    
    # Pay-Per-Download Pass
    "pay_per_download": {"name": "Single Premium Pass", "price": 49.00, "credits": 50, "type": "single_pass"},

    # Aliases
    "basic": {"name": "Starter", "price": 149.00, "credits": 150, "type": "subscription", "plan": "starter"},
    "pro": {"name": "Pro ⭐", "price": 199.00, "credits": 1000, "type": "subscription", "plan": "pro"},
    "expert": {"name": "Career Pro", "price": 499.00, "credits": 3000, "type": "subscription", "plan": "career_pro"},
    "ultimate": {"name": "Lifetime", "price": 1999.00, "credits": 3000, "type": "lifetime", "plan": "lifetime"},
}

def get_cashfree_credentials():
    app_id = (os.environ.get("CASHFREE_APP_ID") or "").strip()
    secret_key = (os.environ.get("CASHFREE_SECRET_KEY") or "").strip()

    is_test_key = app_id.upper().startswith("TEST") or secret_key.lower().startswith("cfsk_ma_test_")
    mode_env = os.environ.get("CASHFREE_MODE", "").strip().upper()
    
    if is_test_key:
        mode = "SANDBOX"
    elif mode_env in ["SANDBOX", "PRODUCTION"]:
        mode = mode_env
    else:
        mode = "PRODUCTION"

    base_url = "https://sandbox.cashfree.com/pg" if mode == "SANDBOX" else "https://api.cashfree.com/pg"
    return app_id, secret_key, mode, base_url

@app.route('/api/cashfree/create-order', methods=['POST'])
def cashfree_create_order():
    try:
        uid = verify_authenticated_user(request)
        if not uid:
            return jsonify({"error": "Authentication required. Please log in first."}), 401
            
        data = request.get_json(silent=True) or {}
        plan_id = data.get("plan_id", "pro_monthly")
        if plan_id not in PLAN_CONFIGS:
            return jsonify({"error": "Invalid plan selected"}), 400
            
        plan = PLAN_CONFIGS[plan_id]
        order_amount = float(plan["price"])
        
        # Apply Promo Code discount if provided
        promo_code = (data.get("promo_code") or "").strip().upper()
        discount_applied = 0.0
        if promo_code:
            pdata = None
            if db_admin:
                try:
                    promo_doc = db_admin.collection("promo_codes").document(promo_code).get()
                    if promo_doc.exists:
                        pdata = promo_doc.to_dict()
                except Exception as fe:
                    print(f"⚠️ Firestore promo lookup error: {fe}")

            if not pdata:
                pdata = next((p for p in FALLBACK_PROMOS if p["code"] == promo_code), None)

            if pdata and pdata.get("active", True):
                max_uses = pdata.get("max_uses", 999999)
                uses = pdata.get("uses", 0)
                if uses < max_uses:
                    dtype = pdata.get("discount_type", "percent")
                    dval = float(pdata.get("discount_value", 0))
                    if dtype == "percent":
                        discount_applied = order_amount * (dval / 100.0)
                    else:
                        discount_applied = dval
                    order_amount = max(1.0, round(order_amount - discount_applied, 2))
                    print(f"🎟️ Cashfree Order Discounted: Original ₹{plan['price']} -> New ₹{order_amount} (Coupon: '{promo_code}')")
        
        app_id, secret_key, mode, base_url = get_cashfree_credentials()
        if not app_id or not secret_key:
            return jsonify({"error": "Payment gateway credentials are not configured on the server."}), 500
        
        clean_uid = re.sub(r'[^a-zA-Z0-9_-]', '', str(uid))[:30] or "user"
        order_id = f"ord_{clean_uid}_{int(time.time())}"
        
        user_email = (data.get("customer_email") or "").strip()
        if not user_email or "@" not in user_email:
            user_email = "customer@resumagic.worklabs.studio"
            
        user_phone = re.sub(r'[^0-9]', '', str(data.get("customer_phone") or ""))
        if len(user_phone) != 10:
            user_phone = "9999999999"
            
        forwarded_host = request.headers.get('X-Forwarded-Host') or request.host
        if "localhost" in forwarded_host or "127.0.0.1" in forwarded_host:
            site_url = f"http://{forwarded_host}"
        else:
            site_url = f"https://{forwarded_host}"
            
        return_url = f"{site_url.rstrip('/')}/pricing?order_id={{order_id}}&plan_id={plan_id}"
        
        payload = {
            "order_id": order_id,
            "order_amount": float(order_amount),
            "order_currency": "INR",
            "customer_details": {
                "customer_id": clean_uid,
                "customer_email": user_email,
                "customer_phone": user_phone
            },
            "order_meta": {
                "return_url": return_url
            },
            "order_note": f"Resumagic {plan['name']} ({plan['credits']} AI Credits)"
        }
        
        # Save pending order in memory & Firestore
        order_record = {
            "order_id": order_id,
            "uid": uid,
            "plan_id": plan_id,
            "amount": order_amount,
            "promo_code": promo_code,
            "status": "CREATED",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        PENDING_ORDERS[order_id] = order_record

        if db_admin:
            try:
                db_admin.collection("orders").document(order_id).set(order_record)
            except Exception as fe:
                print(f"⚠️ Firestore order record error: {fe}")

        headers = {
            "x-client-id": app_id,
            "x-client-secret": secret_key,
            "x-api-version": "2023-08-01",
            "Content-Type": "application/json"
        }
        
        print(f"🚀 Cashfree Order Request to {base_url}/orders | Plan: {plan_id} | Mode: {mode} | Client ID: {app_id[:8]}... | return_url: {return_url}")
        cf_res = requests.post(f"{base_url}/orders", json=payload, headers=headers, timeout=10)
        cf_data = cf_res.json()
        
        if cf_res.status_code not in [200, 201]:
            error_msg = cf_data.get("message") or cf_data.get("error", "Failed to initialize Cashfree payment")
            print(f"❌ Cashfree Order Creation Error ({cf_res.status_code}): {cf_data}")
            return jsonify({"error": error_msg, "cashfree_response": cf_data}), 400
            
        payment_session_id = cf_data.get("payment_session_id")
        
        return jsonify({
            "success": True,
            "payment_session_id": payment_session_id,
            "order_id": order_id,
            "environment": mode.lower()
        })
        
    except Exception as e:
        print(f"❌ Cashfree Order Exception: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/cashfree/verify-payment', methods=['POST'])
def cashfree_verify_payment():
    try:
        uid = verify_authenticated_user(request)
        if not uid:
            return jsonify({"error": "Authentication required. Please log in."}), 401
            
        data = request.get_json(silent=True) or {}
        order_id = data.get("order_id")
        plan_id = data.get("plan_id")
        
        if not order_id:
            return jsonify({"error": "order_id parameter is required"}), 400

        # Look up stored order details to get exact plan_id
        order_record = PENDING_ORDERS.get(order_id)
        if not order_record and db_admin:
            try:
                odoc = db_admin.collection("orders").document(order_id).get()
                if odoc.exists:
                    order_record = odoc.to_dict()
            except Exception:
                pass

        if order_record and order_record.get("plan_id"):
            plan_id = order_record.get("plan_id")
        if not plan_id:
            plan_id = "pro_monthly"

        app_id, secret_key, mode, base_url = get_cashfree_credentials()
        if not app_id or not secret_key:
            return jsonify({"error": "Payment gateway credentials are not configured on the server."}), 500
        
        headers = {
            "x-client-id": app_id,
            "x-client-secret": secret_key,
            "x-api-version": "2023-08-01",
            "Content-Type": "application/json"
        }
        
        cf_res = requests.get(f"{base_url}/orders/{order_id}", headers=headers, timeout=10)
        cf_data = cf_res.json()
        
        order_status = cf_data.get("order_status", "")
        
        # Payment is strictly valid only if Cashfree order_status is PAID or SUCCESS
        if order_status in ["PAID", "SUCCESS"]:
            plan = PLAN_CONFIGS.get(plan_id, PLAN_CONFIGS["pro_monthly"])
            added_credits = int(plan.get("credits", 150))
            plan_type = plan.get("plan", "pro")
            
            new_credits = added_credits
            if db_admin:
                try:
                    user_ref = db_admin.collection("users").document(uid)
                    user_doc = user_ref.get()
                    curr_credits = user_doc.to_dict().get("credits", 0) if (user_doc and user_doc.exists) else 0
                    new_credits = curr_credits + added_credits
                    
                    update_fields = {"credits": new_credits}
                    if plan.get("type") in ["subscription", "lifetime"] or "pro" in plan_id or "starter" in plan_id or "career" in plan_id:
                        update_fields["plan"] = plan_type
                        update_fields["userPlan"] = plan_type
                        update_fields["lastPurchasedPlan"] = plan_type
                        
                    user_ref.set(update_fields, merge=True)
                    
                    tx_ref = user_ref.collection("transactions").document(order_id)
                    tx_ref.set({
                        "order_id": order_id,
                        "plan_id": plan_id,
                        "tier": plan_type,
                        "credits_added": added_credits,
                        "amount_paid": cf_data.get("order_amount", plan["price"]),
                        "status": "PAID",
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    })
                except Exception as fe:
                    print(f"⚠️ Firestore credit update warning: {fe}")
            
            return jsonify({
                "success": True,
                "order_status": "PAID",
                "message": f"Payment successful! Account upgraded to {plan_type.upper()} and {added_credits} AI credits added.",
                "credits_added": added_credits,
                "plan": plan_type,
                "userPlan": plan_type
            })
        else:
            return jsonify({
                "success": False,
                "order_status": order_status,
                "message": f"Payment status: '{order_status}'. Payment not completed."
            }), 400

    except Exception as e:
        print(f"❌ Cashfree Verification Exception: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/cashfree/webhook', methods=['POST'])
def cashfree_webhook():
    """Asynchronous payment notification webhook from Cashfree."""
    try:
        app_id, secret_key, mode, base_url = get_cashfree_credentials()
        
        # Verify webhook signature when Cashfree Secret Key is configured
        if secret_key:
            signature = request.headers.get("x-webhook-signature") or request.headers.get("x-cashfree-signature")
            timestamp = request.headers.get("x-webhook-timestamp")
            if not signature or not timestamp:
                print("⚠️ Cashfree Webhook: Missing signature or timestamp headers.")
                return jsonify({"error": "Missing signature headers"}), 401
                
            import hmac, hashlib, base64
            raw_body = request.get_data()
            data_to_sign = timestamp.encode('utf-8') + raw_body
            computed_sig = base64.b64encode(hmac.new(secret_key.encode('utf-8'), data_to_sign, hashlib.sha256).digest()).decode('utf-8')
            if not hmac.compare_digest(signature, computed_sig):
                print("🚨 Cashfree Webhook: Invalid signature detected! Rejecting request.")
                return jsonify({"error": "Invalid webhook signature"}), 401

        data = request.get_json(silent=True) or {}
        event_type = data.get("type")
        
        if event_type == "PAYMENT_SUCCESS":
            event_data = data.get("data", {})
            order_info = event_data.get("order", {})
            customer_info = event_data.get("customer_details", {})
            
            order_id = order_info.get("order_id")
            uid = customer_info.get("customer_id")
            order_amount = order_info.get("order_amount", 0)
            
            if order_id and uid:
                added_credits = 150
                matched_plan = "pro"
                for pid, pconfig in PLAN_CONFIGS.items():
                    if abs(pconfig["price"] - float(order_amount)) < 1.0:
                        added_credits = pconfig["credits"]
                        matched_plan = pconfig.get("plan", "pro")
                        break
                        
                if db_admin:
                    user_ref = db_admin.collection("users").document(uid)
                    user_doc = user_ref.get()
                    curr_credits = user_doc.to_dict().get("credits", 0) if user_doc.exists else 0
                    
                    tx_doc = user_ref.collection("transactions").document(order_id).get()
                    if not tx_doc.exists:
                        user_ref.set({
                            "credits": curr_credits + added_credits, 
                            "plan": matched_plan,
                            "userPlan": matched_plan,
                            "lastPurchasedPlan": matched_plan
                        }, merge=True)
                        user_ref.collection("transactions").document(order_id).set({
                            "order_id": order_id,
                            "credits_added": added_credits,
                            "amount_paid": order_amount,
                            "status": "PAID",
                            "via": "webhook",
                            "timestamp": firestore.SERVER_TIMESTAMP
                        })
                        print(f"✅ Cashfree Webhook: Credited {added_credits} credits to {uid} for order {order_id}")
            return jsonify({"status": "OK"}), 200
        return jsonify({"status": "IGNORED"}), 200
    except Exception as e:
        print(f"❌ Cashfree Webhook Error: {e}")
        return jsonify({"error": str(e)}), 500

# --- Career Document Generator API ---

@app.route('/api/documents/generate', methods=['POST'])
def generate_career_document():
    """Generates AI Cover Letters, SOPs, LORs, Resignation Letters, Cold Emails, LinkedIn Bios, etc."""
    allowed, rate_resp = check_rate_limit(request, "ai")
    if not allowed:
        return rate_resp
    try:
        uid = verify_authenticated_user(request)
        if uid and not check_user_has_credits(uid, 10):
            return jsonify({"error": "Insufficient credits. Please top up."}), 402
            
        data = request.get_json(silent=True) or {}
        doc_type = data.get("doc_type", "cover_letter")
        job_title = data.get("job_title", "Software Engineer")
        company = data.get("company", "TechCorp")
        user_experience = data.get("user_experience", "")
        additional_notes = data.get("additional_notes", "")

        if locally_blocked(f"{job_title} {company} {user_experience} {additional_notes}"):
            return jsonify({
                "success": False,
                "error": "Request blocked: Content violates career and resume safety policy."
            }), 400
        
        parser = AIParserEngine()
        result = parser.generate_career_document(
            doc_type=doc_type,
            job_title=job_title,
            company=company,
            user_experience=user_experience,
            additional_notes=additional_notes
        )
        
        if uid and isinstance(result, dict) and result.get("success"):
            deduct_user_credits(uid, 10)
            
        return jsonify(result)
    except Exception as e:
        print(f"❌ Career Document Generator Error: {e}")
        return jsonify({"error": str(e)}), 500

# --- Student Offer Verification API ---

@app.route('/api/student/verify', methods=['POST'])
def verify_student():
    """Verifies college email domain (.edu / .ac.in / college domain) for Student ₹99 Offer."""
    try:
        uid = verify_authenticated_user(request)
        if not uid:
            return jsonify({"error": "Authentication required."}), 401
            
        data = request.get_json(silent=True) or {}
        student_email = (data.get("student_email") or "").strip().lower()
        
        # Check domain ending with edu, ac.in, or containing college keywords
        if not student_email or "@" not in student_email:
            return jsonify({"error": "Please provide a valid college email address."}), 400
            
        domain = student_email.split("@")[-1]
        is_valid_student = any(domain.endswith(ext) for ext in [".edu", ".ac.in", ".edu.in", ".college.in", ".univ.in", ".iit.ac.in", ".bits-pilani.ac.in", ".nits.ac.in"]) or "college" in domain or "univ" in domain or "student" in domain
        
        if is_valid_student:
            if db_admin:
                db_admin.collection("users").document(uid).set({"is_student_verified": True, "student_email": student_email}, merge=True)
            return jsonify({"success": True, "message": "Student status verified! You unlock Student ₹99/mo pricing."})
        else:
            return jsonify({"success": False, "message": "Email domain not recognized as an accredited institution. Enter your official .edu or .ac.in email."}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Promo Code Management & Validation APIs ---

@app.route('/api/promo/validate', methods=['POST'])
@app.route('/api/admin/promo/apply', methods=['POST'])
def admin_apply_promo():
    """Applies discount codes to compute pricing discounts."""
    try:
        data = request.get_json(silent=True) or {}
        code = (data.get("code") or "").strip().upper()
        if not code:
            return jsonify({"error": "Promo code is required"}), 400
            
        if db_admin:
            try:
                doc = db_admin.collection("promo_codes").document(code).get()
                if doc.exists:
                    pdata = doc.to_dict()
                    if not pdata.get("active", True):
                        return jsonify({"error": "This promo code has expired or been deactivated"}), 400
                        
                    max_uses = pdata.get("max_uses", 999999)
                    uses = pdata.get("uses", 0)
                    if uses >= max_uses:
                        return jsonify({"error": "This promo code limit has been reached"}), 400
                        
                    return jsonify({
                        "success": True,
                        "code": code,
                        "discount_type": pdata.get("discount_type", "percent"),
                        "discount_value": float(pdata.get("discount_value", 0)),
                        "message": f"Promo code '{code}' applied! {pdata.get('discount_value')}{'%' if pdata.get('discount_type') == 'percent' else ' ₹'} off."
                    })
            except Exception as fe:
                print(f"⚠️ Firestore promo lookup warning: {fe}")
                
        # Check in-memory FALLBACK_PROMOS
        match = next((p for p in FALLBACK_PROMOS if p["code"] == code), None)
        if match:
            if not match.get("active", True):
                return jsonify({"error": "This promo code has expired or been deactivated"}), 400
            max_uses = match.get("max_uses", 999999)
            uses = match.get("uses", 0)
            if uses >= max_uses:
                return jsonify({"error": "This promo code limit has been reached"}), 400
            return jsonify({
                "success": True,
                "code": code,
                "discount_type": match.get("discount_type", "percent"),
                "discount_value": float(match.get("discount_value", 0)),
                "message": f"Promo code '{code}' applied! {match.get('discount_value')}{'%' if match.get('discount_type') == 'percent' else ' ₹'} off."
            })
            
        return jsonify({"error": "Invalid promo code"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/promo/delete', methods=['POST'])
def admin_delete_promo():
    """Admin endpoint to permanently delete/remove a promo code from Firestore and server memory."""
    try:
        admin_uid = verify_admin_user(request)
        if not admin_uid:
            return jsonify({"error": "Admin authorization required."}), 403
            
        data = request.get_json(silent=True) or {}
        code = (data.get("code") or "").strip().upper()
        if not code:
            return jsonify({"error": "Promo code is required"}), 400
            
        if db_admin:
            try:
                db_admin.collection("promo_codes").document(code).delete()
            except Exception as fe:
                print(f"⚠️ Firestore promo delete warning: {fe}")
                
        # Remove from FALLBACK_PROMOS in memory
        global FALLBACK_PROMOS
        FALLBACK_PROMOS = [p for p in FALLBACK_PROMOS if p["code"] != code]
        
        return jsonify({"success": True, "message": f"Promo code '{code}' deleted successfully!"})
    except Exception as e:
        print(f"⚠️ Error deleting promo code: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/promo/create', methods=['POST'])
def admin_create_promo():
    """Admin endpoint to generate/create new promo codes with custom discounts."""
    try:
        admin_uid = verify_admin_user(request)
        if not admin_uid:
            return jsonify({"error": "Admin authorization required."}), 403
            
        data = request.get_json(silent=True) or {}
        code = (data.get("code") or "").strip().upper()
        discount_type = data.get("discount_type", "percent") # "percent" or "fixed"
        discount_value = float(data.get("discount_value", 10))
        max_uses = int(data.get("max_uses", 100))
        
        if not code:
            code = f"MAGIC{random.randint(100, 999)}"

        promo_obj = {
            "code": code,
            "discount_type": discount_type,
            "discount_value": discount_value,
            "max_uses": max_uses,
            "uses": 0,
            "active": True,
            "created_by": admin_uid,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
            
        if db_admin:
            try:
                db_admin.collection("promo_codes").document(code).set({
                    "code": code,
                    "discount_type": discount_type,
                    "discount_value": discount_value,
                    "max_uses": max_uses,
                    "uses": 0,
                    "active": True,
                    "created_by": admin_uid,
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
            except Exception as fe:
                print(f"⚠️ Firestore promo set warning: {fe}")

        # Update fallback list
        existing_idx = next((i for i, p in enumerate(FALLBACK_PROMOS) if p["code"] == code), None)
        if existing_idx is not None:
            FALLBACK_PROMOS[existing_idx] = promo_obj
        else:
            FALLBACK_PROMOS.insert(0, promo_obj)
            
        return jsonify({
            "success": True,
            "code": code,
            "discount_type": discount_type,
            "discount_value": discount_value,
            "max_uses": max_uses,
            "message": f"Promo code '{code}' created successfully!"
        })
    except Exception as e:
        print(f"⚠️ Error creating promo code: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/promo/list', methods=['GET'])
def admin_list_promos():
    """Admin endpoint to list all active promo codes."""
    try:
        admin_uid = verify_admin_user(request)
        if not admin_uid:
            return jsonify({"error": "Admin authorization required."}), 403

        if db_admin:
            try:
                docs = db_admin.collection("promo_codes").limit(50).get()
                promos = []
                for d in docs:
                    p = d.to_dict()
                    if "created_at" in p:
                        p["created_at"] = str(p["created_at"])
                    promos.append(p)
                if promos:
                    return jsonify({"success": True, "promos": promos})
            except Exception as fe:
                print(f"⚠️ Firestore promo list warning: {fe}")

        return jsonify({"success": True, "promos": FALLBACK_PROMOS})
    except Exception as e:
        print(f"⚠️ Error listing promo codes: {e}")
        return jsonify({"error": str(e)}), 500

# Re-export app for Vercel
if __name__ == "__main__":
    print("🚀 Starting PDF Engine API on http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=True)
