import { BrowserRouter, Route, Routes } from "react-router";
import Home from "./pages/Home";
import Editor from "./pages/Editor";
import Play from "./pages/Play";
import NotFound from "./pages/NotFound";

/**
 * Routes de l'app — voir SPEC.md §7 :
 * - `/`        accueil (+ champ « J'ai un code »)
 * - `/editeur` mode Animateur
 * - `/jouer`   mode Joueur, lien auto-porteur (deck dans le fragment)
 * - `/j/:code` mode Joueur, résolution du deck via le backend
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editeur" element={<Editor />} />
        <Route path="/jouer" element={<Play />} />
        <Route path="/j/:code" element={<Play />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
