import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { fetchDeckByCode, type FetchDeckResult } from "../lib/api";
import { decodeDeckFromFragment } from "../lib/deckCodec";
import PlaySession from "../components/play/PlaySession";

/**
 * Gère à la fois :
 * - `/jouer` : décodage du deck auto-porteur depuis le fragment d'URL,
 * - `/j/:code` : résolution du deck via le backend.
 *
 * Voir SPEC.md §3.2 et §4.
 */
export default function Play() {
  const { code } = useParams<{ code?: string }>();
  const location = useLocation();

  if (code) {
    return <PlayFromCode code={code} />;
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

function PlayFromCode({ code }: { code: string }) {
  const [result, setResult] = useState<FetchDeckResult | "loading">("loading");

  useEffect(() => {
    let cancelled = false;
    setResult("loading");
    void fetchDeckByCode(code).then((r) => {
      if (!cancelled) setResult(r);
    });
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (result === "loading") {
    return <CenteredMessage title="Chargement…" description="Récupération de l'atelier." />;
  }

  if (!result.ok) {
    if (result.reason === "not-found") {
      return (
        <CenteredMessage title="Code introuvable" description="Vérifie le code avec l'animateur." />
      );
    }
    return (
      <CenteredMessage
        title="Impossible de charger cet atelier"
        description="Vérifie ta connexion, ou demande un lien direct à l'animateur."
      />
    );
  }

  return <PlaySession deck={result.deck} />;
}

function InvalidLink() {
  return (
    <CenteredMessage title="Ce lien semble incomplet" description="Demande à l'animateur de le régénérer." />
  );
}

function CenteredMessage({ title, description }: { title: string; description: string }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="text-encre/80">{description}</p>
      <Link to="/" className="text-accent underline underline-offset-2">
        Retour à l'accueil
      </Link>
    </main>
  );
}
