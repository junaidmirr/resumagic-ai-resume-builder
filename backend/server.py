from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import base64
import tempfile
import os
import json
import requests
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
from ai_parser import AIParserEngine
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

@app.route("/api/performance/stats", methods=["GET"])
def get_performance_stats():
    return jsonify(perf_engine.get_summary_stats())

@app.route("/api/performance/logs", methods=["GET"])
def get_performance_logs():
    max_lines = request.args.get("lines", default=100, type=int)
    lines = perf_engine.get_recent_log_entries(max_lines=max_lines)
    return jsonify({"logs": lines, "file": perf_engine.log_file_path})

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
        service_account_b64 = os.environ.get("FIREBASE_SERVICE_ACCOUNT_B64")
        if service_account_b64:
            import base64
            decoded_key = base64.b64decode(service_account_b64).decode("utf-8")
            service_account_info = json.loads(decoded_key)
            cred = credentials.Certificate(service_account_info)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase Admin initialized via B64 Environment Variable.")
        else:
            service_account_path = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")
            if os.path.exists(service_account_path):
                cred = credentials.Certificate(service_account_path)
                firebase_admin.initialize_app(cred)
                print("✅ Firebase Admin initialized with local service account.")
            else:
                firebase_admin.initialize_app()
                print("⚠️ Firebase Admin initialized with default credentials.")
        db_admin = firestore.client()
    except Exception as e:
        print(f"❌ Firebase Admin failed to initialize: {e}")
        db_admin = None
else:
    print("ℹ️ HAS_FIREBASE_ADMIN is False (running in slim serverless mode).")
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
    """Verifies Firebase ID Token from Authorization header or falls back to X-User-ID."""
    auth_header = request_obj.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split("Bearer ")[1].strip()
        if HAS_FIREBASE_ADMIN and auth:
            try:
                decoded_token = auth.verify_id_token(token)
                return decoded_token.get("uid")
            except Exception as e:
                print(f"⚠️ Firebase token verification failed: {e}")
    return request_obj.headers.get("X-User-ID")

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

# --- Cloudinary Endpoints ---

@app.route('/api/cloudinary/sign', methods=['POST'])
def cloudinary_sign():
    data = request.json
    folder = data.get('folder', '')
    timestamp = int(time.time())
    
    # Generate signature using API Secret
    params_to_sign = {'timestamp': timestamp}
    if folder:
        params_to_sign['folder'] = folder
        
    signature = cloudinary.utils.api_sign_request(
        params_to_sign,
        os.environ.get("CLOUDINARY_API_SECRET")
    )
    
    return jsonify({
        "timestamp": timestamp,
        "signature": signature,
        "api_key": os.environ.get("CLOUDINARY_API_KEY"),
        "cloud_name": os.environ.get("CLOUDINARY_CLOUD_NAME")
    })

@app.route('/api/cloudinary/delete', methods=['POST'])
def cloudinary_delete():
    data = request.json
    public_id = data.get('public_id')
    if not public_id:
        return jsonify({"error": "Missing public_id"}), 400
        
    try:
        # Require admin API for destroy
        result = cloudinary.uploader.destroy(public_id)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/user/credits', methods=['GET'])
