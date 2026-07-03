import { useState, type FormEvent } from "react";
import { nanoid } from "nanoid";
import type { Card, CardKind, CostVisibility } from "@budget-game/shared";
import Field, { inputClass } from "../ui/Field";
import Button from "../ui/Button";

type CardFormProps = {
  initial: Card | null;
  categories: string[];
  deckDefaultVisibility: CostVisibility;
  onSave: (card: Card) => void;
  onCancel: () => void;
  onDelete?: () => void;
};

const visibilityLabels: Record<CostVisibility, string> = {
  hidden: "cachée",
  exact: "exacte",
  range: "fourchette",
};

/**
 * Création / édition d'une carte — voir SPEC.md §3.1 et §4. Un même
 * formulaire pour les cartes décision et événement : seul le comportement
 * en jeu diffère (swipe vs bouton « Continuer »), pas les champs.
 */
export default function CardForm({
  initial,
  categories,
  deckDefaultVisibility,
  onSave,
  onCancel,
  onDelete,
}: CardFormProps) {
  const [kind, setKind] = useState<CardKind>(initial?.kind ?? "decision");
  const [text, setText] = useState(initial?.text ?? "");
  const [cost, setCost] = useState(initial ? String(initial.cost) : "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [visibilityOverride, setVisibilityOverride] = useState<CostVisibility | "">(initial?.visibility ?? "");
  const [rangeMin, setRangeMin] = useState(initial?.costRange ? String(initial.costRange.min) : "");
  const [rangeMax, setRangeMax] = useState(initial?.costRange ? String(initial.costRange.max) : "");
  const [recurringEnabled, setRecurringEnabled] = useState(Boolean(initial?.recurring));
  const [recurringTimes, setRecurringTimes] = useState(initial?.recurring ? String(initial.recurring.times) : "1");
  const [recurringLabel, setRecurringLabel] = useState(initial?.recurring?.label ?? "par mois ensuite");
  const [tagsText, setTagsText] = useState(initial?.tags?.join(", ") ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedText = text.trim();
    const trimmedCategory = category.trim();
    const parsedCost = Number(cost);

    if (!trimmedText) {
      setError("La situation ne peut pas être vide.");
      return;
    }
    if (!trimmedCategory) {
      setError("Choisis une catégorie.");
      return;
    }
    if (!Number.isFinite(parsedCost) || parsedCost < 0) {
      setError("Le coût doit être un nombre positif.");
      return;
    }

    let costRange: Card["costRange"];
    if (visibilityOverride === "range") {
      const min = Number(rangeMin);
      const max = Number(rangeMax);
      if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min) {
        setError("La fourchette doit être deux nombres valides, minimum ≤ maximum.");
        return;
      }
      costRange = { min, max };
    }

    let recurring: Card["recurring"];
    if (recurringEnabled) {
      const times = Number(recurringTimes);
      const trimmedLabel = recurringLabel.trim();
      if (!Number.isInteger(times) || times < 1 || !trimmedLabel) {
        setError("La récurrence a besoin d'un nombre de fois (au moins 1) et d'un libellé.");
        return;
      }
      recurring = { times, label: trimmedLabel };
    }

    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const card: Card = {
      id: initial?.id ?? nanoid(8),
      kind,
      text: trimmedText,
      cost: parsedCost,
      category: trimmedCategory,
      ...(visibilityOverride ? { visibility: visibilityOverride } : {}),
      ...(costRange ? { costRange } : {}),
      ...(recurring ? { recurring } : {}),
      ...(tags.length > 0 ? { tags } : {}),
    };

    setError(null);
    onSave(card);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-encre/10 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold">{initial ? "Modifier la carte" : "Nouvelle carte"}</h3>
        <div className="flex overflow-hidden rounded-lg border border-encre/20 text-sm">
          <button
            type="button"
            onClick={() => setKind("decision")}
            className={`px-3 py-1.5 ${kind === "decision" ? "bg-accent text-white" : "text-encre/70"}`}
          >
            Décision
          </button>
          <button
            type="button"
            onClick={() => setKind("event")}
            className={`px-3 py-1.5 ${kind === "event" ? "bg-accent text-white" : "text-encre/70"}`}
          >
            Événement
          </button>
        </div>
      </div>
      {kind === "event" && (
        <p className="text-xs text-encre/50">
          Une carte événement ne se refuse pas : le joueur n'a qu'un bouton « Continuer ».
        </p>
      )}

      <Field label="Situation" htmlFor="card-text">
        <textarea
          id="card-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="Ex. Tes collègues vont déjeuner au kebab, tu viens ?"
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Coût" htmlFor="card-cost">
          <input
            id="card-cost"
            type="number"
            min={0}
            step="0.5"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Catégorie" htmlFor="card-category">
          <input
            id="card-category"
            list="categories-suggestions"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
      <datalist id="categories-suggestions">
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <Field
        label="Visibilité du coût"
        htmlFor="card-visibility"
        hint={`Vide = hérite du deck (actuellement : ${visibilityLabels[deckDefaultVisibility]}).`}
      >
        <select
          id="card-visibility"
          value={visibilityOverride}
          onChange={(e) => setVisibilityOverride(e.target.value as CostVisibility | "")}
          className={inputClass}
        >
          <option value="">Hérité du deck</option>
          <option value="hidden">Cachée</option>
          <option value="exact">Exacte</option>
          <option value="range">Fourchette</option>
        </select>
      </Field>

      {visibilityOverride === "range" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Minimum affiché" htmlFor="card-range-min">
            <input
              id="card-range-min"
              type="number"
              min={0}
              value={rangeMin}
              onChange={(e) => setRangeMin(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Maximum affiché" htmlFor="card-range-max">
            <input
              id="card-range-max"
              type="number"
              min={0}
              value={rangeMax}
              onChange={(e) => setRangeMax(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={recurringEnabled}
          onChange={(e) => setRecurringEnabled(e.target.checked)}
          className="h-5 w-5"
        />
        Dépense récurrente
      </label>

      {recurringEnabled && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombre de fois" htmlFor="card-recurring-times">
            <input
              id="card-recurring-times"
              type="number"
              min={1}
              step={1}
              value={recurringTimes}
              onChange={(e) => setRecurringTimes(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Libellé" htmlFor="card-recurring-label">
            <input
              id="card-recurring-label"
              value={recurringLabel}
              onChange={(e) => setRecurringLabel(e.target.value)}
              placeholder="par mois ensuite"
              className={inputClass}
            />
          </Field>
        </div>
      )}

      <Field
        label="Tags pédagogiques (optionnel)"
        htmlFor="card-tags"
        hint="Séparés par des virgules — ex. pression-sociale, recurrent"
      >
        <input
          id="card-tags"
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          className={inputClass}
        />
      </Field>

      {error && (
        <p role="alert" className="text-sm text-depasse">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit">Enregistrer</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="min-h-11 rounded-lg px-4 py-3 font-medium text-depasse underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Supprimer la carte
          </button>
        )}
      </div>
    </form>
  );
}
