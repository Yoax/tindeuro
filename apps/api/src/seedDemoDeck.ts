import { DEMO_PLAY_CODE, exampleDeck, type DeckStore } from "@budget-game/shared";

/** Publie le deck d'exemple sous le code réservé TEST, s'il n'existe pas encore. */
export function seedDemoDeck(store: DeckStore): void {
  store.ensureDeckAtCode(DEMO_PLAY_CODE, exampleDeck);
}
