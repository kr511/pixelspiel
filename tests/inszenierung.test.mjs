import test from "node:test";
import assert from "node:assert/strict";
import { STORY_EVENTS } from "../game/timeline.ts";
import { REACTIONS } from "../game/reactions.ts";
import { ENTITIES, PLACES } from "../game/story.ts";
import { REST_SPOTS } from "../game/day.ts";
import { routineEntities } from "../game/routines.ts";
import { portraitIdForSpeaker } from "../game/dialogue.ts";

const choiceSteps = STORY_EVENTS.flatMap(event => (event.steps ?? []).map((step, index) => ({ event, step, next: event.steps[index + 1] }))).filter(({ step }) => step.choices?.length);

test("Jede Auswahl in einer Szene bekommt eine Reaktion statt eines Echos", () => {
  assert.ok(choiceSteps.length >= 29);
  for (const { event, step, next } of choiceSteps) {
    for (const choice of step.choices) {
      const reaction = step.reactions?.[choice];
      assert.ok(reaction, `${event.id}/${step.id}: Reaktion auf „${choice}“`);
      const plain = choice.replace(/^„|“$/g, "");
      assert.notEqual(reaction.text.replace(/\.$/, ""), plain, `${event.id}/${step.id}: kein Echo`);
      assert.ok(!(reaction.speaker === "Felice" && reaction.text.includes(plain)), `${event.id}/${step.id}: Felice wiederholt ihre Wahl nicht`);
      // Felice's next line must not repeat what she just picked.
      if (next?.speaker === "Felice") assert.ok(!next.text.includes(plain), `${event.id}/${next.id}: „${plain}“ steht schon in der Auswahl`);
    }
  }
  const keys = new Set(choiceSteps.map(({ event, step }) => `${event.id}/${step.id}`));
  for (const key of Object.keys(REACTIONS)) assert.ok(keys.has(key), `${key}: verwaiste Reaktion`);
});

test("Erzählung zeigt nie Elias' Gesicht, die Schultür ihre Glocke", () => {
  for (const event of STORY_EVENTS) for (const step of event.steps ?? []) {
    if (step.speaker === "Erzählung") assert.notEqual(step.art, "elias", `${event.id}/${step.id}`);
  }
  assert.equal(portraitIdForSpeaker("Erzählung"), "narrator");
  assert.equal(portraitIdForSpeaker("Schule"), "school-bell");
});

test("Zimmer: Schulsachen nur an Alltagstagen, Foto weg von der Tür, Bett und Bettkante getrennt", () => {
  const ids = date => routineEntities("bedroom", 600, ENTITIES.bedroom, false, false, date).map(entity => entity.id);
  assert.ok(ids("2025-11-11").includes("homework"));
  assert.ok(!ids("2025-11-20").includes("homework"));
  const door = PLACES.bedroom.exits[0];
  const photo = ENTITIES.bedroom.find(entity => entity.id === "photo");
  assert.ok(Math.hypot(photo.x - door.x, photo.y - door.y) > .2, "Foto liegt nicht am Weg zur Tür");
  const bed = REST_SPOTS.find(spot => spot.id === "felice-bed"), edge = REST_SPOTS.find(spot => spot.id === "felice-bed-edge");
  assert.ok(Math.hypot(bed.approach.x - edge.approach.x, bed.approach.y - edge.approach.y) > .08, "Hinlegen und Bettkante liegen auseinander");
});

test("Szenen erkennen wörtlich zitierte echte Nachrichten", async () => {
  const { originalTime } = await import("../game/timeline.ts");
  const newYear = STORY_EVENTS.find(event => event.id === "new-year-2026");
  assert.equal(originalTime("new-year-2026", newYear.steps[1].text), "00:00");
  assert.equal(originalTime("new-year-2026", newYear.steps[0].text), undefined);
});
