import type { DeckStore } from "./store";

/**
 * Rétention des decks — voir SPEC.md §4 : « deck supprimé après 180 jours
 * sans accès (cron interne). Chaque GET rafraîchit la date. »
 */

export const RETENTION_MS = 180 * 24 * 60 * 60 * 1000;

export function pruneExpiredDecks(store: DeckStore, now: number = Date.now(), retentionMs = RETENTION_MS): number {
  return store.pruneOlderThan(now - retentionMs);
}

/**
 * Démarre le balayage périodique (cron interne). Utilisé uniquement par le
 * serveur réel — les tests appellent `pruneExpiredDecks` directement.
 * Retourne une fonction d'arrêt.
 */
export function startRetentionSchedule(
  store: DeckStore,
  intervalMs: number = 24 * 60 * 60 * 1000,
): () => void {
  const timer = setInterval(() => pruneExpiredDecks(store), intervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
}
