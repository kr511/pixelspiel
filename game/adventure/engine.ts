// Rules of the adventure: interactions, inventory, investigation, puzzles,
// hints, quests, world gating, atmosphere and the save boundary.
import { canWalk, type Place, type Point } from "../story.ts";
import type { Season } from "../day.ts";
import {
  ADVENTURE_KEY, CHAPTER_IDS, DEFAULT_SETTINGS, SAVE_VERSION, addEvidence, addFlag, elias, felice, hasFlag, hasItem, narrate, newAdventure, solved, touchPuzzle,
  type AdventureSave, type ChapterId, type Outcome, type PuzzleRecord, type PuzzleStatus,
} from "./core.ts";
import {
  ADVENTURE_CHAPTERS, ADVENTURE_ITEMS, BONUS_PAGES, CHAPTER_TASKS, CONCLUSIONS, EVIDENCE, FRAGMENTS, HOTSPOTS, MAIN_PUZZLES, PUZZLES, RECIPES, SIDE_QUESTS,
  applyReward, chapterOf, puzzleById, rememberWords, solvePuzzleInWorld, type Hotspot, type PuzzleDef, type Requirement,
} from "./content.ts";

export { ADVENTURE_KEY, chapterOf, newAdventure };

const PLACE_IDS: Place[] = ["bedroom", "home", "kitchen", "garden", "radegast", "bus", "zoerbig", "schoolway", "school", "gym", "goelzau", "range", "playground", "christmasmarket", "eliasroom", "hotel", "hotelboys", "parliament", "europapark", "archive"];
const CHAPTER_ORDER = CHAPTER_IDS;
export const chapterDef = (save: AdventureSave) => ADVENTURE_CHAPTERS.find(chapter => chapter.id === chapterOf(save))!;

/* ------------------------------------------------------------ Hotspots */

export const hotspotsAt = (save: AdventureSave, place: Place): Hotspot[] => HOTSPOTS.filter(spot => spot.place === place && spot.visible(save));
export const hotspotById = (id: string) => HOTSPOTS.find(spot => spot.id === id);

export function interact(save: AdventureSave, id: string): Outcome {
  const spot = hotspotById(id);
  if (!spot || !spot.visible(save)) return { save, lines: [] };
  return spot.interact(save);
}

/** Entering a place can advance the story (arrivals) and shows a short thought. */
export function enterPlace(save: AdventureSave, place: Place): Outcome {
  let next: AdventureSave = { ...save, place, position: null };
  const chapter = chapterOf(next);
  const lines = [];
  if (chapter === "radegast" && place === "radegast" && !hasFlag(next, "arrived-radegast")) {
    next = addFlag(next, "arrived-radegast");
    lines.push(narrate("Radegast ist grau und still. Wo sonst Farben sind, liegt ein feiner Schleier."), felice("Hier haben wir uns getroffen. Ich weiß es … aber die Erinnerung ist voller Löcher. Vielleicht wissen die Leute hier mehr."));
  }
  if (chapter === "schulweg" && place === "bus" && !hasFlag(next, "arrived-bus")) {
    next = addFlag(next, "arrived-bus");
    lines.push(narrate("Die Haltestelle. Der Fahrplan flimmert, die Buchstaben springen hin und her. Kein Bus ist zu sehen."), felice("Unser Schulweg … Der Schatten hat ihn durcheinandergebracht. Am Wartehäuschen hängt etwas, und der Busfahrer steht auch da."));
  }
  if (chapter === "schulweg" && place === "school" && !hasFlag(next, "arrived-school")) {
    next = addFlag(next, "arrived-school");
    lines.push(narrate("Der Schattenbus hält direkt am Pausenhof und löst sich hinter dir in Nebel auf. Elena, Jason, Luca und Wyatt stehen an den Fenstergittern."), felice("Elena winkt – und sie hält ein Heft in der Hand. Das ist doch Elias' Heft!"));
  }
  if (chapter === "zoerbig" && place === "gym" && !hasFlag(next, "arrived-gym")) {
    next = addFlag(next, "arrived-gym");
    lines.push(narrate("Die kleine Turnhalle ist dunkel und viel größer als sonst. Hinter dir fällt die Tür ins Schloss. Ein Trainingsraum aus Schatten: Schalter, Lampen, Zielscheiben – und eine verschlossene Tür."), felice("Eingesperrt. Konzentrier dich, Felice. Eins nach dem anderen."));
  }
  if (chapter === "weihnachten" && place === "home" && !hasFlag(next, "arrived-xmas")) {
    next = addFlag(next, "arrived-xmas");
    lines.push(narrate("Das Wohnzimmer glitzert vor Frost. Lichterketten hängen still in der Luft, sechs Menschen stehen mitten in der Bewegung erstarrt."), felice("Weihnachten … der 25.12. Unser erstes Weihnachten. Es ist eingefroren."));
  }
  if (chapter === "finale" && place === "archive" && !hasFlag(next, "arrived-archive")) {
    next = addFlag(next, "arrived-archive");
    lines.push(narrate("Ein endloser Raum aus Regalen voller Erinnerungen. Ganz hinten, hinter einer flimmernden Barriere: Elias."), elias("Felice?!", "surprised"), felice("Elias! Halt durch. Ich hole dich da raus.", "neutral"));
  }
  return { save: next, lines };
}

