import { nanoid } from "nanoid";
import { z } from "zod";
import { deckSchema, type Card, type Deck } from "@budget-game/shared";

/**
 * Persistance du brouillon de l'éditeur (mode Animateur) — voir SPEC.md §2
 * et §9 étape 6. Un seul brouillon actif par appareil, sauvegardé
 * automatiquement en localStorage.
 *
 * Contrairement au deck final (export JSON, partage), le brouillon peut
 * être temporairement incomplet pendant la saisie (ex. titre vide) : on
 * utilise donc un schéma assoupli uniquement pour la persistance.
 */

export const DRAFT_STORAGE_KEY = "budget-game:drafts";

const draftDeckSchema = deckSchema.extend({ title: z.string() });

export function createBlankDeck(): Deck {
  return {
    version: 1,
    id: nanoid(10),
    title: "",
    currency: "€",
    defaultVisibility: "hidden",
    budget: { kind: "free" },
    shuffle: false,
    cards: [],
  };
}

export interface DraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function loadDraft(storage: DraftStorage): Deck | null {
  try {
    const raw = storage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    const result = draftDeckSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function saveDraft(storage: DraftStorage, deck: Deck): void {
  try {
    storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(deck));
  } catch {
    // localStorage indisponible (navigation privée stricte, quota plein…) :
    // on n'interrompt pas l'édition, seule la persistance est perdue.
  }
}

/** Ajoute une carte, ou remplace celle de même id si elle existe déjà. */
export function addOrReplaceCard(cards: Card[], card: Card): Card[] {
  const index = cards.findIndex((c) => c.id === card.id);
  if (index === -1) return [...cards, card];
  const next = [...cards];
  next[index] = card;
  return next;
}

export function removeCardById(cards: Card[], id: string): Card[] {
  return cards.filter((c) => c.id !== id);
}

/** Insère une copie de la carte juste après l'originale, avec un nouvel id. */
export function duplicateCardById(cards: Card[], id: string): Card[] {
  const index = cards.findIndex((c) => c.id === id);
  if (index === -1) return cards;
  const copy: Card = { ...cards[index], id: nanoid(8) };
  const next = [...cards];
  next.splice(index + 1, 0, copy);
  return next;
}

export function moveCardById(cards: Card[], id: string, direction: "up" | "down"): Card[] {
  const index = cards.findIndex((c) => c.id === id);
  if (index === -1) return cards;
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= cards.length) return cards;
  const next = [...cards];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
