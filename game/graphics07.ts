import type { SpriteRect } from "./graphics";

type Direction = "front" | "left" | "back" | "right";
type Atlas = { size: readonly [number, number]; frames: readonly (readonly SpriteRect[])[] };
export const WALK_ATLASES: Record<string, Atlas> = {
  "/characters/neighbors-front-v07.png": { size: [1254,1254], frames: [
    [[233,5,98,208],[469,3,95,211],[692,6,111,208],[922,4,102,210]],
    [[230,218,101,201],[468,217,98,202],[692,218,105,201],[923,216,98,203]],
    [[234,422,104,203],[466,419,97,206],[685,421,124,204],[925,419,100,205]],
    [[236,630,101,201],[468,627,100,203],[702,628,97,203],[925,626,98,205]],
    [[234,835,105,190],[467,831,90,194],[687,835,130,190],[924,831,99,195]],
    [[232,1029,103,213],[468,1026,96,216],[700,1030,98,212],[926,1027,97,216]],
  ] },
  "/characters/neighbors-back-v07.png": { size: [1254,1254], frames: [
    [[213,12,99,209],[474,7,95,214],[710,11,115,210],[967,10,99,211]],
    [[213,236,97,201],[474,227,96,210],[718,234,97,203],[971,230,89,207]],
    [[216,444,99,185],[470,440,95,189],[711,443,113,186],[965,443,98,186]],
    [[216,640,102,187],[468,632,97,195],[718,640,100,187],[971,634,91,193]],
    [[213,833,105,189],[466,831,100,191],[705,832,124,190],[963,833,102,189]],
    [[214,1034,104,201],[468,1026,102,210],[714,1033,103,202],[967,1026,99,210]],
  ] },
  "/characters/neighbors-side-v07.png": { size: [1254,1254], frames: [
    [[184,7,104,220],[461,4,83,223],[722,8,109,219],[980,6,87,221]],
    [[187,238,105,220],[455,236,89,224],[721,241,94,219],[985,237,82,223]],
    [[167,466,121,217],[440,464,111,220],[704,467,132,216],[971,466,106,217]],
    [[168,695,127,221],[435,694,118,222],[702,698,113,219],[969,692,113,224]],
  ] },
  "/characters/neighbors-side-step-v07.png": { size: [1774,887], frames: [
    [[128,21,237,408],[541,10,239,418],[984,20,262,407],[1428,12,232,417]],
    [[123,456,238,397],[541,445,252,411],[984,453,237,401],[1430,443,242,409]],
  ] },
};

export function neighborFrame(column: number, row: number, direction: Direction, frame: number) {
  const step = frame === 1 || frame === 2 ? frame : 0;
  const side = direction === "left" || direction === "right";
  const sheet = side ? step === 2 ? "/characters/neighbors-side-step-v07.png" : "/characters/neighbors-side-v07.png" : direction === "back" ? "/characters/neighbors-back-v07.png" : "/characters/neighbors-front-v07.png";
  const atlas = WALK_ATLASES[sheet];
  return { sheet, size: atlas.size, rect: atlas.frames[row + (side && step === 2 ? 0 : step*2)][column], mirror: direction === "right" };
}
