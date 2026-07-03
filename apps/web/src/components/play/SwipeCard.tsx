import type { Card, CostVisibility } from "@budget-game/shared";
import { formatCostForPlayer } from "../../lib/cost";
import Button from "../ui/Button";

type SwipeCardProps = {
  card: Card;
  visibility: CostVisibility;
  currency: string;
  onAccept: () => void;
  onDecline: () => void;
};

/**
 * Carte de décision (accepter / refuser une dépense).
 * Version boutons uniquement — le geste de swipe façon Tinder (§8bis)
 * arrive à l'étape 5 du plan de build, en surcouche de ce composant.
 */
export default function SwipeCard({ card, visibility, currency, onAccept, onDecline }: SwipeCardProps) {
  const cost = formatCostForPlayer(card, visibility, currency);

  return (
    <div className="flex w-full flex-col gap-8 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-encre/50">{card.category}</p>
        <p className="text-xl leading-snug">{card.text}</p>
        {cost && <p className="font-mono text-lg text-encre/80">{cost}</p>}
      </div>

      <div className="flex justify-center gap-8">
        <Button variant="icon" onClick={onDecline} aria-label="Je refuse cette dépense">
          ✕
        </Button>
        <Button variant="icon" onClick={onAccept} aria-label="J'accepte cette dépense">
          ✓
        </Button>
      </div>
    </div>
  );
}
