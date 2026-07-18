# LexAssist

Plateforme intelligente de gestion documentaire pour cabinets d'avocats
spécialisés en extranjería / immigration / nationalité (Espagne).

- **Proposition (FR)** : `docs/LexAssist_Presentation_FR.md`
- **Plan d'action** : `docs/PLAN_ACTION.md`
- **Déploiement démo VPS** : `deploy/vps-demo/README.md`

Architecture reprise de schoolavia : Django 6 + DRF + django-tenants (un
cabinet = un schéma PostgreSQL, routage par nom d'hôte), Celery/Redis
(pipeline IA documentaire), Channels/daphne (notifications temps réel),
SDK Anthropic (classification + extraction de documents via Claude vision),
frontend React (Fuse/MUI/Vite) + app mobile Vite séparée (`mobile-avocat`).

## Dev local

```bash
python3 -m venv venv
venv/bin/pip install -r requirements/dev.txt
cp .env.example .env   # remplir DATABASE_URL / REDIS_URL
venv/bin/python manage.py migrate_schemas --shared
venv/bin/python manage.py runserver
```

django-tenants route par Host : le schéma public répond sur `localhost`,
un cabinet sur son domaine (ex. `cabinet-demo.localhost`). Créer le tenant
public + un cabinet via `manage.py shell` (cf. `deploy/vps-demo/README.md`).

- API docs : http://localhost:8000/api/docs/
- Admin : http://localhost:8000/admin/

## Workflow

Dev local → push GitHub (source de vérité) → sur le VPS :
`bash /srv/lexassist-demo/app/deploy/vps-demo/deploy.sh`.
