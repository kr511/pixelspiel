import test from "node:test";
import assert from "node:assert/strict";
import { beginRest, leaveRest, advanceRest, hasLeft, restPosition } from "../game/rest.ts";
import { REST_SPOTS } from "../game/day.ts";
import { ENTITIES, SPAWNS, canWalk } from "../game/story.ts";

test("Felice geht an jeden Ruheplatz und kehrt beim Aufstehen auf begehbaren Boden zurück", () => {
  for (const spot of REST_SPOTS) {
    let motion = beginRest(spot.place, spot.approach, spot);
    assert.equal(motion.phase, "entering");
    for (let i = 0; i < 1000 && motion.phase !== "resting"; i++) motion = advanceRest(spot.place, "felice", motion, 1 / 60);
    assert.equal(motion.phase, "resting", spot.id);
    assert.deepEqual(restPosition(spot, motion), spot.position);
    motion = leaveRest(spot.place, motion);
    for (let i = 0; i < 1000 && !hasLeft(motion); i++) motion = advanceRest(spot.place, "felice", motion, 1 / 60);
    assert.ok(hasLeft(motion), spot.id);
    assert.ok(canWalk(spot.place, motion.actor.position.x, motion.actor.position.y), spot.id);
  }
});

test("Elias erreicht den Nachbarplatz aus der Szene und verlässt ihn auf begehbarem Boden", () => {
  for (const spot of REST_SPOTS.filter(spot => spot.kind === "bench" || spot.kind === "chair")) {
    const native = ENTITIES[spot.place].find(entity => entity.art === "elias");
    const shift = canWalk(spot.place, spot.approach.x + .07, spot.approach.y) ? .07 : -.07;
    const companion = { ...spot, position: spot.companion, approach: { x: spot.approach.x + shift, y: spot.approach.y } };
    let motion = beginRest(spot.place, native ?? SPAWNS[spot.place], companion);
    for (let i = 0; i < 2000 && motion.phase !== "resting"; i++) motion = advanceRest(spot.place, "elias", motion, 1 / 60);
    assert.equal(motion.phase, "resting", spot.id);
    assert.deepEqual(motion.actor.position, spot.companion);
    motion = leaveRest(spot.place, motion);
    for (let i = 0; i < 1000 && !hasLeft(motion); i++) motion = advanceRest(spot.place, "elias", motion, 1 / 60);
    assert.ok(hasLeft(motion), spot.id);
    assert.ok(canWalk(spot.place, motion.actor.position.x, motion.actor.position.y), spot.id);
  }
});

test("Hinsetzen lässt sich mitten im Übergang ohne Hängenbleiben abbrechen", () => {
  for (const spot of REST_SPOTS) for (const ticks of [1, 6, 20]) {
    let motion = beginRest(spot.place, spot.approach, spot);
    for (let i = 0; i < ticks; i++) motion = advanceRest(spot.place, "felice", motion, 1 / 60);
    motion = leaveRest(spot.place, motion);
    for (let i = 0; i < 1000 && !hasLeft(motion); i++) motion = advanceRest(spot.place, "felice", motion, 1 / 60);
    assert.ok(hasLeft(motion), `${spot.id}: ${ticks}`);
    assert.ok(canWalk(spot.place, motion.actor.position.x, motion.actor.position.y));
  }
});


test("Liegen ist ausschließlich im Bett möglich, Sitzplätze und Freunde bleiben erhalten", () => {
  for (const spot of REST_SPOTS) {
    let motion = beginRest(spot.place, spot.approach, spot);
    for (let i=0;i<1000 && motion.phase!=="resting";i++) motion=advanceRest(spot.place,"felice",motion,1/60);
    assert.equal(motion.actor.pose,spot.kind==="bed"?"lying":"sitting",spot.id);
  }
  assert.ok(REST_SPOTS.some(spot=>spot.kind==="bed"));
  assert.ok(REST_SPOTS.every(spot=>!spot.name.toLowerCase().includes("decke")));
});
