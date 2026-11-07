import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { FX } from "../game/adventure/fx-sheets.ts";
import { PLACES, SPAWNS, canWalk, routeTo } from "../game/story.ts";
import { exitOpen } from "../game/routines.ts";
import { ADVENTURE_BACKUP_KEY, ADVENTURE_DAMAGED_KEY, ADVENTURE_KEY, addPlayTime, newAdventure } from "../game/adventure/core.ts";
import { ADVENTURE_CHAPTERS, CHAPTER_TASKS, CONCLUSIONS, ELIAS_MESSAGES, EVIDENCE, FRAGMENTS, HOTSPOTS, MAIN_PUZZLES, PLANNED_MINUTES, PUZZLES, SWITCH_TOGGLES, TARGET_COUNTS, TARGET_ORDER, TARGET_SYMBOLS, WORDS, applySwitch, eliasMessageFor, mainPuzzleOf, puzzleById, rememberWords, spokenWords } from "../game/adventure/content.ts";
import {
  ambience, applyItem, canSkip, chapterOf, combineEvidence, combineItems, enterPlace, exitGate, finishAdventure, finishMinigame, hintPuzzle, hotspotsAt, interact, mainProgress, objective,
  parseAdventure, puzzleStatus, questLog, revealHint, skipPuzzle, submitPuzzle, walkBlocked,
} from "../game/adventure/engine.ts";
import { loadAdventure, setAsideDamaged, writeAdventure } from "../game/adventure/storage.ts";
import { ANSWERS, playRoute, summarize } from "./adventure-route.mjs";

const go = (save, place) => enterPlace(save, place).save;
const act = (save, id) => { const spot = HOTSPOTS.find(entry => entry.id === id); assert.ok(spot, id); assert.ok(spot.visible(save), `${id} sichtbar in ${chapterOf(save)}`); return interact({ ...save, place: spot.place }, id).save; };
const solve = (save, id) => { const result = submitPuzzle(save, id, ANSWERS[id]); assert.ok(result.ok, `${id}: ${result.feedback}`); return result.save; };
const conclude = (save, chapter) => { for (const c of CONCLUSIONS.filter(entry => entry.chapter === chapter)) save = combineEvidence(save, ...c.from).save; return save; };
const memoryStorage = (initial = {}) => { const map = new Map(Object.entries(initial)); return { map, getItem: key => map.has(key) ? map.get(key) : null, setItem: (key, value) => { map.set(key, String(value)); }, removeItem: key => { map.delete(key); } }; };

test("Abenteuer: das Finale ist von einem neuen Spielstand aus erreichbar – mit Speichern/Laden nach jedem Kapitel", () => {
  const { save: done } = playRoute();
  assert.equal(chapterOf(done), "epilog");
  assert.equal(done.version, 2);
  assert.deepEqual(FRAGMENTS.map(f => done.fragments.includes(f.id)), [true, true, true, true]);
  for (const puzzle of PUZZLES) assert.equal(puzzleStatus(done, puzzle.id), "gelöst", puzzle.id);
  assert.ok(mainProgress(done).every(entry => entry.solved), "alle sechs Haupt-Rätsel");
  assert.match(objective(done).text, /Elias ist frei/);
  assert.ok(done.items.includes("notebook") && done.items.includes("shadow-letter"));
});

test("Abenteuer: das Ende enthält die Antwort „Weil wir zusammengehören“", () => {
  const heart = puzzleById("p-heart");
  assert.equal(heart.check({ why: "together" }).ok, true);
  assert.equal(heart.ui.questions[0].options.find(option => option.id === "together").label, "Weil wir zusammengehören.");
  assert.match(heart.solvedLines[0].text, /Weil wir zusammengehören/);
  for (const wrong of ["promise", "letter", "brave"]) assert.equal(heart.check({ why: wrong }).ok, false);
  assert.equal(heart.requires.flags[0], "lies-broken", "erst nach den Lügen des Schattens");
  assert.equal(puzzleById("p-truth").after.puzzle, "p-heart", "folgt direkt auf die Lügen");
});

