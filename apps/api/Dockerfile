# Micro-backend de decks (codes courts) — voir SPEC.md §4 et §7.
# Petite image Debian (plutôt qu'Alpine) pour des binaires prêts à l'emploi
# de better-sqlite3 sans compilation native.
FROM node:22-bookworm-slim

WORKDIR /app

# Copie ciblée des manifests d'abord pour profiter du cache Docker.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci --workspace=@budget-game/api --include-workspace-root

COPY packages/shared packages/shared
COPY apps/api apps/api

WORKDIR /app/apps/api

ENV NODE_ENV=production
ENV PORT=8787
ENV DB_PATH=/data/decks.sqlite

VOLUME ["/data"]
EXPOSE 8787

CMD ["npx", "tsx", "src/index.ts"]
