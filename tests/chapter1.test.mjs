import test from "node:test";
import assert from "node:assert/strict";
import { PLACES } from "../game/story.ts";
import { anukPresent, eliasPresent } from "../game/routines.ts";

test("Anuk gibt es zu Beginn der Geschichte noch nicht", () => {
  assert.equal(anukPresent(() => true), false, "ohne datierte Ankunft erscheint Anuk nicht in der freien Welt");
});
import { calendarPages, weekday } from "../game/timeline.ts";

test("Elias erscheint außerhalb von Szenen erst, wenn die Geschichte ihn dorthin gebracht hat", () => {
  const done = ids => id => ids.includes(id);
  for (const place of Object.keys(PLACES)) assert.equal(eliasPresent(place, done([])), false, `vor dem ersten Treffen: ${place}`);
  const afterMeeting = done(["radegast-chocolate"]);
  assert.ok(eliasPresent("bus", afterMeeting));
  for (const place of ["bedroom", "home", "kitchen", "garden", "eliasroom", "christmasmarket"]) assert.equal(eliasPresent(place, afterMeeting), false, place);
  const afterChristmas = done(["radegast-chocolate", "first-kiss-christmas"]);
  for (const place of ["bedroom", "home", "kitchen", "garden"]) assert.ok(eliasPresent(place, afterChristmas), place);
});

test("Kalenderblätter: kurze Sprünge zeigen jeden Tag, lange Sprünge eine Lücke; Wochentage stimmen", () => {
  assert.deepEqual(calendarPages("2025-11-12", "2025-11-13"), ["2025-11-12", "2025-11-13"]);
  assert.deepEqual(calendarPages("2025-11-01", "2025-11-13"), ["2025-11-01", "2025-11-02", null, "2025-11-12", "2025-11-13"]);
  assert.deepEqual(calendarPages("2025-11-30", "2025-12-01"), ["2025-11-30", "2025-12-01"]);
  assert.equal(weekday("2025-11-01"), "Samstag");
  assert.equal(weekday("2025-11-19"), "Mittwoch");
  assert.equal(weekday("2026-11-02"), "Montag");
});
