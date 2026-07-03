import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import { nanoid } from "nanoid";
import { z } from "zod";
import { deckSchema, normalizeDeckCategories, type Card, type CostVisibility, type Deck } from "@budget-game/shared";

/**
 * Codec du canal de repli (deck auto-porteur dans le fragment d'URL) —
 * voir SPEC.md §4 « Canal de repli ».
 *
 * Le format minifié :
 * - utilise des clés à une lettre,
 * - omet les valeurs par défaut (tags vides, visibilité héritée, kind
 *   "decision", shuffle à false, currency "€"),
 * - déduplique les catégories dans un tableau référencé par index,
 * - ne transporte aucun id (les ids sont régénérés au décodage — ils ne
 *   servent qu'en interne, jamais à la logique de jeu ni à l'affichage).
 *
 * Le résultat est ensuite compressé avec lz-string
 * (`compressToEncodedURIComponent`) pour tenir dans le fragment d'URL
 * (`#...`), qui n'est jamais envoyé au serveur.
 */

const DEFAULT_CURRENCY = "€";

type MinifiedVisibility = "h" | "x" | "r";

const visibilityToLetter: Record<CostVisibility, MinifiedVisibility> = {
  hidden: "h",
  exact: "x",
  range: "r",
};

const letterToVisibility: Record<MinifiedVisibility, CostVisibility> = {
  h: "hidden",
  x: "exact",
  r: "range",
};

// Budget minifié : 0 = libre ; [1, montant] = suggéré ; [2, montant] = imposé.
type MinifiedBudget = 0 | [1, number] | [2, number];

type MinifiedCard = {
  t: string; // text
  c: number; // cost
  e?: true; // event flag, omis si kind === "decision" (la valeur par défaut)
  r?: [number, number]; // costRange [min, max]
  g: number; // index dans le tableau de catégories dédupliquées du deck
  v?: MinifiedVisibility; // omis = hérite du deck
  n?: [number, string]; // recurring [times, label]
  a?: string[]; // tags, omis si vide
  u?: string; // imageUrl, omis si absente
};

type MinifiedDeck = {
  v: 1; // version
  t: string; // title
  i?: string; // intro
  c?: string; // currency, omis si === "€"
  d: MinifiedVisibility; // defaultVisibility
  b: MinifiedBudget; // budget
  s?: true; // shuffle, omis si false
  g: string[]; // catégories dédupliquées
  q: MinifiedCard[]; // cards
};

const minifiedCardSchema = z.object({
  t: z.string().min(1),
  c: z.number().nonnegative(),
  e: z.literal(true).optional(),
  r: z.tuple([z.number().nonnegative(), z.number().nonnegative()]).optional(),
  g: z.number().int().nonnegative(),
  v: z.enum(["h", "x", "r"]).optional(),
  n: z.tuple([z.number().int().positive(), z.string().min(1)]).optional(),
  a: z.array(z.string()).optional(),
  u: z.string().min(1).optional(),
});

const minifiedBudgetSchema = z.union([
  z.literal(0),
  z.tuple([z.literal(1), z.number().nonnegative()]),
  z.tuple([z.literal(2), z.number().nonnegative()]),
]);

const minifiedDeckSchema = z.object({
  v: z.literal(1),
  t: z.string().min(1),
  i: z.string().optional(),
  c: z.string().optional(),
  d: z.enum(["h", "x", "r"]),
  b: minifiedBudgetSchema,
  s: z.literal(true).optional(),
  g: z.array(z.string()),
  q: z.array(minifiedCardSchema),
});

function minifyBudget(budget: Deck["budget"]): MinifiedBudget {
  switch (budget.kind) {
    case "free":
      return 0;
    case "suggested":
      return [1, budget.amount];
    case "fixed":
      return [2, budget.amount];
  }
}

function expandBudget(budget: MinifiedBudget): Deck["budget"] {
  if (budget === 0) return { kind: "free" };
  const [kind, amount] = budget;
  return kind === 1 ? { kind: "suggested", amount } : { kind: "fixed", amount };
}

