import { afterEach, describe, expect, it, vi } from "vitest";
import type { Deck } from "@budget-game/shared";
import { fetchDeckByCode, publishDeck, updateDeck } from "./api";

function sampleDeck(overrides: Partial<Deck> = {}): Deck {
  return {
    version: 1,
    id: "d1",
    title: "Un mois ordinaire",
    currency: "€",
    defaultVisibility: "hidden",
    budget: { kind: "suggested", amount: 150 },
    shuffle: false,
    cards: [{ id: "c1", kind: "decision", text: "Une situation", cost: 9, category: "Alimentation" }],
    ...overrides,
  };
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("publishDeck", () => {
  it("retourne { code, editKey } sur une réponse 201", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ code: "MK7PA", editKey: "secret" }, { status: 201 })),
    );
    const result = await publishDeck(sampleDeck());
    expect(result).toEqual({ code: "MK7PA", editKey: "secret" });
  });

  it("envoie le deck en POST JSON à /api/decks", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ code: "MK7PA", editKey: "secret" }, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const deck = sampleDeck();
    await publishDeck(deck);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/decks",
      expect.objectContaining({ method: "POST", body: JSON.stringify(deck) }),
    );
  });

  it("lève une erreur si la réponse n'est pas ok", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("bad", { status: 400 })));
    await expect(publishDeck(sampleDeck())).rejects.toThrow();
  });

  it("laisse remonter une erreur réseau (pas de fetch réussi)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    await expect(publishDeck(sampleDeck())).rejects.toThrow("network down");
  });
});

describe("updateDeck", () => {
  it("retourne true sur une réponse ok", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ ok: true })));
    expect(await updateDeck("MK7PA", "secret", sampleDeck())).toBe(true);
  });

  it("retourne false si le serveur refuse (editKey incorrecte)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("forbidden", { status: 403 })));
    expect(await updateDeck("MK7PA", "mauvaise", sampleDeck())).toBe(false);
  });
});

describe("fetchDeckByCode", () => {
  it("retourne le deck sur une réponse 200 valide", async () => {
    const deck = sampleDeck();
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(deck)));
    const result = await fetchDeckByCode("MK7PA");
    expect(result).toEqual({ ok: true, deck });
  });

  it("retourne reason 'not-found' sur 404", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 404 })));
    expect(await fetchDeckByCode("ZZZZZ")).toEqual({ ok: false, reason: "not-found" });
  });

  it("retourne reason 'network' si fetch lève", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );
    expect(await fetchDeckByCode("MK7PA")).toEqual({ ok: false, reason: "network" });
  });

  it("retourne reason 'invalid' si le corps ne respecte pas le schéma", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ foo: "bar" })));
    expect(await fetchDeckByCode("MK7PA")).toEqual({ ok: false, reason: "invalid" });
  });
});
