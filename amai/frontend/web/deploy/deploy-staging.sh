#!/bin/bash
# Build the static site locally and publish it to the staging server.
# Usage: ./deploy/deploy-staging.sh   (run from amai/frontend/web; needs the `jg-stage` ssh alias)
# NEXT_PUBLIC_API_URL is forced empty so the site calls /api on its own origin.
set -euo pipefail

HOST=${DEPLOY_HOST:-jg-stage}
DEST=/opt/amai_web/out

NEXT_PUBLIC_API_URL= npm run build
ssh "$HOST" "mkdir -p $DEST"
rsync -az --delete out/ "$HOST:$DEST/"