test("Abenteuer: sechs abwechslungsreiche Haupt-Rätsel mit je drei Hinweisstufen, Rückmeldung und Belohnung", () => {
  assert.equal(MAIN_PUZZLES.length, 6);
  assert.deepEqual(MAIN_PUZZLES.map(m => m.chapter), ["prolog", "radegast", "schulweg", "zoerbig", "weihnachten", "finale"], "ein Haupt-Rätsel pro Kapitel");
  assert.deepEqual(MAIN_PUZZLES.map(m => m.genre), ["Musterrätsel", "Detektivrätsel", "Logikrätsel", "Escape Room", "Erinnerungsrätsel", "Finale"]);
  assert.deepEqual(MAIN_PUZZLES.flatMap(m => m.parts).sort(), PUZZLES.map(p => p.id).sort(), "jedes Rätsel gehört zu genau einem Haupt-Rätsel");
  assert.ok(new Set(MAIN_PUZZLES.map(m => puzzleById(m.parts[0]).ui.type)).size >= 5, "unterschiedliche Bedienformen");
  assert.equal(new Set(PUZZLES.map(p => p.id)).size, PUZZLES.length, "eindeutige IDs");
  assert.equal(mainPuzzleOf("p-symbols").part, 2); assert.equal(mainPuzzleOf("p-symbols").number, 4);
  for (const p of PUZZLES) {
    assert.equal(p.hints.length, 3, p.id);
    assert.ok(p.hints.every(h => h.length > 25), `${p.id}: konkrete Hinweise`);
    assert.notEqual(p.hints[0], p.hints[2]);
    assert.ok(p.prompt.length > 30 && p.solvedLines.length > 0, p.id);
    assert.ok(Object.keys(p.reward).length > 0, `${p.id}: Belohnung`);
    assert.ok(HOTSPOTS.some(h => h.id === p.hotspot), `${p.id}: Ort im Spiel`);
    assert.notEqual(p.ui.type, "world", `${p.id}: als Panel per Touch lösbar`);
    assert.equal(p.check(ANSWERS[p.id]).ok, true, `${p.id}: Lösung`);
    const wrong = p.check(p.ui.type === "questions" ? Object.fromEntries(p.ui.questions.map(q => [q.id, q.options.find(o => o.id !== ANSWERS[p.id][q.id]).id])) : p.ui.type === "pattern" ? Array(9).fill(false) : p.ui.type === "switch" ? [false, true, true, false] : p.ui.type === "truth" ? ["t-alone"] : p.ui.type === "sequence" ? [] : p.ui.dials.map(d => d.options[d.start]));
    assert.equal(wrong.ok, false, `${p.id}: falsche Eingabe`); assert.ok(wrong.feedback.length > 10, `${p.id}: Rückmeldung`);
  }
});

test("Abenteuer: Spielzeit-Modell der vorgesehenen Route liegt bei 25–35 Minuten", () => {
  const { seconds } = playRoute({ roundTrip: false });
  const { chapters, total } = summarize(seconds);
  assert.equal(PLANNED_MINUTES, 30);
  assert.ok(total >= 25 && total <= 35, `Modell: ${total} Min.`);
  for (const planned of ADVENTURE_CHAPTERS.filter(c => c.minutes)) {
    const modelled = chapters.find(c => c.chapter === planned.id)?.minutes ?? 0;
    assert.ok(Math.abs(modelled - planned.minutes) <= 2.5, `${planned.id}: geplant ${planned.minutes}, Modell ${modelled} Min.`);
  }
});

test("Abenteuer: Schalterrätsel ist von jedem Zustand aus lösbar (kein Softlock)", () => {
  const seen = new Set(); const queue = [puzzleById("p-lamps").ui.start];
  while (queue.length) { const state = queue.shift(); const key = state.join(); if (seen.has(key)) continue; seen.add(key); for (let i = 0; i < SWITCH_TOGGLES.length; i++) queue.push(applySwitch(state, i)); }
  assert.ok(seen.has("true,true,true,true"));
  for (const key of seen) { const start = key.split(",").map(v => v === "true"); let found = false; const q = [start], s2 = new Set();
    while (q.length && !found) { const st = q.shift(); const k = st.join(); if (s2.has(k)) continue; s2.add(k); if (st.every(Boolean)) found = true; for (let i = 0; i < 4; i++) q.push(applySwitch(st, i)); }
    assert.ok(found, key); }
});

