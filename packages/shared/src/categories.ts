import type { Card, Deck } from "./types";

/** Catégories uniques des cartes, dans l'ordre de première apparition. */
export function categoriesFromCards(cards: Pick<Card, "category">[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const card of cards) {
    const category = card.category.trim();
    if (category && !seen.has(category)) {
      seen.add(category);
      result.push(category);
    }
  }
  return result;
}

/**
 * Assure que `deck.categories` existe et inclut toutes les catégories
 * référencées par les cartes (rétrocompatibilité des decks sans champ).
 */
export function normalizeDeckCategories(deck: Deck): Deck {
  const base = deck.categories.length > 0 ? [...deck.categories] : categoriesFromCards(deck.cards);
  for (const category of categoriesFromCards(deck.cards)) {
    if (!base.includes(category)) base.push(category);
  }
  return { ...deck, categories: base };
}
