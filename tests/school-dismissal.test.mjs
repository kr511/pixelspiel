import test from "node:test";
import assert from "node:assert/strict";
import { SCHOOL_END, SCHOOL_START } from "../game/day.ts";
import { canWalk, ENTITIES, PLACES } from "../game/story.ts";
import { SCHOOL_ARRIVAL, SCHOOL_ARRIVAL_IDS, SCHOOL_MORNING_ENTITIES } from "../game/school.ts";
import { advanceSchoolDismissal, schoolDismissalElapsed, schoolDismissalPupils, schoolMorningArrivals, schoolMorningElapsed, SCHOOL_BUS_DEPARTURE, SCHOOL_COURTYARD_CLOSE } from "../game/school-dismissal.ts";

const MORNING = SCHOOL_ARRIVAL + 30;
const centerOf = group => ({ x: group.reduce((sum, p) => sum + p.x, 0) / group.length, y: group.reduce((sum, p) => sum + p.y, 0) / group.length });

test("Schüler kommen nach 13 Uhr gruppenweise nacheinander aus dem Schuleingang", () => {
  assert.deepEqual(schoolDismissalPupils("school", SCHOOL_END - 1, 60), []);
  const first = schoolDismissalPupils("school", SCHOOL_END, 0);
  assert.equal(first.length, 1);
  const door = ENTITIES.school.find(entity => entity.id === "school-door");
  assert.deepEqual(first[0].actor.position, { x: door.x, y: door.y });
  const second = schoolDismissalPupils("school", SCHOOL_END, .5);
  assert.equal(second.length, 2);
  assert.ok(second[0].actor.position.y > door.y, "Der erste Schüler läuft vom Eingang weg");
  assert.deepEqual(second[1].actor.position, { x: door.x, y: door.y });
});

test("Zehn Schüler bleiben in drei Gruppen auf dem Hof, zehn warten in vier Gruppen am Bus", () => {
  const courtyard = schoolDismissalPupils("school", SCHOOL_END, 60);
  const bus = schoolDismissalPupils("zoerbig", SCHOOL_END, 60);
  assert.equal(courtyard.length, 10);
  assert.equal(bus.length, 10);
  const stop = PLACES.zoerbig.exits.find(exit => exit.to === "bus");
  for (const pupil of courtyard) {
    assert.equal(pupil.destination, "courtyard");
    assert.equal(pupil.actor.moving, false);
    assert.ok(pupil.entity.text.includes("Hof"));
  }
  for (const pupil of bus) {
    assert.equal(pupil.destination, "bus");
    assert.equal(pupil.actor.moving, false);
    assert.ok(Math.hypot(pupil.entity.x - stop.x, pupil.entity.y - stop.y) < .3);
    assert.ok(pupil.entity.text.includes("warten"));
  }
  assert.equal(new Set([...courtyard, ...bus].map(pupil => pupil.entity.id)).size, 20);
  for (const pupils of [courtyard, bus]) for (const a of pupils) for (const b of pupils) {
    if (a !== b) assert.ok(Math.hypot(a.entity.x - b.entity.x, a.entity.y - b.entity.y) > .030, `${a.entity.id} und ${b.entity.id} stehen nicht ineinander`);
  }
  for (const [pupils, groups] of [[courtyard, 3], [bus, 4]]) {
    const byGroup = Map.groupBy(pupils, pupil => pupil.entity.id.replace(/-\d$|\d$/, ""));
    assert.equal(byGroup.size, groups);
    for (const members of byGroup.values()) {
      const center = centerOf(members.map(member => member.entity));
      for (const { entity } of members) {
        const distances = members.filter(other => other.entity.id !== entity.id).map(other => Math.hypot(other.entity.x - entity.x, other.entity.y - entity.y));
        assert.ok(Math.min(...distances) < .047, `${entity.id}: auch nach Schulschluss direkt neben einem Gesprächspartner`);
        assert.ok(Math.max(...distances) < .075, `${entity.id}: die ganze Gruppe bleibt kompakt`);
        assert.ok(Math.hypot(entity.x - center.x, entity.y - center.y) < .06, `${entity.id} steht in seiner Gruppe`);
        assert.equal(entity.facing, center.x > entity.x ? "right" : "left", `${entity.id} schaut zur Mitte`);
      }
    }
  }
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
  assert.equal(visited.size, 30, "Alle zwanzig laufen über den Hof, die zehn Busfahrer zusätzlich über den Markt");
  for (const [key, frames] of visited) assert.ok(frames.has(1) && frames.has(2), `${key}: Laufanimation`);
});

