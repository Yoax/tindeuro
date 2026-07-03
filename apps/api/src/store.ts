import { randomBytes } from "node:crypto";
import type Database from "better-sqlite3";
import type { Deck } from "@budget-game/shared";
import { generateUniqueCode } from "./codes";

/**
 * Persistance des decks — voir SPEC.md §4. Une seule table, aucune donnée
 * de joueur : le serveur ne stocke que du contenu pédagogique (le deck),
 * jamais de résultats de partie.
 */

export function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS decks (
      code TEXT PRIMARY KEY,
      json TEXT NOT NULL,
      edit_key TEXT NOT NULL,
      last_access INTEGER NOT NULL
    );
  `);
}

function generateEditKey(): string {
  return randomBytes(18).toString("base64url");
}

export interface DeckStore {
  createDeck(deck: Deck, now?: number): { code: string; editKey: string };
  getDeck(code: string, now?: number): Deck | null;
  /** Retourne `true` si `editKey` correspondait, `false` sinon (code inconnu ou clé incorrecte). */
  updateDeck(code: string, editKey: string, deck: Deck, now?: number): boolean;
  /** Supprime les decks dont le dernier accès est antérieur à `cutoff` ; retourne le nombre supprimé. */
  pruneOlderThan(cutoff: number): number;
}

export function createStore(db: Database.Database): DeckStore {
  migrate(db);

  const codeExistsStmt = db.prepare("SELECT 1 FROM decks WHERE code = ?");
  const insertStmt = db.prepare(
    "INSERT INTO decks (code, json, edit_key, last_access) VALUES (?, ?, ?, ?)",
  );
  const selectJsonStmt = db.prepare("SELECT json FROM decks WHERE code = ?");
  const touchStmt = db.prepare("UPDATE decks SET last_access = ? WHERE code = ?");
  const selectEditKeyStmt = db.prepare("SELECT edit_key FROM decks WHERE code = ?");
  const updateStmt = db.prepare("UPDATE decks SET json = ?, last_access = ? WHERE code = ?");
  const pruneStmt = db.prepare("DELETE FROM decks WHERE last_access < ?");

  function codeExists(code: string): boolean {
    return codeExistsStmt.get(code) !== undefined;
  }

  return {
    createDeck(deck, now = Date.now()) {
      const code = generateUniqueCode(codeExists);
      const editKey = generateEditKey();
      insertStmt.run(code, JSON.stringify(deck), editKey, now);
      return { code, editKey };
    },

    getDeck(code, now = Date.now()) {
      const row = selectJsonStmt.get(code) as { json: string } | undefined;
      if (!row) return null;
      touchStmt.run(now, code);
      return JSON.parse(row.json) as Deck;
    },

    updateDeck(code, editKey, deck, now = Date.now()) {
      const row = selectEditKeyStmt.get(code) as { edit_key: string } | undefined;
      if (!row || row.edit_key !== editKey) return false;
      updateStmt.run(JSON.stringify(deck), now, code);
      return true;
    },

    pruneOlderThan(cutoff) {
      return pruneStmt.run(cutoff).changes;
    },
  };
}
