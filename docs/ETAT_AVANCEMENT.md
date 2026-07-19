# LexAssist — État d'avancement

Dernière mise à jour : 2026-07-19 (import en masse + rapprochement IA + WebSocket).
Complète `docs/PLAN_ACTION.md` (le plan initial) en donnant une photo de ce qui est
réellement fait, testé et déployé à date.

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

## Fait (upload sans client — rapprochement/création IA + import en masse + WebSocket)

- **Le client n'est plus obligatoire à l'upload** : conforme au parcours décrit dans la
  proposition initiale (`docs/LexAssist_Presentation_FR.md` §3.1). `procesar_documento`
  tente, une fois l'IA passée, de rattacher le document à un client existant
  (correspondance stricte nom + prénom + numéro de document) ou d'en créer un nouveau si
  les données extraites suffisent ; sinon le document reste « sans client », à traiter à
  la main. Un document rattaché/créé automatiquement par l'IA porte
  `cliente_confirmado=False` tant que l'utilisateur ne l'a pas validé (bouton
  « Confirmar » / « Cambiar cliente » dans l'aperçu du document).
- **Nouvelle page `/documentos/importar`** : dépôt de plusieurs fichiers d'un coup (upload
  concurrent limité à 3), barre de progression, résumé final (assignés / créés / sans
  classer), liste cliquable des documents sans classer.
- **Client WebSocket branché** (`useNotificacionesSocket`) : le panneau de notifications
  reçoit maintenant les événements en temps réel (en plus du polling 15s existant),
  connecté au consumer Channels déjà présent côté serveur.
- Le flux classique (choisir un client puis uploader depuis sa fiche) reste inchangé et
  continue de fonctionner à l'identique — les deux approches coexistent.
- **Toujours limité par l'absence de clé `ANTHROPIC_API_KEY`** : sans elle, chaque document
  importé finit systématiquement en « sans classer » (l'IA n'a pas pu extraire de nom/
  numéro) — comportement attendu, pas un bug. Une fois la clé configurée, le
  rapprochement/la création automatique fonctionneront pour de vrai sans changement de
  code.

### Accès démo

- URL : http://cabinet-demo.82.165.110.108.nip.io:8090
- Identifiants : `ana@cabinet-demo.es` / `lexassist2026`

## Décisions de périmètre

- **Application mobile (`mobile-avocat`)** : reportée, séparément du reste (décision du
  2026-07-19). Toujours pas commencée.
- **Données de démo** : pas de commande `seed_demo_data` — le client fournit de vrais
  documents pour un client de test, uploadés directement via l'app.

## Connu comme non fait

- Pas de worker Celery déployé (voir note technique ci-dessus) — bloquant uniquement le
  jour où le volume justifiera de sortir du mode synchrone.
- « Marquer le dossier complet » (checklist de pièces manquantes par démarche) : reporté
  à la Phase 3, décision explicite du 2026-07-19.
- Catalogue des procédures/trámites, génération de formulaires officiels (Phase 3) : pas
  commencés.

## Prochaines étapes possibles

- Configurer `ANTHROPIC_API_KEY` pour activer le pipeline IA pour de vrai.
- Phase 3 : catalogue des trámites + checklists, génération de formulaires (EX, taxes 790).
- Application mobile (`mobile-avocat`).
