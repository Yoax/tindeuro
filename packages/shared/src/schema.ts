import { z } from "zod";

/**
 * Schémas zod miroir des types de `types.ts`, utilisés pour valider :
 * - le deck décodé depuis le lien auto-porteur (fragment d'URL),
 * - le deck importé/exporté en JSON dans l'éditeur,
 * - le body des routes du backend (POST/PUT /api/decks).
 */

export const costVisibilitySchema = z.enum(["hidden", "exact", "range"]);

export const budgetModeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("free") }),
  z.object({ kind: z.literal("suggested"), amount: z.number().nonnegative() }),
  z.object({ kind: z.literal("fixed"), amount: z.number().nonnegative() }),
]);

export const costRangeSchema = z.object({
  min: z.number().nonnegative(),
  max: z.number().nonnegative(),
});

export const recurringSchema = z.object({
  times: z.number().int().positive(),
  label: z.string().min(1),
});

export const cardSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["decision", "event"]),
  text: z.string().min(1),
  cost: z.number().nonnegative(),
  costRange: costRangeSchema.optional(),
  category: z.string().min(1),
  visibility: costVisibilitySchema.optional(),
  recurring: recurringSchema.optional(),
  tags: z.array(z.string()).optional(),
});

export const deckSchema = z.object({
  version: z.literal(1),
  id: z.string().min(1),
  title: z.string().min(1),
  intro: z.string().optional(),
  currency: z.string().min(1),
  defaultVisibility: costVisibilitySchema,
  budget: budgetModeSchema,
  shuffle: z.boolean(),
  cards: z.array(cardSchema),
});