/** Using a bag item, either on a nearby hotspot or on nothing in particular. */
export function applyItem(save: AdventureSave, itemId: string, hotspotId?: string): Outcome {
  if (!hasItem(save, itemId)) return { save, lines: [] };
  const spot = hotspotId ? hotspotById(hotspotId) : undefined;
  const handler = spot && spot.visible(save) ? spot.accepts?.[itemId] : undefined;
  if (handler) return handler(save);
  const item = ADVENTURE_ITEMS[itemId];
  return { save, ok: false, lines: [felice(spot ? `${item?.name ?? "Das"} hilft mir bei „${spot.name}“ nicht weiter.` : `Hier kann ich ${item?.name ?? "das"} nicht benutzen. Ich sollte näher an etwas Passendes herangehen.`)] };
}

export const canCombineItems = () => RECIPES.length > 0;
export function combineItems(save: AdventureSave, a: string, b: string): Outcome {
  if (!hasItem(save, a) || !hasItem(save, b) || a === b) return { save, lines: [] };
  const recipe = RECIPES.find(entry => entry.items.includes(a) && entry.items.includes(b));
  if (!recipe) return { save, ok: false, lines: [felice("Diese beiden Dinge passen nicht zusammen.")] };
  if (recipe.puzzle) {
    const outcome = solvePuzzleInWorld(save, recipe.puzzle);
    return { ...outcome, lines: [narrate(recipe.text), ...outcome.lines] };
  }
  return { save: applyReward(save, { consume: [...recipe.items], items: [recipe.result] }), ok: true, lines: [narrate(recipe.text)] };
}

/** The training mini-game in the escape room always ends in success; it only reveals the hit counts. */
export function finishMinigame(save: AdventureSave, name: "targets"): Outcome {
  if (name !== "targets" || save.evidence.includes("ev-targets")) return { save, lines: [] };
  return {
    save: addEvidence(addFlag(save, "targets-trained"), "ev-targets"), ok: true,
    lines: [narrate("Geschafft! Auf der Anzeigetafel stehen die Treffer: Stern 2 · Mond 3 · Herz 5."), felice("Von der schwächsten zur besten Scheibe … Das ist die Reihenfolge fürs Schloss!", "happy"), narrate("Neuer Hinweis in der Akte: „Drei Zielscheiben“.")],
  };
}
/** Felice's chosen answer in a dialogue (kept for „Deine Worte“ in the ending). */
export const chooseWords = (save: AdventureSave, id: string | undefined) => id ? rememberWords(save, id) : save;

export function combineEvidence(save: AdventureSave, a: string, b: string): Outcome {
  if (a === b || !save.evidence.includes(a) || !save.evidence.includes(b)) return { save, lines: [] };
  const conclusion = CONCLUSIONS.find(entry => entry.from.includes(a) && entry.from.includes(b));
  if (!conclusion) return { save, ok: false, lines: [felice("Diese beiden Hinweise ergeben zusammen noch kein Bild.")] };
  if (save.conclusions.includes(conclusion.id)) return { save, ok: true, lines: [felice(`Das habe ich schon herausgefunden: ${conclusion.title}.`)] };
  return { save: { ...save, conclusions: [...save.conclusions, conclusion.id] }, ok: true, lines: [narrate(`Schlussfolgerung: ${conclusion.title}`), felice(conclusion.text, "thoughtful")] };
}

