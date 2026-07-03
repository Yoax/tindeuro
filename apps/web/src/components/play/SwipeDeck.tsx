import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { Card, Deck } from "@budget-game/shared";
import { resolveVisibility } from "../../lib/cost";
import SwipeCard from "./SwipeCard";
import EventCard from "./EventCard";
import DraggableCard, { type DraggableCardHandle, type ExitDirection } from "./DraggableCard";
import Button from "../ui/Button";

type SwipeDeckProps = {
  deck: Deck;
  card: Card;
  /** 1 à 2 cartes suivantes, pour l'effet de pile (voir SPEC.md §8bis). */
  upcoming: Card[];
  onAccept: () => void;
  onDecline: () => void;
  onContinueEvent: () => void;
};

const REDUCED_MOTION_CONFIRM_DELAY = 220;

/**
 * Présente la carte en cours façon Tinder : pile visible derrière,
 * drag avec rotation et tampons de décision, seuil + fling, boutons
 * ✕/✓/Continuer déclenchant la même animation, clavier, et repli
 * reduced-motion (confirmation textuelle brève). Voir SPEC.md §8bis.
 */
export default function SwipeDeck({ deck, card, upcoming, onAccept, onDecline, onContinueEvent }: SwipeDeckProps) {
  const isEvent = card.kind === "event";
  const reducedMotion = useReducedMotion();
  const draggableRef = useRef<DraggableCardHandle>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  useEffect(() => {
    setIsExiting(false);
    setConfirmation(null);
  }, [card.id]);

  function advance(direction: ExitDirection) {
    if (direction === "right") onAccept();
    else if (direction === "left") onDecline();
    else onContinueEvent();
  }

  function decide(direction: ExitDirection) {
    if (isExiting) return;
    setIsExiting(true);

    if (reducedMotion) {
      setConfirmation(direction === "right" ? "Accepté" : direction === "left" ? "Refusé" : "Noté");
      window.setTimeout(() => advance(direction), REDUCED_MOTION_CONFIRM_DELAY);
      return;
    }

    draggableRef.current?.fling(direction);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEvent) {
        if (event.key === "Enter") decide("down");
        return;
      }
      if (event.key === "ArrowRight") decide("right");
      if (event.key === "ArrowLeft") decide("left");
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // decide() ferme sur isExiting/reducedMotion à jour à chaque rendu ;
    // seuls card.id et isEvent doivent redéclencher l'attache du listener.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id, isEvent]);

  const visibility = resolveVisibility(card, deck.defaultVisibility);

  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        {upcoming[1] && (
          <div className="absolute inset-0 h-[60vh] scale-90 rounded-2xl bg-white shadow-sm" aria-hidden="true" />
        )}
        {upcoming[0] && (
          <div className="absolute inset-0 h-[60vh] scale-95 rounded-2xl bg-white shadow-sm" aria-hidden="true" />
        )}

        <DraggableCard key={card.id} ref={draggableRef} horizontalDragEnabled={!isEvent} onExit={advance}>
          {isEvent ? (
            <EventCard card={card} visibility={visibility} currency={deck.currency} />
          ) : (
            <SwipeCard card={card} visibility={visibility} currency={deck.currency} />
          )}
        </DraggableCard>

        {confirmation && (
          <div className="absolute inset-0 flex h-[60vh] items-center justify-center rounded-2xl bg-white/90">
            <p className="text-xl font-medium text-encre">{confirmation}</p>
          </div>
        )}
      </div>

      {isEvent ? (
        <Button onClick={() => decide("down")} disabled={isExiting} className="w-full">
          Continuer
        </Button>
      ) : (
        <div className="flex justify-center gap-8">
          <Button
            variant="icon"
            onClick={() => decide("left")}
            disabled={isExiting}
            aria-label="Je refuse cette dépense"
          >
            ✕
          </Button>
          <Button
            variant="icon"
            onClick={() => decide("right")}
            disabled={isExiting}
            aria-label="J'accepte cette dépense"
          >
            ✓
          </Button>
        </div>
      )}
    </div>
  );
}
