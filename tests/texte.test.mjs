import test from "node:test";
import assert from "node:assert/strict";
import { ORIGINAL_CHATS } from "../game/texte/index.ts";
import { CHAT_TOPICS, STORY_EVENTS, chatTopicForEvent, chatTopicsForEvent, emptyEvent, eventById, initialTimeline, parseTimeline } from "../game/timeline.ts";

const lastOfMonth = date => { const [y, m] = date.split("-").map(Number); return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10); };

test("Originalzeilen gehören zu einem bekannten Ereignis und zu dessen Datum", () => {
  for (const [id, chat] of Object.entries(ORIGINAL_CHATS)) {
    const event = eventById(id);
    assert.ok(event?.date, `unbekanntes Ereignis: ${id}`);
    // Spielbare Alltagsszenen dürfen Zeilen aus ihrem Zeitraum oder Monat zeigen.
    const until = event.until ?? (event.source === "staged" ? lastOfMonth(event.date) : event.date);
    assert.ok(chat.date >= event.date && chat.date <= until, `${id}: ${chat.date} liegt außerhalb von ${event.date}–${until}`);
    const lines = [...(chat.lines ?? []), ...(chat.threads ?? []).flatMap(thread => thread.lines)];
    assert.ok(lines.length, id);
    for (const [time, speaker, text] of lines) {
      assert.match(time, /^([01]\d|2[0-3]):[0-5]\d$/, `${id}: ${time}`);
      assert.ok(speaker === "Felice" || speaker === "Elias", `${id}: ${speaker}`);
      assert.ok(text.trim() && text.length <= 400, `${id}: ${text}`);
    }
    // Innerhalb eines Ausschnitts läuft die Zeit nie rückwärts.
    for (const group of [chat.lines ?? [], ...(chat.threads ?? []).map(thread => thread.lines)])
      for (let index = 1; index < group.length; index++) assert.ok(group[index][0] >= group[index - 1][0], `${id}: ${group[index][0]} nach ${group[index - 1][0]}`);
  }
});

test("Jeder Chatabend im November hat mindestens zwei echte Gesprächsfäden", () => {
  const ids = new Set();
  for (const event of STORY_EVENTS.filter(event => event.scene === "chat")) {
    const topics = chatTopicsForEvent(event);
    assert.ok(topics.length >= 2, event.id);
    for (const topic of topics) {
      assert.ok(topic.lines.length >= 3 && topic.lines.every(line => line.original && line.time), `${event.id}/${topic.id}`);
      assert.ok(!ids.has(topic.id), `doppelte ID ${topic.id}`);
      ids.add(topic.id);
      assert.deepEqual(chatTopicForEvent(topic.id, event), topic);
    }
  }
  assert.equal(ids.size >= 24, true);
});

test("Telefonszenen bestehen aus Originalnachrichten; das Album bekommt Ausschnitte", () => {
  for (const id of ["confession-2025-11-24", "first-i-love-you", "morning-2026-10-08"]) {
    const event = eventById(id);
    assert.ok(event.dialogue.filter(line => line.speaker !== "Erzählung").every(line => line.original && line.time), id);
    assert.ok(event.dialogue.some(line => line.speaker === "Felice"), id);
  }
  const withChat = STORY_EVENTS.filter(event => event.chat);
  assert.ok(withChat.length >= 15);
  for (const event of withChat) assert.ok(event.chat.lines.every(line => line.original && line.time), event.id);
  assert.match(eventById("new-year-2026").steps.find(step => step.id === "message").text, /^Hey kleine, frohes neues Jahr/);
});

test("Spielstände mit echten Gesprächsfäden und mit alten Themen bleiben lesbar", () => {
  const save = initialTimeline();
  const real = chatTopicsForEvent(eventById("chat-2025-11-13"));
  save.progress["chat-2025-11-13"] = { ...emptyEvent(), topics: [real[0].id], topic: real[1].id, line: real[1].lines.length - 1 };
  save.progress["chat-2025-11-14"] = { ...emptyEvent(), topics: ["space", "collin"], visits: 1, completedAt: "2026-01-01T00:00:00Z" };
  const parsed = parseTimeline(JSON.stringify(save));
  assert.deepEqual(parsed.progress["chat-2025-11-13"].topics, [real[0].id]);
  assert.equal(chatTopicForEvent("space", eventById("chat-2025-11-14")).id, "space", "alte Themen werden weiter angezeigt");
  assert.ok(CHAT_TOPICS.length);
  assert.throws(() => parseTimeline(JSON.stringify({ ...save, progress: { "chat-2025-11-13": { ...emptyEvent(), topics: ["erfunden"] } } })));
});
