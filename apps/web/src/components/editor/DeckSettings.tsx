import type { BudgetMode, CostVisibility, Deck } from "@budget-game/shared";
import Field, { inputClass } from "../ui/Field";

type DeckSettingsProps = {
  deck: Deck;
  onChange: (patch: Partial<Deck>) => void;
};

const visibilityOptions: { value: CostVisibility; label: string }[] = [
  { value: "hidden", label: "Cachée pendant la partie" },
  { value: "exact", label: "Montant exact" },
  { value: "range", label: "Fourchette" },
];

const budgetOptions: { value: BudgetMode["kind"]; label: string }[] = [
  { value: "free", label: "Libre — le joueur choisit son montant" },
  { value: "suggested", label: "Suggérée — pré-remplie, modifiable" },
  { value: "fixed", label: "Imposée par le deck" },
];

/**
 * Réglages généraux du deck — voir SPEC.md §3.1 (étape « Configure le
 * deck ») et §4 (modèle `Deck`).
 */
export default function DeckSettings({ deck, onChange }: DeckSettingsProps) {
  function handleBudgetKindChange(kind: BudgetMode["kind"]) {
    if (kind === "free") {
      onChange({ budget: { kind: "free" } });
      return;
    }
    const amount = deck.budget.kind === "free" ? 0 : deck.budget.amount;
    onChange({ budget: { kind, amount } });
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-encre/10 bg-white p-5 shadow-sm">
      <h2 className="font-semibold">Réglages du deck</h2>

      <Field label="Titre" htmlFor="deck-title">
        <input
          id="deck-title"
          value={deck.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Ex. Un mois ordinaire"
          className={inputClass}
        />
      </Field>

      <Field label="Message d'intro (optionnel)" htmlFor="deck-intro" hint="Affiché aux joueurs avant la première carte.">
        <textarea
          id="deck-intro"
          value={deck.intro ?? ""}
          onChange={(e) => onChange({ intro: e.target.value || undefined })}
          rows={2}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Devise" htmlFor="deck-currency">
          <input
            id="deck-currency"
            value={deck.currency}
            onChange={(e) => onChange({ currency: e.target.value || "€" })}
            className={inputClass}
          />
        </Field>

        <Field label="Ordre des cartes" htmlFor="deck-shuffle">
          <label className="flex min-h-11 items-center gap-2 text-sm" id="deck-shuffle">
            <input
              type="checkbox"
              checked={deck.shuffle}
              onChange={(e) => onChange({ shuffle: e.target.checked })}
              className="h-5 w-5"
            />
            Mélanger aléatoirement pour le joueur
          </label>
        </Field>
      </div>

      <Field
        label="Visibilité des coûts par défaut"
        htmlFor="deck-visibility"
        hint="Modifiable carte par carte dans l'éditeur de carte."
      >
        <select
          id="deck-visibility"
          value={deck.defaultVisibility}
          onChange={(e) => onChange({ defaultVisibility: e.target.value as CostVisibility })}
          className={inputClass}
        >
          {visibilityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Enveloppe de départ</legend>
        {budgetOptions.map((option) => (
          <label key={option.value} className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="radio"
              name="budget-kind"
              checked={deck.budget.kind === option.value}
              onChange={() => handleBudgetKindChange(option.value)}
              className="h-5 w-5"
            />
            {option.label}
          </label>
        ))}

        {deck.budget.kind !== "free" && (
          <Field
            label={`Montant (${deck.currency})`}
            htmlFor="deck-budget-amount"
          >
            <input
              id="deck-budget-amount"
              type="number"
              min={0}
              value={deck.budget.amount}
              onChange={(e) =>
                onChange({ budget: { kind: deck.budget.kind as "suggested" | "fixed", amount: Number(e.target.value) || 0 } })
              }
              className={inputClass}
            />
          </Field>
        )}
      </fieldset>
    </section>
  );
}
