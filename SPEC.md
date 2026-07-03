# Spécification — Jeu d'éducation budgétaire

## 1. Contexte et intention pédagogique

Jeu web utilisé en atelier d'éducation budgétaire avec des adultes en accompagnement social, animé par un travailleur social ou un intervenant (l'« animateur »).

**Mécanique centrale :** le joueur définit une enveloppe de dépenses en début de partie, puis enchaîne des micro-décisions par swipe (accepter / refuser une dépense du quotidien). À la fin, le jeu révèle l'écart entre l'enveloppe prévue et la dépense réelle de ses choix.

L'objectif pédagogique n'est pas de « gagner » mais de produire de la matière pour le débriefing collectif : accumulation des petites dépenses, pression sociale, comptabilité mentale, dépenses récurrentes déguisées.

### Principes non négociables

- **Ton digne et non moralisateur.** Public adulte, souvent en situation de précarité. Aucun score, aucune note, aucun jugement (« échec », « mauvais choix » sont interdits dans l'UI). L'écran final est un constat neutre + des points de discussion.
- **Scénarios réalistes ancrés dans des budgets serrés :** déjeuner entre collègues, sollicitation des enfants, promo « à ne pas rater », avance à un proche, abonnement d'essai, frais imprévus.
- **Aucune donnée personnelle collectée, aucun backend côté joueur.** Tout le calcul se déroule côté client. Chaque joueur voit uniquement son propre écran de résultats.

---

## 2. Décisions produit actées

| Question | Décision |
|---|---|
| Public | Adultes en accompagnement social |
| Visibilité des coûts pendant le swipe | Configurable par l'animateur : mode par défaut au niveau du deck (invisible / exact / fourchette), surcharge possible carte par carte |
| Distribution du deck | Hybride : le deck est publié sur un micro-backend qui renvoie un code court ; le QR encode l'URL courte (`/j/CODE`). Repli sans serveur : deck auto-porteur compressé dans le fragment d'URL |
| Résultats agrégés du groupe | Non (v1) — chaque joueur voit son propre écran |
| Éditeur | Intégré à l'app (mode Animateur), brouillons en localStorage, import/export JSON |
| Enveloppe de départ | Configurable : libre (le joueur choisit), suggérée (pré-remplie, modifiable), ou imposée par le deck |

---

## 3. Parcours utilisateurs

### 3.1 Animateur

1. Ouvre l'app → « Créer un atelier » (mode éditeur).
2. Configure le deck : titre, devise (€ par défaut), mode de visibilité des coûts par défaut, mode d'enveloppe (libre / suggérée / imposée + montant), texte d'intro optionnel affiché aux joueurs.
3. Crée les cartes une à une : texte de la situation, coût (exact ou fourchette min–max), catégorie, visibilité (héritée du deck ou surchargée), tags pédagogiques optionnels, type de carte (décision / événement).
4. Peut réordonner (drag ou boutons monter/descendre), dupliquer, supprimer des cartes. Option « ordre aléatoire côté joueur ».
5. Sauvegarde automatique du brouillon en localStorage. Export / import JSON pour archiver et partager entre animateurs.
6. Clique « Partager » → l'app publie le deck sur le backend et affiche :
   - le code court en très grand (ex. `MK7PA`, projetable),
   - le QR code de l'URL courte `https://…/j/MK7PA` (petit payload → QR peu dense, scannable de loin),
   - et le bouton copier le lien.
   
   Si le backend est injoignable — ou si l'animateur active « Mode hors-ligne » — la modale bascule sans erreur sur le lien auto-porteur (deck compressé dans le fragment, voir §4) avec son QR si la taille le permet.
7. Peut tester son deck en mode joueur sans quitter l'éditeur (« Prévisualiser »).

### 3.2 Joueur

1. **Trois portes d'entrée équivalentes :** scanner le QR (ouvre `/j/CODE`), taper le code court sur la page d'accueil (« J'ai un code »), ou ouvrir un lien reçu par messagerie. Dans les deux premiers cas, le deck est récupéré en un seul GET sur le backend au chargement ; ensuite la partie se déroule entièrement hors-ligne. Le lien auto-porteur (fragment `#`) reste décodé localement sans aucun appel réseau.
2. **Écran d'accueil :** titre du deck, intro de l'animateur, puis définition de l'enveloppe (selon le mode du deck).
3. **Phase de swipe**, interaction façon Tinder (référence explicite, voir §8bis) : une pile de cartes, la carte du dessus se saisit au doigt, s'incline en suivant le drag, et part en vol hors écran quand le seuil est franchi. Swipe droite = « J'accepte / je dépense », swipe gauche = « Je refuse / je passe ». Boutons ✕ / ✓ toujours visibles sous la pile (accessibilité + utilisateurs peu à l'aise avec le geste).
4. Selon la visibilité configurée, la carte affiche : rien, le coût exact, ou une fourchette. **Jamais de cumul affiché pendant la partie.**
5. Les cartes de type « événement » (dépense subie : panne, frais imprévus) ne se swipent pas — un seul bouton « Continuer », le coût s'ajoute d'office.
6. Fin du deck → écran de révélation (voir §6).
7. Bouton « Rejouer » (même deck, remélangé si ordre aléatoire).

---

## 4. Modèle de données (TypeScript)

```ts
type CostVisibility = "hidden" | "exact" | "range";

type BudgetMode =
  | { kind: "free" }                       // le joueur saisit librement
  | { kind: "suggested"; amount: number }  // pré-rempli, modifiable
  | { kind: "fixed"; amount: number };     // imposé

type Card = {
  id: string;                  // nanoid court
  kind: "decision" | "event";  // event = dépense subie, non refusable
  text: string;                // la situation, 1–3 phrases, tutoiement
  cost: number;                // coût réel utilisé dans le calcul final
  costRange?: { min: number; max: number }; // requis si visibility === "range" (affichage uniquement ; le calcul utilise `cost`)
  category: string;            // libre, avec suggestions (voir §5)
  visibility?: CostVisibility; // absent = hérite du deck
  recurring?: { times: number; label: string }; // ex. { times: 4, label: "chaque semaine" } → coût total = cost × times, révélé à la fin
  tags?: string[];             // pédagogiques : "pression-sociale", "urgence-artificielle", "recurrent", "imprevu"
};

type Deck = {
  version: 1;                  // versionnage du schéma pour compat future
  id: string;
  title: string;
  intro?: string;              // message de l'animateur affiché avant la partie
  currency: string;            // "€" par défaut
  defaultVisibility: CostVisibility;
  budget: BudgetMode;
  shuffle: boolean;
  cards: Card[];
};
```

### Canal principal : backend de decks (codes courts)

Micro-service dont le seul rôle est de stocker des decks et de les servir par code court. Aucune donnée joueur, aucun compte, aucun cookie.

```
POST /api/decks          body: Deck (JSON, validé zod côté serveur, max 256 Ko)
                         → 201 { code: "MK7PA" }
GET  /api/decks/:code    → 200 Deck | 404
PUT  /api/decks/:code    body: { editKey, deck }  → met à jour le deck (le code reste valable)
```

- **Codes :** 5 caractères, alphabet sans ambiguïté `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (pas de 0/O, 1/I/L) — lisibles au tableau, dictables à voix haute. Collision → retirage.
- **editKey :** secret aléatoire renvoyé à la création, stocké dans le brouillon localStorage de l'animateur ; permet de corriger un deck déjà distribué sans changer le code.
- **Rétention :** deck supprimé après 180 jours sans accès (cron interne). Chaque GET rafraîchit la date.
- **Protection :** rate limiting sur POST (ex. 20/h/IP), taille max de payload, CORS restreint au domaine du front. Rien d'autre — pas d'authentification en v1, la barrière est le rate limit.
- **Stack :** Node + Hono + better-sqlite3 (une table `decks(code, json, edit_key, last_access)`), ~150 lignes. Conteneur Docker derrière Caddy (`/api/*` → backend, le reste → statique). Testable avec Vitest + injection d'une base en mémoire.
- **RGPD :** le serveur ne voit jamais de données de joueurs (les résultats ne quittent pas le téléphone). Les decks sont du contenu pédagogique, pas des données personnelles.

### Canal de repli : deck auto-porteur dans l'URL

Utilisé automatiquement si le backend est injoignable, ou volontairement (« Mode hors-ligne » dans ShareModal — atelier sans réseau fiable, ou animateur qui ne veut dépendre de rien).

1. **Sérialisation en format minifié** avant compression : clés à 1 lettre, valeurs par défaut omises (tags vides, visibilité héritée, kind decision), catégories déduplicées dans un tableau référencé par index, ids régénérés au décodage. Mesuré : ~40 % de gain sur le payload final par rapport au JSON naïf.
2. Puis compression **lz-string** (`compressToEncodedURIComponent`) → placé dans le fragment : `https://…/jouer#<payload>`.
3. Le fragment n'est jamais envoyé au serveur (confidentialité + fonctionne en hébergement statique pur).
4. Au chargement de `/jouer`, décodage + expansion vers le type `Deck` + validation stricte du schéma (zod). Payload invalide → écran d'erreur bienveillant : « Ce lien semble incomplet. Demande à l'animateur de le régénérer. »
5. Écrire des **tests unitaires** sur minification/expansion et encodage/décodage aller-retour, y compris caractères accentués et decks de 100 cartes.

#### Capacités mesurées du canal de repli (textes de cartes uniques ~110 caractères, codec minifié)

| Canal | Limite technique | Cartes max | Recommandation UX |
|---|---|---|---|
| QR confortable (scan facile au vidéoprojecteur) | ~1 500 car. | ~10–12 | idéal petit deck |
| QR maximal (dense, à afficher en grand) | 2 953 octets | ~30–35 | acceptable |
| Lien partagé (SMS, WhatsApp, mail) | 8 000 car. (garde prudente) | ~140 | toujours disponible |

Via le backend, ces limites disparaissent : le QR encode une URL de ~30 caractères quelle que soit la taille du deck.

---

## 5. Contenu : deck d'exemple embarqué

L'app embarque un deck d'exemple **« Un mois ordinaire »** (~15 cartes) qui sert à la fois de démo joueur et de modèle dans l'éditeur (« Partir de l'exemple »).

**Catégories suggérées** dans l'éditeur (datalist, non imposées) : Alimentation, Sorties & social, Enfants & famille, Maison, Transport, Abonnements, Imprévus, Achats plaisir.

**Exemples de cartes** (à intégrer, rédaction tutoyée, factuelle, sans jugement) :

| Type | Texte | Coût | Catégorie | Tags / récurrent |
|---|---|---|---|---|
| décision | « Tes collègues vont déjeuner au kebab, tu viens ? » | 9 € | Sorties & social | pression-sociale |
| décision | « Promo flash : −40 % sur les baskets que tu regardes depuis un mois. Aujourd'hui seulement. » | 45 € | Achats plaisir | urgence-artificielle |
| décision | « Essai gratuit 7 jours d'une plateforme de streaming, carte demandée. » | 13 € | Abonnements | recurring: `{ times: 1, label: "par mois ensuite" }`, recurrent |
| décision | « Ta fille a besoin de 8 € pour la sortie scolaire. » | 8 € | Enfants & famille | — |
| décision | « Un ami te demande de lui avancer 20 € jusqu'à la fin du mois. » | 20 € | Sorties & social | pression-sociale |
| événement | « Ta machine à laver fuit. Le dépanneur prend 60 €. » | 60 € | Imprévus | imprevu |

---

## 6. Écran de révélation (le cœur du jeu)

Séquence en **3 temps**, révélée progressivement (pas tout d'un coup) :

### 1. Le constat, neutre

- « Tu avais prévu 150 €. Tes choix totalisent 212 €. »
- Si l'enveloppe est tenue : « Tes choix totalisent 132 €. Il te reste 18 €. »

Formulation strictement factuelle, identique en structure dans les deux cas — pas de félicitations appuyées ni de reproche.

### 2. Le ticket de caisse (élément signature, voir §8)

La liste déroulée de toutes les dépenses acceptées, dans l'ordre de la partie, avec coût réel révélé — y compris les coûts qui étaient cachés ou en fourchette. Les récurrentes affichent le détail (« 13 € × label »). En bas du ticket : sous-totaux par catégorie.

### 3. « Et si ? »

Le jeu identifie les 2–3 dépenses acceptées les plus coûteuses et montre : « Sans ces 3 choix, tu serais à 128 € — dans l'enveloppe. » Uniquement des dépenses de type `decision` (jamais les événements subis, qu'on ne peut pas refuser). Si l'enveloppe est tenue même avec tout, cette section devient : « Tes 3 plus grosses dépenses représentent X € sur Y €. »

**Pied de page :** bouton « Rejouer » + mention discrète « Aucune donnée n'est enregistrée ni envoyée. »

---

## 7. Architecture technique

### Stack

#### Frontend (inchangé dans son esprit : statique, autonome)

- **Vite + React 18 + TypeScript** — SPA statique.
- **Tailwind CSS** — avec tokens custom (voir §8), pas les couleurs par défaut.
- **react-router** — routes : `/` (accueil, avec champ « J'ai un code »), `/editeur`, `/jouer` (lien auto-porteur), `/j/:code` (résolution backend).
- **framer-motion** — geste de swipe (drag + seuil + animation de sortie) et transitions de la révélation.
- **lz-string** — compression du deck dans l'URL (canal de repli).
- **zod** — validation du schéma Deck au décodage, à l'import JSON, et partagée avec le backend (package ou dossier commun).
- **qrcode.react** — génération du QR côté client.
- **nanoid** — ids.
- **Vitest** — tests sur : encodage/décodage, calculs de la révélation (totaux, catégories, récurrentes, « et si ? »), validation zod, client API (mock).

#### Backend (petit, optionnel, remplaçable — voir §4)

- Node + Hono + better-sqlite3, conteneur Docker, monorepo avec le front (`apps/web`, `apps/api`, `packages/shared` pour types + schémas zod).
- Le frontend doit fonctionner intégralement sans lui (mode repli automatique).

### Contraintes

- **Mobile-first strict** côté joueur (l'atelier se joue sur téléphone). L'éditeur est pensé desktop/tablette mais doit rester utilisable sur mobile.
- **localStorage uniquement côté éditeur** (brouillons animateur + editKey des decks publiés, clé `budget-game:drafts`). Le mode joueur n'écrit rien en localStorage.
- **Un seul appel réseau côté joueur :** le `GET /api/decks/:code` initial (aucun en mode lien auto-porteur). Rien pendant la partie, rien à la fin.
- **Déploiement :** vite build → statique servi par Caddy ; backend en conteneur derrière `/api/*` (même domaine, pas de CORS exotique). Prévoir base configurable dans `vite.config.ts`.
- **Fonctionne hors-ligne** une fois la page chargée. PWA/installabilité : hors périmètre v1, architecture ne doit pas l'empêcher.

### Découpage (indicatif)

```
apps/
  web/src/
    lib/        → deckCodec.ts (repli URL), api.ts (client backend + fallback), results.ts (calculs révélation)
    data/       → exampleDeck.ts
    pages/      → Home.tsx (+ champ code), Editor.tsx, Play.tsx (gère /jouer et /j/:code)
    components/
      editor/   → DeckSettings, CardList, CardForm, ShareModal (code court + QR + repli), ImportExport
      play/     → BudgetSetup, SwipeCard, SwipeDeck, EventCard, RevealTicket, WhatIf
      ui/       → primitives (Button, Field, Tag…)
  api/src/      → index.ts (routes Hono), store.ts (SQLite), codes.ts (génération), retention.ts
packages/
  shared/       → types Deck/Card + schémas zod (utilisés par web et api)
```

---

## 8. Direction design (brief pour l'implémentation)

Le sujet, c'est l'argent du quotidien : le motif directeur est le **ticket de caisse**, pas le jeu vidéo. Sobriété chaleureuse, zéro gamification clinquante (pas de confettis, pas de badges).

### Élément signature

L'écran de révélation prend la forme d'un ticket de caisse qui se déroule (animation verticale progressive, bord supérieur/inférieur légèrement cranté, montants alignés à droite en chasse fixe). C'est le seul endroit spectaculaire de l'app — tout le reste est calme.

### Typographie

- Montants et ticket en **mono à chasse fixe** (IBM Plex Mono ou Space Mono).
- Corps de texte et cartes en **sans humaniste** très lisible (Public Sans ou Inter), taille généreuse (min 17 px sur mobile — public pas forcément à l'aise avec les petits textes).

### Palette (tokens Tailwind, pas de cream/terracotta par défaut)

| Token | Valeur | Usage |
|---|---|---|
| fond | `#F1F4F3` | gris-vert très clair |
| surfaces | blanc | — |
| encre | `#22302E` | texte principal |
| accent d'action | `#2C5D8F` | bleu profond — boutons, liens |
| sémantique révélation (tenu) | `#1F6F50` | enveloppe tenue |
| sémantique révélation (dépassement) | `#B3402F` | dépassement |

Les couleurs sémantiques sont utilisées **uniquement sur l'écran final**, jamais pendant le swipe (pas de feedback bon/mauvais en cours de partie).

### Accessibilité

- Focus clavier visible.
- `prefers-reduced-motion` respecté (la révélation devient une apparition simple).
- Contraste AA minimum.
- Boutons ≥ 44 px.
- Tout jouable sans geste de swipe.

### Voix de l'interface

Tutoiement, phrases courtes, verbes concrets (« Partager le deck », « Voir le résultat »). Jamais de vocabulaire scolaire ou moralisateur.

---

## 8bis. Interaction de swipe — pattern Tinder (spécification détaillée)

Le mode joueur reproduit fidèlement les codes d'interaction de Tinder, que le public connaît déjà — c'est un choix pédagogique (zéro apprentissage) autant qu'ergonomique :

### Pile de cartes

La carte active occupe l'essentiel de l'écran ; 1 à 2 cartes suivantes sont visibles derrière, légèrement réduites et décalées (scale ~0.95 / 0.9, offset vertical). Quand la carte du dessus part, la suivante remonte en douceur à sa place.

### Drag physique

La carte suit le doigt en translation X (et légèrement Y), avec une rotation proportionnelle au déplacement horizontal (~±12° max, pivot en bas de carte). Relâchée avant le seuil, elle revient au centre avec un ressort (spring).

### Seuil et vol de sortie

Au-delà de ~35 % de la largeur d'écran (ou d'une vélocité suffisante), la carte part en fling hors écran dans la direction du geste, avec rotation qui s'accentue, puis la décision est enregistrée.

### Tampons de décision

Pendant le drag, un tampon en surimpression apparaît en fondu proportionnel au déplacement :

- **« JE PRENDS »** incliné en haut à gauche de la carte quand on tire vers la droite.
- **« JE PASSE »** en haut à droite quand on tire vers la gauche.

Style tampon encré (bordure épaisse, légère rotation), dans l'encre neutre `#22302E` — pas de vert/rouge : accepter une dépense n'est ni bon ni mauvais.

### Boutons façon Tinder

Sous la pile, deux boutons circulaires — ✕ (à gauche, refuser) et ✓ (à droite, accepter) — qui déclenchent exactement la même animation de vol que le geste. Ils servent de fallback accessibilité et d'affordance pour comprendre le sens du swipe.

### Cartes événement

Elles arrivent dans la même pile mais ne se draguent pas horizontalement (résistance élastique forte si on essaie) ; un unique bouton « Continuer » les fait partir vers le bas de l'écran.

### Clavier

- Flèches ← / → déclenchent refus / acceptation avec la même animation.
- Entrée pour « Continuer » sur les événements.

### Reduced motion

Pile statique, la carte disparaît en fondu simple, tampons remplacés par une confirmation textuelle brève.

### Implémentation

**framer-motion** (`drag`, `useMotionValue`, `useTransform` pour rotation et opacité des tampons, `animate` pour le fling). Pas de dépendance à react-tinder-card — le contrôle fin (événements non swipables, reduced-motion, clavier) justifie une implémentation maison d'environ 150 lignes.

---

## 9. Plan de build (ordre des sessions Cursor)

Chaque étape doit compiler et être testable avant de passer à la suivante.

1. **Scaffold monorepo :** `apps/web` (Vite + React + TS + Tailwind, tokens §8, router, pages vides), `packages/shared` (types + zod), `apps/api` vide, vite build vérifié.
2. **Noyau partagé :** types §4 dans shared, schéma zod, deckCodec (repli URL, lz-string) + tests Vitest aller-retour, exampleDeck.
3. **Mode joueur, logique :** `/jouer` — décodage du hash, BudgetSetup, enchaînement des cartes avec boutons Oui/Non (sans geste swipe encore), cartes événement, accumulation d'état.
4. **Révélation :** `results.ts` (+ tests : totaux, catégories, récurrentes, « et si ? ») puis RevealTicket + WhatIf avec la séquence en 3 temps.
5. **Geste de swipe façon Tinder :** implémentation complète du §8bis sur SwipeCard/SwipeDeck — pile, drag avec rotation, tampons « JE PRENDS » / « JE PASSE », seuil + fling, boutons ✕/✓ animés, clavier, reduced-motion.
6. **Éditeur :** DeckSettings + CardForm + CardList (réordonner, dupliquer, supprimer), brouillons localStorage, import/export JSON, « Partir de l'exemple », prévisualisation.
7. **Backend :** `apps/api` — POST/GET/PUT (§4), génération de codes, rétention, rate limiting, validation zod partagée, tests avec base en mémoire, Dockerfile + exemple de config Caddy.
8. **Partage hybride :** ShareModal — publication sur le backend, affichage code court en grand + QR de l'URL courte + copie du lien ; bascule automatique sur le lien auto-porteur si le backend ne répond pas ; toggle « Mode hors-ligne » ; route `/j/:code` + champ « J'ai un code » sur l'accueil ; réédition d'un deck publié via editKey.
9. **Polish :** accessibilité, responsive éditeur, écrans d'erreur (lien invalide, code inconnu — « Vérifie le code avec l'animateur »), page d'accueil finale.

---

## 10. Critères d'acceptation v1

- [ ] Un animateur crée un deck de 20 cartes, le publie, et un joueur y accède par les trois canaux : QR scanné, code tapé, lien collé — puis joue intégralement sur mobile avec un seul appel réseau initial.
- [ ] Backend coupé → « Partager » bascule automatiquement et sans erreur bloquante sur le lien auto-porteur, qui reste jouable.
- [ ] Un deck publié peut être corrigé via son editKey sans changer de code ; un GET ultérieur renvoie la version à jour.
- [ ] Un code inconnu ou expiré affiche un message clair et non technique.
- [ ] Les trois modes de visibilité fonctionnent, y compris la surcharge par carte.
- [ ] Les trois modes d'enveloppe fonctionnent.
- [ ] Les cartes récurrentes et événements sont correctement calculées dans la révélation.
- [ ] Le « Et si ? » n'inclut jamais de carte événement.
- [ ] Aucun cumul ni feedback bon/mauvais n'apparaît pendant le swipe.
- [ ] L'interaction respecte le pattern Tinder du §8bis : pile visible, rotation au drag, tampons proportionnels, retour élastique sous le seuil, fling au-delà.
- [ ] Partie jouable entièrement sans geste de swipe (boutons seuls) et au clavier.
- [ ] Un deck exporté en JSON se réimporte à l'identique ; un lien auto-porteur généré se décode à l'identique ; un deck publié se relit à l'identique (tests automatisés).
- [ ] Aucune requête réseau pendant la partie ni à la fin ; rien d'écrit en localStorage côté joueur ; le backend ne reçoit jamais de données de joueurs.
- [ ] Textes de l'UI intégralement en français, tutoiement, aucun vocabulaire de jugement.
