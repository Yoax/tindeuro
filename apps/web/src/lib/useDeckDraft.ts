import { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import type { Card, Deck } from "@budget-game/shared";
import { exampleDeck } from "../data/exampleDeck";
import {
  addOrReplaceCard,
  createBlankDeck,
  duplicateCardById,
  loadDraft,
  moveCardById,
  removeCardById,
  saveDraft,
} from "./deckDraft";

function initialDeck(): Deck {
  if (typeof window === "undefined") return createBlankDeck();
  return loadDraft(window.localStorage) ?? createBlankDeck();
}

export interface DeckDraft {
  deck: Deck;
  updateSettings: (patch: Partial<Deck>) => void;
  saveCard: (card: Card) => void;
  removeCard: (id: string) => void;
  duplicateCard: (id: string) => void;
  moveCard: (id: string, direction: "up" | "down") => void;
  loadExample: () => void;
  resetBlank: () => void;
  replaceDeck: (deck: Deck) => void;
}

/**
 * État du brouillon de l'éditeur (mode Animateur), sauvegardé
 * automatiquement en localStorage à chaque changement — voir
 * SPEC.md §2 et §9 étape 6.
 */
export function useDeckDraft(): DeckDraft {
  const [deck, setDeck] = useState<Deck>(initialDeck);

  useEffect(() => {
    if (typeof window === "undefined") return;
    saveDraft(window.localStorage, deck);
  }, [deck]);

  return {
    deck,
    updateSettings: (patch) => setDeck((d) => ({ ...d, ...patch })),
    saveCard: (card) => setDeck((d) => ({ ...d, cards: addOrReplaceCard(d.cards, card) })),
    removeCard: (id) => setDeck((d) => ({ ...d, cards: removeCardById(d.cards, id) })),
    duplicateCard: (id) => setDeck((d) => ({ ...d, cards: duplicateCardById(d.cards, id) })),
    moveCard: (id, direction) => setDeck((d) => ({ ...d, cards: moveCardById(d.cards, id, direction) })),
    loadExample: () =>
      setDeck({
        ...exampleDeck,
        id: nanoid(10),
        cards: exampleDeck.cards.map((c) => ({ ...c })),
      }),
    resetBlank: () => setDeck(createBlankDeck()),
    replaceDeck: (next) => setDeck(next),
  };
}
