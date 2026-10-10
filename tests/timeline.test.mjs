import test from "node:test";
import assert from "node:assert/strict";
import { CHAPTERS, EMPTY_STORY, SPAWNS, canWalk, storyCanWalk } from "../game/story.ts";
import { initialDay } from "../game/day.ts";
import { advanceActor, standingActor, walkingRoute } from "../game/actors.ts";
import { CHAT_TOPICS, STORY_CHAPTERS, STORY_END, STORY_EVENTS, STORY_START, advanceTimelineClock, beginEvent, calendarSeason, chatTopicForEvent, completeEvent, emptyEvent, eventById, eventStatus, historicalDate, initialTimeline, jumpToNext, nextEvent, parseTimeline, sleepTimelineClock, storySeason } from "../game/timeline.ts";

const player = { x: .5, y: .7 };
const dated = STORY_EVENTS.filter(event => event.date && event.scene !== "legacy");
const finish = save => {
  const event = eventById(save.active.id);
  const cursor = event.scene === "sequence" ? event.steps.length : event.scene === "love" ? 2 : event.scene === "confession" || event.scene === "message" ? event.dialogue.length : 4;
  const state = { ...save.progress[event.id], cursor, topics: event.scene === "chat" ? ["space", "collin"] : [], topic: null };
  return completeEvent({ ...save, progress: { ...save.progress, [event.id]: state } }, event.id, false, "2026-10-08T12:00:00Z");
};
const reach = id => {
  let save = initialTimeline();
  while (nextEvent(save)?.id !== id) save = finish(beginEvent(jumpToNext(save), nextEvent(save).id, player, "front"));
  return beginEvent(jumpToNext(save), id, player, "front");
};

test("Neuer Kalender beginnt im Herbst; alle acht Kapitel haben eindeutige, konfigurierte Szenen", () => {
  const save = initialTimeline();
  assert.equal(save.clock.date, STORY_START);
  assert.equal(save.clock.minute, 300);
  assert.equal(save.clock.season, "Herbst");
  assert.deepEqual(STORY_CHAPTERS.map(chapter => chapter.number), [1,2,3,4,5,6,7,8]);
  assert.deepEqual([...new Set(dated.map(event => event.chapterNumber))], [1,2,3,4,5,6,7,8]);
  assert.equal(new Set(STORY_EVENTS.map(event => event.id)).size, STORY_EVENTS.length);
  for (const event of STORY_EVENTS) {
    for (const id of event.requires) assert.ok(eventById(id), id);
    if (event.confirmed) assert.ok(storyCanWalk(event.place, event.staging.spawn.x, event.staging.spawn.y, { pasture: event.scene === "encounter" }), `Spawn: ${event.id}`);
    assert.ok(event.dialogue.length, event.id);
    assert.ok(event.interactions.length, event.id);
    if (event.scene === "sequence") assert.ok(event.steps.length, event.id);
  }
  assert.deepEqual(CHAT_TOPICS.map(topic => topic.id), ["computers","space","philosophy","shooting","collin","future","interests"]);
});

test("Jede Hauptszene braucht Interaktionen; eine vollständige chronologische Runde erreicht das Finale", () => {
  let save = initialTimeline();
  const visited = [];
  while (nextEvent(save)) {
    const event = nextEvent(save);
    save = jumpToNext(save);
    assert.equal(eventStatus(save, event), "verfügbar", event.id);
    assert.equal(dated.filter(candidate => eventStatus(save, candidate) === "verfügbar").length, 1);
    if (event.id !== "our-story-finale") assert.equal(beginEvent(save, "our-story-finale", player, "front"), save, "gesperrte spätere Ereignisse lassen sich nicht beginnen");
    save = beginEvent(save, event.id, player, "left");
    assert.equal(completeEvent(save, event.id), save, `kein Abschluss ohne Interaktion: ${event.id}`);
    save = parseTimeline(JSON.stringify(finish(save)));
    assert.equal(eventStatus(save, event), "abgeschlossen");
    assert.equal(save.active, null);
    assert.equal(completeEvent(save, event.id), save, "Ein abgeschlossener Event löst keinen zweiten Abschluss aus");
    assert.equal(save.clock.season, calendarSeason(save.clock.date));
    visited.push(event.id);
  }
  assert.deepEqual(visited, dated.map(event => event.id));
  assert.equal(visited.at(-1), "our-story-finale");
  assert.equal(save.clock.date, STORY_END);
});

