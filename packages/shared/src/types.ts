/**
 * Modèle de données du jeu — voir SPEC.md §4.
 */

export type CostVisibility = "hidden" | "exact" | "range";

export type BudgetMode =
  | { kind: "free" } // le joueur saisit librement
  | { kind: "suggested"; amount: number } // pré-rempli, modifiable
  | { kind: "fixed"; amount: number }; // imposé

export type CardKind = "decision" | "event";

export type CostRange = { min: number; max: number };

export type Recurring = { times: number; label: string };

export type Card = {
  id: string; // nanoid court
  kind: CardKind; // event = dépense subie, non refusable
  text: string; // la situation, 1–3 phrases, tutoiement
  cost: number; // coût réel utilisé dans le calcul final
  costRange?: CostRange; // requis si visibility === "range" (affichage uniquement ; le calcul utilise `cost`)
  category: string; // libre, avec suggestions
  visibility?: CostVisibility; // absent = hérite du deck
  recurring?: Recurring; // coût total = cost × times, révélé à la fin
  tags?: string[]; // pédagogiques : "pression-sociale", "urgence-artificielle", "recurrent", "imprevu"
};

export type Deck = {
  version: 1; // versionnage du schéma pour compat future
  id: string;
  title: string;
  intro?: string; // message de l'animateur affiché avant la partie
  currency: string; // "€" par défaut
  defaultVisibility: CostVisibility;
  budget: BudgetMode;
  shuffle: boolean;
  cards: Card[];
};
