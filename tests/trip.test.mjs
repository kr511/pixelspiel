import test from "node:test";
import assert from "node:assert/strict";
import { PLACES, SPAWNS, canWalk } from "../game/story.ts";
import { REST_SPOTS } from "../game/day.ts";
import { speakerGraphic } from "../game/graphics.ts";
import { TRIP, exitOpen, onTrip, wakePlace } from "../game/routines.ts";
import { STORY_EVENTS, beginEvent, completeEvent, eventById, eventStatus, initialTimeline, jumpToNext, nextEvent, sleepToStoryDay } from "../game/timeline.ts";

const TRIP_IDS = ["klassenfahrt-anreise", "klassenfahrt-parlament", "klassenfahrt-klopfstreich", "klassenfahrt-pokalabend", "klassenfahrt-europapark", "klassenfahrt-hotelabend", "klassenfahrt-heimreise"];
const player = { x: .5, y: .7 };
const finish = save => {
  const event = eventById(save.active.id);
  const cursor = event.scene === "sequence" ? event.steps.length : event.scene === "love" ? 2 : event.scene === "confession" || event.scene === "message" ? event.dialogue.length : 4;
  const state = { ...save.progress[event.id], cursor, topics: event.scene === "chat" ? ["space", "collin"] : [], topic: null };
  return completeEvent({ ...save, progress: { ...save.progress, [event.id]: state } }, event.id, false, "2026-10-08T12:00:00Z");
};

test("Klassenfahrt: bestätigter Wochenablauf in Kapitel 6 zwischen Frühling und Mai-Plan", () => {
  const mainline = STORY_EVENTS.filter(event => event.date && event.scene !== "legacy").map(event => event.id);
  const start = mainline.indexOf("klassenfahrt-anreise");
  assert.deepEqual(mainline.slice(start, start + TRIP_IDS.length), TRIP_IDS);
  assert.equal(mainline[start - 1], "spring-everyday");
  assert.equal(mainline[start + TRIP_IDS.length], "longer-visit-plan");
  assert.deepEqual(TRIP_IDS.map(id => eventById(id).date), ["2026-04-20", "2026-04-21", "2026-04-21", "2026-04-22", "2026-04-23", "2026-04-23", "2026-04-24"]);
  for (const id of TRIP_IDS) {
    const event = eventById(id);
    assert.equal(event.chapterNumber, 6, id);
    assert.equal(event.confirmed, true, id);
    assert.match(event.description, /rekonstruiert/, id);
  }
  assert.equal(eventById("klassenfahrt-parlament").place, "parliament");
  assert.match(eventById("klassenfahrt-pokalabend").description, /Leverkusen gegen Bayern/);
  // Pokalspiel und Pizza am Mittwoch; Klopfen Dienstag und Donnerstag.
  assert.equal(eventById("klassenfahrt-pokalabend").date, "2026-04-22");
  assert.ok(eventById("klassenfahrt-hotelabend").staging.start > eventById("klassenfahrt-europapark").staging.start);
});

test("Klassenfahrt: Orte nur während der Fahrt erreichbar, Felice wacht ab Dienstag im Hotel auf", () => {
  for (const place of TRIP.places) {
    assert.equal(exitOpen(place, "2026-04-19"), false, place);
    assert.equal(exitOpen(place, "2026-04-20"), true, place);
    assert.equal(exitOpen(place, "2026-04-24"), true, place);
    assert.equal(exitOpen(place, "2026-04-25"), false, place);
  }
  assert.equal(exitOpen("zoerbig", "2026-04-22"), true);
  assert.deepEqual(["2026-04-20", "2026-04-21", "2026-04-24", "2026-04-25"].map(wakePlace), ["bedroom", "hotel", "hotel", "bedroom"]);
  assert.ok(onTrip("2026-04-22") && !onTrip("2026-05-01"));
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

test("Klassenfahrt: Szenenbilder existieren und sind gültiges SVG ohne unmaskierte Sonderzeichen", async () => {
  const { readFileSync } = await import("node:fs");
  const { SCENE_GRAPHICS } = await import("../game/graphics.ts");
  for (const place of TRIP.places) {
    const svg = readFileSync(new URL(`../public${SCENE_GRAPHICS[place].background}`, import.meta.url), "utf8");
    assert.match(svg, /^<svg [^>]*viewBox="0 0 320 320"/, place);
    assert.doesNotMatch(svg, /&(?!amp;|lt;|gt;|quot;|apos;|#)/, `${place}: unmaskiertes &`);
  }
});
