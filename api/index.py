"""
Vercel Python Function entry point for the Alumni Flask API.
The Vercel backend project should use the repository root as its Root Directory.
"""
import os
import sys

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.app import app  # noqa: E402

# Vercel serves this Flask WSGI application as a serverless Python function.