test("Abenteuer: Hinweise in drei Stufen, Überspringen erst nach Fehlversuchen – mit derselben Belohnung", () => {
  let s = stage("radegast-meeting");
  assert.equal(hintPuzzle(s).id, "p-meeting");
  assert.equal(canSkip(s, "p-meeting"), false);
  for (let i = 0; i < 5; i++) s = revealHint(s, "p-meeting");
  assert.equal(s.puzzles["p-meeting"].hints, 3, "höchstens drei Stufen");
  assert.doesNotMatch(puzzleById("p-meeting").hints[0], /19\.11/, "Stufe 1 verrät die Lösung nicht");
  assert.equal(canSkip(s, "p-meeting"), false, "Hinweise allein reichen nicht");
  const wrong = submitPuzzle(s, "p-meeting", { ...ANSWERS["p-meeting"], when: "d12", how: "bus" });
  assert.equal(wrong.ok, false); assert.match(wrong.feedback, /3 von 5/);
  s = wrong.save; assert.ok(canSkip(s, "p-meeting"));
  const skipped = skipPuzzle(s, "p-meeting");
  assert.ok(skipped.save.fragments.includes("f-chocolate"), "Überspringen gibt die Belohnung");
  assert.equal(skipped.save.puzzles["p-meeting"].skipped, true);
  let t = stage("radegast-meeting");
  for (let i = 0; i < puzzleById("p-meeting").skipAfter; i++) t = submitPuzzle(t, "p-meeting", {}).save;
  assert.ok(canSkip(t, "p-meeting"), "Fehlversuche allein schalten Überspringen frei");
});

test("Abenteuer: Rätsel sind gesperrt, bis ihre Voraussetzungen erfüllt sind; Reihenfolge der Hinweise ist frei", () => {
  const s = newAdventure();
  assert.equal(puzzleStatus(s, "p-seal"), "gesperrt", "erst den Brief lesen");
  assert.equal(submitPuzzle(s, "p-seal", ANSWERS["p-seal"]).ok, false, "gesperrtes Rätsel kann nicht gelöst werden");
  assert.equal(puzzleStatus(act(s, "adv-letter"), "p-seal"), "verfügbar");
  let a = stage("radegast-start"), b = a;
  for (const [place, id] of [["radegast", "adv-tracks"], ["radegast", "adv-neighbor"], ["garden", "adv-mother"], ["bus", "adv-driver"], ["bus", "adv-calendar"], ["playground", "adv-chocolate"]]) a = act(go(a, place), id);
  for (const [place, id] of [["playground", "adv-chocolate"], ["bus", "adv-calendar"], ["bus", "adv-driver"], ["garden", "adv-mother"], ["radegast", "adv-neighbor"], ["radegast", "adv-tracks"]]) b = act(go(b, place), id);
  assert.deepEqual([...a.evidence].sort(), [...b.evidence].sort());
  assert.equal(combineEvidence(a, "ev-tracks", "ev-chocolate").ok, false, "falsche Kombination");
  assert.equal(puzzleStatus(a, "p-meeting"), "gesperrt", "ohne Schlussfolgerungen gesperrt");
  assert.equal(puzzleStatus(conclude(a, "radegast"), "p-meeting"), "verfügbar");
});

test("Abenteuer: Gegenstände – die Fahrkarte wird gezeigt, Questgegenstände gehen nicht verloren", () => {
  let s = stage("schulweg-start");
  s = act(go(s, "bus"), "adv-ticket");
  assert.ok(s.items.includes("ticket"));
  assert.equal(applyItem(s, "ticket", "adv-timetable").ok, false, "falscher Ort verliert nichts");
  assert.ok(s.items.includes("ticket"));
  assert.equal(combineItems(s, "ticket", "shadow-letter").ok, false);
  s = solve(act(s, "adv-timetable"), "p-timetable");
  assert.equal(exitGate(s, "bus", "zoerbig").open, false, "ohne Fahrkarte kein Bus");
  const boarding = applyItem(s, "ticket", "adv-shadowbus");
  assert.equal(boarding.after.cutscene, "bus"); assert.equal(boarding.after.travel, "school");
  assert.equal(exitGate(boarding.save, "bus", "zoerbig").open, true);
  // Taking the ticket again is impossible.
  assert.equal(HOTSPOTS.find(h => h.id === "adv-ticket").visible(boarding.save), false);
});

