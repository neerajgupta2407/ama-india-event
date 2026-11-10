from .base import *  # noqa: F401,F403

DEBUG = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
]

# The dashboard dev server (Next on :3000) calls this API cross-origin with cookies.
CSRF_TRUSTED_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]
