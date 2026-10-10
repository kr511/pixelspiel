import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Separate static entry: the existing Sites/server build remains available.
export default defineConfig({
  base: process.env.PAGES_BASE_PATH ?? "/pixelgame/",
  plugins: [react(), {
    name: "pages-no-jekyll",
    generateBundle() {
      this.emitFile({ type: "asset", fileName: ".nojekyll", source: "" });
    },
  }],
  build: {
    outDir: "dist-pages",
    emptyOutDir: true,
  },
});
