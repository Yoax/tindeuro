import { deckSchema, type Deck } from "@budget-game/shared";

/**
 * Client du micro-backend de decks — voir SPEC.md §4 et §9 étape 8.
 * Chemin relatif `/api` : en développement, le serveur Vite le proxifie
 * vers le backend local (voir `vite.config.ts`) ; en production, Caddy le
 * route vers le conteneur backend sur le même domaine (pas de CORS
 * exotique). Surchargeable via `VITE_API_BASE` pour un déploiement où
 * l'API vit sur un domaine séparé.
 */
const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

export type PublishResult = { code: string; editKey: string };

/**
 * Publie un nouveau deck. Ne lève jamais d'exception réseau autrement
 * qu'en la laissant remonter : l'appelant (ShareModal) décide de basculer
 * sur le lien auto-porteur en cas d'échec, quel qu'il soit.
 */
export async function publishDeck(deck: Deck): Promise<PublishResult> {
  const res = await fetch(`${API_BASE}/decks`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(deck),
  });
  if (!res.ok) {
    throw new Error(`Échec de la publication (${res.status}).`);
  }
  const data = (await res.json()) as PublishResult;
  return data;
}

/** Corrige un deck déjà publié, sans changer son code — voir SPEC.md §4. */
export async function updateDeck(code: string, editKey: string, deck: Deck): Promise<boolean> {
  const res = await fetch(`${API_BASE}/decks/${code}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ editKey, deck }),
  });
  return res.ok;
}

export type FetchDeckResult =
  | { ok: true; deck: Deck }
  | { ok: false; reason: "not-found" | "network" | "invalid" };

/** Résout un deck depuis son code court (route `/j/:code`). */
export async function fetchDeckByCode(code: string): Promise<FetchDeckResult> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/decks/${code}`);
  } catch {
    return { ok: false, reason: "network" };
  }

  if (res.status === 404) return { ok: false, reason: "not-found" };
  if (!res.ok) return { ok: false, reason: "network" };

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { ok: false, reason: "invalid" };
  }

  const parsed = deckSchema.safeParse(data);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  return { ok: true, deck: parsed.data };
}
