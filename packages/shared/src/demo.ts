/**
 * Code court réservé pour jouer la démo embarquée (« Un mois ordinaire »)
 * sans publication préalable — pratique pour les tests et la découverte.
 *
 * Volontairement en dehors du format aléatoire à 5 caractères (§4) :
 * mémorisable, toujours disponible après seed au démarrage de l'API.
 */
export const DEMO_PLAY_CODE = "TEST";

export function normalizePlayCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isDemoPlayCode(code: string): boolean {
  return normalizePlayCode(code) === DEMO_PLAY_CODE;
}
