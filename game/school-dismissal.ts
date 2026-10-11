import { SCHOOL_END } from "./day.ts";
import { walkingRoute, standingActor, type Actor } from "./actors.ts";
import { walkingFrame } from "./motion.ts";
import { isSchoolMorning, ringFormation, SCHOOL_ARRIVAL_IDS, SCHOOL_MORNING_ENTITIES, type Spot } from "./school.ts";
import { ENTITIES, PLACES, type Entity, type Place, type Point } from "./story.ts";

export const SCHOOL_COURTYARD_CLOSE = 18 * 60;
export const SCHOOL_BUS_DEPARTURE = 14 * 60;
const WALK_SPEED = .10;
const MAX_ELAPSED = 60;

// `elapsed` counts real seconds after school ends, `morning` real seconds of the morning before lessons.
export type SchoolDismissalState = { date: string; elapsed: number; morning?: number };
export type DismissedPupil = { entity: Entity; actor: Actor; destination: "courtyard" | "bus" | "arrival" };
type Leg = { place: Place; points: Point[]; length: number };
type Journey = { pupil: Entity; spot: Spot; release: number; destination: DismissedPupil["destination"]; legs: Leg[] };
let journeys: Journey[] | undefined;
let arrivals: Journey[] | undefined;

// After school the groups leave the door one after another and stand in circles again:
// some stay on the courtyard, the others wait on the market square around the bus stop (not on the road),
// each group clearly apart from the next.
const AFTER_SCHOOL_GROUPS: { prefix: string; destination: "courtyard" | "bus"; center?: Point; radius?: number }[] = [
  { prefix: "school-pupil-left-", destination: "courtyard" },
  { prefix: "school-pupil-right-", destination: "bus", center: { x: .36, y: .36 }, radius: .03 },
  { prefix: "school-group-3-", destination: "courtyard" },
  { prefix: "school-group-2-", destination: "bus", center: { x: .64, y: .32 }, radius: .03 },
  { prefix: "school-group-5-", destination: "courtyard" },
  { prefix: "school-group-1-", destination: "bus", center: { x: .51, y: .46 }, radius: .025 },
  { prefix: "school-group-4-", destination: "bus", center: { x: .36, y: .51 }, radius: .025 },
];
const GROUP_GAP = 4;
const MEMBER_GAP = .5;
// Mornings: a few pupils arrive by bus a little later and join their group.
const ARRIVAL_RELEASES = [6, 20, 34];
const ARRIVAL_START: Point = { x: .37, y: .285 };

function walkingLeg(place: Place, from: Point, to: Point): Leg {
  const points = [from, ...walkingRoute(place, from, to)];
  if (points.length === 1) throw new Error(`No school route in ${place}`);
  const length = points.slice(1).reduce((total, point, i) => total + Math.hypot(point.x - points[i].x, point.y - points[i].y), 0);
  return { place, points, length };
}

function dismissalJourneys(): Journey[] {
  if (journeys) return journeys;
  const door = ENTITIES.school.find(entity => entity.id === "school-door")!;
  const gate = PLACES.school.exits.find(exit => exit.to === "zoerbig")!;
  const entrance = walkingLeg("school", { x: door.x, y: door.y }, { x: door.x, y: door.y + .06 });
  const porch = entrance.points[entrance.points.length - 1];
  journeys = AFTER_SCHOOL_GROUPS.flatMap((group, groupIndex) => {
    const members = SCHOOL_MORNING_ENTITIES.filter(entity => entity.id.startsWith(group.prefix));
    const ring = group.center ? ringFormation(group.center, members.length, group.radius!) : undefined;
    return members.map((pupil, i): Journey => {
      const spot: Spot = ring ? ring[i] : { x: pupil.x, y: pupil.y, facing: pupil.facing ?? "front" };
      const throughYard = walkingLeg("school", porch, group.destination === "courtyard" ? spot : gate);
      const schoolLeg: Leg = { place: "school", points: [...entrance.points, ...throughYard.points.slice(1)], length: entrance.length + throughYard.length };
      return {
        pupil, spot, destination: group.destination, release: groupIndex * GROUP_GAP + i * MEMBER_GAP,
        legs: group.destination === "courtyard" ? [schoolLeg] : [schoolLeg, walkingLeg("zoerbig", gate.spawn, spot)],
      };
    });
  });
  return journeys;
}

