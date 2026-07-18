# LexAssist — Plan d'action technique

Basé sur l'architecture, les techniques et les outils éprouvés du projet **schoolavia**
(`~/projects/schoolavia`), y compris le workflow **local ↔ remote** (dev local → GitHub
→ VPS via `deploy.sh`).

## 1. Stack technique (reprise de schoolavia)

### Backend
| Composant | Outil | Usage dans LexAssist |
|---|---|---|
| Framework | Django 6 + Django REST Framework | API des clients, dossiers, documents, procédures |
| Multi-tenant | django-tenants (schéma PostgreSQL par tenant) | Chaque cabinet d'avocats = un tenant isolé (routage par nom d'hôte) |
| Base de données | PostgreSQL 16 | Données structurées + métadonnées documentaires |
| Tâches asynchrones | Celery + Redis | Pipeline IA : classification + extraction de documents en arrière-plan |
| Tâches planifiées | Celery Beat | Alertes d'expiration (passeports, NIE, empadronamiento, délais requerimientos) |
| Temps réel | Channels + channels-redis + daphne | Notifications live : « document traité », alertes du jour, statut d'extraction |
| Auth | djangorestframework-simplejwt | JWT + 2FA (exigence RGPD du document) |
| IA | SDK `anthropic` (Claude, vision) | Lecture des documents (photo/PDF) : type, données, dates — même technique que la lecture photo des feuilles de pointage schoolavia |
| PDF | reportlab + **pypdf** (ajout) | reportlab pour écrits/paquets de dépôt ; pypdf pour remplir les formulaires officiels (EX-00→EX-21, taxes 790) |
| Schéma API | drf-spectacular + django-filter | Documentation OpenAPI, filtres de recherche |
| Export | openpyxl / xlsxwriter | Exports RGPD et rapports du cabinet |

### Frontend
| Composant | Outil | Usage |
|---|---|---|
| App desktop | React + template Fuse + MUI 7 + Vite + TypeScript | Tableau de bord du cabinet, gestion clients/dossiers/documents |
| Data fetching | TanStack Query | Cache et synchro API |
| i18n | i18next | ES (interface cliente) + FR |
| Tableaux | material-react-table / MUI X Data Grid | Listes dossiers, alertes, recherches |
| E2E | Playwright | Parcours critiques (upload → extraction → formulaire) |
| App mobile | App Vite séparée (modèle `mobile-prof`) → **`mobile-avocat/`** | Photo de documents, assistant vocal (Web Speech API + Claude), consultation des dossiers |

### Infrastructure
- **Dev local** : `docker-compose.yml` identique (db, redis, web, celery, celery-beat, nginx) + venv pour le run direct.
- **Démo/prod VPS** : reprise exacte du modèle `deploy/vps-demo` de schoolavia (voir §3).
- `requirements/base.txt` + `requirements/dev.txt`, `config/settings/{dev,prod}.py`, `urls_public.py` / `urls_tenant.py`.

## 2. Structure du projet (miroir de schoolavia)

```
lexassist/
├── apps/
│   ├── tenants/        # cabinets (django-tenants) — miroir de schoolavia/apps/tenants
│   ├── accounts/       # utilisateurs, rôles (avocat, assistant), 2FA, journal d'accès
│   ├── core/           # utilitaires partagés
│   ├── clients/        # fiche client = la « valise de données » (miroir de etudiants/)
│   ├── dossiers/       # expedientes : statuts (préparation, déposé, requerimiento, résolu)
│   ├── documents/      # upload, stockage chiffré, classification et extraction IA
│   ├── procedures/     # trámites : catalogue (arraigo, regroupement…) + checklists intelligentes
│   ├── formulaires/    # génération EX-00→EX-21, taxes 790, écrits, paquets de dépôt
│   ├── notifications/  # alertes expirations/délais (miroir de notifications/ + Channels)
│   └── assistant/      # recherche intelligente + assistant conversationnel/vocal (Claude)
├── config/             # settings/, celery.py, routing.py (ASGI), urls_public/tenant
├── frontend/           # desktop (Fuse React)
├── mobile-avocat/      # app mobile (modèle mobile-prof)
├── deploy/vps-demo/    # bootstrap.sh, deploy.sh, nginx conf, service systemd
├── requirements/       # base.txt, dev.txt
├── docker-compose.yml, Dockerfile, Dockerfile.nginx, entrypoint.sh
└── docs/
```

## 3. Workflow local ↔ remote (même technique que schoolavia)

**Principe : GitHub = source de vérité. Dev en local, synchro par push, déploiement par script sur le VPS.**

