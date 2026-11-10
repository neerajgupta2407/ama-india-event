#!/bin/bash
# Deploy the API as the limited `amai-deploy` user. This is what GitHub Actions runs.
# It never touches nginx or systemd files (those change rarely and stay a manual,
# root-only step via deploy-staging.sh); it deploys code, installs packages, runs
# migrations and restarts the app. Privileged steps go through the narrow sudo rules
# created by deploy/setup-ci-user.sh.
# Usage (from amai/api): ./deploy/deploy-ci.sh      Optional: DEPLOY_HOST=user@host
set -euo pipefail

HOST=${DEPLOY_HOST:-jg-stage}
APP=/opt/amai_api

rsync -az --delete --no-owner --no-group \
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
sudo -n -u amai /usr/local/sbin/amai-manage migrate --noinput
sudo -n -u amai /usr/local/sbin/amai-manage collectstatic --noinput -v0
sudo -n /usr/bin/systemctl restart amai-gunicorn
systemctl is-active --quiet amai-gunicorn
echo "amai-gunicorn restarted and active"
REMOTE
