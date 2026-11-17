import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  { ignores: ["node_modules/**", "spiel/**", "dist-pages/**", "dist/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat["recommended-latest"] ?? reactHooks.configs.flat.recommended,
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  // The build does not use the React Compiler, so its "could not memoize" notice is no error here.
  { rules: { "react-hooks/preserve-manual-memoization": "off" } },
);
