import { useParams } from "react-router";

/**
 * Mode Joueur — gère à la fois :
 * - `/jouer` : décodage du deck auto-porteur depuis le fragment d'URL,
 * - `/j/:code` : résolution du deck via le backend (GET /api/decks/:code).
 *
 * Logique implémentée à l'étape 2 (deckCodec) et 3 (parcours joueur) du
 * plan de build (voir SPEC.md §9).
 */
export default function Play() {
  const { code } = useParams<{ code?: string }>();

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-bold">Chargement de l'atelier…</h1>
      <p className="mt-2 text-encre/80">
        {code
          ? `Récupération du deck avec le code ${code}.`
          : "Décodage du lien reçu."}
      </p>
    </main>
  );
}
