import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "ghost" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const variantClasses: Record<ButtonVariant, string> = {
  primary: `min-h-11 rounded-lg px-4 py-3 font-medium bg-accent text-white disabled:opacity-40 ${focusRing}`,
  ghost: `min-h-11 rounded-lg px-4 py-3 font-medium bg-transparent text-encre/70 underline underline-offset-2 ${focusRing}`,
  icon: `flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl text-encre shadow-sm border border-encre/10 ${focusRing}`,
};

export default function Button({ variant = "primary", className = "", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={`${variantClasses[variant]} ${className}`} {...props} />;
}
