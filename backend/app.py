"""
Smart Alumni & Student Career Networking Portal - Backend API
Powered by Firebase Cloud Firestore.
Run with: python app.py
Serves REST API for decoupled frontend on http://localhost:5173, as well as template fallbacks.
"""
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify, send_from_directory
from flask_cors import CORS
import os
import re
import uuid
import hashlib
import secrets
import smtplib
from email.message import EmailMessage
from datetime import datetime, timedelta
import jwt
from jwt import InvalidTokenError
from werkzeug.exceptions import HTTPException
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

import sys

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
import firebase_db
load_dotenv(os.path.join(BACKEND_DIR, ".env"))

EMAIL_REGEX = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")

app = Flask(__name__, static_folder="static", template_folder="templates")

IS_PRODUCTION = (
    os.getenv("RENDER", "").lower() == "true"
    or os.getenv("VERCEL", "").lower() == "1"
    or os.getenv("APP_ENV", "").lower() == "production"
    or os.getenv("FLASK_ENV", "").lower() == "production"
)
_flask_secret = os.getenv("FLASK_SECRET_KEY", "").strip()
if IS_PRODUCTION and not _flask_secret:
    raise RuntimeError(
        "FLASK_SECRET_KEY is required in production. Set it in the backend hosting environment."
    )
app.secret_key = _flask_secret or "local-development-only-change-before-deployment"

# Sessions must work from the separate Vite/Vercel frontend.
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SECURE=IS_PRODUCTION,
    SESSION_COOKIE_SAMESITE="None" if IS_PRODUCTION else "Lax",
    PERMANENT_SESSION_LIFETIME=timedelta(hours=12),
    SESSION_REFRESH_EACH_REQUEST=False,
)

# FRONTEND_ORIGIN supports a comma-separated allow-list (use exact origins, no paths).
_local_origins = [
    "http://localhost:5173", "http://127.0.0.1:5173",
    "http://localhost:5000", "http://127.0.0.1:5000",
]
_configured_origins = [
    "https://alumni-24ce.vercel.app",
    "https://alumni-three-theta.vercel.app",
    *[
        origin.strip().rstrip("/")
        for origin in (os.getenv("FRONTEND_URL", "") + "," + os.getenv("FRONTEND_ORIGIN", "")).split(",")
        if origin.strip()
    ],
]
_allowed_origins = list(dict.fromkeys(_local_origins + _configured_origins))
CORS(app, supports_credentials=True, origins=_allowed_origins)


@app.errorhandler(Exception)
def handle_unexpected_error(error):
    # Preserve Flask's normal 404/405/etc. responses.
    if isinstance(error, HTTPException):
        return error
    app.logger.exception("Unhandled backend error for %s", request.path)
    if request.path.startswith("/api/"):
        return jsonify({"error": "Backend service error. Check backend logs for details."}), 500
    return "Internal Server Error", 500


@app.route("/api/health", methods=["GET"])
def api_health():
    """Deployment health check that also validates Firestore connectivity."""
    try:
        firebase_db.get_firestore_client().collection("users").limit(1).get()
        return jsonify({"status": "ok", "service": "alumni-backend", "database": "connected"}), 200
    except Exception:
        app.logger.exception("Firestore health check failed")
        return jsonify({
            "status": "error",
            "service": "alumni-backend",
            "database": "unavailable",
            "message": "Check Firebase project ID, service-account configuration, and Firestore access."
        }), 503


def _jwt_secret():
    secret = os.getenv("JWT_SECRET", "").strip()
    if not secret:
        if IS_PRODUCTION:
            raise RuntimeError("JWT_SECRET is required in production.")
        return app.secret_key
    return secret


def _issue_auth_token(user):
    # Standard JWT bearer token for separate frontend/backend origins.
    now = datetime.utcnow()
    return jwt.encode({
        "sub": str(user["id"]),
        "role": user.get("role"),
        "iat": now,
        "exp": now + timedelta(minutes=int(os.getenv("JWT_ACCESS_TOKEN_MINUTES", "720"))),
    }, _jwt_secret(), algorithm="HS256")


