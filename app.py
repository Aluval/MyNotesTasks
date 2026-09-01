# ============================================================
# MyNotes & Tasks
# Flask Backend
#
# Features:
# - MongoDB Atlas
# - Signup
# - Gmail verification
# - Login / Logout
# - Forgot password
# - Reset password
# - Notes
# - Tasks
# - Checklists
# - Upcoming tasks
# - Activity logs
# - Profile
# - Password change
# ============================================================

import os,re
import json
import secrets
import base64
import smtplib
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from functools import wraps
import threading
import time
from bson import ObjectId
from dotenv import load_dotenv
from flask import (
    Flask,
    jsonify,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from flask_pymongo import PyMongo
from werkzeug.security import check_password_hash, generate_password_hash

from zoneinfo import ZoneInfo

from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from werkzeug.middleware.proxy_fix import ProxyFix

GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/calendar.events"
]

# ============================================================
# BASE DIRECTORY
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

GOOGLE_CLIENT_SECRET_FILE = os.path.join(
    BASE_DIR,
    "credentials",
    "client_secret.json"
)


def get_google_client_config():

    google_client_json = os.getenv(
        "GOOGLE_CLIENT_SECRET_JSON"
    )

    # --------------------------------------------------------
    # RENDER / PRODUCTION
    # --------------------------------------------------------

    if google_client_json:

        try:

            return json.loads(
                google_client_json
            )

        except json.JSONDecodeError as error:

            raise RuntimeError(
                "GOOGLE_CLIENT_SECRET_JSON contains invalid JSON."
            ) from error

    # --------------------------------------------------------
    # LOCAL DEVELOPMENT
    # --------------------------------------------------------

    if os.path.exists(
        GOOGLE_CLIENT_SECRET_FILE
    ):

        with open(
            GOOGLE_CLIENT_SECRET_FILE,
            "r",
            encoding="utf-8"
        ) as file:

            return json.load(file)

    raise FileNotFoundError(
        "Google OAuth credentials not found. "
        "Set GOOGLE_CLIENT_SECRET_JSON in the environment "
        "or provide credentials/client_secret.json locally."
    )

# ============================================================
# GOOGLE OAUTH - LOCAL DEVELOPMENT
# ============================================================

os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

# ============================================================
# LOAD ENVIRONMENT
# ============================================================

load_dotenv()


# ============================================================
# APP
# ============================================================

app = Flask(__name__)

app.wsgi_app = ProxyFix(
    app.wsgi_app,
    x_proto=1,
    x_host=1
)

app.config["SECRET_KEY"] = os.getenv(
    "SECRET_KEY",
    "change-this-secret"
)

app.config.update(
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax"
)


app.config["MONGO_URI"] = os.getenv(
    "MONGO_URI",
    "mongodb://127.0.0.1:27017/notes_tasks_app"
)

mongo = PyMongo(app)


# ============================================================
# CONFIGURATION
# ============================================================

MAIL_HOST = os.getenv(
    "MAIL_HOST",
    "smtp.gmail.com"
)

MAIL_PORT = int(
    os.getenv(
        "MAIL_PORT",
        "587"
    )
)

MAIL_USERNAME = os.getenv(
    "MAIL_USERNAME",
    ""
)

MAIL_PASSWORD = os.getenv(
    "MAIL_PASSWORD",
    ""
)

MAIL_FROM_NAME = os.getenv(
    "MAIL_FROM_NAME",
    "MyNotes & Tasks"
)

APP_BASE_URL = os.getenv(
    "APP_BASE_URL",
    "http://127.0.0.1:5000"
)


VERIFICATION_EXPIRY_MINUTES = int(
    os.getenv(
        "VERIFICATION_EXPIRY_MINUTES",
        "15"
    )
)


RESET_EXPIRY_MINUTES = int(
    os.getenv(
        "RESET_EXPIRY_MINUTES",
        "15"
    )
)


# ============================================================
# DATABASE COLLECTIONS
# ============================================================

users_collection = mongo.db.users

notes_collection = mongo.db.notes

tasks_collection = mongo.db.tasks

logs_collection = mongo.db.logs

google_oauth_collection = mongo.db.google_oauth_states
# ============================================================
# TIME HELPERS
# ============================================================

def utc_now():
    """
    Return timezone-aware UTC datetime.
    """
    return datetime.now(timezone.utc)


def utc_now_naive():
    """
    MongoDB-friendly UTC datetime.
    """
    return datetime.utcnow()


# ============================================================
# OBJECT ID HELPERS
# ============================================================

def object_id(value):
    """
    Safely convert a string into ObjectId.
    """

    try:
        return ObjectId(str(value))

    except Exception:
        return None


# ============================================================
# SERIALIZATION
# ============================================================

def serialize_document(document):
    """
    Convert MongoDB ObjectId and datetime values
    into JSON-safe values.
    """

    if not document:
        return None

    result = {}

    for key, value in document.items():

        if key == "_id":

            result["id"] = str(value)

        elif isinstance(value, ObjectId):

            result[key] = str(value)

        elif isinstance(value, datetime):

            if value.tzinfo is None:

                value = value.replace(
                    tzinfo=timezone.utc
                )

            result[key] = value.isoformat()

        elif isinstance(value, list):

            result[key] = [
                serialize_value(item)
                for item in value
            ]

        elif isinstance(value, dict):

            result[key] = {
                k: serialize_value(v)
                for k, v in value.items()
            }

        else:

            result[key] = value

    return result


def serialize_value(value):

    if isinstance(value, ObjectId):

        return str(value)

    if isinstance(value, datetime):

        if value.tzinfo is None:

            value = value.replace(
                tzinfo=timezone.utc
            )

        return value.isoformat()

    if isinstance(value, list):

        return [
            serialize_value(item)
            for item in value
        ]

    if isinstance(value, dict):

        return {
            key: serialize_value(val)
            for key, val in value.items()
        }

    return value


# ============================================================
# CURRENT USER
# ============================================================

def get_current_user():

    user_id = session.get(
        "user_id"
    )

    if not user_id:

        return None

    oid = object_id(
        user_id
    )

    if not oid:

        session.clear()

        return None

    user = users_collection.find_one(
        {
            "_id": oid
        }
    )

    return user


# ============================================================
# LOGIN REQUIRED
# ============================================================

def login_required(function):

    @wraps(function)
    def decorated(*args, **kwargs):

        user = get_current_user()

        if not user:

            return jsonify(
                {
                    "ok": False,
                    "message": "Authentication required."
                }
            ), 401

        return function(
            *args,
            **kwargs
        )

    return decorated


# ============================================================
# EMAIL VALIDATION
# ============================================================

def valid_email(email):

    if not email:
        return False

    email = email.strip().lower()

    if len(email) > 254:
        return False

    if "@" not in email:
        return False

    parts = email.split("@")

    if len(parts) != 2:
        return False

    username, domain = parts

    if not username or not domain:
        return False

    if "." not in domain:
        return False

    return True


# ============================================================
# PASSWORD VALIDATION
# ============================================================

def valid_password(password):

    if not password:
        return False

    if len(password) < 8:
        return False

    if not any(
        char.isupper()
        for char in password
    ):
        return False

    if not any(
        char.islower()
        for char in password
    ):
        return False

    if not any(
        char.isdigit()
        for char in password
    ):
        return False

    return True


# ============================================================
# RANDOM CODE
# ============================================================

def generate_code():

    return str(
        secrets.randbelow(
            900000
        ) + 100000
    )


# ============================================================
# EMAIL SENDER
# ============================================================

def send_email(
    recipient,
    subject,
    body
):

    print("\n========== EMAIL DEBUG ==========")
    print("Recipient:", recipient)
    print("Subject:", subject)
    print("Body:", body)
    print("MAIL_USERNAME:", MAIL_USERNAME)
    print("MAIL_PASSWORD configured:", bool(MAIL_PASSWORD))
    print("MAIL_HOST:", MAIL_HOST)
    print("MAIL_PORT:", MAIL_PORT)
    print("=================================\n")

    if not MAIL_USERNAME or not MAIL_PASSWORD:

        print(
            "\n================================================"
        )

        print(
            "EMAIL CONFIGURATION MISSING"
        )

        print(
            f"To: {recipient}"
        )

        print(
            f"Subject: {subject}"
        )

        print(
            body
        )

        print(
            "================================================\n"
        )

        return False


    try:

        message = EmailMessage()

        message["Subject"] = subject

        message["From"] = (
            f"{MAIL_FROM_NAME} "
            f"<{MAIL_USERNAME}>"
        )

        message["To"] = recipient

        message.set_content(
            body
        )


        with smtplib.SMTP(
            MAIL_HOST,
            MAIL_PORT
        ) as server:

            server.starttls()

            server.login(
                MAIL_USERNAME,
                MAIL_PASSWORD
            )

            server.send_message(
                message
            )


        return True


    except Exception as error:

        print(
            "Email sending error:",
            error
        )

        return False


