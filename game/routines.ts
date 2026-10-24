import { canWalk, type Entity, type Place, type Point } from "./story.ts";
import { walkingRoute, type Actor } from "./actors.ts";
import { movementStep, walkingFrame } from "./motion.ts";
import { isSchoolArrival, isSchoolMorning, isSchoolMorningEntity, SCHOOL_ARRIVAL } from "./school.ts";
import { SCHOOL_END, SCHOOL_START } from "./day.ts";
import { GRADUATION_DAY, isSchoolDay } from "./school-calendar.ts";
import { isRoutineDay } from "./timeline.ts";
// Ambient routines use the existing actors; story casts are never hidden.
// Outside story chapters only Felice's mother and stepfather stay home; the others are out and return for the Christmas dinner.
const AWAY_FROM_HOME = ["halfsister","halfsister-partner","stepsister","stepsister-partner"];
const SCHOOL_FRIENDS = ["friends", "jason", "luca", "wyatt"];
// The certificate ceremony stands in the gym only on its day; afterwards the certificates and the photo stay as a memory.
const GRADUATION_KEEPSAKES = ["graduation-certificates", "graduation-photo"];
export function routineEntities(place: Place, minute: number, entities: Entity[], keepElias = false, inStory = false, date?: string): Entity[] {
  if (place === "home" && !inStory) entities = entities.filter(e => !AWAY_FROM_HOME.includes(e.id));
  // The forgotten notebook only belongs to the old school chapter, not to everyday school days.
  if (place === "school" && !inStory) entities = entities.filter(e => e.id !== "notebook");
  // Shooting friends and trainers meet in the evening and at weekends; the lane itself stays open.
  if (place === "range" && !inStory && date && minute < 16 * 60 && ![0, 6].includes(new Date(`${date}T12:00:00Z`).getUTCDay())) entities = entities.filter(e => e.kind !== "person");
  // The homework pile belongs to the routine days; afterwards the desk chair stays free.
  if (place === "bedroom" && !inStory && date && !isRoutineDay(date)) entities = entities.filter(e => e.id !== "homework");
  if (place === "gym" && !inStory && date && date !== GRADUATION_DAY) entities = date > GRADUATION_DAY ? entities.filter(e => GRADUATION_KEEPSAKES.includes(e.id)) : [];
  if (place === "school" && !inStory && date) {
    // Classmates are only around on school days, before and after the lessons.
    const schoolDay = isSchoolDay(date);
    const yardTime = minute < SCHOOL_START || minute >= SCHOOL_END;
    entities = entities.filter(e => e.kind !== "person" || keepElias && e.art === "elias" || schoolDay && (!SCHOOL_FRIENDS.includes(e.id) || yardTime));
  }
  if (place === "school") {
    // The late arrivals walk in from the market (schoolMorningArrivals) instead of standing there from the start.
    entities = entities.filter(e => !isSchoolArrival(e.id) && (!isSchoolMorningEntity(e.id) || isSchoolMorning(minute) || keepElias && e.art === "elias"));
    if (minute < SCHOOL_ARRIVAL || minute >= 1080) return entities.filter(e => e.kind !== "person" || keepElias && e.art === "elias");
  }
  return entities;
}

// Places that the story has not reached yet have no path: the Christmas market (06.12.2025) and Elias' room (20.03.2026).
export const CHRISTMAS_MARKET_OPENS = "2025-12-06";
/** The market stands from its first visit until Christmas; in other months there is no way there. */
export const CHRISTMAS_MARKET_CLOSES = "2025-12-26";
export const ELIAS_ROOM_OPENS = "2026-03-20";
// Die Klassenfahrt (20.–24.04.2026) läuft von der Abfahrt bis zur Heimreise; dazwischen schläft Felice im Hotel.
// Sie hängt am Spielfortschritt, nicht am Kalender: Ein verpasster Reisetag wird nachgeholt, und Hotel und
// Ausflugsorte bleiben offen, bis die Heimreise gespielt ist.
export const TRIP = { start: "klassenfahrt-anreise", end: "klassenfahrt-heimreise", places: ["hotel", "hotelboys", "parliament", "europapark"] as Place[] };
type Progress = Record<string, { completedAt?: string } | undefined>;
export const onTrip = (progress: Progress) => Boolean(progress[TRIP.start]?.completedAt) && !progress[TRIP.end]?.completedAt;
/** Where Felice wakes up: in the hotel while the trip runs, otherwise at home. */
export const wakePlace = (progress: Progress): Place => onTrip(progress) ? "hotel" : "bedroom";
export function exitOpen(to: Place, date: string, from: Place, progress: Progress) {
  // Between trip places the way stays open, so Felice can always get back to the hotel and its bus home.
  if (TRIP.places.includes(to)) return onTrip(progress) || TRIP.places.includes(from);
  // The coach home is the Heimreise scene itself; until it is played nobody leaves Kehl early.
  if (from === "hotel" && to === "zoerbig") return !onTrip(progress);
  return to === "christmasmarket" ? date >= CHRISTMAS_MARKET_OPENS && date <= CHRISTMAS_MARKET_CLOSES : to === "eliasroom" ? date >= ELIAS_ROOM_OPENS : true;
}