def current_user():
    # Prefer a signed bearer token for separate frontend/backend origins.
    auth_header = request.headers.get("Authorization", "")
    if auth_header.lower().startswith("bearer "):
        token = auth_header[7:].strip()
        if not token:
            return None
        try:
            payload = jwt.decode(token, _jwt_secret(), algorithms=["HS256"])
        except InvalidTokenError:
            return None
        user = firebase_db.get_user_by_id(payload.get("sub"))
        if not user or user.get("role") != payload.get("role"):
            return None
        return user

    # Keep session-cookie support for older clients and same-origin deployments.
    user_id = session.get("user_id")
    if not user_id:
        return None
    return firebase_db.get_user_by_id(user_id)


def login_required(role=None):
    user = current_user()
    if user is None:
        return None
    if role and user.get("role") != role:
        return None
    return user


# ==============================================================================
# REST API ENDPOINTS (FOR SEPARATE FRONTEND ON PORT 5173)
# ==============================================================================

@app.route("/api/auth/me", methods=["GET"])
def api_auth_me():
    user = current_user()
    if not user:
        return jsonify({"authenticated": False, "user": None}), 200
    u_dict = dict(user)
    u_dict.pop("password", None)
    return jsonify({"authenticated": True, "user": u_dict}), 200


@app.route("/api/auth/login", methods=["POST"])
def api_auth_login():
    data = request.get_json(silent=True) or request.form or {}
    role = (data.get("role") or "").strip().lower()
    username = (data.get("username") or "").strip()
    uucms_id = (data.get("uucms_id") or "").strip()
    faculty_id = (data.get("faculty_id") or "").strip()
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    if not password:
        return jsonify({"error": "Password is required."}), 400

    # 1. Faculty Login: Faculty ID + Name + Password
    if role == "faculty" or (not role and faculty_id):
        if not faculty_id:
            return jsonify({"error": "Faculty ID is required."}), 400
        if not name:
            return jsonify({"error": "Faculty Name is required."}), 400

        user = firebase_db.get_user_by_faculty_id(faculty_id)
        if user is None or str(user.get("name") or "").strip().casefold() != name.casefold() or not check_password_hash(user.get("password", ""), password):
            return jsonify({"error": "Invalid Faculty ID, name, or password."}), 401

        if user.get("status") != "active":
            return jsonify({"error": "Your faculty account is not active. Please contact administration."}), 403

        session.clear()
        session["user_id"] = user["id"]
        session.permanent = True
        u_dict = dict(user)
        u_dict.pop("password", None)
        return jsonify({
            "message": "Logged in successfully.",
            "user": u_dict,
            "auth_token": _issue_auth_token(user),
        }), 200

    # 2. Alumni Login: Username + UUCMS ID + Password
    if role == "alumni":
        if not username:
            return jsonify({"error": "Username is required."}), 400
        if not uucms_id:
            return jsonify({"error": "UUCMS ID is required."}), 400

        user = firebase_db.get_user_by_username(username, role="alumni")
        if user is None or not user.get("uucms_id") or str(user.get("uucms_id") or "").strip().casefold() != uucms_id.casefold() or not check_password_hash(user.get("password", ""), password):
            return jsonify({"error": "Invalid username, UUCMS ID, or password."}), 401

        if user.get("status") == "pending":
            return jsonify({"error": "Your alumni account is pending approval by the administrator."}), 403

        if user.get("status") != "active":
            return jsonify({"error": "Your alumni account is not active. Please contact administration."}), 403

        session.clear()
        session["user_id"] = user["id"]
        session.permanent = True
        u_dict = dict(user)
        u_dict.pop("password", None)
        return jsonify({
            "message": "Logged in successfully.",
            "user": u_dict,
            "auth_token": _issue_auth_token(user),
        }), 200

    # 3. Student Login: Username + UUCMS ID + Password
    if role == "student" or (not role and username and uucms_id):
        if not username:
            return jsonify({"error": "Username is required."}), 400
        if not uucms_id:
            return jsonify({"error": "UUCMS ID is required."}), 400

        user = firebase_db.get_user_by_username(username, role="student")
        if user is None or not user.get("uucms_id") or user.get("uucms_id", "").strip().lower() != uucms_id.lower() or not check_password_hash(user.get("password", ""), password):
            return jsonify({"error": "Invalid username, UUCMS ID, or password."}), 401

        if user.get("status") != "active":
            return jsonify({"error": "Your student account is not active. Please contact administration."}), 403

        session.clear()
        session["user_id"] = user["id"]
        session.permanent = True
        u_dict = dict(user)
        u_dict.pop("password", None)
        return jsonify({
            "message": "Logged in successfully.",
            "user": u_dict,
            "auth_token": _issue_auth_token(user),
        }), 200

    # 4. Administrator Login: Username or Email + Password
    if role == "admin" or (not role and (email or username)):
        admin_id = username or email or data.get("admin_identifier") or ""
        if not admin_id:
            return jsonify({"error": "Admin Username or Email is required."}), 400

        user = firebase_db.get_user_by_admin_identifier(admin_id)
        if user is None or not check_password_hash(user.get("password", ""), password):
            return jsonify({"error": "Invalid admin username, email, or password."}), 401

        if user.get("status") != "active":
            return jsonify({"error": "Your admin account is not active."}), 403

        session.clear()
        session["user_id"] = user["id"]
        session.permanent = True
        u_dict = dict(user)
        u_dict.pop("password", None)
        return jsonify({
            "message": "Logged in successfully.",
            "user": u_dict,
            "auth_token": _issue_auth_token(user),
        }), 200

    return jsonify({"error": "Please provide valid login credentials for your role."}), 400


