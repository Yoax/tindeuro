import { describe, expect, it } from "vitest";
import { CODE_ALPHABET, CODE_LENGTH, generateCode, generateUniqueCode } from "./codes";

describe("CODE_ALPHABET", () => {
  it("exclut les caractères ambigus (0, O, 1, I, L)", () => {
    for (const forbidden of ["0", "O", "1", "I", "L"]) {
      expect(CODE_ALPHABET).not.toContain(forbidden);
    }
  });
});

describe("generateCode", () => {
  it("produit un code de la bonne longueur, uniquement dans l'alphabet autorisé", () => {
    const code = generateCode();
    expect(code).toHaveLength(CODE_LENGTH);
    for (const char of code) {
      expect(CODE_ALPHABET).toContain(char);
    }
  });

  it("est déterministe pour un générateur aléatoire donné", () => {
    const sequence = [0, 0.2, 0.4, 0.6, 0.8];
    let i = 0;
    const random = () => sequence[i++];
    const code = generateCode(random);
    const expected = sequence.map((r) => CODE_ALPHABET[Math.floor(r * CODE_ALPHABET.length)]).join("");
    expect(code).toBe(expected);
  });
});

describe("generateUniqueCode", () => {
  it("retourne un code non pris directement s'il n'y a pas de collision", () => {
    const code = generateUniqueCode(() => false);
    expect(code).toHaveLength(CODE_LENGTH);
  });

  it("retire un nouveau code tant que le prédicat exists signale une collision", () => {
    let existsCallCount = 0;
    const exists = () => {
      existsCallCount++;
      return existsCallCount === 1; // le premier essai est toujours "pris"
    };
    const code = generateUniqueCode(exists);
    expect(existsCallCount).toBe(2);
    expect(code).toHaveLength(CODE_LENGTH);
  });

  it("lève une erreur si tous les essais collisionnent", () => {
    expect(() => generateUniqueCode(() => true, Math.random, 5)).toThrow();
  });
});
