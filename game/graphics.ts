const SCHOOL_WAY_CROP = { x: .08, y: .30, width: .84, height: .70 };
import type { ChapterId, Place, Point } from "./story";
import type { Season } from "./day";
import { TREE_SILHOUETTES, WINTER_TREE_SILHOUETTES } from "./foreground.ts";

type LitWindow = { x: number; y: number; width: number; height: number };
export type ForegroundLayer = { depth: number } & ({ clip: string; path?: never; winterPath?: never } | { path: string; winterPath?: string; clip?: never });
export type SceneGraphic = { background: string; fallback?: string; crop?: { x: number; y: number; width: number; height: number }; winter?: string; winterFallback?: string; seasons?: Record<Season, string>; nightLights?: { lamps: Point[]; windows: LitWindow[]; sparkles?: Point[] }; outdoors: boolean; light: string; foreground: ForegroundLayer[] };
// Each foreground copies only the specified furniture/tree silhouette from the same scene.
const rect = (left: number, top: number, right: number, bottom: number, depth = bottom) => ({ clip: `polygon(${left}% ${top}%,${right}% ${top}%,${right}% ${bottom}%,${left}% ${bottom}%)`, depth });
export function foregroundPath(layer: ForegroundLayer, source: string, winterSource?: string) {
  return source === winterSource ? layer.winterPath ?? layer.path : layer.path;
}
export const SCENE_GRAPHICS: Record<Place, SceneGraphic> = {
  playground: { background: "/rooms/story-playground-pixel-v10.webp", fallback: "/rooms/story-playground-v09.svg", winter: "/rooms/story-playground-winter-v09.svg", outdoors: true, light: "#e4e8ca", foreground: [] },
  // The winter playground and market pixel paintings are not delivered yet; the
  // SVG scenes the game already fell back to are referenced directly.
  christmasmarket: { background: "/rooms/story-christmasmarket-v09.svg", nightLights: {
    lamps: [{ x: .289, y: .398 }, { x: .711, y: .398 }, { x: .708, y: .664 }, { x: .298, y: .664 }],
    windows: [{ x: 4.06, y: 5.94, width: 4.06, height: 5 }, { x: 12.81, y: 5.94, width: 4.06, height: 5 }, { x: 21.56, y: 5.94, width: 4.06, height: 5 }, { x: 30.31, y: 5.94, width: 4.06, height: 5 }, { x: 39.06, y: 5.94, width: 4.06, height: 5 }, { x: 47.81, y: 5.94, width: 4.06, height: 5 }, { x: 56.56, y: 5.94, width: 4.06, height: 5 }, { x: 65.31, y: 5.94, width: 4.06, height: 5 }, { x: 74.06, y: 5.94, width: 4.06, height: 5 }, { x: 82.81, y: 5.94, width: 4.06, height: 5 }, { x: 91.56, y: 5.94, width: 4.06, height: 5 }],
    sparkles: [{ x: 0.111, y: 0.206 }, { x: 0.164, y: 0.209 }, { x: 0.27, y: 0.219 }, { x: 0.323, y: 0.225 }, { x: 0.43, y: 0.234 }, { x: 0.483, y: 0.237 }, { x: 0.589, y: 0.234 }, { x: 0.642, y: 0.228 }, { x: 0.748, y: 0.219 }, { x: 0.802, y: 0.216 }, { x: 0.908, y: 0.206 }, { x: 0.961, y: 0.2 }, { x: 0.495, y: 0.156 }, { x: 0.555, y: 0.188 }, { x: 0.467, y: 0.222 }, { x: 0.527, y: 0.241 }, { x: 0.586, y: 0.278 }, { x: 0.455, y: 0.284 }, { x: 0.52, y: 0.306 }],
  }, outdoors: true, light: "#ffe1a6", foreground: [] },
  // Klassenfahrt: Pixelgemälde aus scripts/pixel-rooms.py.
  hotel: { background: "/rooms/trip-hotel-v11.webp", outdoors: false, light: "#f4d9a8", foreground: [] },
  hotelboys: { background: "/rooms/trip-hotelboys-v11.webp", outdoors: false, light: "#f4d9a8", foreground: [] },
  parliament: { background: "/rooms/trip-parliament-v11.webp", nightLights: { lamps: [{ x: .3, y: .55 }, { x: .95, y: .29 }], windows: [] }, outdoors: true, light: "#e3ecf0", foreground: [] },
  europapark: { background: "/rooms/trip-europapark-v11.webp", nightLights: { lamps: [{ x: .4, y: .51 }, { x: .72, y: .51 }], windows: [] }, outdoors: true, light: "#f1ead0", foreground: [] },
  eliasroom: { background: "/rooms/story-eliasroom-pixel-v10.webp", fallback: "/rooms/story-eliasroom-v09.svg", outdoors: false, light: "#f4c989", foreground: [] },
  bedroom: { background: "/rooms/felice-bedroom-v10.webp", outdoors: false, light: "#ffbd65", foreground: [rect(24.5,10,52.5,42),rect(52.5,10,74.5,30),rect(24.5,43,35.5,57),rect(69,31,79,57),rect(45.5,79,78,91,91)] },
  home: { background: "/rooms/home-v06.webp", winter: "/rooms/home-winter-v06.webp", outdoors: false, light: "#ffd49a", foreground: [rect(46,23.5,73,48),{ clip: "polygon(12% 17%,40% 17%,40% 30%,24.7% 30%,24.7% 43%,12% 43%)", depth:43 },rect(84,12,96,46)] },
  kitchen: { background: "/rooms/kitchen-v065.webp", outdoors: false, light: "#ffd49a", foreground: [rect(8.7,9,91.4,28.4),rect(57.6,36,85.4,51.5),rect(61,51.5,70,58.5),rect(74,51.5,82,58.5)] },
  garden: { background: "/rooms/garden-v06.webp", winter: "/rooms/garden-winter-v06.webp", seasons: {
    Frühling: "/rooms/garden-spring-v092.webp", Sommer: "/rooms/garden-v06.webp", Herbst: "/rooms/garden-autumn-v092.webp", Winter: "/rooms/garden-winter-v06.webp",
  }, nightLights: {
    lamps: [{ x: .431, y: .055 }, { x: .570, y: .055 }],
    windows: [
      { x: 31.65, y: 2.7, width: 2.1, height: 1.5 }, { x: 34.75, y: 2.7, width: 2.1, height: 1.5 },
      { x: 31.65, y: 4.8, width: 2.1, height: 1.6 }, { x: 34.75, y: 4.8, width: 2.1, height: 1.6 },
      { x: 63.0, y: 2.7, width: 2.1, height: 1.5 }, { x: 66.2, y: 2.7, width: 2.1, height: 1.5 },
      { x: 63.0, y: 4.8, width: 2.1, height: 1.6 }, { x: 66.2, y: 4.8, width: 2.1, height: 1.6 },
    ],
  }, outdoors: true, light: "#e0eabb", foreground: [rect(27,0,70,19),{ path: TREE_SILHOUETTES.gardenWest, winterPath: WINTER_TREE_SILHOUETTES.gardenWest, depth:37 },{ path: TREE_SILHOUETTES.gardenEast, winterPath: WINTER_TREE_SILHOUETTES.gardenEast, depth:41 }] },
  radegast: { background: "/rooms/radegast-walk-v075.webp", outdoors: true, light: "#e4dbba", foreground: [] },
  bus: { background: "/rooms/radegast-stop-v075.webp", outdoors: true, light: "#dbe8e5", foreground: [rect(50,26,89.5,40),rect(23.5,30,43.5,43),rect(0,0,100,24.5)] },
  zoerbig: { background: "/rooms/zoerbig-market-v09.webp", outdoors: true, light: "#e9dbb8", foreground: [
    { clip: "polygon(49% 21.5%,50% 21.5%,51% 33%,53.5% 36%,53.5% 38.5%,46.3% 38.5%,46.3% 36%,48% 33%)", depth: 38.5 },
    { clip: "polygon(25% 59%,29% 55%,35% 55%,40% 59%,41% 64%,36% 68%,32% 68%,32% 71%,30% 71%,30% 68%,25% 65%)", depth: 71 },
    { clip: "polygon(58% 48%,61% 44%,66% 44%,70% 49%,71% 54%,67% 58%,66% 58%,66% 59%,64% 59%,64% 58%,59% 55%)", depth: 59 },
    { clip: "polygon(60% 61%,64% 57%,69% 57%,73% 62%,73% 67%,70% 71%,69% 71%,69% 73%,67% 73%,67% 71%,61% 68%)", depth: 73 },
    { clip: "polygon(49% 53.2%,51% 54%,52% 60%,57% 60%,59.2% 63%,57% 67.7%,43% 67.7%,40.8% 64%,43% 60%,48% 60%)", depth: 67.7 },
  ] },
  schoolway: { background: "/rooms/zoerbig-walk-v075.webp", crop: SCHOOL_WAY_CROP, outdoors: true, light: "#e9dbb8", foreground: [] },
  gym: { background: "/rooms/graduation-gym-v08.webp", outdoors: false, light: "#f8ddb0", foreground: [rect(36,18,65,25),rect(68.7,17,74,25)] },
  school: { background: "/rooms/school-court-secondary-v075.webp", winter: "/rooms/school-court-winter-v092.webp", seasons: {
    Frühling: "/rooms/school-court-spring-v092.webp", Sommer: "/rooms/school-court-secondary-v075.webp", Herbst: "/rooms/school-court-autumn-v092.webp", Winter: "/rooms/school-court-winter-v092.webp",
  }, nightLights: {
    lamps: [{ x: .217, y: .112 }, { x: .419, y: .139 }, { x: .578, y: .139 }, { x: .774, y: .111 }, { x: .865, y: .111 }],
    windows: [
      { x: 14.1, y: 12.4, width: 1.6, height: 2.3 }, { x: 16.2, y: 12.4, width: 1.6, height: 2.3 }, { x: 18.3, y: 12.4, width: 1.7, height: 2.3 },
      { x: 59.8, y: 12.4, width: 1.6, height: 2.3 }, { x: 62.0, y: 12.4, width: 1.6, height: 2.3 }, { x: 64.2, y: 12.4, width: 1.6, height: 2.3 },
    ],
  }, outdoors: true, light: "#e9dbb8", foreground: [
    rect(0,0,100,22.3),rect(42.1,17.6,57.8,25),
    { clip: "polygon(1.9% 6.1%,13.6% 6.1%,13.6% 23.3%,10.7% 25.2%,2.2% 23.9%)", depth:25.2 },
    { path: TREE_SILHOUETTES.schoolNorthWest, winterPath: WINTER_TREE_SILHOUETTES.schoolNorthWest, depth:45.1 },
    { path: TREE_SILHOUETTES.schoolNorthEast, winterPath: WINTER_TREE_SILHOUETTES.schoolNorthEast, depth:47.1 },
    { path: TREE_SILHOUETTES.schoolSouthWest, winterPath: WINTER_TREE_SILHOUETTES.schoolSouthWest, depth:64 },
    { path: TREE_SILHOUETTES.schoolSouthEast, winterPath: WINTER_TREE_SILHOUETTES.schoolSouthEast, depth:66.9 },
    { clip: "polygon(0% 14%,5% 13%,9% 17%,14% 18%,14% 23.9%,13% 25.6%,5.7% 26.7%,0% 26.7%)", depth:26.7 },
    { clip: "polygon(0% 26%,8% 27.9%,11.4% 29.6%,9.3% 34%,0% 34%)", depth:34 },
    { clip: "polygon(0% 32%,8% 31%,13% 38%,13% 46%,10% 51%,11.7% 57.7%,8.8% 63%,0% 63%)", depth:63 },
    { clip: "polygon(0% 67%,12% 68%,16% 73%,19% 78.3%,16% 79.7%,0% 79.7%)", depth:79.7 },
    { clip: "polygon(18.3% 72.6%,33.9% 76.5%,34.4% 78.7%,31.7% 82.4%,29.6% 81.9%,32% 77.4%,17.6% 75.1%)", depth:82.4 },
    { clip: "polygon(30.1% 81.1%,41.5% 86%,43.7% 92.5%,41.6% 93.8%,39.8% 87.9%,29.6% 83.5%)", depth:93.8 },
    { clip: "polygon(8.2% 84.7%,27.6% 88%,30.5% 90.4%,29.5% 92.6%,27.7% 91.7%,27.4% 90.1%,8% 87%)", depth:92.6 },
    { clip: "polygon(47.6% 79.6%,49% 78.9%,51.2% 81.4%,48.8% 83.8%,46.4% 81.5%)", depth:82 },
    { clip: "polygon(48.8% 83.8%,51.2% 81.4%,53.5% 84%,51.1% 86.2%)", depth:85 },
    { clip: "polygon(51.1% 86.2%,53.5% 84%,55.7% 86%,53.1% 88.5%,52.2% 88%)", depth:88.5 },
    { clip: "polygon(0% 88.5%,28.6% 92.7%,36.2% 96.4%,39.3% 100%,0% 100%)", depth:100 },
    { clip: "polygon(62.2% 92.1%,71.7% 92.1%,79% 100%,62.2% 100%)", depth:100 },
    { clip: "polygon(94.4% 25%,100% 25%,100% 100%,98% 87.5%,95.6% 59.1%)", depth:100 },
    rect(44.3,92.3,47.9,100,100),rect(55.7,92.3,58.8,100,100),
  ] },
  goelzau: { background: "/rooms/goelzau-walk-v075.webp", outdoors: true, light: "#dfe5ba", foreground: [rect(5,0,63,24.5),rect(71,0,100,43)] },
  range: { background: "/rooms/range-v06.webp", outdoors: false, light: "#e3e3ba", foreground: [rect(10,4,90,34)] },
};
export function sceneBackground(place: Place, season: Season) {
  const scene = SCENE_GRAPHICS[place];
  return scene.seasons?.[season] ?? (season === "Winter" ? scene.winter : undefined) ?? scene.background;
}

