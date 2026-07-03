# Tindeuro — jeu d'éducation budgétaire

Jeu web utilisé en atelier d'éducation budgétaire : swipe tes dépenses, découvre l'écart avec ton enveloppe. Voir la spécification complète dans [`SPEC.md`](./SPEC.md).

## Structure du monorepo

```
apps/
  web/       → SPA Vite + React + TypeScript (front, joueur + animateur)
  api/       → backend optionnel de decks (codes courts), Node + Hono + SQLite
packages/
  shared/    → types Deck/Card + schémas zod partagés entre web et api
```

## Démarrage

```bash
npm install
npm run dev     # lance apps/web (http://localhost:5173)
npm run build   # build de production de apps/web
npm run test    # tests de tous les workspaces

npm run dev --workspace=apps/api    # backend optionnel (http://localhost:8787)
```

Le front fonctionne intégralement sans le backend (repli automatique sur
le lien auto-porteur). Voir [`apps/api/README.md`](./apps/api/README.md)
pour les routes, variables d'environnement et le déploiement Docker/Caddy.

## État d'avancement

Voir le plan de build en [`SPEC.md` §9](./SPEC.md#9-plan-de-build-ordre-des-sessions-cursor). Étapes terminées : **1 à 9** (scaffold, noyau partagé, mode joueur, révélation, swipe façon Tinder, éditeur, backend, partage hybride, polish).
