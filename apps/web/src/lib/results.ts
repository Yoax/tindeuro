import type { Card } from "@budget-game/shared";
import { cardTotalCost } from "./cost";

/**
 * Calculs de l'écran de révélation — voir SPEC.md §6.
 * Fonctions pures, indépendantes de l'affichage (RevealTicket/WhatIf
 * décident de la mise en forme et du phrasé exact).
 */

export type TicketLine = {
  card: Card;
  /** Coût réel de la carte, récurrence incluse (cost × times). */
  totalCost: number;
};

export type CategoryTotal = {
  category: string;
  total: number;
};

export type WhatIfResult = {
  /** Les 2–3 dépenses de type "decision" acceptées les plus coûteuses (jamais un événement). */
  topCards: Card[];
  topTotal: number;
  /** Total restant si on retire `topCards`. */
  remainderTotal: number;
  /** Retirer `topCards` suffit-il à rentrer dans l'enveloppe ? */
  wouldFitBudget: boolean;
  /** L'enveloppe était-elle déjà tenue avec absolument tout ? */
  alreadyWithinBudget: boolean;
};

export type RevelationResult = {
  budget: number;
  total: number;
  withinBudget: boolean;
  /** budget - total ; négatif en cas de dépassement. */
  remaining: number;
  /** Dépenses acceptées, dans l'ordre de la partie. */
  ticket: TicketLine[];
  /** Sous-totaux par catégorie, du plus élevé au plus faible. */
  categoryTotals: CategoryTotal[];
  whatIf: WhatIfResult;
};

function computeCategoryTotals(ticket: TicketLine[]): CategoryTotal[] {
  const totals = new Map<string, number>();
  for (const line of ticket) {
    totals.set(line.card.category, (totals.get(line.card.category) ?? 0) + line.totalCost);
  }
  return [...totals.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

function computeWhatIf(ticket: TicketLine[], budget: number, total: number): WhatIfResult {
  const decisionLines = ticket.filter((line) => line.card.kind === "decision");
  const topLines = [...decisionLines].sort((a, b) => b.totalCost - a.totalCost).slice(0, 3);
  const topCards = topLines.map((line) => line.card);
  const topTotal = topLines.reduce((sum, line) => sum + line.totalCost, 0);
  const remainderTotal = total - topTotal;

  return {
    topCards,
    topTotal,
    remainderTotal,
    wouldFitBudget: remainderTotal <= budget,
    alreadyWithinBudget: total <= budget,
  };
}

export function computeResults(accepted: Card[], budget: number): RevelationResult {
  const ticket: TicketLine[] = accepted.map((card) => ({ card, totalCost: cardTotalCost(card) }));
  const total = ticket.reduce((sum, line) => sum + line.totalCost, 0);

  return {
    budget,
    total,
    withinBudget: total <= budget,
    remaining: budget - total,
    ticket,
    categoryTotals: computeCategoryTotals(ticket),
    whatIf: computeWhatIf(ticket, budget, total),
  };
}