/* -------------------------------------------------------------- Rätsel */

export function requirementsMet(save: AdventureSave, requirement: Requirement) {
  return (requirement.flags ?? []).every(flag => hasFlag(save, flag))
    && (requirement.items ?? []).every(item => hasItem(save, item))
    && (requirement.evidence ?? []).every(id => save.evidence.includes(id))
    && (requirement.conclusions ?? []).every(id => save.conclusions.includes(id))
    && (requirement.puzzles ?? []).every(id => solved(save, id))
    && (requirement.fragments ?? []).every(id => save.fragments.includes(id));
}
export function puzzleStatus(save: AdventureSave, id: string): PuzzleStatus {
  const puzzle = puzzleById(id);
  if (!puzzle) return "gesperrt";
  if (solved(save, id)) return "gelöst";
  const chapter = CHAPTER_ORDER.indexOf(chapterOf(save)), own = CHAPTER_ORDER.indexOf(puzzle.chapter);
  if (own > chapter || !requirementsMet(save, puzzle.requires)) return "gesperrt";
  return save.puzzles[id] ? "aktiv" : "verfügbar";
}
export function openPuzzleRecord(save: AdventureSave, id: string) { return puzzleStatus(save, id) === "gesperrt" ? save : touchPuzzle(save, id); }

export type SubmitResult = Outcome & { feedback: string };
export function submitPuzzle(save: AdventureSave, id: string, answer: unknown): SubmitResult {
  const puzzle = puzzleById(id);
  const status = puzzleStatus(save, id);
  if (!puzzle || status === "gesperrt") return { save, lines: [], ok: false, feedback: "Dieses Rätsel ist noch verschlossen." };
  if (status === "gelöst") return { save, lines: [], ok: true, feedback: "Bereits gelöst." };
  const result = puzzle.check(answer);
  if (!result.ok) {
    const prior = touchPuzzle(save, id).puzzles[id];
    return { save: { ...save, puzzles: { ...save.puzzles, [id]: { ...prior, failures: Math.min(999, prior.failures + 1) } } }, lines: [], ok: false, feedback: result.feedback };
  }
  const outcome = solvePuzzleInWorld(touchPuzzle(save, id), id);
  return { ...outcome, feedback: result.feedback };
}
export const HINT_LEVELS = 3;
export function revealHint(save: AdventureSave, id: string): AdventureSave {
  const puzzle = puzzleById(id);
  if (!puzzle || puzzleStatus(save, id) === "gelöst") return save;
  const record: PuzzleRecord = save.puzzles[id] ?? { status: "aktiv", failures: 0, hints: 0 };
  return { ...save, puzzles: { ...save.puzzles, [id]: { ...record, hints: Math.min(HINT_LEVELS, record.hints + 1) } } };
}
export const hintsShown = (save: AdventureSave, id: string) => puzzleById(id)?.hints.slice(0, save.puzzles[id]?.hints ?? 0) ?? [];
/** Skipping is offered after repeated failures or once every hint was read and one more try failed. */
export function canSkip(save: AdventureSave, id: string) {
  const puzzle = puzzleById(id), record = save.puzzles[id];
  if (!puzzle || !record || puzzleStatus(save, id) === "gelöst" || puzzleStatus(save, id) === "gesperrt") return false;
  return record.failures >= puzzle.skipAfter || record.hints >= HINT_LEVELS && record.failures >= 1;
}
export function skipPuzzle(save: AdventureSave, id: string): Outcome {
  if (!canSkip(save, id)) return { save, lines: [] };
  const outcome = solvePuzzleInWorld(save, id, true);
  return { ...outcome, lines: [narrate("Felice atmet durch und findet die Lösung trotzdem. (Rätsel übersprungen)"), ...outcome.lines] };
}
/**
 * The puzzle the hint button talks about: the first unsolved, unlocked puzzle of
 * the current chapter. If none is open yet, the next locked one explains what is missing.
 */
export function hintPuzzle(save: AdventureSave): PuzzleDef | undefined {
  const chapter = chapterOf(save);
  const own = PUZZLES.filter(puzzle => puzzle.chapter === chapter && !solved(save, puzzle.id));
  return own.find(puzzle => puzzleStatus(save, puzzle.id) !== "gesperrt") ?? own[0];
}
/** Progress over the six main puzzles (a main puzzle counts once all of its stages are solved). */
export function mainProgress(save: AdventureSave) {
  return MAIN_PUZZLES.map(main => ({ ...main, solved: main.parts.every(id => solved(save, id)), stages: main.parts.filter(id => solved(save, id)).length }));
}

