import { motion, useReducedMotion } from "framer-motion";
import type { CategoryTotal, TicketLine } from "../../lib/results";

type RevealTicketProps = {
  ticket: TicketLine[];
  categoryTotals: CategoryTotal[];
  currency: string;
};

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const lineVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

/**
 * Élément signature de l'app : le ticket de caisse qui se déroule
 * (voir SPEC.md §8). Liste des dépenses acceptées dans l'ordre de la
 * partie, coût réel révélé (y compris ce qui était caché ou en
 * fourchette), sous-totaux par catégorie en bas.
 */
export default function RevealTicket({ ticket, categoryTotals, currency }: RevealTicketProps) {
  const reducedMotion = useReducedMotion();

  return (
    // Le conteneur d'animation (hauteur 0 → auto, `overflow: hidden`) est
    // distinct du conteneur visuel `.receipt` : le bord cranté de ce
    // dernier (voir index.css) déborde légèrement de sa boîte et serait
    // rogné s'il partageait le même `overflow: hidden`.
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: reducedMotion ? 0 : 0.5, ease: "easeOut" }}
      style={{ overflow: "hidden" }}
      className="py-3"
    >
      <div className="receipt rounded-sm bg-white px-5 py-6 font-mono text-sm">
        {ticket.length === 0 ? (
          <p className="font-sans text-encre/60">Aucune dépense acceptée.</p>
        ) : (
          <motion.ul
            variants={reducedMotion ? undefined : listVariants}
            initial={reducedMotion ? false : "hidden"}
            animate={reducedMotion ? undefined : "show"}
            className="flex flex-col gap-3"
          >
            {ticket.map((line, index) => (
              <motion.li
                key={`${line.card.id}-${index}`}
                variants={reducedMotion ? undefined : lineVariants}
                className="flex items-start justify-between gap-4"
              >
                <div className="font-sans">
                  <p>{line.card.text}</p>
                  {line.card.recurring && (
                    <p className="text-xs text-encre/50">
                      {line.card.cost} {currency} × {line.card.recurring.label}
                    </p>
                  )}
                </div>
                <p className="shrink-0 tabular-nums">
                  {line.totalCost} {currency}
                </p>
              </motion.li>
            ))}
          </motion.ul>
        )}

        {categoryTotals.length > 0 && (
          <div className="mt-6 flex flex-col gap-1 border-t border-dashed border-encre/20 pt-4">
            {categoryTotals.map((category) => (
              <div key={category.category} className="flex justify-between text-encre/70">
                <span className="font-sans">{category.category}</span>
                <span className="tabular-nums">
                  {category.total} {currency}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
