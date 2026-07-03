import { useMemo } from "react";
import { Link, useLocation, useParams } from "react-router";
import { decodeDeckFromFragment } from "../lib/deckCodec";
import PlaySession from "../components/play/PlaySession";

/**
 * Gère à la fois :
 * - `/jouer` : décodage du deck auto-porteur depuis le fragment d'URL,
 * - `/j/:code` : résolution du deck via le backend (à venir, étape 7-8).
 *
 * Voir SPEC.md §3.2 et §4.
 */
export default function Play() {
  const { code } = useParams<{ code?: string }>();
  const location = useLocation();

  if (code) {
    return <CodeNotYetAvailable code={code} />;
  }

  return <PlayFromFragment hash={location.hash} />;
}

function PlayFromFragment({ hash }: { hash: string }) {
  const fragment = hash.startsWith("#") ? hash.slice(1) : hash;
  const result = useMemo(() => decodeDeckFromFragment(fragment), [fragment]);

  if (!result.ok) {
    return <InvalidLink />;
  }

  return <PlaySession deck={result.deck} />;
}

function InvalidLink() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-bold">Ce lien semble incomplet</h1>
      <p className="text-encre/80">Demande à l'animateur de le régénérer.</p>
      <Link to="/" className="text-accent underline underline-offset-2">
        Retour à l'accueil
      </Link>
    </main>
  );
}

function CodeNotYetAvailable({ code }: { code: string }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-bold">Bientôt disponible</h1>
      <p className="text-encre/80">
        L'accès par code ({code}) sera actif une fois le backend en place. En attendant, demande un
        lien direct à l'animateur.
      </p>
      <Link to="/" className="text-accent underline underline-offset-2">
        Retour à l'accueil
      </Link>
    </main>
  );
}
