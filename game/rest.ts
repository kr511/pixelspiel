import { advanceActor, requestPose, standingActor, type Pose, type Actor } from "./actors.ts";
import type { RestSpot } from "./day.ts";
import type { Place, Point } from "./story.ts";

export type RestMotion = { actor: Actor; phase: "entering" | "resting" | "leaving"; pose: Pose };
export function restPose(spot: RestSpot): Pose { return spot.kind === "bed" ? "lying" : "sitting"; }

export function beginRest(place: Place, from: Point, spot: RestSpot): RestMotion {
  // Reach the bed's foot first. The painted lying state takes over from there.
  const position = spot.kind === "bed" ? { x: spot.position.x, y: .45 } : spot.position;
  const pose = restPose(spot);
  const actor = requestPose(place, standingActor(from), pose, { spot, position, id: `${spot.id}:0` });
  return { actor, phase: "entering", pose };
}
export function leaveRest(place: Place, motion: RestMotion): RestMotion {
  return { ...motion, actor: requestPose(place, motion.actor, "standing"), phase: "leaving" };
}
export function advanceRest(place: Place, id: string, motion: RestMotion, seconds: number): RestMotion {
  const actor = advanceActor(place, id, motion.actor, seconds);
  const phase = motion.phase === "entering" && actor.pose === motion.pose && !actor.route.length ? "resting" : motion.phase;
  if (actor === motion.actor && phase === motion.phase) return motion;
  return { ...motion, actor, phase };
}
export function restPosition(spot: RestSpot, motion: RestMotion): Point {
  return spot.kind === "bed" && motion.phase === "resting" ? spot.position : motion.actor.position;
}
export function hasLeft(motion: RestMotion): boolean { return motion.phase === "leaving" && !motion.actor.route.length; }