// Outside story scenes Elias only appears where the story has already brought
// him: nowhere before the first meeting, at Felice's home only after Christmas,
// in his room only after the March weekend. Story casts are unaffected.
const ELIAS_FIRST_MEETING = "radegast-chocolate";
export const ELIAS_PRESENCE: Partial<Record<Place, string>> = {
  bedroom: "first-kiss-christmas", home: "first-kiss-christmas", kitchen: "first-kiss-christmas", garden: "first-kiss-christmas",
  playground: "playground-2025-12-01", christmasmarket: "christmas-market-2025-12-06", eliasroom: "elias-room-weekend",
};
export function eliasPresent(place: Place, completed: (id: string) => boolean) {
  return completed(ELIAS_FIRST_MEETING) && completed(ELIAS_PRESENCE[place] ?? ELIAS_FIRST_MEETING);
}

// Anuk does not exist yet at the start of the story. Once his arrival is a dated
// memory, put its event ID here; until then he only appears in the legacy draft.
export const ANUK_ARRIVAL: string | null = null;
export function anukPresent(completed: (id: string) => boolean) { return ANUK_ARRIVAL !== null && completed(ANUK_ARRIVAL); }

type Follower = Actor & { followTarget?: Point };

/** Reuse the world collision routes; normalized movement keeps pace with Felice. */
export function advanceFollower(place: Place, actor: Actor, player: Point, seconds: number): Follower {
  const follower = actor as Follower;
  const target = [{x:player.x+.075,y:player.y},{x:player.x-.075,y:player.y},{x:player.x,y:player.y+.075},player].find(point => canWalk(place,point.x,point.y)) ?? player;
  const distanceToTarget = Math.hypot(target.x-actor.position.x,target.y-actor.position.y);
  if(distanceToTarget < .025) return { ...actor, moving:false, direction:Math.abs(player.x-actor.position.x)>Math.abs(player.y-actor.position.y) ? player.x>actor.position.x ? "right" : "left" : player.y>actor.position.y ? "front" : "back", route:[], followTarget:target };
  const clearSegment = (destination:Point) => {
    const count=Math.max(1,Math.ceil(Math.hypot(destination.x-actor.position.x,destination.y-actor.position.y)/.01));
    for(let i=1;i<=count;i++) if(!canWalk(place,actor.position.x+(destination.x-actor.position.x)*i/count,actor.position.y+(destination.y-actor.position.y)*i/count)) return false;
    return true;
  };
  let route=clearSegment(target) ? [target] : follower.route;
  if(!clearSegment(target) && (!follower.followTarget || Math.hypot(target.x-follower.followTarget.x,target.y-follower.followTarget.y)>.075 || !route.length)) route=walkingRoute(place,actor.position,target);
  while(route.length && Math.hypot(route[0].x-actor.position.x,route[0].y-actor.position.y)<.018) route=route.slice(1);
  const waypoint=route[0];
  if(!waypoint) return {...actor,moving:false,route:[],followTarget:target};
  const dx=waypoint.x-actor.position.x,dy=waypoint.y-actor.position.y,length=Math.hypot(dx,dy);
  const position=movementStep(actor.position,{x:dx/length,y:dy/length},Math.min(seconds*1.08,length/.19),(x,y)=>canWalk(place,x,y));
  const distance=actor.distance+Math.hypot(position.x-actor.position.x,position.y-actor.position.y);
  return {...actor,position,pose:"standing",pending:undefined,restId:undefined,moving:Math.hypot(position.x-actor.position.x,position.y-actor.position.y)>.00001,direction:Math.abs(dx)>Math.abs(dy) ? dx>0 ? "right" : "left" : dy>0 ? "front" : "back",distance,frame:walkingFrame(distance),route,followTarget:target};
}
