// Shared types and pure helpers of "Die verlorenen Erinnerungen".
// Everything here is free of React and browser APIs so tests can run it directly.
import type { Place, Point } from "../story.ts";
import type { Emotion } from "../dialogue.ts";

/** The storage key keeps its historic name so saves written by V1.0 are found and migrated. */
export const ADVENTURE_KEY = "felice-elias.adventure.v1";
/** Last checkpoint (written after every solved puzzle and chapter change); used when the main save is damaged. */
export const ADVENTURE_BACKUP_KEY = "felice-elias.adventure.checkpoint";
/** A damaged save is moved here (never silently deleted) before it is replaced. */
export const ADVENTURE_DAMAGED_KEY = "felice-elias.adventure.damaged";
export const SAVE_VERSION = 2;

export type ChapterId = "prolog" | "radegast" | "schulweg" | "zoerbig" | "weihnachten" | "finale" | "epilog";
export const CHAPTER_IDS: ChapterId[] = ["prolog", "radegast", "schulweg", "zoerbig", "weihnachten", "finale", "epilog"];
export type PuzzleKind = "code" | "pattern" | "combination" | "sequence" | "deduction" | "switch" | "heart";
export type PuzzleStatus = "gesperrt" | "verfügbar" | "aktiv" | "gelöst";
export type PuzzleRecord = { status: "aktiv" | "gelöst"; failures: number; hints: number; skipped?: boolean };
export type AdventureSettings = { textSize: "normal" | "large"; effects: "full" | "reduced"; thoughts: boolean };
export type AdventureSave = {
  version: 2;
  /** Stored for the continue screen; on load it is always recomputed from the story flags. */
  chapter: ChapterId;
  place: Place;
  position: Point | null;
  /** Quest items in Felice's bag. They can never be dropped. */
  items: string[];
  /** Items the story has already used up; they are never granted twice. */
  used: string[];
  evidence: string[];
  conclusions: string[];
  flags: string[];
  fragments: string[];
  puzzles: Record<string, PuzzleRecord>;
  settings: AdventureSettings;
  startedAt: string;
  completedAt: string | null;
  savedAt: string | null;
  /** Active play time (paused, hidden and menu time do not count). */
  playSeconds: number;
  chapterSeconds: Partial<Record<ChapterId, number>>;
};

/** `id` marks Felice's own words: the choice is remembered (flag `said-<id>`) and quoted in the ending. */
export type Choice = { label: string; reply?: Line[]; id?: string };
export type Line = { speaker: string; text: string; art?: string; emotion?: Emotion; choices?: Choice[] };
/** What the interface shows after a script: a puzzle, a cutscene, a short shadow glitch or a scene change. */
export type After = { puzzle?: string; cutscene?: "elias-message" | "shadow" | "barrier" | "credits" | "bus"; glitch?: boolean; travel?: Place; minigame?: "targets" };
export type Outcome = { save: AdventureSave; lines: Line[]; after?: After; ok?: boolean };

export const DEFAULT_SETTINGS: AdventureSettings = { textSize: "normal", effects: "full", thoughts: true };

export function newAdventure(now = new Date().toISOString()): AdventureSave {
  return { version: 2, chapter: "prolog", place: "bedroom", position: null, items: [], used: [], evidence: [], conclusions: [], flags: [], fragments: [], puzzles: {}, settings: { ...DEFAULT_SETTINGS }, startedAt: now, completedAt: null, savedAt: null, playSeconds: 0, chapterSeconds: {} };
}

const unique = (list: string[]) => [...new Set(list)];
export const hasFlag = (save: AdventureSave, flag: string) => save.flags.includes(flag);
export const hasItem = (save: AdventureSave, id: string) => save.items.includes(id);
export const everHad = (save: AdventureSave, id: string) => save.items.includes(id) || save.used.includes(id);
export const hasEvidence = (save: AdventureSave, id: string) => save.evidence.includes(id);
export const solved = (save: AdventureSave, id: string) => save.puzzles[id]?.status === "gelöst";
export const addFlag = (save: AdventureSave, ...flags: string[]): AdventureSave => flags.every(flag => save.flags.includes(flag)) ? save : { ...save, flags: unique([...save.flags, ...flags]) };
/** Grants an item once. An item that was already used up is not handed out again. */
export const giveItem = (save: AdventureSave, id: string): AdventureSave => everHad(save, id) ? save : { ...save, items: [...save.items, id] };
/** Moves an item from the bag into the used list (the story consumed it). */
export const consumeItem = (save: AdventureSave, id: string): AdventureSave => !save.items.includes(id) ? save : { ...save, items: save.items.filter(item => item !== id), used: unique([...save.used, id]) };
export const addEvidence = (save: AdventureSave, id: string): AdventureSave => save.evidence.includes(id) ? save : { ...save, evidence: [...save.evidence, id] };
export const addFragment = (save: AdventureSave, id: string): AdventureSave => save.fragments.includes(id) ? save : { ...save, fragments: [...save.fragments, id] };
export function touchPuzzle(save: AdventureSave, id: string): AdventureSave {
  if (save.puzzles[id]) return save;
  return { ...save, puzzles: { ...save.puzzles, [id]: { status: "aktiv", failures: 0, hints: 0 } } };
}
export function failPuzzle(save: AdventureSave, id: string): AdventureSave {
  const prior = touchPuzzle(save, id).puzzles[id];
  if (prior.status === "gelöst") return save;
  return { ...save, puzzles: { ...save.puzzles, [id]: { ...prior, failures: Math.min(999, prior.failures + 1) } } };
}
export function markSolved(save: AdventureSave, id: string, skipped = false): AdventureSave {
  const prior = save.puzzles[id] ?? { status: "aktiv" as const, failures: 0, hints: 0 };
  if (prior.status === "gelöst") return save;
  return { ...save, puzzles: { ...save.puzzles, [id]: { ...prior, status: "gelöst", ...(skipped ? { skipped: true } : {}) } } };
}
/** Adds active play time to the save and to the chapter it was spent in. */
export function addPlayTime(save: AdventureSave, seconds: number, chapter: ChapterId): AdventureSave {
  if (!(seconds > 0) || !Number.isFinite(seconds)) return save;
  const add = Math.min(seconds, 600);
  return { ...save, playSeconds: Math.round((save.playSeconds + add) * 10) / 10, chapterSeconds: { ...save.chapterSeconds, [chapter]: Math.round(((save.chapterSeconds[chapter] ?? 0) + add) * 10) / 10 } };
}
export function formatPlayTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return minutes < 1 ? "unter 1 Min." : minutes < 60 ? `${minutes} Min.` : `${Math.floor(minutes / 60)} Std. ${minutes % 60} Min.`;
}
export const line = (speaker: string, text: string, emotion?: Emotion, extra: Partial<Line> = {}): Line => ({ speaker, text, ...(emotion ? { emotion } : {}), ...extra });
export const felice = (text: string, emotion: Emotion = "thoughtful", extra: Partial<Line> = {}) => line("Felice", text, emotion, { art: "felice", ...extra });
export const shadow = (text: string, extra: Partial<Line> = {}) => line("Der Schatten", text, "neutral", { art: "shadow", ...extra });
export const narrate = (text: string) => line("Erzählung", text, "neutral");
export const elias = (text: string, emotion: Emotion = "love", extra: Partial<Line> = {}) => line("Elias", text, emotion, { art: "elias", ...extra });