def _email_key(email):
    return hashlib.sha256(email.strip().lower().encode('utf-8')).hexdigest()

def _send_otp_email(email, code):
    host = os.getenv('SMTP_HOST', '').strip()
    username = os.getenv('SMTP_USERNAME', '').strip()
    password = os.getenv('SMTP_PASSWORD', '').strip()
    sender = os.getenv('SMTP_FROM_EMAIL', '').strip() or username
    if not all((host, username, password, sender)):
        raise RuntimeError('SMTP settings are incomplete.')
    message = EmailMessage()
    message['Subject'] = 'Your Alumni Portal email verification code'
    message['From'] = sender
    message['To'] = email
    message.set_content('Your verification code is ' + code + '. It expires in ' + os.getenv('OTP_TTL_MINUTES', '10') + ' minutes.')
    with smtplib.SMTP(host, int(os.getenv('SMTP_PORT', '587')), timeout=15) as server:
        if os.getenv('SMTP_USE_TLS', 'true').lower() in ('1', 'true', 'yes'): server.starttls()
        server.login(username, password)
        server.send_message(message)

@app.route('/api/auth/send-otp', methods=['POST'])
def api_auth_send_otp():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    if not EMAIL_REGEX.match(email): return jsonify({'error': 'Enter a valid email address.'}), 400
    try:
        db = firebase_db.get_firestore_client()
        key = _email_key(email)
        now = datetime.utcnow()
        ref = db.collection('otp_challenges').document(key)
        old = ref.get()
        if old.exists:
            sent_at = (old.to_dict() or {}).get('sent_at')
            if sent_at and (now - sent_at.replace(tzinfo=None)).total_seconds() < 45:
                return jsonify({'error': 'Please wait 45 seconds before requesting another code.'}), 429
        code = f'{secrets.randbelow(1000000):06d}'
        ttl = int(os.getenv('OTP_TTL_MINUTES', '10'))
        _send_otp_email(email, code)
        ref.set({'email': email, 'code_hash': hashlib.sha256(code.encode()).hexdigest(), 'created_at': now, 'sent_at': now, 'expires_at': now + timedelta(minutes=ttl), 'attempts': 0})
        return jsonify({'message': 'Verification code sent to your email.', 'expires_in_minutes': ttl}), 200
    except Exception:
        app.logger.exception('Failed to send email OTP')
        return jsonify({'error': 'Could not send verification email. Check backend SMTP settings and logs.'}), 503

