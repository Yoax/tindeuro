import { useRef, type ChangeEvent } from "react";
import { deckSchema, type Deck } from "@budget-game/shared";
import Button from "../ui/Button";

type ImportExportProps = {
  deck: Deck;
  onImport: (deck: Deck) => void;
};

/**
 * Export / import JSON du deck — pour archiver et partager entre
 * animateurs sans dépendre du backend (voir SPEC.md §2 et §9 étape 6).
 */
export default function ImportExport({ deck, onImport }: ImportExportProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    const blob = new Blob([JSON.stringify(deck, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = deck.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    link.href = url;
    link.download = `${safeName || "deck"}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      const result = deckSchema.safeParse(parsed);
      if (!result.success) {
        window.alert("Ce fichier ne semble pas être un deck valide.");
        return;
      }
      onImport(result.data);
    } catch {
      window.alert("Impossible de lire ce fichier JSON.");
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="ghost" onClick={handleExport}>
        Exporter en JSON
      </Button>
      <Button variant="ghost" onClick={() => inputRef.current?.click()}>
        Importer un JSON
      </Button>
      <input ref={inputRef} type="file" accept="application/json" onChange={handleFileChange} className="hidden" />
    </div>
  );
}