# ============================================================
# ACTIVITY LOG
# ============================================================

def create_log(
    user_id,
    action,
    log_type,
    title="",
    description="",
    task_id=None,
    note_id=None,
    category=""
):

    log = {

        "user_id":
            object_id(user_id),

        "action":
            action,

        "type":
            log_type,

        "title":
            title,

        "description":
            description,

        "task_id":
            object_id(task_id)
            if task_id
            else None,

        "note_id":
            object_id(note_id)
            if note_id
            else None,

        "category":
            category or "",

        "created_at":
            utc_now_naive()

    }


    logs_collection.insert_one(
        log
    )



# ============================================================
# PAGE ROUTES
# ============================================================

@app.route("/")
def home():

    if session.get("user_id"):

        return redirect(
            url_for(
                "dashboard_page"
            )
        )

    return render_template(
        "index.html"
    )


@app.route("/signup")
def signup_page():

    return render_template(
        "signup.html"
    )


@app.route("/login")
def login_page():

    return render_template(
        "login.html"
    )


@app.route("/verify-email")
def verify_email_page():

    return render_template(
        "verify-email.html"
    )


@app.route("/forgot-password")
def forgot_password_page():

    return render_template(
        "forgot-password.html"
    )


# ============================================================
# PAGE LOGIN DECORATOR
# ============================================================

def login_required_page(function):

    @wraps(function)
    def decorated(*args, **kwargs):

        if not get_current_user():

            return redirect(
                url_for(
                    "login_page"
                )
            )

        return function(
            *args,
            **kwargs
        )

    return decorated


@app.route("/reset-password")
def reset_password_page():

    return render_template(
        "reset-password.html"
    )


@app.route("/dashboard")
@login_required
def dashboard_page():

    return render_template(
        "dashboard.html"
    )


@app.route("/notes")
@login_required
def notes_page():

    return render_template(
        "notes.html"
    )


@app.route("/tasks")
@login_required
def tasks_page():

    return render_template(
        "tasks.html"
    )


@app.route("/upcoming")
@login_required
def upcoming_page():

    return render_template(
        "upcoming.html"
    )


@app.route("/logs")
@login_required_page
def logs_page():

    return render_template(
        "logs.html"
    )


@app.route("/profile")
@login_required_page
def profile_page():

    return render_template(
        "profile.html"
    )


# ============================================================
# PAGE LOGIN DECORATOR
# ============================================================

def login_required_page(function):

    @wraps(function)
    def decorated(*args, **kwargs):

        if not get_current_user():

            return redirect(
                url_for(
                    "login_page"
                )
            )

        return function(
            *args,
            **kwargs
        )

    return decorated


# ============================================================
# AUTH - SIGNUP
# ============================================================

@app.route(
    "/api/auth/signup",
    methods=["POST"]
)
def signup():

    data = request.get_json(
        silent=True
    ) or {}


    name = str(
        data.get(
            "name",
            ""
        )
    ).strip()


    email = str(
        data.get(
            "email",
            ""
        )
    ).strip().lower()


    password = data.get(
        "password",
        ""
    )


    username = str(
        data.get(
            "username",
            ""
        )
    ).strip().lower()


    if len(name) < 2:

        return jsonify(
            {
                "ok": False,
                "message":
                    "Name must contain at least 2 characters."
            }
        ), 400


    if not valid_email(
        email
    ):

        return jsonify(
            {
                "ok": False,
                "message":
                    "Invalid email address."
            }
        ), 400


    if not valid_password(
        password
    ):

        return jsonify(
            {
                "ok": False,
                "message":
                    "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number."
            }
        ), 400


    existing = users_collection.find_one(
        {
            "email": email
        }
    )


    if existing:

        if existing.get(
            "email_verified",
            False
        ):

            return jsonify(
                {
                    "ok": False,
                    "message":
                        "An account with this email already exists."
                }
            ), 409


        code = generate_code()


        users_collection.update_one(

            {
                "_id":
                    existing["_id"]
            },

            {
                "$set": {

                    "verification_code":
                        code,

                    "verification_expires":
                        utc_now_naive()
                        + timedelta(
                            minutes=
                                VERIFICATION_EXPIRY_MINUTES
                        ),

                    "name":
                        name,

                    "password":
                        generate_password_hash(
                            password
                        )

                }

            }

        )


        send_verification_email(
            email,
            code
        )


        return jsonify(
            {
                "ok": True,
                "message":
                    "Verification code sent."
            }
        )


    code = generate_code()


    user = {

        "name":
            name,

        "email":
            email,

        "username":
            username,

        "password":
            generate_password_hash(
                password
            ),

        "email_verified":
            False,

        "verification_code":
            code,

        "verification_expires":
            utc_now_naive()
            + timedelta(
                minutes=
                    VERIFICATION_EXPIRY_MINUTES
            ),

        "reset_code":
            None,

        "reset_expires":
            None,

        "phone":
            "",

        "bio":
            "",

        "timezone":
            "Asia/Kolkata",

        "date_format":
            "DD/MM/YYYY",

        "theme":
            "system",

        "profile_photo":
            None,

        "created_at":
            utc_now_naive(),

        "updated_at":
            utc_now_naive()

    }


    result = users_collection.insert_one(
        user
    )


    send_verification_email(
        email,
        code
    )


    return jsonify(
        {
            "ok": True,
            "message":
                "Account created. Verification code sent.",
            "user_id":
                str(result.inserted_id)
        }
    ), 201


# ============================================================
# SEND VERIFICATION EMAIL
# ============================================================

def send_verification_email(
    email,
    code
):

    subject = (
        "Verify your MyNotes & Tasks account"
    )


    body = f"""
Hello,

Thank you for creating your MyNotes & Tasks account.

Your email verification code is:

{code}

This code will expire in
{VERIFICATION_EXPIRY_MINUTES} minutes.

If you did not create this account,
you can safely ignore this email.

Regards,
{MAIL_FROM_NAME}
"""


    return send_email(
        email,
        subject,
        body
    )


# ============================================================
# VERIFY EMAIL
# ============================================================

@app.route(
    "/api/auth/verify-email",
    methods=["POST"]
)
def verify_email():

    data = request.get_json(
        silent=True
    ) or {}


    email = str(
        data.get(
            "email",
            ""
        )
    ).strip().lower()


    code = str(
        data.get(
            "code",
            ""
        )
    ).strip()


    user = users_collection.find_one(
        {
            "email": email
        }
    )


    if not user:

        return jsonify(
            {
                "ok": False,
                "message":
                    "Invalid verification request."
            }
        ), 400


    if user.get(
        "email_verified",
        False
    ):

        return jsonify(
            {
                "ok": True,
                "message":
                    "Email is already verified."
            }
        )


    expires = user.get(
        "verification_expires"
    )


    if (
        not expires
        or
        expires < utc_now_naive()
    ):

        return jsonify(
            {
                "ok": False,
                "message":
                    "Verification code has expired."
            }
        ), 400


    if (
        str(
            user.get(
                "verification_code",
                ""
            )
        )
        != code
    ):

        return jsonify(
            {
                "ok": False,
                "message":
                    "Invalid verification code."
            }
        ), 400


    users_collection.update_one(

        {
            "_id":
                user["_id"]
        },

        {
            "$set": {

                "email_verified":
                    True,

                "updated_at":
                    utc_now_naive()

            },

            "$unset": {

                "verification_code":
                    "",

                "verification_expires":
                    ""

            }

        }

    )


    create_log(

        str(
            user["_id"]
        ),

        "verified",

        "account",

        "Email verified",

        "Email address verified successfully."

    )


    return jsonify(
        {
            "ok": True,
            "message":
                "Email verified successfully."
        }
    )


# ============================================================
# RESEND VERIFICATION
# ============================================================

