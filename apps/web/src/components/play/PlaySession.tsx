import { useState } from "react";
import type { Card, Deck } from "@budget-game/shared";
import { usePlaySession } from "../../lib/usePlaySession";
import { computeResults } from "../../lib/results";
import BudgetSetup from "./BudgetSetup";
import SwipeDeck from "./SwipeDeck";
import RevealTicket from "./RevealTicket";
import WhatIf from "./WhatIf";
import PlayShell, { PlayHeader } from "./PlayShell";
import TinderCard from "./TinderCard";
import Button from "../ui/Button";

type PlaySessionProps = {
  deck: Deck;
};

/**
 * Parcours joueur complet — coque UX façon Tinder (PlayShell) de l'écran
 * d'enveloppe jusqu'à la révélation, footer toujours visible.
 */
export default function PlaySession({ deck }: PlaySessionProps) {
  const session = usePlaySession(deck);

  if (session.phase === "setup") {
    return (
      <PlayShell header={<PlayHeader label="Nouveau match budget" />}>
        <div className="flex min-h-0 flex-1 flex-col justify-center py-4">
          <TinderCard className="min-h-[28rem]">
            <div className="flex flex-1 flex-col justify-between p-6">
              <div>
                <h1 className="text-3xl font-bold leading-tight text-encre">{deck.title}</h1>
                {deck.intro && <p className="mt-4 text-lg leading-relaxed text-encre/80">{deck.intro}</p>}
              </div>
              <BudgetSetup budget={deck.budget} currency={deck.currency} onConfirm={session.confirmBudget} />
            </div>
          </TinderCard>
        </div>
      </PlayShell>
    );
  }

  if (session.phase === "cards" && session.currentCard) {
    const upcoming = session.order.slice(session.index + 1, session.index + 3);

    return (
      <PlayShell header={<PlayHeader progress={{ current: session.index + 1, total: session.total }} />}>
        <SwipeDeck
          deck={deck}
          card={session.currentCard}
          upcoming={upcoming}
          onAccept={session.accept}
          onDecline={session.decline}
          onContinueEvent={session.continueEvent}
        />
      </PlayShell>
    );
  }

  return (
    <Reveal
      deck={deck}
      accepted={session.accepted}
      budget={session.budget ?? 0}
      onRestart={session.restart}
    />
  );
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
  const showActions = step === "whatif" || (step === "ticket" && !hasWhatIf);

  return (
    <PlayShell header={<PlayHeader label="Résultat" />} scrollable>
      <div className="flex flex-col gap-5 py-4">
        <TinderCard>
          <div className="p-6">
            <p className={`text-2xl font-semibold leading-snug ${results.withinBudget ? "text-tenu" : "text-depasse"}`}>
              {results.withinBudget
                ? `Tes choix totalisent ${results.total} ${deck.currency}. Il te reste ${results.remaining} ${deck.currency}.`
                : `Tu avais prévu ${budget} ${deck.currency}. Tes choix totalisent ${results.total} ${deck.currency}.`}
            </p>
            {step === "constat" && (
              <Button variant="pill" className="mt-6" onClick={() => setStep("ticket")}>
                Voir le détail
              </Button>
            )}
          </div>
        </TinderCard>

        {step !== "constat" && (
          <RevealTicket ticket={results.ticket} categoryTotals={results.categoryTotals} currency={deck.currency} />
        )}

        {step === "ticket" && hasWhatIf && (
          <Button variant="pill" onClick={() => setStep("whatif")}>
            Voir la suite
          </Button>
        )}

        {step === "whatif" && (
          <TinderCard>
            <div className="p-6">
              <WhatIf whatIf={results.whatIf} currency={deck.currency} />
            </div>
          </TinderCard>
        )}

        {showActions && (
          <div className="flex flex-col gap-3 pb-2">
            <Button variant="pill" onClick={onRestart}>
              Rejouer
            </Button>
            <p className="text-center text-xs text-encre/70">Aucune donnée n&apos;est enregistrée ni envoyée.</p>
          </div>
        )}
      </div>
    </PlayShell>
  );
}
