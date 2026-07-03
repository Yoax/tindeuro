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
  upcoming: Card[];
  onAccept: () => void;
  onDecline: () => void;
  onContinueEvent: () => void;
};

const REDUCED_MOTION_CONFIRM_DELAY = 220;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id, isEvent]);

  const visibility = resolveVisibility(card, deck.defaultVisibility);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-0 flex-1">
        {upcoming[1] && (
          <div
            className="absolute inset-x-3 top-3 bottom-3 scale-[0.88] rounded-3xl bg-white shadow-sm"
            aria-hidden="true"
          />
        )}
        {upcoming[0] && (
          <div
            className="absolute inset-x-1.5 top-1.5 bottom-1.5 scale-[0.94] rounded-3xl bg-white shadow-sm"
            aria-hidden="true"
          />
        )}

        <div className="relative h-full min-h-[50dvh]">
          <DraggableCard key={card.id} ref={draggableRef} horizontalDragEnabled={!isEvent} onExit={advance}>
            {isEvent ? (
              <EventCard card={card} visibility={visibility} currency={deck.currency} />
            ) : (
              <SwipeCard card={card} visibility={visibility} currency={deck.currency} />
            )}
          </DraggableCard>

          {confirmation && (
            <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-white/90">
              <p className="text-xl font-semibold text-encre">{confirmation}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-center gap-8 py-5">
        {isEvent ? (
          <Button variant="pill" onClick={() => decide("down")} disabled={isExiting} className="max-w-xs">
            Continuer
          </Button>
        ) : (
          <>
            <Button variant="tinder-no" onClick={() => decide("left")} disabled={isExiting} aria-label="Je refuse cette dépense">
              ✕
            </Button>
            <Button variant="tinder-yes" onClick={() => decide("right")} disabled={isExiting} aria-label="J'accepte cette dépense">
              ✓
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
