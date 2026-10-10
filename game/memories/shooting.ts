export const SHOT_COUNT = 9;
export const RANGE_WIDTH = 900;
export const RANGE_HEIGHT = 600;
export const TARGET_RADIUS = 48;
export const TARGETS = [
  { id: 1, x: 254, y: 258, lane: "15" },
  { id: 2, x: 450, y: 258, lane: "16" },
  { id: 3, x: 646, y: 258, lane: "17" },
] as const;
export type Aim = { x: number; y: number };
export type Shot = Aim & { points: number; targetId: number | null };

export function scoreShot(aim: Aim, activeTarget: number): Shot {
  const target = TARGETS[activeTarget];
  if (!target || !Number.isFinite(aim.x) || !Number.isFinite(aim.y)) return { ...aim, points: 0, targetId: null };
  const distance = Math.hypot(aim.x - target.x, aim.y - target.y);
  const points = distance > TARGET_RADIUS ? 0 : Math.max(1, 10 - Math.floor(distance / (TARGET_RADIUS / 10)));
  return { ...aim, points, targetId: points > 0 ? target.id : null };
}

export function recordShot(shots: readonly Shot[], aim: Aim): Shot[] {
  if (shots.length >= SHOT_COUNT) return [...shots];
  return [...shots, scoreShot(aim, Math.floor(shots.length / 3))];
}