@app.route('/api/auth/verify-otp', methods=['POST'])
def api_auth_verify_otp():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    code = (data.get('code') or '').strip()
    if not EMAIL_REGEX.match(email) or not re.fullmatch(r'\d{6}', code):
        return jsonify({'error': 'Enter the email address and six-digit verification code.'}), 400
    db = firebase_db.get_firestore_client()
    key = _email_key(email)
    ref = db.collection('otp_challenges').document(key)
    snap = ref.get()
    if not snap.exists: return jsonify({'error': 'No active code. Request a new one.'}), 400
    challenge = snap.to_dict() or {}
    if int(challenge.get('attempts', 0)) >= 5:
        ref.delete()
        return jsonify({'error': 'Too many incorrect attempts. Request a new code.'}), 429
    expiry = challenge.get('expires_at')
    if not expiry or expiry.replace(tzinfo=None) < datetime.utcnow():
        ref.delete()
        return jsonify({'error': 'Code expired. Request a new one.'}), 400
    supplied = hashlib.sha256(code.encode()).hexdigest()
    if not secrets.compare_digest(supplied, challenge.get('code_hash', '')):
        ref.update({'attempts': int(challenge.get('attempts', 0)) + 1})
        return jsonify({'error': 'Incorrect verification code.'}), 400
    ref.delete()
    db.collection('verified_emails').document(key).set({'email': email, 'verified_at': datetime.utcnow(), 'expires_at': datetime.utcnow() + timedelta(minutes=30)})
    return jsonify({'message': 'Email verified successfully.'}), 200

@app.route("/api/auth/register", methods=["POST"])
def api_auth_register():
    data = request.form if request.form else (request.get_json(silent=True) or {})
    role = (data.get("role") or "student").strip().lower()
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""
    username = (data.get("username") or "").strip() or None
    uucms_id = (data.get("uucms_id") or "").strip() or None
    last_year_uucms_id = (data.get("last_year_uucms_id") or "").strip() or None
    branch = (data.get("branch") or "").strip() or None
    grad_year = data.get("grad_year") or None
    company = (data.get("company") or "").strip() or None
    location = (data.get("location") or "").strip() or None
    cgpa = data.get("cgpa")
    faculty_id = (data.get("faculty_id") or "").strip() or None
    department = (data.get("department") or "").strip() or None

    if not name:
        return jsonify({"error": "Full Name is required."}), 400
    if not email:
        return jsonify({"error": "Email Address is required."}), 400
    if not EMAIL_REGEX.match(email):
        return jsonify({"error": "Invalid email address format."}), 400
    verified_ref = firebase_db.get_firestore_client().collection('verified_emails').document(_email_key(email))
    verified_snap = verified_ref.get()
    verified_data = (verified_snap.to_dict() or {}) if verified_snap.exists else {}
    verified_expiry = verified_data.get('expires_at')
    if not verified_expiry or verified_expiry.replace(tzinfo=None) < datetime.utcnow():
        return jsonify({'error': 'Verify your email with the OTP before registering.'}), 403
    if not password:
        return jsonify({"error": "Password is required."}), 400

    if role not in ("student", "alumni", "faculty", "admin"):
        return jsonify({"error": "Invalid user role selected."}), 400

    # Role-specific validations
    if role in ("student", "alumni"):
        if not username:
            return jsonify({"error": f"{role.capitalize()} Username is required."}), 400
        if not uucms_id:
            return jsonify({"error": f"{role.capitalize()} UUCMS ID is required."}), 400
        if not branch:
            return jsonify({"error": f"{role.capitalize()} Branch is required."}), 400

    if role == "alumni":
        if not last_year_uucms_id:
            return jsonify({"error": "Alumni Final Year UUCMS ID is required."}), 400
        if cgpa is None or cgpa == "":
            return jsonify({"error": "CGPA is required for Alumni."}), 400
        try:
            cgpa = float(cgpa)
            if cgpa < 0 or cgpa > 10:
                return jsonify({"error": "CGPA must be between 0.0 and 10.0"}), 400
        except ValueError:
            return jsonify({"error": "CGPA must be a valid numeric score."}), 400

    if role == "faculty":
        if not faculty_id:
            return jsonify({"error": "Faculty ID is required."}), 400
        if not department:
            return jsonify({"error": "Faculty Department is required."}), 400

    # Uniqueness checks in Firestore
    if firebase_db.get_user_by_email(email):
        return jsonify({"error": "An account with this email already exists."}), 409

    if username and firebase_db.get_user_by_username(username):
        return jsonify({"error": f"{role.capitalize()} with this username already exists."}), 409

    if uucms_id and firebase_db.get_user_by_uucms_id(uucms_id):
        return jsonify({"error": f"{role.capitalize()} with this UUCMS ID already exists."}), 409

    if faculty_id and firebase_db.get_user_by_faculty_id(faculty_id):
        return jsonify({"error": "Faculty with this Faculty ID already exists."}), 409

    certificate_file = None
    if "certificate_file" in request.files:
        file = request.files["certificate_file"]
        if file and file.filename:
            allowed_exts = {".pdf", ".png", ".jpg", ".jpeg"}
            ext = os.path.splitext(file.filename)[1].lower()
            if ext in allowed_exts:
                filename = secure_filename(f"cert_{uuid.uuid4().hex[:10]}_{file.filename}")
                upload_dir = os.path.join(app.static_folder, "uploads", "certs")
                os.makedirs(upload_dir, exist_ok=True)
                file.save(os.path.join(upload_dir, filename))
                certificate_file = f"uploads/certs/{filename}"

    initial_status = "pending" if role == "alumni" else "active"
    hashed_pw = generate_password_hash(password)

    user_payload = {
        "name": name,
        "email": email,
        "password": hashed_pw,
        "role": role,
        "username": username,
        "uucms_id": uucms_id,
        "last_year_uucms_id": last_year_uucms_id,
        "cgpa": cgpa,
        "certificate_file": certificate_file,
        "faculty_id": faculty_id,
        "department": department,
        "branch": branch,
        "grad_year": int(grad_year) if grad_year else None,
        "company": company,
        "location": location,
        "status": initial_status,
        "profile_pic": None
    }

    new_id = firebase_db.create_user(user_payload)
    verified_ref.delete()

    if role == "alumni":
        return jsonify({
            "message": "Registration submitted! Your account is pending admin approval.",
            "pending": True,
            "user_id": new_id
        }), 201

    return jsonify({
        "message": "Registration successful! You may now log in.",
        "pending": False,
        "user_id": new_id
    }), 201


