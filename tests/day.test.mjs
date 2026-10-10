import test from "node:test";
import assert from "node:assert/strict";
import { ACTION_MINUTES, REST_SPOTS, TRAVEL_MINUTES, activityAt, advanceClock, clockText, initialDay, parseDay, seasonalLight, sleepUntilMorning } from "../game/day.ts";
import { canWalk } from "../game/story.ts";

const start = initialDay(new Date(2026, 9, 6));

test("Start um 5 Uhr; Aktionen kosten 10 und Ortswechsel 30 Minuten", () => {
  assert.equal(start.minute, 300);
  assert.equal(start.date, "2026-10-06");
  let next = advanceClock(start, ACTION_MINUTES);
  assert.equal(next.save.minute, 310);
  next = advanceClock(next.save, TRAVEL_MINUTES);
  assert.equal(clockText(next.save.minute), "5:40");
  assert.deepEqual(next.notices, []);
});

test("Alle überschrittenen Hinweiszeiten werden einmal erfasst, auch bei Unterricht bis 13 Uhr", () => {
  const next = advanceClock({ ...start, minute: 435 }, 345);
  assert.deepEqual(next.notices.map(n => n.minute), [480, 720]);
  assert.equal(next.save.minute, 780);
  assert.deepEqual(advanceClock(next.save, 0).notices, []);
  assert.equal(activityAt("school", 435), "Schule · Unterrichtszeit");
  assert.equal(activityAt("school", 779), "Schule · Unterrichtszeit");
  assert.equal(activityAt("school", 780), "Schule · Schulhof");
  assert.equal(activityAt("range", 900), "Schießen · Gölzau");
});

test("Ein langer wacher Tag enthält 8, 12, 15, 18, 21 und 24 Uhr; Mitternacht wechselt Datum", () => {
  const next = advanceClock(start, 1140);
  assert.deepEqual(next.notices.map(n => n.minute), [480, 720, 900, 1080, 1260, 1440]);
  assert.equal(clockText(next.notices.at(-1).minute), "24:00");
  assert.equal(next.notices.at(-1).date, "2026-10-06");
  assert.equal(next.save.date, "2026-10-07");
  assert.equal(next.save.minute, 0);
  assert.equal(next.save.day, 2);
  assert.deepEqual(advanceClock(next.save, 10).notices, []);
});

test("Schlaf vor 21 Uhr überspringt den Abend; Schlaf nach Mitternacht führt zum nächsten 5 Uhr", () => {
  const next = sleepUntilMorning({ ...start, minute: 1200 });
  assert.equal(next.minute, 300);
  assert.equal(next.day, 2);
  assert.equal(next.date, "2026-10-07");
  assert.deepEqual(advanceClock(next, 10).notices, []);
  const afterMidnight = sleepUntilMorning({ ...next, minute: 40 });
  assert.equal(afterMidnight.date, next.date);
  assert.equal(afterMidnight.day, next.day);
  assert.equal(afterMidnight.minute, 300);
  const newYear = sleepUntilMorning({ ...start, date: "2026-12-31", minute: 1320 });
  assert.equal(newYear.date, "2027-01-01");
});

test("Gewählte Jahreszeit bleibt gespeichert und beeinflusst die Länge des Tages", () => {
  const summer = { ...start, season: "Sommer" };
  assert.deepEqual(parseDay(JSON.stringify(summer)), summer);
  assert.equal(sleepUntilMorning(summer).season, "Sommer");
  assert.equal(seasonalLight("Sommer", 1200).daylight, 1);
  assert.equal(seasonalLight("Winter", 1200).daylight, 0);
  assert.equal(seasonalLight("Sommer", 720).daylight, 1);
  assert.equal(seasonalLight("Winter", 720).daylight, 1);
  assert.equal(seasonalLight("Sommer", 0).daylight, 0);
  assert.equal(seasonalLight("Winter", 0).daylight, 0);
  for (const bad of ["broken", "null", JSON.stringify({ ...start, minute: 1440 }), JSON.stringify({ ...start, season: "unknown" }), JSON.stringify({ ...start, date: "2026-02-31" }), JSON.stringify({ ...start, version: 2 })]) assert.throws(() => parseDay(bad));
});

test("Jede Ruheposition hat einen begehbaren Anlauf- und Aufstehpunkt", () => {
  for (const spot of REST_SPOTS) assert.ok(canWalk(spot.place, spot.approach.x, spot.approach.y), spot.name);
});
