# apps/api

Micro-backend de decks (codes courts) — voir `SPEC.md` §4 et §7. Son seul
rôle : stocker des decks (contenu pédagogique) et les servir par un code
court à 5 caractères. Aucune donnée de joueur, aucun compte, aucun cookie.

## Routes

```
GET  /api/health         → 200 { ok: true }
POST /api/decks          body: Deck (JSON, validé zod, 256 Ko max)
                          → 201 { code, editKey } | 400 | 413 | 429
GET  /api/decks/:code     → 200 Deck | 404
PUT  /api/decks/:code    body: { editKey, deck }
                          → 200 { ok: true } | 400 | 403 | 404
```

- **Codes** : 5 caractères, alphabet sans ambiguïté (`23456789ABCDEFGHJKMNPQRSTUVWXYZ`, pas de 0/O/1/I/L).
- **editKey** : secret aléatoire renvoyé à la création, à conserver côté animateur (localStorage du front) pour corriger le deck plus tard sans changer de code.
- **Rétention** : un deck non consulté depuis 180 jours est supprimé par un balayage interne (toutes les 24h). Chaque GET rafraîchit la date de dernier accès.
- **Rate limit** : 20 POST/h par IP (`x-forwarded-for`, à faire suivre par le reverse proxy). Pas d'authentification en v1 — c'est la seule barrière.

## Développement local

```bash
npm install
npm run dev --workspace=apps/api     # http://localhost:8787, SQLite dans ./data/decks.sqlite
npm run test --workspace=apps/api    # Vitest, base SQLite en mémoire
```

Variables d'environnement (toutes optionnelles) :

| Variable | Défaut | Rôle |
|---|---|---|
| `PORT` | `8787` | Port d'écoute |
| `DB_PATH` | `./data/decks.sqlite` | Fichier SQLite |
| `FRONT_ORIGIN` | `*` | Origine autorisée en CORS (domaine du front en production) |
| `RATE_LIMIT_MAX` | `20` | Nombre de POST autorisés par IP et par fenêtre |
| `RATE_LIMIT_WINDOW_MS` | `3600000` (1h) | Durée de la fenêtre de rate limit |

## Déploiement

`Dockerfile` fournit une image autonome (Node + better-sqlite3, exécutée
via `tsx`, pas d'étape de build séparée — cohérent avec l'esprit « petit
service remplaçable » de la spec). `Caddyfile.example` montre comment
router `/api/*` vers ce conteneur et servir le front statique sur le
même domaine (donc sans CORS exotique en prod). `docker-compose.example.yml`
à la racine assemble les deux pour un essai local :

```bash
npm run build --workspace=apps/web
docker compose -f docker-compose.example.yml up --build
```

Le frontend fonctionne intégralement sans ce backend (repli automatique
sur le deck auto-porteur dans l'URL, voir `apps/web/src/lib/deckCodec.ts`).