@app.route("/api/auth/logout", methods=["POST", "GET"])
def api_auth_logout():
    session.clear()
    return jsonify({"message": "Logged out successfully."}), 200


@app.route("/api/dashboard", methods=["GET"])
def api_dashboard():
    user = current_user()
    if not user:
        return jsonify({"error": "Authentication required"}), 401

    u_dict = dict(user)
    u_dict.pop("password", None)

    postings = firebase_db.get_postings()
    resources = firebase_db.get_resources()
    announcements = firebase_db.get_announcements()

    dashboard_data = {
        "user": u_dict,
        "postings_count": len(postings),
        "resources_count": len(resources),
        "announcements_count": len(announcements),
        "recent_postings": postings[:5],
        "recent_announcements": announcements[:5],
        "recent_resources": resources[:5]
    }

    if user.get("role") == "admin":
        all_users = firebase_db.get_all_users()
        dashboard_data["total_users"] = len(all_users)
        dashboard_data["pending_alumni_count"] = len([u for u in all_users if u.get("role") == "alumni" and u.get("status") == "pending"])
        dashboard_data["active_alumni_count"] = len([u for u in all_users if u.get("role") == "alumni" and u.get("status") == "active"])
        dashboard_data["student_count"] = len([u for u in all_users if u.get("role") == "student"])
        dashboard_data["faculty_count"] = len([u for u in all_users if u.get("role") == "faculty"])

    return jsonify(dashboard_data), 200