def get_user_credits():
    try:
        uid = request.headers.get("X-User-ID")
        if not uid: return jsonify({"credits": 0})
        
        if not db_admin: return jsonify({"error": "DB error"}), 500

        user_ref = db_admin.collection('users').document(uid)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            user_ref.set({'credits': 50, 'createdAt': firestore.SERVER_TIMESTAMP})
            return jsonify({"credits": 50})
            
        return jsonify({"credits": user_doc.to_dict().get('credits', 0)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/user/init', methods=['POST'])
def init_user():
    try:
        uid = request.headers.get("X-User-ID")
        if not uid: return jsonify({"error": "Auth required"}), 401
        
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
        uid = request.headers.get("X-User-ID")
        if not uid: return jsonify({"error": "Auth required"}), 401
        
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
        uid = request.headers.get("X-User-ID")
        if not uid: return jsonify({"error": "Auth required"}), 401
        
        if db_admin:
            db_admin.collection('users').document(uid).delete()
        
        # Delete from Firebase Auth
        auth.delete_user(uid)
        
        return jsonify({"success": True, "message": "Account deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/parse-resume', methods=['POST'])
def parse_resume():
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

@app.route('/api/render', methods=['POST'])
def render_pdf():
    temp_files = []
    try:
        raw_elements = request.json
        if not raw_elements:
            return jsonify({"error": "No JSON payload provided"}), 400
            
        print("[PDFEngine Server] Received render request")
        
        # Sanitize elements & handle base64 images safely
        clean_elements = []
        for el in (raw_elements if isinstance(raw_elements, list) else []):
            if not isinstance(el, dict): continue
            clean_el = dict(el)
            if clean_el.get('element_type') == 'image':
                path = clean_el.get('image_path', '')
                if path.startswith('data:image'):
                    try:
                        header, encoded = path.split(',', 1)
                        ext = header.split(';')[0].split('/')[1]
                        if ext not in ('png', 'jpeg', 'jpg', 'webp'): ext = 'png'
                        fd, tmp_path = tempfile.mkstemp(suffix='.' + ext)
                        with os.fdopen(fd, 'wb') as f:
                            f.write(base64.b64decode(encoded))
                        clean_el['image_path'] = tmp_path
                        temp_files.append(tmp_path)
                    except Exception as e:
                        print(f"Failed to decode base64 image: {e}")
            clean_elements.append(clean_el)
        
        # Initialise engine and import frontend state
        engine = PDFEngine()
        import json
        success = engine.import_state(json.dumps(clean_elements))
        
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
    try:
        uid = request.headers.get("X-User-ID")
        if uid and not check_and_deduct_credits(uid, 5):
            return jsonify({"error": "Insufficient credits. Please recharge."}), 402
            
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        parser = AIParserEngine()
        elements = parser.generate_from_scratch(data)
        
        return jsonify({"elements": elements})
    except Exception as e:
        print(f"[AI-Architect Route] Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/generate-skills', methods=['POST'])
def generate_skills_route():
    try:
        uid = request.headers.get("X-User-ID")
        if uid and not check_and_deduct_credits(uid, 5):
            return jsonify({"error": "Insufficient credits. Please recharge."}), 402
            
        data = request.json
        category = data.get("category", "")
        load_more = data.get("load_more", False)
        parser = AIParserEngine()
        skills = parser.get_skills(category, load_more)
        return jsonify({"skills": skills})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/generate-summary', methods=['POST'])
def generate_summary_route():
    try:
        uid = request.headers.get("X-User-ID")
        if uid and not check_and_deduct_credits(uid, 5):
            return jsonify({"error": "Insufficient credits. Please recharge."}), 402
            
        data = request.json
        parser = AIParserEngine()
        summary = parser.get_summary(data)
        return jsonify({"summary": summary})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/import-linkedin-url', methods=['POST'])
def import_linkedin_url():
    try:
        data = request.json
        url = data.get("linkedin_url", "")
        if not url:
            return jsonify({"error": "No LinkedIn URL provided"}), 400
            
        # For now, we simulate API fetching or prompt the AI to 'research' if it can.
        # In a real production app, you'd use Proxycurl or a similar service here.
        parser = AIParserEngine()
        wizard_data = parser.import_linkedin_url(url)
        
        return jsonify({"wizard_data": wizard_data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ai-chat-edit', methods=['POST'])
def ai_chat_edit():
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
        
        parser = AIParserEngine()
        result = parser.ai_chat_edit(elements, prompt)

        if uid:
            deduct_user_credits(uid, 10)

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ai-assistant', methods=['POST'])
def ai_assistant():
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
        
        parser = AIParserEngine()
        result = parser.handle_ai_action(action, text, context, job_description)

        if uid and isinstance(result, dict) and result.get("status") != "rejected":
            deduct_user_credits(uid, 10)

        return jsonify(result)
    except Exception as e:
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

@app.route('/api/auth/send-otp', methods=['POST'])
def send_otp():
    try:
        data = request.json
        email = data.get("email")
        if not email:
            return jsonify({"success": False, "error": "Email is required"}), 400
            
        # Verify user exists in Firebase
        try:
            auth.get_user_by_email(email)
        except auth.UserNotFoundError:
            return jsonify({"success": False, "error": "No user found with this email"}), 404
            
        # Generate 6-digit OTP
        otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        expires_at = datetime.utcnow() + timedelta(minutes=10)
        
        # Store OTP in Firestore securely
        if db_admin:
            db_admin.collection("otps").document(email).set({
                "otp": otp,
                "expires_at": expires_at,
                "created_at": datetime.utcnow()
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
    try:
        data = request.json
        email = data.get("email")
        if not email:
            return jsonify({"success": False, "error": "Email is required"}), 400
            
        # Verify user exists
        try:
            user = auth.get_user_by_email(email)
        except auth.UserNotFoundError:
            return jsonify({"success": False, "error": "User not found"}), 404
            
        # Initialize new user with 50 credits in Firestore during signup
        if db_admin:
            user_ref = db_admin.collection('users').document(user.uid)
            if not user_ref.get().exists:
                user_ref.set({
                    'credits': 50,
                    'email': email,
                    'createdAt': firestore.SERVER_TIMESTAMP
                })
            
        # Generate 6-digit code
        otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        expires_at = datetime.utcnow() + timedelta(hours=24) # Verif codes last longer
        
        # Store securely
        if db_admin:
            db_admin.collection("verifications").document(email).set({
                "otp": otp,
                "expires_at": expires_at,
                "created_at": datetime.utcnow()
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
    try:
        data = request.json
        email = data.get("email")
        otp = data.get("otp")
        
        if not all([email, otp]):
            return jsonify({"success": False, "error": "Email and code required"}), 400
            
        if not db_admin: return jsonify({"success": False, "error": "DB not ready"}), 500
            
        # Get code from Firestore
        doc = db_admin.collection("verifications").document(email).get()
        if not doc.exists:
            return jsonify({"success": False, "error": "No verification pending"}), 404
            
        ver_data = doc.to_dict()
        if datetime.utcnow() > ver_data['expires_at'].replace(tzinfo=None):
            return jsonify({"success": False, "error": "Code expired"}), 400
            
        if ver_data['otp'] != otp:
            return jsonify({"success": False, "error": "Invalid code"}), 400
            
        # Success! Mark as verified in Firebase
        user = auth.get_user_by_email(email)
        auth.update_user(user.uid, email_verified=True)
        
        # Initialize new user with 50 credits in Firestore during signup if not already done
        if db_admin:
            user_ref = db_admin.collection('users').document(user.uid)
            if not user_ref.get().exists:
                user_ref.set({
                    'credits': 50,
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
    try:
        data = request.json
        email = data.get("email")
        otp = data.get("otp")
        new_password = data.get("password")
        
        if not all([email, otp, new_password]):
            return jsonify({"success": False, "error": "Missing required fields"}), 400
            
        if not db_admin:
            return jsonify({"success": False, "error": "Database not initialized"}), 500
            
        # Get OTP from Firestore
        otp_doc = db_admin.collection("otps").document(email).get()
        if not otp_doc.exists:
            return jsonify({"success": False, "error": "No OTP found/expired"}), 400
            
        otp_data = otp_doc.to_dict()
        
        # Check expiry (naive UTC check)
        if datetime.utcnow() > otp_data['expires_at'].replace(tzinfo=None):
            return jsonify({"success": False, "error": "OTP has expired"}), 400
            
        # Verify OTP
        if otp_data['otp'] != otp:
            return jsonify({"success": False, "error": "Invalid OTP code"}), 400
            
        # OTP is valid! Reset password in Firebase Auth
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

# --- Cashfree Payment Gateway Integration ---

PLAN_CONFIGS = {
    "basic": {"name": "Starter", "price": 199.00, "credits": 50},
    "pro": {"name": "Professional", "price": 299.00, "credits": 150},
    "expert": {"name": "Expert", "price": 599.00, "credits": 350},
    "ultimate": {"name": "Ultimate", "price": 999.00, "credits": 500},
}

@app.route('/api/cashfree/create-order', methods=['POST'])
def cashfree_create_order():
    try:
        uid = verify_authenticated_user(request)
        if not uid:
            return jsonify({"error": "Authentication required. Please log in first."}), 401
            
        data = request.get_json(silent=True) or {}
        plan_id = data.get("plan_id", "pro")
        if plan_id not in PLAN_CONFIGS:
            return jsonify({"error": "Invalid plan selected"}), 400
            
        plan = PLAN_CONFIGS[plan_id]
        order_amount = plan["price"]
        
        app_id = os.environ.get("CASHFREE_APP_ID") or "TEST104787961bd4e402b8d0c8d6265069784701"
        secret_key = os.environ.get("CASHFREE_SECRET_KEY") or "cfsk_ma_test_d3c01648a472a15f02c46f1ef1fb9a12_55a2c4d9"
        mode = os.environ.get("CASHFREE_MODE", "SANDBOX").upper()
        
        base_url = "https://sandbox.cashfree.com/pg" if mode == "SANDBOX" else "https://api.cashfree.com/pg"
        order_id = f"order_{uid[:10]}_{int(time.time())}"
        
        user_email = data.get("customer_email") or "user@resumagic.app"
        user_phone = data.get("customer_phone") or "9999999999"
        
        payload = {
            "order_id": order_id,
            "order_amount": float(order_amount),
            "order_currency": "INR",
            "customer_details": {
                "customer_id": uid,
                "customer_email": user_email,
                "customer_phone": user_phone
            },
            "order_meta": {
                "return_url": f"{request.host_url.rstrip('/')}/pricing?order_id={{order_id}}"
            },
            "order_note": f"Resumagic {plan['name']} Pack ({plan['credits']} AI Credits)"
        }
        
        headers = {
            "x-client-id": app_id,
            "x-client-secret": secret_key,
            "x-api-version": "2023-08-01",
            "Content-Type": "application/json"
        }
        
        cf_res = requests.post(f"{base_url}/orders", json=payload, headers=headers, timeout=10)
        cf_data = cf_res.json()
        
        if cf_res.status_code not in [200, 201]:
            print(f"❌ Cashfree Order Creation Error: {cf_data}")
            return jsonify({"error": cf_data.get("message", "Failed to initialize payment session with Cashfree")}), 400
            
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
        plan_id = data.get("plan_id", "pro")
        
        if not order_id:
            return jsonify({"error": "order_id parameter is required"}), 400
            
        app_id = os.environ.get("CASHFREE_APP_ID") or "TEST104787961bd4e402b8d0c8d6265069784701"
        secret_key = os.environ.get("CASHFREE_SECRET_KEY") or "cfsk_ma_test_d3c01648a472a15f02c46f1ef1fb9a12_55a2c4d9"
        mode = os.environ.get("CASHFREE_MODE", "SANDBOX").upper()
        
        base_url = "https://sandbox.cashfree.com/pg" if mode == "SANDBOX" else "https://api.cashfree.com/pg"
        
        headers = {
            "x-client-id": app_id,
            "x-client-secret": secret_key,
            "x-api-version": "2023-08-01",
            "Content-Type": "application/json"
        }
        
        cf_res = requests.get(f"{base_url}/orders/{order_id}", headers=headers, timeout=10)
        cf_data = cf_res.json()
        
        order_status = cf_data.get("order_status")
        
        if order_status == "PAID":
            plan = PLAN_CONFIGS.get(plan_id, PLAN_CONFIGS["pro"])
            added_credits = plan["credits"]
            
            if db_admin:
                user_ref = db_admin.collection("users").document(uid)
                user_doc = user_ref.get()
                curr_credits = user_doc.to_dict().get("credits", 0) if user_doc.exists else 0
                new_credits = curr_credits + added_credits
                user_ref.set({"credits": new_credits}, merge=True)
                
                tx_ref = user_ref.collection("transactions").document(order_id)
                tx_ref.set({
                    "order_id": order_id,
                    "plan_id": plan_id,
                    "credits_added": added_credits,
                    "amount_paid": cf_data.get("order_amount", plan["price"]),
                    "status": "PAID",
                    "timestamp": firestore.SERVER_TIMESTAMP
                })
            
            return jsonify({
                "success": True,
                "order_status": "PAID",
                "message": f"Payment successful! Added {added_credits} AI credits to your account.",
                "credits_added": added_credits
            })
        else:
            return jsonify({
                "success": False,
                "order_status": order_status,
                "message": f"Payment status: '{order_status}'."
            }), 400

    except Exception as e:
        print(f"❌ Cashfree Verification Exception: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/cashfree/webhook', methods=['POST'])
def cashfree_webhook():
    """Asynchronous payment notification webhook from Cashfree."""
    try:
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
                for pid, pconfig in PLAN_CONFIGS.items():
                    if abs(pconfig["price"] - float(order_amount)) < 1.0:
                        added_credits = pconfig["credits"]
                        break
                        
                if db_admin:
                    user_ref = db_admin.collection("users").document(uid)
                    user_doc = user_ref.get()
                    curr_credits = user_doc.to_dict().get("credits", 0) if user_doc.exists else 0
                    
                    tx_doc = user_ref.collection("transactions").document(order_id).get()
                    if not tx_doc.exists:
                        user_ref.set({"credits": curr_credits + added_credits}, merge=True)
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

# Re-export app for Vercel
if __name__ == "__main__":
    print("🚀 Starting PDF Engine API on http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=True)
