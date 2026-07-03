import type { Card, Deck } from "@budget-game/shared";

/**
 * Deck d'exemple embarqué — « Un mois ordinaire » (voir SPEC.md §5).
 * Sert à la fois de démo joueur et de modèle dans l'éditeur
 * (« Partir de l'exemple »).
 */

const cards: Card[] = [
  {
    id: "kebab-collegues",
    kind: "decision",
    text: "Tes collègues vont déjeuner au kebab, tu viens ?",
    cost: 9,
    category: "Sorties & social",
    visibility: "exact",
    tags: ["pression-sociale"],
  },
  {
    id: "promo-baskets",
    kind: "decision",
    text: "Promo flash : −40 % sur les baskets que tu regardes depuis un mois. Aujourd'hui seulement.",
    cost: 45,
    category: "Achats plaisir",
    tags: ["urgence-artificielle"],
  },
  {
    id: "essai-streaming",
    kind: "decision",
    text: "Essai gratuit 7 jours d'une plateforme de streaming, carte demandée.",
    cost: 13,
    category: "Abonnements",
    recurring: { times: 1, label: "par mois ensuite" },
    tags: ["recurrent"],
  },
  {
    id: "sortie-scolaire",
    kind: "decision",
    text: "Ta fille a besoin de 8 € pour la sortie scolaire.",
    cost: 8,
    category: "Enfants & famille",
  },
  {
    id: "avance-ami",
    kind: "decision",
    text: "Un ami te demande de lui avancer 20 € jusqu'à la fin du mois.",
    cost: 20,
    category: "Sorties & social",
    tags: ["pression-sociale"],
  },
  {
    id: "plat-a-emporter",
    kind: "decision",
    text: "Il reste du pain et des pâtes, mais plus vraiment d'idées. Tu commandes un plat à emporter ce soir ?",
    cost: 14,
    category: "Alimentation",
  },
  {
    id: "baskets-fils",
    kind: "decision",
    text: "Ton fils insiste pour la paire de baskets à la mode, celle que tout le monde a à l'école.",
    cost: 55,
    costRange: { min: 45, max: 65 },
    category: "Enfants & famille",
    visibility: "range",
    tags: ["pression-sociale"],
  },
  {
    id: "carte-fidelite",
    kind: "decision",
    text: "Carte de fidélité du supermarché : 10 € offerts si tu dépenses 50 € aujourd'hui.",
    cost: 50,
    category: "Alimentation",
    tags: ["urgence-artificielle"],
  },
  {
    id: "abonnement-sport",
    kind: "decision",
    text: "Un abonnement de sport à prix cassé, valable seulement cette semaine.",
    cost: 29,
    category: "Abonnements",
    recurring: { times: 11, label: "par mois ensuite" },
    tags: ["urgence-artificielle", "recurrent"],
  },
  {
    id: "anniversaire-amie",
    kind: "decision",
    text: "Une amie organise sa soirée d'anniversaire dans un restaurant en ville.",
    cost: 35,
    category: "Sorties & social",
    tags: ["pression-sociale"],
  },
  {
    id: "vtc-greve",
    kind: "decision",
    text: "Le bus est en grève. Tu prends un VTC pour aller au rendez-vous.",
    cost: 18,
    category: "Transport",
  },
  {
    id: "hausse-prelevement",
    kind: "decision",
    text: "Le fournisseur d'électricité augmente sa mensualité de prélèvement.",
    cost: 12,
    category: "Maison",
    recurring: { times: 11, label: "chaque mois" },
    tags: ["recurrent"],
  },
  {
    id: "chargeur-promo",
    kind: "decision",
    text: "Une appli te propose un chargeur de téléphone à moitié prix, livraison incluse.",
    cost: 15,
    category: "Achats plaisir",
  },
  {
    id: "machine-a-laver",
    kind: "event",
    text: "Ta machine à laver fuit. Le dépanneur prend 60 €.",
    cost: 60,
    category: "Imprévus",
    tags: ["imprevu"],
  },
  {
    id: "pneu-creve",
    kind: "event",
    text: "Ta voiture a un pneu à plat. Il faut le remplacer avant demain.",
    cost: 80,
    category: "Imprévus",
    tags: ["imprevu"],
  },
];

export const exampleDeck: Deck = {
  version: 1,
  id: "exemple-un-mois-ordinaire",
  title: "Un mois ordinaire",
  intro:
    "Tu vas traverser un mois de dépenses du quotidien. Accepte ou refuse chaque situation comme tu le ferais vraiment.",
  currency: "€",
  defaultVisibility: "hidden",
  budget: { kind: "suggested", amount: 150 },
  shuffle: false,
  cards,
};

/** Catégories suggérées dans l'éditeur (datalist, non imposées) — SPEC.md §5. */
export const suggestedCategories = [
  "Alimentation",
  "Sorties & social",
  "Enfants & famille",
  "Maison",
  "Transport",
  "Abonnements",
  "Imprévus",
  "Achats plaisir",
] as const;