test("Abenteuer: Escape Room hält Felice im Trainingsraum, bis das Symbolschloss offen ist", () => {
  let s = stage("zoerbig-start");
  assert.equal(exitGate(s, "school", "gym").open, true);
  s = go(s, "gym");
  assert.equal(exitGate(s, "gym", "school").open, false, "die Tür ist ins Schloss gefallen");
  s = solve(act(act(s, "adv-plan"), "adv-switchboard"), "p-lamps");
  s = act(act(s, "adv-gym-shadow"), "adv-targets");
  const result = submitPuzzle(act(s, "adv-symbol-door"), "p-symbols", ANSWERS["p-symbols"]);
  assert.equal(result.after.travel, "home", "direkt weiter nach Weihnachten, ohne Rückweg");
  assert.equal(chapterOf(result.save), "weihnachten");
});

test("Speicherstand: Version 2, strenge Prüfung, Reparatur und Positionsprüfung", () => {
  for (const raw of ["broken", "null", "[]", JSON.stringify({ ...newAdventure(), version: 3 }), JSON.stringify({ ...newAdventure(), place: "toString" }), JSON.stringify({ ...newAdventure(), items: ["<script>"] }), JSON.stringify({ ...newAdventure(), puzzles: { "p-seal": { status: "?", failures: 0, hints: 0 } } }), JSON.stringify({ ...newAdventure(), puzzles: { "p-seal": { status: "aktiv", failures: 0, hints: 9 } } }), JSON.stringify({ ...newAdventure(), position: { x: 4, y: 1 } })]) assert.throws(() => parseAdventure(raw), raw.slice(0, 40));
  const fresh = parseAdventure(null);
  assert.equal(fresh.version, 2); assert.equal(fresh.chapter, "prolog"); assert.equal(fresh.playSeconds, 0);
  // A save that marks the meeting solved but lost the fragment is repaired.
  const repaired = parseAdventure(JSON.stringify({ ...newAdventure(), flags: ["prolog-done", "letter-read"], puzzles: { "p-meeting": { status: "gelöst", failures: 0, hints: 0 } } }));
  assert.ok(repaired.fragments.includes("f-chocolate")); assert.equal(repaired.chapter, "schulweg");
  // The stored chapter is never trusted.
  assert.equal(parseAdventure(JSON.stringify({ ...newAdventure(), chapter: "finale" })).chapter, "prolog");
  assert.equal(parseAdventure(JSON.stringify({ ...newAdventure(), place: "archive" })).place, "bedroom", "kein Festsitzen im Archiv");
  assert.equal(parseAdventure(JSON.stringify({ ...newAdventure(), position: { x: .01, y: .01 } })).position, null, "Position in einer Wand fällt auf den Eingang zurück");
  const spot = { ...SPAWNS.bedroom };
  assert.deepEqual(parseAdventure(JSON.stringify({ ...newAdventure(), position: spot })).position, spot, "Position bleibt erhalten");
  assert.equal(parseAdventure(JSON.stringify({ ...newAdventure(), settings: { textSize: "large", effects: "reduced", thoughts: false } })).settings.textSize, "large");
  // Play time is kept per chapter.
  const timed = parseAdventure(JSON.stringify(addPlayTime(addPlayTime(newAdventure(), 90, "prolog"), 30, "radegast")));
  assert.equal(timed.playSeconds, 120); assert.equal(timed.chapterSeconds.prolog, 90);
});

