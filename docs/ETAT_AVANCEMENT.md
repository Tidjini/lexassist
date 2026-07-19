# LexAssist — État d'avancement

Dernière mise à jour : 2026-07-19 (mode simulé — tester la procédure sans clé API).
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

## Fait (refonte visuelle + corrections d'usage)

- **Design system appliqué** : les couleurs par module (clients/expedientes/documentos/
  alertas), jusque-là définies dans le code sans être utilisées, sont maintenant visibles
  partout (icônes, avatars à initiales, tableaux avec bordure/ombre au lieu de grilles
  brutes). Nettoyage des outils de démo du template Fuse (recherche, plein écran,
  personnalisateur de thème) sans usage pour ce cabinet. Corrections i18n (page de
  connexion entièrement en anglais codé en dur, lien « mot de passe oublié » mort).
- **Fiches client et dossier en onglets** : au lieu de renvoyer vers des listes séparées,
  les expedientes/documents d'un client (et les documents d'un dossier) s'affichent
  directement sur place.
- **Bug de cache corrigé** : les compteurs et statuts qui restaient figés jusqu'au
  rechargement manuel de la page (ex. « Expedientes (0) » alors qu'un dossier vient d'être
  créé) — cause racine identifiée et corrigée (clé de cache React Query mal construite).
- **Upload multi-fichiers**, notifications cliquables (renvoient vers le document concerné)
  et supprimables par l'utilisateur.
- Deux ajustements visuels mineurs (rayon des coins des tableaux, taille des icônes de
  fichier) suite aux retours de Lucia.

## Fait (Phase 4 — Assistant conversationnel, structure sans clé API)

- **Décision du 2026-07-19** : la Phase 3 (catalogue des trámites, checklists, génération
  de formulaires) est repoussée en backlog, non abandonnée. On passe directement à la
  Phase 4 du plan initial (`docs/PLAN_ACTION.md` §4 — Assistant), sans le volet
  `mobile-avocat`/vocal qui y était rattaché (mobile toujours différé).
- **Nouvelle app `apps/assistant`** : `Conversacion`/`Mensaje` (une conversation par
  utilisateur), 4 outils Claude (tool use) branchés sur les données réelles du cabinet —
  `buscar_clientes`, `listar_expedientes`, `documentos_por_expirar` (même logique que
  la page Alertas), `agregar_nota_expediente` (écrit dans `Dossier.notes`). Boucle
  tool-use complète côté serveur (`apps/assistant/service.py`), jusqu'à 5 aller-retours
  avant réponse finale.
- **Nouvelle page `/asistente`** : interface de chat (bulles utilisateur/assistant),
  historique persistant, état dégradé propre si la clé manque (même pattern que le
  pipeline documentaire : le message de l'utilisateur est quand même enregistré, seule la
  réponse manque, avec un message explicite au lieu d'un blocage silencieux).
- **Différence importante avec les phases précédentes** : contrairement au pipeline
  documentaire (qui peut tourner « à vide » et rester démontrable), un assistant
  conversationnel sans clé Anthropic n'a **rien à démontrer** — la mécanique (recherche
  d'outils, boucle de dispatch, persistance) est testée unitairement à fond côté serveur
  (25 tests, y compris la boucle tool-use avec client Anthropic simulé) et vérifiée en
  navigateur réel pour le chemin « sans clé », mais **les réponses de l'IA elles-mêmes
  n'ont pas pu être testées** faute de clé.
- Décision explicite de l'utilisateur (2026-07-19) : construire la structure maintenant
  sans clé plutôt que d'attendre — la clé pourra être ajoutée plus tard sans changement de
  code (même mécanisme que Phase 2).

## Fait (mode simulé — `IA_MODO_SIMULADO`, tester la procédure sans clé API)

- **Interrupteur explicite** (`IA_MODO_SIMULADO=True` dans `.env`, **jamais activé
  automatiquement** même en l'absence de clé — décision explicite de l'utilisateur, pour
  ne jamais changer le comportement du reste de la démo sans le vouloir). Pensé pour
  tester toute la procédure — classification, rapprochement/création de client, alertes,
  assistant — avec des documents fictifs, sans appeler Claude.
- **Documents** : `apps.documents.vision.analizar_documento_simulado` fabrique un
  résultat à partir du nom du fichier (convention libre : `Nombre_Apellidos_CATEGORIE_
  AAAA-MM-JJ.ext`, ex. `Maria_Garcia_NIE_X1234567A.jpg`). Sans date explicite, les
  catégories qui expirent habituellement (passeport, NIE, DNI, empadronamiento) reçoivent
  une échéance à J+45 pour peupler la page Alertas. Le document obtient un nouvel état
  `estado_ia=SIMULADO` (jamais confondu avec `COMPLETADO`, une vraie analyse) — badge
  violet distinct dans l'interface. Le rapprochement/la création de client tourne
  ensuite normalement, avec les mêmes règles strictes que le vrai pipeline.
- **Assistant** : reconnaissance de mots-clés simple (`documentos_por_expirar`,
  `buscar_clientes`, `listar_expedientes` reconnus par des mots comme « caduca »,
  « busca cliente », « expedientes ») qui appelle un vrai outil sur les vraies données ;
  réponse toujours préfixée par « [Modo simulado] ».
- Vérifié en navigateur réel de bout en bout : import d'un document fictif → catégorie
  extraite, client créé automatiquement, apparaît dans Alertas avec sa date d'échéance ;
  question à l'assistant sur les documents proches d'expirer → réponse correcte utilisant
  les vraies données.

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
- Catalogue des procédures/trámites, checklist « dossier complet », génération de
  formulaires officiels (contenu de la Phase 3 originale) : en backlog, reporté après la
  Phase 4, décision explicite du 2026-07-19.
- L'assistant conversationnel (Phase 4) n'a jamais réellement répondu — aucune clé
  `ANTHROPIC_API_KEY` n'a encore été testée dessus.

## Prochaines étapes possibles

- Configurer une vraie `ANTHROPIC_API_KEY` pour activer le pipeline IA (Phase 2) **et**
  l'assistant (Phase 4) pour de vrai — aucun changement de code requis dans les deux cas.
- Backlog Phase 3 : catalogue des trámites + checklists, génération de formulaires
  (EX, taxes 790).
- Application mobile (`mobile-avocat`).
