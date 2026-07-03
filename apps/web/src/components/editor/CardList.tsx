import type { Card } from "@budget-game/shared";
import Button from "../ui/Button";

type CardListProps = {
  cards: Card[];
  currency: string;
  onEdit: (id: string) => void;
  onNew: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
};

const kindLabels: Record<Card["kind"], string> = {
  decision: "Décision",
  event: "Événement",
};

const rowButtonClass =
  "min-h-9 rounded-lg border border-encre/20 px-2.5 py-1 text-sm text-encre/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-30";

/**
 * Liste des cartes du deck — réordonner (boutons monter/descendre),
 * dupliquer, supprimer, éditer — voir SPEC.md §3.1 et §9 étape 6.
 */
export default function CardList({ cards, currency, onEdit, onNew, onDuplicate, onDelete, onMove }: CardListProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Cartes ({cards.length})</h2>
        <Button onClick={onNew}>+ Nouvelle carte</Button>
      </div>

      {cards.length === 0 && (
        <p className="rounded-xl border border-dashed border-encre/20 p-6 text-center text-sm text-encre/60">
          Aucune carte pour l'instant. Ajoutes-en une, ou pars de l'exemple.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {cards.map((card, index) => (
          <li
            key={card.id}
            className="flex flex-col gap-3 rounded-xl border border-encre/10 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <button type="button" onClick={() => onEdit(card.id)} className="flex-1 text-left">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-encre/40">#{index + 1}</span>
                <span
                  className={`rounded-full px-2 py-0.5 font-medium ${
                    card.kind === "event" ? "bg-depasse/10 text-depasse" : "bg-accent/10 text-accent"
                  }`}
                >
                  {kindLabels[card.kind]}
                </span>
                <span className="text-encre/50">{card.category}</span>
                {card.visibility && <span className="text-encre/40">visibilité : {card.visibility}</span>}
                {card.recurring && <span className="text-encre/40">récurrente</span>}
              </div>
              <p className="mt-1 line-clamp-2 text-sm">{card.text}</p>
              <p className="mt-1 font-mono text-sm text-encre/70">
                {card.cost} {currency}
                {card.recurring && ` × ${card.recurring.times} ${card.recurring.label}`}
              </p>
            </button>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-label="Monter la carte"
                disabled={index === 0}
                onClick={() => onMove(card.id, "up")}
                className={rowButtonClass}
              >
                ↑
              </button>
              <button
                type="button"
                aria-label="Descendre la carte"
                disabled={index === cards.length - 1}
                onClick={() => onMove(card.id, "down")}
                className={rowButtonClass}
              >
                ↓
              </button>
              <button type="button" onClick={() => onDuplicate(card.id)} className={rowButtonClass}>
                Dupliquer
              </button>
              <button
                type="button"
                onClick={() => onDelete(card.id)}
                className={`${rowButtonClass} text-depasse`}
              >
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
