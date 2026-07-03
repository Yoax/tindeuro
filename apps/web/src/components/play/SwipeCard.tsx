import type { Card, CostVisibility } from "@budget-game/shared";
import { formatCostForPlayer } from "../../lib/cost";

type SwipeCardProps = {
  card: Card;
  visibility: CostVisibility;
  currency: string;
};

/**
 * Contenu visuel d'une carte de décision. Purement présentationnel : le
 * geste de swipe et les boutons vivent dans DraggableCard/SwipeDeck.
 */
export default function SwipeCard({ card, visibility, currency }: SwipeCardProps) {
  const cost = formatCostForPlayer(card, visibility, currency);

  return (
    <div className="flex min-h-[60vh] w-full flex-col justify-center gap-4 rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-encre/50">{card.category}</p>
      <p className="text-xl leading-snug">{card.text}</p>
      {cost && <p className="font-mono text-lg text-encre/80">{cost}</p>}
    </div>
  );
}