/* ------------------------------------------------------------- Aufgaben */

export type Objective = { chapter: ChapterId; title: string; text: string; place?: Place; target?: string };
export function objective(save: AdventureSave): Objective {
  const chapter = chapterOf(save), def = chapterDef(save);
  if (chapter === "epilog") return { chapter, title: def.title, text: "Elias ist frei. Erlebe eure Erinnerungen im Album erneut oder spiele das Abenteuer noch einmal." };
  const task = CHAPTER_TASKS[chapter].find(entry => !entry.done(save));
  if (chapter === "weihnachten" && !task) return { chapter, title: def.title, text: "Geh in dein Zimmer: Dort hat sich der Weg ins Erinnerungsarchiv geöffnet.", place: "bedroom" };
  if (chapter === "finale" && !hasFlag(save, "arrived-archive") && save.place !== "archive") return { chapter, title: def.title, text: "Geh in dein Zimmer und tritt durch den Riss aus Licht ins Erinnerungsarchiv.", place: "archive" };
  if (chapter === "schulweg" && task?.id === "t-s-clues" && save.place !== "bus") return { chapter, title: def.title, text: "Geh zur Bushaltestelle: Dort beginnt euer Schulweg.", place: "bus" };
  return { chapter, title: def.title, text: task?.label ?? def.intro, place: task?.place, target: task?.target };
}
export function questLog(save: AdventureSave) {
  const current = CHAPTER_ORDER.indexOf(chapterOf(save));
  return {
    main: { title: "Rette Elias", text: "Der Schatten hält Elias im Erinnerungsarchiv gefangen. Hol die vier Erinnerungsfragmente zurück und löse die sechs Haupt-Rätsel.", fragments: save.fragments.filter(id => FRAGMENTS.some(fragment => fragment.id === id)).length, puzzles: mainProgress(save).filter(entry => entry.solved).length },
    chapters: ADVENTURE_CHAPTERS.filter(chapter => chapter.id !== "epilog").map(chapter => ({
      ...chapter, state: CHAPTER_ORDER.indexOf(chapter.id) < current ? "abgeschlossen" as const : CHAPTER_ORDER.indexOf(chapter.id) === current ? "aktiv" as const : "gesperrt" as const,
      tasks: CHAPTER_ORDER.indexOf(chapter.id) <= current ? CHAPTER_TASKS[chapter.id].map(task => ({ id: task.id, label: task.label, done: task.done(save) })) : [],
      seconds: save.chapterSeconds[chapter.id] ?? 0,
    })),
    side: SIDE_QUESTS.map(quest => { const [have, total] = quest.progress(save); return { id: quest.id, title: quest.title, text: quest.text, have, total, done: have >= total }; }),
  };
}
export function album(save: AdventureSave) {
  return [...FRAGMENTS, ...BONUS_PAGES].map(fragment => ({ ...fragment, unlocked: save.fragments.includes(fragment.id) }));
}
export function caseFile(save: AdventureSave) {
  return {
    evidence: EVIDENCE.filter(entry => save.evidence.includes(entry.id)),
    conclusions: CONCLUSIONS.filter(entry => save.conclusions.includes(entry.id)),
    open: CONCLUSIONS.filter(entry => !save.conclusions.includes(entry.id) && entry.chapter === chapterOf(save)).length,
  };
}

/* ----------------------------------------------------------- Welt-Regeln */

