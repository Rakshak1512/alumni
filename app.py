"""
Smart Alumni & Student Career Networking Portal - Root Entrypoint.
Delegates to backend.app, which is the sole Flask application.
"""
import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
load_dotenv(os.path.join(BACKEND_DIR, ".env"))

from backend.app import app  # noqa: E402


if __name__ == "__main__":
    host = os.getenv("BACKEND_HOST", "0.0.0.0")
    port = int(os.getenv("PORT", os.getenv("BACKEND_PORT", "5000")))
    is_production = (
        os.getenv("RENDER", "").lower() == "true"
        or os.getenv("APP_ENV", "").lower() == "production"
        or os.getenv("FLASK_ENV", "").lower() == "production"
    )
    app.run(host=host, port=port, debug=not is_production)