test("Spätere Besuche setzen den Schulschluss fort; ein neuer Tag beginnt wieder am Eingang", () => {
  let state = { date: "2025-11-10", elapsed: 0 };
  for (let i = 0; i < 600; i++) state = advanceSchoolDismissal(state, "2025-11-10", SCHOOL_END, .1);
  const elapsed = schoolDismissalElapsed(state, "2025-11-10", SCHOOL_END);
  assert.equal(schoolDismissalPupils("school", SCHOOL_END, elapsed).length, 10);
  assert.equal(schoolDismissalPupils("zoerbig", SCHOOL_END, elapsed).length, 10);
  const late = schoolDismissalElapsed({ date: "2025-11-10", elapsed: 0 }, "2025-11-10", SCHOOL_END + 30);
  assert.equal(schoolDismissalPupils("zoerbig", SCHOOL_END + 30, late).length, 10);
  assert.equal(schoolDismissalElapsed(state, "2025-11-11", SCHOOL_END), 0);
  assert.equal(schoolDismissalPupils("school", SCHOOL_END, 0).length, 1);
  assert.deepEqual(schoolDismissalPupils("zoerbig", SCHOOL_BUS_DEPARTURE, 60), []);
  assert.equal(schoolDismissalPupils("school", SCHOOL_BUS_DEPARTURE, 60).length, 10);
  assert.deepEqual(schoolDismissalPupils("school", SCHOOL_COURTYARD_CLOSE, 60), []);
});

test("Morgens kommen drei Schüler vom Markt und schließen sich ihrer Gruppe an", () => {
  assert.equal(schoolMorningArrivals("school", MORNING, 0).length + schoolMorningArrivals("zoerbig", MORNING, 0).length, 0, "Zuerst ist niemand unterwegs");
  assert.deepEqual(schoolMorningArrivals("school", MORNING, 60).map(pupil => pupil.entity.id).sort(), [...SCHOOL_ARRIVAL_IDS].sort());
  assert.deepEqual(schoolMorningArrivals("zoerbig", MORNING, 60), [], "Am Ende stehen sie auf dem Schulhof");
  for (const pupil of schoolMorningArrivals("school", MORNING, 60)) {
    const home = SCHOOL_MORNING_ENTITIES.find(entity => entity.id === pupil.entity.id);
    assert.deepEqual([pupil.entity.x, pupil.entity.y, pupil.entity.facing], [home.x, home.y, home.facing]);
    assert.equal(pupil.actor.moving, false);
  }
  const walking = new Map();
  for (let elapsed = 0; elapsed <= 60; elapsed += .05) {
    for (const place of ["zoerbig", "school"]) {
      for (const { entity, actor } of schoolMorningArrivals(place, MORNING, elapsed)) {
        assert.ok(canWalk(place, entity.x, entity.y), `${entity.id}: ${place}`);
        if (actor.moving) walking.set(`${place}:${entity.id}`, (walking.get(`${place}:${entity.id}`) ?? new Set()).add(actor.frame));
      }
    }
  }
  assert.equal(walking.size, 6, "Jeder läuft erst über den Markt, dann über den Hof");
  for (const frames of walking.values()) assert.ok(frames.has(1) && frames.has(2));
});

test("Die Ankunft am Morgen läuft in Echtzeit, beginnt jeden Tag neu und endet mit dem Unterricht", () => {
  let state = { date: "2025-11-10", elapsed: 0 };
  assert.equal(schoolMorningElapsed(state, "2025-11-10", MORNING), 0);
  state = advanceSchoolDismissal(state, "2025-11-10", MORNING, 5);
  assert.equal(schoolMorningElapsed(state, "2025-11-10", MORNING), 5);
  assert.equal(schoolMorningElapsed(state, "2025-11-11", MORNING), 0);
  assert.equal(schoolMorningElapsed(state, "2025-11-10", SCHOOL_START), 0, "Nach Unterrichtsbeginn gibt es keine Ankunft mehr");
  assert.equal(advanceSchoolDismissal(state, "2025-11-10", SCHOOL_START, 5), state);
  for (let i = 0; i < 1000; i++) state = advanceSchoolDismissal(state, "2025-11-10", MORNING, 1);
  assert.equal(schoolMorningElapsed(state, "2025-11-10", MORNING), 60);
  assert.equal(advanceSchoolDismissal(state, "2025-11-10", MORNING, 1), state, "Ohne Änderung bleibt der Zustand derselbe");
  assert.deepEqual(schoolMorningArrivals("school", SCHOOL_START, 60), []);
});

