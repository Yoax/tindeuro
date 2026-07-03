import type { Card, CostVisibility } from "@budget-game/shared";
import { formatCostForPlayer } from "../../lib/cost";
import Button from "../ui/Button";

type EventCardProps = {
  card: Card;
  visibility: CostVisibility;
  currency: string;
  onContinue: () => void;
};

/**
 * Carte événement : dépense subie, non refusable — un seul bouton
 * « Continuer », le coût s'ajoute d'office (voir SPEC.md §3.2).
 */
export default function EventCard({ card, visibility, currency, onContinue }: EventCardProps) {
  const cost = formatCostForPlayer(card, visibility, currency);

  return (
    <div className="flex w-full flex-col gap-8 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-encre/50">{card.category}</p>
        <p className="text-xl leading-snug">{card.text}</p>
        {cost && <p className="font-mono text-lg text-encre/80">{cost}</p>}
      </div>

      <Button onClick={onContinue} className="w-full">
        Continuer
      </Button>
    </div>
  );
}
