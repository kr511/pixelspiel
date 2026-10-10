import test from "node:test";
import assert from "node:assert/strict";
import { TARGETS, TARGET_RADIUS, recordShot, scoreShot } from "../game/memories/shooting.ts";
import { MEMORIES, nearestMemory } from "../game/memories/catalog.ts";
import { PROGRESS_KEY, completeProgress, readProgress, writeProgress } from "../game/memories/progress.ts";

test("Trefferzonen: Mitte, Ringe, Außenkante, Fehlschuss und falsche Bahn", () => {
  const target = TARGETS[0];
  assert.equal(scoreShot(target, 0).points, 10);
  assert.equal(scoreShot({ x: target.x + TARGET_RADIUS / 2, y: target.y }, 0).points, 5);
  assert.equal(scoreShot({ x: target.x + TARGET_RADIUS, y: target.y }, 0).points, 1);
  assert.equal(scoreShot({ x: target.x + TARGET_RADIUS + .1, y: target.y }, 0).points, 0);
  assert.equal(scoreShot(TARGETS[1], 0).points, 0);
  assert.equal(scoreShot({ x: NaN, y: 0 }, 0).points, 0);
});

test("Neun Schüsse wechseln alle drei Schüsse die Bahn; keine zusätzliche Munition", () => {
  let shots = [];
  for (let index = 0; index < 9; index++) shots = recordShot(shots, TARGETS[Math.floor(index / 3)]);
  assert.equal(shots.length, 9);
  assert.equal(shots.reduce((sum, shot) => sum + shot.points, 0), 90);
  assert.deepEqual(shots.map((shot) => shot.targetId), [1, 1, 1, 2, 2, 2, 3, 3, 3]);
  assert.deepEqual(recordShot(shots, TARGETS[2]), shots);
});

test("Erinnerung ist nur in Reichweite verfügbar; Hund bleibt vorbereitet", () => {
  assert.equal(nearestMemory({ x: .5, y: .7 }), undefined);
  assert.equal(nearestMemory({ x: .8, y: .59 })?.id, "goelzau-shooting");
  const dog = MEMORIES.find((memory) => memory.id === "dog-arrival");
  assert.equal(nearestMemory(dog.object.approach), undefined);
});

test("Abschluss übersteht Neustart und erneutes Spielen bewahrt Bestwert und Datum", () => {
  const map = new Map();
  const storage = { getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, value) };
  assert.deepEqual(readProgress(storage), {});
  const first = completeProgress({}, "goelzau-shooting", 60, "2026-09-26T12:00:00.000Z");
  writeProgress(storage, first);
  const reloaded = readProgress(storage);
  assert.deepEqual(reloaded, first);
  const replay = completeProgress(reloaded, "goelzau-shooting", 20, "2026-09-27T12:00:00.000Z");
  assert.equal(replay["goelzau-shooting"].bestScore, 60);
  assert.equal(replay["goelzau-shooting"].visits, 2);
  assert.equal(replay["goelzau-shooting"].completedAt, first["goelzau-shooting"].completedAt);
  assert.equal(completeProgress(replay, "goelzau-shooting", 90)["goelzau-shooting"].bestScore, 90);
  assert.equal(completeProgress({}, "goelzau-shooting", 0)["goelzau-shooting"].visits, 1);
  assert.ok(map.has(PROGRESS_KEY));
});

test("Kaputte, unbekannte oder gesperrte Spielstände werden nicht still überschrieben", () => {
  for (const value of ["{kaputt", "null", '{"version":2,"memories":{}}', '{"version":1,"memories":{"test":{"bestScore":-1}}}']) {
    assert.throws(() => readProgress({ getItem: () => value }));
  }
  assert.throws(() => readProgress({ getItem: () => { throw new Error("blocked"); } }));
  assert.throws(() => writeProgress({ setItem: () => { throw new Error("quota"); } }, {}));
});