@app.route("/api/admin/users", methods=["GET"])
def api_admin_users():
    user = login_required(role="admin")
    if not user:
        return jsonify({"error": "Admin access required"}), 403

    all_users = firebase_db.get_all_users()
    pending = []
    active = []
    for u in all_users:
        u_dict = dict(u)
        u_dict.pop("password", None)
        if u_dict.get("role") == "alumni" and u_dict.get("status") == "pending":
            pending.append(u_dict)
        else:
            active.append(u_dict)

    return jsonify({"pending_alumni": pending, "active_users": active}), 200


@app.route("/api/admin/approve/<int:user_id>", methods=["POST"])
def api_admin_approve(user_id):
    user = login_required(role="admin")
    if not user:
        return jsonify({"error": "Admin access required"}), 403

    success = firebase_db.update_user(user_id, {"status": "active"})
    if success:
        return jsonify({"message": f"User {user_id} approved successfully."}), 200
    return jsonify({"error": "User not found."}), 404


@app.route("/api/admin/reject/<int:user_id>", methods=["POST"])
def api_admin_reject(user_id):
    user = login_required(role="admin")
    if not user:
        return jsonify({"error": "Admin access required"}), 403

    success = firebase_db.delete_user(user_id)
    if success:
        return jsonify({"message": f"User {user_id} rejected and removed."}), 200
    return jsonify({"error": "User not found."}), 404


@app.route("/api/postings", methods=["GET"])
def api_list_postings():
    type_filter = request.args.get("type")
    alumni_filter = request.args.get("alumni_id")
    aid = int(alumni_filter) if alumni_filter and alumni_filter.isdigit() else None
    postings = firebase_db.get_postings(posting_type=type_filter, alumni_id=aid)
    return jsonify(postings), 200


