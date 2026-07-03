import type { Deck } from "@budget-game/shared";
import { usePlaySession } from "../../lib/usePlaySession";
import { cardTotalCost } from "../../lib/cost";
import BudgetSetup from "./BudgetSetup";
import SwipeDeck from "./SwipeDeck";
import Button from "../ui/Button";

type PlaySessionProps = {
  deck: Deck;
};

/**
 * Orchestre la partie complète pour un deck donné : écran d'accueil
 * (titre + intro + enveloppe), enchaînement des cartes, puis constat de
 * fin (voir SPEC.md §3.2 et §6). Réutilisable aussi bien pour `/jouer` et
 * `/j/:code` que pour la prévisualisation dans l'éditeur (étape 6).
 *
 * Le ticket de caisse et le « Et si ? » (temps 2 et 3 de la révélation)
 * arrivent à l'étape 4, une fois `results.ts` en place.
 */
export default function PlaySession({ deck }: PlaySessionProps) {
  const session = usePlaySession(deck);

  if (session.phase === "setup") {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-12">
        <div>
          <h1 className="text-2xl font-bold">{deck.title}</h1>
          {deck.intro && <p className="mt-3 text-encre/80">{deck.intro}</p>}
        </div>
        <BudgetSetup budget={deck.budget} currency={deck.currency} onConfirm={session.confirmBudget} />
      </main>
    );
  }

  if (session.phase === "cards" && session.currentCard) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-12">
        <p className="text-center text-sm text-encre/50">
          {session.index + 1} / {session.total}
        </p>
        <SwipeDeck
          deck={deck}
          card={session.currentCard}
          onAccept={session.accept}
          onDecline={session.decline}
          onContinueEvent={session.continueEvent}
        />
      </main>
    );
  }

  return <DoneScreen deck={deck} accepted={session.accepted} budget={session.budget ?? 0} onRestart={session.restart} />;
}

function DoneScreen({
  deck,
  accepted,
  budget,
  onRestart,
}: {
  deck: Deck;
  accepted: Deck["cards"];
  budget: number;
  onRestart: () => void;
}) {
  const total = accepted.reduce((sum, card) => sum + cardTotalCost(card), 0);
  const withinBudget = total <= budget;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-12">
      <div>
        <p className={`text-2xl font-medium ${withinBudget ? "text-tenu" : "text-depasse"}`}>
          {withinBudget
            ? `Tes choix totalisent ${total} ${deck.currency}. Il te reste ${budget - total} ${deck.currency}.`
            : `Tu avais prévu ${budget} ${deck.currency}. Tes choix totalisent ${total} ${deck.currency}.`}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button onClick={onRestart}>Rejouer</Button>
        <p className="text-center text-xs text-encre/50">
          Aucune donnée n'est enregistrée ni envoyée.
        </p>
      </div>
    </main>
  );
}
