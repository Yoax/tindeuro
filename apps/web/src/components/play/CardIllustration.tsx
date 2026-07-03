import { useState } from "react";

type CardIllustrationProps = {
  imageUrl?: string;
};

/**
 * Bandeau du haut de carte façon Tinder : l'illustration de l'animateur
 * si elle est présente et se charge correctement, sinon le bandeau
 * dégradé existant (`.tinder-flame-bar`) en repli visuel.
 */
export default function CardIllustration({ imageUrl }: CardIllustrationProps) {
  const [failed, setFailed] = useState(false);

  if (imageUrl && !failed) {
    return (
      <img
        src={imageUrl}
        alt=""
        className="h-44 w-full shrink-0 object-cover sm:h-56"
        onError={() => setFailed(true)}
      />
    );
  }

  return <div className="tinder-flame-bar h-1.5 shrink-0" aria-hidden="true" />;
}
