from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import base64
import tempfile
import os
import json
import requests
import firebase_admin
from firebase_admin import credentials, auth, firestore
from dotenv import load_dotenv

# Allow relative imports from root when running in Vercel
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from engine import PDFEngine
from ai_parser import AIParserEngine

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Allow React frontend to ping this API

# Firebase Admin Initialization
try:
    # 1. Try to load from Base64 Environment Variable (Recommended for Vercel)
    service_account_b64 = os.environ.get("FIREBASE_SERVICE_ACCOUNT_B64")
    
    if service_account_b64:
        import base64
        decoded_key = base64.b64decode(service_account_b64).decode("utf-8")
        service_account_info = json.loads(decoded_key)
        cred = credentials.Certificate(service_account_info)
        firebase_admin.initialize_app(cred)
        print("✅ Firebase Admin initialized via B64 Environment Variable.")
    else:
        # 2. Fallback to local file for dev
        service_account_path = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")
        if os.path.exists(service_account_path):
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase Admin initialized with local service account.")
        else:
            # 3. Last fallback (limited functionality)
            firebase_admin.initialize_app()
            print("⚠️ Firebase Admin initialized with default credentials.")
            
    db_admin = firestore.client()
except Exception as e:
    print(f"❌ Firebase Admin failed to initialize: {e}")
    db_admin = None

# Global Parser Instance
parser = AIParserEngine()

def check_and_deduct_credits(uid, cost=5):
    """Verifies and deducts credits from Firestore."""
    if not db_admin: return True # Bypass if Firestore not ready
    
    user_ref = db_admin.collection('users').document(uid)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        # Initialize new user with 50 credits
        user_ref.set({
            'credits': 50,
            'email': auth.get_user(uid).email if auth else "unknown",
            'createdAt': firestore.SERVER_TIMESTAMP
        })
        credits = 50
    else:
        credits = user_doc.to_dict().get('credits', 0)
    
    if credits < cost:
        return False
        
    user_ref.update({'credits': credits - cost})
    return True

@app.route('/api/user/credits', methods=['GET'])
def get_user_credits():
    try:
        # In a real app, we'd verify the Firebase ID Token
        # For simplicity in this demo, we'll expect a 'uid' header
        # or just use the current user from auth if possible
        uid = request.headers.get("X-User-ID")
        if not uid: return jsonify({"credits": 0})
        
        user_ref = db_admin.collection('users').document(uid)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            user_ref.set({'credits': 50, 'createdAt': firestore.SERVER_TIMESTAMP})
            return jsonify({"credits": 50})
            
        return jsonify({"credits": user_doc.to_dict().get('credits', 0)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/user/profile', methods=['GET'])
def get_user_profile():
    try:
        uid = request.headers.get("X-User-ID")
        if not uid: return jsonify({"error": "Auth required"}), 401
        
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
        
        # Delete from Firestore
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
        
        elements = parser.parse_file(file_bytes, filename, user_prompt=user_prompt, is_linkedin=is_linkedin)
        
        return jsonify({"elements": elements})
    except Exception as e:
        print(f"[AIParserEngine Server Route] Fatal error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/render', methods=['POST'])
def render_pdf():
    try:
        uid = request.headers.get("X-User-ID")
        if uid and not check_and_deduct_credits(uid, 5):
            return jsonify({"error": "Insufficient credits. Please recharge."}), 402
            
        elements = request.json
        if not elements:
            return jsonify({"error": "No JSON payload provided"}), 400
            
        print("[PDFEngine Server] Received render request")
        
        # Intercept base64 images and save to temp files so reportlab can read them
        temp_files = []
        # Assuming elements is a list of objects
        for el in elements:
            if isinstance(el, dict) and el.get('element_type') == 'image':
                path = el.get('image_path', '')
                if path.startswith('data:image'):
                    try:
                        header, encoded = path.split(',', 1)
                        ext = header.split(';')[0].split('/')[1]
                        fd, tmp_path = tempfile.mkstemp(suffix='.' + ext)
                        with os.fdopen(fd, 'wb') as f:
                            f.write(base64.b64decode(encoded))
                        el['image_path'] = tmp_path
                        temp_files.append(tmp_path)
                    except Exception as e:
                        print(f"Failed to decode base64 image: {e}")
        
        # Initialise engine and import frontend state
        engine = PDFEngine()
        import json
        success = engine.import_state(json.dumps(elements))
        
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

        return send_file(
            tmp_path, 
            mimetype='application/pdf', 
            as_attachment=True, 
            download_name='resume-export.pdf'
        )
    except Exception as e:
        print(f"[PDFEngine Server] Fatal error: {e}")
        return jsonify({"error": str(e)}), 500

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
        uid = request.headers.get("X-User-ID")
        if uid and not check_and_deduct_credits(uid, 5):
            return jsonify({"error": "Insufficient credits. Please recharge."}), 402
            
        data = request.json
        elements = data.get('elements', [])
        prompt = data.get('prompt', '')
        if not prompt: return jsonify({"error": "No prompt provided"}), 400
        
        result = parser.ai_chat_edit(elements, prompt)
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
            auth.get_user_by_email(email)
        except auth.UserNotFoundError:
            return jsonify({"success": False, "error": "User not found"}), 404
            
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

# Re-export app for Vercel
# if __name__ == '__main__':
#     print("🚀 Starting PDF Engine API on http://localhost:5001")
#     app.run(host='0.0.0.0', port=5001, debug=True)
