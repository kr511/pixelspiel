import test from "node:test";
import assert from "node:assert/strict";
import { credits } from "../game/credits.ts";
import { STORY_EVENTS, initialTimeline } from "../game/timeline.ts";

test("Abspann zeigt nur erlebte Erinnerungen, nach Kapiteln geordnet", () => {
  const start = credits(initialTimeline());
  assert.equal(start.completed, 0);
  assert.deepEqual(start.chapters, []);
  const dated = STORY_EVENTS.filter(event => event.confirmed && event.date);
  const done = dated.slice(0, 3);
  const save = { ...initialTimeline(), progress: Object.fromEntries(done.map(event => [event.id, { cursor: 0, line: 0, visits: 1, topics: [], topic: null, completedAt: "2026-10-13T12:00:00Z" }])) };
  const result = credits(save);
  assert.equal(result.completed, 3);
  assert.equal(result.total, dated.length);
  assert.deepEqual(result.chapters.flatMap(chapter => chapter.memories.map(event => event.id)), done.map(event => event.id));
  assert.ok(!result.people.includes("Felice") && !result.people.includes("Elias"));
  assert.equal(result.storyDays, 1);
});