@app.route(
    "/api/auth/resend-verification",
    methods=["POST"]
)
def resend_verification():

    data = request.get_json(
        silent=True
    ) or {}


    email = str(
        data.get(
            "email",
            ""
        )
    ).strip().lower()


    user = users_collection.find_one(
        {
            "email": email
        }
    )


    if not user:

        return jsonify(
            {
                "ok": True,
                "message":
                    "If the account exists, a code has been sent."
            }
        )


    if user.get(
        "email_verified",
        False
    ):

        return jsonify(
            {
                "ok": False,
                "message":
                    "Email is already verified."
            }
        ), 400


    code = generate_code()


    users_collection.update_one(

        {
            "_id":
                user["_id"]
        },

        {
            "$set": {

                "verification_code":
                    code,

                "verification_expires":
                    utc_now_naive()
                    + timedelta(
                        minutes=
                            VERIFICATION_EXPIRY_MINUTES
                    )

            }

        }

    )


    send_verification_email(
        email,
        code
    )


    return jsonify(
        {
            "ok": True,
            "message":
                "Verification code sent."
        }
    )


# ============================================================
# LOGIN
# ============================================================

@app.route(
    "/api/auth/login",
    methods=["POST"]
)
def login():

    data = request.get_json(
        silent=True
    ) or {}

    # --------------------------------------------------------
    # GET LOGIN VALUE
    # Supports:
    #   Email
    #   Username
    # --------------------------------------------------------

    login_value = str(
        data.get(
            "login",
            data.get(
                "email",
                ""
            )
        )
    ).strip()

    password = data.get(
        "password",
        ""
    )

    remember = bool(
        data.get(
            "remember",
            False
        )
    )

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if not login_value:

        return jsonify(
            {
                "ok": False,
                "message":
                    "Email or username is required."
            }
        ), 400


    if not password:

        return jsonify(
            {
                "ok": False,
                "message":
                    "Password is required."
            }
        ), 400

    # --------------------------------------------------------
    # FIND USER
    #
    # If input contains @
    # → search email
    #
    # Otherwise
    # → search username
    # --------------------------------------------------------

    if "@" in login_value:

        user = users_collection.find_one(
            {
                "email": login_value.lower()
            }
        )

    else:

        user = users_collection.find_one(
            {
                "username": {
                    "$regex": f"^{re.escape(login_value)}$",
                    "$options": "i"
                }
            }
        )

    # --------------------------------------------------------
    # USER NOT FOUND
    # --------------------------------------------------------

    if not user:

        return jsonify(
            {
                "ok": False,
                "message":
                    "Invalid email or password."
            }
        ), 401

    # --------------------------------------------------------
    # CHECK PASSWORD
    # --------------------------------------------------------

    stored_password = user.get(
        "password",
        ""
    )


    if not check_password_hash(
        stored_password,
        password
    ):

        return jsonify(
            {
                "ok": False,
                "message":
                    "Invalid email or password."
            }
        ), 401


    # --------------------------------------------------------
    # CHECK EMAIL VERIFICATION
    # --------------------------------------------------------

    if not user.get(
        "email_verified",
        False
    ):

        return jsonify(
            {
                "ok": False,

                "message":
                    "Please verify your email first.",

                "requires_verification":
                    True,

                "email_not_verified":
                    True,

                "email":
                    user.get(
                        "email",
                        ""
                    )
            }
        ), 403


    # --------------------------------------------------------
    # CREATE LOGIN SESSION
    # --------------------------------------------------------

    session.clear()


    session["user_id"] = str(
        user["_id"]
    )


    session.permanent = remember


    # --------------------------------------------------------
    # CREATE LOG
    # --------------------------------------------------------

    create_log(

        str(
            user["_id"]
        ),

        "login",

        "account",

        "Logged in",

        "User logged into the application."

    )


    # --------------------------------------------------------
    # SUCCESS
    # --------------------------------------------------------

    return jsonify(
        {
            "ok": True,

            "message":
                "Login successful.",

            "redirect":
                "/dashboard",

            "user":
                serialize_document(
                    user
                )
        }
    )

# ============================================================
# LOGOUT
# ============================================================

@app.route(
    "/api/auth/logout",
    methods=["POST"]
)
def logout():

    user = get_current_user()


    if user:

        create_log(

            str(
                user["_id"]
            ),

            "logout",

            "account",

            "Logged out",

            "User logged out of the application."

        )


    session.clear()


    return jsonify(
        {
            "ok": True,
            "message":
                "Logged out successfully."
        }
    )


# ============================================================
# CURRENT USER
# ============================================================

@app.route(
    "/api/auth/me",
    methods=["GET"]
)
@login_required
def current_user_api():

    user = get_current_user()


    return jsonify(
        {
            "ok": True,
            "user":
                serialize_document(
                    user
                )
        }
    )


# ============================================================
# FORGOT PASSWORD
# ============================================================

@app.route(
    "/api/auth/forgot-password",
    methods=["POST"]
)
def forgot_password():

    data = request.get_json(
        silent=True
    ) or {}


    email = str(
        data.get(
            "email",
            ""
        )
    ).strip().lower()


    user = users_collection.find_one(
        {
            "email": email
        }
    )


    # Generic response prevents email enumeration.


    if not user:

        return jsonify(
            {
                "ok": True,
                "message":
                    "If an account exists for this email, a reset code has been sent."
            }
        )


    code = generate_code()


    users_collection.update_one(

        {
            "_id":
                user["_id"]
        },

        {
            "$set": {

                "reset_code":
                    code,

                "reset_expires":
                    utc_now_naive()
                    + timedelta(
                        minutes=
                            RESET_EXPIRY_MINUTES
                    )

            }

        }

    )


    send_password_reset_email(
        email,
        code
    )


    return jsonify(
        {
            "ok": True,
            "message":
                "If an account exists for this email, a reset code has been sent."
        }
    )


# ============================================================
# PASSWORD RESET EMAIL
# ============================================================

def send_password_reset_email(
    email,
    code
):

    subject = (
        "Reset your MyNotes & Tasks password"
    )


    body = f"""
Hello,

We received a request to reset your
MyNotes & Tasks password.

Your password reset code is:

{code}

This code expires in
{RESET_EXPIRY_MINUTES} minutes.

If you did not request this,
you can safely ignore this email.

Regards,
{MAIL_FROM_NAME}
"""


    return send_email(
        email,
        subject,
        body
    )


# ============================================================
# RESET PASSWORD
# ============================================================

@app.route(
    "/api/auth/reset-password",
    methods=["POST"]
)
def reset_password():

    data = request.get_json(
        silent=True
    ) or {}


    email = str(
        data.get(
            "email",
            ""
        )
    ).strip().lower()


    code = str(
        data.get(
            "code",
            ""
        )
    ).strip()


    new_password = data.get(
        "new_password",
        ""
    )


    if not valid_password(
        new_password
    ):

        return jsonify(
            {
                "ok": False,
                "message":
                    "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number."
            }
        ), 400


    user = users_collection.find_one(
        {
            "email": email
        }
    )


    if not user:

        return jsonify(
            {
                "ok": False,
                "message":
                    "Invalid or expired reset code."
            }
        ), 400


    expires = user.get(
        "reset_expires"
    )


    if (
        not expires
        or
        expires < utc_now_naive()
    ):

        return jsonify(
            {
                "ok": False,
                "message":
                    "Reset code has expired."
            }
        ), 400


    if (
        str(
            user.get(
                "reset_code",
                ""
            )
        )
        != code
    ):

        return jsonify(
            {
                "ok": False,
                "message":
                    "Invalid reset code."
            }
        ), 400


    users_collection.update_one(

        {
            "_id":
                user["_id"]
        },

        {
            "$set": {

                "password":
                    generate_password_hash(
                        new_password
                    ),

                "updated_at":
                    utc_now_naive()

            },

            "$unset": {

                "reset_code":
                    "",

                "reset_expires":
                    ""

            }

        }

    )


    create_log(

        str(
            user["_id"]
        ),

        "password_reset",

        "account",

        "Password reset",

        "Password was successfully reset."

    )


    return jsonify(
        {
            "ok": True,
            "message":
                "Password reset successfully."
        }
    )


# ============================================================
# CHANGE PASSWORD
# ============================================================

@app.route(
    "/api/auth/change-password",
    methods=["POST"]
)
@login_required
def change_password():

    data = request.get_json(
        silent=True
    ) or {}


    current_password = data.get(
        "current_password",
        ""
    )


    new_password = data.get(
        "new_password",
        ""
    )


    user = get_current_user()


    if not check_password_hash(

        user.get(
            "password",
            ""
        ),

        current_password

    ):

        return jsonify(
            {
                "ok": False,
                "message":
                    "Current password is incorrect."
            }
        ), 400


    if not valid_password(
        new_password
    ):

        return jsonify(
            {
                "ok": False,
                "message":
                    "New password does not meet the requirements."
            }
        ), 400


    users_collection.update_one(

        {
            "_id":
                user["_id"]
        },

        {
            "$set": {

                "password":
                    generate_password_hash(
                        new_password
                    ),

                "updated_at":
                    utc_now_naive()

            }

        }

    )


    create_log(

        str(
            user["_id"]
        ),

        "password_changed",

        "account",

        "Password changed",

        "User changed their password."

    )


    return jsonify(
        {
            "ok": True,
            "message":
                "Password changed successfully."
        }
    )