@app.route("/api/postings/new", methods=["POST"])
def api_new_posting():
    user = current_user()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    if user.get("role") not in ("alumni", "admin"):
        return jsonify({"error": "Only alumni or admin can create postings"}), 403

    data = request.get_json(silent=True) or request.form or {}
    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()
    ptype = (data.get("type") or "job").strip().lower()

    if not title or not description:
        return jsonify({"error": "Title and description are required"}), 400

    posting_payload = {
        "alumni_id": user["id"],
        "title": title,
        "description": description,
        "type": ptype,
        "location": (data.get("location") or "").strip() or None,
        "education": (data.get("education") or "").strip() or None,
        "experience": (data.get("experience") or "").strip() or None,
        "skills": (data.get("skills") or "").strip() or None,
        "apply_link": (data.get("apply_link") or "").strip() or None,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    new_id = firebase_db.create_posting(posting_payload)
    return jsonify({"message": "Posting created successfully", "posting_id": new_id}), 201


@app.route("/api/alumni/search", methods=["GET"])
def api_search_alumni():
    q = (request.args.get("q") or "").strip().lower()
    branch = (request.args.get("branch") or "").strip().lower()
    grad_year = request.args.get("grad_year")
    company = (request.args.get("company") or "").strip().lower()
    location = (request.args.get("location") or "").strip().lower()

    alumni = firebase_db.get_all_users(role="alumni", status="active")
    filtered = []
    for a in alumni:
        u_dict = dict(a)
        u_dict.pop("password", None)

        if q and q not in (u_dict.get("name") or "").lower() and q not in (u_dict.get("company") or "").lower():
            continue
        if branch and branch not in (u_dict.get("branch") or "").lower():
            continue
        if grad_year and str(u_dict.get("grad_year") or "") != str(grad_year):
            continue
        if company and company not in (u_dict.get("company") or "").lower():
            continue
        if location and location not in (u_dict.get("location") or "").lower():
            continue

        filtered.append(u_dict)

    return jsonify(filtered), 200


@app.route("/api/resources", methods=["GET"])
def api_list_resources():
    resources = firebase_db.get_resources()
    return jsonify(resources), 200


@app.route("/api/resources/new", methods=["POST"])
def api_new_resource():
    user = current_user()
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    if user.get("role") not in ("faculty", "admin"):
        return jsonify({"error": "Only faculty or admin can share resources"}), 403

    title = request.form.get("title") or (request.json.get("title") if request.is_json else "")
    link = request.form.get("link") or (request.json.get("link") if request.is_json else "")
    description = request.form.get("description") or (request.json.get("description") if request.is_json else "")
    file_path = None

    if "resource_file" in request.files:
        file = request.files["resource_file"]
        if file and file.filename:
            filename = secure_filename(f"res_{uuid.uuid4().hex[:8]}_{file.filename}")
            upload_dir = os.path.join(app.static_folder, "uploads")
            os.makedirs(upload_dir, exist_ok=True)
            file.save(os.path.join(upload_dir, filename))
            file_path = f"uploads/{filename}"

    if not title:
        return jsonify({"error": "Resource title is required"}), 400

    resource_data = {
        "faculty_id": user["id"],
        "title": title,
        "link": link or None,
        "file_path": file_path,
        "description": description or None
    }
    new_id = firebase_db.create_resource(resource_data)
    return jsonify({"message": "Resource shared successfully", "resource_id": new_id}), 201


@app.route("/api/announcements", methods=["GET", "POST"])
def api_announcements():
    if request.method == "POST":
        user = current_user()
        if not user:
            return jsonify({"error": "Authentication required"}), 401
        if user.get("role") not in ("admin", "faculty"):
            return jsonify({"error": "Only admin or faculty can post announcements"}), 403

        data = request.get_json(silent=True) or request.form or {}
        title = (data.get("title") or "").strip()
        content = (data.get("content") or "").strip()

        if not title or not content:
            return jsonify({"error": "Title and content are required"}), 400

        new_id = firebase_db.create_announcement({
            "posted_by": user["id"],
            "title": title,
            "content": content,
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
        return jsonify({"message": "Announcement posted", "announcement_id": new_id}), 201

    announcements = firebase_db.get_announcements()
    return jsonify(announcements), 200


@app.route("/api/messages", methods=["GET"])
def api_messages_list():
    user = current_user()
    if not user:
        return jsonify({"error": "Authentication required"}), 401

    conversations = firebase_db.get_user_conversations(user["id"])
    for conv in conversations:
        conv["partner"].pop("password", None)
    return jsonify(conversations), 200


@app.route("/api/chat/<int:other_id>", methods=["GET", "POST"])
def api_chat(other_id):
    user = current_user()
    if not user:
        return jsonify({"error": "Authentication required"}), 401

    other = firebase_db.get_user_by_id(other_id)
    if not other:
        return jsonify({"error": "Recipient user not found"}), 404

    if request.method == "POST":
        data = request.get_json(silent=True) or request.form or {}
        content = (data.get("content") or "").strip()
        if not content:
            return jsonify({"error": "Message content cannot be empty"}), 400

        msg_id = firebase_db.send_message(user["id"], other_id, content)
        return jsonify({"message": "Message sent", "message_id": msg_id}), 201

    messages = firebase_db.get_chat(user["id"], other_id)
    other_dict = dict(other)
    other_dict.pop("password", None)
    return jsonify({"partner": other_dict, "messages": messages}), 200


@app.route("/api/alumni/by-location", methods=["GET"])
def api_alumni_by_location():
    alumni = firebase_db.get_all_users(role="alumni", status="active")
    locations_map = {}
    for a in alumni:
        loc = (a.get("location") or "Unspecified").strip()
        if not loc:
            loc = "Unspecified"
        if loc not in locations_map:
            locations_map[loc] = []
        u_dict = dict(a)
        u_dict.pop("password", None)
        locations_map[loc].append(u_dict)

    result = [{"location": loc, "alumni": alum, "count": len(alum)} for loc, alum in locations_map.items()]
    result.sort(key=lambda x: x["count"], reverse=True)
    return jsonify(result), 200


@app.route("/api/profile", methods=["GET", "POST", "PUT"])
def api_profile():
    user = current_user()
    if not user:
        return jsonify({"error": "Authentication required"}), 401

    if request.method in ("PUT", "POST"):
        data = request.get_json(silent=True) or request.form or {}
        updates = {}
        for key in ["name", "branch", "grad_year", "company", "location", "department"]:
            if key in data and data[key] is not None:
                updates[key] = int(data[key]) if key == "grad_year" and data[key] else data[key]

        if updates:
            firebase_db.update_user(user["id"], updates)

        updated_user = firebase_db.get_user_by_id(user["id"])
        u_dict = dict(updated_user)
        u_dict.pop("password", None)
        return jsonify({"message": "Profile updated successfully", "user": u_dict}), 200

    u_dict = dict(user)
    u_dict.pop("password", None)
    return jsonify(u_dict), 200


@app.route("/api/profile/picture", methods=["POST"])
def api_upload_profile_picture():
    user = current_user()
    if not user:
        return jsonify({"error": "Authentication required"}), 401

    if "profile_pic" not in request.files:
        return jsonify({"error": "No profile picture provided"}), 400

    file = request.files["profile_pic"]
    if not file or not file.filename:
        return jsonify({"error": "No file selected"}), 400

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in {".png", ".jpg", ".jpeg", ".webp"}:
        return jsonify({"error": "Invalid file format. Allowed: PNG, JPG, JPEG, WEBP"}), 400

    filename = secure_filename(f"user{user['id']}_{file.filename}")
    upload_dir = os.path.join(app.static_folder, "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    file.save(os.path.join(upload_dir, filename))

    rel_path = f"uploads/{filename}"
    firebase_db.update_user(user["id"], {"profile_pic": rel_path})

    return jsonify({"message": "Profile picture updated successfully", "profile_pic": rel_path}), 200


@app.route("/api/admin/database", methods=["GET"])
def api_admin_database():
    user = login_required(role="admin")
    if not user:
        return jsonify({"error": "Admin access required"}), 403

    client = firebase_db.get_firestore_client()
    collections_data = {}
    table_names = ["users", "postings", "resources", "announcements", "messages"]
    for t in table_names:
        docs = list(client.collection(t).stream())
        rows = [d.to_dict() for d in docs]
        for r in rows:
            if "password" in r:
                r["password"] = "[PROTECTED]"
        collections_data[t] = {
            "count": len(rows),
            "rows": rows
        }

    return jsonify(collections_data), 200


# ==============================================================================
# BACKWARD-COMPATIBLE BROWSER ROUTES
# This repository ships a separate Vite SPA. Legacy Flask template pages reference
# endpoints removed during the Firestore migration, so route browsers to the SPA
# instead of rendering stale templates that raise BuildError.
# ==============================================================================

def frontend_hash_url(route="/"):
    origins = [
        value.strip().rstrip("/")
        for value in os.getenv("FRONTEND_ORIGIN", "http://localhost:5173").split(",")
        if value.strip()
    ]
    origin = origins[0] if origins else "http://localhost:5173"
    if not route.startswith("/"):
        route = "/" + route
    return f"{origin}/#{route}"


@app.route("/static/<path:filename>")
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)


@app.route("/")
def home():
    return jsonify({
        "service": "Alumni Portal API",
        "status": "running",
        "health_check": "/api/health",
    }), 200


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        response, status = api_auth_login()
        if status == 200:
            return redirect(frontend_hash_url("/dashboard"))
        return jsonify(response.get_json(silent=True) or {"error": "Login failed"}), status
    return redirect(frontend_hash_url("/login"))


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        response, status = api_auth_register()
        if status in (200, 201):
            return redirect(frontend_hash_url("/login"))
        return jsonify(response.get_json(silent=True) or {"error": "Registration failed"}), status
    return redirect(frontend_hash_url("/register"))


@app.route("/logout", methods=["GET", "POST"])
def logout():
    session.clear()
    return redirect(frontend_hash_url("/"))


@app.route("/dashboard")
def dashboard():
    # Authorization is enforced by the API; the SPA checks its current session.
    return redirect(frontend_hash_url("/dashboard"))


if __name__ == "__main__":
    host = os.getenv("BACKEND_HOST", "0.0.0.0")
    port = int(os.getenv("PORT", os.getenv("BACKEND_PORT", "5000")))
    print(f"Starting Alumni Portal Backend on http://{host}:{port} (Firebase Firestore backend)")
    app.run(host=host, port=port, debug=not IS_PRODUCTION)
