/**
 * Mélange Fisher-Yates, sans mutation du tableau d'origine.
 * Utilisé pour l'option « ordre aléatoire côté joueur » du deck (§3.1).
 */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
