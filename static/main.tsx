import { createRoot } from "react-dom/client";
import { Game } from "../game/Game";
import "../app/globals.css";

const root = document.getElementById("root");
if (!root) throw new Error("Der Spieleinstieg fehlt.");
createRoot(root).render(<Game />);

// Installable web app: the service worker only caches files for offline play (never the save games).
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => { navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => { /* Offline mode is optional. */ }); });
}
