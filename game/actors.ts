import { ENTITIES, canWalk, type Place, type Point } from "./story.ts";
import { REST_SPOTS, type RestSpot } from "./day.ts";
import { movementStep, walkingFrame } from "./motion.ts";

export type Pose = "standing" | "sitting" | "lying";
export type Actor = { position: Point; pose: Pose; moving: boolean; frame: number; direction: "front" | "left" | "back" | "right"; distance: number; waypoint: number; wait: number; route: Point[]; pending?: Pose; restId?: string; approach?: Point; departing?: Point };
export type Actors = Record<string, Actor>;
const FRIENDS = new Set(["paul", "justin", "elias", "elena", "jason", "luca", "wyatt", "ida", "helena", "linda", "lina", "alexandra", "alexander", "magdalena"]);
export function canChangePose(art: string) { return FRIENDS.has(art); }
export function standingActor(position: Point, wait = 0): Actor {
  return { position, pose: "standing", moving: false, frame: 0, direction: "front", distance: 0, waypoint: 1, wait, route: [] };
}

// Four short routes beside the gray building's basement window grilles.
// Elias is invited to the separate seating area and has no group patrol.
export const SCHOOL_ROUTES: Record<string, Point[]> = {
  friends: [{ x: .18, y: .295 }, { x: .207, y: .285 }, { x: .212, y: .315 }, { x: .185, y: .325 }],
  jason: [{ x: .25, y: .295 }, { x: .277, y: .285 }, { x: .282, y: .315 }, { x: .255, y: .325 }],
  luca: [{ x: .18, y: .39 }, { x: .207, y: .38 }, { x: .212, y: .41 }, { x: .185, y: .42 }],
  wyatt: [{ x: .25, y: .39 }, { x: .277, y: .38 }, { x: .282, y: .41 }, { x: .255, y: .42 }],
};
export function initialActors(): Actors {
  return Object.fromEntries(Object.values(ENTITIES).flat().filter(e => e.kind === "person" && canChangePose(e.art)).map((e, i) => [e.id, standingActor({ x: e.x, y: e.y }, 1.5 + i % 4)]));
}

/** Walkable grid routing, including the exact endpoints, around furniture. */
export function walkingRoute(place: Place, from: Point, to: Point): Point[] {
  const grid = .02;
  const clearEdge = (a: Point, b: Point) => {
    const samples = Math.max(1, Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/.005));
    for (let i=1;i<=samples;i++) if (!canWalk(place,a.x+(b.x-a.x)*i/samples,a.y+(b.y-a.y)*i/samples)) return false;
    return true;
  };
  const cell = (p: Point) => [Math.round(p.x / grid), Math.round(p.y / grid)];
  const start = cell(from), end = cell(to), key = (x: number, y: number) => `${x},${y}`;
  const queue = [start];
  const previous = new Map<string, number[] | null>([[key(start[0], start[1]), null]]);
  let found: number[] | undefined;
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    if (Math.hypot(x - end[0], y - end[1]) <= 1 && clearEdge({x:x*grid,y:y*grid},to)) { found = [x, y]; break; }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, id = key(nx, ny);
      if (previous.has(id) || !clearEdge({x:x*grid,y:y*grid},{x:nx*grid,y:ny*grid})) continue;
      previous.set(id, [x, y]); queue.push([nx, ny]);
    }
  }
  if (!found) return [];
  const route: Point[] = [to];
  let current: number[] | null = found;
  while (current) { route.unshift({ x: current[0] * grid, y: current[1] * grid }); current = previous.get(key(current[0], current[1])) ?? null; }
  // Keep corners and endpoints; straight grid sections need no intermediate stops.
  return route.filter((point, i) => {
    if (i === 0 || i === route.length - 1) return true;
    const a = route[i - 1], b = route[i + 1];
    return Math.abs((point.x-a.x)*(b.y-point.y)-(point.y-a.y)*(b.x-point.x)) > .000001;
  });
}

