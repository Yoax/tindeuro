import { useMemo, useState } from "react";
import { useDeckDraft } from "../lib/useDeckDraft";
import { suggestedCategories } from "../data/exampleDeck";
import DeckSettings from "../components/editor/DeckSettings";
import CardList from "../components/editor/CardList";
import CardForm from "../components/editor/CardForm";
import ImportExport from "../components/editor/ImportExport";
import ShareModal from "../components/editor/ShareModal";
import PlaySession from "../components/play/PlaySession";
import Button from "../components/ui/Button";

/**
 * Mode Animateur — création/édition de deck. Voir SPEC.md §3.1 et §9
 * étape 6 : réglages du deck, gestion des cartes, brouillon localStorage,
 * import/export JSON, deck d'exemple, prévisualisation en mode joueur.
 */
export default function Editor() {
  const {
    deck,
    publishedAs,
    updateSettings,
    saveCard,
    removeCard,
    duplicateCard,
    moveCard,
    loadExample,
    resetBlank,
    replaceDeck,
    markPublished,
  } = useDeckDraft();

  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [sharing, setSharing] = useState(false);

  const categories = useMemo(() => {
    const fromDeck = deck.cards.map((c) => c.category);
    return Array.from(new Set([...suggestedCategories, ...fromDeck]));
  }, [deck.cards]);

  // Un deck sans titre ou sans carte ne peut ni se jouer ni se partager
  // valablement (le schéma du deck exige un titre, et une partie vide
  // n'a pas de sens) — voir SPEC.md §4.
  const canPlay = deck.title.trim().length > 0 && deck.cards.length > 0;

  const editingCard = editingId && editingId !== "new" ? (deck.cards.find((c) => c.id === editingId) ?? null) : null;

  function openPreview() {
    setPreviewKey((k) => k + 1);
    setPreviewing(true);
  }

  function handleResetBlank() {
    if (window.confirm("Repartir d'un deck vide ? Le brouillon actuel sera perdu.")) {
      resetBlank();
      setEditingId(null);
    }
  }

  function handleLoadExample() {
    if (deck.cards.length === 0 || window.confirm("Remplacer le brouillon actuel par le deck d'exemple ?")) {
      loadExample();
      setEditingId(null);
    }
  }

  if (previewing) {
    return (
      <div className="min-h-screen">
        <div className="sticky top-0 z-10 flex justify-center bg-fond/95 py-2 backdrop-blur">
          <Button variant="ghost" onClick={() => setPreviewing(false)}>
            ← Fermer la prévisualisation
          </Button>
        </div>
        <PlaySession key={previewKey} deck={deck} />
      </div>
    );
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold">Créer un atelier</h1>
        <p className="text-encre/70">
          Configure ton deck et ajoute tes cartes. Le brouillon est sauvegardé automatiquement sur cet appareil.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" onClick={handleLoadExample}>
            Partir de l'exemple
          </Button>
          <Button variant="ghost" onClick={handleResetBlank}>
            Nouveau deck
          </Button>
          <ImportExport deck={deck} onImport={(next) => { replaceDeck(next); setEditingId(null); }} />
        </div>
      </header>

      <DeckSettings deck={deck} onChange={updateSettings} />

      <section className="flex flex-col gap-4">
        <CardList
          cards={deck.cards}
          currency={deck.currency}
          onEdit={setEditingId}
          onNew={() => setEditingId("new")}
          onDuplicate={duplicateCard}
          onDelete={(id) => {
            removeCard(id);
            if (editingId === id) setEditingId(null);
          }}
          onMove={moveCard}
        />

        {editingId && (
          <CardForm
            key={editingId}
            initial={editingCard}
            categories={categories}
            deckDefaultVisibility={deck.defaultVisibility}
            onSave={(card) => {
              saveCard(card);
              setEditingId(null);
            }}
            onCancel={() => setEditingId(null)}
            onDelete={
              editingCard
                ? () => {
                    removeCard(editingCard.id);
                    setEditingId(null);
                  }
                : undefined
            }
          />
        )}
      </section>

      <div className="sticky bottom-4 flex flex-col items-center gap-2">
        <div className="flex justify-center gap-3">
          <Button variant="ghost" onClick={openPreview} disabled={!canPlay} className="bg-white shadow-sm">
            Prévisualiser
          </Button>
          <Button onClick={() => setSharing(true)} disabled={!canPlay}>
            Partager
          </Button>
        </div>
        {!canPlay && (
          <p className="text-xs text-encre/50">Ajoute un titre et au moins une carte pour prévisualiser ou partager.</p>
        )}
      </div>

      {sharing && (
        <ShareModal
          deck={deck}
          publishedAs={publishedAs}
          onPublished={markPublished}
          onClose={() => setSharing(false)}
        />
      )}
    </main>
  );
}
