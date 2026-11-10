#!/bin/bash
# One-time setup on the staging server, run as root:
#   ssh jg-stage 'bash -s' < deploy/setup-ci-user.sh "<ssh public key line>"
# Creates a limited `amai-deploy` user for GitHub Actions. It owns only /opt/amai_api and
# /opt/amai_web, and may run exactly three privileged things: migrate and collectstatic
# (as the app user `amai`, through a fixed wrapper) and restart amai-gunicorn. It has no
# general root access and cannot touch the other apps on this server. Safe to re-run.
set -euo pipefail

PUBKEY="${1:?usage: setup-ci-user.sh '<ssh public key line>'}"
case "$PUBKEY" in
  ssh-ed25519\ *|ssh-rsa\ *|ecdsa-sha2-*) ;;
  *) echo "that does not look like an SSH public key" >&2; exit 1 ;;
esac

id amai-deploy >/dev/null 2>&1 || useradd --create-home --shell /bin/bash amai-deploy
install -d -m 700 -o amai-deploy -g amai-deploy /home/amai-deploy/.ssh
printf 'no-agent-forwarding,no-port-forwarding,no-X11-forwarding,no-pty %s\n' "$PUBKEY" \
  > /home/amai-deploy/.ssh/authorized_keys
chown amai-deploy:amai-deploy /home/amai-deploy/.ssh/authorized_keys
chmod 600 /home/amai-deploy/.ssh/authorized_keys

# The deploy user owns the code and the built site. The app user only reads the code.
mkdir -p /opt/amai_api /opt/amai_web/out /opt/amai_api/staticfiles
chown -R amai-deploy:amai /opt/amai_api
chown -R amai-deploy:amai-deploy /opt/amai_web
chown root:amai /opt/amai_api/.env
chmod 640 /opt/amai_api/.env
chown -R amai:amai /opt/amai_api/staticfiles

# Root-owned wrapper: the only thing the deploy user can run as `amai`, and only these two commands.
cat > /usr/local/sbin/amai-manage <<'WRAPPER'
#!/bin/bash
set -euo pipefail
cd /opt/amai_api
export DJANGO_SETTINGS_MODULE=config.settings.staging
case "$*" in
  "migrate --noinput"|"collectstatic --noinput -v0")
    exec /opt/amai_api/venv/bin/python manage.py "$@" ;;
  *)
    echo "amai-manage: not allowed: $*" >&2
    exit 2 ;;
esac
WRAPPER
chown root:root /usr/local/sbin/amai-manage
chmod 755 /usr/local/sbin/amai-manage

TMP=$(mktemp)
cat > "$TMP" <<'SUDOERS'
Cmnd_Alias AMAI_MANAGE = /usr/local/sbin/amai-manage migrate --noinput, /usr/local/sbin/amai-manage collectstatic --noinput -v0
amai-deploy ALL=(amai) NOPASSWD: AMAI_MANAGE
amai-deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart amai-gunicorn
SUDOERS
visudo -cf "$TMP"
install -m 440 -o root -g root "$TMP" /etc/sudoers.d/amai-deploy
rm -f "$TMP"
echo "amai-deploy is ready"