test("Alle Storyziele sind ohne Durchlaufen von Möbeln und Mauern tatsächlich zu Fuß erreichbar", () => {
  for (const event of dated.filter(event => event.scene === "sequence")) {
    let place = event.place, position = event.staging.spawn;
    for (const step of event.steps) {
      const nextPlace = step.place ?? event.place;
      if (place !== nextPlace) position = SPAWNS[nextPlace];
      place = nextPlace;
      const approaches = [];
      for (let dx = -.045; dx <= .0451; dx += .015) for (let dy = -.045; dy <= .0451; dy += .015) {
        const target = { x: step.target.x + dx, y: step.target.y + dy };
        if (Math.hypot(dx,dy) < .065 && canWalk(place, target.x, target.y)) approaches.push(target);
      }
      const routes = approaches.sort((a,b) => Math.hypot(a.x-step.target.x,a.y-step.target.y)-Math.hypot(b.x-step.target.x,b.y-step.target.y)).map(target => walkingRoute(place, position, target)).filter(route => route.length);
      assert.ok(routes.length, `${event.id}/${step.id}: begehbare Annäherung`);
      let actor = { ...standingActor(position), route: routes[0] };
      for (let tick = 0; tick < 3500 && actor.route.length; tick++) {
        actor = advanceActor(place, "story-route-check", actor, 1/60);
        assert.ok(canWalk(place, actor.position.x, actor.position.y), `${event.id}/${step.id}: Kollision`);
      }
      assert.equal(actor.route.length, 0, `${event.id}/${step.id}: Ankunft`);
      assert.ok(Math.hypot(actor.position.x - step.target.x, actor.position.y - step.target.y) < .065, `${event.id}/${step.id}: Interaktionsnähe`);
      position = actor.position;
    }
  }
});

test("Historische Kerntermine und verschränkte Novemberereignisse folgen den korrigierten Angaben", () => {
  const index = id => dated.findIndex(event => event.id === id);
  assert.equal(eventById("radegast-chocolate").date, "2025-11-16");
  assert.ok(index("chat-2025-11-15") < index("radegast-chocolate"));
  assert.ok(index("radegast-chocolate") < index("chat-2025-11-16"));
  const confession = eventById("confession-2025-11-24");
  assert.equal(confession.date, "2025-11-24");
  assert.equal(confession.staging.start, 17 * 60 + 20);
  assert.ok(confession.staging.timeConfirmed);
  assert.ok(index(confession.id) < index("chat-2025-11-24"));
  assert.ok(index("handholding-2025-11-25") < index("first-i-love-you"));
  assert.deepEqual(eventById("first-i-love-you").dialogue.map(line => [line.speaker, line.text, line.original]), [["Elias","Ich liebe dich.",true],["Felice","Ich liebe dich.",true]]);
  assert.equal(eventById("first-kiss-christmas").date, "2025-12-25");
  assert.equal(eventById("first-kiss-christmas").steps.find(step => step.animation === "kiss").place, "bedroom");
});

test("Spielgestaltung und Zukunft werden nicht zu erfundenen historischen Meilensteinen", () => {
  for (const event of dated.filter(event => event.source === "staged")) assert.match(event.description, /inszenier|Spielgestalt|Spielwelt|Alltagsszen|rekonstru|spielerisch|erfind/i, event.id);
  assert.ok(dated.filter(event => event.date > "2026-10-08").every(event => event.source === "future"));
  assert.equal(eventById("our-story-finale").steps.at(-1).text, "Unsere Geschichte ist noch lange nicht zu Ende. ❤️");
  assert.deepEqual(eventById("morning-after-2025-12-26").artifacts.map(item => item.id), ["elias-letter","folded-cranes"]);
  assert.match(eventById("morning-after-2025-12-26").artifacts[0].description, /Originaltext.*nicht/);
  for (const event of STORY_EVENTS.filter(event => event.scene === "legacy")) {
    assert.equal(event.date, null);
    assert.equal(event.confirmed, false);
  }
});

