from .base import *  # noqa: F401,F403

# Staging: the dashboard works only over HTTPS (events/api.amaindiaevents.org). The raw IP is plain
# HTTP for quick checks of the public site and cannot hold a signed-in session.
ENVIRONMENT = "staging"
DEBUG = False
SECRET_KEY = env("SECRET_KEY")  # noqa: F405 - required, no default

# nginx terminates TLS and tells Django which scheme the visitor used.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
CSRF_TRUSTED_ORIGINS = [
    "https://events.amaindiaevents.org",
    "https://api.amaindiaevents.org",
]
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
