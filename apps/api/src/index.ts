import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { serve } from "@hono/node-server";
import Database from "better-sqlite3";
import { createApp } from "./app";
import { createRateLimiter } from "./rateLimit";
import { startRetentionSchedule } from "./retention";
import { createStore } from "./store";
import { seedDemoDeck } from "./seedDemoDeck";

const PORT = Number(process.env.PORT ?? 8787);
const DB_PATH = process.env.DB_PATH ?? "./data/decks.sqlite";
const ALLOWED_ORIGIN = process.env.FRONT_ORIGIN ?? "*";
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX ?? 20);
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60 * 60 * 1000);

mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

const store = createStore(db);
seedDemoDeck(store);
const rateLimiter = createRateLimiter({ windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX });
const stopRetention = startRetentionSchedule(store);

const app = createApp({ store, rateLimiter, allowedOrigin: ALLOWED_ORIGIN });

const server = serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`budget-game api sur http://localhost:${info.port}`);
});

function shutdown() {
  stopRetention();
  server.close();
  db.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