export type ExitGate = { visible: boolean; open: boolean; reason?: string };
export function exitGate(save: AdventureSave, from: Place, to: Place): ExitGate {
  const chapter = chapterOf(save), index = CHAPTER_ORDER.indexOf(chapter);
  if (to === "archive") return chapter === "finale" ? { visible: true, open: true } : { visible: false, open: false };
  if (from === "archive") return { visible: true, open: true };
  if (chapter === "prolog" && (from === "home" && to === "radegast" || from === "garden" && to === "radegast")) return { visible: true, open: false, reason: from === "home" ? "Die Haustür ist von einem Siegel aus Schatten verschlossen. Ich muss es direkt an der Tür öffnen." : "Das Gartentor ist von einem dunklen Schleier verschlossen. Der Weg nach draußen führt durch die Haustür." };
  if (to === "goelzau" || to === "christmasmarket" || to === "eliasroom" || to === "schoolway") return { visible: true, open: false, reason: "Dichter Nebel liegt über diesem Weg. Er gehört zu einer Erinnerung, die der Schatten nicht berührt hat." };
  if (from === "bus" && to === "zoerbig" && !hasFlag(save, "bus-boarded")) return { visible: true, open: false, reason: index < CHAPTER_ORDER.indexOf("schulweg") ? "Kein Bus fährt. Der Fahrplan ist ein einziges Durcheinander – darum kümmere ich mich, wenn ich in Radegast fertig bin." : solved(save, "p-timetable") ? "Der Schattenbus wartet. Der Fahrer will eine Fahrkarte sehen." : "Kein Bus fährt. Der Fahrplan ist manipuliert." };
  if (from === "school" && to === "gym" && index < CHAPTER_ORDER.indexOf("zoerbig")) return { visible: true, open: false, reason: "Die Turnhalle ist dunkel und verschlossen. Noch nicht." };
  if (from === "gym" && to === "school" && chapter === "zoerbig" && hasFlag(save, "arrived-gym")) return { visible: true, open: false, reason: "Die Tür ist hinter mir ins Schloss gefallen. Der einzige Ausgang ist die Tür mit dem Symbolschloss." };
  return { visible: true, open: true };
}
/** Extra collisions of the adventure: the barrier in the archive. */
export function walkBlocked(save: AdventureSave, place: Place, _x: number, y: number) {
  return place === "archive" && !hasFlag(save, "barrier-down") && y < .45;
}
export type Ambience = { season: Season; minute: number; winter: boolean; shadow: number; mood: "world" | "evening" | "love" | "shadow" };
export function ambience(save: AdventureSave, place: Place): Ambience {
  const chapter = chapterOf(save);
  const shadow = place === "archive" ? hasFlag(save, "barrier-down") ? .1 : .55 : { prolog: .32, radegast: .3, schulweg: .24, zoerbig: .36, weihnachten: .2, finale: .15, epilog: 0 }[chapter];
  const winter = chapter === "weihnachten" || chapter === "finale" || chapter === "epilog";
  return {
    season: winter ? "Winter" : "Herbst",
    minute: { prolog: 1095, radegast: 930, schulweg: 450, zoerbig: 840, weihnachten: 1110, finale: 1180, epilog: 600 }[chapter],
    winter, shadow,
    mood: hasFlag(save, "barrier-down") || chapter === "epilog" ? "love" : place === "archive" || chapter === "zoerbig" && hasFlag(save, "lamps-lit") && !hasFlag(save, "shadow-met") ? "shadow" : chapter === "weihnachten" ? "evening" : "world",
  };
}
export function thought(save: AdventureSave): { key: string; text: string } {
  const goal = objective(save);
  return { key: `${goal.chapter}:${goal.text}`, text: goal.text };
}
export function finishAdventure(save: AdventureSave, now = new Date().toISOString()): AdventureSave {
  return save.completedAt ? save : { ...addFlag(save, "completed"), completedAt: now };
}

/* ----------------------------------------------------------- Speicherstand */

const ID = /^[a-z0-9-]{1,48}$/;
const KNOWN_PUZZLES = new Set(PUZZLES.map(puzzle => puzzle.id));
const idList = (value: unknown, label: string, max = 96) => {
  if (!Array.isArray(value) || value.length > max || !value.every(entry => typeof entry === "string" && ID.test(entry))) throw new Error(label);
  return [...new Set(value as string[])];
};
const isoOr = (value: unknown, fallback: string | null) => typeof value === "string" && Number.isFinite(Date.parse(value)) ? value : fallback;
const seconds = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.min(value, 360000) : 0;
/**
 * Strict boundary: unknown versions and broken data are rejected (the caller keeps them
 * untouched). Version-1 saves (12-puzzle edition) are migrated. Valid saves are repaired
 * so solved puzzles always carry their rewards – an interrupted write can never leave the story stuck.
 */
