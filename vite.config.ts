import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Two outputs from one config:
//   npm run build        -> dist-pages/ for GitHub Pages (base path from PAGES_BASE_PATH)
//   npm run build:spiel  -> spiel/ for the offline start (STARTEN.bat). Without the public/
//                           folder: scripts/serve-local.mjs serves public/ as a fallback, so
//                           images and sounds exist only once in the repository.
export default defineConfig(({ mode }) => {
  const offline = mode === "spiel";
  return {
    base: offline ? "/" : process.env.PAGES_BASE_PATH ?? "/",
    plugins: [react(), {
      name: "pages-no-jekyll",
      generateBundle() {
        if (!offline) this.emitFile({ type: "asset", fileName: ".nojekyll", source: "" });
      },
    }],
    build: {
      outDir: offline ? "spiel" : "dist-pages",
      emptyOutDir: true,
      copyPublicDir: !offline,
    },
  };
});
