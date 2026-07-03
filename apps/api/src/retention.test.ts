import { describe, expect, it, vi } from "vitest";
import { pruneExpiredDecks, RETENTION_MS } from "./retention";
import type { DeckStore } from "./store";

function fakeStore(pruneOlderThan: DeckStore["pruneOlderThan"]): DeckStore {
  return {
    createDeck: vi.fn(),
    getDeck: vi.fn(),
    updateDeck: vi.fn(),
    pruneOlderThan,
  };
}

describe("pruneExpiredDecks", () => {
  it("appelle pruneOlderThan avec la coupure à 180 jours avant `now`", () => {
    const pruneOlderThan = vi.fn(() => 0);
    const store = fakeStore(pruneOlderThan);
    const now = 1_000_000_000_000;

    pruneExpiredDecks(store, now);

    expect(pruneOlderThan).toHaveBeenCalledWith(now - RETENTION_MS);
  });

  it("retourne le nombre de decks supprimés", () => {
    const store = fakeStore(() => 3);
    expect(pruneExpiredDecks(store)).toBe(3);
  });
});
