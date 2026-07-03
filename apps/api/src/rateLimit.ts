/**
 * Limitation de débit en mémoire, fenêtre fixe par clé (ex. adresse IP) —
 * voir SPEC.md §4 : « rate limiting sur POST (ex. 20/h/IP) ». Rien
 * d'autre en v1, pas d'authentification : c'est la seule barrière.
 */

export interface RateLimiter {
  /** `true` si l'appel est autorisé (et compté), `false` s'il est limité. */
  check(key: string, now?: number): boolean;
}

export function createRateLimiter({ windowMs, max }: { windowMs: number; max: number }): RateLimiter {
  const hits = new Map<string, { count: number; windowStart: number }>();

  return {
    check(key, now = Date.now()) {
      const entry = hits.get(key);
      if (!entry || now - entry.windowStart >= windowMs) {
        hits.set(key, { count: 1, windowStart: now });
        return true;
      }
      if (entry.count >= max) return false;
      entry.count += 1;
      return true;
    },
  };
}
