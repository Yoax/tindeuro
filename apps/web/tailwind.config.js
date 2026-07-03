/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Voir SPEC.md §8 — tokens de la direction design, pas les couleurs
        // Tailwind par défaut.
        fond: "#F1F4F3",
        encre: "#22302E",
        accent: "#2C5D8F",
        tenu: "#1F6F50", // enveloppe tenue — écran de révélation uniquement
        depasse: "#B3402F", // dépassement — écran de révélation uniquement
      },
      fontFamily: {
        // Corps de texte et cartes.
        sans: [
          "Public Sans",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        // Montants et ticket de caisse, à chasse fixe.
        mono: [
          "IBM Plex Mono",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      fontSize: {
        // Taille de base généreuse sur mobile (public pas forcément à
        // l'aise avec les petits textes).
        base: ["17px", "1.5"],
      },
    },
  },
  plugins: [],
};
