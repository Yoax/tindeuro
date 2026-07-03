import { useState } from "react";
import type { Card, Deck } from "@budget-game/shared";
import { shuffle } from "./shuffle";

export type PlayPhase = "setup" | "cards" | "done";

interface PlaySessionState {
  phase: PlayPhase;
  order: Card[];
  index: number;
  budget: number | null;
  accepted: Card[];
}

export interface PlaySession extends PlaySessionState {
  /** Carte actuellement présentée, ou `undefined` en dehors de la phase "cards". */
  currentCard: Card | undefined;
  /** Nombre total de cartes de la partie. */
  total: number;
  confirmBudget: (amount: number) => void;
  accept: () => void;
  decline: () => void;
  continueEvent: () => void;
  restart: () => void;
}

function initialState(deck: Deck): PlaySessionState {
  return {
    phase: "setup",
    order: deck.shuffle ? shuffle(deck.cards) : deck.cards,
    index: 0,
    budget: null,
    accepted: [],
  };
}

/**
 * État et transitions de la partie côté joueur — voir SPEC.md §3.2.
 * "setup" (enveloppe) → "cards" (swipe carte par carte) → "done" (fin du deck).
 */
export function usePlaySession(deck: Deck): PlaySession {
  const [state, setState] = useState<PlaySessionState>(() => initialState(deck));

  function confirmBudget(amount: number) {
    setState((s) => ({ ...s, budget: amount, phase: s.order.length > 0 ? "cards" : "done" }));
  }

  function advance(cardAccepted: boolean) {
    setState((s) => {
      const card = s.order[s.index];
      const accepted = cardAccepted && card ? [...s.accepted, card] : s.accepted;
      const index = s.index + 1;
      return { ...s, accepted, index, phase: index >= s.order.length ? "done" : "cards" };
    });
  }

  function restart() {
    setState(initialState(deck));
  }

  return {
    ...state,
    total: state.order.length,
    currentCard: state.order[state.index],
    confirmBudget,
    accept: () => advance(true),
    decline: () => advance(false),
    continueEvent: () => advance(true),
    restart,
  };
}
