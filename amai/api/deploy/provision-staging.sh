#!/bin/bash
# One-time setup on the staging server (run as root there). Safe to re-run: it never
# overwrites an existing .env or database password.
set -euo pipefail

APP=/opt/amai_api
IP=43.242.224.132

id amai >/dev/null 2>&1 || useradd --system --home "$APP" --shell /usr/sbin/nologin amai
mkdir -p "$APP" /var/log/amai
chown amai:amai /var/log/amai

if [ ! -f "$APP/.env" ]; then
  DB_PASS=$(python3 -c 'import secrets; print(secrets.token_urlsafe(24))')
  SECRET=$(python3 -c 'import secrets; print(secrets.token_urlsafe(50))')
  sudo -u postgres psql -v ON_ERROR_STOP=1 -c "CREATE ROLE amai LOGIN PASSWORD '$DB_PASS'" >/dev/null
  sudo -u postgres psql -v ON_ERROR_STOP=1 -c "CREATE DATABASE amai_staging OWNER amai" >/dev/null
  cat > "$APP/.env" <<ENV
ENVIRONMENT=staging
SECRET_KEY=$SECRET
ALLOWED_HOSTS=$IP,events.amaindiaevents.org,api.amaindiaevents.org,localhost,127.0.0.1
DATABASE_URL=postgres://amai:$DB_PASS@127.0.0.1:5432/amai_staging
CORS_ALLOWED_ORIGINS=
STAFF_ALERT_EMAILS=hkanand@ama-india.org
DEFAULT_FROM_EMAIL=events@ama-india.org
USE_BREVO_EMAIL=False
BREVO_SENDER_NAME=AMAI
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
ENV
  chmod 640 "$APP/.env"
  chown root:amai "$APP/.env"
  echo "created .env and amai_staging database"
else
  echo ".env exists, leaving it alone"
fi