test("Speicherstand: Version-1-Stände der 12-Rätsel-Fassung werden übernommen", () => {
  const v1 = (fields) => JSON.stringify({ version: 1, place: "home", position: null, items: [], used: [], evidence: [], conclusions: [], flags: [], fragments: [], puzzles: {}, settings: { textSize: "normal", effects: "full", thoughts: true }, startedAt: "2026-11-06T10:00:00.000Z", completedAt: null, ...fields });
  // Prolog with the old key parts: unknown items and puzzles disappear, progress stays.
  const prolog = parseAdventure(v1({ items: ["shadow-letter", "spare-key", "key-bit"], used: ["key-grip"], flags: ["letter-read", "door-unlocked"], puzzles: { "p-key": { status: "gelöst", failures: 1, hints: 0 } } }));
  assert.equal(prolog.version, 2); assert.deepEqual(prolog.items, ["shadow-letter"]); assert.equal(prolog.puzzles["p-key"], undefined);
  assert.equal(puzzleStatus(prolog, "p-seal"), "verfügbar");
  // Meeting solved, old chest still closed: the fragment now comes from the meeting.
  const chest = parseAdventure(v1({ place: "radegast", flags: ["letter-read", "prolog-done"], puzzles: { "p-seal": { status: "gelöst", failures: 0, hints: 0 }, "p-meeting": { status: "gelöst", failures: 2, hints: 1 } } }));
  assert.equal(chapterOf(chest), "schulweg"); assert.equal(chest.puzzles["p-meeting"].failures, 2);
  // Old notebook search already done: Zörbig continues.
  const notebook = parseAdventure(v1({ place: "school", items: ["notebook", "ticket"], flags: ["prolog-done", "bus-boarded", "arrived-school"], fragments: ["f-chocolate", "f-way"], puzzles: { "p-notebook": { status: "gelöst", failures: 0, hints: 0 } } }));
  assert.equal(chapterOf(notebook), "zoerbig"); assert.equal(exitGate(notebook, "school", "gym").open, true);
  // Finale with the barrier already broken by the old truth puzzle: Elias can be reached.
  const finale = parseAdventure(v1({ place: "archive", flags: ["prolog-done", "pedestals-lit", "barrier-down", "arrived-archive"], fragments: FRAGMENTS.map(f => f.id), puzzles: { "p-pedestals": { status: "gelöst", failures: 0, hints: 0 }, "p-truth": { status: "gelöst", failures: 0, hints: 0 } } }));
  assert.equal(chapterOf(finale), "finale"); assert.ok(finale.flags.includes("lies-broken"));
  assert.equal(interact(finale, "adv-elias").after?.cutscene, "credits");
});

test("Speicherstand: Hauptslot, Checkpoint, beschädigte Stände und gesperrter Speicher", () => {
  const storage = memoryStorage();
  assert.equal(loadAdventure(storage).state, "new");
  let s = act(newAdventure(), "adv-letter");
  assert.equal(writeAdventure(storage, s, { now: "2026-11-07T10:00:00.000Z" }).ok, true);
  assert.equal(storage.getItem(ADVENTURE_BACKUP_KEY), null, "ohne Checkpoint nur der Hauptslot");
  const loaded = loadAdventure(storage);
  assert.equal(loaded.state, "ok"); assert.equal(loaded.save.savedAt, "2026-11-07T10:00:00.000Z"); assert.ok(loaded.save.flags.includes("letter-read"));
  // Solve the seal: checkpoint.
  s = solve(act(go(s, "home"), "adv-door"), "p-seal");
  writeAdventure(storage, s, { checkpoint: true, now: "2026-11-07T10:03:00.000Z" });
  assert.equal(JSON.parse(storage.getItem(ADVENTURE_BACKUP_KEY)).chapter, "radegast");
  // A half-written main save is detected; the checkpoint is offered and the damaged text is kept aside.
  storage.setItem(ADVENTURE_KEY, "{\"version\":2,\"place\":\"radeg");
  const damaged = loadAdventure(storage);
  assert.equal(damaged.state, "damaged"); assert.equal(damaged.recovered.chapter, "radegast"); assert.equal(chapterOf(damaged.save), "radegast");
  setAsideDamaged(storage);
  assert.match(storage.getItem(ADVENTURE_DAMAGED_KEY), /radeg/);
  // No checkpoint at all: a damaged save starts fresh, but is still reported.
  const lonely = loadAdventure(memoryStorage({ [ADVENTURE_KEY]: "kaputt" }));
  assert.equal(lonely.state, "damaged"); assert.equal(lonely.recovered, null); assert.equal(chapterOf(lonely.save), "prolog");
  // Migration is reported.
  const old = memoryStorage({ [ADVENTURE_KEY]: JSON.stringify({ ...newAdventure(), version: 1 }) });
  assert.equal(loadAdventure(old).state, "migrated");
  // Full or blocked storage never throws.
  const full = { getItem: () => null, removeItem() {}, setItem() { throw new DOMException("full", "QuotaExceededError"); } };
  const result = writeAdventure(full, s);
  assert.equal(result.ok, false); assert.match(result.error, /voll/);
  assert.equal(loadAdventure(null).state, "unavailable");
  assert.equal(writeAdventure(null, s).ok, false);
  const blocked = { getItem() { throw new Error("SecurityError"); }, setItem() { throw new Error("SecurityError"); }, removeItem() {} };
  assert.equal(loadAdventure(blocked).state, "unavailable");
});

