import test from "node:test";
import assert from "node:assert/strict";
import { PLACES, SPAWNS, canWalk } from "../game/story.ts";
import { REST_SPOTS } from "../game/day.ts";
import { speakerGraphic } from "../game/graphics.ts";
import { TRIP, exitOpen, onTrip, wakePlace } from "../game/routines.ts";
import { STORY_EVENTS, beginEvent, completeEvent, eventById, eventStatus, initialTimeline, jumpToNext, nextEvent, sceneMark, sleepToStoryDay, storyTrigger } from "../game/timeline.ts";

const TRIP_IDS = ["klassenfahrt-anreise", "klassenfahrt-parlament", "klassenfahrt-pokalabend", "klassenfahrt-europapark", "klassenfahrt-hotelabend", "klassenfahrt-heimreise"];
const player = { x: .5, y: .7 };
const finish = save => {
  const event = eventById(save.active.id);
  const cursor = event.scene === "sequence" ? event.steps.length : event.scene === "love" || event.scene === "confession" || event.scene === "message" ? event.dialogue.length : 4;
  const state = { ...save.progress[event.id], cursor, topics: event.scene === "chat" ? ["space", "collin"] : [], topic: null };
  return completeEvent({ ...save, progress: { ...save.progress, [event.id]: state } }, event.id, false, "2026-10-08T12:00:00Z");
};

test("Klassenfahrt: bestätigter Wochenablauf in Kapitel 6 zwischen Frühling und Mai-Plan", () => {
  const mainline = STORY_EVENTS.filter(event => event.date && event.scene !== "legacy").map(event => event.id);
  const start = mainline.indexOf("klassenfahrt-anreise");
  assert.deepEqual(mainline.slice(start, start + TRIP_IDS.length), TRIP_IDS);
  assert.equal(mainline[start - 1], "spring-everyday");
  assert.equal(mainline[start + TRIP_IDS.length], "longer-visit-plan");
  assert.deepEqual(TRIP_IDS.map(id => eventById(id).date), ["2026-04-20", "2026-04-21", "2026-04-22", "2026-04-23", "2026-04-23", "2026-04-24"]);
  for (const id of TRIP_IDS) {
    const event = eventById(id);
    assert.equal(event.chapterNumber, 6, id);
    assert.equal(event.confirmed, true, id);
    assert.equal(sceneMark(event).symbol, "✎", id);
  }
  assert.equal(eventById("klassenfahrt-parlament").place, "parliament");
  assert.match(eventById("klassenfahrt-pokalabend").description, /Leverkusen gegen Bayern/);
  // Dienstag nur Parlament, Pizza und Pokalspiel am Mittwoch, Klopfstreich am Donnerstagabend.
  assert.equal(eventById("klassenfahrt-klopfstreich"), undefined);
  assert.equal(STORY_EVENTS.filter(event => event.date === "2026-04-21").length, 1);
  assert.equal(eventById("klassenfahrt-pokalabend").date, "2026-04-22");
  assert.match(eventById("klassenfahrt-hotelabend").steps[0].text, /klopfen/);
  assert.ok(eventById("klassenfahrt-hotelabend").staging.start > eventById("klassenfahrt-europapark").staging.start);
});

test("Klassenfahrt: Orte nur zwischen Abfahrt und Heimreise erreichbar, Felice wacht dazwischen im Hotel auf", () => {
  const done = { completedAt: "2026-10-08T12:00:00Z" };
  const before = {}, during = { [TRIP.start]: done }, after = { [TRIP.start]: done, [TRIP.end]: done };
  for (const place of TRIP.places) {
    assert.equal(exitOpen(place, "2026-04-20", "zoerbig", before), false, place);
    assert.equal(exitOpen(place, "2026-04-20", "zoerbig", during), true, place);
    assert.equal(exitOpen(place, "2026-04-26", "zoerbig", during), true, `${place}: verspätet noch offen`);
    assert.equal(exitOpen(place, "2026-04-24", "zoerbig", after), false, place);
    // Zwischen den Reiseorten bleibt der Rückweg zum Hotel immer offen.
    assert.equal(exitOpen("hotel", "2026-04-26", place, after), true, place);
  }
  // Nach Hause geht es nur mit der Heimreise-Szene, nicht vorher mit dem Bus.
  assert.equal(exitOpen("zoerbig", "2026-04-22", "hotel", during), false);
  assert.equal(exitOpen("zoerbig", "2026-04-26", "hotel", after), true);
  assert.deepEqual([before, during, after].map(wakePlace), ["bedroom", "hotel", "bedroom"]);
  assert.ok(onTrip(during) && !onTrip(before) && !onTrip(after));
  const bed = REST_SPOTS.find(spot => spot.id === "hotel-bed");
  assert.equal(bed.place, "hotel");
  assert.equal(bed.kind, "bed");
  assert.ok(canWalk("hotel", bed.approach.x, bed.approach.y));
  for (const id of TRIP_IDS) {
    const { leaveAt } = eventById(id);
    if (leaveAt) assert.ok(canWalk(leaveAt.place, leaveAt.point.x, leaveAt.point.y), `${id}: Ende begehbar`);
  }
  // Ausgänge der Reiseorte führen nicht direkt auf einen anderen Ausgang.
  for (const place of TRIP.places) for (const exit of PLACES[place].exits) {
    assert.ok(canWalk(exit.to, exit.spawn.x, exit.spawn.y), exit.label);
    for (const back of PLACES[exit.to].exits) assert.ok(Math.hypot(back.x - exit.spawn.x, back.y - exit.spawn.y) > .105, `${exit.label} → ${back.label}`);
  }
  assert.ok(canWalk("hotel", SPAWNS.hotel.x, SPAWNS.hotel.y));
});

