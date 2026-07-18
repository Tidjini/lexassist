#!/usr/bin/env bash
# Provisionnement initial de l'env de test/démo sur le VPS (une seule fois).
# Idempotent autant que possible. À lancer sur le VPS en tant que tidjini :
#   bash bootstrap.sh
# Prérequis : postgres + redis actifs, node >= 22, sudo sans mot de passe,
# clé SSH GitHub configurée. Le port 80 n'est JAMAIS utilisé (multi-projets).
set -euo pipefail

DEPLOY_DIR=/srv/lexassist-demo
APP_DIR=$DEPLOY_DIR/app
VENV=$DEPLOY_DIR/venv
REPO_SSH=git@github.com:Tidjini/lexassist.git
DEMO_DB=lexassist_demo
DB_USER=lexassist

# ── Swap (les builds Vite sont gourmands, le VPS a ~4 Go de RAM) ─────────────
if ! sudo swapon --show | grep -q .; then
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# ── Dossier de déploiement + clone ────────────────────────────────────────────
sudo mkdir -p "$DEPLOY_DIR"
sudo chown "$USER:$USER" "$DEPLOY_DIR"
if [ ! -d "$APP_DIR/.git" ]; then
    git clone -b master "$REPO_SSH" "$APP_DIR"
fi

# ── Rôle + base démo (vide : les données viennent de seed_demo_data) ─────────
if ! sudo -u postgres psql -Atc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
    echo "!! Créer le rôle d'abord : sudo -u postgres psql -c \"CREATE ROLE $DB_USER LOGIN PASSWORD '...';\" puis relancer."
    exit 1
fi
if ! sudo -u postgres psql -Atc "SELECT 1 FROM pg_database WHERE datname='$DEMO_DB'" | grep -q 1; then
    sudo -u postgres psql -c "CREATE DATABASE $DEMO_DB OWNER $DB_USER;"
fi

# ── venv ──────────────────────────────────────────────────────────────────────
if [ ! -x "$VENV/bin/python" ]; then
    python3 -m venv "$VENV"
fi
"$VENV/bin/pip" install -q --upgrade pip
"$VENV/bin/pip" install -q -r "$APP_DIR/requirements/base.txt"

# ── .env ──────────────────────────────────────────────────────────────────────
if [ ! -f "$APP_DIR/.env" ]; then
    echo "!! Copier deploy/vps-demo/lexassist-demo.env.example vers $APP_DIR/.env et remplir les secrets, puis relancer."
    exit 1
fi

# ── nginx + systemd ───────────────────────────────────────────────────────────
if ! command -v nginx >/dev/null; then
    sudo apt-get update -qq && sudo apt-get install -y -qq nginx
fi
# Le site par défaut écoute sur 80 — on le retire, le port 80 reste libre.
sudo rm -f /etc/nginx/sites-enabled/default
sudo cp "$APP_DIR/deploy/vps-demo/nginx-lexassist-demo.conf" /etc/nginx/sites-available/lexassist-demo.conf
sudo ln -sf /etc/nginx/sites-available/lexassist-demo.conf /etc/nginx/sites-enabled/lexassist-demo.conf

sudo cp "$APP_DIR/deploy/vps-demo/lexassist-demo.service" /etc/systemd/system/lexassist-demo.service
sudo systemctl daemon-reload
sudo systemctl enable lexassist-demo nginx

# ── Firewall ──────────────────────────────────────────────────────────────────
sudo ufw allow 8090/tcp comment 'lexassist demo desktop'
sudo ufw allow 8091/tcp comment 'lexassist demo mobile'

echo "Bootstrap OK — lancer maintenant deploy/vps-demo/deploy.sh (migrations, builds, démarrage)."
