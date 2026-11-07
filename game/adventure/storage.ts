// Local save slots of the adventure. Pure functions over a Storage-like object,
// so the browser (localStorage) and the tests (an in-memory map) share one code path.
import { ADVENTURE_BACKUP_KEY, ADVENTURE_DAMAGED_KEY, ADVENTURE_KEY, newAdventure, type AdventureSave } from "./core.ts";
import { parseAdventure, serializeAdventure } from "./engine.ts";

export type SaveStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export type LoadState = "new" | "ok" | "migrated" | "damaged" | "unavailable";
export type LoadResult = {
  save: AdventureSave; state: LoadState;
  /** For a damaged main save: the last readable checkpoint, if any. */
  recovered: AdventureSave | null;
  /** Whether a save (main or checkpoint) exists at all. */
  exists: boolean;
};

const tryParse = (raw: string | null) => { try { return raw ? parseAdventure(raw) : null; } catch { return null; } };

export function loadAdventure(storage: SaveStorage | null): LoadResult {
  if (!storage) return { save: newAdventure(), state: "unavailable", recovered: null, exists: false };
  let raw: string | null, backup: string | null;
  try { raw = storage.getItem(ADVENTURE_KEY); backup = storage.getItem(ADVENTURE_BACKUP_KEY); }
  catch { return { save: newAdventure(), state: "unavailable", recovered: null, exists: false }; }
  if (!raw) {
    // Main slot missing but a checkpoint survived (e.g. an interrupted first write): continue from it.
    const checkpoint = tryParse(backup);
    return checkpoint ? { save: checkpoint, state: "ok", recovered: null, exists: true } : { save: newAdventure(), state: "new", recovered: null, exists: false };
  }
  try {
    const save = parseAdventure(raw);
    const version = (() => { try { return JSON.parse(raw).version; } catch { return null; } })();
    return { save, state: version === 1 ? "migrated" : "ok", recovered: null, exists: true };
  } catch {
    const recovered = tryParse(backup);
    return { save: recovered ?? newAdventure(), state: "damaged", recovered, exists: true };
  }
}

export type WriteResult = { ok: true; savedAt: string } | { ok: false; error: string };
/** Writes the main slot; `checkpoint` also refreshes the fallback slot (after puzzles, chapters and manual saves). */
export function writeAdventure(storage: SaveStorage | null, save: AdventureSave, { checkpoint = false, now = new Date().toISOString() } = {}): WriteResult {
  if (!storage) return { ok: false, error: "Dieser Browser erlaubt kein lokales Speichern." };
  const text = serializeAdventure(save, now);
  try {
    storage.setItem(ADVENTURE_KEY, text);
    if (checkpoint) storage.setItem(ADVENTURE_BACKUP_KEY, text);
    return { ok: true, savedAt: now };
  } catch (error) {
    const full = error instanceof DOMException && (error.name === "QuotaExceededError" || error.code === 22);
    return { ok: false, error: full ? "Der lokale Speicher dieses Browsers ist voll. Der Fortschritt bleibt nur bis zum Schließen erhalten." : "Lokales Speichern ist gerade nicht möglich (z. B. privates Fenster oder gesperrte Websitedaten). Der Fortschritt bleibt nur bis zum Schließen erhalten." };
  }
}

/** Keeps an unreadable save under a separate key before it is replaced, so nothing is silently destroyed. */
export function setAsideDamaged(storage: SaveStorage | null) {
  if (!storage) return;
  try { const raw = storage.getItem(ADVENTURE_KEY); if (raw) storage.setItem(ADVENTURE_DAMAGED_KEY, raw); } catch { /* best effort */ }
}

export function browserStorage(): SaveStorage | null {
  // Accessing localStorage throws when site data is blocked; write failures are reported by writeAdventure.
  try { const storage = window.localStorage; storage.getItem(ADVENTURE_KEY); return storage; }
  catch { return null; }
}
