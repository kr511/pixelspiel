import { createRoot } from "react-dom/client";
import { Game } from "../game/Game";
import "../app/globals.css";

const root = document.getElementById("root");
if (!root) throw new Error("Der Spieleinstieg fehlt.");
createRoot(root).render(<Game />);
