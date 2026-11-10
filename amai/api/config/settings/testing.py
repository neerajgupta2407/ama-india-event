from .base import *  # noqa: F401,F403

ENVIRONMENT = "testing"
DEBUG = False
ATOMIC_REQUESTS = False
DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}}
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
RAZORPAY_KEY_ID = "rzp_test_dummy"
RAZORPAY_KEY_SECRET = "dummy"
RAZORPAY_WEBHOOK_SECRET = "dummy"
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
STAFF_ALERT_EMAILS = ["staff@example.com"]
USE_BREVO_EMAIL = False
TEST_TO_EMAIL = ""
