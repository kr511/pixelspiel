import { CharacterArt, characterStyle } from "./WorldArt";
import { REST_SPOTS } from "./day";
import { resolveStoryIllustration } from "./PhoneHub";
import { canWalk, type Point, type Place } from "./story";
import { STORY_EVENTS, type StoryBeat, type StoryEvent, type TimelineSave } from "./timeline";
export type SceneAnimation = NonNullable<StoryBeat["animation"]>;
export type StoryEffect = { id: string; kind: SceneAnimation; elapsed: number; sequence: boolean };
export function directionBetween(from: Point, to: Point) {
  const dx=to.x-from.x, dy=to.y-from.y;
  return Math.abs(dx)>Math.abs(dy) ? dx>0 ? "right" as const : "left" as const : dy>0 ? "front" as const : "back" as const;
}
export function castPoint(beat: StoryBeat | undefined, player: Point, effect: StoryEffect | null, place: Place, index = 0): Point {
  if (effect && ["sit", "kiss"].includes(effect.kind) && index === 0) {
    // Seats intentionally overlap furniture collision. Match the occupied seat,
    // rather than testing its companion through the walking collision mask.
    const seat = REST_SPOTS.find(spot => spot.place === place && spot.companion
      && Math.hypot(spot.position.x-player.x, spot.position.y-player.y) < .16);
    if (seat?.companion) return effect.kind === "kiss" ? { x: player.x + .035, y: player.y } : seat.companion;
  }
  const origin=effect && index === 0 ? player : beat?.target ?? player;
  const distance=effect && ["hug","kiss"].includes(effect.kind) ? .031 : .068;
  const candidates=[{x:origin.x+distance,y:origin.y},{x:origin.x-distance,y:origin.y},{x:origin.x,y:origin.y+.075}];
  const point=candidates.find(p=>canWalk(place,p.x,p.y))??origin;
  if (!index) return point;
  const offset=index%2?-.11:.11;
  const otherPositions=[
    {x:point.x+offset,y:point.y-.09*index},
    {x:point.x-offset,y:point.y-.09*index},
    {x:point.x+offset,y:point.y+.09*index},
  ];
  return otherPositions.find(p=>canWalk(place,p.x,p.y)) ?? point;
}
export function SequenceCast({event,beat,player,effect,place,conversing}: {event:StoryEvent;beat?:StoryBeat;player:Point;effect:StoryEffect|null;place:Place;conversing:boolean}) {
  const cast=(event.cast??["Felice","Elias"]).filter(name=>name!=="Felice"
    && !(name.includes("Familie") && (place === "bedroom" || place === "eliasroom")));
  return <>{cast.map((name,index)=>{
    const id=name==="Elias"?"elias":name.includes("Familie")?"mother":name.includes("schüler")||name.includes("schülerin")?"elena":name.toLowerCase();
    const p=castPoint(beat,player,effect,place,index), close=Boolean(effect&&["hug","kiss","handhold"].includes(effect.kind));
    return <div key={name} className={`room-player sequence-actor${close?" couple-close":""}`} data-testid={id==="elias"?"story-elias":"story-npc"} style={{...characterStyle(id),left:`${p.x*100}%`,top:`${p.y*100}%`,zIndex:Math.round(p.y*100)+11}} aria-label={name}>
      <CharacterArt id={id} direction={conversing||effect?directionBetween(p,player):"front"} pose={effect&&["sit","kiss"].includes(effect.kind)&&index===0?"sitting":"standing"} walking={effect?.kind === "walk"} frame={effect?.kind === "walk" ? Math.floor(effect.elapsed / 120) % 3 : 0}/><span className="room-player-label">{name}</span>
      {effect&&["hug","kiss","handhold","heart"].includes(effect.kind)&&<span className="couple-heart" aria-hidden="true">♥</span>}
    </div>;
  })}</>;
}
export function StoryEffects({effect,timeline,finale}: {effect:StoryEffect|null;timeline:TimelineSave;finale:boolean}) {
  if(finale)return <div className="finale-curtain" role="status"><div className="finale-couple"><CharacterArt id="felice"/><CharacterArt id="elias"/></div><p>Unsere Geschichte ist noch lange nicht zu Ende. ❤️</p><span>Unsere Geschichte · Euer Album öffnet sich gleich</span></div>;
  if(!effect)return null;
  const groups: Record<string, string[]> = {
    beginning: ["chat-2025-11-13", "radegast-chocolate", "confession-2025-11-24", "first-i-love-you"],
    november: ["chat-2025-11-13", "radegast-chocolate", "confession-2025-11-24", "first-i-love-you"],
    winter: ["confession-2025-11-24", "first-i-love-you", "playground-2025-12-01", "christmas-market-2025-12-06", "first-kiss-christmas"],
    year: ["first-valentine", "elias-room-weekend", "longer-visit-plan", "summer-everyday"],
  };
  const ids = groups[effect.id] ?? ["radegast-chocolate", "confession-2025-11-24", "first-i-love-you", "christmas-market-2025-12-06", "first-kiss-christmas", "first-valentine"];
  const remembered=STORY_EVENTS.filter(e=>e.confirmed&&timeline.progress[e.id]?.completedAt&&ids.includes(e.id));
  return <div className={`story-effect effect-${effect.kind}`} data-testid="story-animation" data-animation={effect.kind} aria-hidden={effect.kind!=="reflection"}>
    {effect.kind==="fireworks"&&Array.from({length:7},(_,i)=><span key={i} className="pixel-firework" style={{left:`${15+i*12}%`,top:`${12+i%3*13}%`,animationDelay:`${i*.15}s`}}>✺</span>)}
    {effect.kind==="reflection"&&<div className="memory-montage" aria-label="Freigeschaltete Erinnerungen im Rückblick">{remembered.map(e=><figure key={e.id}><img src={resolveStoryIllustration(e.illustration)} alt=""/><figcaption>{e.title}</figcaption></figure>)}</div>}
    {effect.kind==="kiss"&&<><span className="kiss-heart">♥</span><div className="kiss-fade" style={{opacity:Math.max(0,(effect.elapsed-2200)/1800)}}/></>}
    {effect.kind==="sleep"&&<div className="sleep-fade" style={{opacity:Math.min(.93,effect.elapsed/1800)}}><span>Eine gemeinsame Nacht. Die Erinnerung bleibt persönlich.</span></div>}
  </div>;
}
