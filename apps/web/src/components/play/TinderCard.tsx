import type { ReactNode } from "react";

type TinderCardProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Carte plein écran façon Tinder — fond blanc, coins très arrondis,
 * ombre portée, bandeau dégradé discret en haut (rappel du logo).
 */
export default function TinderCard({ children, className = "" }: TinderCardProps) {
  return (
    <div
      className={`flex min-h-0 flex-col overflow-hidden rounded-3xl bg-white shadow-[0_10px_40px_rgba(34,48,46,0.14)] ${className}`}
    >
      <div className="tinder-flame-bar h-1.5 shrink-0" aria-hidden="true" />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
