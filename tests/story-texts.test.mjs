import test from "node:test";
import assert from "node:assert/strict";
import { STORY_EVENTS, eventById } from "../game/timeline.ts";

const steps = () => STORY_EVENTS.flatMap(event => (event.steps ?? []).map(step => ({ event: event.id, ...step })));

test("Nur Elias trägt sein eigenes Porträt", () => {
  for (const step of steps()) if (step.speaker !== "Elias") assert.notEqual(step.art, "elias", `${step.event}/${step.id}: ${step.speaker}`);
});

test("Wer eine Frage stellt, beantwortet sie nicht selbst per Auswahl", () => {
  for (const step of steps()) if (step.speaker === "Felice" && step.choices?.length) assert.ok(!step.text.trim().endsWith("?"), `${step.event}/${step.id}: ${step.text}`);
});

test("Datierte Erinnerungen haben jeweils eine eigene Beschreibung", () => {
  const seen = new Map();
  for (const event of STORY_EVENTS.filter(event => event.date)) {
    assert.ok(!seen.has(event.description), `${event.id} hat dieselbe Beschreibung wie ${seen.get(event.description)}`);
    seen.set(event.description, event.id);
  }
});

test("Das Finale erinnert sich richtig: Felice schrieb die Punkte, Elias „Ich liebe dich auch“", () => {
  const finale = eventById("our-story-finale").steps.map(step => step.text).join(" ");
  assert.match(finale, /Deine drei Reihen Punkte und mein „Ich liebe dich auch“/);
  assert.doesNotMatch(finale, /dein „Ich liebe dich auch“/);
  assert.doesNotMatch(finale, /Wochenenden bei dir/);
});

test("Elias spricht über seine eigenen Eltern", () => {
  const weekend = eventById("elias-room-weekend").steps.map(step => step.text).join(" ");
  assert.match(weekend, /Meine Eltern lieben dich/);
});
