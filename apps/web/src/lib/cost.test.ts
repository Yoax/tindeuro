import { describe, expect, it } from "vitest";
import type { Card } from "@budget-game/shared";
import { cardTotalCost, formatCostForPlayer, resolveVisibility } from "./cost";

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: "c1",
    kind: "decision",
    text: "Une dépense.",
    cost: 10,
    category: "Maison",
    ...overrides,
  };
}

describe("resolveVisibility", () => {
  it("utilise la surcharge de la carte si présente", () => {
    expect(resolveVisibility(makeCard({ visibility: "exact" }), "hidden")).toBe("exact");
  });

  it("hérite de la visibilité du deck si absente", () => {
    expect(resolveVisibility(makeCard(), "range")).toBe("range");
  });
});

describe("formatCostForPlayer", () => {
  it("n'affiche rien en mode hidden", () => {
    expect(formatCostForPlayer(makeCard(), "hidden", "€")).toBeNull();
  });

  it("affiche le montant exact en mode exact", () => {
    expect(formatCostForPlayer(makeCard({ cost: 9 }), "exact", "€")).toBe("9 €");
  });

  it("affiche la fourchette en mode range", () => {
    const card = makeCard({ cost: 55, costRange: { min: 45, max: 65 } });
    expect(formatCostForPlayer(card, "range", "€")).toBe("45–65 €");
  });

  it("retombe sur le montant exact si range demandé sans fourchette", () => {
    expect(formatCostForPlayer(makeCard({ cost: 20 }), "range", "€")).toBe("20 €");
  });
});

describe("cardTotalCost", () => {
  it("retourne le coût simple pour une carte non récurrente", () => {
    expect(cardTotalCost(makeCard({ cost: 13 }))).toBe(13);
  });

  it("multiplie par le nombre d'occurrences pour une carte récurrente", () => {
    const card = makeCard({ cost: 29, recurring: { times: 11, label: "par mois ensuite" } });
    expect(cardTotalCost(card)).toBe(319);
  });
});
