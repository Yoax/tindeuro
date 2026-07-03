import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rateLimit";

describe("createRateLimiter", () => {
  it("autorise jusqu'à `max` appels dans la fenêtre", () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 3 });
    expect(limiter.check("ip-1", 0)).toBe(true);
    expect(limiter.check("ip-1", 10)).toBe(true);
    expect(limiter.check("ip-1", 20)).toBe(true);
  });

  it("bloque au-delà de `max` dans la même fenêtre", () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 2 });
    expect(limiter.check("ip-1", 0)).toBe(true);
    expect(limiter.check("ip-1", 10)).toBe(true);
    expect(limiter.check("ip-1", 20)).toBe(false);
  });

  it("réinitialise le compteur une fois la fenêtre écoulée", () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 1 });
    expect(limiter.check("ip-1", 0)).toBe(true);
    expect(limiter.check("ip-1", 500)).toBe(false);
    expect(limiter.check("ip-1", 1000)).toBe(true);
  });

  it("suit chaque clé indépendamment", () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 1 });
    expect(limiter.check("ip-1", 0)).toBe(true);
    expect(limiter.check("ip-2", 0)).toBe(true);
    expect(limiter.check("ip-1", 0)).toBe(false);
    expect(limiter.check("ip-2", 0)).toBe(false);
  });
});
