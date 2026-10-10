import type { Point } from "./story";

export const WORLD_ZOOM = 1;
export type Camera = Point & { zoom: number };
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

// Translation is measured in unscaled viewport units. Bounds never expose the backdrop.
export function cameraFor(player: Point, zoom = WORLD_ZOOM): Camera {
  const scale = Math.max(1, Number.isFinite(zoom) ? zoom : WORLD_ZOOM);
  const limit = (scale - 1) / 2;
  return { x: clamp((.5 - player.x) * scale, -limit, limit), y: clamp((.5 - player.y) * scale, -limit, limit), zoom: scale };
}

export function projectPoint(point: Point, camera: Camera): Point {
  return { x: .5 + (point.x - .5) * camera.zoom + camera.x, y: .5 + (point.y - .5) * camera.zoom + camera.y };
}

export function offscreenGuide(point: Point, camera: Camera) {
  const projected = projectPoint(point, camera);
  const margin = .09;
  if (projected.x >= margin && projected.x <= 1 - margin && projected.y >= margin && projected.y <= 1 - margin) return null;
  const dx = projected.x - .5, dy = projected.y - .5;
  const ratio = (.5 - margin) / Math.max(Math.abs(dx), Math.abs(dy), .001);
  return { x: .5 + dx * ratio, y: .5 + dy * ratio, angle: Math.atan2(dy, dx) * 180 / Math.PI };
}