function minifyCard(card: Card, categories: string[]): MinifiedCard {
  let categoryIndex = categories.indexOf(card.category);
  if (categoryIndex === -1) {
    categoryIndex = categories.length;
    categories.push(card.category);
  }

  const minified: MinifiedCard = { t: card.text, c: card.cost, g: categoryIndex };

  if (card.kind === "event") minified.e = true;
  if (card.costRange) minified.r = [card.costRange.min, card.costRange.max];
  if (card.visibility) minified.v = visibilityToLetter[card.visibility];
  if (card.recurring) minified.n = [card.recurring.times, card.recurring.label];
  if (card.tags && card.tags.length > 0) minified.a = card.tags;
  if (card.imageUrl) minified.u = card.imageUrl;

  return minified;
}

function expandCard(minified: MinifiedCard, categories: string[]): Card {
  const category = categories[minified.g];
  if (category === undefined) {
    throw new Error(`Référence de catégorie invalide : ${minified.g}`);
  }

  const card: Card = {
    id: nanoid(8),
    kind: minified.e ? "event" : "decision",
    text: minified.t,
    cost: minified.c,
    category,
  };

  if (minified.r) card.costRange = { min: minified.r[0], max: minified.r[1] };
  if (minified.v) card.visibility = letterToVisibility[minified.v];
  if (minified.n) card.recurring = { times: minified.n[0], label: minified.n[1] };
  if (minified.a && minified.a.length > 0) card.tags = minified.a;
  if (minified.u) card.imageUrl = minified.u;

  return card;
}

export function minifyDeck(deck: Deck): MinifiedDeck {
  const categories = [...deck.categories];
  const cards = deck.cards.map((card) => minifyCard(card, categories));

  const minified: MinifiedDeck = {
    v: 1,
    t: deck.title,
    d: visibilityToLetter[deck.defaultVisibility],
    b: minifyBudget(deck.budget),
    g: categories,
    q: cards,
  };

  if (deck.intro) minified.i = deck.intro;
  if (deck.currency !== DEFAULT_CURRENCY) minified.c = deck.currency;
  if (deck.shuffle) minified.s = true;

  return minified;
}

export function expandDeck(minified: MinifiedDeck): Deck {
  return {
    version: 1,
    id: nanoid(10),
    title: minified.t,
    intro: minified.i,
    currency: minified.c ?? DEFAULT_CURRENCY,
    defaultVisibility: letterToVisibility[minified.d],
    budget: expandBudget(minified.b),
    shuffle: minified.s ?? false,
    categories: [...minified.g],
    cards: minified.q.map((card) => expandCard(card, minified.g)),
  };
}

/**
 * Encode un deck pour le canal de repli : à placer après `#` dans l'URL
 * (ex. `https://…/jouer#${encodeDeckToFragment(deck)}`).
 */
export function encodeDeckToFragment(deck: Deck): string {
  const minified = minifyDeck(deck);
  return compressToEncodedURIComponent(JSON.stringify(minified));
}

export type DecodeDeckResult =
  | { ok: true; deck: Deck }
  | { ok: false; reason: "empty" | "decompression" | "json" | "schema" };

/**
 * Décode un deck depuis le contenu du fragment d'URL (canal de repli).
 * Ne lève jamais d'exception : retourne un résultat discriminé pour que
 * l'appelant affiche un écran d'erreur bienveillant en cas d'échec
 * (voir SPEC.md §4 : « Ce lien semble incomplet. »).
 */
export function decodeDeckFromFragment(fragment: string): DecodeDeckResult {
  if (!fragment) return { ok: false, reason: "empty" };

  const decompressed = decompressFromEncodedURIComponent(fragment);
  if (!decompressed) return { ok: false, reason: "decompression" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(decompressed);
  } catch {
    return { ok: false, reason: "json" };
  }

  const minifiedResult = minifiedDeckSchema.safeParse(parsed);
  if (!minifiedResult.success) return { ok: false, reason: "schema" };

  let deck: Deck;
  try {
    deck = expandDeck(minifiedResult.data);
  } catch {
    return { ok: false, reason: "schema" };
  }

  const deckResult = deckSchema.safeParse(deck);
  if (!deckResult.success) return { ok: false, reason: "schema" };

  return { ok: true, deck: normalizeDeckCategories(deckResult.data) };
}
