import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router";
import { isDemoPlayCode } from "@budget-game/shared";
import CenteredMessage from "../components/ui/CenteredMessage";
import { fetchDeckByCode, type FetchDeckResult } from "../lib/api";
import { decodeDeckFromFragment } from "../lib/deckCodec";
import { exampleDeck } from "../data/exampleDeck";
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
    if (isDemoPlayCode(code)) {
      return <PlaySession deck={exampleDeck} />;
    }
    return <PlayFromCode code={code} />;
  }

  return <PlayFromFragment hash={location.hash} />;
}

function PlayFromFragment({ hash }: { hash: string }) {
  const fragment = hash.startsWith("#") ? hash.slice(1) : hash;
  const result = useMemo(() => decodeDeckFromFragment(fragment), [fragment]);

  if (!result.ok) {
    if (result.reason === "empty") {
      return (
        <CenteredMessage
          title="Aucun atelier ici"
          description="Utilise le lien ou le code fourni par l'animateur."
        />
      );
    }
    return (
      <CenteredMessage
        title="Ce lien semble incomplet"
        description="Demande à l'animateur de le régénérer."
      />
    );
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
