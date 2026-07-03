import type { Card, CostVisibility } from "@budget-game/shared";
import { formatCostForPlayer } from "../../lib/cost";
import CardIllustration from "./CardIllustration";

type SwipeCardProps = {
  card: Card;
  visibility: CostVisibility;
  currency: string;
};

/**
 * Contenu d'une carte de décision — mise en page Tinder : texte en bas
 * de la carte, catégorie en badge, montant discret si visible.
 */
export default function SwipeCard({ card, visibility, currency }: SwipeCardProps) {
  const cost = formatCostForPlayer(card, visibility, currency);

  return (
    <div className="flex h-full min-h-[50dvh] w-full flex-col overflow-hidden rounded-3xl bg-white shadow-[0_10px_40px_rgba(34,48,46,0.14)]">
      <CardIllustration imageUrl={card.imageUrl} />
      <div className="flex flex-1 flex-col justify-end gap-4 p-6 pb-8">
        <span className="self-start rounded-full bg-fond px-3 py-1 text-xs font-semibold uppercase tracking-wide text-encre/70">
          {card.category}
        </span>
        <p className="text-2xl font-semibold leading-snug text-encre">{card.text}</p>
        {cost && <p className="font-mono text-xl text-encre/80">{cost}</p>}
      </div>
    </div>
  );
}