test("Abenteuer: Quests, Ziele und Ortssperren folgen dem Kapitel", () => {
  const s = newAdventure();
  assert.equal(objective(s).target, "adv-letter");
  assert.equal(exitGate(s, "home", "radegast").open, false);
  assert.equal(exitGate(s, "bedroom", "archive").visible, false, "Archiv bleibt bis zum Finale verborgen");
  assert.equal(exitOpen("archive", "2026-01-01"), false, "Die Chronik zeigt das Archiv nie");
  const log = questLog(s);
  assert.equal(log.main.title, "Rette Elias"); assert.equal(log.main.puzzles, 0); assert.equal(log.chapters[0].state, "aktiv"); assert.equal(log.side.length, 2);
  for (const tasks of Object.values(CHAPTER_TASKS)) for (const task of tasks) if (task.target) assert.ok(HOTSPOTS.some(h => h.id === task.target), task.target);
  for (const c of CONCLUSIONS) for (const id of c.from) assert.ok(EVIDENCE.some(e => e.id === id), id);
  assert.equal(objective(stage("schulweg-start")).place, "bus", "Schulweg beginnt an der Haltestelle");
});

test("Abenteuer: alle Hotspots liegen begehbar und sind vom Eingang erreichbar; das Archiv hat Bild und Rückweg", () => {
  assert.ok(existsSync(new URL("../public/rooms/archive-v1.svg", import.meta.url)));
  assert.ok(routeTo("archive", "bedroom") && routeTo("bedroom", "archive"));
  const grid = .009;
  const reach = (place, blocked = () => false) => {
    const spawn = SPAWNS[place]; const points = [spawn]; const seen = new Set(["0,0"]); const cells = [[0, 0]];
    for (let i = 0; i < cells.length; i++) { const [x, y] = cells[i];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, key = `${nx},${ny}`; const p = { x: spawn.x + nx * grid, y: spawn.y + ny * grid };
        if (seen.has(key) || !canWalk(place, p.x, p.y) || blocked(p)) continue; seen.add(key); cells.push([nx, ny]); points.push(p); } }
    return points;
  };
  const cache = {};
  for (const spot of HOTSPOTS) {
    if (spot.place === "archive" && spot.id === "adv-elias") continue;
    const points = cache[spot.place] ??= reach(spot.place, spot.place === "archive" ? p => p.y < .45 : undefined);
    assert.ok(points.some(p => Math.hypot(p.x - spot.x, p.y - spot.y) < .08), `${spot.place}: ${spot.id}`);
  }
  const free = reach("archive");
  assert.ok(free.some(p => Math.hypot(p.x - .5, p.y - .36) < .08), "Nach der Barriere ist Elias erreichbar");
  assert.ok(Object.keys(PLACES).includes("archive"));
});

