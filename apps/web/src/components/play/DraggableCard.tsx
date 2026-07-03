import {
  forwardRef,
  useImperativeHandle,
  type ReactNode,
} from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type PanInfo } from "framer-motion";

export type ExitDirection = "left" | "right" | "down";

export type DraggableCardHandle = {
  fling: (direction: ExitDirection) => void;
};

type DraggableCardProps = {
  children: ReactNode;
  /** Faux pour les cartes événement : pas de décision par le geste (§8bis). */
  horizontalDragEnabled: boolean;
  onExit: (direction: ExitDirection) => void;
};

const SWIPE_THRESHOLD_RATIO = 0.35;
const VELOCITY_THRESHOLD = 800;
const FLING_DURATION = 0.32;

/**
 * Carte draggable façon Tinder — voir SPEC.md §8bis.
 * Translation X/Y au doigt, rotation proportionnelle, tampons de décision
 * en surimpression, seuil + fling à la sortie. Les cartes événement
 * gardent une résistance élastique forte (pas de décision au geste).
 */
const DraggableCard = forwardRef<DraggableCardHandle, DraggableCardProps>(function DraggableCard(
  { children, horizontalDragEnabled, onExit },
  ref,
) {
  const reducedMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-16, 16]);
  const takeOpacity = useTransform(x, [20, 120], [0, 1]);
  const passOpacity = useTransform(x, [-120, -20], [1, 0]);

  function fling(direction: ExitDirection) {
    if (reducedMotion) {
      onExit(direction);
      return;
    }

    if (direction === "down") {
      void animate(y, 500, { duration: FLING_DURATION, ease: "easeIn" });
    } else {
      const target = direction === "right" ? 600 : -600;
      void animate(x, target, { duration: FLING_DURATION, ease: "easeIn" });
    }
    window.setTimeout(() => onExit(direction), FLING_DURATION * 1000);
  }

  useImperativeHandle(ref, () => ({ fling }));

  function handleDragEnd(_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    if (!horizontalDragEnabled) {
      // Les cartes événement sont verrouillées à (0,0) par `dragConstraints` :
      // framer-motion ramène déjà la carte à sa place, rien à faire ici.
      return;
    }

    const passedThreshold = Math.abs(info.offset.x) > window.innerWidth * SWIPE_THRESHOLD_RATIO;
    const fastEnough = Math.abs(info.velocity.x) > VELOCITY_THRESHOLD;

    if (passedThreshold || fastEnough) {
      fling(info.offset.x > 0 ? "right" : "left");
    } else {
      void animate(x, 0, { type: "spring", stiffness: 300, damping: 25 });
      void animate(y, 0, { type: "spring", stiffness: 300, damping: 25 });
    }
  }

  return (
    <motion.div
      className="relative touch-none"
      style={{ x, y, rotate: horizontalDragEnabled ? rotate : 0 }}
      drag={!reducedMotion}
      dragElastic={horizontalDragEnabled ? 0.9 : 0.06}
      dragConstraints={horizontalDragEnabled ? undefined : { left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
    >
      {horizontalDragEnabled && !reducedMotion && (
        <>
          <motion.div
            aria-hidden
            style={{ opacity: takeOpacity }}
            className="pointer-events-none absolute left-6 top-6 z-10 -rotate-12 rounded-md border-4 border-encre px-3 py-1 text-lg font-bold uppercase tracking-wide text-encre"
          >
            Je prends
          </motion.div>
          <motion.div
            aria-hidden
            style={{ opacity: passOpacity }}
            className="pointer-events-none absolute right-6 top-6 z-10 rotate-12 rounded-md border-4 border-encre px-3 py-1 text-lg font-bold uppercase tracking-wide text-encre"
          >
            Je passe
          </motion.div>
        </>
      )}
      {children}
    </motion.div>
  );
});

export default DraggableCard;