# ============================================================
# PROFILE
# ============================================================

@app.route(
    "/api/profile",
    methods=["PUT"]
)
@login_required
def update_profile():

    user = get_current_user()

    data = request.get_json(silent=True) or {}

    name = str(
        data.get(
            "name",
            user.get(
                "name",
                ""
            )
        )
    ).strip()

    phone = str(
        data.get(
            "phone",
            ""
        )
    ).strip()

    bio = str(
        data.get(
            "bio",
            ""
        )
    ).strip()

    timezone_name = str(
        data.get(
            "timezone",
            user.get(
                "timezone",
                "Asia/Kolkata"
            )
        )
    ).strip()

    date_format = str(
        data.get(
            "date_format",
            "DD/MM/YYYY"
        )
    )

    theme = str(
        data.get(
            "theme",
            "system"
        )
    )


    if len(name) < 2:

        return jsonify(
            {
                "ok": False,
                "message":
                    "Name is too short."
            }
        ), 400


    if len(name) > 100:

        return jsonify(
            {
                "ok": False,
                "message":
                    "Name is too long."
            }
        ), 400


    if len(bio) > 500:

        return jsonify(
            {
                "ok": False,
                "message":
                    "Bio is too long."
            }
        ), 400


    users_collection.update_one(

        {
            "_id":
                user["_id"]
        },

        {
            "$set": {

                "name":
                    name,

                "phone":
                    phone,

                "bio":
                    bio,

                "timezone":
                    timezone_name,

                "date_format":
                    date_format,

                "theme":
                    theme,

                "updated_at":
                    utc_now_naive()

            }

        }

    )


    updated = users_collection.find_one(
        {
            "_id":
                user["_id"]
        }
    )


    create_log(

        str(
            user["_id"]
        ),

        "updated",

        "profile",

        "Profile updated",

        "Profile information was updated."

    )


    return jsonify(
        {
            "ok": True,
            "message":
                "Profile updated successfully.",
            "user":
                serialize_document(
                    updated
                )
        }
    )


# ============================================================
# DASHBOARD STATS
# ============================================================

@app.route(
    "/api/dashboard/stats",
    methods=["GET"]
)
@login_required
def dashboard_stats():

    user = get_current_user()

    user_id = user["_id"]

    total_tasks = tasks_collection.count_documents(
        {
            "user_id": user_id
        }
    )

    completed_tasks = tasks_collection.count_documents(
        {
            "user_id": user_id,
            "completed": True
        }
    )

    pending_tasks = tasks_collection.count_documents(
        {
            "user_id": user_id,
            "completed": {
                "$ne": True
            }
        }
    )

    total_notes = notes_collection.count_documents(
        {
            "user_id": user_id
        }
    )

    overdue_tasks = tasks_collection.count_documents(
        {
            "user_id": user_id,
            "completed": {
                "$ne": True
            },
            "due_date": {
                "$lt": utc_now_naive().strftime("%Y-%m-%d")
            }
        }
    )


    return jsonify(
        {
            "ok": True,

            "stats": {

                "total_tasks":
                    total_tasks,

                "completed_tasks":
                    completed_tasks,

                "pending_tasks":
                    pending_tasks,

                "total_notes":
                    total_notes,

                "overdue_tasks":
                    overdue_tasks

            }

        }
    )


# ============================================================
# TASKS - LIST
# ============================================================

@app.route(
    "/api/tasks",
    methods=["GET"]
)
@login_required
def get_tasks():

    user = get_current_user()

    print(
        "TASKS API USER ID:",
        user.get("_id")
    )

    tasks = list(
        tasks_collection.find(
            {
                "user_id": user["_id"]
            }
        ).sort(
            [
                (
                    "completed",
                    1
                ),

                (
                    "due_date",
                    1
                ),

                (
                    "due_time",
                    1
                ),

                (
                    "created_at",
                    -1
                )
            ]
        )
    )

    print(
        "TASKS API COUNT:",
        len(tasks)
    )

    return jsonify(
        {
            "ok": True,

            "tasks": [

                serialize_document(
                    task
                )

                for task in tasks

            ]

        }
    )


# ============================================================
# TASKS - CREATE
# ============================================================

@app.route(
    "/api/tasks",
    methods=["POST"]
)
@login_required
def create_task():

    user = get_current_user()

    data = request.get_json(silent=True) or {}

    title = str(data.get("title", "")).strip()

    description = str(data.get("description", "")).strip()

    due_date = data.get("due_date")

    due_time = data.get("due_time")

    priority = str(data.get("priority", "medium")).lower()

    category = str(data.get("category", "general")).strip().lower()

    checklist = data.get("checklist", [])

    reminder = bool(
        data.get(
            "reminder",
            False
        )
    )

    google_calendar = bool(
        data.get(
            "google_calendar",
            False
       )
    )


    if not title:

        return jsonify(
            {
                "ok": False,
                "message":
                    "Task title is required."
            }
        ), 400


    if priority not in [
        "low",
        "medium",
        "high"
    ]:

        priority = "medium"


    cleaned_checklist = []


    if isinstance(
        checklist,
        list
    ):

        for item in checklist:

            if not isinstance(
                item,
                dict
            ):

                continue


            text = str(
                item.get(
                    "text",
                    ""
                )
            ).strip()


            if not text:

                continue


            cleaned_checklist.append(

                {

                    "id":
                        secrets.token_hex(
                            8
                        ),

                    "text":
                        text,

                    "completed":
                        bool(
                            item.get(
                                "completed",
                                False
                            )
                        )

                }

            )


    now = utc_now_naive()

    task = {

        "user_id":
            user["_id"],

        "title":
            title,

        "description":
            description,

        "due_date":
            due_date,

        "due_time":
            due_time,

        "priority":
            priority,

        "category":
            category,

        "checklist":
            cleaned_checklist,

        "reminder":
            reminder,

        "reminder_sent":
            False,

        "google_calendar":
            google_calendar,

        "google_calendar_event_id":
            None,

        "completed":
            False,

        "status":
            "pending",

        "completed_at":
            None,

        "created_at":
            now,

        "updated_at":
            now

    }

    result = tasks_collection.insert_one(
        task
    )

    # ============================================================
    # CREATE GOOGLE CALENDAR EVENT
    # ============================================================

    if google_calendar:

        event_id = create_google_calendar_event(

            user=user,

            title=title,

            description=description,

            due_date=due_date,

            due_time=due_time,
   
            priority=priority,

            category=category

        )

        if event_id:

            tasks_collection.update_one(

                {
                    "_id":
                        result.inserted_id
                },

                {
                    "$set": {

                        "google_calendar_event_id":
                            event_id,

                        "updated_at":
                            utc_now_naive()

                }

                }    

        )

    create_log(
        str(
            user["_id"]
       ),
       "created",
       "task",
        title,
        description,
        task_id=str(
            result.inserted_id
        ),
        category=category
    )

    created = tasks_collection.find_one(
        {
            "_id":
                result.inserted_id
        }
    )

    return jsonify(
        {
            "ok": True,
            "message":
                "Task created successfully.",
            "task":
                serialize_document(
                    created
                )
        }
    ), 201


# ============================================================
# TASKS - UPDATE
# ============================================================

