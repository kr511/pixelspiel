import test from "node:test";
import assert from "node:assert/strict";
import { SCHOOL_END } from "../game/day.ts";
import { canWalk, ENTITIES, PLACES } from "../game/story.ts";
import { advanceSchoolDismissal, schoolDismissalElapsed, schoolDismissalPupils, SCHOOL_BUS_DEPARTURE, SCHOOL_COURTYARD_CLOSE } from "../game/school-dismissal.ts";

test("Schüler kommen nach 13 Uhr nacheinander aus dem Schuleingang", () => {
  assert.deepEqual(schoolDismissalPupils("school", SCHOOL_END - 1, 60), []);
  const first = schoolDismissalPupils("school", SCHOOL_END, 0);
  assert.equal(first.length, 1);
  const door = ENTITIES.school.find(entity => entity.id === "school-door");
  assert.deepEqual(first[0].actor.position, { x: door.x, y: door.y });
  const second = schoolDismissalPupils("school", SCHOOL_END, 1.6);
  assert.equal(second.length, 2);
  assert.ok(second[0].actor.position.y > door.y, "Die erste Schülerin läuft vom Eingang weg");
  assert.deepEqual(second[1].actor.position, { x: door.x, y: door.y });
});

test("Drei Schüler bleiben auf dem Hof, drei erreichen die Bushaltestelle am Markt", () => {
  const courtyard = schoolDismissalPupils("school", SCHOOL_END, 60);
  const bus = schoolDismissalPupils("zoerbig", SCHOOL_END, 60);
  assert.equal(courtyard.length, 3);
  assert.equal(bus.length, 3);
  const stop = PLACES.zoerbig.exits.find(exit => exit.to === "bus");
  for (const pupil of courtyard) {
    assert.equal(pupil.destination, "courtyard");
    assert.equal(pupil.actor.moving, false);
    assert.ok(pupil.entity.text.includes("Hof"));
  }
  for (const pupil of bus) {
    assert.equal(pupil.destination, "bus");
    assert.equal(pupil.actor.moving, false);
    assert.ok(Math.hypot(pupil.entity.x - stop.x, pupil.entity.y - stop.y) < .12);
    assert.ok(pupil.entity.text.includes("warten"));
  }
  for (const group of [courtyard, bus]) {
    for (let a = 0; a < group.length; a++) for (let b = a + 1; b < group.length; b++) {
      const first = group[a].entity, second = group[b].entity;
      const distance = Math.hypot(first.x - second.x, first.y - second.y);
      assert.ok(distance >= .032, `${first.id} und ${second.id} behalten eine eigene Standfläche`);
      assert.ok(distance <= .065, `${first.id} und ${second.id} warten zusammen`);
    }
  }
  assert.equal(new Set([...courtyard, ...bus].map(pupil => pupil.entity.id)).size, 6);
});

test("Alle Schüler laufen um die Bäume und Mauern statt durch Hindernisse", () => {
  const visited = new Map();
  for (let elapsed = 0; elapsed <= 60; elapsed += .05) {
    for (const place of ["school", "zoerbig"]) {
      for (const { entity, actor } of schoolDismissalPupils(place, SCHOOL_END, elapsed)) {
        assert.ok(canWalk(place, entity.x, entity.y), `${entity.id}: ${place} ${entity.x},${entity.y}`);
        if (actor.moving) {
          const key = `${place}:${entity.id}`;
          const frames = visited.get(key) ?? new Set();
          frames.add(actor.frame);
          visited.set(key, frames);
        }
      }
    }
  }
  assert.equal(visited.size, 9, "Alle sechs laufen über den Hof, die drei Busfahrer zusätzlich über den Markt");
  for (const [key, frames] of visited) assert.ok(frames.has(1) && frames.has(2), `${key}: Laufanimation`);
});

test("Spätere Besuche setzen den Schulschluss fort; ein neuer Tag beginnt wieder am Eingang", () => {
  let state = { date: "2025-11-10", elapsed: 0 };
  for (let i = 0; i < 600; i++) state = advanceSchoolDismissal(state, "2025-11-10", SCHOOL_END, .1);
  const elapsed = schoolDismissalElapsed(state, "2025-11-10", SCHOOL_END);
  assert.equal(schoolDismissalPupils("school", SCHOOL_END, elapsed).length, 3);
  assert.equal(schoolDismissalPupils("zoerbig", SCHOOL_END, elapsed).length, 3);
  const late = schoolDismissalElapsed({ date: "2025-11-10", elapsed: 0 }, "2025-11-10", SCHOOL_END + 30);
  assert.equal(schoolDismissalPupils("zoerbig", SCHOOL_END + 30, late).length, 3);
  assert.equal(schoolDismissalElapsed(state, "2025-11-11", SCHOOL_END), 0);
  assert.equal(schoolDismissalPupils("school", SCHOOL_END, 0).length, 1);
  assert.deepEqual(schoolDismissalPupils("zoerbig", SCHOOL_BUS_DEPARTURE, 60), []);
  assert.equal(schoolDismissalPupils("school", SCHOOL_BUS_DEPARTURE, 60).length, 3);
  assert.deepEqual(schoolDismissalPupils("school", SCHOOL_COURTYARD_CLOSE, 60), []);
});
