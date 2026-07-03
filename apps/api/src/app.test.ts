import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { DEMO_PLAY_CODE, exampleDeck, type Deck } from "@budget-game/shared";
import { createApp } from "./app";
import { createRateLimiter } from "./rateLimit";
import { seedDemoDeck } from "./seedDemoDeck";
import { createStore } from "./store";

function sampleDeck(overrides: Partial<Deck> = {}): Deck {
  return {
    version: 1,
    id: "deck-1",
    title: "Un mois ordinaire",
    currency: "€",
    defaultVisibility: "hidden",
    budget: { kind: "suggested", amount: 150 },
    shuffle: false,
    categories: ["Alimentation"],
    cards: [{ id: "c1", kind: "decision", text: "Une situation", cost: 9, category: "Alimentation" }],
    ...overrides,
  };
}

function makeApp(overrides: { max?: number } = {}) {
  const store = createStore(new Database(":memory:"));
  const rateLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, max: overrides.max ?? 20 });
  return createApp({ store, rateLimiter, allowedOrigin: "*" });
}

describe("GET /api/health", () => {
  it("répond 200", async () => {
    const app = makeApp();
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
  });
});

describe("POST /api/decks", () => {
  it("publie un deck valide et retourne un code + une editKey", async () => {
    const app = makeApp();
    const res = await app.request("/api/decks", {
      method: "POST",
      body: JSON.stringify(sampleDeck()),
      headers: { "content-type": "application/json" },
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as { code: string; editKey: string };
    expect(body.code).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}$/);
    expect(typeof body.editKey).toBe("string");
  });

  it("rejette un deck invalide avec 400", async () => {
    const app = makeApp();
    const res = await app.request("/api/decks", {
      method: "POST",
      body: JSON.stringify({ foo: "bar" }),
      headers: { "content-type": "application/json" },
    });
    expect(res.status).toBe(400);
  });

  it("rejette un JSON malformé avec 400", async () => {
    const app = makeApp();
    const res = await app.request("/api/decks", {
      method: "POST",
      body: "{ceci n'est pas du json",
      headers: { "content-type": "application/json" },
    });
    expect(res.status).toBe(400);
  });

  it("rejette une charge utile trop volumineuse avec 413", async () => {
    const app = makeApp();
    const bigCard = {
      id: "c1",
      kind: "decision",
      text: "x".repeat(300 * 1024),
      cost: 1,
      category: "Test",
    };
    const res = await app.request("/api/decks", {
      method: "POST",
      body: JSON.stringify(sampleDeck({ cards: [bigCard as never] })),
      headers: { "content-type": "application/json" },
    });
    expect(res.status).toBe(413);
  });

  it("applique le rate limit par IP (x-forwarded-for)", async () => {
    const app = makeApp({ max: 1 });
    const headers = { "content-type": "application/json", "x-forwarded-for": "1.2.3.4" };

    const first = await app.request("/api/decks", { method: "POST", body: JSON.stringify(sampleDeck()), headers });
    expect(first.status).toBe(201);

    const second = await app.request("/api/decks", { method: "POST", body: JSON.stringify(sampleDeck()), headers });
    expect(second.status).toBe(429);
  });

  it("n'affecte pas le quota d'une autre IP", async () => {
    const app = makeApp({ max: 1 });
    const first = await app.request("/api/decks", {
      method: "POST",
      body: JSON.stringify(sampleDeck()),
      headers: { "content-type": "application/json", "x-forwarded-for": "1.1.1.1" },
    });
    expect(first.status).toBe(201);

    const second = await app.request("/api/decks", {
      method: "POST",
      body: JSON.stringify(sampleDeck()),
      headers: { "content-type": "application/json", "x-forwarded-for": "2.2.2.2" },
    });
    expect(second.status).toBe(201);
  });
});

describe("GET /api/decks/:code", () => {
  async function publish(app: ReturnType<typeof makeApp>, deck: Deck) {
    const res = await app.request("/api/decks", {
      method: "POST",
      body: JSON.stringify(deck),
      headers: { "content-type": "application/json" },
    });
    return (await res.json()) as { code: string; editKey: string };
  }

  it("retourne le deck publié", async () => {
    const app = makeApp();
    const deck = sampleDeck({ title: "Mon atelier" });
    const { code } = await publish(app, deck);

    const res = await app.request(`/api/decks/${code}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(deck);
  });

  it("accepte un code en minuscules", async () => {
    const app = makeApp();
    const { code } = await publish(app, sampleDeck());
    const res = await app.request(`/api/decks/${code.toLowerCase()}`);
    expect(res.status).toBe(200);
  });

  it("retourne 404 pour un code inconnu", async () => {
    const app = makeApp();
    const res = await app.request("/api/decks/ZZZZZ");
    expect(res.status).toBe(404);
  });

  it("retourne 404 pour un code mal formé (mauvaise longueur ou caractère ambigu)", async () => {
    const app = makeApp();
    expect((await app.request("/api/decks/ABC")).status).toBe(404);
    expect((await app.request("/api/decks/AAAA0")).status).toBe(404); // "0" exclu de l'alphabet
  });

  it("retourne le deck d'exemple pour le code réservé TEST (seed)", async () => {
    const db = new Database(":memory:");
    const store = createStore(db);
    seedDemoDeck(store);
    const app = createApp({
      store,
      rateLimiter: createRateLimiter({ windowMs: 60 * 60 * 1000, max: 20 }),
      allowedOrigin: "*",
    });

    const res = await app.request(`/api/decks/${DEMO_PLAY_CODE}`);
    expect(res.status).toBe(200);
    expect((await res.json()).title).toBe(exampleDeck.title);

    const lower = await app.request("/api/decks/test");
    expect(lower.status).toBe(200);
  });
});

describe("PUT /api/decks/:code", () => {
  it("met à jour le deck si editKey correspond", async () => {
    const app = makeApp();
    const publishRes = await app.request("/api/decks", {
      method: "POST",
      body: JSON.stringify(sampleDeck()),
      headers: { "content-type": "application/json" },
    });
    const { code, editKey } = (await publishRes.json()) as { code: string; editKey: string };

    const updated = sampleDeck({ title: "Titre corrigé" });
    const putRes = await app.request(`/api/decks/${code}`, {
      method: "PUT",
      body: JSON.stringify({ editKey, deck: updated }),
      headers: { "content-type": "application/json" },
    });
    expect(putRes.status).toBe(200);

    const getRes = await app.request(`/api/decks/${code}`);
    const getBody = (await getRes.json()) as Deck;
    expect(getBody.title).toBe("Titre corrigé");
  });

  it("refuse avec 403 si editKey est incorrecte", async () => {
    const app = makeApp();
    const publishRes = await app.request("/api/decks", {
      method: "POST",
      body: JSON.stringify(sampleDeck()),
      headers: { "content-type": "application/json" },
    });
    const { code } = (await publishRes.json()) as { code: string };

    const putRes = await app.request(`/api/decks/${code}`, {
      method: "PUT",
      body: JSON.stringify({ editKey: "mauvaise-cle", deck: sampleDeck() }),
      headers: { "content-type": "application/json" },
    });
    expect(putRes.status).toBe(403);
  });

  it("retourne 404 pour un code mal formé", async () => {
    const app = makeApp();
    const res = await app.request("/api/decks/nope", {
      method: "PUT",
      body: JSON.stringify({ editKey: "x", deck: sampleDeck() }),
      headers: { "content-type": "application/json" },
    });
    expect(res.status).toBe(404);
  });
});
