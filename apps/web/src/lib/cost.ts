import type { Card, CostVisibility } from "@budget-game/shared";

/** Visibilité effective d'une carte : sa surcharge, sinon celle du deck. */
export function resolveVisibility(card: Card, deckDefault: CostVisibility): CostVisibility {
  return card.visibility ?? deckDefault;
}

/**
 * Texte affiché au joueur pendant le swipe, selon la visibilité effective.
 * Retourne `null` si le coût ne doit rien afficher (visibilité "hidden").
 * Jamais de cumul ici : uniquement le coût de cette carte (voir SPEC.md §3.2).
 */
export function formatCostForPlayer(
  card: Card,
  visibility: CostVisibility,
  currency: string,
): string | null {
  switch (visibility) {
    case "hidden":
      return null;
    case "exact":
      return `${card.cost} ${currency}`;
    case "range":
      if (!card.costRange) return `${card.cost} ${currency}`;
      return `${card.costRange.min}–${card.costRange.max} ${currency}`;
  }
}

/**
 * Coût total réel d'une carte acceptée, récurrence incluse
 * (coût total = cost × times — voir SPEC.md §4).
 */
export function cardTotalCost(card: Card): number {
  return card.cost * (card.recurring?.times ?? 1);
}
