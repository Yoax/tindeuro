import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { deckSchema } from "@budget-game/shared";
import { CODE_ALPHABET, CODE_LENGTH } from "./codes";
import type { DeckStore } from "./store";
import type { RateLimiter } from "./rateLimit";

/**
 * Micro-service de decks (codes courts) — voir SPEC.md §4. Aucune donnée
 * de joueur : uniquement du contenu pédagogique (le deck).
 *
 * `createApp` reçoit ses dépendances (store, rate limiter, origine CORS)
 * en paramètres pour rester testable sans démarrer de vrai serveur HTTP
 * (voir `app.test.ts`, qui appelle `app.request(...)` directement).
 */

const MAX_PAYLOAD_BYTES = 256 * 1024;
const CODE_PATTERN = new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`);

const putBodySchema = z.object({
  editKey: z.string().min(1),
  deck: deckSchema,
});

export interface AppDeps {
  store: DeckStore;
  rateLimiter: RateLimiter;
  /** Origine autorisée pour CORS (domaine du front), ou "*" en développement. */
  allowedOrigin: string;
}

function clientIp(c: Context): string {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return "unknown";
}

function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

async function readJsonBody(c: Context): Promise<{ ok: true; data: unknown } | { ok: false; response: Response }> {
  const raw = await c.req.text();
  if (byteLength(raw) > MAX_PAYLOAD_BYTES) {
    return { ok: false, response: c.json({ error: "Deck trop volumineux (256 Ko max)." }, 413) };
  }
  try {
    return { ok: true, data: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false, response: c.json({ error: "JSON invalide." }, 400) };
  }
}

export function createApp({ store, rateLimiter, allowedOrigin }: AppDeps) {
  const app = new Hono();

  app.use("/api/*", cors({ origin: allowedOrigin, allowMethods: ["GET", "POST", "PUT", "OPTIONS"] }));

  app.get("/api/health", (c) => c.json({ ok: true }));

  app.post("/api/decks", async (c) => {
    if (!rateLimiter.check(clientIp(c))) {
      return c.json({ error: "Trop de decks publiés récemment. Réessaie dans un moment." }, 429);
    }

    const body = await readJsonBody(c);
    if (!body.ok) return body.response;

    const result = deckSchema.safeParse(body.data);
    if (!result.success) {
      return c.json({ error: "Deck invalide.", issues: result.error.issues }, 400);
    }

    const { code, editKey } = store.createDeck(result.data);
    return c.json({ code, editKey }, 201);
  });

  app.get("/api/decks/:code", (c) => {
    const code = c.req.param("code").toUpperCase();
    if (!CODE_PATTERN.test(code)) {
      return c.json({ error: "Code introuvable." }, 404);
    }

    const deck = store.getDeck(code);
    if (!deck) return c.json({ error: "Code introuvable." }, 404);
    return c.json(deck, 200);
  });

  app.put("/api/decks/:code", async (c) => {
    const code = c.req.param("code").toUpperCase();
    if (!CODE_PATTERN.test(code)) {
      return c.json({ error: "Code introuvable." }, 404);
    }

    const body = await readJsonBody(c);
    if (!body.ok) return body.response;

    const result = putBodySchema.safeParse(body.data);
    if (!result.success) {
      return c.json({ error: "Requête invalide.", issues: result.error.issues }, 400);
    }

    const updated = store.updateDeck(code, result.data.editKey, result.data.deck);
    if (!updated) return c.json({ error: "Code ou clé d'édition incorrects." }, 403);
    return c.json({ ok: true }, 200);
  });

  return app;
}
