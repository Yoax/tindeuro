import type { Card, CostVisibility } from "@budget-game/shared";
import { formatCostForPlayer } from "../../lib/cost";
import CardIllustration from "./CardIllustration";

type EventCardProps = {
  card: Card;
  visibility: CostVisibility;
  currency: string;
};

/**
 * Carte événement — même shell Tinder, badge « Imprévu » visuel via catégorie.
 */
export default function EventCard({ card, visibility, currency }: EventCardProps) {
  const cost = formatCostForPlayer(card, visibility, currency);

  return (
    <div className="flex h-full min-h-[50dvh] w-full flex-col overflow-hidden rounded-3xl bg-white shadow-[0_10px_40px_rgba(34,48,46,0.14)]">
      <CardIllustration imageUrl={card.imageUrl} />
      <div className="flex flex-1 flex-col justify-end gap-4 p-6 pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-depasse/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-depasse">
            Événement
          </span>
          <span className="rounded-full bg-fond px-3 py-1 text-xs font-semibold uppercase tracking-wide text-encre/70">
            {card.category}
          </span>
        </div>
        <p className="text-2xl font-semibold leading-snug text-encre">{card.text}</p>
        {cost && <p className="font-mono text-xl text-encre/80">{cost}</p>}
      </div>
    </div>
  );
}
