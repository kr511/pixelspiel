import type { Point } from "./story";

export const WALK_SPEED = .19;
export const WALK_SEQUENCE = [0, 1, 0, 2] as const;

/** Delta-based movement; small substeps prevent walking through furniture. */
export function movementStep(point: Point, input: Point, seconds: number, allowed: (x: number, y: number) => boolean): Point {
  const length = Math.hypot(input.x, input.y);
  if (length < .05) return point;
  const scale = WALK_SPEED * Math.max(0, Math.min(seconds, .1)) / Math.max(1, length);
  const dx = input.x * scale, dy = input.y * scale;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / .005));
  let { x, y } = point;
  for (let index = 0; index < steps; index++) {
    if (allowed(x + dx / steps, y)) x += dx / steps;
    if (allowed(x, y + dy / steps)) y += dy / steps;
  }
  return { x, y };
}

export function walkingFrame(distance: number) {
  return WALK_SEQUENCE[Math.floor(distance / .027) % WALK_SEQUENCE.length];
}
