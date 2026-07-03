import { useState, type FormEvent } from "react";
import type { BudgetMode } from "@budget-game/shared";
import Button from "../ui/Button";

type BudgetSetupProps = {
  budget: BudgetMode;
  currency: string;
  onConfirm: (amount: number) => void;
};

/**
 * Définition de l'enveloppe de dépenses, selon le mode configuré par
 * l'animateur — voir SPEC.md §2 et §3.2.
 */
export default function BudgetSetup({ budget, currency, onConfirm }: BudgetSetupProps) {
  if (budget.kind === "fixed") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-encre/80">
          Pour cet atelier, ton enveloppe est fixée à :
        </p>
        <p className="font-mono text-3xl font-medium">
          {budget.amount} {currency}
        </p>
        <Button onClick={() => onConfirm(budget.amount)}>Commencer</Button>
      </div>
    );
  }

  return <EditableBudgetForm defaultAmount={budget.kind === "suggested" ? budget.amount : undefined} currency={currency} onConfirm={onConfirm} />;
}

function EditableBudgetForm({
  defaultAmount,
  currency,
  onConfirm,
}: {
  defaultAmount: number | undefined;
  currency: string;
  onConfirm: (amount: number) => void;
}) {
  const [value, setValue] = useState(defaultAmount !== undefined ? String(defaultAmount) : "");
  const amount = Number(value);
  const isValid = value.trim().length > 0 && Number.isFinite(amount) && amount > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid) return;
    onConfirm(amount);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label htmlFor="budget-amount" className="text-encre/80">
        {defaultAmount !== undefined
          ? "Voici l'enveloppe suggérée pour cet atelier. Tu peux l'ajuster."
          : "Combien veux-tu prévoir pour ces dépenses ?"}
      </label>
      <div className="flex items-center gap-2">
        <input
          id="budget-amount"
          name="budget-amount"
          type="number"
          inputMode="decimal"
          min="0"
          step="1"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="min-h-11 w-32 rounded-lg border border-encre/20 bg-white px-4 py-3 font-mono text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        />
        <span className="font-mono text-lg text-encre/70">{currency}</span>
      </div>
      <Button type="submit" disabled={!isValid}>
        Commencer
      </Button>
    </form>
  );
}
