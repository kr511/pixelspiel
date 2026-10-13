import type { Point } from "./story";

export const WALK_SPEED = .19;
export const WALK_SEQUENCE = [0, 1, 0, 2] as const;
// How far Felice may be nudged sideways to slip past a furniture corner instead of snagging on it.
const CORNER_ASSIST = .022;

/** Delta-based movement; small substeps prevent walking through furniture. */
export function movementStep(point: Point, input: Point, seconds: number, allowed: (x: number, y: number) => boolean): Point {
  const length = Math.hypot(input.x, input.y);
  if (length < .05) return point;
  const scale = WALK_SPEED * Math.max(0, Math.min(seconds, .1)) / Math.max(1, length);
  const dx = input.x * scale, dy = input.y * scale;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / .005));
  let { x, y } = point;
  for (let index = 0; index < steps; index++) {
    const sx = dx / steps, sy = dy / steps;
    const movedX = allowed(x + sx, y), movedY = allowed(x, y + sy);
    if (movedX) x += sx;
    if (movedY) y += sy;
    // Walking straight into the edge of an obstacle: slide around the nearer free side.
    if (!movedX && Math.abs(sx) > Math.abs(sy) * 2) y += cornerSlide(Math.abs(sx), offset => allowed(x, y + offset), offset => allowed(x + sx, y + offset));
    else if (!movedY && Math.abs(sy) > Math.abs(sx) * 2) x += cornerSlide(Math.abs(sy), offset => allowed(x + offset, y), offset => allowed(x + offset, y + sy));
  }
  return { x, y };
}

/** Finds the nearest sideways offset from which the blocked step would be free; returns one step towards it. */
function cornerSlide(step: number, stand: (offset: number) => boolean, pass: (offset: number) => boolean) {
  const probes = Array.from({ length: Math.round(CORNER_ASSIST / .002) }, (_, index) => (index + 1) * .002);
  for (let index = 0; index < probes.length; index++) {
    for (const sign of [1, -1]) {
      // Every point on the way sideways must be walkable, so the nudge never crosses a wall.
      if (probes.slice(0, index + 1).every(probe => stand(sign * probe)) && pass(sign * probes[index])) return sign * Math.min(step, probes[index]);
    }
  }
  return 0;
}

/** Eases the stick or keyboard input so starts and stops are soft but still responsive. */
export function easeInput(current: Point, target: Point, seconds: number): Point {
  const targetLength = Math.hypot(target.x, target.y);
  const rate = targetLength < .05 ? 26 : 16;
  const k = 1 - Math.exp(-rate * Math.max(0, Math.min(seconds, .1)));
  const next = { x: current.x + (target.x - current.x) * k, y: current.y + (target.y - current.y) * k };
  return Math.hypot(next.x, next.y) < .03 && targetLength < .05 ? { x: 0, y: 0 } : next;
}

/** Facing changes only when the new axis clearly wins, so diagonal stick input does not flicker. */
export function facing(previous: "front" | "back" | "left" | "right", dx: number, dy: number): "front" | "back" | "left" | "right" {
  const horizontal = previous === "left" || previous === "right";
  const ax = Math.abs(dx), ay = Math.abs(dy);
  const keepHorizontal = horizontal ? ax * 1.3 >= ay : ax > ay * 1.3;
  if (keepHorizontal) return dx > 0 ? "right" : dx < 0 ? "left" : previous;
  return dy > 0 ? "front" : dy < 0 ? "back" : previous;
}

export function walkingFrame(distance: number) {
  return WALK_SEQUENCE[Math.floor(distance / .027) % WALK_SEQUENCE.length];
}