export function availableSeat(place: Place, pose: Pose, from: Point, actors: Actors, playerSpot?: string): { spot: RestSpot; position: Point; id: string } | undefined {
  return REST_SPOTS.filter(spot => spot.place === place && (pose === "lying" ? spot.kind === "bed" : spot.kind === "bench" || spot.kind === "chair"))
    .flatMap(spot => [spot.position, ...(spot.companion ? [spot.companion] : [])].map((position, i) => ({ spot, position, id: `${spot.id}:${i}` })))
    .filter(slot => slot.spot.id !== playerSpot && !Object.values(actors).some(actor => actor.restId === slot.id))
    .sort((a, b) => Math.hypot(a.spot.approach.x - from.x, a.spot.approach.y - from.y) - Math.hypot(b.spot.approach.x - from.x, b.spot.approach.y - from.y))[0];
}

export function requestPose(place: Place, actor: Actor, pose: Pose, seat?: ReturnType<typeof availableSeat>): Actor {
  const departing = actor.departing ?? (actor.pose !== "standing" || actor.pending && actor.route.length === 1 ? actor.approach : undefined);
  if (pose === "standing") {
    return { ...actor, pose, pending: undefined, restId: undefined, moving: false, route: departing ? [departing] : [], approach: undefined, departing, wait: 0 };
  }
  if (!seat || seat.spot.place !== place || (pose === "lying" && seat.spot.kind !== "bed")) return actor;
  const route = departing ? [departing, ...walkingRoute(place, departing, seat.spot.approach)] : walkingRoute(place, actor.position, seat.spot.approach);
  if (!route.length) return actor;
  return { ...actor, pose: "standing", pending: pose, restId: seat.id, departing, approach: seat.spot.approach, route: [...route, seat.position], wait: 0 };
}

export function advanceActor(place: Place, id: string, actor: Actor, seconds: number): Actor {
  if (actor.pose !== "standing") return actor;
  if (actor.wait > 0) return { ...actor, wait: Math.max(0, actor.wait - seconds), moving: false };
  const patrol = place === "school" ? SCHOOL_ROUTES[id] : undefined;
  const target = actor.route[0] ?? patrol?.[actor.waypoint];
  if (!target) return actor.moving ? { ...actor, moving: false } : actor;
  const dx = target.x - actor.position.x, dy = target.y - actor.position.y, length = Math.hypot(dx, dy);
  // After a rest outside the group, return around the courtyard's sitting
  // walls before resuming the short patrol at the window grilles.
  if (!actor.route.length && patrol && length > .08) {
    const route = walkingRoute(place, actor.position, target);
    return route.length ? advanceActor(place, id, { ...actor, route }, seconds) : { ...actor, moving: false };
  }
  if (length < .003) {
    const route = actor.route.slice(1);
    if (actor.route.length) {
      const next: Actor = { ...actor, position: target, route, departing: actor.departing === target ? undefined : actor.departing, pose: !route.length && actor.pending ? actor.pending : "standing", pending: route.length ? actor.pending : undefined, moving: false };
      return route.length ? advanceActor(place, id, next, seconds) : next;
    }
    return { ...actor, position: target, waypoint: (actor.waypoint + 1) % patrol!.length, wait: id === "jason" || id === "luca" ? 3.5 : 1.6, moving: false };
  }
  // Final steps onto a seat are allowed to cross its furniture footprint.
  const usingSeat = actor.departing === target || actor.route.length === 1 && !!actor.pending;
  const speed = id === "felice" ? 1 : id === "jason" || id === "luca" ? .35 : .45;
  const delta = Math.min(seconds, length / (.19 * speed));
  const position = movementStep(actor.position, { x: dx / length, y: dy / length }, delta * speed, (x, y) => usingSeat || canWalk(place, x, y));
  const distance = actor.distance + Math.hypot(position.x - actor.position.x, position.y - actor.position.y);
  return { ...actor, position, distance, frame: walkingFrame(distance), moving: distance > actor.distance, direction: Math.abs(dx) > Math.abs(dy) ? dx > 0 ? "right" : "left" : dy > 0 ? "front" : "back" };
}
