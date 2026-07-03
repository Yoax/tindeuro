import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "ghost" | "icon" | "pill" | "flame" | "tinder-no" | "tinder-yes";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const variantClasses: Record<ButtonVariant, string> = {
  primary: `min-h-11 rounded-lg px-4 py-3 font-medium bg-accent text-white disabled:opacity-40 ${focusRing}`,
  ghost: `min-h-11 rounded-lg px-4 py-3 font-medium bg-transparent text-encre/70 underline underline-offset-2 ${focusRing}`,
  icon: `flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl text-encre shadow-sm border border-encre/10 ${focusRing}`,
  pill: `min-h-14 w-full rounded-full px-6 py-4 text-lg font-semibold bg-accent text-white shadow-[0_4px_14px_rgba(44,93,143,0.35)] disabled:opacity-40 ${focusRing}`,
  // Réservé aux écrans d'accueil/marketing — le jeu lui-même reste sur
  // l'accent neutre (pas de couleur "excitante" pendant les décisions).
  flame: `min-h-14 w-full rounded-full px-6 py-4 text-lg font-semibold text-white bg-gradient-to-r from-[#fd267a] to-[#ff7854] shadow-[0_10px_25px_-5px_rgba(253,38,122,0.5)] transition-transform active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100 ${focusRing}`,
  "tinder-no": `flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-2 border-encre/15 bg-white text-3xl text-encre/80 shadow-[0_4px_12px_rgba(34,48,46,0.12)] disabled:opacity-40 ${focusRing}`,
  "tinder-yes": `flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-2 border-accent bg-white text-3xl text-accent shadow-[0_4px_12px_rgba(44,93,143,0.2)] disabled:opacity-40 ${focusRing}`,
};

export default function Button({ variant = "primary", className = "", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={`${variantClasses[variant]} ${className}`} {...props} />;
}