test("Alle stehen in klar getrennten Gruppen: morgens, nach der Schule auf dem Hof und am Markt", () => {
  const friends = ENTITIES.school.filter(entity => ["friends", "jason", "luca", "wyatt"].includes(entity.id));
  const groupOf = id => friends.some(friend => friend.id === id) ? "elena" : ["school-elias", "school-paul", "school-justin"].includes(id) ? "elias" : id.replace(/-\d+$/, "");
  const scenes = {
    morning: [...SCHOOL_MORNING_ENTITIES, ...friends],
    courtyard: [...schoolDismissalPupils("school", SCHOOL_END + 20, 60).map(pupil => pupil.entity), ...friends],
    market: schoolDismissalPupils("zoerbig", SCHOOL_END + 20, 60).map(pupil => pupil.entity),
  };
  for (const [scene, people] of Object.entries(scenes)) {
    for (const [group, members] of Map.groupBy(people, person => groupOf(person.id))) {
      assert.ok(members.length >= 2, `${scene}: ${group} steht nicht allein`);
      const spacing = Math.max(...members.map(a => Math.min(...members.filter(b => b !== a).map(b => Math.hypot(a.x - b.x, a.y - b.y)))));
      const others = people.filter(person => groupOf(person.id) !== group);
      const gap = Math.min(...members.flatMap(a => others.map(b => Math.hypot(a.x - b.x, a.y - b.y))));
      assert.ok(gap >= Math.max(.1, spacing * 1.5), `${scene}: ${group} braucht Abstand zur nächsten Gruppe (${gap.toFixed(3)} bei ${spacing.toFixed(3)} innen)`);
    }
  }
});

test("Keine stehende Gruppe wird von Baumkronen oder Gebäuden verdeckt", async () => {
  const { SCENE_GRAPHICS } = await import("../game/graphics.ts");
  const contours = (place, winter) => SCENE_GRAPHICS[place].foreground.map(layer => {
    const path = winter ? layer.winterPath ?? layer.path : layer.path;
    const rings = path
      ? path.split("Z").filter(Boolean).map(ring => {
        const values = ring.match(/-?\d+(?:\.\d+)?/g).map(Number);
        return Array.from({ length: values.length / 2 }, (_, index) => [values[index * 2] / 100, values[index * 2 + 1] / 100]);
      })
      : [[...layer.clip.matchAll(/([\d.]+)% ([\d.]+)%/g)].map(match => [+match[1] / 100, +match[2] / 100])];
    return { depth: Math.round(layer.depth), rings };
  });
  // All rings toggle one parity flag, matching the evenodd SVG clipping rule.
  const inside = (x, y, rings) => {
    let hit = false;
    for (const points of rings) {
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [xi, yi] = points[i], [xj, yj] = points[j];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) hit = !hit;
      }
    }
    return hit;
  };
  // Head and upper body of a standing figure; a layer only covers people standing behind its depth.
  const hidden = (layers, person) => layers.some(layer => Math.round(person.y * 100) < layer.depth && [-.015, 0, .015].some(dx => [-.06, -.045, -.03].some(dy => inside(person.x + dx, person.y + dy, layer.rings))));
  const friends = ENTITIES.school.filter(entity => ["friends", "jason", "luca", "wyatt"].includes(entity.id));
  for (const [place, people] of [["school", [...SCHOOL_MORNING_ENTITIES, ...friends]], ["school", schoolDismissalPupils("school", SCHOOL_END + 20, 60).map(pupil => pupil.entity)], ["zoerbig", schoolDismissalPupils("zoerbig", SCHOOL_END + 20, 60).map(pupil => pupil.entity)]]) {
    for (const winter of [false, true]) {
      const layers = contours(place, winter);
      for (const person of people) assert.ok(!hidden(layers, person), `${place}: ${person.id} steht unter einer Baumkrone${winter ? " im Winter" : ""}`);
    }
  }
});