test("Spätere bestehende Spielzeit wird beim ersten Erleben und beim Wiederholen nicht zurückgedreht", () => {
  let save = initialTimeline({ ...initialDay(new Date("2026-10-08T12:00Z")), minute: 1270 });
  const clock = structuredClone(save.clock);
  save = jumpToNext(save);
  assert.deepEqual(save.clock, clock);
  const event = nextEvent(save);
  save = finish(beginEvent(save, event.id, player, "right"));
  const completedAt = save.progress[event.id].completedAt;
  assert.deepEqual(save.clock, clock);
  save = completeEvent(save, event.id, true, "2026-10-09T15:00Z");
  assert.deepEqual(save.clock, clock);
  assert.equal(save.progress[event.id].visits, 2);
  assert.equal(save.progress[event.id].completedAt, completedAt);
  assert.equal(historicalDate(event.date), "01.11.2025");
  assert.equal(completeEvent(save, "first-i-love-you", true), save, "gesperrte Erinnerungen sind nicht wiederholbar");
  assert.equal(storySeason(eventById("christmas-market-2025-12-06"), clock), "Winter", "Erinnerungsjahreszeit folgt dem historischen Datum");
});

test("Unterbrochener Chat und Tippfortschritt überstehen Neuladen; doppelte Themen zählen einmal", () => {
  const id = "chat-2025-11-13";
  let save = reach(id);
  save.progress[id] = { ...emptyEvent(), topics: ["space"], topic: "computers", line: 1, typed: 12 };
  const reloaded = parseTimeline(JSON.stringify(save));
  assert.deepEqual(reloaded, save);
  const resumed = beginEvent({ ...reloaded, active: null }, id, player, "front");
  assert.deepEqual(resumed.progress[id], save.progress[id]);
  assert.equal(completeEvent(resumed, id), resumed);
  resumed.progress[id] = { ...emptyEvent(), topics: ["space","space"] };
  assert.equal(completeEvent(resumed, id), resumed, "Ein Thema zweimal reicht nicht aus");
  assert.equal(parseTimeline(JSON.stringify(resumed)).progress[id].topics.length, 1);
});

test("Sequenz- und Nachrichten-Checkpoints bleiben erhalten und können nicht vorzeitig abschließen", () => {
  for (const id of ["first-kiss-christmas", "confession-2025-11-24", "morning-2026-10-08"]) {
    let save = reach(id);
    const event = eventById(id);
    const required = event.scene === "sequence" ? event.steps.length : event.dialogue.length;
    const choiceIndex = event.dialogue.findIndex(line => line.choices?.length);
    const answers = choiceIndex >= 0 ? { [String(choiceIndex)]: event.dialogue[choiceIndex].choices[0] } : {};
    save.progress[id] = { ...emptyEvent(), cursor: required - 1, typed: 13, answers };
    save = parseTimeline(JSON.stringify(save));
    assert.equal(save.progress[id].cursor, required - 1);
    assert.equal(save.progress[id].typed, 13);
    assert.deepEqual(save.progress[id].answers, answers);
    assert.equal(save.active.id, id);
    assert.equal(completeEvent(save, id), save);
    save.progress[id].cursor = required;
    assert.equal(completeEvent(save, id).active, null);
  }
});

test("Migration bewahrt alte Kapitel, Uhrzeit und Abschlüsse; Kalender synchronisiert die vier Jahreszeiten", () => {
  const day = { ...initialDay(new Date("2026-03-11T12:00Z")), season: "Sommer", minute: 850, day: 27 };
  const oldStory = { ...EMPTY_STORY, completed: ["dog","christmas","graduation"] };
  const migrated = initialTimeline(day, oldStory, true);
  assert.deepEqual(migrated.clock, { ...day, season: "Frühling" });
  for (const id of ["legacy-dog","legacy-christmas","legacy-shooting","legacy-graduation"]) assert.ok(migrated.progress[id].completedAt);
  assert.equal(eventById("legacy-graduation").period, "Sommer 2026");
  assert.equal(eventStatus(initialTimeline(), eventById("legacy-school")), "gesperrt");
  assert.equal(eventStatus(migrated, eventById("legacy-dog")), "abgeschlossen");
  assert.ok(!CHAPTERS.find(chapter => chapter.id === "christmas").ending.includes("25.12.2025"));
});

