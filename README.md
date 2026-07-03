# Un mois ordinaire — jeu d'éducation budgétaire

Jeu web utilisé en atelier d'éducation budgétaire. Voir la spécification complète dans [`SPEC.md`](./SPEC.md).

## Structure du monorepo

```
apps/
  web/       → SPA Vite + React + TypeScript (front, joueur + animateur)
  api/       → backend optionnel de decks (codes courts), Node + Hono (à venir)
packages/
  shared/    → types Deck/Card + schémas zod partagés entre web et api
```

## Démarrage

```bash
npm install
npm run dev     # lance apps/web (http://localhost:5173)
npm run build   # build de production de apps/web
npm run test    # tests de tous les workspaces
```

## État d'avancement

Voir le plan de build en [`SPEC.md` §9](./SPEC.md#9-plan-de-build-ordre-des-sessions-cursor). Étape en cours : **1. Scaffold monorepo** — terminée.
