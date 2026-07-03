import { describe, expect, it } from "vitest";
import { deckSchema, type Card, type Deck } from "@budget-game/shared";
import {
  DRAFT_STORAGE_KEY,
  addOrReplaceCard,
  createBlankDeck,
  createBlankDraftState,
  duplicateCardById,
  loadDraft,
  moveCardById,
  removeCardById,
  saveDraft,
  type DraftState,
  type DraftStorage,
} from "./deckDraft";

function fakeStorage(initial: Record<string, string> = {}): DraftStorage {
  const store = { ...initial };
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => {
      store[key] = value;
    },
  };
}

function card(overrides: Partial<Card> = {}): Card {
  return {
    id: "a",
    kind: "decision",
    text: "Une situation",
    cost: 10,
    category: "Alimentation",
    ...overrides,
  };
}

describe("createBlankDeck", () => {
  it("produit un deck vide valide, jouable dès qu'on lui ajoute des cartes", () => {
    const deck = createBlankDeck();
    expect(deck.title).toBe("");
    expect(deck.cards).toEqual([]);
    expect(deck.budget).toEqual({ kind: "free" });
  });

  it("génère un id différent à chaque appel", () => {
    expect(createBlankDeck().id).not.toBe(createBlankDeck().id);
  });
});

describe("loadDraft / saveDraft", () => {
  it("retourne null si rien n'est stocké", () => {
    expect(loadDraft(fakeStorage())).toBeNull();
  });

  it("relit exactement ce qui a été sauvegardé", () => {
    const storage = fakeStorage();
    const state = createBlankDraftState();
    saveDraft(storage, state);
    expect(loadDraft(storage)).toEqual(state);
  });

  it("accepte un brouillon avec un titre vide (schéma assoupli)", () => {
    const storage = fakeStorage();
    saveDraft(storage, createBlankDraftState());
    const loaded = loadDraft(storage);
    expect(loaded).not.toBeNull();
    expect(loaded?.deck.title).toBe("");
  });

  it("conserve le code et l'editKey d'un deck déjà publié", () => {
    const storage = fakeStorage();
    const state: DraftState = { deck: createBlankDeck(), publishedAs: { code: "MK7PA", editKey: "secret" } };
    saveDraft(storage, state);
    expect(loadDraft(storage)?.publishedAs).toEqual({ code: "MK7PA", editKey: "secret" });
  });

  it("retourne null si le contenu stocké n'est pas un JSON valide", () => {
    const storage = fakeStorage({ [DRAFT_STORAGE_KEY]: "{not json" });
    expect(loadDraft(storage)).toBeNull();
  });

  it("retourne null si le contenu stocké ne respecte pas le schéma", () => {
    const storage = fakeStorage({ [DRAFT_STORAGE_KEY]: JSON.stringify({ foo: "bar" }) });
    expect(loadDraft(storage)).toBeNull();
  });

  it("n'explose pas si setItem lève (quota dépassé, navigation privée…)", () => {
    const storage: DraftStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota exceeded");
      },
    };
    expect(() => saveDraft(storage, createBlankDraftState())).not.toThrow();
  });
});

describe("addOrReplaceCard", () => {
  it("ajoute une nouvelle carte à la fin", () => {
    const cards = addOrReplaceCard([card({ id: "a" })], card({ id: "b" }));
    expect(cards.map((c) => c.id)).toEqual(["a", "b"]);
  });

  it("remplace la carte existante à sa place, sans changer l'ordre", () => {
    const cards = addOrReplaceCard(
      [card({ id: "a" }), card({ id: "b" }), card({ id: "c" })],
      card({ id: "b", text: "modifiée" }),
    );
    expect(cards.map((c) => c.id)).toEqual(["a", "b", "c"]);
    expect(cards[1].text).toBe("modifiée");
  });
});

describe("removeCardById", () => {
  it("retire uniquement la carte visée", () => {
    const cards = removeCardById([card({ id: "a" }), card({ id: "b" })], "a");
    expect(cards.map((c) => c.id)).toEqual(["b"]);
  });
});

describe("duplicateCardById", () => {
  it("insère une copie juste après l'originale, avec un id différent", () => {
    const cards = duplicateCardById([card({ id: "a" }), card({ id: "b" })], "a");
    expect(cards).toHaveLength(3);
    expect(cards[0].id).toBe("a");
    expect(cards[1].id).not.toBe("a");
    expect(cards[1].text).toBe(cards[0].text);
    expect(cards[2].id).toBe("b");
  });

  it("ne fait rien si l'id est inconnu", () => {
    const cards = [card({ id: "a" })];
    expect(duplicateCardById(cards, "inconnu")).toBe(cards);
  });
});

describe("moveCardById", () => {
  const cards = [card({ id: "a" }), card({ id: "b" }), card({ id: "c" })];

  it("échange avec la carte précédente", () => {
    expect(moveCardById(cards, "b", "up").map((c) => c.id)).toEqual(["b", "a", "c"]);
  });

  it("échange avec la carte suivante", () => {
    expect(moveCardById(cards, "b", "down").map((c) => c.id)).toEqual(["a", "c", "b"]);
  });

  it("ne fait rien en dehors des bornes", () => {
    expect(moveCardById(cards, "a", "up")).toBe(cards);
    expect(moveCardById(cards, "c", "down")).toBe(cards);
  });
});

describe("scénario complet : deck vide -> quelques cartes -> deck rejouable", () => {
  it("reste conforme au schéma zod à chaque étape utile", () => {
    let deck: Deck = createBlankDeck();
    deck = { ...deck, title: "Mon atelier", cards: addOrReplaceCard(deck.cards, card()) };
    const parsed = deckSchema.safeParse(deck);
    expect(parsed.success).toBe(true);
  });
});
