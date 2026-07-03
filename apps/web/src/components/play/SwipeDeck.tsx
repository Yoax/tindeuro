import { useEffect } from "react";
import type { Card, Deck } from "@budget-game/shared";
import { resolveVisibility } from "../../lib/cost";
import SwipeCard from "./SwipeCard";
import EventCard from "./EventCard";

type SwipeDeckProps = {
  deck: Deck;
  card: Card;
  onAccept: () => void;
  onDecline: () => void;
  onContinueEvent: () => void;
};

/**
 * Présente la carte en cours. Gère aussi le clavier (← refuser,
 * → accepter, Entrée continuer) pour rester jouable sans geste ni souris
 * (critère d'acceptation v1, voir SPEC.md §10).
 *
 * La pile visuelle (cartes suivantes décalées derrière) et le geste de
 * drag/fling façon Tinder (§8bis) arrivent à l'étape 5.
 */
export default function SwipeDeck({ deck, card, onAccept, onDecline, onContinueEvent }: SwipeDeckProps) {
  const isEvent = card.kind === "event";

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEvent) {
        if (event.key === "Enter") onContinueEvent();
        return;
      }
      if (event.key === "ArrowRight") onAccept();
      if (event.key === "ArrowLeft") onDecline();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEvent, onAccept, onDecline, onContinueEvent]);

  const visibility = resolveVisibility(card, deck.defaultVisibility);

  if (isEvent) {
    return (
      <EventCard card={card} visibility={visibility} currency={deck.currency} onContinue={onContinueEvent} />
    );
  }

  return (
    <SwipeCard
      card={card}
      visibility={visibility}
      currency={deck.currency}
      onAccept={onAccept}
      onDecline={onDecline}
    />
  );
}
