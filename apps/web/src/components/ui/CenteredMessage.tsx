import { Link } from "react-router";

type CenteredMessageProps = {
  title: string;
  description: string;
};

/** Écran d'information centré — erreurs, chargement, 404 (SPEC.md §9). */
export default function CenteredMessage({ title, description }: CenteredMessageProps) {
  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center"
    >
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="text-encre/80">{description}</p>
      <Link
        to="/"
        className="inline-flex min-h-11 items-center text-accent underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