export function parseAdventure(raw: string | null): AdventureSave {
  if (!raw) return newAdventure();
  const value = JSON.parse(raw);
  if (!value || typeof value !== "object" || Array.isArray(value) || (value.version !== 1 && value.version !== SAVE_VERSION)) throw new Error("Unbekannter Abenteuer-Spielstand");
  if (!PLACE_IDS.includes(value.place)) throw new Error("Unbekannter Ort");
  const position = value.position === null || value.position === undefined ? null : value.position;
  if (position !== null && (!Number.isFinite(position.x) || !Number.isFinite(position.y) || position.x < 0 || position.x > 1 || position.y < 0 || position.y > 1)) throw new Error("Beschädigte Position");
  if (!value.puzzles || typeof value.puzzles !== "object" || Array.isArray(value.puzzles)) throw new Error("Beschädigte Rätsel");
  const puzzles: Record<string, PuzzleRecord> = {};
  for (const [id, record] of Object.entries(value.puzzles) as [string, PuzzleRecord][]) {
    if (!ID.test(id) || !record || !["aktiv", "gelöst"].includes(record.status) || !Number.isInteger(record.failures) || record.failures < 0 || !Number.isInteger(record.hints) || record.hints < 0 || record.hints > HINT_LEVELS || record.skipped !== undefined && typeof record.skipped !== "boolean") throw new Error("Beschädigter Rätselzustand");
    // Puzzles of the former 12-puzzle edition (key, chest, notebook, pedestals) are dropped; their rewards live on in flags and fragments.
    if (!KNOWN_PUZZLES.has(id)) continue;
    puzzles[id] = { status: record.status, failures: Math.min(999, record.failures), hints: record.hints, ...(record.skipped ? { skipped: true } : {}) };
  }
  const settings = value.settings && typeof value.settings === "object" ? value.settings : DEFAULT_SETTINGS;
  const chapterSeconds: AdventureSave["chapterSeconds"] = {};
  if (value.chapterSeconds && typeof value.chapterSeconds === "object") for (const id of CHAPTER_IDS) if (value.chapterSeconds[id] !== undefined) chapterSeconds[id] = seconds(value.chapterSeconds[id]);
  const known = (list: string[]) => list.filter(id => ADVENTURE_ITEMS[id]);
  const point = position ? { x: position.x, y: position.y } as Point : null;
  const save: AdventureSave = {
    version: SAVE_VERSION, chapter: "prolog", place: value.place,
    // A position inside furniture (e.g. after a map change) falls back to the entrance of the place.
    position: point && canWalk(value.place, point.x, point.y) ? point : null,
    items: known(idList(value.items, "Beschädigtes Inventar")), used: known(idList(value.used, "Beschädigtes Inventar")), evidence: idList(value.evidence, "Beschädigte Hinweise"),
    conclusions: idList(value.conclusions, "Beschädigte Schlussfolgerungen"), flags: idList(value.flags, "Beschädigte Markierungen", 160), fragments: idList(value.fragments, "Beschädigte Fragmente"), puzzles,
    settings: { textSize: settings.textSize === "large" ? "large" : "normal", effects: settings.effects === "reduced" ? "reduced" : "full", thoughts: settings.thoughts !== false },
    startedAt: isoOr(value.startedAt, new Date(0).toISOString())!,
    completedAt: isoOr(value.completedAt, null),
    savedAt: isoOr(value.savedAt, null),
    playSeconds: seconds(value.playSeconds), chapterSeconds,
  };
  const repaired = repairAdventure(save);
  return { ...repaired, chapter: chapterOf(repaired) };
}
export function repairAdventure(save: AdventureSave): AdventureSave {
  let next = save;
  // Rewards of solved puzzles are re-applied (idempotent), oldest chapter first.
  for (const puzzle of PUZZLES) if (solved(next, puzzle.id)) next = applyReward(next, puzzle.reward);
  // Items can't be both in the bag and used up.
  next = { ...next, items: next.items.filter(item => !next.used.includes(item)) };
  // The story can't sit in a place the player has no way out of.
  if (next.place === "archive" && CHAPTER_ORDER.indexOf(chapterOf(next)) < CHAPTER_ORDER.indexOf("finale")) next = { ...next, place: "bedroom", position: null };
  return next;
}
/** The stored form always carries the current chapter so the continue screen can show it. */
export const serializeAdventure = (save: AdventureSave, now?: string) => JSON.stringify({ ...save, version: SAVE_VERSION, chapter: chapterOf(save), ...(now ? { savedAt: now } : {}) });
