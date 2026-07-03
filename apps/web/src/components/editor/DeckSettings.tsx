import { useEffect, useState, type FormEvent } from "react";
import type { BudgetMode, CostVisibility, Deck } from "@budget-game/shared";
import Field, { inputClass } from "../ui/Field";
import Button from "../ui/Button";

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

type CategoryRowProps = {
  name: string;
  inUse: boolean;
  onRename: (oldName: string, newName: string) => void;
  onRemove: (name: string) => void;
};

function CategoryRow({ name, inUse, onRename, onRemove }: CategoryRowProps) {
  const [value, setValue] = useState(name);

  useEffect(() => {
    setValue(name);
  }, [name]);

  function commitRename() {
    const trimmed = value.trim();
    if (trimmed && trimmed !== name) onRename(name, trimmed);
    else setValue(name);
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={commitRename}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commitRename();
          }
        }}
        className={`${inputClass} min-h-11 flex-1`}
        aria-label={`Catégorie ${name}`}
      />
      <button
        type="button"
        onClick={() => onRemove(name)}
        disabled={inUse}
        title={inUse ? "Utilisée par au moins une carte" : "Supprimer cette catégorie"}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-lg text-encre/70 hover:bg-fond hover:text-depasse disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        aria-label={inUse ? `${name} — utilisée, non supprimable` : `Supprimer ${name}`}
      >
        ×
      </button>
    </div>
  );
}

/**
 * Réglages généraux du deck — voir SPEC.md §3.1 (étape « Configure le
 * deck ») et §4 (modèle `Deck`).
 */
export default function DeckSettings({ deck, onChange }: DeckSettingsProps) {
  const [newCategory, setNewCategory] = useState("");

  function handleBudgetKindChange(kind: BudgetMode["kind"]) {
    if (kind === "free") {
      onChange({ budget: { kind: "free" } });
      return;
    }
    const amount = deck.budget.kind === "free" ? 0 : deck.budget.amount;
    onChange({ budget: { kind, amount } });
  }

  function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = newCategory.trim();
    if (!trimmed || deck.categories.includes(trimmed)) {
      setNewCategory("");
      return;
    }
    onChange({ categories: [...deck.categories, trimmed] });
    setNewCategory("");
  }

  function removeCategory(name: string) {
    if (deck.cards.some((card) => card.category === name)) return;
    onChange({ categories: deck.categories.filter((category) => category !== name) });
  }

  function renameCategory(oldName: string, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName || deck.categories.includes(trimmed)) return;
    onChange({
      categories: deck.categories.map((category) => (category === oldName ? trimmed : category)),
      cards: deck.cards.map((card) =>
        card.category === oldName ? { ...card, category: trimmed } : card,
      ),
    });
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

      <Field
        label="Catégories"
        htmlFor="deck-category-new"
        hint="Définis les catégories de dépenses pour ton atelier. Elles apparaîtront lors de la création de chaque carte."
      >
        <div className="flex flex-col gap-2">
          {deck.categories.length === 0 && (
            <p className="text-sm text-encre/70">Aucune catégorie pour l&apos;instant — ajoute-en une ci-dessous.</p>
          )}
          {deck.categories.map((category) => (
            <CategoryRow
              key={category}
              name={category}
              inUse={deck.cards.some((card) => card.category === category)}
              onRename={renameCategory}
              onRemove={removeCategory}
            />
          ))}
          <form onSubmit={addCategory} className="flex gap-2 pt-1">
            <input
              id="deck-category-new"
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
              placeholder="Ex. Alimentation"
              className={`${inputClass} min-h-11 flex-1`}
            />
            <Button type="submit" variant="ghost" className="shrink-0 bg-white shadow-sm">
              Ajouter
            </Button>
          </form>
        </div>
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
          <Field label={`Montant (${deck.currency})`} htmlFor="deck-budget-amount">
            <input
              id="deck-budget-amount"
              type="number"
              min={0}
              value={deck.budget.amount}
              onChange={(e) =>
                onChange({
                  budget: { kind: deck.budget.kind as "suggested" | "fixed", amount: Number(e.target.value) || 0 },
                })
              }
              className={inputClass}
            />
          </Field>
        )}
      </fieldset>
    </section>
  );
}
