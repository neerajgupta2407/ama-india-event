from .base import *  # noqa: F401,F403

# Staging runs on a raw IP over plain HTTP, so none of production's HTTPS-only
# settings apply. Do not use this module for the real launch.
ENVIRONMENT = "staging"
DEBUG = False
SECRET_KEY = env("SECRET_KEY")  # noqa: F405 - required, no default
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