@app.route(
    "/api/tasks/<task_id>",
    methods=["PUT"]
)
@login_required
def update_task(
    task_id
):

    user = get_current_user()


    oid = object_id(
        task_id
    )


    if not oid:

        return jsonify(
            {
                "ok": False,
                "message":
                    "Invalid task ID."
            }
        ), 400


    task = tasks_collection.find_one(
        {
            "_id":
                oid,

            "user_id":
                user["_id"]
        }
    )


    if not task:

        return jsonify(
            {
                "ok": False,
                "message":
                    "Task not found."
            }
        ), 404


    data = request.get_json(
        silent=True
    ) or {}


    title = str(
        data.get(
            "title",
            task.get(
                "title",
                ""
            )
        )
    ).strip()


    description = str(
        data.get(
            "description",
            task.get(
                "description",
                ""
            )
        )
    ).strip()


    priority = str(
        data.get(
            "priority",
            task.get(
                "priority",
                "medium"
            )
        )
    ).lower()


    category = str(
        data.get(
            "category",
            task.get(
                "category",
                "general"
            )
        )
    ).strip().lower()


    due_date = data.get(
        "due_date",
        task.get(
            "due_date"
        )
    )


    due_time = data.get(
        "due_time",
        task.get(
            "due_time"
        )
    )


    checklist = data.get(
        "checklist",
        task.get(
            "checklist",
            []
        )
    )

    reminder = bool(
        data.get(
            "reminder",
            task.get(
                "reminder",
                False
            )
        )
    )

    google_calendar = bool(
        data.get(
            "google_calendar",
            task.get(
                "google_calendar",
                False
            )
        )
    )




    if priority not in [
        "low",
        "medium",
        "high"
    ]:

        priority = "medium"


    cleaned_checklist = []


    if isinstance(
        checklist,
        list
    ):

        for item in checklist:

            if not isinstance(
                item,
                dict
            ):

                continue


            text = str(
                item.get(
                    "text",
                    ""
                )
            ).strip()


            if not text:

                continue


            cleaned_checklist.append(

                {

                    "id":
                        item.get(
                            "id"
                        )
                        or
                        secrets.token_hex(
                            8
                        ),

                    "text":
                        text,

                    "completed":
                        bool(
                            item.get(
                                "completed",
                                False
                            )
                        )

                }

            )


    tasks_collection.update_one(

        {
            "_id":
                oid
        },

        {
            "$set": {

                "title":
                    title,

                "description":
                    description,

                "due_date":
                    due_date,

                "due_time":
                    due_time,

                "priority":
                    priority,

                "category":
                    category,

                "checklist":
                    cleaned_checklist,

                "reminder":
                    reminder,

                "google_calendar":
                    google_calendar,

                "reminder_sent":
                    False,

                "updated_at":
                    utc_now_naive()

            }

        }

    )


    create_log(

        str(
            user["_id"]
        ),

        "updated",

        "task",

        title,

        "Task details were updated.",

        task_id=
            task_id,

        category=category

    )

    updated = tasks_collection.find_one({"_id": oid})


    return jsonify(
        {
            "ok": True,
            "message":
                "Task updated successfully.",
            "task":
                serialize_document(
                    updated
                )
        }
    )


# ============================================================
# TASKS - COMPLETE / PATCH
# ============================================================

@app.route(
    "/api/tasks/<task_id>",
    methods=["PATCH"]
)
@login_required
def patch_task(
    task_id
):

    user = get_current_user()



    oid = object_id(
            task_id
        )


    if not oid:

        return jsonify(
            {
                "ok": False,
                "message":
                    "Invalid task ID."
            }
        ), 400



    task = tasks_collection.find_one(
            {
                "_id":
                    oid,

                "user_id":
                    user["_id"]
            }
        )


    if not task:

        return jsonify(
            {
                "ok": False,
                "message":
                    "Task not found."
            }
        ), 404


    data = request.get_json(
            silent=True
        ) or {}


    update = {}


    if "completed" in data:

        completed = bool(data["completed"])

        update["completed"] = completed
        update["status"] = "completed" if completed else "pending"
        update["completed_at"] = utc_now_naive() if completed else None


    if "status" in data:

        update["status"] = str(data["status"])


    if update:

        update[
            "updated_at"
        ] = utc_now_naive()


        tasks_collection.update_one(

            {
                "_id":
                    oid
            },

            {
                "$set":
                    update
            }

        )


    if data.get(
        "completed"
    ):

        create_log(

            str(
                user["_id"]
            ),

            "completed",

            "task",

            task.get(
                "title",
                "Task"
            ),

            "Task completed.",

            task_id=
                task_id,

            category=
                task.get(
                    "category",
                    ""
                )

        )


    else:

        create_log(

            str(
                user["_id"]
            ),

            "updated",

            "task",

            task.get(
                "title",
                "Task"
            ),

            "Task status updated.",

            task_id=
                task_id,

            category=
                task.get(
                    "category",
                    ""
                )

        )


    updated = tasks_collection.find_one(
            {
                "_id":
                    oid
            }
        )


    return jsonify(
        {
            "ok": True,
            "task":
                serialize_document(
                    updated
                )
        }
    )


# ============================================================
# TASKS - DELETE
# ============================================================

@app.route(
    "/api/tasks/<task_id>",
    methods=["DELETE"]
)
@login_required
def delete_task(
    task_id
):

    user = get_current_user()


    oid = object_id(
        task_id
    )


    if not oid:

        return jsonify(
            {
                "ok": False,
                "message":
                    "Invalid task ID."
            }
        ), 400


    task = tasks_collection.find_one(
        {
            "_id":
                oid,

            "user_id":
                user["_id"]
        }
    )


    if not task:

        return jsonify(
            {
                "ok": False,
                "message":
                    "Task not found."
            }
        ), 404


    # ========================================================
    # DELETE GOOGLE CALENDAR EVENT
    # ========================================================

    google_calendar_event_id = task.get(
        "google_calendar_event_id"
    )


    if google_calendar_event_id:

        try:

            google_calendar = user.get(
                "google_calendar",
                {}
            )


            credentials_data = (
                google_calendar.get(
                    "credentials"
                )
            )


            if credentials_data:

                credentials = Credentials(

                    token=
                        credentials_data.get(
                            "token"
                        ),

                    refresh_token=
                        credentials_data.get(
                            "refresh_token"
                        ),

                    token_uri=
                        credentials_data.get(
                            "token_uri"
                        ),

                    client_id=
                        credentials_data.get(
                            "client_id"
                        ),

                    client_secret=
                        credentials_data.get(
                            "client_secret"
                        ),

                    scopes=
                        credentials_data.get(
                            "scopes",
                            GOOGLE_SCOPES
                        )

                )


                service = build(
                    "calendar",
                    "v3",
                    credentials=credentials
                )


                service.events().delete(

                    calendarId=
                        "primary",

                    eventId=
                        google_calendar_event_id

                ).execute()


                print(
                    "GOOGLE CALENDAR EVENT DELETED:",
                    google_calendar_event_id
                )


        except Exception as error:

            print(
                "GOOGLE CALENDAR DELETE ERROR:",
                repr(error)
            )


    # ========================================================
    # DELETE MONGODB TASK
    # ========================================================

    tasks_collection.delete_one(

        {
            "_id":
                oid
        }

    )


    # ========================================================
    # ACTIVITY LOG
    # ========================================================

    create_log(

        str(
            user["_id"]
        ),

        "deleted",

        "task",

        task.get(
            "title",
            "Task"
        ),

        "Task deleted.",

        task_id=
            task_id,

        category=
            task.get(
                "category",
                ""
            )

    )


    return jsonify(
        {
            "ok": True,
            "message":
                "Task deleted successfully."
        }
    )

# ============================================================
# TASK EMAIL REMINDER WORKER
# ============================================================

