import { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import type { Card, Deck } from "@budget-game/shared";
import { exampleDeck } from "../data/exampleDeck";
import {
  addOrReplaceCard,
  createBlankDraftState,
  duplicateCardById,
  loadDraft,
  moveCardById,
  removeCardById,
  saveDraft,
  type DraftState,
  type PublishedInfo,
} from "./deckDraft";

function initialState(): DraftState {
  if (typeof window === "undefined") return createBlankDraftState();
  return loadDraft(window.localStorage) ?? createBlankDraftState();
}

export interface DeckDraft {
  deck: Deck;
  /** Code court + editKey si ce brouillon a déjà été publié — voir ShareModal. */
  publishedAs: PublishedInfo | null;
  updateSettings: (patch: Partial<Deck>) => void;
  saveCard: (card: Card) => void;
  removeCard: (id: string) => void;
  duplicateCard: (id: string) => void;
  moveCard: (id: string, direction: "up" | "down") => void;
  loadExample: () => void;
  resetBlank: () => void;
  replaceDeck: (deck: Deck) => void;
  markPublished: (info: PublishedInfo) => void;
}

/**
 * État du brouillon de l'éditeur (mode Animateur), sauvegardé
 * automatiquement en localStorage à chaque changement — voir
 * SPEC.md §2, §9 étapes 6 et 8.
 */
export function useDeckDraft(): DeckDraft {
  const [state, setState] = useState<DraftState>(initialState);

  useEffect(() => {
    if (typeof window === "undefined") return;
    saveDraft(window.localStorage, state);
  }, [state]);

  function updateDeck(updater: (deck: Deck) => Deck) {
    setState((s) => ({ ...s, deck: updater(s.deck) }));
  }

  return {
    deck: state.deck,
    publishedAs: state.publishedAs,
    updateSettings: (patch) => updateDeck((d) => ({ ...d, ...patch })),
    saveCard: (card) => updateDeck((d) => ({ ...d, cards: addOrReplaceCard(d.cards, card) })),
    removeCard: (id) => updateDeck((d) => ({ ...d, cards: removeCardById(d.cards, id) })),
    duplicateCard: (id) => updateDeck((d) => ({ ...d, cards: duplicateCardById(d.cards, id) })),
    moveCard: (id, direction) => updateDeck((d) => ({ ...d, cards: moveCardById(d.cards, id, direction) })),
    // Charger un autre deck (exemple, import) rompt le lien avec un éventuel
    // code déjà publié : ce n'est plus le même contenu.
    loadExample: () =>
      setState({
        deck: { ...exampleDeck, id: nanoid(10), cards: exampleDeck.cards.map((c) => ({ ...c })) },
        publishedAs: null,
      }),
    resetBlank: () => setState(createBlankDraftState()),
    replaceDeck: (next) => setState({ deck: next, publishedAs: null }),
    markPublished: (info) => setState((s) => ({ ...s, publishedAs: info })),
  };
}
