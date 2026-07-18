# Env de test/démo — VPS IONOS (82.165.110.108)

Environnement de démonstration et de test hébergé sur le VPS, sur le modèle de
schoolavia (`/srv/schoolavia-demo`). Le port 80 n'est **jamais** utilisé : le
VPS héberge plusieurs projets. LexAssist utilise les ports **8090/8091**
(schoolavia occupe 8080/8081, daphne 8001, redis db 0/1).

## URLs

| Quoi | URL |
|---|---|
| Desktop (cabinet démo) | http://cabinet-demo.82.165.110.108.nip.io:8090 |
| Mobile avocat | http://cabinet-demo.82.165.110.108.nip.io:8091 |
| API / admin Django | http://cabinet-demo.82.165.110.108.nip.io:8090/api/ et /admin/ |

`nip.io` est un DNS joker public : `*.82.165.110.108.nip.io` résout vers le
VPS — indispensable car django-tenants route les cabinets par nom d'hôte.
Les builds sont host-agnostiques (API same-origin via `window.location.origin`),
donc chaque hôte enregistré comme Domain du tenant démo fonctionne aussi :

- IP publique : http://82.165.110.108:8090 (et :8091)
- Tailscale : http://100.88.169.59:8090 (et :8091)

⚠️ **Pare-feu IONOS** : en plus d'ufw, le pare-feu réseau IONOS (panneau
cloud, indépendant du VPS) doit autoriser TCP 8090-8091, sinon l'accès public
est bloqué (seul Tailscale passe).

## Architecture

- `/srv/lexassist-demo/app` — clone GitHub (source de vérité)
- `/srv/lexassist-demo/venv` — venv Python
- Base `lexassist_demo`, redis db 2
- daphne (systemd `lexassist-demo`) sur 127.0.0.1:8002
- nginx : 8090 → build desktop + proxy /api /ws /admin /static /media ;
  8091 → build mobile-avocat + mêmes proxys. Same-origin ⇒ pas de CORS, et le
  Host transmis fait fonctionner le routage tenant tel quel.

## Procédures

- **Bootstrap (une fois)** : `bash deploy/vps-demo/bootstrap.sh` puis créer
  `.env` depuis `lexassist-demo.env.example` et relancer, enfin `deploy.sh`.
- **Mise à jour** : pousser sur GitHub puis, sur le VPS,
  `bash /srv/lexassist-demo/app/deploy/vps-demo/deploy.sh`.
- **Données de démo** : `seed_demo_data` (clients et documents FICTIFS
  uniquement — jamais de données réelles en phase de tests, cf. proposition §6).
- **Logs** : `journalctl -u lexassist-demo -f` ; nginx : `/var/log/nginx/`.

## Pièges connus (hérités de schoolavia)

- Les builds npm sautent le `tsc` (heap 4 Go > RAM du VPS) — le type-check
  reste du ressort du dev/CI. Un swap de 2 Go est créé au bootstrap (déjà
  présent si schoolavia est bootstrappé).
- daphne ne recharge jamais à chaud : `sudo systemctl restart lexassist-demo`
  après tout changement backend.
- La base démo est jetable : `DROP DATABASE lexassist_demo;` puis relancer le
  bootstrap.