def task_reminder_worker():

    print("Task email reminder worker started.")

    # --------------------------------------------------------
    # REMINDER CONFIGURATION
    # --------------------------------------------------------

    REMINDER_MINUTES_BEFORE = 10

    while True:

        try:

            # ------------------------------------------------
            # FIND TASKS THAT NEED REMINDERS
            # ------------------------------------------------

            tasks = tasks_collection.find(
                {
                    "reminder": True,
                    "reminder_sent": False,
                    "completed": False
                }
            )

            for task in tasks:

                due_date = task.get("due_date")
                due_time = task.get("due_time")

                if not due_date or not due_time:
                    continue

                # ------------------------------------------------
                # FIND USER
                # ------------------------------------------------

                user = users_collection.find_one(
                    {
                        "_id":
                            task.get("user_id")
                    }
                )

                if not user:

                    print(
                        "REMINDER ERROR: User not found"
                    )

                    continue

                recipient = user.get("email")

                if not recipient:

                    print(
                        "REMINDER ERROR: User email missing"
                    )

                    continue

                # ------------------------------------------------
                # USER TIMEZONE
                # ------------------------------------------------

                timezone_name = user.get(
                    "timezone",
                    "Asia/Kolkata"
                )

                try:

                    user_timezone = ZoneInfo(
                        timezone_name
                    )

                except Exception as timezone_error:

                    print(
                        "INVALID USER TIMEZONE:",
                        timezone_name,
                        timezone_error
                    )

                    continue

                # ------------------------------------------------
                # CURRENT LOCAL TIME
                # ------------------------------------------------

                now_utc = datetime.now(
                    timezone.utc
                )

                now_local = now_utc.astimezone(
                    user_timezone
                )

                # Remove timezone information only for comparing
                # the user's local date/time with the task date/time.

                current_datetime = (
                    now_local.replace(
                        tzinfo=None,
                        second=0,
                        microsecond=0
                    )
                )

                # ------------------------------------------------
                # TASK DUE DATETIME
                # ------------------------------------------------

                try:

                    due_datetime = datetime.strptime(
                        f"{due_date} {due_time}",
                        "%Y-%m-%d %H:%M"
                    )

                except ValueError as date_error:

                    print(
                        "REMINDER DATE ERROR:",
                        task.get("title"),
                        date_error
                    )

                    continue

                # ------------------------------------------------
                # CALCULATE REMINDER TIME
                # ------------------------------------------------

                reminder_datetime = (
                    due_datetime
                    -
                    timedelta(
                        minutes=
                            REMINDER_MINUTES_BEFORE
                    )
                )

                # ------------------------------------------------
                # DEBUG INFORMATION
                # ------------------------------------------------

                print(
                    "REMINDER CHECK:",
                    task.get("title"),
                    "| Current:",
                    current_datetime.strftime(
                        "%Y-%m-%d %H:%M"
                    ),
                    "| Reminder:",
                    reminder_datetime.strftime(
                        "%Y-%m-%d %H:%M"
                    ),
                    "| Due:",
                    due_datetime.strftime(
                        "%Y-%m-%d %H:%M"
                    ),
                    "| TZ:",
                    timezone_name
                )

                # ------------------------------------------------
                # NOT TIME TO SEND YET
                # ------------------------------------------------

                if current_datetime < reminder_datetime:

                    continue

                # ------------------------------------------------
                # TASK INFORMATION
                # ------------------------------------------------

                title = task.get(
                    "title",
                    "Task"
                )

                description = task.get(
                    "description",
                    ""
                ).strip()

                priority = str(
                    task.get(
                        "priority",
                        "medium"
                    )
                ).capitalize()

                category = str(
                    task.get(
                        "category",
                        "general"
                    )
                ).capitalize()

                checklist = task.get(
                    "checklist",
                    []
                )

                # ------------------------------------------------
                # CHECKLIST INFORMATION
                # ------------------------------------------------

                total_checklist = 0
                completed_checklist = 0

                if isinstance(
                    checklist,
                    list
                ):

                    total_checklist = len(
                        checklist
                    )

                    completed_checklist = sum(
                        1
                        for item in checklist
                        if isinstance(
                            item,
                            dict
                        )
                        and
                        bool(
                            item.get(
                                "completed",
                                False
                            )
                        )
                    )

                # ------------------------------------------------
                # PROFESSIONAL EMAIL
                # PLAIN TEXT ONLY
                # ------------------------------------------------

                subject = (
                    f"Reminder: {title} "
                    f"is due in "
                    f"{REMINDER_MINUTES_BEFORE} minutes"
                )

                body = f"""
Hello {user.get("name", "User")},

This is a scheduled reminder from MyNotes & Tasks.

Your task is approaching its due time.

------------------------------------------------------------
TASK DETAILS
------------------------------------------------------------

Task Title : {title}

Due Date   : {due_date}

Due Time   : {due_time}

Priority   : {priority}

Category   : {category}

Reminder   : {REMINDER_MINUTES_BEFORE} minutes before due time

------------------------------------------------------------
DESCRIPTION
------------------------------------------------------------

"""

                if description:

                    body += (
                        description
                        +
                        "\n"
                    )

                else:

                    body += (
                        "No description was added for this task.\n"
                    )

                body += """
------------------------------------------------------------
CHECKLIST PROGRESS
------------------------------------------------------------

"""

                if total_checklist > 0:

                    body += (
                        f"Completed : "
                        f"{completed_checklist}/"
                        f"{total_checklist} items\n"
                    )

                    remaining = (
                        total_checklist
                        -
                        completed_checklist
                    )

                    body += (
                        f"Remaining : "
                        f"{remaining} items\n"
                    )

                else:

                    body += (
                        "No checklist items were added.\n"
                    )

                body += f"""
------------------------------------------------------------
WHAT TO DO
------------------------------------------------------------

Please open MyNotes & Tasks and complete the task before
its scheduled due time.

Task: {title}

Due: {due_date} at {due_time}

------------------------------------------------------------
IMPORTANT
------------------------------------------------------------

This reminder was generated automatically.

You are receiving this email because the reminder option
was enabled for this task.

If you have already completed this task, no further action
is required.

Regards,

MyNotes & Tasks
Task Management System

------------------------------------------------------------
This is an automated notification. Please do not reply to
this email.
------------------------------------------------------------
"""

                # ------------------------------------------------
                # SEND EMAIL
                # ------------------------------------------------

                print(
                    "SENDING TASK REMINDER TO:",
                    recipient
                )

                sent = send_email(
                    recipient,
                    subject,
                    body
                )

                # ------------------------------------------------
                # MARK REMINDER AS SENT
                # ------------------------------------------------

                if sent:

                    update_result = (
                        tasks_collection.update_one(

                            {
                                "_id":
                                    task["_id"],

                                "reminder":
                                    True,

                                "reminder_sent":
                                    False
                            },

                            {
                                "$set": {

                                    "reminder_sent":
                                        True,

                                    "updated_at":
                                        utc_now_naive()

                                }
                            }
                        )
                    )

                    print(
                        "TASK REMINDER SENT:",
                        title,
                        "→",
                        recipient,
                        "| Updated:",
                        update_result.modified_count
                    )

                else:

                    print(
                        "TASK REMINDER FAILED:",
                        title,
                        "→",
                        recipient
                    )

        except Exception as error:

            print(
                "TASK REMINDER WORKER ERROR:",
                repr(error)
            )

        # --------------------------------------------------------
        # CHECK EVERY 30 SECONDS
        # --------------------------------------------------------

        time.sleep(30)



# ============================================================
# NOTES - LIST
# ============================================================

@app.route(
    "/api/notes",
    methods=["GET"]
)
@login_required
def get_notes():

    user = get_current_user()



    notes = notes_collection.find(
            {
                "user_id":
                    user["_id"]
            }
        ).sort(
            "updated_at",
            -1
        )


    return jsonify(
        {
            "ok": True,

            "notes": [

                serialize_document(
                    note
                )

                for note in notes

            ]

        }
    )


# ============================================================
# NOTES - CREATE
# ============================================================

@app.route(
    "/api/notes",
    methods=["POST"]
)
@login_required
def create_note():

    user = get_current_user()

    data = request.get_json(
        silent=True
    ) or {}

    title = str(
        data.get(
            "title",
            ""
        )
    ).strip()

    content = str(
        data.get(
            "content",
            ""
        )
    ).strip()

    category = str(
        data.get(
            "category",
            "general"
        )
    ).strip().lower()


    if not title:

        return jsonify(
            {
                "ok": False,
                "message":
                    "Note title is required."
            }
        ), 400


    now = utc_now_naive()

    note = {
        "user_id": user["_id"],
        "title": title,
        "content": content,
        "category": category,
        "pinned": bool(data.get("pinned", False)),
        "created_at": now,
        "updated_at": now
    }

    result = notes_collection.insert_one(note)

    create_log(
        str(user["_id"]),
        "created",
        "note",
        title,
        content,
        note_id=str(result.inserted_id),
        category=category
    )

    created = notes_collection.find_one(
        {
            "_id": result.inserted_id
        }
    )


    return jsonify(
        {
            "ok": True,
            "message":
                "Note created successfully.",
            "note":
                serialize_document(
                    created
                )
        }
    ), 201


# ============================================================
# NOTES - UPDATE
# ============================================================

