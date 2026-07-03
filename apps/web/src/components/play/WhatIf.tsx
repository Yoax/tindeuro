import { motion, useReducedMotion } from "framer-motion";
import type { WhatIfResult } from "../../lib/results";

type WhatIfProps = {
  whatIf: WhatIfResult;
  currency: string;
};

function excludedLabel(count: number): string {
  return count === 1 ? "ce choix" : `ces ${count} choix`;
}

function topLabel(count: number): string {
  return count === 1 ? "Ta plus grosse dépense" : `Tes ${count} plus grosses dépenses`;
}

/**
 * « Et si ? » — voir SPEC.md §6, point 3. N'inclut jamais les cartes
 * événement (déjà garanti par `computeWhatIf`).
 */
export default function WhatIf({ whatIf, currency }: WhatIfProps) {
  const reducedMotion = useReducedMotion();

  if (whatIf.topCards.length === 0) return null;

  const count = whatIf.topCards.length;
  const total = whatIf.topTotal + whatIf.remainderTotal;

  const message = whatIf.alreadyWithinBudget
    ? `${topLabel(count)} représente${count > 1 ? "nt" : ""} ${whatIf.topTotal} ${currency} sur ${total} ${currency}.`
    : `Sans ${excludedLabel(count)}, tu serais à ${whatIf.remainderTotal} ${currency}${
        whatIf.wouldFitBudget ? " — dans l'enveloppe." : "."
      }`;

  return (
    <motion.p
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.4 }}
      className="text-encre/80"
    >
      {message}
    </motion.p>
  );
}
