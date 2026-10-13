import { STORY_CHAPTERS, STORY_EVENTS, STORY_START, daysBetween, type StoryEvent, type TimelineSave } from "./timeline.ts";

export type CreditChapter = { number: number; title: string; period: string; memories: StoryEvent[] };
export type Credits = { chapters: CreditChapter[]; completed: number; total: number; storyDays: number; keepsakes: number; people: string[] };

/** Everything the closing credits show, taken only from what the player actually experienced. */
export function credits(save: TimelineSave): Credits {
  const dated = STORY_EVENTS.filter(event => event.confirmed && event.date);
  const done = dated.filter(event => save.progress[event.id]?.completedAt);
  const chapters = STORY_CHAPTERS.map(chapter => ({ number: chapter.number, title: chapter.title, period: chapter.period, memories: done.filter(event => (event.chapterNumber ?? 1) === chapter.number) })).filter(chapter => chapter.memories.length > 0);
  const people = [...new Set(done.flatMap(event => event.cast ?? []))].filter(name => name !== "Felice" && name !== "Elias").sort((a, b) => a.localeCompare(b, "de"));
  return { chapters, completed: done.length, total: dated.length, storyDays: daysBetween(STORY_START, save.clock.date) + 1, keepsakes: save.inventory.length, people };
}
