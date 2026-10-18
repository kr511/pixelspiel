import test from "node:test";
import assert from "node:assert/strict";
import { GRADUATION_DAY, isSchoolDay, schoolOver } from "../game/school-calendar.ts";
import { exitOpen, routineEntities } from "../game/routines.ts";
import { ENTITIES } from "../game/story.ts";
import { BEDTIME, STORY_EVENTS, canSleep, chatTopicsForEvent, eventById, initialTimeline, schoolPending, sleepToStoryDay } from "../game/timeline.ts";
import { activityAt } from "../game/day.ts";

const ids = list => list.map(entity => entity.id);
const done = { completedAt: "2026-10-18T12:00:00Z" };
const progressUntil = id => Object.fromEntries(STORY_EVENTS.slice(0, STORY_EVENTS.findIndex(event => event.id === id)).map(event => [event.id, done]));

test("Schulkalender: jeder Werktag bis zum 26.06.2026, ohne Ferien, Feiertage und Klassenfahrt", () => {
  assert.equal(GRADUATION_DAY, "2026-06-26");
  assert.equal(isSchoolDay("2025-11-10"), true);
  assert.equal(isSchoolDay("2025-11-15"), false, "Samstag");
  assert.equal(isSchoolDay("2025-12-23"), false, "Weihnachtsferien");
  assert.equal(isSchoolDay("2026-01-06"), true);
  assert.equal(isSchoolDay("2026-04-06"), false, "Ostermontag");
  assert.equal(isSchoolDay("2026-04-21"), false, "Klassenfahrt");
  assert.equal(isSchoolDay("2026-06-26"), true, "Zeugnistag");
  assert.equal(isSchoolDay("2026-06-29"), false);
  assert.equal(schoolOver("2026-06-29"), true);
});

test("Schlafen: erst ab 20 Uhr und nie, solange heute noch eine Erinnerung wartet", () => {
  const save = initialTimeline();
  const free = { ...save, progress: Object.fromEntries(STORY_EVENTS.map(event => [event.id, done])) };
  assert.equal(canSleep({ ...free, clock: { date: "2026-07-01", minute: BEDTIME - 10 } }), false);
  assert.equal(canSleep({ ...free, clock: { date: "2026-07-01", minute: BEDTIME } }), true);
  assert.equal(canSleep({ ...free, clock: { date: "2026-07-01", minute: 60 } }), true, "nach Mitternacht");
  const next = STORY_EVENTS.find(event => event.date && !free.progress[event.id]);
  assert.equal(next, undefined);
});

test("Schlafen: Nachtszenen wecken zur Szenenzeit statt am Morgen danach", () => {
  const night = STORY_EVENTS.find(event => event.date && event.staging.start < 330);
  assert.ok(night, "es gibt eine Szene vor 5:30 Uhr");
  const save = { ...initialTimeline(), progress: progressUntil(night.id), active: null };
  const previous = new Date(`${night.date}T12:00:00Z`); previous.setUTCDate(previous.getUTCDate() - 1);
  const evening = { ...save, clock: { date: previous.toISOString().slice(0, 10), minute: 21 * 60 } };
  const woken = sleepToStoryDay(evening);
  assert.equal(woken.date, night.date);
  assert.equal(woken.minute, night.staging.start);
});

test("Schultag: Hinweis an Werktagen vor 13 Uhr, nicht nach dem Zeugnistag", () => {
  const save = { ...initialTimeline(), progress: progressUntil("klassenfahrt-anreise") };
  assert.equal(schoolPending({ ...save, clock: { date: "2026-01-07", minute: 400 } }), true);
  assert.equal(schoolPending({ ...save, clock: { date: "2026-01-07", minute: 800 } }), false);
  assert.equal(schoolPending({ ...save, clock: { date: "2026-01-10", minute: 400 } }), false, "Samstag");
  assert.equal(schoolPending({ ...save, clock: { date: "2026-07-01", minute: 400 } }), false);
});

test("Turnhalle: Zeugnisübergabe nur am 26.06.2026, danach bleiben Zeugnisse und Foto", () => {
  const gym = ENTITIES.gym;
  assert.deepEqual(routineEntities("gym", 600, gym, false, false, "2026-03-02"), []);
  assert.deepEqual(ids(routineEntities("gym", 600, gym, false, false, GRADUATION_DAY)), ids(gym));
  assert.deepEqual(ids(routineEntities("gym", 600, gym, false, false, "2026-09-01")), ["graduation-certificates", "graduation-photo"]);
  assert.deepEqual(ids(routineEntities("gym", 600, gym, false, true, "2026-03-02")), ids(gym), "das Abschlusskapitel zeigt alle");
  assert.equal(activityAt("gym", 600), "Kleine Turnhalle");
});

test("Schulhof: Freunde nur an Schultagen und nicht während des Unterrichts", () => {
  const school = ENTITIES.school;
  const friends = ["friends", "jason", "luca", "wyatt"];
  const at = (date, minute) => ids(routineEntities("school", minute, school, false, false, date));
  assert.ok(friends.some(id => at("2026-01-07", 800).includes(id)), "nach der Schule");
  assert.ok(friends.every(id => !at("2026-01-07", 600).includes(id)), "im Unterricht");
  assert.ok(friends.every(id => !at("2026-01-10", 800).includes(id)), "Samstag");
  assert.ok(friends.every(id => !at("2026-08-03", 800).includes(id)), "nach dem Abschluss");
});

test("Weihnachtsmarkt nur vom 06.12. bis 26.12.2025", () => {
  assert.equal(exitOpen("christmasmarket", "2025-12-05", "zoerbig", {}), false);
  assert.equal(exitOpen("christmasmarket", "2025-12-06", "zoerbig", {}), true);
  assert.equal(exitOpen("christmasmarket", "2025-12-26", "zoerbig", {}), true);
  assert.equal(exitOpen("christmasmarket", "2026-03-10", "zoerbig", {}), false);
});

test("Klassenfahrt: Der Reisebus fährt erst mit der Heimreise-Szene", () => {
  const during = { "klassenfahrt-anreise": done, "klassenfahrt-hotelabend": done };
  assert.equal(exitOpen("zoerbig", "2026-04-24", "hotel", during), false);
  assert.equal(exitOpen("zoerbig", "2026-04-25", "hotel", { ...during, "klassenfahrt-heimreise": done }), true);
});

test("Chat-Themen kommen in der Reihenfolge, in der sie geschrieben wurden", () => {
  const start = time => time < "05:00" ? `~${time}` : time;
  for (const event of STORY_EVENTS.filter(event => event.scene === "chat")) {
    const times = chatTopicsForEvent(event).map(topic => topic.lines[0]?.time).filter(Boolean).map(start);
    assert.deepEqual(times, [...times].sort(), event.id);
  }
  assert.deepEqual(chatTopicsForEvent(eventById("chat-2025-11-15")).map(topic => topic.lines[0].time), ["20:02", "00:37", "00:56"]);
});
