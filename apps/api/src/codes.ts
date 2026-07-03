/**
 * Génération des codes courts — voir SPEC.md §4.
 *
 * 5 caractères, alphabet sans ambiguïté (pas de 0/O, 1/I/L) : lisibles au
 * tableau, dictables à voix haute. En cas de collision (code déjà pris),
 * on retire.
 */

export const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const CODE_LENGTH = 5;

export function generateCode(random: () => number = Math.random): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)];
  }
  return code;
}

/**
 * Génère un code garanti disponible d'après le prédicat `exists`.
 * Lève une erreur après `maxAttempts` collisions (signe d'un espace de
 * codes presque épuisé, à surveiller mais improbable en v1).
 */
export function generateUniqueCode(
  exists: (code: string) => boolean,
  random: () => number = Math.random,
  maxAttempts = 50,
): string {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateCode(random);
    if (!exists(code)) return code;
  }
  throw new Error("Impossible de générer un code court disponible après plusieurs tentatives.");
}