@app.route(
    "/api/notes/<note_id>",
    methods=["PUT"]
)
@login_required
def update_note(
    note_id
):

    user = get_current_user()


    oid = object_id(
        note_id
    )


    if not oid:

        return jsonify(
            {
                "ok": False,
                "message":
                    "Invalid note ID."
            }
        ), 400


    note = notes_collection.find_one(
        {
            "_id":
                oid,

            "user_id":
                user["_id"]
        }
    )


    if not note:

        return jsonify(
            {
                "ok": False,
                "message":
                    "Note not found."
            }
        ), 404


    data = request.get_json(
        silent=True
    ) or {}


    title = str(
        data.get(
            "title",
            note.get(
                "title",
                ""
            )
        )
    ).strip()


    content = str(
        data.get(
            "content",
            note.get(
                "content",
                ""
            )
        )
    ).strip()


    category = str(
        data.get(
            "category",
            note.get(
                "category",
                "general"
            )
        )
    ).strip().lower()

    pinned = bool(
        data.get(
            "pinned",
            note.get("pinned", False)
        )
    )



    notes_collection.update_one(

        {
            "_id":
                oid
        },

        {
            "$set": {

                "title":
                    title,

                "content":
                    content,

                "category":
                    category,

                "pinned": pinned,

                "updated_at":
                    utc_now_naive()

            }

        }

    )


    create_log(

        str(
            user["_id"]
        ),

        "updated",

        "note",

        title,

        "Note updated.",

        note_id=
            note_id,

        category=
            category

    )


    updated = notes_collection.find_one(
            {
                "_id":
                    oid
            }
        )


    return jsonify(
        {
            "ok": True,
            "message":
                "Note updated successfully.",
            "note":
                serialize_document(
                    updated
                )
        }
    )


# ============================================================
# NOTES - DELETE
# ============================================================

@app.route(
    "/api/notes/<note_id>",
    methods=["DELETE"]
)
@login_required
def delete_note(
    note_id
):

    user = get_current_user()


    oid = object_id(
            note_id
        )


    if not oid:

        return jsonify(
            {
                "ok": False,
                "message":
                    "Invalid note ID."
            }
        ), 400


    note = notes_collection.find_one(
            {
                "_id":
                    oid,

                "user_id":
                    user["_id"]
            }
        )


    if not note:

        return jsonify(
            {
                "ok": False,
                "message":
                    "Note not found."
            }
        ), 404


    notes_collection.delete_one(

        {
            "_id":
                oid
        }

    )


    create_log(

        str(
            user["_id"]
        ),

        "deleted",

        "note",

        note.get(
            "title",
            "Note"
        ),

        "Note deleted.",

        note_id=
            note_id,

        category=
            note.get(
                "category",
                ""
            )

    )


    return jsonify(
        {
            "ok": True,
            "message":
                "Note deleted successfully."
        }
    )


# ============================================================
# LOGS
# ============================================================

@app.route(
    "/api/logs",
    methods=["GET"]
)
@login_required
def get_logs():

    user = get_current_user()

    try:

        limit = int(
                request.args.get(
                    "limit",
                    100
                )
            )

    except ValueError:

        limit = 100


    limit = max(
            1,
            min(
                limit,
                500
            )
        )


    logs = logs_collection.find(

            {
                "user_id":
                    user["_id"]
            }

        ).sort(

            "created_at",

            -1

        ).limit(
            limit
        )


    return jsonify(
        {
            "ok": True,

            "logs": [

                serialize_document(
                    log
                )

                for log in logs

            ]

        }
    )


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route(
    "/api/health",
    methods=["GET"]
)
def health():

    try:

        mongo.db.command(
            "ping"
        )


        return jsonify(
            {
                "ok": True,
                "database":
                    "connected"
            }
        )


    except Exception as error:

        return jsonify(
            {
                "ok": False,
                "database":
                    "disconnected",
                "error":
                    str(error)
            }
        ), 500


# ============================================================
# ERROR HANDLERS
# ============================================================

@app.errorhandler(404)
def not_found(error):

    if request.path.startswith(
        "/api/"
    ):

        return jsonify(
            {
                "ok": False,
                "message":
                    "API endpoint not found."
            }
        ), 404


    return render_template(
        "404.html"
    ), 404


@app.errorhandler(500)
def internal_error(error):

    if request.path.startswith(
        "/api/"
    ):

        return jsonify(
            {
                "ok": False,
                "message":
                    "Internal server error."
            }
        ), 500


    return render_template(
        "500.html"
    ), 500


# ============================================================
# CREATE INDEXES
# ============================================================

def create_indexes():

    try:

        users_collection.create_index(
            "email",
            unique=True
        )


        tasks_collection.create_index(
            [
                (
                    "user_id",
                    1
                ),

                (
                    "due_date",
                    1
                )

            ]
        )


        tasks_collection.create_index(
            [
                (
                    "user_id",
                    1
                ),

                (
                    "completed",
                    1
                )

            ]
        )


        notes_collection.create_index(
            [
                (
                    "user_id",
                    1
                ),

                (
                    "updated_at",
                    -1
                )

            ]
        )


        logs_collection.create_index(
            [
                (
                    "user_id",
                    1
                ),

                (
                    "created_at",
                    -1
                )

            ]
        )


        print(
            "MongoDB indexes created."
        )


    except Exception as error:

        print(
            "Index creation warning:",
            error
        )

# ============================================================
# GOOGLE CALENDAR - OAUTH HELPERS
# ============================================================

def get_google_redirect_uri():

    return url_for(
        "google_callback",
        _external=True
    )


# ============================================================
# GOOGLE CLIENT CONFIG
# ============================================================

def create_google_flow():

    client_config = get_google_client_config()

    flow = Flow.from_client_config(
        client_config,
        scopes=GOOGLE_SCOPES
    )

    flow.redirect_uri = get_google_redirect_uri()

    return flow


# ============================================================
# GOOGLE CALENDAR - CONNECT
# ============================================================

@app.route(
    "/api/google/connect",
    methods=["GET"]
)
@login_required
def google_connect():

    user = get_current_user()

    flow = create_google_flow()

    code_verifier = (
        base64.urlsafe_b64encode(
            secrets.token_bytes(32)
        )
        .rstrip(b"=")
        .decode("utf-8")
    )

    flow.code_verifier = code_verifier

    authorization_url, state = (
        flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent",
            code_challenge_method="S256"
        )
    )

    google_oauth_collection.insert_one(
        {
            "state": state,
            "user_id": user["_id"],
            "code_verifier": code_verifier,
            "created_at": utc_now_naive()
        }
    )

    print(
        "GOOGLE CONNECT STATE:",
        state
    )

    print(
        "GOOGLE CODE VERIFIER EXISTS:",
        bool(code_verifier)
    )

    return redirect(
        authorization_url
    )
# ============================================================
# GOOGLE CALENDAR - CALLBACK
# ============================================================

