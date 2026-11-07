// The intended route through "Die verlorenen Erinnerungen", played through the real engine,
// with a transparent play-time model. Shared by tests/adventure.test.mjs and scripts/adventure-playtime.mjs.
//
// The model is an ESTIMATE for a first playthrough, not a measurement of a human player:
// it counts the actual dialogue text on the route, the actual walking distances between
// exits and hotspots, and adds assumed thinking times per puzzle (see MODEL).
import assert from "node:assert/strict";
import { PLACES, SPAWNS } from "../game/story.ts";
import { WALK_SPEED } from "../game/motion.ts";
import { newAdventure } from "../game/adventure/core.ts";
import { ADVENTURE_INTRO, ADV_RIDE_MS, CONCLUSIONS, HOTSPOTS, LOVE_LETTER, eliasMessageFor, puzzleById, rememberWords } from "../game/adventure/content.ts";
import { applyItem, chapterOf, combineEvidence, enterPlace, finishAdventure, finishMinigame, interact, parseAdventure, submitPuzzle } from "../game/adventure/engine.ts";

/** Answers the player can derive from the in-game clues. */
export const ANSWERS = {
  "p-seal": [true, false, true, false, true, false, true, false, true],
  "p-meeting": { when: "d19", how: "bike", from: "zoerbig", gift: "chocolate", help: "presence" },
  "p-timetable": ["r-stop", "r-bus", "r-market", "r-church", "r-yard"],
  "p-lamps": [true, true, true, true],
  "p-symbols": ["★ Stern", "☾ Mond", "♥ Herz"],
  "p-clock": ["8", "00"],
  "p-gifts": ["g-scarf", "g-card", "g-plates", "g-candle", "g-ribbon"],
  "p-truth": ["t-bike", "t-presence", "t-eight", "t-way"],
  "p-heart": { why: "together" },
};

/** All assumptions of the play-time model, in seconds. */
export const MODEL = {
  /** Reading speed for dialogue on a phone, including the typewriter effect. */
  charsPerSecond: 15,
  /** Tap to continue / glance at the portrait. */
  perLine: 1.2,
  /** Deciding between two answers. */
  perChoice: 2.5,
  /** Real paths are longer than straight lines (furniture, detours). */
  walkFactor: 1.4,
  /** Approaching an exit and the scene change. */
  perExit: 1.5,
  /** Spotting the next hotspot and lining up with it. */
  perHotspot: 3,
  /** Picking two clues in the case file and combining them (incl. a wrong pair now and then). */
  perConclusion: 14,
  /** Opening the bag and using an item. */
  perItemUse: 6,
  /** Thinking time of a first-time player per puzzle, incl. about one wrong attempt and reading the panel. */
  thinking: { "p-seal": 35, "p-meeting": 75, "p-timetable": 85, "p-lamps": 60, "p-symbols": 40, "p-clock": 40, "p-gifts": 75, "p-truth": 60, "p-heart": 20 },
  /** Escape-room training: ten targets plus the result screen. */
  minigame: 30,
  cutscenes: { "elias-message": 16, bus: ADV_RIDE_MS / 1000, credits: 70, barrier: 2, shadow: 0 },
};

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const lineSeconds = line => line.text.length / MODEL.charsPerSecond + MODEL.perLine + (line.choices?.length ? MODEL.perChoice + line.choices[0].reply.reduce((sum, reply) => sum + lineSeconds(reply), 0) : 0);

