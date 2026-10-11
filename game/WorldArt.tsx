import { memo, useId, useState, type CSSProperties } from "react";
import { SceneArt, PersonArt, DogArt } from "./SceneArt";
import { CHARACTER_GRAPHICS, REST_GRAPHICS, POSE_ATLASES, SPRITE_FRAMES, SCENE_GRAPHICS, characterGraphic, sceneBackground, foregroundPath, type SpriteRect } from "./graphics";
import { neighborFrame } from "./graphics07";
import type { Place } from "./story";
import type { Season } from "./day";
import { assetUrl } from "./assets";

export const WorldBackdrop = memo(function WorldBackdrop({ place, season }: { place: Place; season: Season }) {
  const clipId = useId();
  const winter = season === "Winter";
  const primarySource = sceneBackground(place, season);
  const scene = SCENE_GRAPHICS[place];
  const fallbackSource = (winter ? scene.winterFallback : undefined) ?? scene.fallback ?? scene.background;
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const source = failedSources.includes(primarySource) && fallbackSource ? fallbackSource : primarySource;
  const crop = scene.crop;
  const framing = crop ? { x: -crop.x/crop.width*100, y: -crop.y/crop.height*100, width: 100/crop.width, height: 100/crop.height } : { x: 0, y: 0, width: 100, height: 100 };
  if (failedSources.includes(source)) return <div className={`scene-backdrop fallback-${place}`}><SceneArt place={place} christmas={winter}/></div>;
  return <>
    <svg className={`scene-backdrop${scene.seasons ? " seasonal-scene" : ""}${scene.fallback ? " story-pixel-backdrop" : ""}${winter && scene.outdoors && !scene.winter && !scene.seasons ? " winter-town" : ""}`} data-season={season} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><image href={assetUrl(source)} {...framing} preserveAspectRatio="none" onError={() => setFailedSources(previous => previous.includes(source) ? previous : [...previous, source])}/></svg>
    {scene.foreground.map((layer, index) => {
      const path = foregroundPath(layer, source, scene.seasons?.Winter ?? scene.winter);
      return <svg key={index} className={`scene-foreground${scene.seasons ? " seasonal-scene" : ""}`} style={{ clipPath: layer.clip, zIndex: Math.round(layer.depth) + 9 }} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {path && <defs><clipPath id={`${clipId}-${index}`} clipPathUnits="userSpaceOnUse"><path d={path} clipRule="evenodd"/></clipPath></defs>}
        <image href={assetUrl(source)} {...framing} preserveAspectRatio="none" clipPath={path ? `url(#${clipId}-${index})` : undefined}/>
      </svg>;
    })}
  </>;
});

export function CharacterArt({ id, portrait = false, direction = "front", walking = false, frame = 0, pose = "standing" }: { id: string; portrait?: boolean; direction?: "front" | "left" | "back" | "right"; walking?: boolean; frame?: number; pose?: "standing" | "sitting" | "lying" }) {
  const graphic = characterGraphic(id);
  const spec = portrait ? graphic.portrait : graphic;
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const column = !portrait && (id === "elias" || id === "felice") ? ["front","left","back","right"].indexOf(direction) : spec.column;
  const duo = id === "felice" || id === "elias";
  const resting = !portrait && pose !== "standing" && id !== "dog";
  const neighbor = !portrait && !resting && !duo && id !== "dog" ? neighborFrame(spec.column, spec.row, direction, walking ? frame : 0, (spec as { variant?: number }).variant) : null;
  const sheet = resting ? duo ? REST_GRAPHICS.sheet : "/characters/neighbors-poses-v065.png" : neighbor?.sheet ?? spec.sheet;
  if (failedSource === sheet) return <span className={`character-fallback fallback-pose-${pose}`}>{id === "dog" ? <DogArt/> : <PersonArt variant={id}/>}</span>;
  const atlas = SPRITE_FRAMES[spec.sheet];
  if (!portrait && (atlas || resting || neighbor)) {
    const npcAtlas = POSE_ATLASES["/characters/neighbors-poses-v065.png"];
    let rect: SpriteRect;
    if (resting && duo) {
      const seated = id === "elias" ? REST_GRAPHICS.eliasSeated : REST_GRAPHICS.feliceSeated;
      const lying = id === "elias" ? REST_GRAPHICS.eliasLying : REST_GRAPHICS.feliceLying;
      rect = pose === "lying" ? lying : seated;
    } else if (resting) {
      rect = npcAtlas.frames[spec.row + (pose === "lying" ? 2 : 0)][spec.column];
    } else if (neighbor) {
      rect = neighbor.rect;
    } else {
      const frameIndex = walking && Number.isFinite(frame) ? Math.max(0,Math.floor(frame)) % atlas.frames.length : spec.row;
      rect = (atlas.frames[frameIndex] ?? atlas.frames[0])[column];
    }
    const size = resting ? [1254,1254] : neighbor?.size ?? atlas.size;
    const height = pose === "sitting" ? 108 : pose === "lying" ? 125 : 132;
    const width = rect[2] / rect[3] * height;
    return <svg key={sheet} className={`character-art character-${pose}`} viewBox="0 0 100 140" data-frame={walking ? frame : 0} data-direction={direction} data-sheet={sheet} aria-hidden="true">
      <g transform={neighbor?.mirror ? "translate(100 0) scale(-1 1)" : undefined}>
      <svg x={50-width/2} y={140-height} width={width} height={height} viewBox={rect.join(" ")} overflow="hidden">
        <image href={assetUrl(sheet)} width={size[0]} height={size[1]} onError={() => setFailedSource(sheet)}/>
      </svg>
      </g>
    </svg>;
  }
  if (portrait && id === "felice") return <svg className="character-art" viewBox="155 15 155 155" aria-hidden="true"><image href={assetUrl(spec.sheet)} width="1448" height="1086" onError={() => setFailedSource(sheet)}/></svg>;
  return <svg className="character-art" viewBox="0 0 100 100" aria-hidden="true">
    <image href={assetUrl(spec.sheet)} x={-column*100} y={-spec.row*100} width={spec.columns*100} height={spec.rows*100} preserveAspectRatio="none" onError={() => setFailedSource(sheet)}/>
  </svg>;
}

