import { Link } from "react-router";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-bold">Page introuvable</h1>
      <p className="text-encre/80">
        Vérifie le lien, ou demande à l'animateur de le régénérer.
      </p>
      <Link to="/" className="text-accent underline underline-offset-2">
        Retour à l'accueil
      </Link>
    </main>
  );
}
