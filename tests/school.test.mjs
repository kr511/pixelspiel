import test from "node:test";
import assert from "node:assert/strict";
import { SCHOOL_START } from "../game/day.ts";
import { ENTITIES, SPAWNS, canWalk } from "../game/story.ts";
import { walkingRoute } from "../game/actors.ts";
import { eliasPresent, routineEntities } from "../game/routines.ts";
import { SCHOOL_ARRIVAL, SCHOOL_ELIAS_ID, SCHOOL_MORNING_ENTITIES } from "../game/school.ts";

test("Vor dem Unterricht warten mehrere Gruppen und Elias mit Paul und Justin auf dem Hof", () => {
  for (const minute of [SCHOOL_ARRIVAL, 6 * 60 + 30, SCHOOL_START - 1]) {
    const pupils = routineEntities("school", minute, ENTITIES.school).filter(entity => entity.kind === "person");
    assert.equal(pupils.length, 13);
    for (const name of ["Elena", "Jason", "Luca", "Wyatt", "Elias", "Paul", "Justin"]) {
      assert.ok(pupils.some(entity => entity.name === name), `${name} um ${minute}`);
    }
    const elias = pupils.find(entity => entity.id === SCHOOL_ELIAS_ID);
    for (const id of ["school-paul", "school-justin"]) {
      const friend = pupils.find(entity => entity.id === id);
      assert.ok(Math.hypot(friend.x - elias.x, friend.y - elias.y) < .15);
    }
    assert.ok(pupils.filter(entity => entity.id.startsWith("school-pupil-left-")).length === 3);
    assert.ok(pupils.filter(entity => entity.id.startsWith("school-pupil-right-")).length === 3);
  }
});

test("Morgengruppen erscheinen ab 6 Uhr und gehen um 7:15 in den Unterricht", () => {
  assert.equal(routineEntities("school", SCHOOL_ARRIVAL - 1, ENTITIES.school).filter(entity => entity.kind === "person").length, 0);
  for (const minute of [SCHOOL_START, 13 * 60]) {
    assert.deepEqual(routineEntities("school", minute, ENTITIES.school).filter(entity => entity.kind === "person").map(entity => entity.name).sort(), ["Elena", "Jason", "Luca", "Wyatt"]);
  }
  const accompanying = routineEntities("school", SCHOOL_START, ENTITIES.school, true);
  assert.ok(accompanying.some(entity => entity.id === SCHOOL_ELIAS_ID));
  assert.ok(!accompanying.some(entity => entity.id === "school-paul"));
  assert.equal(routineEntities("school", 18 * 60, ENTITIES.school).filter(entity => entity.kind === "person").length, 0);
  assert.equal(eliasPresent("home", () => false), false, "Die Schule schaltet Elias zu Hause nicht vorzeitig frei");
});

test("Alle Morgengruppen stehen auf begehbarem Pflaster und sind vom Hofeingang erreichbar", () => {
  for (const pupil of SCHOOL_MORNING_ENTITIES) {
    assert.ok(canWalk("school", pupil.x, pupil.y), pupil.id);
    const route = [SPAWNS.school, ...walkingRoute("school", SPAWNS.school, pupil)];
    assert.ok(route.length > 1, pupil.id);
    assert.deepEqual(route.at(-1), pupil);
    for (let i = 1; i < route.length; i++) {
      const a = route[i - 1], b = route[i];
      const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / .005));
      for (let step = 0; step <= steps; step++) {
        assert.ok(canWalk("school", a.x + (b.x - a.x) * step / steps, a.y + (b.y - a.y) * step / steps), pupil.id);
      }
    }
  }
});
