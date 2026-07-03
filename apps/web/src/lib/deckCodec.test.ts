import { describe, expect, it } from "vitest";
import { compressToEncodedURIComponent } from "lz-string";
import type { Card, Deck } from "@budget-game/shared";
import { decodeDeckFromFragment, encodeDeckToFragment, expandDeck, minifyDeck } from "./deckCodec";
import { exampleDeck } from "../data/exampleDeck";

/**
 * Compare deux decks en ignorant les ids (deck et cartes), régénérés à
 * chaque décodage par conception (voir SPEC.md §4).
 */
function withoutIds(deck: Deck) {
  const { id: _id, cards, ...rest } = deck;
  return {
    ...rest,
    cards: cards.map(({ id: _cardId, ...card }) => card),
  };
}

function makeCard(overrides: Partial<Card> & Pick<Card, "id" | "text" | "cost" | "category">): Card {
  return { kind: "decision", ...overrides };
}

describe("minifyDeck / expandDeck (aller-retour direct, sans compression)", () => {
  it("préserve le contenu du deck d'exemple", () => {
    const roundTripped = expandDeck(minifyDeck(exampleDeck));
    expect(withoutIds(roundTripped)).toEqual(withoutIds(exampleDeck));
  });

  it("gère les trois modes de budget", () => {
    const base: Omit<Deck, "budget"> = { ...exampleDeck, cards: [] };
    const budgets: Deck["budget"][] = [
      { kind: "free" },
      { kind: "suggested", amount: 150 },
      { kind: "fixed", amount: 200 },
    ];

    for (const budget of budgets) {
      const deck: Deck = { ...base, budget };
      const roundTripped = expandDeck(minifyDeck(deck));
      expect(roundTripped.budget).toEqual(budget);
    }
  });

  it("omet les valeurs par défaut dans le format minifié", () => {
    const deck: Deck = {
      version: 1,
      id: "d1",
      title: "Deck minimal",
      currency: "€",
      defaultVisibility: "hidden",
      budget: { kind: "free" },
      shuffle: false,
      cards: [makeCard({ id: "c1", text: "Une dépense.", cost: 10, category: "Maison" })],
    };

    const minified = minifyDeck(deck);

    expect(minified.i).toBeUndefined(); // intro absente
    expect(minified.c).toBeUndefined(); // currency par défaut "€"
    expect(minified.s).toBeUndefined(); // shuffle par défaut false
    expect(minified.q[0].e).toBeUndefined(); // kind "decision" par défaut
    expect(minified.q[0].v).toBeUndefined(); // visibilité héritée
    expect(minified.q[0].a).toBeUndefined(); // tags vides
  });

  it("déduplique les catégories répétées", () => {
    const deck: Deck = {
      version: 1,
      id: "d1",
      title: "Deck",
      currency: "€",
      defaultVisibility: "hidden",
      budget: { kind: "free" },
      shuffle: false,
      cards: [
        makeCard({ id: "c1", text: "A", cost: 5, category: "Alimentation" }),
        makeCard({ id: "c2", text: "B", cost: 6, category: "Alimentation" }),
        makeCard({ id: "c3", text: "C", cost: 7, category: "Transport" }),
      ],
    };

    const minified = minifyDeck(deck);
    expect(minified.g).toEqual(["Alimentation", "Transport"]);
    expect(minified.q.map((c) => c.g)).toEqual([0, 0, 1]);
  });

  it("préserve un événement, une carte récurrente et une visibilité surchargée", () => {
    const deck: Deck = {
      version: 1,
      id: "d1",
      title: "Deck",
      currency: "€",
      defaultVisibility: "hidden",
      budget: { kind: "free" },
      shuffle: true,
      cards: [
        makeCard({
          id: "c1",
          kind: "event",
          text: "Panne.",
          cost: 60,
          category: "Imprévus",
          tags: ["imprevu"],
        }),
        makeCard({
          id: "c2",
          text: "Récurrent.",
          cost: 13,
          category: "Abonnements",
          visibility: "exact",
          recurring: { times: 4, label: "chaque semaine" },
        }),
      ],
    };

    const roundTripped = expandDeck(minifyDeck(deck));
    expect(withoutIds(roundTripped)).toEqual(withoutIds(deck));
  });
});

describe("encodeDeckToFragment / decodeDeckFromFragment (aller-retour complet)", () => {
  it("encode puis décode le deck d'exemple à l'identique (hors ids)", () => {
    const fragment = encodeDeckToFragment(exampleDeck);
    const result = decodeDeckFromFragment(fragment);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(withoutIds(result.deck)).toEqual(withoutIds(exampleDeck));
  });

  it("préserve les caractères accentués et la ponctuation française", () => {
    const deck: Deck = {
      version: 1,
      id: "d1",
      title: "Événement à Noël : réveillon en famille",
      intro: "Écris « bonjour » avec des guillemets français, é è à ç ù œ.",
      currency: "€",
      defaultVisibility: "range",
      budget: { kind: "fixed", amount: 100 },
      shuffle: false,
      cards: [
        makeCard({
          id: "c1",
          text: "Réveillon chez ta belle-mère : elle demande une participation.",
          cost: 25,
          category: "Sorties & social",
          tags: ["pression-sociale"],
        }),
      ],
    };

    const fragment = encodeDeckToFragment(deck);
    const result = decodeDeckFromFragment(fragment);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(withoutIds(result.deck)).toEqual(withoutIds(deck));
  });

  it("encode et décode un deck de 100 cartes", () => {
    const cards: Card[] = Array.from({ length: 100 }, (_, index) =>
      makeCard({
        id: `carte-${index}`,
        text: `Situation numéro ${index} avec un peu de texte pour approcher une longueur réaliste.`,
        cost: 5 + (index % 50),
        category: index % 2 === 0 ? "Alimentation" : "Transport",
        kind: index % 17 === 0 ? "event" : "decision",
        tags: index % 3 === 0 ? ["recurrent"] : undefined,
      }),
    );

    const deck: Deck = {
      version: 1,
      id: "d1",
      title: "Deck de 100 cartes",
      currency: "€",
      defaultVisibility: "hidden",
      budget: { kind: "suggested", amount: 300 },
      shuffle: true,
      cards,
    };

    const fragment = encodeDeckToFragment(deck);
    const result = decodeDeckFromFragment(fragment);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.deck.cards).toHaveLength(100);
    expect(withoutIds(result.deck)).toEqual(withoutIds(deck));
  });

  it("retourne une erreur pour un fragment vide", () => {
    expect(decodeDeckFromFragment("")).toEqual({ ok: false, reason: "empty" });
  });

  it("retourne une erreur pour un fragment illisible", () => {
    const result = decodeDeckFromFragment("!!!pas-du-lz-string!!!");
    expect(result.ok).toBe(false);
  });

  it("retourne une erreur pour un payload valide mais qui ne respecte pas le schéma", () => {
    const invalidPayload = compressToEncodedURIComponent(JSON.stringify({ not: "a deck" }));
    const result = decodeDeckFromFragment(invalidPayload);
    expect(result).toEqual({ ok: false, reason: "schema" });
  });
});
