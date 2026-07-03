# apps/api

Placeholder. Implémenté à l'étape 7 du plan de build (voir `SPEC.md` §7 et §9) :

- Node + Hono + better-sqlite3
- Routes `POST /api/decks`, `GET /api/decks/:code`, `PUT /api/decks/:code`
- Génération de codes courts, rétention, rate limiting
- Validation zod partagée via `@budget-game/shared`