function arrivalJourneys(): Journey[] {
  if (arrivals) return arrivals;
  const toSchool = PLACES.zoerbig.exits.find(exit => exit.to === "school")!;
  arrivals = SCHOOL_ARRIVAL_IDS.map((id, i): Journey => {
    const pupil = SCHOOL_MORNING_ENTITIES.find(entity => entity.id === id)!;
    const spot: Spot = { x: pupil.x, y: pupil.y, facing: pupil.facing ?? "front" };
    return {
      pupil, spot, destination: "arrival", release: ARRIVAL_RELEASES[i],
      legs: [walkingLeg("zoerbig", ARRIVAL_START, { x: toSchool.x, y: toSchool.y }), walkingLeg("school", toSchool.spawn, spot)],
    };
  });
  return arrivals;
}

export function schoolDismissalElapsed(state: SchoolDismissalState, date: string, minute: number): number {
  if (minute < SCHOOL_END) return 0;
  // Returning later in the afternoon resumes the pupils at their destinations.
  return Math.min(MAX_ELAPSED, Math.max(state.date === date ? state.elapsed : 0, (minute - SCHOOL_END) * 4));
}

export function schoolMorningElapsed(state: SchoolDismissalState, date: string, minute: number): number {
  return isSchoolMorning(minute) && state.date === date ? state.morning ?? 0 : 0;
}

export function advanceSchoolDismissal(state: SchoolDismissalState, date: string, minute: number, seconds: number): SchoolDismissalState {
  if (isSchoolMorning(minute)) {
    const morning = Math.min(MAX_ELAPSED, schoolMorningElapsed(state, date, minute) + Math.max(0, seconds));
    return state.date === date && state.morning === morning ? state : { date, elapsed: state.date === date ? state.elapsed : 0, morning };
  }
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

/** Where a pupil is in `place` after `elapsed` seconds of its journey, if it is there at all. */
function journeyActor(journey: Journey, place: Place, elapsed: number): Actor | undefined {
  if (elapsed < journey.release) return undefined;
  let distance = (elapsed - journey.release) * WALK_SPEED;
  let leg = journey.legs[0];
  for (let i = 1; i < journey.legs.length && distance >= leg.length; i++) {
    distance -= leg.length;
    leg = journey.legs[i];
  }
  return leg.place === place ? actorOnLeg(leg, distance) : undefined;
}

/** Pupils leave the door in staggered groups, then gather in circles on the courtyard or at the bus stop. */
export function schoolDismissalPupils(place: Place, minute: number, elapsed: number): DismissedPupil[] {
  if (!["school", "zoerbig"].includes(place) || minute < SCHOOL_END || minute >= SCHOOL_COURTYARD_CLOSE) return [];
  return dismissalJourneys().flatMap(journey => {
    if (journey.destination === "bus" && minute >= SCHOOL_BUS_DEPARTURE) return [];
    const actor = journeyActor(journey, place, elapsed);
    if (!actor) return [];
    const text = journey.destination === "courtyard"
      ? "Endlich Schulschluss! Wir bleiben noch ein bisschen zusammen auf dem Hof und reden."
      : actor.moving ? "Ich gehe zum Bus am Markt. Kommst du auch mit?" : "Jetzt warten wir hier auf den Bus nach Hause.";
    return [{ entity: { ...journey.pupil, ...actor.position, facing: journey.spot.facing, text }, actor, destination: journey.destination }];
  });
}

/** Before lessons a few pupils arrive from the market and join their group, which stays put otherwise. */
export function schoolMorningArrivals(place: Place, minute: number, elapsed: number): DismissedPupil[] {
  if (!["school", "zoerbig"].includes(place) || !isSchoolMorning(minute)) return [];
  return arrivalJourneys().flatMap(journey => {
    const actor = journeyActor(journey, place, elapsed);
    return actor ? [{ entity: { ...journey.pupil, ...actor.position, facing: journey.spot.facing }, actor, destination: journey.destination }] : [];
  });
}
