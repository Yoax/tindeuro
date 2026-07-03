import type { ReactNode } from "react";

export const inputClass =
  "min-h-11 w-full rounded-lg border border-encre/20 bg-white px-3 py-2 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent";

type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
};

/** Label + contrôle + aide/erreur, pour garder les formulaires de l'éditeur cohérents. */
export default function Field({ label, htmlFor, hint, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-encre/70">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-depasse">
          {error}
        </p>
      )}
    </div>
  );
}
