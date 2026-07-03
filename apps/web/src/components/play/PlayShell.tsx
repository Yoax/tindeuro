import type { ReactNode } from "react";
import { Link } from "react-router";

type PlayHeaderProps = {
  progress?: { current: number; total: number };
  label?: string;
};

/** Barre supérieure minimaliste — logo Tindeuro + compteur ou libellé. */
export function PlayHeader({ progress, label }: PlayHeaderProps) {
  return (
    <header className="mx-auto flex w-full max-w-md shrink-0 items-center justify-between px-4 py-3">
      <Link
        to="/"
        className="flex min-h-11 items-center gap-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        aria-label="Tindeuro — retour à l'accueil"
      >
        <img src="/logo.png" alt="" className="h-9 w-9 rounded-xl shadow-sm" width={36} height={36} />
        <span className="text-base font-bold tracking-tight text-encre">Tindeuro</span>
      </Link>
      {progress ? (
        <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-medium text-encre/70 shadow-sm">
          {progress.current} / {progress.total}
        </span>
      ) : label ? (
        <span className="text-sm font-medium text-encre/70">{label}</span>
      ) : null}
    </header>
  );
}

type PlayShellProps = {
  children: ReactNode;
  header?: ReactNode;
  /** Zone principale scrollable (révélation avec ticket long). */
  scrollable?: boolean;
};

/**
 * Coque du parcours joueur — header Tinder-like ; le footer est géré
 * par AppLayout sur toutes les pages.
 */
export default function PlayShell({ children, header, scrollable = false }: PlayShellProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {header}
      <main
        className={`mx-auto flex w-full max-w-md flex-1 flex-col px-4 ${scrollable ? "min-h-0 overflow-y-auto pb-4" : "min-h-0 pb-2"}`}
      >
        {children}
      </main>
    </div>
  );
}