test("Klassenfahrt: Schlafen geht Tag für Tag durch die Reise; jeder Abschnitt bleibt einzeln fortsetzbar", () => {
  let save = initialTimeline();
  while (nextEvent(save).id !== "klassenfahrt-anreise") save = finish(beginEvent(jumpToNext(save), nextEvent(save).id, player, "front"));
  const seen = [];
  for (const id of TRIP_IDS) {
    save = jumpToNext(save);
    assert.equal(nextEvent(save).id, id);
    assert.equal(eventStatus(save, eventById(id)), "verfügbar", id);
    seen.push(save.clock.date);
    save = beginEvent(save, id, player, "front");
    // Unterbrochen nach dem ersten Schritt: der Abschnitt ist weder abgeschlossen noch verloren.
    const halfway = { ...save, progress: { ...save.progress, [id]: { ...save.progress[id], cursor: 1 } } };
    assert.equal(completeEvent(halfway, id), halfway, `${id}: kein vorzeitiger Abschluss`);
    save = finish(save);
    if (id !== "klassenfahrt-heimreise") assert.ok(sleepToStoryDay(save).date <= "2026-04-24", `${id}: Schlaf überspringt keinen Reisetag`);
  }
  assert.deepEqual([...new Set(seen)], ["2026-04-20", "2026-04-21", "2026-04-22", "2026-04-23", "2026-04-24"]);
  assert.equal(nextEvent(save).id, "longer-visit-plan");
});

test("Klassenfahrt: Wer einen Reisetag verschläft, holt ihn nach und bleibt bis zur Heimreise im Hotel", () => {
  let save = initialTimeline();
  while (nextEvent(save).id !== "klassenfahrt-anreise") save = finish(beginEvent(jumpToNext(save), nextEvent(save).id, player, "front"));
  save = finish(beginEvent(jumpToNext(save), "klassenfahrt-anreise", player, "front"));
  // Felice geht am 21.04. morgens wieder schlafen, statt auf das Parlament zu warten: der Ablauf rutscht um einen Tag.
  save = { ...save, clock: sleepToStoryDay(save) };
  save = { ...save, clock: sleepToStoryDay(save) };
  assert.equal(save.clock.date, "2026-04-22");
  for (const id of TRIP_IDS.slice(1)) {
    assert.equal(nextEvent(save).id, id);
    assert.equal(wakePlace(save.progress), "hotel", `${id}: Felice wacht im Hotel auf`);
    const trigger = storyTrigger(eventById(id));
    assert.ok(trigger.place === "hotel" || exitOpen(trigger.place, save.clock.date, "hotel", save.progress), `${id}: ${trigger.place} erreichbar`);
    save = finish(beginEvent(save, id, player, "front"));
    save = { ...save, clock: sleepToStoryDay(save) };
  }
  assert.ok(save.clock.date > "2026-04-25", "Die Heimreise lag nach dem 24.04.");
  assert.equal(wakePlace(save.progress), "bedroom");
});

test("Klassenfahrt: Figuren haben Grafiken, der private Moment bleibt eine Ausblende ohne Albumtext", () => {
  for (const id of TRIP_IDS) {
    const event = eventById(id);
    const names = new Set([...(event.cast ?? []), ...event.steps.flatMap(step => step.cast ?? [])]);
    for (const name of names) if (name !== "Felice") assert.ok(speakerGraphic(name), `${id}: ${name}`);
    for (const step of event.steps) if (step.speaker !== "Erzählung") assert.ok(speakerGraphic(step.speaker), `${id}: ${step.speaker}`);
  }
  const evening = eventById("klassenfahrt-hotelabend");
  assert.equal(evening.steps.find(step => step.id === "private").animation, "fade");
  assert.equal(evening.artifacts, undefined);
  const card = eventById("klassenfahrt-heimreise").artifacts[0];
  assert.equal(card.title, "Unsere Klassenfahrt: Straßburg, Kehl & Europa-Park");
  assert.doesNotMatch(card.description + evening.description, /intim|Nacht|Bett/i);
});

test("Klassenfahrt: Szenenbilder existieren als quadratische WebP-Pixelgemälde", async () => {
  const { readFileSync } = await import("node:fs");
  const { SCENE_GRAPHICS } = await import("../game/graphics.ts");
  for (const place of TRIP.places) {
    const data = readFileSync(new URL(`../public${SCENE_GRAPHICS[place].background}`, import.meta.url));
    assert.equal(data.toString("ascii", 0, 4), "RIFF", place);
    assert.equal(data.toString("ascii", 8, 12), "WEBP", place);
    // VP8L (verlustfrei): Breite und Höhe stehen als 14-Bit-Werte ab Byte 21.
    assert.equal(data.toString("ascii", 12, 16), "VP8L", `${place}: verlustfrei für scharfe Pixel`);
    const bits = data.readUInt32LE(21);
    assert.equal((bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1, `${place}: quadratisch`);
    assert.ok(data.length < 200_000, `${place}: klein genug`);
  }
});

test("Startbildschirm: Radegast, Schule und Markt Zörbig wechseln alle fünf Sekunden", async () => {
  const { existsSync } = await import("node:fs");
  const { START_SLIDES, START_SLIDE_MS } = await import("../game/start-slides.ts");
  assert.equal(START_SLIDE_MS, 5000);
  assert.deepEqual(START_SLIDES.map(slide => slide.caption), ["Radegast", "Sekundarschule Zörbig", "Zörbig · Markt"]);
  for (const slide of START_SLIDES) assert.ok(existsSync(new URL(`../public${slide.src}`, import.meta.url)), slide.src);
});