test("Version-1-Novemberstände behalten alle 14 Abschlüsse trotz eingefügter Vorgänger", () => {
  const old = initialTimeline({ ...initialDay(new Date("2025-11-25T12:00Z")), minute: 1210 });
  const ids = [...Array.from({ length: 12 }, (_, index) => `chat-2025-11-${index + 13}`), "radegast-chocolate", "first-i-love-you"];
  for (const id of ids) old.progress[id] = { ...emptyEvent(), cursor: id === "first-i-love-you" ? 2 : id === "radegast-chocolate" ? 4 : 0, topics: id.startsWith("chat-") ? ["space","collin"] : [], visits: 1, completedAt: "2026-10-08T00:00:00Z" };
  const migrated = parseTimeline(JSON.stringify(old));
  assert.deepEqual(migrated.clock, old.clock);
  for (const id of ids) {
    assert.deepEqual(migrated.progress[id], old.progress[id]);
    assert.equal(eventStatus(migrated, eventById(id)), "abgeschlossen");
  }
  assert.equal(nextEvent(migrated).id, "beginning-2025-11-01");
  assert.equal(eventStatus(migrated, nextEvent(migrated)), "verfügbar");
});

test("Kalendergrenzen, Schlaf und Jahreszeitenwechsel funktionieren innerhalb des gesamten Storyjahrs", () => {
  for (const [date, nextDate, expected] of [["2025-11-30","2025-12-01","Winter"],["2026-02-28","2026-03-01","Frühling"],["2026-05-31","2026-06-01","Sommer"],["2026-08-31","2026-09-01","Herbst"]]) {
    const prior = { ...initialTimeline().clock, date, minute: 1430, season: calendarSeason(date) };
    const advanced = advanceTimelineClock(prior, 20).save;
    assert.equal(advanced.date, nextDate);
    assert.equal(advanced.season, expected);
  }
  const last = { ...initialTimeline().clock, date: STORY_END, minute: 1430, season: "Herbst" };
  const atEnd = advanceTimelineClock(last, 30).save;
  assert.equal(atEnd.date, STORY_END);
  assert.equal(atEnd.minute, 1439);
  assert.equal(advanceTimelineClock(atEnd, 30).save.day, atEnd.day);
  assert.deepEqual(sleepTimelineClock(atEnd), atEnd);
  assert.equal(sleepTimelineClock(last).date, STORY_END);
  assert.equal(sleepTimelineClock(last).season, "Herbst");
  assert.equal(initialTimeline({ ...last, date: "2024-01-01" }).clock.date, STORY_START);
  assert.equal(initialTimeline({ ...last, date: "2028-01-01" }).clock.date, STORY_END);
});

test("Chat-Rekonstruktionen entwickeln sich über den Zeitraum; Collin bekommt keine ergänzte Biografie", () => {
  const first = chatTopicForEvent("space", eventById("chat-2025-11-13"));
  const middle = chatTopicForEvent("space", eventById("chat-2025-11-19"));
  const late = chatTopicForEvent("space", eventById("chat-2025-11-24"));
  assert.notDeepEqual(first.lines, middle.lines);
  assert.notDeepEqual(middle.lines, late.lines);
  assert.deepEqual(chatTopicForEvent("collin", eventById("chat-2025-11-13")).lines, chatTopicForEvent("collin", eventById("chat-2025-11-24")).lines);
});

test("Beschädigte und zukünftige Speicherformate werden abgelehnt; unbekannte gültige IDs bleiben erhalten", () => {
  const save = initialTimeline();
  for (const raw of ["broken", "null", JSON.stringify({ ...save, version: 2 }), JSON.stringify({ ...save, clock: undefined }), JSON.stringify({ ...save, clock: { ...save.clock, date: "2025-02-30" } }), JSON.stringify({ ...save, progress: { foo: { ...emptyEvent(), cursor: -1 } } }), JSON.stringify({ ...save, progress: { foo: { ...emptyEvent(), typed: -1 } } }), JSON.stringify({ ...save, progress: { foo: { ...emptyEvent(), completedAt: 1 } } }), JSON.stringify({ ...save, active: { id: "missing" } })]) assert.throws(() => parseTimeline(raw));
  const withFuture = { ...save, progress: { "future-story": emptyEvent() } };
  assert.deepEqual(parseTimeline(JSON.stringify(withFuture)), withFuture);
});
