import { STORY_KEY, parseStory } from "./story.ts";
import { TIMELINE_KEY, parseTimeline } from "./timeline.ts";
import { DAY_KEY, parseDay } from "./day.ts";
import { NAMES_KEY, parseNames } from "./names.ts";
import { AUDIO_KEY, parseMuted } from "./audio.ts";
import { PROGRESS_KEY, readProgress } from "./memories/progress.ts";
import { UI_KEY, parseUi } from "./ui-prefs.ts";

export const SAVE_FORMAT = "felice-elias-save";
export const SAVE_VERSION = 1;
const MAX_BYTES = 1_000_000;

type Reader = Pick<Storage, "getItem">;
type Writer = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export type SaveFile = { format: typeof SAVE_FORMAT; version: typeof SAVE_VERSION; exportedAt: string; data: Record<string, string> };
export type SaveSummary = { gameDate: string | null; memories: number; names: number };

// Every key the game persists. Each value is validated with the parser that the game itself uses on load.
const VALIDATORS: Record<string, (raw: string) => void> = {
  [STORY_KEY]: raw => { parseStory(raw); },
  [TIMELINE_KEY]: raw => { parseTimeline(raw); },
  [DAY_KEY]: raw => { parseDay(raw); },
  [NAMES_KEY]: raw => { parseNames(raw); },
  [AUDIO_KEY]: raw => { JSON.parse(raw); parseMuted(raw); },
  [PROGRESS_KEY]: raw => { readProgress({ getItem: () => raw, setItem: () => undefined }); },
  [UI_KEY]: raw => { parseUi(raw); },
};
export const SAVE_KEYS = Object.keys(VALIDATORS);

export function exportSave(storage: Reader, now = new Date().toISOString()): SaveFile {
  const data: Record<string, string> = {};
  for (const key of SAVE_KEYS) {
    const raw = storage.getItem(key);
    if (raw === null) continue;
    VALIDATORS[key](raw); // never export something the game itself could not load
    data[key] = raw;
  }
  return { format: SAVE_FORMAT, version: SAVE_VERSION, exportedAt: now, data };
}

export function parseSaveFile(raw: string): SaveFile {
  if (raw.length > MAX_BYTES) throw new Error("Die Datei ist zu groß für einen Spielstand.");
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error("Die Datei ist kein gültiger Spielstand."); }
  const file = value as Partial<SaveFile> | null;
  if (!file || typeof file !== "object" || file.format !== SAVE_FORMAT) throw new Error("Das ist keine Spielstand-Datei von Felice × Elias.");
  if (file.version !== SAVE_VERSION) throw new Error("Diese Spielstand-Datei stammt aus einer anderen Version.");
  if (typeof file.exportedAt !== "string" || !file.data || typeof file.data !== "object" || Array.isArray(file.data)) throw new Error("Die Spielstand-Datei ist beschädigt.");
  const data: Record<string, string> = {};
  for (const [key, text] of Object.entries(file.data)) {
    if (!(key in VALIDATORS)) throw new Error("Die Spielstand-Datei enthält unbekannte Daten.");
    if (typeof text !== "string") throw new Error("Die Spielstand-Datei ist beschädigt.");
    try { VALIDATORS[key](text); } catch { throw new Error("Die Spielstand-Datei enthält beschädigte Daten."); }
    data[key] = text;
  }
  if (!data[STORY_KEY] && !data[TIMELINE_KEY]) throw new Error("Die Spielstand-Datei enthält keinen Fortschritt.");
  return { format: SAVE_FORMAT, version: SAVE_VERSION, exportedAt: file.exportedAt, data };
}

export function summarize(file: SaveFile): SaveSummary {
  const timeline = file.data[TIMELINE_KEY] ? parseTimeline(file.data[TIMELINE_KEY]) : null;
  return {
    gameDate: timeline?.clock.date ?? null,
    memories: timeline ? Object.values(timeline.progress).filter(state => state.completedAt).length : 0,
    names: file.data[NAMES_KEY] ? Object.keys(parseNames(file.data[NAMES_KEY]).names).length : 0,
  };
}

// Validation happens in parseSaveFile, before this is called. If a write still fails, the previous values are restored.
export function importSave(storage: Writer, file: SaveFile) {
  const previous = SAVE_KEYS.map(key => [key, storage.getItem(key)] as const);
  try {
    for (const key of SAVE_KEYS) {
      if (key in file.data) storage.setItem(key, file.data[key]); else storage.removeItem(key);
    }
  } catch (error) {
    for (const [key, value] of previous) { try { if (value === null) storage.removeItem(key); else storage.setItem(key, value); } catch { /* best effort */ } }
    throw error;
  }
}
