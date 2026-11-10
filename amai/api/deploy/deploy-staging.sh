#!/bin/bash
# Deploy the API to the staging server from the local checkout.
# Usage: ./deploy/deploy-staging.sh   (run from amai/api; needs the `jg-stage` ssh alias)
set -euo pipefail

HOST=${DEPLOY_HOST:-jg-stage}
APP=/opt/amai_api

rsync -az --delete \
  --exclude .venv --exclude venv --exclude .env --exclude '*.sqlite3' \
  --exclude __pycache__ --exclude .pytest_cache --exclude .ruff_cache \
  --exclude staticfiles --exclude 'tests' \
  ./ "$HOST:$APP/"

ssh "$HOST" "bash -s" <<'REMOTE'
set -euo pipefail
cd /opt/amai_api
[ -d venv ] || python3.11 -m venv venv
venv/bin/pip install -q --upgrade pip
venv/bin/pip install -q -r requirements/base.txt
set -a; . ./.env; set +a
export DJANGO_SETTINGS_MODULE=config.settings.staging
venv/bin/python manage.py migrate --noinput
venv/bin/python manage.py collectstatic --noinput -v0
chown -R amai:amai /opt/amai_api/staticfiles
install -m 644 deploy/amai-gunicorn.service /etc/systemd/system/amai-gunicorn.service
systemctl daemon-reload
systemctl enable amai-gunicorn >/dev/null 2>&1
systemctl restart amai-gunicorn
install -m 644 deploy/amai-reconcile.service /etc/systemd/system/amai-reconcile.service
install -m 644 deploy/amai-reconcile.timer /etc/systemd/system/amai-reconcile.timer
systemctl daemon-reload
systemctl enable --now amai-reconcile.timer >/dev/null 2>&1
install -m 644 deploy/nginx-amai-proxy.conf /etc/nginx/snippets/amai-proxy.conf
install -m 644 deploy/nginx-amai-locations.conf /etc/nginx/snippets/amai-locations.conf
install -m 644 deploy/nginx-amai-ip.conf /etc/nginx/sites-available/amai-api-ip
ln -sf /etc/nginx/sites-available/amai-api-ip /etc/nginx/sites-enabled/amai-api-ip
nginx -t
systemctl reload nginx
REMOTE
