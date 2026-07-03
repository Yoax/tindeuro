import Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";
import type { Deck } from "@budget-game/shared";
import { CODE_LENGTH } from "./codes";
import { createStore, type DeckStore } from "./store";

function sampleDeck(overrides: Partial<Deck> = {}): Deck {
  return {
    version: 1,
    id: "deck-1",
    title: "Un mois ordinaire",
    currency: "€",
    defaultVisibility: "hidden",
    budget: { kind: "suggested", amount: 150 },
    shuffle: false,
    cards: [
      { id: "c1", kind: "decision", text: "Une situation", cost: 9, category: "Alimentation" },
    ],
    ...overrides,
  };
}

let store: DeckStore;

beforeEach(() => {
  const db = new Database(":memory:");
  store = createStore(db);
});

describe("createDeck", () => {
  it("retourne un code de la bonne longueur et une editKey non vide", () => {
    const { code, editKey } = store.createDeck(sampleDeck());
    expect(code).toHaveLength(CODE_LENGTH);
    expect(editKey.length).toBeGreaterThan(10);
  });

  it("génère des codes et des editKeys différents pour deux decks", () => {
    const a = store.createDeck(sampleDeck());
    const b = store.createDeck(sampleDeck());
    expect(a.code).not.toBe(b.code);
    expect(a.editKey).not.toBe(b.editKey);
  });
});

describe("getDeck", () => {
  it("relit exactement le deck créé", () => {
    const deck = sampleDeck({ title: "Mon atelier" });
    const { code } = store.createDeck(deck);
    expect(store.getDeck(code)).toEqual(deck);
  });

  it("retourne null pour un code inconnu", () => {
    expect(store.getDeck("ZZZZZ")).toBeNull();
  });

  it("rafraîchit la date de dernier accès à chaque lecture", () => {
    const { code } = store.createDeck(sampleDeck(), 1000);
    store.getDeck(code, 2000);
    // Un GET juste avant la rétention à 1000 ne doit plus purger le deck,
    // puisque son dernier accès a été rafraîchi à 2000.
    expect(store.pruneOlderThan(1500)).toBe(0);
    expect(store.getDeck(code, 3000)).not.toBeNull();
  });
});

describe("updateDeck", () => {
  it("met à jour le deck si editKey correspond, le code reste valable", () => {
    const { code, editKey } = store.createDeck(sampleDeck());
    const updated = sampleDeck({ title: "Titre corrigé" });
    expect(store.updateDeck(code, editKey, updated)).toBe(true);
    expect(store.getDeck(code)?.title).toBe("Titre corrigé");
  });

  it("refuse la mise à jour si editKey est incorrecte", () => {
    const { code } = store.createDeck(sampleDeck());
    expect(store.updateDeck(code, "mauvaise-cle", sampleDeck({ title: "Piraté" }))).toBe(false);
    expect(store.getDeck(code)?.title).toBe("Un mois ordinaire");
  });

  it("refuse la mise à jour pour un code inconnu", () => {
    expect(store.updateDeck("ZZZZZ", "peu-importe", sampleDeck())).toBe(false);
  });
});

describe("pruneOlderThan", () => {
  it("supprime uniquement les decks non consultés depuis la coupure", () => {
    const old = store.createDeck(sampleDeck(), 1000);
    const recent = store.createDeck(sampleDeck(), 5000);

    const deleted = store.pruneOlderThan(3000);

    expect(deleted).toBe(1);
    expect(store.getDeck(old.code)).toBeNull();
    expect(store.getDeck(recent.code)).not.toBeNull();
  });
});
