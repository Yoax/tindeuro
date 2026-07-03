import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Base configurable pour le déploiement (voir SPEC.md §7) : servi à la racine
// par défaut, surchargeable via la variable d'env VITE_BASE si besoin d'un
// sous-chemin.
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  plugins: [react()],
  server: {
    // En dev, front (5173) et backend (8787) sont sur des ports différents :
    // ce proxy les fait apparaître même origine, comme en prod derrière
    // Caddy (voir apps/api/Caddyfile.example et SPEC.md §7).
    proxy: {
      "/api": process.env.VITE_API_PROXY_TARGET ?? "http://localhost:8787",
    },
  },
});
