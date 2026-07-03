import { useState } from "react";
import type { Card, Deck } from "@budget-game/shared";
import { usePlaySession } from "../../lib/usePlaySession";
import { computeResults } from "../../lib/results";
import BudgetSetup from "./BudgetSetup";
import SwipeDeck from "./SwipeDeck";
import RevealTicket from "./RevealTicket";
import WhatIf from "./WhatIf";
import Button from "../ui/Button";

type PlaySessionProps = {
  deck: Deck;
};

/**
 * Orchestre la partie complète pour un deck donné : écran d'accueil
 * (titre + intro + enveloppe), enchaînement des cartes, puis révélation
 * en 3 temps (voir SPEC.md §3.2 et §6). Réutilisable aussi bien pour
 * `/jouer` et `/j/:code` que pour la prévisualisation dans l'éditeur
 * (étape 6).
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

  return <Reveal deck={deck} accepted={session.accepted} budget={session.budget ?? 0} onRestart={session.restart} />;
}

type RevealStep = "constat" | "ticket" | "whatif";

function Reveal({
  deck,
  accepted,
  budget,
  onRestart,
}: {
  deck: Deck;
  accepted: Card[];
  budget: number;
  onRestart: () => void;
}) {
  const [step, setStep] = useState<RevealStep>("constat");
  const results = computeResults(accepted, budget);
  const hasWhatIf = results.whatIf.topCards.length > 0;
  const showFooter = step === "whatif" || (step === "ticket" && !hasWhatIf);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-12">
      {/* Temps 1 : le constat, neutre — voir SPEC.md §6. */}
      <p className={`text-2xl font-medium ${results.withinBudget ? "text-tenu" : "text-depasse"}`}>
        {results.withinBudget
          ? `Tes choix totalisent ${results.total} ${deck.currency}. Il te reste ${results.remaining} ${deck.currency}.`
          : `Tu avais prévu ${budget} ${deck.currency}. Tes choix totalisent ${results.total} ${deck.currency}.`}
      </p>

      {step === "constat" && <Button onClick={() => setStep("ticket")}>Voir le détail</Button>}

      {/* Temps 2 : le ticket de caisse. */}
      {step !== "constat" && (
        <RevealTicket ticket={results.ticket} categoryTotals={results.categoryTotals} currency={deck.currency} />
      )}

      {step === "ticket" && hasWhatIf && <Button onClick={() => setStep("whatif")}>Voir la suite</Button>}

      {/* Temps 3 : « Et si ? ». */}
      {step === "whatif" && <WhatIf whatIf={results.whatIf} currency={deck.currency} />}

      {showFooter && (
        <div className="mt-2 flex flex-col gap-3">
          <Button onClick={onRestart}>Rejouer</Button>
          <p className="text-center text-xs text-encre/50">
            Aucune donnée n'est enregistrée ni envoyée.
          </p>
        </div>
      )}
    </main>
  );
}
