import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Base configurable pour le déploiement (voir SPEC.md §7) : servi à la racine
// par défaut, surchargeable via la variable d'env VITE_BASE si besoin d'un
// sous-chemin.
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  plugins: [react()],
});
