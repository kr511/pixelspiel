export const PROGRESS_KEY = "felice-elias.memories.v1";
export type MemoryCompletion = { completedAt: string; bestScore: number; visits: number };
export type MemoryProgress = Record<string, MemoryCompletion>;
type StoragePort = Pick<Storage, "getItem" | "setItem">;

export function readProgress(storage: StoragePort): MemoryProgress {
  const raw = storage.getItem(PROGRESS_KEY);
  if (!raw) return {};
  const saved: unknown = JSON.parse(raw);
  if (!saved || typeof saved !== "object" || !("version" in saved) || saved.version !== 1 || !("memories" in saved) || !saved.memories || typeof saved.memories !== "object" || Array.isArray(saved.memories)) {
    throw new Error("Unbekannter Spielstand");
  }
  const progress: MemoryProgress = {};
  for (const [id, value] of Object.entries(saved.memories)) {
    if (!/^[a-z0-9-]+$/.test(id) || !value || typeof value !== "object" ||
      typeof value.completedAt !== "string" || !Number.isFinite(Date.parse(value.completedAt)) ||
      !Number.isFinite(value.bestScore) || value.bestScore < 0 ||
      !Number.isInteger(value.visits) || value.visits < 1) throw new Error("Beschädigter Spielstand");
    progress[id] = { completedAt: value.completedAt, bestScore: value.bestScore, visits: value.visits };
  }
  return progress;
}

export function completeProgress(progress: MemoryProgress, id: string, score: number, now = new Date().toISOString()): MemoryProgress {
  const previous = progress[id];
  return {
    ...progress,
    [id]: { completedAt: previous?.completedAt ?? now, bestScore: Math.max(previous?.bestScore ?? 0, score), visits: (previous?.visits ?? 0) + 1 },
  };
}

export function writeProgress(storage: StoragePort, progress: MemoryProgress) {
  storage.setItem(PROGRESS_KEY, JSON.stringify({ version: 1, memories: progress }));
}
