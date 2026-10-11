import { useEffect, useState } from "react";
import { assetUrl } from "./assets";
import type { Season } from "./day";
import { preloadPlan } from "./preload-plan.ts";
import type { Place } from "./story";

// Kept alive so the browser does not drop the decoded bitmaps again.
const loaded = new Map<string, HTMLImageElement>();

function loadImage(source: string): Promise<void> {
  const url = assetUrl(source);
  if (loaded.has(url)) return Promise.resolve();
  return new Promise(resolve => {
    const image = new Image();
    image.decoding = "async";
    // A missing file must never block the game: the scenes have their own fallbacks.
    image.onerror = () => resolve();
    image.onload = () => { loaded.set(url, image); (image.decode?.() ?? Promise.resolve()).catch(() => undefined).then(() => resolve()); };
    image.src = url;
  });
}

/** Runs `task` over `items` with at most `limit` in flight; `onStep` fires after each finished item. */
async function pool<T>(items: T[], limit: number, task: (item: T) => Promise<void>, onStep: () => void) {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) { const item = items[next++]; await task(item); onStep(); }
  }));
}

export type PreloadState = { progress: number; ready: boolean; complete: boolean };

/**
 * Loads the first scene before the start button unlocks (`ready`), then pulls in every other
 * scene and sprite sheet in the background (`complete`). A timeout keeps a slow or broken
 * connection from locking the player out.
 */
export function usePreload(place: Place, season: Season, enabled = true, timeoutMs = 20000): PreloadState {
  const [state, setState] = useState<PreloadState>({ progress: 0, ready: false, complete: false });
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const plan = preloadPlan(place, season);
    let done = 0;
    const total = plan.critical.length;
    const update = (patch: Partial<PreloadState>) => { if (!cancelled) setState(previous => ({ ...previous, ...patch })); };
    const timer = window.setTimeout(() => update({ ready: true }), timeoutMs);
    void (async () => {
      await pool(plan.critical, 6, loadImage, () => { done += 1; update({ progress: done / total }); });
      window.clearTimeout(timer);
      update({ progress: 1, ready: true });
      // Rest only with two connections so it cannot starve the game's own requests.
      await pool(plan.rest, 2, loadImage, () => undefined);
      await pool(plan.media, 1, source => fetch(assetUrl(source)).then(response => response.arrayBuffer()).then(() => undefined, () => undefined), () => undefined);
      update({ complete: true });
    })();
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [place, season, enabled, timeoutMs]);
  return state;
}