export type CharacterGraphic = { sheet: string; columns: number; rows: number; column: number; row: number; width: number; anchor: Point; variant?: number; portrait: { sheet: string; columns: number; rows: number; column: number; row: number } };
const npc = (column: number, row: number): CharacterGraphic => ({ sheet: "/characters/neighbors-v06.webp", columns: 4, rows: 2, column, row, width: 7.6, anchor: { x: .5, y: 1 }, portrait: { sheet: "/characters/portraits-v06.webp", columns: 4, rows: 2, column, row } });
export const CHARACTER_GRAPHICS = {
  felice: { sheet: "/characters/felice-walk-v1.webp", columns: 4, rows: 3, column: 0, row: 0, width: 7.6, anchor: { x: .5, y: 1 }, portrait: { sheet: "/characters/felice-walk-v1.webp", columns: 4, rows: 3, column: 0, row: 0 } },
  elias: { sheet: "/characters/elias-walk-v06-fixed.webp", columns: 4, rows: 3, column: 0, row: 0, width: 7.8, anchor: { x: .5, y: 1 }, portrait: { sheet: "/characters/elias-portrait-v06.webp", columns: 1, rows: 1, column: 0, row: 0 } },
  mother: npc(0,0), stepfather: npc(1,0), halfsister: npc(2,0), "partner-one": npc(3,0), stepsister: npc(0,1), "partner-two": npc(1,1), friend: npc(2,1), host: npc(3,1),
  // Temporary existing atlas frames until personal appearances are supplied.
  elena: npc(2,1), jason: npc(3,0), luca: npc(1,1), wyatt: npc(3,1),
  ida: npc(0,0), helena: npc(2,0), linda: npc(0,1), lina: npc(2,1), alexandra: npc(0,1),
  paul: npc(3,0), justin: npc(1,1),
  // Klassenfahrt: umgefärbte vorhandene Figuren, bis eigene Aussehen geliefert sind.
  kaiser: { ...npc(0,0), variant: 2 }, kluger: { ...npc(1,0), variant: 1 }, nino: { ...npc(3,0), variant: 2 }, richard: { ...npc(1,1), variant: 1 },
  "pupil-one": { ...npc(0,0), width: 7.0 }, "pupil-two": { ...npc(3,0), width: 7.5 },
  "pupil-three": { ...npc(2,0), width: 7.3 }, "pupil-four": { ...npc(1,1), width: 7.4 },
  "pupil-five": { ...npc(0,1), width: 6.8 }, "pupil-six": { ...npc(2,1), width: 7.1 },
  // Recolored pupils: other clothes and partly other hair (variant sheets, see graphics07.ts).
  "pupil-seven": { ...npc(0,0), width: 7.0, variant: 1 }, "pupil-eight": { ...npc(3,0), width: 7.5, variant: 1 },
  "pupil-nine": { ...npc(2,0), width: 7.3, variant: 1 }, "pupil-ten": { ...npc(1,1), width: 7.4, variant: 1 },
  "pupil-eleven": { ...npc(0,1), width: 6.8, variant: 1 }, "pupil-twelve": { ...npc(2,1), width: 7.1, variant: 1 },
  "pupil-thirteen": { ...npc(0,0), width: 7.1, variant: 2 }, "pupil-fourteen": { ...npc(3,0), width: 7.4, variant: 2 },
  "pupil-fifteen": { ...npc(2,0), width: 7.2, variant: 2 }, "pupil-sixteen": { ...npc(1,1), width: 7.5, variant: 2 },
  "pupil-seventeen": { ...npc(0,1), width: 6.9, variant: 2 }, "pupil-eighteen": { ...npc(2,1), width: 7.0, variant: 2 },
  alexander: npc(3,0), magdalena: npc(0,1), hans: npc(3,1), fritz: npc(1,0),
  dog: { sheet: "/characters/anuk-v06.webp", columns: 1, rows: 1, column: 0, row: 0, width: 9, anchor: { x: .5, y: .94 }, portrait: { sheet: "/characters/anuk-v06.webp", columns: 1, rows: 1, column: 0, row: 0 } },
} satisfies Record<string, CharacterGraphic>;
export type CharacterId = keyof typeof CHARACTER_GRAPHICS;
export type SpriteRect = readonly [number, number, number, number];
// Measured opaque character bounds, excluding neighboring frames and transparent
// margins. Every frame is fitted onto the same center/foot baseline at render time.
export const SPRITE_FRAMES: Record<string, { size: readonly [number, number]; frames: readonly (readonly SpriteRect[])[] }> = {
  "/characters/felice-walk-v1.webp": { size: [1448,1086], frames: [
    [[159,19,148,343],[471,19,133,343],[841,19,147,343],[1125,19,132,343]],
    [[161,376,158,334],[435,375,173,334],[833,376,160,334],[1122,376,173,334]],
    [[157,727,151,334],[443,727,165,332],[841,727,153,334],[1122,727,165,332]],
  ] },
  "/characters/elias-walk-v06-fixed.webp": { size: [1448,1086], frames: [
    [[153,12,154,350],[469,14,137,348],[825,13,160,349],[1148,14,136,348]],
    [[150,373,167,344],[444,374,193,342],[819,374,170,343],[1115,374,193,342]],
    [[149,724,164,340],[443,724,198,338],[822,724,163,339],[1111,724,199,338]],
  ] },
  "/characters/neighbors-v06.webp": { size: [1774,887], frames: [
    [[183,20,194,415],[570,7,184,428],[1012,23,199,414],[1411,10,194,425]],
    [[184,453,190,418],[569,444,180,427],[1012,452,194,419],[1425,444,177,427]],
  ] },
};
export const POSE_ATLASES = {
  "/characters/neighbors-poses-v065.webp": { size: [1254,1254], frames: [
    [[127,10,149,303],[417,4,145,309],[688,11,178,303],[998,6,135,307]],
    [[125,324,148,301],[418,318,138,307],[714,325,126,300],[997,319,138,305]],
    [[115,632,168,282],[401,629,170,285],[676,629,198,285],[986,629,169,285]],
    [[109,940,171,290],[395,940,175,291],[688,940,175,291],[989,940,166,291]],
  ] },
  "/characters/neighbors-walk-v065.webp": { size: [1254,1254], frames: [
    [[132,12,149,300],[411,6,148,306],[691,9,179,303],[998,7,146,305]],
    [[134,324,145,296],[415,320,144,300],[714,322,140,298],[1003,319,141,302]],
    [[127,636,151,298],[409,632,142,302],[682,637,189,296],[995,633,146,301]],
    [[129,949,148,294],[409,944,142,300],[709,945,135,297],[1000,940,144,304]],
  ] },
  "/characters/rest-poses-v065.webp": { size: [1254,1254], frames: [
    [[181,48,281,539],[798,38,253,549]],
    [[143,627,369,572],[806,627,237,571]],
  ] },
} as const;
export const REST_GRAPHICS = {
  sheet: "/characters/rest-poses-v065.webp", size: [1254,1254] as const,
  feliceSeated: POSE_ATLASES["/characters/rest-poses-v065.webp"].frames[0][0],
  eliasSeated: POSE_ATLASES["/characters/rest-poses-v065.webp"].frames[0][1],
  feliceLying: POSE_ATLASES["/characters/rest-poses-v065.webp"].frames[1][0],
  eliasLying: POSE_ATLASES["/characters/rest-poses-v065.webp"].frames[1][1],
};
export function characterGraphic(id: string): CharacterGraphic { return CHARACTER_GRAPHICS[id as CharacterId] ?? CHARACTER_GRAPHICS.friend; }
export function speakerGraphic(speaker: string): CharacterId | null {
  const speakers: Record<string, CharacterId> = { Felice: "felice", Elias: "elias", Anuk: "dog", "Felices Mutter": "mother", "Felices Stiefvater": "stepfather", "Felices Halbschwester": "halfsister", "Freund der Halbschwester": "partner-one", "Tochter des Stiefvaters": "stepsister", "Ihr Freund": "partner-two", Freunde: "friend", "Am Schießstand": "host", "Trainer Hans": "hans", Hans: "hans", "Trainer Fritz": "fritz", Fritz: "fritz" };
  const friends: Record<string, CharacterId> = { Paul: "paul", Justin: "justin", Schulleiter: "host", Bürgermeister: "stepfather", Elena: "elena", Jason: "jason", Luca: "luca", Wyatt: "wyatt", Ida: "ida", Helena: "helena", Linda: "linda", Lina: "lina", Alexandra: "alexandra", Alexander: "alexander", Magdalena: "magdalena", "Frau Kaiser": "kaiser", "Herr Kluger": "kluger", Nino: "nino", Richard: "richard" };
  return speaker === "Felice & Elias" ? "elias" : speakers[speaker] ?? friends[speaker] ?? null;
}
export const CHAPTER_GRAPHICS: Record<ChapterId, string> = { dog: "/rooms/garden-v06.webp", christmas: "/rooms/home-winter-v06.webp", school: "/rooms/zoerbig-market-v09.webp", shooting: "/rooms/goelzau-range-v1.webp", graduation: "/rooms/graduation-gym-v08.webp" };
