import type { Season } from "./day";
import { CHAPTER_GRAPHICS, CHARACTER_GRAPHICS, POSE_ATLASES, SCENE_GRAPHICS, sceneBackground } from "./graphics.ts";
import { PUPIL_VARIANTS, WALK_ATLASES, variantSheet } from "./graphics07.ts";
import type { Place } from "./story";

const IMAGE = /\.(png|svg|jpe?g|webp)$/i;
/** Audio and video are only warmed in the HTTP cache; the players still stream them. */
const MEDIA = ["/audio/intro.mp3", "/video/bus-ride.mp4"];

export type PreloadPlan = { critical: string[]; rest: string[]; media: string[] };

function sceneSources(place: Place): string[] {
  const scene = SCENE_GRAPHICS[place];
  return [scene.background, scene.winter, scene.fallback, scene.winterFallback, ...Object.values(scene.seasons ?? {})].filter((source): source is string => Boolean(source));
}

/** Everything the game can draw. `critical` is what the first frame in `place` needs; `rest` is the remainder. */
export function preloadPlan(place: Place, season: Season): PreloadPlan {
  const characterSheets = Object.values(CHARACTER_GRAPHICS).flatMap(graphic => [graphic.sheet, graphic.portrait.sheet]);
  const walkSheets = Object.keys(WALK_ATLASES).flatMap(sheet => [sheet, ...PUPIL_VARIANTS.map(variant => variantSheet(sheet, variant))]);
  const critical = new Set<string>([
    sceneBackground(place, season),
    CHARACTER_GRAPHICS.felice.sheet, CHARACTER_GRAPHICS.elias.sheet, CHARACTER_GRAPHICS.elias.portrait.sheet,
    ...Object.keys(POSE_ATLASES),
  ]);
  const all = new Set<string>([
    ...critical,
    ...(Object.keys(SCENE_GRAPHICS) as Place[]).flatMap(sceneSources),
    ...Object.values(CHAPTER_GRAPHICS),
    ...characterSheets, ...walkSheets,
  ]);
  const known = [...all].filter(source => IMAGE.test(source));
  return { critical: [...critical].filter(source => IMAGE.test(source)), rest: known.filter(source => !critical.has(source)), media: MEDIA };
}
