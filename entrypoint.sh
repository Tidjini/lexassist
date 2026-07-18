#!/bin/bash
set -e

# Extraire les infos de connexion depuis DATABASE_URL
DB_HOST=$(python3 -c "import os; from urllib.parse import urlparse; u=urlparse(os.environ['DATABASE_URL']); print(u.hostname)")
DB_PORT=$(python3 -c "import os; from urllib.parse import urlparse; u=urlparse(os.environ['DATABASE_URL']); print(u.port or 5432)")
DB_USER=$(python3 -c "import os; from urllib.parse import urlparse; u=urlparse(os.environ['DATABASE_URL']); print(u.username)")

echo "[entrypoint] Attente de PostgreSQL sur $DB_HOST:$DB_PORT..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; do
    sleep 1
done
echo "[entrypoint] PostgreSQL prêt."

# Migrations et collectstatic uniquement pour le serveur web (pas celery)
if [ "${1}" = "uvicorn" ]; then
    echo "[entrypoint] Migrations schéma public..."
    python manage.py migrate_schemas --shared --noinput

    echo "[entrypoint] Migrations tous les tenants..."
    python manage.py migrate_schemas --noinput

    echo "[entrypoint] Collectstatic..."
    python manage.py collectstatic --noinput
fi

exec "$@"
