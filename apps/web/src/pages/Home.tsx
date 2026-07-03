import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";

/**
 * Accueil — titre de l'app, entrée « J'ai un code » (résolution via le
 * backend, voir SPEC.md §3.2 et §4), et accès au mode Animateur.
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
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-12">
      <div>
        <h1 className="text-2xl font-bold">Un mois ordinaire</h1>
        <p className="mt-2 text-encre/80">
          Un atelier d'éducation budgétaire, à jouer sur ton téléphone.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label htmlFor="code" className="text-sm font-medium">
          J'ai un code
        </label>
        <input
          id="code"
          name="code"
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          placeholder="ex. MK7PA"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className="min-h-11 rounded-lg border border-encre/20 bg-white px-4 py-3 text-lg tracking-widest uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        />
        <button
          type="submit"
          className="min-h-11 rounded-lg bg-accent px-4 py-3 font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Rejoindre l'atelier
        </button>
      </form>

      <Link
        to="/editeur"
        className="text-center text-sm text-encre/70 underline underline-offset-2"
      >
        Je suis animateur, créer un atelier
      </Link>
    </main>
  );
}
