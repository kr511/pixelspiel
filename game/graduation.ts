export const PHOTO_DURATION = 10000;
export const SNAPSHOT_CAPTIONS = ["Geschafft. Wir beide.", "Sommer 2026.", "Das bleibt."] as const;
export function photoFrame(elapsed: number) {
  const time = Math.max(0, elapsed);
  return { index: Math.min(2, Math.floor(Math.max(0,time-800)/3000)), flash: Math.max(0,1-time/1000), complete: time >= PHOTO_DURATION };
}
