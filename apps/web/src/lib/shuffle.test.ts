import { describe, expect, it, vi } from "vitest";
import { shuffle } from "./shuffle";

describe("shuffle", () => {
  it("ne mute pas le tableau d'origine", () => {
    const original = [1, 2, 3, 4, 5];
    const copy = [...original];
    shuffle(original);
    expect(original).toEqual(copy);
  });

  it("conserve tous les éléments (même multi-ensemble)", () => {
    const original = ["a", "b", "c", "d", "e", "f"];
    const result = shuffle(original);
    expect(result).toHaveLength(original.length);
    expect([...result].sort()).toEqual([...original].sort());
  });

  it("gère les tableaux vides et à un élément", () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle([42])).toEqual([42]);
  });

  it("produit l'ordre déterminé par Math.random (Fisher-Yates)", () => {
    const randomValues = [0, 0, 0];
    vi.spyOn(Math, "random").mockImplementation(() => randomValues.shift() ?? 0);

    // Avec Math.random figé à 0, chaque tirage prend l'indice 0 : la
    // séquence d'échanges Fisher-Yates est entièrement déterminée.
    expect(shuffle([1, 2, 3, 4])).toEqual([2, 3, 4, 1]);

    vi.restoreAllMocks();
  });
});