@app.route(
    "/api/google/callback",
    methods=["GET"]
)
@login_required
def google_callback():

    user = get_current_user()

    # --------------------------------------------------------
    # GET OAUTH STATE FROM GOOGLE
    # --------------------------------------------------------

    state = request.args.get(
        "state"
    )

    if not state:

        return jsonify(
            {
                "ok": False,
                "message":
                    "Google OAuth state is missing."
            }
        ), 400

    print(
        "GOOGLE CALLBACK STATE:",
        state
    )

    # --------------------------------------------------------
    # FIND TEMPORARY OAUTH DATA
    # --------------------------------------------------------

    oauth_data = google_oauth_collection.find_one(
        {
            "state": state
        }
    )

    if not oauth_data:

        print(
            "GOOGLE OAUTH STATE NOT FOUND:",
            state
        )

        return jsonify(
            {
                "ok": False,
                "message":
                    "Google authorization session expired. Please try connecting again."
            }
        ), 400

    # --------------------------------------------------------
    # VERIFY USER
    # --------------------------------------------------------

    if oauth_data.get(
        "user_id"
    ) != user["_id"]:

        print(
            "GOOGLE OAUTH USER MISMATCH"
        )

        return jsonify(
            {
                "ok": False,
                "message":
                    "Invalid Google authorization session."
            }
        ), 400

    # --------------------------------------------------------
    # GET PKCE CODE VERIFIER
    # --------------------------------------------------------

    code_verifier = oauth_data.get(
        "code_verifier"
    )

    if not code_verifier:

        print(
            "GOOGLE OAUTH CODE VERIFIER MISSING"
        )

        google_oauth_collection.delete_one(
            {
                "_id":
                    oauth_data["_id"]
            }
        )

        return jsonify(
            {
                "ok": False,
                "message":
                    "Google OAuth code verifier is missing."
            }
        ), 400

    print(
        "GOOGLE OAUTH CODE VERIFIER FOUND"
    )

    # --------------------------------------------------------
    # CREATE GOOGLE FLOW
    # --------------------------------------------------------

    try:

        client_config = (
            get_google_client_config()
        )

        flow = Flow.from_client_config(

            client_config,

            scopes=
                GOOGLE_SCOPES,

            state=
                state

        )

        flow.redirect_uri = (
            get_google_redirect_uri()
        )

        # ----------------------------------------------------
        # RESTORE PKCE VERIFIER
        # ----------------------------------------------------

        flow.code_verifier = (
            code_verifier
        )

        print(
            "GOOGLE REDIRECT URI:",
            flow.redirect_uri
        )

        # ----------------------------------------------------
        # EXCHANGE AUTHORIZATION CODE
        # ----------------------------------------------------

        flow.fetch_token(

            authorization_response=
                request.url

        )

    except Exception as error:

        print(
            "GOOGLE OAUTH TOKEN ERROR:",
            repr(error)
        )

        return jsonify(
            {
                "ok": False,
                "message":
                    "Google Calendar authorization failed."
            }
        ), 400

    # --------------------------------------------------------
    # GET GOOGLE CREDENTIALS
    # --------------------------------------------------------

    credentials = (
        flow.credentials
    )

    if not credentials:

        print(
            "GOOGLE CREDENTIALS MISSING"
        )

        return jsonify(
            {
                "ok": False,
                "message":
                    "Google credentials were not returned."
            }
        ), 400

    # --------------------------------------------------------
    # VERIFY REFRESH TOKEN
    # --------------------------------------------------------

    if not credentials.refresh_token:

        print(
            "GOOGLE REFRESH TOKEN MISSING"
        )

        return jsonify(
            {
                "ok": False,
                "message":
                    "Google did not provide a refresh token. Please disconnect and connect again."
            }
        ), 400

    # --------------------------------------------------------
    # PREPARE CREDENTIAL DATA
    # --------------------------------------------------------

    credentials_data = {

        "token":
            credentials.token,

        "refresh_token":
            credentials.refresh_token,

        "token_uri":
            credentials.token_uri,

        "client_id":
            credentials.client_id,

        "client_secret":
            credentials.client_secret,

        "scopes":
            list(
                credentials.scopes
                or GOOGLE_SCOPES
            )

    }

    # --------------------------------------------------------
    # SAVE GOOGLE CALENDAR CONNECTION
    # --------------------------------------------------------

    result = users_collection.update_one(

        {
            "_id":
                user["_id"]
        },

        {
            "$set": {

                "google_calendar": {

                    "connected":
                        True,

                    "credentials":
                        credentials_data,

                    "connected_at":
                        utc_now_naive()

                },

                "updated_at":
                    utc_now_naive()

            }

        }

    )

    print(
        "GOOGLE CALENDAR USER UPDATED:",
        result.modified_count
    )

    # --------------------------------------------------------
    # DELETE TEMPORARY OAUTH DATA
    # --------------------------------------------------------

    google_oauth_collection.delete_one(

        {
            "_id":
                oauth_data["_id"]
        }

    )

    print(
        "GOOGLE OAUTH TEMPORARY DATA DELETED"
    )

    # --------------------------------------------------------
    # CLEAR OLD SESSION DATA
    # --------------------------------------------------------

    session.pop(
        "google_oauth_state",
        None
    )

    session.pop(
        "google_code_verifier",
        None
    )

    # --------------------------------------------------------
    # ACTIVITY LOG
    # --------------------------------------------------------

    create_log(

        str(
            user["_id"]
        ),

        "connected",

        "google_calendar",

        "Google Calendar",

        "Google Calendar connected successfully."

    )

    # --------------------------------------------------------
    # SUCCESS
    # --------------------------------------------------------

    print(
        "GOOGLE CALENDAR CONNECTED SUCCESSFULLY:",
        user.get(
            "email"
        )
    )

    return redirect(
        "/profile"
    )

# ============================================================
# GOOGLE CALENDAR - STATUS
# ============================================================

@app.route(
    "/api/google/status",
    methods=["GET"]
)
@login_required
def google_status():

    user = get_current_user()

    google_calendar = user.get(
        "google_calendar",
        {}
    )

    connected = bool(
        google_calendar.get(
            "connected",
            False
        )
    )

    return jsonify(
        {
            "ok": True,

            "connected":
                connected,

            "connected_at":
                google_calendar.get(
                    "connected_at"
                )
        }
    )

# ============================================================
# GOOGLE CALENDAR - DISCONNECT
# ============================================================

@app.route(
    "/api/google/disconnect",
    methods=["POST"]
)
@login_required
def google_disconnect():

    user = get_current_user()

    users_collection.update_one(

        {
            "_id":
                user["_id"]
        },

        {
            "$unset": {

                "google_calendar":
                    ""

            },

            "$set": {

                "updated_at":
                    utc_now_naive()

            }

        }

    )

    create_log(

        str(
            user["_id"]
        ),

        "disconnected",

        "google_calendar",

        "Google Calendar",

        "Google Calendar disconnected."

    )

    return jsonify(
        {
            "ok": True,
            "message":
                "Google Calendar disconnected successfully."
        }
    )

# ============================================================
# GOOGLE CALENDAR - CREATE EVENT
# ============================================================

def create_google_calendar_event(
    user,
    title,
    description,
    due_date,
    due_time,
    priority,
    category
):

    google_calendar = user.get(
        "google_calendar",
        {}
    )

    if not google_calendar.get(
        "connected",
        False
    ):
        print(
            "GOOGLE CALENDAR NOT CONNECTED"
        )
        return None


    credentials_data = google_calendar.get(
        "credentials"
    )

    if not credentials_data:
        print(
            "GOOGLE CALENDAR CREDENTIALS MISSING"
        )
        return None


    try:

        credentials = Credentials(

            token=
                credentials_data.get(
                    "token"
                ),

            refresh_token=
                credentials_data.get(
                    "refresh_token"
                ),

            token_uri=
                credentials_data.get(
                    "token_uri"
                ),

            client_id=
                credentials_data.get(
                    "client_id"
                ),

            client_secret=
                credentials_data.get(
                    "client_secret"
                ),

            scopes=
                credentials_data.get(
                    "scopes",
                    GOOGLE_SCOPES
                )

        )


        service = build(
            "calendar",
            "v3",
            credentials=credentials
        )


        # ----------------------------------------------------
        # TIMEZONE
        # ----------------------------------------------------

        timezone_name = user.get(
            "timezone",
            "Asia/Kolkata"
        )


        try:

            ZoneInfo(
                timezone_name
            )

        except Exception:

            timezone_name = (
                "Asia/Kolkata"
            )


        # ----------------------------------------------------
        # START / END TIME
        # ----------------------------------------------------

        start_datetime = (
            f"{due_date}T{due_time}:00"
        )


        start_dt = datetime.fromisoformat(
            start_datetime
        )


        end_dt = (
            start_dt +
            timedelta(
                minutes=30
            )
        )


        # ----------------------------------------------------
        # GOOGLE CALENDAR EVENT
        # ----------------------------------------------------

        event = {

            "summary":
                title,

            "description":
                (
                    f"{description}\n\n"
                    f"Priority: {priority.title()}\n"
                    f"Category: {category.title()}\n\n"
                    "Created by MyNotes & Tasks"
                ),

            "start": {

                "dateTime":
                    start_dt.isoformat(),

                "timeZone":
                    timezone_name

            },

            "end": {

                "dateTime":
                    end_dt.isoformat(),

                "timeZone":
                    timezone_name

            },

            "reminders": {

                "useDefault":
                    False,

                "overrides": [

                    {
                        "method":
                            "popup",

                        "minutes":
                            10
                    },

                    {
                        "method":
                            "popup",

                        "minutes":
                            5
                    }

                ]

            }

        }


        created_event = (
            service.events()
            .insert(
                calendarId="primary",
                body=event
            )
            .execute()
        )


        event_id = created_event.get(
            "id"
        )


        print(
            "GOOGLE CALENDAR EVENT CREATED:",
            event_id
        )


        return event_id


    except Exception as error:

        print(
            "GOOGLE CALENDAR CREATE ERROR:",
            repr(error)
        )

        return None
    
# ============================================================
# START
# ============================================================

if __name__ == "__main__":

    create_indexes()

    print(
        ""
    )

    print(
        "=========================================="
    )

    print(
        " MyNotes & Tasks"
    )

    print(
        " Flask server starting..."
    )

    print(
        "=========================================="
    )

    print(
        f" URL: {APP_BASE_URL}"
    )

    print(
        "=========================================="
    )

    # --------------------------------------------------------
    # START TASK REMINDER WORKER
    # --------------------------------------------------------

    reminder_thread = threading.Thread(
        target=task_reminder_worker,
        daemon=True
    )

    reminder_thread.start()

    # --------------------------------------------------------
    # START FLASK
    # --------------------------------------------------------

    app.run(

        host="0.0.0.0",

        port=int(
            os.getenv(
                "PORT",
                "5000"
            )
        ),

        debug=False

    )