/** Reuse the painted bench silhouette; the paving is excluded by the mask. */
export function BenchArt({ winter = false }: { winter?: boolean }) {
  const clip = useId();
  return <svg viewBox="10.8 37.8 19 10.4" aria-hidden="true">
    <defs><clipPath id={clip}><path d="M11.5 38.5H29.2V45.5H11.5ZM11.1 39H12.1V47.8H11.1ZM28.4 39H29.6V47.8H28.4Z"/></clipPath></defs>
    <image href={assetUrl(winter ? "/rooms/school-winter-v06.png" : "/rooms/school-v06.png")} width="100" height="100" clipPath={`url(#${clip})`}/>
  </svg>;
}

export function characterStyle(id: string): CSSProperties {
  const graphic = characterGraphic(id);
  return { width: `${graphic.width}%`, transform: `translate(${-graphic.anchor.x*100}%,${-graphic.anchor.y*100}%)` };
}

export const WorldAtmosphere = memo(function WorldAtmosphere({ place, season }: { place: Place; season: Season }) {
  const scene = SCENE_GRAPHICS[place];
  const winter = season === "Winter";
  return <div className={`world-atmosphere ${scene.outdoors ? "is-outdoors" : "is-indoors"} ${winter ? "is-winter" : ""}`} aria-hidden="true" style={{ "--scene-light": scene.light } as CSSProperties}>
    {!scene.outdoors && <><span className="lamp-glow lamp-one"/><span className="lamp-glow lamp-two"/></>}
    {scene.outdoors && [0,1,2,3].map(i => <span key={i} className="drifting-leaf" style={{ "--leaf-index": i } as CSSProperties}/>)}
    {winter && (place === "home" || place === "bedroom") && <span className="christmas-lights">{[0,1,2,3,4,5,6,7].map(i=><i key={i} style={{ animationDelay: `${i*.37}s` }}/>)}</span>}
  </div>;
});

/** These lights sit above the night shade and follow the same smooth dusk/dawn. */
export const WorldNightLights = memo(function WorldNightLights({ place, daylight }: { place: Place; daylight: number }) {
  const glow = useId();
  const lights = SCENE_GRAPHICS[place].nightLights;
  if (!lights) return null;
  return <svg className="world-night-lights" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ opacity: 1 - daylight }} aria-hidden="true">
    <defs><radialGradient id={glow}><stop offset="0" stopColor="#ffcf80" stopOpacity=".65"/><stop offset=".25" stopColor="#ffc270" stopOpacity=".32"/><stop offset="1" stopColor="#ffc270" stopOpacity="0"/></radialGradient></defs>
    {lights.windows.map((pane, index) => <rect key={`window-${index}`} {...pane} fill="#ffcd83" fillOpacity=".68"/>)}
    {lights.lamps.map((lamp, index) => <g key={`lamp-${index}`}>
      <ellipse cx={lamp.x * 100} cy={lamp.y * 100 + 1.5} rx="6" ry="7.5" fill={`url(#${glow})`}/>
      <circle cx={lamp.x * 100} cy={lamp.y * 100} r=".25" fill="#fff1be"/>
    </g>)}
  </svg>;
});

// Explicit export for asset consumers and preview tools.
export const ELIAS_SHEET = CHARACTER_GRAPHICS.elias.sheet;