1. **Local (WSL2)** : dev dans `~/projects/lexassist`, Postgres/Redis via docker-compose ou services locaux, `npm run dev` (Vite) + `runserver`/daphne.
2. **Push GitHub** : chaque fonctionnalité validée localement est poussée (`git push`).
3. **VPS (IONOS, ports dédiés — jamais le port 80, le VPS héberge plusieurs projets)** :
   - `/srv/lexassist-demo/app` — clone GitHub ; `/srv/lexassist-demo/venv` — venv Python.
   - `bootstrap.sh` (une fois) : venv, base `lexassist_demo`, swap 2 Go, service systemd.
   - `deploy.sh` (à chaque mise à jour) : `git pull --ff-only` → `pip install -r base.txt` → `migrate_schemas` → `collectstatic` → builds Vite (`npx vite build`, sans tsc — type-check côté dev/CI, `NODE_OPTIONS=--max-old-space-size=2048`) → `systemctl restart lexassist-demo` → `nginx -t && reload`.
   - daphne (systemd) sur 127.0.0.1:800X ; nginx : port **8090** → build desktop + proxy `/api /ws /admin /static /media`, port **8091** → build mobile-avocat. Same-origin (`window.location.origin`) ⇒ pas de CORS et routage tenant préservé.
   - DNS joker **nip.io** : `cabinet-demo.82.165.110.108.nip.io:8090` — indispensable car django-tenants route les cabinets par nom d'hôte. Accès aussi par IP publique et Tailscale.
   - ⚠ Pare-feu IONOS : ouvrir TCP 8090-8091 dans le panneau cloud (en plus d'ufw).
4. **Données de démo** : commandes `seed_demo_data` (clients fictifs, documents de test — **jamais de données réelles**, conformément au document) et `seed_demo_activite`.

## 4. Phases de développement (alignées sur le document, §6)

### Phase 1 — Prototype (2-3 semaines) → démo navigable
- Bootstrap du projet : copie de la structure schoolavia (config, tenants, accounts, docker, deploy).
- Apps `clients` + `dossiers` : CRUD complet, statuts, historique (qui a fait quoi et quand).
- App `documents` : upload (photo/PDF), rangement par catégorie manuelle, aperçu.
- Frontend Fuse : tableau de bord (dossiers par statut, alertes, recherche instantanée), fiches client/dossier, design responsive mobile.
- Déploiement VPS (bootstrap + deploy.sh) + seed de démo → **démonstration en direct chez la cliente**.

### Phase 2 — IA documentaire → « l'effet magique »
- Pipeline Celery : upload → tâche asynchrone → Claude (vision) : ① type de document (passeport, NIE, DNI, empadronamiento, contrat, vida laboral, fiche de paie, diplôme, casier judiciaire, résolution) ② extraction structurée (noms, numéros, dates, adresses) ③ archivage automatique + remplissage de la fiche client (la « valise de données »).
- Notification temps réel (Channels) quand l'extraction est terminée ; écran de validation humaine des données extraites.
- Création automatique des alertes d'expiration (passeport, NIE, empadronamiento < 3 mois).

### Phase 3 — Procédures et formulaires
- App `procedures` : catalogue des trámites (arraigo social, regroupement familial, longue durée, nationalité…) avec exigences documentaires paramétrables → **checklist intelligente** (✓ / ✗ MANQUE / ⚠ expire bientôt) + message client généré en un clic.
- App `formulaires` : remplissage des PDF officiels (pypdf) — modèles EX, taxes 790 (052, 062, 026), demandes de nationalité ; écrits standard (reportlab) ; « paquet de dépôt » ordonné (ZIP/PDF fusionné).
- Celery Beat : alertes quotidiennes (expirations, délais requerimientos 10 jours ouvrés, rendez-vous) sur le panel + mobile.

### Phase 4 — Assistant
- App `assistant` : endpoint conversationnel (Claude + tool use sur l'API interne) : « Quels passeports expirent dans les 3 prochains mois ? », « Ajoute une note… ».
- `mobile-avocat` : saisie vocale (Web Speech API) → assistant → réponse vocale/texte ; accès rapide aux dossiers et checklists.

### Phase 5 — Avancé
- Assistant de navigateur (extension) pour pré-remplir les portails officiels (Mercurio, Ministère de la Justice) — l'avocate garde le contrôle du dépôt avec son certificat.
- App iPhone (PWA → Capacitor si besoin), portail client (suivi du dossier, liste des pièces à apporter).

## 5. Sécurité / RGPD (dès la phase 1)

- Hébergement UE (VPS IONOS, datacenters UE) ; chiffrement au repos des documents (champ/stockage chiffré) + TLS.
- 2FA (TOTP), journal d'accès complet (`accounts`), rôles avocat/assistant.
- API Anthropic en modalité professionnelle : pas d'entraînement sur les données clients.
- Export complet des données (openpyxl + archives documents) et effacement garanti par tenant.
- Sauvegardes quotidiennes automatiques (pg_dump + media, cron sur le VPS).
- Démo et tests uniquement avec des documents fictifs.

## 6. Prochaines étapes immédiates

1. `git init` + création du dépôt GitHub `lexassist`.
2. Squelette Django copié de schoolavia (config, tenants, accounts, requirements, docker).
3. Frontend Fuse + `mobile-avocat` initialisés.
4. Bootstrap de l'environnement démo VPS (ports 8090/8091).
5. Développement Phase 1 → démo pour Ana Fuentes Navarro.
