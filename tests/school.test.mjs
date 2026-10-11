import test from "node:test";
import assert from "node:assert/strict";
import { SCHOOL_START } from "../game/day.ts";
import { ENTITIES, SPAWNS, canWalk } from "../game/story.ts";
import { walkingRoute } from "../game/actors.ts";
import { eliasPresent, routineEntities } from "../game/routines.ts";
import { SCHOOL_ADDITIONAL_GROUPS, SCHOOL_ARRIVAL, SCHOOL_ARRIVAL_IDS, SCHOOL_ELIAS_ID, SCHOOL_MORNING_ENTITIES } from "../game/school.ts";
import { schoolMorningArrivals } from "../game/school-dismissal.ts";

test("Vor dem Unterricht stehen 27 Figuren in mehreren Gruppen auf dem Hof, drei davon kommen später vom Markt", () => {
  for (const minute of [SCHOOL_ARRIVAL, 6 * 60 + 30, SCHOOL_START - 1]) {
    const standing = routineEntities("school", minute, ENTITIES.school).filter(entity => entity.kind === "person");
    assert.equal(standing.length, 24, "Die Nachzügler stehen nicht von Anfang an da");
    assert.equal(schoolMorningArrivals("school", minute, 0).length, 0);
    const arrived = schoolMorningArrivals("school", minute, 60).map(pupil => pupil.entity);
    assert.deepEqual(arrived.map(entity => entity.id).sort(), [...SCHOOL_ARRIVAL_IDS].sort());
    const pupils = [...standing, ...arrived];
    assert.equal(pupils.length, 27);
    for (const name of ["Elena", "Jason", "Luca", "Wyatt"]) {
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

test("Fünf weitere Gruppen mit zwei bis vier Schülern stehen zusammen und halten Wege frei", () => {
  assert.equal(SCHOOL_ADDITIONAL_GROUPS.length, 5);
  for (const group of SCHOOL_ADDITIONAL_GROUPS) {
    assert.ok(group.length >= 2 && group.length <= 4);
    for (const member of group) {
      assert.equal(member.ambient, true);
      assert.ok(group.every(other => Math.hypot(other.x - member.x, other.y - member.y) < .15));
    }
  }
  assert.equal(new Set(SCHOOL_MORNING_ENTITIES.map(entity => entity.id)).size, SCHOOL_MORNING_ENTITIES.length);
  for (const pupil of SCHOOL_MORNING_ENTITIES) {
    assert.ok(Math.hypot(pupil.x - SPAWNS.school.x, pupil.y - SPAWNS.school.y) > .10);
    assert.ok(Math.hypot(pupil.x - .50, pupil.y - .28) > .08, "Der Schuleingang bleibt frei");
    for (const other of SCHOOL_MORNING_ENTITIES) {
      if (other.id !== pupil.id) assert.ok(Math.hypot(pupil.x - other.x, pupil.y - other.y) > .045, `${pupil.id} und ${other.id}`);
    }
  }
});

test("Felice kennt Elias, Paul und Justin auf dem frühen Schulhof noch nicht", () => {
  for (const id of [SCHOOL_ELIAS_ID, "school-paul", "school-justin"]) {
    const pupil = SCHOOL_MORNING_ENTITIES.find(entity => entity.id === id);
    assert.equal(pupil.ambient, true, "Unbekannte Schüler haben keine Namensbox oder Gesprächsaufforderung");
    assert.equal(pupil.name, "Schüler");
    assert.ok(!/Elias|Paul|Justin|Felice/.test(pupil.text));
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

test("Elena, Luca, Jason und Wyatt stehen im Kreis und schauen zur Mitte", () => {
  const four = ["friends", "jason", "luca", "wyatt"].map(id => ENTITIES.school.find(entity => entity.id === id));
  const center = { x: four.reduce((sum, member) => sum + member.x, 0) / 4, y: four.reduce((sum, member) => sum + member.y, 0) / 4 };
  const radii = four.map(member => Math.hypot(member.x - center.x, member.y - center.y)); // Elena's circle is round, the others are stretched
  for (const radius of radii) assert.ok(Math.abs(radius - radii[0]) < .005 && radius > .04 && radius < .08, "gleicher Abstand zur Mitte");
  for (const member of four) assert.equal(member.facing, center.x > member.x ? "right" : "left", `${member.name} schaut seitlich zur Mitte, nicht in die Kamera`);
  for (const member of four) assert.ok(canWalk("school", member.x, member.y), member.name);
});

test("Das Schild \"Treffpunkt am Fenstergitter\" ist weg", () => {
  assert.ok(!ENTITIES.school.some(entity => /Treffpunkt|Gitter/.test(entity.name + entity.text)));
});

test("Die Morgengruppen stehen in Kreisen, die Schüler schauen einander an", () => {
  const groups = [...SCHOOL_ADDITIONAL_GROUPS, ...["school-pupil-left-", "school-pupil-right-"].map(prefix => SCHOOL_MORNING_ENTITIES.filter(entity => entity.id.startsWith(prefix)))];
  for (const group of groups) {
    const center = { x: group.reduce((sum, member) => sum + member.x, 0) / group.length, y: group.reduce((sum, member) => sum + member.y, 0) / group.length };
    for (const member of group) {
      assert.equal(member.facing, center.x > member.x ? "right" : "left", `${member.id} schaut seitlich zur Mitte, nicht in die Kamera`);
    }
  }
});

test("Die Schüler haben 18 verschiedene Looks, keine Gruppe hat dieselbe Grundfigur doppelt", async () => {
  const { CHARACTER_GRAPHICS } = await import("../game/graphics.ts");
  const { existsSync } = await import("node:fs");
  const pupils = SCHOOL_MORNING_ENTITIES.filter(entity => entity.art.startsWith("pupil-"));
  for (const pupil of pupils) assert.ok(CHARACTER_GRAPHICS[pupil.art], pupil.art);
  assert.ok(new Set(pupils.map(pupil => pupil.art)).size >= 18, "alle 18 Looks kommen vor");
  const groups = Map.groupBy(pupils, pupil => pupil.id.replace(/-\d$|\d$/, ""));
  // Recolored looks share face and hair shape with their base figure, so a group never mixes two of the same base.
  const base = art => `${CHARACTER_GRAPHICS[art].column},${CHARACTER_GRAPHICS[art].row}`;
  for (const [group, members] of groups) assert.equal(new Set(members.map(member => base(member.art))).size, members.length, group);
  for (const sheet of ["front", "back", "side", "side-step"]) for (const variant of [1, 2]) {
    assert.ok(existsSync(new URL(`../public/characters/neighbors-${sheet}-v07-alt${variant}.png`, import.meta.url)), `${sheet} alt${variant}`);
  }
});

test("Gleiche Grundfiguren stehen nie direkt nebeneinander, auch nicht aus verschiedenen Gruppen", async () => {
  const { CHARACTER_GRAPHICS } = await import("../game/graphics.ts");
  const { schoolDismissalPupils } = await import("../game/school-dismissal.ts");
  const base = art => `${CHARACTER_GRAPHICS[art].column},${CHARACTER_GRAPHICS[art].row}`;
  const scenes = [SCHOOL_MORNING_ENTITIES.filter(entity => entity.art.startsWith("pupil-")), ...["school", "zoerbig"].map(place => schoolDismissalPupils(place, 13 * 60 + 20, 60).map(pupil => pupil.entity))];
  for (const list of scenes) for (const a of list) for (const b of list) {
    if (a.id < b.id && base(a.art) === base(b.art)) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= .12, `${a.id} und ${b.id}`);
  }
});

test("In den Gruppen schaut niemand in die Kamera", async () => {
  const { schoolDismissalPupils } = await import("../game/school-dismissal.ts");
  const standing = [...SCHOOL_MORNING_ENTITIES, ...ENTITIES.school.filter(entity => ["friends", "jason", "luca", "wyatt"].includes(entity.id)),
    ...["school", "zoerbig"].flatMap(place => schoolDismissalPupils(place, 13 * 60 + 20, 60).map(pupil => pupil.entity))];
  for (const person of standing) assert.ok(["left", "right"].includes(person.facing), `${person.id}: ${person.facing}`);
});
