#!/usr/bin/env bash
# Met à jour l'env de test/démo du VPS depuis GitHub (source de vérité).
# À lancer sur le VPS : bash /srv/lexassist-demo/app/deploy/vps-demo/deploy.sh
set -euo pipefail

DEPLOY_DIR=/srv/lexassist-demo
APP_DIR=$DEPLOY_DIR/app
VENV=$DEPLOY_DIR/venv
DEMO_HOST=cabinet-demo.82.165.110.108.nip.io
export DJANGO_SETTINGS_MODULE=config.settings.prod

cd "$APP_DIR"
git pull --ff-only

"$VENV/bin/pip" install -q -r requirements/base.txt

"$VENV/bin/python" manage.py migrate_schemas --noinput
"$VENV/bin/python" manage.py collectstatic --noinput

# Builds Vite. On saute le tsc des scripts npm (simple type-check, et son heap
# de 4 Go dépasse la RAM du VPS) — le type-check reste le travail de la CI/dev.
export NODE_OPTIONS=--max-old-space-size=2048

# VITE_API_BASE_URL volontairement absent : les builds retombent sur
# window.location.origin (same-origin, nginx proxifie /api) et fonctionnent
# donc depuis n'importe quel hôte — nip.io, IP publique, IP Tailscale.
if [ -d "$APP_DIR/frontend" ]; then
    cd "$APP_DIR/frontend"
    npm ci --no-audit --no-fund
    npx vite build
fi

if [ -d "$APP_DIR/mobile-avocat" ]; then
    cd "$APP_DIR/mobile-avocat"
    npm ci --no-audit --no-fund
    npx vite build
fi

sudo systemctl restart lexassist-demo
sudo nginx -t && sudo systemctl reload nginx

echo "OK — desktop http://$DEMO_HOST:8090  |  mobile http://$DEMO_HOST:8091"
