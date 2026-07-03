import { useState, type FormEvent } from "react";
import type { BudgetMode } from "@budget-game/shared";
import Button from "../ui/Button";

type BudgetSetupProps = {
  budget: BudgetMode;
  currency: string;
  onConfirm: (amount: number) => void;
};

/**
 * Définition de l'enveloppe — présentée dans une carte façon Tinder
 * (gros montant centré, CTA pill en bas).
 */
export default function BudgetSetup({ budget, currency, onConfirm }: BudgetSetupProps) {
  if (budget.kind === "fixed") {
    return (
      <div className="flex flex-col items-center gap-8 py-4">
        <p className="text-center text-lg text-encre/80">Pour cet atelier, ton enveloppe est fixée à</p>
        <p className="font-mono text-5xl font-bold tracking-tight text-encre">
          {budget.amount}
          <span className="ml-2 text-3xl font-medium text-encre/70">{currency}</span>
        </p>
        <Button variant="pill" onClick={() => onConfirm(budget.amount)}>
          C&apos;est parti
        </Button>
      </div>
    );
  }

  return (
    <EditableBudgetForm
      defaultAmount={budget.kind === "suggested" ? budget.amount : undefined}
      currency={currency}
      onConfirm={onConfirm}
    />
  );
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
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-8 py-4">
      <label htmlFor="budget-amount" className="text-center text-lg text-encre/80">
        {defaultAmount !== undefined
          ? "Ton enveloppe pour ce mois — ajuste-la si tu veux."
          : "Combien prévois-tu pour ce mois ?"}
      </label>
      <div className="flex items-baseline justify-center gap-2">
        <input
          id="budget-amount"
          name="budget-amount"
          type="number"
          inputMode="decimal"
          min="0"
          step="1"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="w-[8ch] border-0 bg-transparent text-center font-mono text-5xl font-bold text-encre focus-visible:outline-none focus-visible:ring-0"
        />
        <span className="font-mono text-3xl font-medium text-encre/70">{currency}</span>
      </div>
      <Button type="submit" variant="pill" disabled={!isValid}>
        C&apos;est parti
      </Button>
    </form>
  );
}