test("Abenteuer: zufällige Aktionsreihenfolgen führen nie in einen unlösbaren Zustand", () => {
  let seed = 7; const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let run = 0; run < 25; run++) {
    let s = newAdventure();
    for (let step = 0; step < 400 && chapterOf(s) !== "epilog"; step++) {
      const spots = Object.keys(PLACES).flatMap(place => hotspotsAt(s, place));
      const choice = random();
      if (choice < .55 && spots.length) { const spot = spots[Math.floor(random() * spots.length)]; const out = interact({ ...s, place: spot.place }, spot.id); s = out.save; if (out.after?.cutscene === "credits") s = finishAdventure(s); }
      else if (choice < .65 && s.items.length > 1) s = combineItems(s, s.items[Math.floor(random() * s.items.length)], s.items[Math.floor(random() * s.items.length)]).save;
      else if (choice < .75 && s.evidence.length > 1) s = combineEvidence(s, s.evidence[Math.floor(random() * s.evidence.length)], s.evidence[Math.floor(random() * s.evidence.length)]).save;
      else if (choice < .82) s = enterPlace(s, Object.keys(PLACES)[Math.floor(random() * Object.keys(PLACES).length)]).save;
      else if (choice < .9 && s.items.length && spots.length) s = applyItem(s, s.items[Math.floor(random() * s.items.length)], spots[Math.floor(random() * spots.length)].id).save;
      else { const p = hintPuzzle(s); if (p && puzzleStatus(s, p.id) !== "gesperrt") s = submitPuzzle(s, p.id, random() < .5 ? ANSWERS[p.id] : []).save; }
      s = parseAdventure(JSON.stringify(s));
      assert.ok(objective(s).text.length > 0);
    }
    s = finishFrom(s);
    assert.equal(chapterOf(s), "epilog", `Lauf ${run}`);
  }
});

test("Dranbleiben: nach jedem Fragment meldet sich Elias – das Signal wird mit jeder Erinnerung stärker", () => {
  assert.deepEqual(ELIAS_MESSAGES.map(m => m.signal), [1, 2, 3, 4]);
  for (const message of ELIAS_MESSAGES) { assert.equal(message.replies.length, 2); for (const id of message.replies) assert.ok(WORDS[id], id); }
  // The message is chosen by the number of restored fragments, so it can't repeat or be skipped.
  let s = stage("schulweg-start");
  assert.equal(eliasMessageFor(s).signal, 1);
  const elena = interact({ ...act(go(s, "bus"), "adv-ticket"), place: "school" }, "adv-friend-elena");
  assert.equal(elena.after, undefined, "ohne Ankunft am Pausenhof kein Heft");
  s = act(go(solve(act(go(s, "bus"), "adv-ticket"), "p-timetable"), "school"), "adv-friend-elena");
  assert.equal(eliasMessageFor(s).signal, 2);
  for (const id of ["p-meeting", "p-symbols", "p-gifts"]) assert.equal(puzzleById(id).after.cutscene, "elias-message", id);
  assert.equal(puzzleById("p-symbols").after.travel, "home", "die Nachricht kommt vor dem Szenenwechsel");
});

test("Dranbleiben: Felices eigene Worte werden gemerkt und im Ende zitiert", () => {
  const { save } = playRoute();
  const words = spokenWords(save);
  assert.ok(words.length >= 10, `${words.length} Antworten gemerkt`);
  assert.deepEqual(words.map(w => w.id), Object.keys(WORDS).filter(id => words.some(w => w.id === id)), "in Story-Reihenfolge");
  assert.ok(new Set(words.map(w => w.chapter)).size >= 5, "aus fast allen Kapiteln");
  assert.equal(rememberWords(newAdventure(), "<script>").flags.length, 0, "nur bekannte Antworten");
  assert.ok(parseAdventure(JSON.stringify(rememberWords(newAdventure(), "w-find"))).flags.includes("said-w-find"), "überlebt Speichern/Laden");
});

