import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { Deck } from "@budget-game/shared";
import { publishDeck, updateDeck } from "../../lib/api";
import { encodeDeckToFragment } from "../../lib/deckCodec";
import type { PublishedInfo } from "../../lib/deckDraft";
import Button from "../ui/Button";

/**
 * Partage hybride — voir SPEC.md §3.1 et §9 étape 8 :
 * - tente de publier (ou mettre à jour) le deck sur le backend et affiche
 *   le code court + son QR ;
 * - si le backend est injoignable, ou si l'animateur coche « Mode
 *   hors-ligne », bascule sans erreur sur le lien auto-porteur (avec son
 *   propre QR si la taille le permet).
 */

const FALLBACK_QR_MAX_BYTES = 2953; // capacité QR max mesurée, voir SPEC.md §4
const FALLBACK_QR_DENSE_BYTES = 1500; // au-delà, QR dense (à approcher pour scanner)

type ShareModalProps = {
  deck: Deck;
  publishedAs: PublishedInfo | null;
  onPublished: (info: PublishedInfo) => void;
  onClose: () => void;
};

type Status = "loading" | "success" | "error";

function buildUrl(suffix: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${window.location.origin}${base}/${suffix}`;
}

function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

const inputLikeClass =
  "w-full rounded-lg border border-encre/20 bg-fond px-2 py-2 text-center font-mono text-xs";

export default function ShareModal({ deck, publishedAs, onPublished, onClose }: ShareModalProps) {
  const [offline, setOffline] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const [status, setStatus] = useState<Status>("loading");
  const [code, setCode] = useState<string | null>(publishedAs?.code ?? null);
  const [wasUpdate, setWasUpdate] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (offline) return;
    let cancelled = false;

    async function run() {
      setStatus("loading");
      try {
        if (publishedAs) {
          const ok = await updateDeck(publishedAs.code, publishedAs.editKey, deck);
          if (!ok) throw new Error("La mise à jour a échoué.");
          if (cancelled) return;
          setCode(publishedAs.code);
          setWasUpdate(true);
          setStatus("success");
        } else {
          const result = await publishDeck(deck);
          if (cancelled) return;
          onPublished(result);
          setCode(result.code);
          setWasUpdate(false);
          setStatus("success");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
    // deck/publishedAs/onPublished sont stables pour la durée de vie de la
    // modale (une nouvelle instance est montée à chaque ouverture) ; seuls
    // `offline` et `retryTick` doivent redéclencher la tentative.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offline, retryTick]);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Presse-papiers indisponible : le champ affiché reste sélectionnable à la main.
    }
  }

  const showFallback = offline || status === "error";
  const fallbackUrl = buildUrl(`jouer#${encodeDeckToFragment(deck)}`);
  const fallbackBytes = byteLength(fallbackUrl);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Partager l'atelier"
      className="fixed inset-0 z-20 flex items-center justify-center bg-encre/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-md flex-col gap-5 overflow-y-auto rounded-2xl bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Partager l'atelier</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-2xl leading-none text-encre/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            ×
          </button>
        </div>

        {!showFallback && status === "loading" && (
          <p className="py-8 text-center text-encre/70">Publication en cours…</p>
        )}

        {!showFallback && status === "success" && code && (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-encre/70">{wasUpdate ? "Deck mis à jour, même code." : "Deck publié."}</p>
            <p className="font-mono text-5xl font-bold tracking-widest">{code}</p>
            <QRCodeSVG value={buildUrl(`j/${code}`)} size={180} level="M" />
            <input readOnly value={buildUrl(`j/${code}`)} onFocus={(e) => e.currentTarget.select()} className={inputLikeClass} />
            <Button onClick={() => copy(buildUrl(`j/${code}`))} className="w-full">
              {copied ? "Lien copié !" : "Copier le lien"}
            </Button>
          </div>
        )}

        {showFallback && (
          <div className="flex flex-col items-center gap-4 text-center">
            {status === "error" && !offline && (
              <p className="text-sm text-depasse">
                Le serveur est injoignable. Voici un lien qui fonctionne sans lui.
              </p>
            )}
            <p className="text-sm text-encre/70">
              Lien autonome : le deck est encodé dans le lien lui-même, rien n'est envoyé à un serveur.
            </p>
            {fallbackBytes <= FALLBACK_QR_MAX_BYTES ? (
              <>
                <QRCodeSVG value={fallbackUrl} size={180} level="M" />
                {fallbackBytes > FALLBACK_QR_DENSE_BYTES && (
                  <p className="text-xs text-encre/70">QR dense — à approcher pour le scanner.</p>
                )}
              </>
            ) : (
              <p className="text-xs text-encre/70">
                Deck trop volumineux pour un QR lisible — partage le lien directement.
              </p>
            )}
            <textarea
              readOnly
              rows={3}
              value={fallbackUrl}
              onFocus={(e) => e.currentTarget.select()}
              className={`${inputLikeClass} resize-none text-left`}
            />
            <Button onClick={() => copy(fallbackUrl)} className="w-full">
              {copied ? "Lien copié !" : "Copier le lien"}
            </Button>
            {status === "error" && !offline && (
              <Button variant="ghost" onClick={() => setRetryTick((t) => t + 1)}>
                Réessayer avec le serveur
              </Button>
            )}
          </div>
        )}

        <label className="flex min-h-11 items-center gap-2 text-sm text-encre/70">
          <input
            type="checkbox"
            checked={offline}
            onChange={(e) => setOffline(e.target.checked)}
            className="h-5 w-5"
          />
          Mode hors-ligne (ne pas utiliser le serveur)
        </label>
      </div>
    </div>
  );
}
