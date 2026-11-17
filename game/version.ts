import pkg from "../package.json" with { type: "json" };

/** Single source: the "version" field in package.json. Shown as "1.5" for "1.5.0". */
export const GAME_VERSION = pkg.version.replace(/\.0$/, "");