test("Dranbleiben: das Zielscheiben-Training im Escape Room liefert die Treffer für das Symbolschloss", () => {
  let s = stage("zoerbig-start");
  s = solve(act(go(s, "gym"), "adv-switchboard"), "p-lamps");
  const start = interact(s, "adv-targets");
  assert.equal(start.after.minigame, "targets"); assert.equal(start.save.evidence.includes("ev-targets"), false);
  const counts = { star: 0, moon: 0, heart: 0 };
  for (const target of TARGET_ORDER) counts[target]++;
  assert.deepEqual(counts, { ...TARGET_COUNTS }, "jede Scheibe leuchtet so oft, wie sie im Training getroffen wurde");
  const order = Object.entries(TARGET_COUNTS).sort((a, b) => a[1] - b[1]).map(([id]) => TARGET_SYMBOLS[id]);
  assert.deepEqual(ANSWERS["p-symbols"].map(v => v[0]), order, "schwächste → beste Scheibe = Lösung des Schlosses");
  const done = finishMinigame(s, "targets");
  assert.ok(done.save.evidence.includes("ev-targets")); assert.equal(finishMinigame(done.save, "targets").lines.length, 0, "nur einmal");
  assert.match(interact(done.save, "adv-targets").lines[0].text, /Stern 2/);
});

test("Blender-Effekte: Sprite-Sheets existieren und passen zu den Frame-Angaben", () => {
  for (const [name, fx] of Object.entries(FX)) {
    const png = readFileSync(new URL(`../public${fx.src}`, import.meta.url));
    assert.equal(png.readUInt32BE(16), fx.frames * fx.size, `${name}: Breite`);
    assert.equal(png.readUInt32BE(20), fx.size, `${name}: Höhe`);
  }
  assert.ok(existsSync(new URL("../scripts/blender/render_fx.py", import.meta.url)));
});

test("Abenteuer: Atmosphäre – Weihnachten und Finale sind winterlich, die Barriere blockiert bis zum Schluss", () => {
  const s = stage("finale");
  assert.equal(ambience(s, "home").winter, true);
  assert.ok(walkBlocked(go(s, "archive"), "archive", .5, .36));
  assert.equal(exitGate(s, "bedroom", "archive").open, true);
});

/* Helpers that reach a chapter or finish the story from any state using only player actions. */
function stage(name) {
  let s = act(newAdventure(), "adv-letter");
  s = solve(act(go(s, "home"), "adv-door"), "p-seal");
  if (name === "radegast-start") return s;
  for (const [place, id] of [["radegast", "adv-tracks"], ["radegast", "adv-neighbor"], ["garden", "adv-mother"], ["bus", "adv-driver"], ["bus", "adv-calendar"], ["playground", "adv-chocolate"]]) s = act(go(s, place), id);
  s = conclude(s, "radegast");
  if (name === "radegast-meeting") return s;
  s = solve(s, "p-meeting");
  if (name === "schulweg-start") return s;
  s = act(go(s, "bus"), "adv-ticket"); s = solve(s, "p-timetable"); s = applyItem(s, "ticket", "adv-shadowbus").save; s = act(go(s, "school"), "adv-friend-elena");
  if (name === "zoerbig-start") return s;
  s = go(s, "gym"); s = solve(s, "p-lamps"); s = act(s, "adv-gym-shadow"); s = solve(s, "p-symbols");
  s = act(go(s, "home"), "adv-clock"); s = solve(s, "p-clock"); s = solve(s, "p-gifts");
  return s;
}
function finishFrom(start) {
  let s = start;
  for (let guard = 0; guard < 200 && chapterOf(s) !== "epilog"; guard++) {
    const chapter = chapterOf(s);
    for (const spot of HOTSPOTS) if (spot.visible(s) && !/^adv-spark/.test(spot.id)) { const out = interact({ ...s, place: spot.place }, spot.id); s = out.save; if (out.after?.cutscene === "credits") s = finishAdventure(s); }
    for (const spot of HOTSPOTS) if (spot.visible(s)) for (const id of [...s.items]) if (spot.accepts?.[id]) s = applyItem(s, id, spot.id).save;
    s = conclude(s, chapter);
    for (const p of PUZZLES) if (puzzleStatus(s, p.id) !== "gelöst" && puzzleStatus(s, p.id) !== "gesperrt") s = submitPuzzle(s, p.id, ANSWERS[p.id]).save;
    for (const place of Object.keys(PLACES)) s = enterPlace(s, place).save;
  }
  return s;
}
