import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import Button from "../components/ui/Button";

/**
 * Accueil — identité de l'app (Tindeuro), entrée « J'ai un code »
 * (résolution via le backend, voir SPEC.md §3.2 et §4), et accès au mode
 * Animateur. Traitement visuel volontairement "punchy" façon appli de
 * rencontre (dégradé flamme, halos) : cet écran n'est pas soumis à la
 * contrainte de neutralité des couleurs du gameplay (voir SPEC.md §8).
 */
export default function Home() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = code.trim();
    if (trimmed.length === 0) return;
    navigate(`/j/${trimmed.toUpperCase()}`);
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        Aller au contenu
      </a>

      {/* `fixed` (plutôt que borné au bloc de contenu) pour couvrir tout le
          viewport, y compris derrière le footer flottant. */}
      <div aria-hidden="true" className="tinder-glow-bg pointer-events-none fixed inset-0" />

      <main
        id="main-content"
        className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-12"
      >
        <div className="flex flex-col items-center gap-5 text-center">
          <img
            src="/logo.png"
            alt="Tindeuro"
            className="h-24 w-24 rounded-3xl shadow-[0_16px_36px_-10px_rgba(253,38,122,0.5)]"
            width={96}
            height={96}
          />
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">
              <span className="tinder-flame-text">Tindeuro</span>
            </h1>
            <p className="mt-3 text-lg leading-snug text-encre/80">
              Une application qui n&apos;aide pas à trouver son partenaire mais son porte-monnaie... ou pas.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label htmlFor="code" className="text-sm font-semibold text-encre/80">
            J&apos;ai un code
          </label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            placeholder="ex. TEST"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="min-h-14 rounded-full border-2 border-encre/10 bg-white px-6 py-3 text-center text-lg uppercase tracking-widest shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          />
          <Button type="submit" variant="flame">
            Rejoindre l&apos;atelier
          </Button>
        </form>

        <Link
          to="/editeur"
          className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-encre/15 px-6 py-3 text-center text-sm font-semibold text-encre/80 transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Je suis animateur, créer un atelier
        </Link>
      </main>
    </>
  );
}
