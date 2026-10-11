import { SCHOOL_END } from "./day.ts";
import { walkingRoute, standingActor, type Actor } from "./actors.ts";
import { walkingFrame } from "./motion.ts";
import { SCHOOL_MORNING_ENTITIES } from "./school.ts";
import { ENTITIES, PLACES, type Entity, type Place, type Point } from "./story.ts";

export const SCHOOL_COURTYARD_CLOSE = 18 * 60;
export const SCHOOL_BUS_DEPARTURE = 14 * 60;
const WALK_SPEED = .10;
const MAX_ELAPSED = 60;

export type SchoolDismissalState = { date: string; elapsed: number };
export type DismissedPupil = { entity: Entity; actor: Actor; destination: "courtyard" | "bus" };
type Leg = { place: Place; points: Point[]; length: number };
type Journey = { pupil: Entity; release: number; destination: DismissedPupil["destination"]; legs: Leg[] };
let journeys: Journey[] | undefined;

function walkingLeg(place: Place, from: Point, to: Point): Leg {
  const points = [from, ...walkingRoute(place, from, to)];
  if (points.length === 1) throw new Error(`No school dismissal route in ${place}`);
  const length = points.slice(1).reduce((total, point, i) => total + Math.hypot(point.x - points[i].x, point.y - points[i].y), 0);
  return { place, points, length };
}

function dismissalJourneys(): Journey[] {
  if (journeys) return journeys;
  const door = ENTITIES.school.find(entity => entity.id === "school-door")!;
  const gate = PLACES.school.exits.find(exit => exit.to === "zoerbig")!;
  const stop = PLACES.zoerbig.exits.find(exit => exit.to === "bus")!;
  const entrance = walkingLeg("school", { x: door.x, y: door.y }, { x: door.x, y: door.y + .06 });
  const porch = entrance.points[entrance.points.length - 1];
  const waitingPlaces = [{ x: stop.x + .04, y: stop.y + .04 }, { x: stop.x - .03, y: stop.y + .06 }, { x: stop.x + .04, y: stop.y + .10 }];
  journeys = SCHOOL_MORNING_ENTITIES.filter(entity => entity.id.startsWith("school-pupil-")).map((pupil, i) => {
    const destination = pupil.id.includes("-left-") ? "courtyard" : "bus";
    const throughYard = walkingLeg("school", porch, destination === "courtyard" ? { x: pupil.x, y: pupil.y } : gate);
    const schoolLeg: Leg = { place: "school", points: [...entrance.points, ...throughYard.points.slice(1)], length: entrance.length + throughYard.length };
    const legs = destination === "courtyard"
      ? [schoolLeg]
      : [schoolLeg, walkingLeg("zoerbig", gate.spawn, waitingPlaces[i - 3])];
    return { pupil, release: i * 1.6, destination, legs };
  });
  return journeys;
}

export function schoolDismissalElapsed(state: SchoolDismissalState, date: string, minute: number): number {
  if (minute < SCHOOL_END) return 0;
  // Returning later in the afternoon resumes the pupils at their destinations.
  return Math.min(MAX_ELAPSED, Math.max(state.date === date ? state.elapsed : 0, (minute - SCHOOL_END) * 4));
}

export function advanceSchoolDismissal(state: SchoolDismissalState, date: string, minute: number, seconds: number): SchoolDismissalState {
  if (minute < SCHOOL_END || minute >= SCHOOL_COURTYARD_CLOSE) return state;
  const elapsed = Math.min(MAX_ELAPSED, schoolDismissalElapsed(state, date, minute) + Math.max(0, seconds));
  return state.date === date && state.elapsed === elapsed ? state : { date, elapsed };
}

function actorOnLeg(leg: Leg, travelled: number): Actor {
  if (travelled >= leg.length) return standingActor(leg.points[leg.points.length - 1]);
  let distance = Math.min(travelled, leg.length);
  for (let i = 1; i < leg.points.length; i++) {
    const a = leg.points[i - 1], b = leg.points[i];
    const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy);
    if (length === 0) continue;
    if (distance < length) {
      const position = { x: a.x + dx * distance / length, y: a.y + dy * distance / length };
      return { ...standingActor(position), moving: true, distance: travelled, frame: walkingFrame(travelled), direction: Math.abs(dx) > Math.abs(dy) ? dx > 0 ? "right" : "left" : dy > 0 ? "front" : "back" };
    }
    distance -= length;
  }
  return standingActor(leg.points[leg.points.length - 1]);
}

/** Pupils leave the door in a staggered line, then gather or walk to the bus. */
export function schoolDismissalPupils(place: Place, minute: number, elapsed: number): DismissedPupil[] {
  if (!["school", "zoerbig"].includes(place) || minute < SCHOOL_END || minute >= SCHOOL_COURTYARD_CLOSE) return [];
  return dismissalJourneys().flatMap(journey => {
    if (elapsed < journey.release || journey.destination === "bus" && minute >= SCHOOL_BUS_DEPARTURE) return [];
    let distance = (elapsed - journey.release) * WALK_SPEED;
    let leg = journey.legs[0];
    for (let i = 1; i < journey.legs.length && distance >= leg.length; i++) {
      distance -= leg.length;
      leg = journey.legs[i];
    }
    if (leg.place !== place) return [];
    const actor = actorOnLeg(leg, distance);
    const text = journey.destination === "courtyard"
      ? "Endlich Schulschluss! Wir bleiben noch ein bisschen zusammen auf dem Hof und reden."
      : actor.moving ? "Ich gehe zum Bus am Markt. Kommst du auch mit?" : "Jetzt warten wir hier auf den Bus nach Hause.";
    return [{ entity: { ...journey.pupil, ...actor.position, text }, actor, destination: journey.destination }];
  });
}
