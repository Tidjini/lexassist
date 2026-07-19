# LexAssist — État d'avancement

Dernière mise à jour : 2026-07-19. Complète `docs/PLAN_ACTION.md` (le plan initial) en
donnant une photo de ce qui est réellement fait, testé et déployé à date.

## Fait (Phase 1)

- **Backend** : apps `clients`, `dossiers` (statuts + historique des événements),
  `documents` (upload catégorisé) — CRUD complet, isolation par tenant, 30 tests pytest
  (99 % de couverture sur le nouveau code).
- **Frontend desktop** : pages Clientes / Expedientes / Documentos (liste, détail,
  formulaires), tableau de bord avec compteurs en direct, 10 tests unitaires (Vitest +
  React Testing Library — le frontend n'en avait aucun avant).
- **i18n** : interface en espagnol par défaut (langue du cabinet/client), français
  disponible via le sélecteur de langue (en haut à droite) — les deux sont tenues à jour
  en parallèle à chaque nouvel écran.
- **Déployé** sur le VPS de démo, testé de bout en bout dans un vrai navigateur (pas
  seulement les tests automatisés).

### Accès démo

- URL : http://cabinet-demo.82.165.110.108.nip.io:8090
- Identifiants : `ana@cabinet-demo.es` / `lexassist2026`

## Décisions de périmètre (2026-07-19)

- **Application mobile (`mobile-avocat`)** : reportée. On se concentre sur le desktop
  pour l'instant ; elle sera reprise plus tard, séparément.
- **Alertes** (expiration passeport/NIE, délais requerimiento) : reportées à la **Phase
  2**, en même temps que le pipeline IA. Aujourd'hui il n'existe qu'un compteur
  "requerimientos abiertos" sur le tableau de bord — pas de vraies alertes d'expiration
  (il n'y a même pas de champ de date d'expiration sur les documents pour l'instant).
- **Données de démo** : pas de commande `seed_demo_data`. Le client fournit de vrais
  documents pour un client de test, qui seront uploadés directement via l'app plutôt que
  générés artificiellement.

## Connu comme non vérifié / non fait

- **Design responsive mobile** du desktop : jamais testé sur un écran étroit. Certaines
  vues ont des classes adaptatives (Expedientes), d'autres non (Clientes, Documentos) —
  le tableau (MUI DataGrid) en particulier risque de mal s'afficher en dessous d'une
  certaine largeur.
- Le choix de langue (ES/FR) ne survit pas à un rechargement de page (retombe sur
  espagnol) — pas encore persisté.

## Prochaines étapes (Phase 2, quand on y arrive)

- Alertes d'expiration (passeport, NIE, empadronamiento < 3 mois).
- Pipeline IA documentaire (classification + extraction via Claude vision).
- Notification temps réel (Channels) + écran de validation humaine des données extraites.