/** Plays the intended route; every step is attributed to the chapter it happens in. */
export function playRoute({ roundTrip = true } = {}) {
  let s = newAdventure("2026-11-06T10:00:00.000Z");
  let pos = SPAWNS.bedroom;
  const seconds = {};
  const log = [];
  const add = (value, what) => { const chapter = chapterOf(s); seconds[chapter] = (seconds[chapter] ?? 0) + value; log.push({ chapter, what, seconds: value }); };
  const read = (lines, what = "Dialog") => {
    if (!lines?.length) return;
    add(lines.reduce((sum, line) => sum + lineSeconds(line), 0), what);
    // The route always picks the first answer; it is remembered for „Deine Worte“.
    for (const line of lines) if (line.choices?.[0]?.id) s = rememberWords(s, line.choices[0].id);
  };
  const walkTo = point => add(distance(pos, point) * MODEL.walkFactor / WALK_SPEED, "Laufen");
  const afterEffects = after => {
    if (!after) return;
    if (after.cutscene) add(MODEL.cutscenes[after.cutscene] ?? 0, `Szene ${after.cutscene}`);
    if (after.cutscene === "elias-message") s = rememberWords(s, eliasMessageFor(s).replies[0]);
    if (after.minigame) { add(MODEL.minigame, "Training"); const out = finishMinigame(s, after.minigame); s = out.save; read(out.lines, "Dialog"); }
    if (after.travel) travel(after.travel);
  };
  function go(place) {
    const exit = PLACES[s.place].exits.find(entry => entry.to === place);
    assert.ok(exit, `Ausgang ${s.place} → ${place}`);
    walkTo(exit); add(MODEL.perExit, "Ortswechsel");
    const out = enterPlace(s, place); s = out.save; pos = exit.spawn; read(out.lines, "Ankunft");
  }
  function travel(place) { const out = enterPlace(s, place); s = out.save; pos = SPAWNS[place]; read(out.lines, "Ankunft"); }
  function act(id) {
    const spot = HOTSPOTS.find(entry => entry.id === id);
    assert.ok(spot, id); assert.equal(spot.place, s.place, `${id} liegt in ${spot.place}, Felice ist in ${s.place}`);
    assert.ok(spot.visible(s), `${id} sichtbar in ${chapterOf(s)}`);
    walkTo(spot); add(MODEL.perHotspot, "Suchen");
    const out = interact(s, id); s = out.save; pos = { x: spot.x, y: spot.y }; read(out.lines);
    if (!out.after?.puzzle) afterEffects(out.after);
    return out;
  }
  function showItem(item, id) {
    add(MODEL.perItemUse, "Tasche");
    const out = applyItem(s, item, id); s = out.save; read(out.lines); afterEffects(out.after);
  }
  function solve(id) {
    const puzzle = puzzleById(id);
    add(MODEL.thinking[id], `Rätsel ${id}`);
    const result = submitPuzzle(s, id, ANSWERS[id]);
    assert.ok(result.ok, `${id}: ${result.feedback}`);
    s = result.save; read(result.lines, `Lösung ${id}`);
    afterEffects(result.after);
    if (result.after?.puzzle) solve(result.after.puzzle);
    return puzzle;
  }
  function conclude(chapter) { for (const c of CONCLUSIONS.filter(entry => entry.chapter === chapter)) { add(MODEL.perConclusion, "Akte"); s = combineEvidence(s, ...c.from).save; } }
  const checkpoint = () => { if (roundTrip) s = parseAdventure(JSON.stringify(s)); };

  // Prolog
  read(ADVENTURE_INTRO, "Intro");
  act("adv-letter"); act("adv-mirror"); go("home"); act("adv-door"); solve("p-seal");
  checkpoint(); assert.equal(chapterOf(s), "radegast");
  // Radegast
  go("radegast"); act("adv-tracks"); act("adv-neighbor"); act("adv-meeting");
  go("garden"); act("adv-mother"); go("radegast");
  go("bus"); act("adv-calendar"); act("adv-driver"); go("radegast");
  go("playground"); act("adv-chocolate"); go("radegast");
  conclude("radegast"); act("adv-meeting"); solve("p-meeting");
  checkpoint(); assert.equal(chapterOf(s), "schulweg");
  // Schulweg
  go("bus"); act("adv-ticket"); act("adv-busnote"); act("adv-driver"); act("adv-timetable"); solve("p-timetable");
  act("adv-shadowbus"); showItem("ticket", "adv-shadowbus");
  assert.equal(s.place, "school", "Der Schattenbus bringt Felice direkt zum Pausenhof");
  act("adv-friend-elena");
  checkpoint(); assert.equal(chapterOf(s), "zoerbig");
  // Zörbig – Escape Room
  go("gym"); act("adv-plan"); act("adv-switchboard"); solve("p-lamps"); act("adv-gym-shadow"); act("adv-targets"); act("adv-symbol-door"); solve("p-symbols");
  assert.equal(s.place, "home", "Nach dem Escape Room wechselt die Szene direkt nach Hause");
  checkpoint(); assert.equal(chapterOf(s), "weihnachten");
  // Weihnachten
  for (const id of ["mother", "partner-one", "halfsister", "stepsister", "partner-two", "stepfather"]) act(`adv-frozen-${id}`);
  act("adv-place-card"); conclude("weihnachten"); act("adv-clock"); solve("p-clock"); act("adv-gifts"); solve("p-gifts");
  checkpoint(); assert.equal(chapterOf(s), "finale");
  // Finale
  go("bedroom"); go("archive"); act("adv-pedestals"); act("adv-shadow"); solve("p-truth");
  const reunion = act("adv-elias");
  assert.equal(reunion.after?.cutscene, "credits");
  add(LOVE_LETTER.join(" ").length / MODEL.charsPerSecond, "Liebesbrief");
  s = finishAdventure(s, "2026-11-06T10:30:00.000Z");
  checkpoint();
  return { save: s, seconds, log };
}

export function summarize(seconds) {
  const chapters = Object.entries(seconds).map(([chapter, value]) => ({ chapter, minutes: Math.round(value / 6) / 10 }));
  return { chapters, total: Math.round(Object.values(seconds).reduce((a, b) => a + b, 0) / 6) / 10 };
}
