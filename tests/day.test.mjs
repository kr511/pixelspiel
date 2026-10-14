import test from "node:test";
import assert from "node:assert/strict";
import { ACTION_MINUTES, REST_SPOTS, SCHOOL_START, TRAVEL_MINUTES, WAKE_MINUTE, activityAt, advanceClock, clockText, initialDay, nightShade, parseDay, seasonalLight, sleepUntilMorning, travelMinutes } from "../game/day.ts";
import { canWalk } from "../game/story.ts";

const start = initialDay(new Date(2026, 9, 6));

test("Start um 5:30 Uhr; Aktionen kosten 10 Minuten, Ortswechsel je nach Strecke", () => {
  assert.equal(start.minute, 330);
  assert.equal(start.minute, WAKE_MINUTE);
  assert.equal(start.date, "2026-10-06");
  let next = advanceClock(start, ACTION_MINUTES);
  assert.equal(next.save.minute, 340);
  next = advanceClock(next.save, travelMinutes("bedroom", "home"));
  assert.equal(clockText(next.save.minute), "5:45");
  assert.deepEqual(next.notices, []);
});

test("Wegzeiten sind symmetrisch und der Schulweg ist vor den Schülergruppen zu schaffen", () => {
  assert.equal(travelMinutes("bus", "radegast"), travelMinutes("radegast", "bus"));
  assert.equal(travelMinutes("bedroom", "school"), TRAVEL_MINUTES);
  const route = ["bedroom", "home", "radegast", "bus", "zoerbig", "school"];
  const total = route.slice(1).reduce((sum, place, i) => sum + travelMinutes(route[i], place), 0);
  assert.equal(total, 50);
  // Aufstehen um 5:30, danach noch Frischmachen (15 Min): Ankunft vor Unterrichtsbeginn
  assert.ok(WAKE_MINUTE + 15 + total < SCHOOL_START);
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
  const next = advanceClock(start, 1440 - WAKE_MINUTE);
  assert.deepEqual(next.notices.map(n => n.minute), [480, 720, 900, 1080, 1260, 1440]);
  assert.equal(clockText(next.notices.at(-1).minute), "24:00");
  assert.equal(next.notices.at(-1).date, "2026-10-06");
  assert.equal(next.save.date, "2026-10-07");
  assert.equal(next.save.minute, 0);
  assert.equal(next.save.day, 2);
  assert.deepEqual(advanceClock(next.save, 10).notices, []);
});

test("Schlaf vor 21 Uhr überspringt den Abend; Schlaf nach Mitternacht führt zum nächsten 5:30 Uhr", () => {
  const next = sleepUntilMorning({ ...start, minute: 1200 });
  assert.equal(next.minute, 330);
  assert.equal(next.day, 2);
  assert.equal(next.date, "2026-10-07");
  assert.deepEqual(advanceClock(next, 10).notices, []);
  const afterMidnight = sleepUntilMorning({ ...next, minute: 40 });
  assert.equal(afterMidnight.date, next.date);
  assert.equal(afterMidnight.day, next.day);
  assert.equal(afterMidnight.minute, 330);
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

test("Alle vier Jahreszeiten bieten helle Tage, dunkle Nächte und weiche Übergänge", () => {
  for (const [season, dawn, dusk] of [["Frühling", 360, 1200], ["Sommer", 285, 1290], ["Herbst", 420, 1080], ["Winter", 480, 990]]) {
    assert.equal(seasonalLight(season, 720).daylight, 1, `${season}: Mittag`);
    assert.equal(seasonalLight(season, 1380).daylight, 0, `${season}: Nacht`);
    for (const minute of [dawn, dusk]) assert.equal(seasonalLight(season, minute).daylight, .5, `${season}: Dämmerung`);
    assert.equal(seasonalLight(season, dawn - 45).daylight, 0);
    assert.equal(seasonalLight(season, dawn + 45).daylight, 1);
    assert.equal(seasonalLight(season, dusk - 45).daylight, 1);
    assert.equal(seasonalLight(season, dusk + 45).daylight, 0);
  }
});

test("Nachts ist es im Winter dunkler als im Sommer, tagsüber bleibt alles hell", () => {
  for (const place of ["garden", "school", "zoerbig", "bedroom"]) {
    const night = ["Sommer", "Frühling", "Herbst", "Winter"].map(season => nightShade(place, season, 0));
    assert.ok(night[0] < night[1] && night[1] < night[2] && night[2] < night[3], place);
    assert.ok(night[3] <= .9);
    for (const season of ["Sommer", "Winter"]) assert.equal(nightShade(place, season, 1), 0);
  }
  assert.ok(nightShade("garden", "Winter", 0) > nightShade("bedroom", "Winter", 0));
});

test("Außenorte der Klassenfahrt werden nachts wie Stadtorte dunkel, nicht wie Innenräume", () => {
  for (const place of ["parliament", "europapark"]) assert.equal(nightShade(place, "Frühling", 0), nightShade("zoerbig", "Frühling", 0), place);
  assert.ok(nightShade("hotel", "Frühling", 0) < nightShade("europapark", "Frühling", 0));
});
