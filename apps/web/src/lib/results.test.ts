import { describe, expect, it } from "vitest";
import type { Card } from "@budget-game/shared";
import { computeResults } from "./results";

function makeCard(overrides: Partial<Card> & Pick<Card, "id" | "text" | "cost" | "category">): Card {
  return { kind: "decision", ...overrides };
}

describe("computeResults — totaux et constat", () => {
  it("calcule le total, le reste et l'état 'dans l'enveloppe'", () => {
    const accepted = [
      makeCard({ id: "a", text: "A", cost: 50, category: "Alimentation" }),
      makeCard({ id: "b", text: "B", cost: 30, category: "Transport" }),
    ];

    const result = computeResults(accepted, 100);

    expect(result.total).toBe(80);
    expect(result.remaining).toBe(20);
    expect(result.withinBudget).toBe(true);
  });

  it("détecte le dépassement d'enveloppe", () => {
    const accepted = [makeCard({ id: "a", text: "A", cost: 200, category: "Achats plaisir" })];
    const result = computeResults(accepted, 150);

    expect(result.total).toBe(200);
    expect(result.remaining).toBe(-50);
    expect(result.withinBudget).toBe(false);
  });

  it("ne compte aucune dépense si rien n'a été accepté", () => {
    const result = computeResults([], 150);
    expect(result.total).toBe(0);
    expect(result.withinBudget).toBe(true);
    expect(result.ticket).toEqual([]);
  });
});

describe("computeResults — ticket et récurrentes", () => {
  it("reflète l'ordre d'acceptation dans le ticket", () => {
    const accepted = [
      makeCard({ id: "a", text: "A", cost: 5, category: "Maison" }),
      makeCard({ id: "b", text: "B", cost: 8, category: "Maison" }),
    ];
    const result = computeResults(accepted, 100);
    expect(result.ticket.map((line) => line.card.id)).toEqual(["a", "b"]);
  });

  it("multiplie le coût des cartes récurrentes (cost × times)", () => {
    const accepted = [
      makeCard({
        id: "abo",
        text: "Abonnement",
        cost: 29,
        category: "Abonnements",
        recurring: { times: 11, label: "par mois ensuite" },
      }),
    ];
    const result = computeResults(accepted, 500);
    expect(result.ticket[0].totalCost).toBe(319);
    expect(result.total).toBe(319);
  });

  it("inclut le coût des événements dans le total", () => {
    const accepted = [
      makeCard({ id: "evt", text: "Panne", cost: 60, category: "Imprévus", kind: "event" }),
    ];
    const result = computeResults(accepted, 100);
    expect(result.total).toBe(60);
  });
});

describe("computeResults — sous-totaux par catégorie", () => {
  it("regroupe les dépenses par catégorie, triées du plus élevé au plus faible", () => {
    const accepted = [
      makeCard({ id: "a", text: "A", cost: 10, category: "Alimentation" }),
      makeCard({ id: "b", text: "B", cost: 40, category: "Transport" }),
      makeCard({ id: "c", text: "C", cost: 15, category: "Alimentation" }),
    ];
    const result = computeResults(accepted, 100);

    expect(result.categoryTotals).toEqual([
      { category: "Transport", total: 40 },
      { category: "Alimentation", total: 25 },
    ]);
  });
});

describe("computeResults — « Et si ? »", () => {
  it("identifie les 3 dépenses de type decision les plus coûteuses, jamais les événements", () => {
    const accepted = [
      makeCard({ id: "big1", text: "Grosse dépense 1", cost: 45, category: "Achats plaisir" }),
      makeCard({ id: "big2", text: "Grosse dépense 2", cost: 35, category: "Sorties & social" }),
      makeCard({ id: "big3", text: "Grosse dépense 3", cost: 25, category: "Enfants & famille" }),
      makeCard({ id: "small", text: "Petite dépense", cost: 5, category: "Alimentation" }),
      makeCard({
        id: "evt",
        text: "Panne",
        cost: 1000,
        category: "Imprévus",
        kind: "event",
      }),
    ];

    const result = computeResults(accepted, 128);

    expect(result.whatIf.topCards.map((c) => c.id)).toEqual(["big1", "big2", "big3"]);
    expect(result.whatIf.topTotal).toBe(105);
  });

  it("indique que retirer le top 3 permet de rentrer dans l'enveloppe", () => {
    const accepted = [
      makeCard({ id: "a", text: "A", cost: 100, category: "Achats plaisir" }),
      makeCard({ id: "b", text: "B", cost: 60, category: "Sorties & social" }),
      makeCard({ id: "c", text: "C", cost: 52, category: "Enfants & famille" }),
    ];
    // total = 212, budget = 150 → sans les 3 (tous inclus ici), reste 0.
    const result = computeResults(accepted, 150);

    expect(result.withinBudget).toBe(false);
    expect(result.whatIf.remainderTotal).toBe(0);
    expect(result.whatIf.wouldFitBudget).toBe(true);
    expect(result.whatIf.alreadyWithinBudget).toBe(false);
  });

  it("indique que le dépassement persiste même sans le top 3", () => {
    const accepted = [
      makeCard({ id: "a", text: "A", cost: 100, category: "Achats plaisir" }),
      makeCard({ id: "b", text: "B", cost: 100, category: "Sorties & social" }),
      makeCard({ id: "c", text: "C", cost: 100, category: "Enfants & famille" }),
      makeCard({ id: "d", text: "D", cost: 100, category: "Maison" }),
      makeCard({ id: "e", text: "E", cost: 100, category: "Transport" }),
    ];
    // total = 500, top 3 = 300, reste 200 : toujours au-dessus de l'enveloppe (100).
    const result = computeResults(accepted, 100);

    expect(result.whatIf.remainderTotal).toBe(200);
    expect(result.whatIf.wouldFitBudget).toBe(false);
  });

  it("indique que l'enveloppe était déjà tenue avec tout inclus", () => {
    const accepted = [
      makeCard({ id: "a", text: "A", cost: 30, category: "Achats plaisir" }),
      makeCard({ id: "b", text: "B", cost: 20, category: "Sorties & social" }),
    ];
    const result = computeResults(accepted, 100);

    expect(result.withinBudget).toBe(true);
    expect(result.whatIf.alreadyWithinBudget).toBe(true);
    expect(result.whatIf.topCards).toHaveLength(2);
  });

  it("gère le cas où aucune décision n'a été acceptée (uniquement des événements)", () => {
    const accepted = [makeCard({ id: "evt", text: "Panne", cost: 60, category: "Imprévus", kind: "event" })];
    const result = computeResults(accepted, 50);

    expect(result.whatIf.topCards).toEqual([]);
    expect(result.whatIf.topTotal).toBe(0);
    expect(result.whatIf.remainderTotal).toBe(result.total);
  });

  it("prend en compte la récurrence dans le classement du top 3", () => {
    const accepted = [
      makeCard({ id: "small-recurring", text: "Petit mais récurrent", cost: 12, category: "Abonnements", recurring: { times: 11, label: "chaque mois" } }),
      makeCard({ id: "big-onetime", text: "Gros ponctuel", cost: 50, category: "Achats plaisir" }),
    ];
    const result = computeResults(accepted, 300);

    // 12 × 11 = 132 > 50 : la récurrente doit être classée en premier.
    expect(result.whatIf.topCards.map((c) => c.id)).toEqual(["small-recurring", "big-onetime"]);
  });
});
