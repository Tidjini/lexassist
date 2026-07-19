# LexAssist — État d'avancement

Dernière mise à jour : 2026-07-19. Complète `docs/PLAN_ACTION.md` (le plan initial) en
donnant une photo de ce qui est réellement fait, testé et déployé à date.

## Fait (Phase 1)

- **Backend** : apps `clients`, `dossiers` (statuts + historique des événements),
  `documents` (upload catégorisé) — CRUD complet, isolation par tenant.
- **Frontend desktop** : pages Clientes / Expedientes / Documentos (liste, détail,
  formulaires), tableau de bord avec compteurs en direct.
- **i18n** : interface en espagnol par défaut (langue du cabinet/client), français
  disponible via le sélecteur de langue — persiste maintenant entre rechargements
  (localStorage).
- Design responsive vérifié (390px) sur Clientes/Documentos (colonnes secondaires
  masquées, en-têtes qui s'empilent).

## Fait (Phase 2 — pipeline IA, alertes, notifications)

- **Classification + extraction IA** (`apps/documents/vision.py` + `tasks.py`) : à chaque
  upload, un appel structuré à Claude vision détermine la catégorie et extrait les
  champs (nom, numéro de document, dates…). **Pas encore de clé `ANTHROPIC_API_KEY`
  configurée** — chaque document se retrouve donc en statut « IA no configurada », ce qui
  est le comportement attendu tant que la clé n'est pas fournie. Dès qu'elle le sera
  (dans `.env`, aucune modification de code requise), le pipeline tournera pour de vrai.
- **Écran de validation humaine** : dans l'aperçu d'un document, les champs extraits par
  l'IA s'affichent avec des cases à cocher — l'utilisateur choisit lesquels appliquer à
  la fiche client (jamais d'écrasement automatique).
- **Alertes d'expiration** : nouvelle page Alertas + tuile sur le tableau de bord,
  listant les documents dont la date d'expiration (`fecha_expiracion`, modifiable à la
  main tant que l'IA ne la renseigne pas) tombe dans les 90 jours.
- **Notifications** : panneau cloche dans la barre d'outils (polling 15s) ; le serveur
  pousse aussi en temps réel sur WebSocket (`apps.notifications.consumers`) mais aucun
  client WebSocket n'est encore branché côté frontend pour cette passe.
- **Note technique** : aucun worker Celery n'est déployé (ni en local, ni sur le VPS) —
  `CELERY_TASK_ALWAYS_EAGER=True` fait tourner les tâches en synchrone dans la requête.
  Le code reste écrit comme de vraies tâches Celery ; passer à un vrai worker
  asynchrone plus tard ne demandera qu'un changement de variable d'environnement + un
  service systemd, sans toucher au code.
- Corrigé au passage : `config/__init__.py` n'important jamais l'app Celery (bug
  hérité du squelette initial, qui faisait que `@shared_task` se liait à un broker
  RabbitMQ par défaut au lieu des settings Django/Redis).

### Accès démo

- URL : http://cabinet-demo.82.165.110.108.nip.io:8090
- Identifiants : `ana@cabinet-demo.es` / `lexassist2026`

## Décisions de périmètre

- **Application mobile (`mobile-avocat`)** : reportée, séparément du reste (décision du
  2026-07-19). Toujours pas commencée.
- **Données de démo** : pas de commande `seed_demo_data` — le client fournit de vrais
  documents pour un client de test, uploadés directement via l'app.

## Connu comme non fait

- Pas de client WebSocket côté frontend (notifications en polling seulement pour
  l'instant — le serveur est prêt).
- Pas de worker Celery déployé (voir note technique ci-dessus) — bloquant uniquement le
  jour où le volume justifiera de sortir du mode synchrone.
- Catalogue des procédures/trámites, génération de formulaires officiels (Phase 3) : pas
  commencés.

## Prochaines étapes possibles

- Configurer `ANTHROPIC_API_KEY` pour activer le pipeline IA pour de vrai.
- Phase 3 : catalogue des trámites + checklists, génération de formulaires (EX, taxes 790).
- Application mobile (`mobile-avocat`).
