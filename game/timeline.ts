import { advanceClock, clockText, initialDay, parseDay, sleepUntilMorning, SCHOOL_END, SCHOOL_START, WAKE_MINUTE, type DaySave, type Season } from "./day.ts";
import { CHAPTERS, PLACES, type ChapterId, type Place, type Point, type StorySave } from "./story.ts";
import { ORIGINAL_CHATS, type ChatLine } from "./texte/index.ts";
import { isSchoolDay } from "./school-calendar.ts";

export const TIMELINE_KEY = "felice-elias.timeline.v09";
export const STORY_START = "2025-11-10";
// 10.–12.11. are ordinary school days with Felice's daily routine; the first chat memory follows on 13.11.
export const ROUTINE_END = "2025-11-13";
export const isRoutineDay = (date: string) => date >= STORY_START && date < ROUTINE_END;
export const STORY_END = "2026-11-02";
/** `original` marks a verbatim WhatsApp message; `time` is its real "HH:MM". */
export type StoryLine = { speaker: "Felice" | "Elias" | "Erzählung"; text: string; emotion?: string; choices?: string[]; original?: boolean; time?: string };
export type ChatTopic = { id: string; title: string; icon: string; lines: StoryLine[] };
export type StoryBeat = { id: string; target: Point; label: string; speaker: string; art?: string; text: string; emotion?: string; choices?: string[]; animation?: "hug" | "handhold" | "kiss" | "sit" | "walk" | "fireworks" | "reflection" | "sleep" | "inspect" | "arrival" | "heart" | "fade"; place?: Place;
  /** Who stands in this beat besides Felice; defaults to the event cast. */
  cast?: string[] };
export type StoryEvent = {
  id: string; title: string; date: string | null; until?: string; period?: string; order: number;
  place: Place; scene: "chat" | "encounter" | "love" | "legacy" | "sequence" | "confession" | "message";
  requires: string[]; confirmed: boolean; description: string; illustration: string;
  staging: { start: number; end: number; spawn: Point; timeConfirmed: boolean };
  dialogue: StoryLine[]; interactions: string[]; chapter?: ChapterId; special?: boolean;
  chapterNumber?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; symbol?: string; source?: "historical" | "staged" | "future"; cast?: string[]; steps?: StoryBeat[];
  artifacts?: { id: string; title: string; symbol?: string; description: string }[];
  /** Inventory item IDs granted once on the first real completion (never during replay). */
  rewards?: string[];
  /** Felice's subtle thought when this memory is waiting; falls back to the trigger place. */
  hint?: string;
  /** Where Felice stays after the first real completion (e.g. a trip ends somewhere else than it began). */
  leaveAt?: { place: Place; point: Point };
  /** Real messages from this day (game/texte), shown in the album. */
  chat?: { date: string; lines: StoryLine[] };
};
export const STORY_CHAPTERS: { number: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; title: string; period: string; description: string }[] = [
  { number: 1, title: "Alles beginnt", period: "November 2025", description: "Lange Gespräche, Schokolade, erste Gefühle und zwei Worte, die bleiben." },
  { number: 2, title: "Unsere ersten romantischen Momente", period: "Dezember 2025", description: "Die Parkbank, Lichter am Weihnachtsmarkt und unser erster richtiger Kuss." },
  { number: 3, title: "Ein neues Jahr", period: "Januar 2026", description: "Wünsche für das neue Jahr und Raum für den gemeinsamen Alltag." },
  { number: 4, title: "Unser erster Valentinstag", period: "Februar 2026", description: "Ein Wochenende mit Zeit füreinander, ohne unbestätigte Geschenke." },
  { number: 5, title: "Unsere Erinnerungen", period: "März 2026", description: "Alte Nachrichten und ein Wochenende bei Elias verbinden damals und heute." },
  { number: 6, title: "Gemeinsame Zeit", period: "April & Mai 2026", description: "Lernen, Besuche und der Plan, mehrere Tage miteinander zu verbringen." },
  { number: 7, title: "Unser Sommer", period: "Juni–August 2026", description: "Helle Tage und spielbare Alltagsszenen im vorhandenen Sommer." },
  { number: 8, title: "Ein Jahr voller Erinnerungen", period: "September–2. November 2026", description: "Ein liebevoller Morgen, gemeinsame Rückblicke und ein offener Ausblick." },
];

// These are explicitly fictionalized reconstructions, never original messages.
// Collin's identity and personal circumstances have not been supplied.
export const CHAT_TOPICS: ChatTopic[] = [
  { id: "computers", title: "Programmieren & Computer", icon: "⌨", lines: [
    { speaker: "Felice", text: "Kennst du das, wenn etwas am Computer einfach nicht so will wie du?" },
    { speaker: "Elias", text: "Ja. Und dann findet man den kleinen Fehler, nach dem man die ganze Zeit gesucht hat." },
    { speaker: "Felice", text: "Darüber könnte ich gerade noch eine ganze Weile mit dir schreiben." },
  ] },
  { id: "space", title: "Das Weltall", icon: "✦", lines: [
    { speaker: "Felice", text: "Manchmal denke ich darüber nach, wie viel wir vom Weltall noch gar nicht kennen." },
    { speaker: "Elias", text: "Es gibt so viele Fragen. Wie weit es geht. Was da noch sein könnte." },
    { speaker: "Felice", text: "Ich mag, dass wir zusammen darüber nachdenken können." },
  ] },
  { id: "philosophy", title: "Tod & Gedanken", icon: "☾", lines: [
    { speaker: "Felice", text: "Denkst du manchmal darüber nach, was bleibt, wenn ein Leben zu Ende geht?" },
    { speaker: "Elias", text: "Ja. Ich habe darauf keine fertige Antwort. Vielleicht muss man auch nicht sofort eine haben." },
    { speaker: "Felice", text: "Es tut gut, solche Fragen einfach aussprechen zu können." },
  ] },
  { id: "shooting", title: "Das Schießen", icon: "◎", lines: [
    { speaker: "Felice", text: "Lass uns noch ein bisschen über das Schießen reden." },
    { speaker: "Elias", text: "Über die Konzentration? Diesen Moment, in dem man ganz ruhig wird?" },
    { speaker: "Felice", text: "Ja. Ich würde gern hören, wie du darüber denkst." },
  ] },
  { id: "collin", title: "Collin", icon: "…", lines: [
    { speaker: "Felice", text: "Wollen wir über Collin schreiben?" },
    { speaker: "Elias", text: "Ja. Was möchtest du dazu sagen? Ich höre dir zu." },
    { speaker: "Erzählung", text: "Collin gehörte zu ihren Gesprächsthemen. Was genau sie besprachen, bleibt hier offen." },
  ] },
  { id: "future", title: "Zukunft & Träume", icon: "☆", lines: [
    { speaker: "Felice", text: "Manchmal möchte ich einfach über das reden, was noch vor uns liegt." },
    { speaker: "Elias", text: "Wir müssen heute nicht auf alles eine Antwort haben. Was beschäftigt dich gerade?" },
    { speaker: "Felice", text: "Dass es schön ist, solche Gedanken mit dir teilen zu können." },
  ] },
  { id: "interests", title: "Gemeinsame Interessen", icon: "♫", lines: [
    { speaker: "Felice", text: "Es ist schön, immer wieder etwas zu finden, über das wir beide reden möchten." },
    { speaker: "Elias", text: "Und auch die Gedanken kennenzulernen, die wir noch nicht teilen." },
    { speaker: "Felice", text: "Dann erzähl mir noch ein bisschen von dir." },
  ] },
];
const LATER_CONVERSATIONS: Record<string, [StoryLine[], StoryLine[]]> = {
  computers: [[
    { speaker: "Felice", text: "Mit dir über Computer zu schreiben ist irgendwie schön. Man kommt von einer Frage zur nächsten." },
    { speaker: "Elias", text: "Ja. Man muss nicht schon alles wissen, um sich darüber auszutauschen." },
    { speaker: "Felice", text: "Dann bleiben wir einfach noch ein bisschen bei unseren Fragen." },
  ], [
    { speaker: "Felice", text: "Wir können beim Programmieren anfangen und landen dann wieder irgendwo ganz anders." },
    { speaker: "Elias", text: "Das mag ich an unseren Gesprächen. Wir müssen keinen festen Plan haben." },
    { speaker: "Felice", text: "Ich mag vor allem, dass du auf der anderen Seite bist." },
  ]],
  space: [[
    { speaker: "Felice", text: "Bei all den Fragen über das Weltall könnte so ein Abend ewig weitergehen." },
    { speaker: "Elias", text: "Eine Antwort führt meistens zu noch mehr Fragen. Wir können uns Zeit lassen." },
    { speaker: "Felice", text: "Dann denken wir eben gemeinsam weiter." },
  ], [
    { speaker: "Felice", text: "Das Weltall ist riesig. Und gerade ist es einfach schön, hier mit dir zu schreiben." },
    { speaker: "Elias", text: "Vielleicht muss nicht jeder Gedanke bis zum Ende erklärt werden." },
    { speaker: "Felice", text: "Manche kann man auch einfach miteinander teilen." },
  ]],
  philosophy: [[
    { speaker: "Felice", text: "Über den Tod nachzudenken ist manchmal schwer. Trotzdem möchte ich solche Gedanken nicht immer wegschieben." },
    { speaker: "Elias", text: "Wir können darüber reden, ohne eine endgültige Antwort finden zu müssen." },
    { speaker: "Felice", text: "Danke, dass du dir dafür Zeit nimmst." },
  ], [
    { speaker: "Felice", text: "Auch die schweren Fragen fühlen sich beim Schreiben mit dir ein bisschen weniger allein an." },
    { speaker: "Elias", text: "Ich möchte dir zuhören. Auch wenn ich nicht auf alles eine Antwort habe." },
    { speaker: "Felice", text: "Das reicht gerade schon." },
  ]],
  shooting: [[
    { speaker: "Felice", text: "Was beschäftigt dich beim Gedanken ans Schießen am meisten?" },
    { speaker: "Elias", text: "Dieses Zusammenspiel aus Ruhe und Konzentration. Wie siehst du das?" },
    { speaker: "Felice", text: "Lass uns noch ein bisschen darüber schreiben." },
  ], [
    { speaker: "Felice", text: "Vom Schießen zu den großen Fragen und wieder zurück. Unsere Abende haben viele Themen." },
    { speaker: "Elias", text: "Ja. Und zwischen all den Themen ist immer noch Platz für deine Gedanken." },
    { speaker: "Felice", text: "Für deine auch." },
  ]],
};
/** A verbatim chat message as a story line. */
export const chatLine = ([time, speaker, text]: ChatLine): StoryLine => ({ speaker, text, time, original: true });
const originalLines = (id: string) => (ORIGINAL_CHATS[id]?.lines ?? []).map(chatLine);
const narration = (text: string, emotion?: string): StoryLine => ({ speaker: "Erzählung", text, emotion });
/** The real threads of a chat evening, or the older reconstructed topics where none exist. */
export function chatTopicsForEvent(event: StoryEvent): ChatTopic[] {
  const threads = ORIGINAL_CHATS[event.id]?.threads;
  if (!threads?.length) return CHAT_TOPICS;
  // Real threads come in the order they were written; times before 5 am belong to the night after the evening.
  const startOf = (lines: ChatLine[]) => { const time = lines[0]?.[0] ?? ""; return time < "05:00" ? `~${time}` : time; };
  return [...threads].sort((a, b) => startOf(a.lines) < startOf(b.lines) ? -1 : startOf(a.lines) > startOf(b.lines) ? 1 : 0).map(thread => ({ id: thread.id, title: thread.title, icon: thread.icon, lines: thread.lines.map(chatLine) }));
}
/** Every topic ID a save may contain: reconstructed topics and real threads. */
export const KNOWN_TOPIC_IDS = new Set([...CHAT_TOPICS.map(topic => topic.id), ...Object.values(ORIGINAL_CHATS).flatMap(chat => chat.threads?.map(thread => thread.id) ?? [])]);
export function chatTopicForEvent(id: string, event: StoryEvent): ChatTopic | undefined {
  const real = chatTopicsForEvent(event).find(topic => topic.id === id);
  if (real && real.lines.some(line => line.original)) return real;
  const topic = CHAT_TOPICS.find(topic => topic.id === id);
  if (!topic) return undefined;
  const stage = event.date && event.date >= "2025-11-22" ? 1 : event.date && event.date >= "2025-11-17" ? 0 : -1;
  if ((stage === 0 || stage === 1) && LATER_CONVERSATIONS[id]) return { ...topic, lines: LATER_CONVERSATIONS[id][stage] };
  return topic;
}
const chatId = (day: number) => `chat-2025-11-${day}`;
/** Each evening is described by its own real threads, so no two evenings read the same in the album. */
const chatDescription = (id: string) => {
  const titles = (ORIGINAL_CHATS[id]?.threads ?? []).map(thread => `„${thread.title}“`);
  return titles.length ? `Echte Nachrichten von diesem Tag: ${titles.length > 1 ? `${titles.slice(0, -1).join(", ")} und ${titles.at(-1)}` : titles[0]}.` : "Echte Nachrichten von diesem Tag.";
};
const chatEvents: StoryEvent[] = Array.from({ length: 12 }, (_, index) => {
  const day = index + 13;
  return {
    // Order 2: evening chats follow the school scene (0) and the pasture meeting (1).
    id: chatId(day), title: `Unsere Gespräche · Abend ${index + 1}`, date: `2025-11-${day}`, order: 2,
    place: "bedroom", scene: "chat", requires: [], confirmed: true, chapterNumber: 1, symbol: "☾", source: "historical", cast: ["Felice", "Elias"],
    description: day === 16 ? "Nach dem Treffen in Radegast schreiben wir weiter. Echte Nachrichten von diesem Tag: vom Hacken, von einem offenen Buch und davon, jeden Tag füreinander da zu sein." : chatDescription(chatId(day)),
    illustration: "/rooms/felice-bedroom-v10.webp", staging: { start: day === 24 ? 1100 : 1020, end: 1380, spawn: { x: .5, y: .6 }, timeConfirmed: false },
    dialogue: [{ speaker: "Erzählung", text: day === 16 ? "Am Vormittag war Elias da. Jetzt leuchtet das Handy wieder." : index < 4 ? "Ein Handy leuchtet. Es ist noch vieles neu, aber die Gespräche werden länger." : index < 7 ? "Aus einzelnen Nachrichten werden vertraute gemeinsame Abende." : "Zwischen den Zeilen wächst Nähe. Ihr nehmt euch Zeit füreinander." }],
    interactions: ["Am Bett oder Schreibtisch Platz nehmen", "Handy öffnen", "Mindestens zwei Gesprächsthemen auswählen", "Abend bewahren"],
  };
});
const beat = (id: string, label: string, text: string, target: Point = { x: .5, y: .65 }, options: Partial<StoryBeat> = {}): StoryBeat => {
  const speaker = options.speaker ?? "Elias";
  // Only Elias gets his portrait by default; narration and other speakers never borrow it.
  return { id, label, text, target, speaker, emotion: "thoughtful", ...options, art: options.art ?? (speaker === "Elias" ? "elias" : undefined) };
};
type SequenceConfig = { id: string; title: string; date: string; until?: string; period?: string; order?: number; chapterNumber: StoryEvent["chapterNumber"]; place: Place; description: string; illustration?: string; symbol?: string; source?: StoryEvent["source"]; start?: number; end?: number; spawn?: Point; timeConfirmed?: boolean; cast?: string[]; special?: boolean; artifacts?: StoryEvent["artifacts"]; rewards?: string[]; hint?: string; leaveAt?: StoryEvent["leaveAt"]; steps: StoryBeat[] };
const sequence = (config: SequenceConfig): StoryEvent => ({
  id: config.id, title: config.title, date: config.date, until: config.until, period: config.period, order: config.order ?? 0,
  chapterNumber: config.chapterNumber, place: config.place, scene: "sequence", requires: [], confirmed: true,
  source: config.source ?? "historical", symbol: config.symbol ?? "♥", cast: config.cast ?? ["Felice", "Elias"], special: config.special,
  description: config.description, illustration: config.illustration ?? "/rooms/felice-bedroom-v10.webp",
  staging: { start: config.start ?? 960, end: config.end ?? 1000, spawn: config.spawn ?? { x: .5, y: .7 }, timeConfirmed: config.timeConfirmed ?? false },
  steps: config.steps, artifacts: config.artifacts, rewards: config.rewards, hint: config.hint, leaveAt: config.leaveAt,
  dialogue: config.steps.map(step => ({ speaker: step.speaker === "Felice" || step.speaker === "Elias" ? step.speaker : "Erzählung", text: step.text, emotion: step.emotion, choices: step.choices })),
  interactions: config.steps.map(step => step.label),
});
const SCHOOL_DESCRIPTIONS: Record<17 | 19 | 21, string> = {
  17: "Morgens vor der Schule steht Felice jetzt bei Elias, Paul und Justin. Elena will wissen, was zwischen den beiden läuft. Die Dialoge sind rekonstruiert.",
  19: "Ein Morgen auf dem Schulhof: Elias guckt wieder so intensiv, und Felice guckt zurück. Die Dialoge sind rekonstruiert.",
  21: "Blicke im Deutschunterricht und der Gedanke, Elias einfach mitten auf dem Schulhof zu umarmen. Die Dialoge sind rekonstruiert.",
};
const schoolEpisode = (day: 17 | 19 | 21, steps: StoryBeat[]) => sequence({
  id: `school-first-feelings-${day}`, title: day === 17 ? "Fragen auf dem Schulhof" : day === 19 ? "Ein kleines Kompliment" : "Gedanken über Umarmungen",
  date: `2025-11-${day}`, period: "17.–21.11.2025 · Rekonstruierte Schul- und Alltagsszene", source: "staged", chapterNumber: 1,
  place: "school", start: 360, end: 430, spawn: { x: .60, y: .88 }, illustration: "/rooms/school-court-secondary-v075.webp", symbol: "✎", cast: ["Felice", "Elias", "Paul", "Justin"],
  description: SCHOOL_DESCRIPTIONS[day], steps,
});
const datedEvents: StoryEvent[] = [
  // Beat IDs and count stay stable so saved checkpoints keep their meaning.
  // The intro cinematic wakes Felice beside her bed and opens the first beat.
  sequence({ id: "beginning-2025-11-01", title: "Der Beginn", date: STORY_START, source: "staged", chapterNumber: 1, place: "bedroom", start: WAKE_MINUTE, end: WAKE_MINUTE + 30, spawn: { x: .5, y: .6 }, symbol: "🍂", cast: ["Felice"], hint: "Hier fängt alles an. Vielleicht sehe ich mich erst einmal in meinem Zimmer um.", description: "Ein spielerischer Anfang am 10. November: Felices Zimmer, Herbstblätter und die ersten Schritte durch die vertraute Welt. Das Aufwachen und die Einführung sind Inszenierung.", steps: [
    beat("wake", "Wach werden", "Der zehnte November. Draußen fallen die Blätter. Mal sehen, was der Tag bringt.", { x: .42, y: .52 }, { speaker: "Felice", art: "felice", emotion: "neutral", choices: ["Sich strecken und aufstehen", "Noch kurz aus dem Fenster schauen"] }),
    beat("phone", "Das Handy auf dem Schreibtisch ansehen", "Mein Handy. Mit E oder dem Aktionsknopf kann ich Dinge ansehen und benutzen. Mal sehen, wer mir in nächster Zeit schreibt.", { x: .60, y: .395 }, { speaker: "Felice", art: "felice", emotion: "thoughtful", animation: "inspect" }),
    beat("explore", "Zur Zimmertür gehen", "WASD, die Pfeiltasten oder der Joystick bewegen mich. Mit E spreche ich mit Menschen, J öffnet unser Erinnerungsbuch, I meine Tasche und Esc das Menü. Die nächsten Tage sind ganz normaler Alltag: aufstehen, frischmachen, zur Schule, Hausaufgaben und schlafen.", { x: .70, y: .66 }, { speaker: "Felice", art: "felice", emotion: "happy", choices: ["Die Welt kennenlernen", "Erst einmal durchatmen"] }),
  ] }),
  ...chatEvents,
  {
    // The chat dates the visit to Sunday 16.11.2025, about 10:45–12:20 (bike, chocolate, "allein das du da warst").
    // The stable ID keeps saves valid.
    id: "radegast-chocolate", title: "Die Schokolade", date: "2025-11-16", order: 1, chapterNumber: 1, symbol: "▦", source: "historical", cast: ["Felice", "Elias"],
    place: "radegast", scene: "encounter", requires: [], confirmed: true, rewards: ["chocolate"], hint: "Vielleicht sollte ich zum Treffpunkt gehen.",
    description: "Am Sonntagvormittag kam Elias mit dem Fahrrad aus Zörbig zu mir nach Radegast, an die Bank bei der Hütte, und brachte Schokolade mit. Mir war kalt und ich hatte keinen Appetit. Ich aß sie nicht, und er fühlte sich etwas unbeholfen. Trotzdem half mir schon seine Anwesenheit.",
    illustration: "pasture", staging: { start: 645, end: 740, spawn: { x: .66, y: .42 }, timeConfirmed: true },
    dialogue: [
      { speaker: "Erzählung", text: "Sonntag, kurz vor elf. Felice wartet an der Bank bei der Hütte. Ihr ist kalt. Elias kommt mit dem Fahrrad aus Zörbig.", emotion: "neutral" },
      { speaker: "Felice", text: "Du bist echt gekommen. Du bist sturer als ich.", emotion: "happy" },
      { speaker: "Elias", text: "Hab dir Schokolade mitgebracht. Milka Joghurt.", emotion: "shy" },
      { speaker: "Felice", text: "Danke. Hab grad echt keinen Appetit. Aber schön, dass du da bist.", emotion: "shy" },
      { speaker: "Erzählung", text: "Felice isst die Schokolade nicht. Elias fühlt sich einen Moment unbeholfen. Um 12:54 schreibt sie ihm: „Alles gut allein das du da warst hat mir geholfen“", emotion: "thoughtful" },
    ], interactions: ["Fahrradankunft", "Zu Elias laufen", "Gespräch beginnen", "Schokolade annehmen", "Schokolade nicht essen", "Moment bewahren"],
  },
  schoolEpisode(17, [
    beat("question", "Elena antworten", "Sag mal, was läuft eigentlich zwischen euch?", { x: .52, y: .90 }, { speaker: "Elena", art: "elena", emotion: "surprised", choices: ["Wir verstehen uns halt einfach", "Nur verlegen grinsen"], cast: ["Elena", "Elias", "Paul", "Justin"] }),
    beat("answer", "Zu Elias, Paul und Justin gehen", "Lass die reden. Wir sind besser als die.", { x: .60, y: .76 }, { emotion: "thoughtful" }),
    beat("continue", "Bei den dreien stehen bleiben", "Wir verstehen uns halt einfach. Und haben viel, worüber wir reden können.", { x: .55, y: .82 }, { speaker: "Felice", art: "felice", emotion: "happy" }),
  ]),
  schoolEpisode(19, [
    beat("meet", "Elias, Paul und Justin begrüßen", "Naaa. Gut geschlafen?", { x: .52, y: .90 }, { emotion: "happy" }),
    beat("compliment", "Elias’ Blick erwidern", "Du guckst schon wieder so. Dein Augenkontakt ist echt intensiv.", { x: .60, y: .76 }, { speaker: "Felice", art: "felice", emotion: "shy", choices: ["Einfach zurückgucken", "Lachen und wegschauen"] }),
    beat("smile", "Zusammen reingehen", "Ich weiß. Ich will dich halt bisschen ärgern.", { x: .55, y: .82 }, { emotion: "laughing", animation: "walk" }),
  ]),
  schoolEpisode(21, [
    beat("quiet", "Elias etwas fragen", "In Deutsch guck ich dich jetzt öfter an. Wär das schlimm?", { x: .52, y: .90 }, { speaker: "Felice", art: "felice", emotion: "shy" }),
    beat("listen", "Elias zuhören", "Absolut nicht. Dein Lächeln war jedes Mal unglaublich.", { x: .60, y: .76 }, { emotion: "love", choices: ["Rot werden", "„Du sahst heute echt gut aus“"] }),
    beat("remember", "Den Gedanken behalten", "Irgendwann umarme ich dich einfach. Mitten auf dem Schulhof.", { x: .55, y: .82 }, { speaker: "Felice", art: "felice", emotion: "love", animation: "heart" }),
  ]),
  {
    id: "confession-2025-11-24", title: "Ich habe mich in dich verliebt", date: "2025-11-24", order: 0, chapterNumber: 1, symbol: "♥", source: "historical", cast: ["Felice", "Elias"],
    place: "bedroom", scene: "confession", requires: [], confirmed: true, special: true,
    description: "Am 24. November um 17:20 Uhr schreibe ich Elias: „Ich hab mich wirklich in dich verliebt 🫣“. Er antwortet: „Ich mich schon lange“. Danach ein Foto, ein Waschbär und ein Hund. Alle Nachrichten sind original.",
    illustration: "/rooms/felice-bedroom-v10.webp", staging: { start: 1040, end: 1060, spawn: { x: .5, y: .6 }, timeConfirmed: true },
    dialogue: [
      ...originalLines("confession-2025-11-24").slice(0, 7),
      narration("Um 17:31 schickt Felice ein Foto."),
      ...originalLines("confession-2025-11-24").slice(7),
    ].map((line, index) => index === 0 ? { ...line, emotion: "shy" } : line.text === "Weil ich so in Liebe bin" ? { ...line, emotion: "love" } : line),
    interactions: ["Am Bett oder Schreibtisch Platz nehmen", "Handy um 17:20 öffnen", "Das Geständnis senden", "Über den Waschbären und den Hund schreiben", "Erinnerung bewahren"],
  },
  sequence({ id: "handholding-2025-11-25", title: "Deine Hand in meiner", date: "2025-11-25", order: 0, chapterNumber: 1, place: "school", start: 720, end: 740, spawn: { x: .60, y: .88 }, illustration: "/rooms/school-court-secondary-v075.webp", symbol: "♡", description: "Am 25. November halten wir in der Schule Händchen. Danach schreibe ich ihm: „Fand die Stunde heute echt toll mit dir“. Die gesprochenen Sätze sind rekonstruiert.", steps: [
    beat("meet", "Auf Elias zugehen", "Die Stunde neben dir war echt schön.", { x: .52, y: .90 }, { emotion: "shy" }),
    beat("hand", "Elias die Hand geben", "Gib mal deine Hand.", { x: .60, y: .76 }, { emotion: "shy", choices: ["Seine Hand nehmen", "Lächeln und die Hand reichen"], animation: "handhold" }),
    beat("walk", "Ein Stück gemeinsam gehen", "Wir gegen die Welt.", { x: .55, y: .82 }, { speaker: "Felice", art: "felice", emotion: "love", animation: "walk" }),
  ] }),
  {
    id: "first-i-love-you", title: "Unser erstes Ich liebe dich", date: "2025-11-25", order: 1,
    place: "bedroom", scene: "love", requires: [], confirmed: true, special: true, chapterNumber: 1, symbol: "♥", source: "historical", cast: ["Felice", "Elias"],
    description: "Am 25. November um 17:10 schreibe ich Elias drei Reihen Punkte. Er versteht sofort: „Ich liebe dich auch“. Dann schreibe ich es aus. Ein offizielles Beziehungsdatum wird daraus nicht abgeleitet.",
    illustration: "/rooms/felice-bedroom-v10.webp", staging: { start: 1030, end: 1040, spawn: { x: .5, y: .6 }, timeConfirmed: true },
    dialogue: originalLines("first-i-love-you").map(line => ({ ...line, emotion: "love" })),
    interactions: ["Platz nehmen", "Drei Reihen Punkte senden", "„Ich liebe dich“ ausschreiben", "Erinnerung bewahren"],
  },
  sequence({ id: "playground-2025-12-01", title: "Die Bank und unsere Umarmungen", date: "2025-12-01", until: "2025-12-02", chapterNumber: 2, place: "playground", start: 960, end: 1020, spawn: { x: .5, y: .86 }, illustration: "playground", symbol: "❧", description: "Am 1. Dezember auf dem Spielplatz in Radegast. Für Elias war es „lustig, romantisch und sportlich“. Ich traue mich zuerst und umarme ihn, er legt den Arm um mich. Danach bringt er mich im Dunkeln heim. Die gesprochenen Sätze sind rekonstruiert.", steps: [
    beat("arrive", "Elias am Spielplatz treffen", "Naaa. Da bist du ja.", { x: .5, y: .7 }, { emotion: "happy", animation: "arrival" }),
    beat("bench", "Gemeinsam auf die Bank setzen", "Gleich geht die Sonne unter. Von der Bank sieht man’s am besten.", { x: .43, y: .585 }, { emotion: "happy", animation: "sit", choices: ["Neben ihn setzen", "Ganz nah ranrutschen"] }),
    beat("hug", "Elias umarmen", "Komm her.", { x: .54, y: .66 }, { speaker: "Felice", art: "felice", emotion: "shy", animation: "hug" }),
    beat("walk", "Zusammen heimgehen", "Ich bring dich noch heim. Es ist dunkel.", { x: .5, y: .7 }, { emotion: "love", animation: "walk" }),
  ] }),
  sequence({ id: "christmas-market-2025-12-06", title: "Unser Weihnachtsmarkt", date: "2025-12-06", chapterNumber: 2, place: "christmasmarket", start: 1020, end: 1140, spawn: { x: .5, y: .87 }, illustration: "christmasmarket", symbol: "✦", description: "Am 6. Dezember auf dem Zörbiger Weihnachtsmarkt. Viele Umarmungen, kleine Küsse auf die Wange und viel Sitzen in der Kälte. Abends fährt Elias im Dunkeln heim und schreibt: „Es war das beste jemals“. Marktaufbau und gesprochene Sätze sind rekonstruiert.", steps: [
    beat("lights", "Zwischen den Lichtern ankommen", "Wir sind wirklich zusammen hier. Ich war so nervös.", { x: .5, y: .76 }, { speaker: "Felice", art: "felice", emotion: "happy", animation: "arrival" }),
    beat("stalls", "Die beleuchteten Stände ansehen", "Willst du was Warmes? Ich geb aus.", { x: .34, y: .6 }, { emotion: "happy", animation: "inspect", choices: ["„Na gut, ein Kinderpunsch“", "„Du sollst mir nix kaufen“"] }),
    beat("tree", "Am Weihnachtsbaum innehalten", "Das hier ist das Beste, was ich je erlebt hab.", { x: .5, y: .46 }, { emotion: "love", animation: "heart" }),
    beat("hug", "Elias umarmen", "Komm, noch eine Umarmung. Und ein kleiner Kuss auf die Wange.", { x: .78, y: .77 }, { speaker: "Felice", art: "felice", emotion: "love", animation: "hug" }),
  ] }),
  sequence({ id: "first-kiss-christmas", title: "Unser erster Kuss", date: "2025-12-25", chapterNumber: 2, place: "home", start: 720, end: 1380, spawn: { x: .4, y: .65 }, illustration: "/rooms/home-winter-v06.webp", symbol: "♥", special: true, cast: ["Felice", "Elias", "Felices Familie"], description: "Elias kommt um 11:46 zu mir und bringt einen Liebesbrief mit. Es gibt Ente mit meiner Familie, später gehen wir in mein Zimmer. Er liegt neben mir, viel wird nicht gesagt, und dann ist es passiert: unser erster richtiger Kuss. Elias bleibt über Nacht.", steps: [
    beat("visit", "Elias zu Weihnachten begrüßen", "Frohe Weihnachten. Ich hab dir was mitgebracht. Lies es aber erst später.", { x: .4, y: .65 }, { emotion: "happy", animation: "arrival" }),
    beat("family", "Beim Weihnachtsessen ankommen", "Schön, dass du da bist, Elias. Setzt euch, es gibt Ente.", { x: .70, y: .64 }, { place: "kitchen", speaker: "Felices Mutter", art: "mother", emotion: "happy", animation: "sit", choices: ["Mit der Familie reden", "Unterm Tisch seine Hand suchen"] }),
    beat("quiet", "Gemütliche Zeit miteinander verbringen", "Die mögen dich alle. Hab ich doch gesagt.", { x: .40, y: .65 }, { place: "home", speaker: "Felice", art: "felice", emotion: "love" }),
    beat("room", "Zusammen in Felices Zimmer gehen", "Kommst du mit hoch?", { x: .5, y: .6 }, { place: "bedroom", speaker: "Felice", art: "felice", emotion: "shy", animation: "walk" }),
    beat("bed", "Sich neben Elias legen", "Er liegt neben ihr. Keiner sagt viel.", { x: .40, y: .49 }, { place: "bedroom", speaker: "Erzählung", emotion: "shy", animation: "sit" }),
    beat("kiss", "Den ersten richtigen Kuss erleben", "Kein großes Wort davor. Nur die beiden, ganz nah. Dann ihr erster richtiger Kuss.", { x: .40, y: .49 }, { place: "bedroom", speaker: "Erzählung", emotion: "love", animation: "kiss", choices: ["Den Moment zulassen", "Näher rücken"] }),
    beat("stay", "Die gemeinsame Nacht bewahren", "Elias bleibt über Nacht. Die Lichter gehen langsam aus.", { x: .5, y: .6 }, { place: "bedroom", speaker: "Erzählung", emotion: "neutral", animation: "sleep" }),
  ] }),
  sequence({ id: "morning-after-2025-12-26", title: "Der Morgen danach", date: "2025-12-26", chapterNumber: 2, place: "bedroom", start: 540, end: 600, spawn: { x: .5, y: .6 }, symbol: "✉", rewards: ["elias-letter"], description: "Wir erinnern uns an die gemeinsame Nacht. Ein persönlicher Brief von Elias und die gefalteten Kraniche, die ich in seiner Jacke versteckt habe, finden ihren Platz im Album. Der Brieftext liegt nicht vor und wird nicht erfunden.", artifacts: [
    { id: "elias-letter", title: "Elias’ Liebesbrief", symbol: "✉", description: "Sein Weihnachtsgeschenk: ein Liebesbrief. Felice liest ihn am Abend des 26. Dezember und schreibt: „Der Brief ist so schön. Ich muss weinen.“ Der Originaltext ist nicht überliefert und bleibt frei für eine spätere Ergänzung." },
    { id: "folded-cranes", title: "Die gefalteten Kraniche", symbol: "◇", description: "Felice versteckte gefaltete Kraniche in Elias’ Jacke. Farbe, Zahl und weitere Details werden nicht ergänzt." },
  ], steps: [
    beat("morning", "Elias am Morgen ansprechen", "Morgen. Ich muss die ganze Zeit an gestern denken.", { x: .5, y: .6 }, { emotion: "love", animation: "reflection" }),
    beat("letter", "Den persönlichen Brief ansehen", "Dein Brief. Was darin steht, behalte ich für mich.", { x: .60, y: .395 }, { speaker: "Felice", art: "felice", emotion: "thoughtful", animation: "inspect" }),
    beat("cranes", "Die Kraniche im Album bewahren", "Die kleinen gefalteten Kraniche in deiner Jacke gehören zu unserer Geschichte.", { x: .40, y: .49 }, { speaker: "Felice", art: "felice", emotion: "happy", animation: "inspect" }),
  ] }),
  sequence({ id: "new-year-2026", title: "Ein neues Jahr für uns", date: "2026-01-01", chapterNumber: 3, place: "garden", start: 0, end: 30, spawn: { x: .5, y: .65 }, illustration: "/rooms/garden-v06.webp", symbol: "✺", timeConfirmed: true, description: "Um 0:00 Uhr kommt Elias’ Neujahrsnachricht, eine Minute später antworte ich. Mehr braucht es nicht. Beide Nachrichten sind original; Feuerwerk und Garten sind Spielkulisse.", steps: [
    beat("midnight", "Das neue Jahr begrüßen", "Mitternacht. Über dem Garten leuchtet der Himmel.", { x: .5, y: .65 }, { speaker: "Felice", art: "felice", emotion: "surprised", animation: "fireworks" }),
    beat("message", "Elias’ Neujahrsnachricht lesen", ORIGINAL_CHATS["new-year-2026"].lines![0][2], { x: .45, y: .7 }, { emotion: "love", animation: "heart" }),
    beat("wishes", "Elias antworten", ORIGINAL_CHATS["new-year-2026"].lines![1][2], { x: .5, y: .65 }, { speaker: "Felice", art: "felice", emotion: "love" }),
    beat("plan", "Den Moment bewahren", "Eine einfache Nachricht um Mitternacht. Und trotzdem der schönste Anfang für ein neues Jahr.", { x: .45, y: .7 }, { speaker: "Erzählung", emotion: "love" }),
  ] }),
  sequence({ id: "january-everyday", title: "Unser gemeinsamer Alltag", date: "2026-01-02", until: "2026-01-31", period: "Januar 2026 · Spielbare Alltagsszene", source: "staged", chapterNumber: 3, place: "kitchen", start: 960, end: 1080, spawn: { x: .5, y: .75 }, illustration: "/rooms/home-winter-v06.webp", symbol: "☕", description: "Besuche, Kochen, Kuscheln, Spaziergänge und Zukunftsgedanken geben dem Januar Raum. Diese kleine Alltagsszene ist eine Spielinterpretation, kein neues historisches Treffen mit festem Datum.", steps: [
    beat("cook", "Zusammen in der Küche ankommen", "Wir können uns etwas Zeit nehmen und gemeinsam in der Küche sein.", { x: .50, y: .65 }, { emotion: "happy", animation: "inspect", choices: ["Gemeinsam etwas vorbereiten", "Beim Vorbereiten miteinander reden"] }),
    beat("cuddle", "Einen ruhigen Moment auf dem Sofa teilen", "Manchmal ist es schön, einfach beieinander zu sitzen.", { x: .4, y: .65 }, { place: "home", speaker: "Felice", art: "felice", emotion: "love", animation: "hug" }),
    beat("future", "Über Zukunftspläne sprechen", "Wir müssen heute nicht alles planen. Aber unsere Gedanken können wir miteinander teilen.", { x: .5, y: .65 }, { place: "garden", emotion: "thoughtful", choices: ["Über gemeinsame Zeit sprechen", "Noch ein Stück spazieren"], animation: "walk" }),
  ] }),
  sequence({ id: "first-valentine", title: "Unser erster Valentinstag", date: "2026-02-14", until: "2026-02-15", chapterNumber: 4, place: "radegast", start: 600, end: 720, spawn: { x: .53, y: .51 }, illustration: "/rooms/radegast-walk-v075.webp", symbol: "♡", special: true, description: "Unser erster Valentinstag: Wir laufen einfach zusammen durch Radegast. Morgens schreibe ich: „Heute wird es besser. Natürlich du bist bei mir.“ Die gesprochenen Sätze sind rekonstruiert.", steps: [
    beat("arrive", "Elias begrüßen", "Naaa. Happy Valentinstag, Kleine.", { x: .47, y: .36 }, { emotion: "happy", animation: "arrival" }),
    beat("talk", "Durch Radegast laufen", "Und, wohin?", { x: .55, y: .55 }, { emotion: "happy", animation: "walk", choices: ["„Einfach geradeaus“", "„Egal, Hauptsache mit dir“"] }),
    beat("hug", "Elias umarmen", "Mehr brauch ich heute nicht. Nur du und ich und ein bisschen rumlaufen.", { x: .62, y: .78 }, { speaker: "Felice", art: "felice", emotion: "love", animation: "hug" }),
    beat("quiet", "Den Tag bewahren", "Kein großes Programm. Nur zusammen durch den Ort, Hand in Hand.", { x: .62, y: .78 }, { speaker: "Erzählung", emotion: "love", animation: "walk" }),
  ] }),
  sequence({ id: "old-messages-2026-03-18", title: "Wie alles begann", date: "2026-03-18", chapterNumber: 5, place: "bedroom", start: 1140, end: 1200, spawn: { x: .5, y: .6 }, symbol: "↶", special: true, description: "Elias liest unsere alten WhatsApp-Nachrichten. Wir erinnern uns daran, wie alles begann, und Felice wird emotional. Der Rückblick zeigt bereits freigeschaltete Erinnerungen; fehlende Originalnachrichten werden nicht ersetzt.", steps: [
    beat("messages", "Über die alten Nachrichten sprechen", "Ich lese gerade unsere alten Nachrichten. Weißt du noch, wie wir angefangen haben zu schreiben?", { x: .60, y: .395 }, { emotion: "thoughtful", animation: "inspect" }),
    beat("november", "Auf die Novemberabende zurückblicken", "An all die Gespräche. An das Fahrrad, die Schokolade und unsere ersten Gefühle.", { x: .5, y: .6 }, { speaker: "Felice", art: "felice", emotion: "sad", animation: "reflection" }),
    beat("winter", "Die Wintererinnerungen ansehen", "Der Weihnachtsmarkt. Die beiden Liebesnachrichten. Unser erster Kuss. Aus diesen Momenten wurde unsere Geschichte.", { x: .40, y: .49 }, { emotion: "love", animation: "reflection" }),
    beat("today", "Wieder im heutigen Moment ankommen", "Wenn ich daran denke, werde ich emotional. Ich freue mich, dass wir diese Erinnerungen teilen.", { x: .5, y: .6 }, { speaker: "Felice", art: "felice", emotion: "love", animation: "heart" }),
  ] }),
  sequence({ id: "elias-room-weekend", title: "Ein Wochenende bei Elias", date: "2026-03-20", until: "2026-03-22", chapterNumber: 5, place: "eliasroom", start: 960, end: 1140, spawn: { x: .5, y: .85 }, illustration: "eliasroom", symbol: "⌂", description: "Vom 20. bis 22. März bin ich bei Elias. Er sagt die ganze Zeit, sein Haus sehe kacke aus. Ich finde es schön. Seine Eltern sind total lieb, und sie lieben mich seit Sekunde eins. Die gesprochenen Sätze sind rekonstruiert; Einrichtung und Gegenstände der Zimmerkarte sind Spielgestaltung.", steps: [
    beat("welcome", "Elias in seinem Zimmer treffen", "Komm rein. Sorry, hier sieht alles noch kacke aus.", { x: .5, y: .65 }, { emotion: "shy", animation: "arrival", choices: ["„Quatsch, euer Haus ist schön“", "„Mich juckt sowas nicht“"] }),
    beat("computer", "Den Computer ansehen", "Hier sitzt du also die ganzen Abende und programmierst.", { x: .30, y: .465 }, { speaker: "Felice", art: "felice", emotion: "happy", animation: "inspect" }),
    beat("objects", "Elias’ Eltern begrüßen", "Elias’ Eltern begrüßen Felice. Sie mögen sie ab der ersten Sekunde, und Felice findet die beiden richtig lieb.", { x: .5, y: .65 }, { speaker: "Erzählung", emotion: "happy" }),
    beat("bed", "Auf dem Bett zusammensitzen", "Meine Eltern lieben dich jetzt schon. Seit Sekunde eins.", { x: .735, y: .545 }, { emotion: "love", animation: "sit", choices: ["„Die sind aber auch echt lieb“", "„Und euer Haus ist schön, egal was du sagst“"] }),
  ] }),
  sequence({ id: "spring-everyday", title: "Gemeinsame Zeit im Frühling", date: "2026-04-01", until: "2026-05-05", period: "April & Anfang Mai 2026 · Spielbare Alltagsszene", source: "staged", chapterNumber: 6, place: "home", start: 960, end: 1080, spawn: { x: .4, y: .65 }, illustration: "/rooms/garden-v06.webp", symbol: "❀", description: "Wochenenden, Besuche, Lernen und Gespräche gehören zum Frühling. Diese Szene gibt dem gemeinsamen Alltag spielerischen Raum; sie behauptet kein zusätzliches Treffen am 1. April.", steps: [
    beat("visit", "Zusammen ankommen", "Ein bisschen gemeinsame Zeit zwischen all den Dingen des Alltags.", { x: .4, y: .65 }, { emotion: "happy", animation: "arrival" }),
    beat("study", "Gemeinsam lernen", "Wir können uns eine Frage vornehmen und gemeinsam darüber nachdenken.", { x: .60, y: .395 }, { place: "bedroom", emotion: "thoughtful", animation: "inspect", choices: ["Einen Gedanken erklären", "Zusammen nach einer Lösung suchen"] }),
    beat("outside", "Den Frühling draußen genießen", "Auch ein kleiner Spaziergang kann sich wie eine Pause zusammen anfühlen.", { x: .5, y: .65 }, { place: "garden", speaker: "Felice", art: "felice", emotion: "happy", animation: "walk" }),
  ] }),
  // Klassenfahrt der beiden 10. Klassen, 20.–24.04.2026: Bus, B&B Hotel in Kehl, Europäisches Parlament,
  // Pokalabend, Europa-Park. Ablauf, Beteiligte und Abende sind bestätigt; Dialoge sind rekonstruiert.
  // Felice ist mit Elena, Luca und Jason unterwegs, Elias mit Paul und Justin.
  sequence({ id: "klassenfahrt-anreise", title: "Klassenfahrt: Abfahrt nach Kehl", date: "2026-04-20", chapterNumber: 6, place: "school", start: 480, end: 840, spawn: { x: .60, y: .88 }, illustration: "/rooms/trip-hotel-v11.webp", symbol: "🚌", cast: ["Felice", "Elias", "Frau Kaiser"], leaveAt: { place: "hotel", point: { x: .50, y: .62 } },
    hint: "Heute beginnt die Klassenfahrt! Ich sollte zum Schulhof nach Zörbig, dort fährt der Bus ab.",
    description: "Am 20. April 2026 startet die Klassenfahrt der beiden 10. Klassen mit Frau Kaiser und Herrn Kluger. Mit dem Bus geht es nach Kehl ins B&B Hotel. Der Schulhof als Treffpunkt und die Dialoge sind rekonstruiert.", steps: [
    beat("meet", "Frau Kaiser am Treffpunkt", "Guten Morgen! Koffer in den Bus, dann wird durchgezählt. Fünf Tage Kehl, Straßburg und Europa-Park.", { x: .40, y: .80 }, { speaker: "Frau Kaiser", art: "kaiser", emotion: "happy", cast: ["Frau Kaiser", "Herr Kluger", "Nino", "Richard"] }),
    beat("elias", "Elias vor dem Bus treffen", "Fünf Tage zusammen unterwegs. Ich freu mich richtig drauf.", { x: .62, y: .78 }, { emotion: "happy", choices: ["Ich mich auch", "Hoffentlich wird die Fahrt nicht zu lang"], cast: ["Elias", "Paul", "Justin"] }),
    beat("arrive", "Im Hotel ankommen", "Nach der langen Busfahrt: Ankunft im B&B Hotel in Kehl. Straßburg liegt gleich auf der anderen Rheinseite.", { x: .50, y: .62 }, { place: "hotel", speaker: "Erzählung", emotion: "happy", animation: "arrival", cast: [] }),
  ] }),
  sequence({ id: "klassenfahrt-parlament", title: "Klassenfahrt: Europäisches Parlament", date: "2026-04-21", chapterNumber: 6, place: "parliament", start: 600, end: 780, spawn: { x: .50, y: .72 }, illustration: "/rooms/trip-parliament-v11.webp", symbol: "★", cast: ["Felice", "Elena", "Luca", "Jason"],
    hint: "Heute geht es nach Straßburg zum Europäischen Parlament. Der Weg startet an der Hoteltür.",
    description: "Am Dienstag besucht die Klasse das Europäische Parlament in Straßburg. Felice ist mit Elena, Luca und Jason unterwegs. Was drinnen passiert ist, erzählt die Szene nicht; sie zeigt den Platz davor. Dialoge sind rekonstruiert.", steps: [
    beat("teacher", "Herrn Kluger zuhören", "So, das ist das Europäische Parlament. Bleibt bitte in euren Gruppen zusammen.", { x: .42, y: .56 }, { speaker: "Herr Kluger", art: "kluger", emotion: "neutral", cast: ["Herr Kluger", "Elena", "Luca", "Jason"] }),
    beat("group", "Mit Elena reden", "Das Gebäude ist riesig. Ganz schön viel Glas.", { x: .30, y: .66 }, { speaker: "Elena", art: "elena", emotion: "happy", choices: ["Lass uns ein Foto machen", "Komm, wir gehen näher ran"] }),
    beat("look", "Das Parlament ansehen", "Hier wird also über Europa entschieden. Irgendwie beeindruckend, das mal in echt zu sehen.", { x: .66, y: .58 }, { speaker: "Felice", art: "felice", emotion: "thoughtful", animation: "inspect" }),
    beat("back", "Zurück zum Bus", "Am Nachmittag geht es zurück nach Kehl ins Hotel.", { x: .50, y: .78 }, { speaker: "Erzählung", emotion: "neutral" }),
  ] }),
  sequence({ id: "klassenfahrt-pokalabend", title: "Klassenfahrt: Pizza und Pokalabend", date: "2026-04-22", chapterNumber: 6, place: "hotelboys", start: 1200, end: 1380, spawn: { x: .34, y: .74 }, illustration: "/rooms/trip-hotelboys-v11.webp", symbol: "⚽", cast: ["Felice", "Elias", "Paul", "Justin"],
    hint: "Heute Abend läuft das Pokalspiel. Die Jungs schauen es in ihrem Zimmer nebenan.",
    description: "Am Mittwochabend bestellen Felice, Elias, Paul und Justin Pizza und schauen im Hotelzimmer das DFB-Pokal-Halbfinale Leverkusen gegen Bayern. Dialoge sind rekonstruiert.", steps: [
    beat("pizza", "Pizza bestellen", "Wir bestellen Pizza. Wer will was?", { x: .60, y: .68 }, { speaker: "Justin", art: "justin", emotion: "happy", choices: ["Margherita", "Salami"] }),
    beat("tv", "Zum Fernseher", "Gleich geht’s los: Pokal-Halbfinale, Leverkusen gegen Bayern.", { x: .80, y: .36 }, { speaker: "Paul", art: "paul", emotion: "happy" }),
    beat("sit", "Sich zu Elias setzen", "Komm, setz dich zu mir. Von hier sieht man am besten.", { x: .54, y: .46 }, { emotion: "love", animation: "sit" }),
    beat("evening", "Den Abend genießen", "Pizza, Fußball und ihr drei. So ein Abend bleibt hängen.", { x: .46, y: .62 }, { speaker: "Felice", art: "felice", emotion: "happy", animation: "heart" }),
  ] }),
  sequence({ id: "klassenfahrt-europapark", title: "Klassenfahrt: Europa-Park", date: "2026-04-23", chapterNumber: 6, place: "europapark", start: 570, end: 1080, spawn: { x: .40, y: .80 }, illustration: "/rooms/trip-europapark-v11.webp", symbol: "🎢", cast: ["Felice", "Elena", "Luca", "Jason"],
    hint: "Heute ist Europa-Park! Der Weg startet an der Hoteltür.",
    description: "Am Donnerstag ist die Klasse im Europa-Park. Felice läuft mit Elena, Luca und Jason herum, und sie fahren Achterbahn. Welche Bahn es war, nennt das Spiel nicht. Dialoge sind rekonstruiert.", steps: [
    beat("start", "Mit Luca den Tag planen", "Erst mal rumlaufen und gucken, oder direkt zur Achterbahn?", { x: .40, y: .66 }, { speaker: "Luca", art: "luca", emotion: "happy", choices: ["Erst rumlaufen", "Direkt Achterbahn"] }),
    beat("walk", "Durch den Park laufen", "So viele Farben und Geräusche. Hier gibt es an jeder Ecke was zu sehen.", { x: .26, y: .58 }, { speaker: "Felice", art: "felice", emotion: "happy", animation: "walk" }),
    beat("queue", "Mit Jason zur Achterbahn", "Da vorne ist die Schlange. Wer traut sich?", { x: .60, y: .48 }, { speaker: "Jason", art: "jason", emotion: "laughing" }),
    beat("ride", "Achterbahn fahren", "Hoch, runter, Kurve. Schreien und Lachen gleichzeitig. Danach zittern die Knie ein bisschen.", { x: .60, y: .50 }, { speaker: "Erzählung", emotion: "laughing", animation: "fireworks" }),
    beat("again", "Mit Elena lachen", "Nochmal?", { x: .50, y: .70 }, { speaker: "Elena", art: "elena", emotion: "laughing", choices: ["Auf jeden Fall", "Erst mal was trinken"] }),
  ] }),
  sequence({ id: "klassenfahrt-hotelabend", title: "Klassenfahrt: Der letzte Abend", date: "2026-04-23", order: 1, chapterNumber: 6, place: "hotelboys", start: 1230, end: 1380, spawn: { x: .34, y: .74 }, illustration: "/rooms/trip-hotel-v11.webp", symbol: "☾", cast: ["Felice", "Elias", "Paul", "Justin"],
    hint: "Der letzte Abend der Klassenfahrt. Ich schaue nochmal bei Elias vorbei.",
    description: "Am Donnerstagabend klopfen Elias, Paul und Justin als Streich an fremde Türen. Danach wird es ruhig: ein Moment nur für Felice und Elias, der persönlich bleibt. Dialoge sind rekonstruiert.", steps: [
    beat("knock", "Klopf, klopf", "Elias, Paul und Justin klopfen an fremde Türen und sind weg, bevor jemand aufmacht. Ein bisschen Chaos gehört dazu.", { x: .30, y: .74 }, { speaker: "Erzählung", emotion: "laughing" }),
    beat("talk", "Mit Elias allein reden", "Es war eine schöne Woche mit dir.", { x: .50, y: .62 }, { place: "hotel", emotion: "love", choices: ["Mit dir auch", "Ich will noch gar nicht nach Hause"], cast: ["Elias"] }),
    beat("private", "Ein Moment nur für euch", "Ein ruhiger Moment nur für euch zwei.", { x: .50, y: .62 }, { place: "hotel", speaker: "Erzählung", emotion: "love", animation: "fade", cast: ["Elias"] }),
    beat("later", "Später", "Später. Draußen ist es still, und morgen geht es nach Hause.", { x: .50, y: .62 }, { place: "hotel", speaker: "Erzählung", emotion: "neutral", cast: [] }),
  ] }),
  sequence({ id: "klassenfahrt-heimreise", title: "Unsere Klassenfahrt", date: "2026-04-24", chapterNumber: 6, place: "hotel", start: 480, end: 900, spawn: { x: .50, y: .62 }, illustration: "/rooms/trip-europapark-v11.webp", symbol: "🧳", cast: ["Felice", "Elias", "Frau Kaiser", "Herr Kluger"], leaveAt: { place: "school", point: { x: .52, y: .90 } },
    hint: "Heute geht es nach Hause. Erst mal den Koffer packen.",
    description: "Am Freitag fährt die Klasse mit dem Bus zurück. Fünf Tage Kehl, Straßburg und Europa-Park sind im Album bewahrt. Dialoge sind rekonstruiert.",
    artifacts: [{ id: "klassenfahrt-2026", title: "Unsere Klassenfahrt: Straßburg, Kehl & Europa-Park", symbol: "🧳", description: "20. bis 24. April 2026. Bus, B&B Hotel in Kehl, Europäisches Parlament, Pizza und Pokalabend, Achterbahn im Europa-Park und ein Klopfstreich." }], steps: [
    beat("pack", "Koffer packen", "Koffer packen. Fünf Tage gehen schneller vorbei, als man denkt.", { x: .75, y: .68 }, { speaker: "Felice", art: "felice", emotion: "thoughtful", animation: "inspect", cast: [] }),
    beat("home", "Ankunft in Zörbig", "Alle wieder da? Dann ab nach Hause. Danke für die schöne Fahrt!", { x: .50, y: .70 }, { place: "school", speaker: "Herr Kluger", art: "kluger", emotion: "happy", animation: "arrival", cast: ["Herr Kluger", "Frau Kaiser"] }),
    beat("thanks", "Elias verabschieden", "Danke für diese Woche. Ich werd sie nicht vergessen.", { x: .62, y: .78 }, { place: "school", emotion: "love", choices: ["Ich auch nicht", "Wir schreiben später"], cast: ["Elias"] }),
  ] }),
  sequence({ id: "longer-visit-plan", title: "Mehrere Tage zusammen", date: "2026-05-06", chapterNumber: 6, place: "bedroom", start: 1140, end: 1170, spawn: { x: .5, y: .6 }, symbol: "▤", description: "Am 6. Mai planen wir, mehrere Tage miteinander zu verbringen. Der Plan ist bestätigt; noch offene Details und der genaue spätere Ablauf werden nicht ergänzt.", steps: [
    beat("idea", "Den Gedanken an einen längeren Besuch teilen", "Wie wäre es, wenn wir uns bald mehrere Tage füreinander nehmen?", { x: .5, y: .6 }, { emotion: "thoughtful" }),
    beat("plan", "Gemeinsam über den Besuch nachdenken", "Ich würde mich freuen. Wir können in Ruhe schauen, wie es für uns passt.", { x: .60, y: .395 }, { speaker: "Felice", art: "felice", emotion: "happy", choices: ["Über gemeinsame Zeit sprechen", "Erst mal schauen, wann es passt"], animation: "inspect" }),
    beat("remember", "Den Plan im Kalender bewahren", "Ein gemeinsamer Plan.", { x: .5, y: .6 }, { speaker: "Erzählung", emotion: "neutral" }),
  ] }),
  sequence({ id: "may-everyday", title: "Zeit füreinander", date: "2026-05-14", until: "2026-05-17", period: "14.–17. Mai 2026 · Spielerische Möglichkeit", source: "staged", chapterNumber: 6, place: "home", start: 960, end: 1080, spawn: { x: .4, y: .65 }, illustration: "/rooms/garden-v06.webp", symbol: "❧", description: "Um den 14. bis 17. Mai können passende Alltagsszenen gespielt werden. Diese Möglichkeit bestätigt keinen tatsächlich durchgeführten mehrtägigen Besuch und keine weiteren unüberlieferten Details.", steps: [
    beat("time", "Gemeinsame Zeit gestalten", "Ein ganz normaler Tag im Mai.", { x: .4, y: .65 }, { speaker: "Erzählung", emotion: "neutral" }),
    beat("talk", "Mit Elias sprechen", "Was möchtest du gerade teilen? Wir können einfach zuhören und uns nicht beeilen.", { x: .5, y: .65 }, { place: "garden", emotion: "thoughtful", choices: ["Über einen schönen Gedanken reden", "Einen ruhigen Moment teilen"] }),
    beat("hug", "Die Alltagsszene bewahren", "Einfach zusammen sein. Das reicht mir.", { x: .5, y: .65 }, { place: "garden", speaker: "Felice", art: "felice", emotion: "happy", animation: "hug" }),
  ] }),
  // Summer: three real activities (camping, the pool at Elias', the lake in Gölzau). Their exact
  // days are not known, so they stay playable scenes within their month on existing backdrops.
  sequence({ id: "summer-everyday", title: "Campen", date: "2026-06-01", until: "2026-06-30", period: "Juni 2026 · Spielbare Alltagsszene", source: "staged", chapterNumber: 7, place: "garden", start: 1200, end: 1320, spawn: { x: .5, y: .65 }, illustration: "/rooms/garden-v06.webp", symbol: "⛺", description: "Im Sommer gehen wir campen. Der genaue Tag und der Ort sind nicht festgehalten; Felices Garten ist die Spielkulisse, die gesprochenen Sätze sind rekonstruiert.", steps: [
    beat("outside", "Elias draußen treffen", "Zelt steht. Fast gerade.", { x: .5, y: .65 }, { emotion: "laughing", animation: "arrival" }),
    beat("walk", "Noch eine Runde laufen", "Wird langsam dunkel. Hast du ’ne Taschenlampe mit?", { x: .6, y: .7 }, { emotion: "happy", animation: "walk", choices: ["„Ich hab nur dich“", "„Handylicht reicht“"] }),
    beat("bench", "Zusammen draußen sitzen", "Erzähl mir noch eine Geschichte. Bei deinen schlaf ich immer so schnell ein.", { x: .25, y: .65 }, { speaker: "Felice", art: "felice", emotion: "love", animation: "sit" }),
    beat("laugh", "Ins Zelt kriechen", "Eine Nacht im Zelt, zu zweit, und draußen zirpt es.", { x: .5, y: .65 }, { speaker: "Erzählung", emotion: "love", animation: "sleep" }),
  ] }),
  sequence({ id: "summer-july", title: "Planschen im Pool", date: "2026-07-01", until: "2026-07-31", period: "Juli 2026 · Spielbare Alltagsszene", source: "staged", chapterNumber: 7, place: "eliasroom", start: 900, end: 1080, spawn: { x: .5, y: .85 }, illustration: "eliasroom", symbol: "🌊", description: "Bei Elias planschen wir im Pool. Der genaue Tag ist nicht festgehalten; Elias’ Zimmer ist die Spielkulisse für den Nachmittag, die gesprochenen Sätze sind rekonstruiert.", steps: [
    beat("walk", "Elias begrüßen", "Badesachen dabei? Pool ist voll.", { x: .5, y: .65 }, { emotion: "happy", animation: "arrival" }),
    beat("bench", "Ab ins Wasser", "Wenn du mich nass spritzt, gibt’s Rache.", { x: .735, y: .545 }, { speaker: "Felice", art: "felice", emotion: "laughing", choices: ["Ihn trotzdem nass spritzen", "Unschuldig gucken"] }),
    beat("hug", "Den Nachmittag bewahren", "Ein ganzer Nachmittag im Wasser, bis die Finger schrumpelig sind.", { x: .5, y: .65 }, { speaker: "Erzählung", emotion: "love", animation: "heart" }),
  ] }),
  sequence({ id: "summer-august", title: "Baden am See in Gölzau", date: "2026-08-01", until: "2026-08-31", period: "August 2026 · Spielbare Alltagsszene", source: "staged", chapterNumber: 7, place: "goelzau", start: 840, end: 1020, spawn: { x: .86, y: .63 }, illustration: "/rooms/goelzau-range-v1.webp", symbol: "☀", description: "Im Sommer baden wir am See in Gölzau. Der genaue Tag ist nicht festgehalten; der Weg in Gölzau ist die Spielkulisse, die gesprochenen Sätze sind rekonstruiert.", steps: [
    beat("walk", "Mit Elias Richtung See laufen", "Heute nicht zum Schießstand. Heute geht’s an den See.", { x: .70, y: .49 }, { speaker: "Felice", art: "felice", emotion: "happy", animation: "walk" }),
    beat("bench", "Am Ufer ankommen", "Wer zuerst drin ist?", { x: .45, y: .36 }, { emotion: "laughing", choices: ["„Ich!“ und losrennen", "Erst mal Zeh ins Wasser"] }),
    beat("hug", "Den Tag bewahren", "Sonne, kaltes Wasser und Elias neben mir. Mehr Sommer geht nicht.", { x: .40, y: .36 }, { speaker: "Felice", art: "felice", emotion: "love", animation: "hug" }),
  ] }),
  sequence({ id: "autumn-everyday", title: "Zusammen durch den Herbst", date: "2026-09-01", until: "2026-10-07", period: "September & Anfang Oktober 2026 · Spielbare Alltagsszene", source: "staged", chapterNumber: 8, place: "school", start: 780, end: 900, spawn: { x: .60, y: .88 }, illustration: "/rooms/school-court-secondary-v075.webp", symbol: "🍂", description: "Schule, Training, Alltag, Zukunft und Zusammenhalt begleiten den Herbst. Die kleine Szene verbindet diese Themen, ohne ein zusätzliches datiertes Treffen zu erfinden.", steps: [
    beat("school", "Elias im Schulalltag treffen", "Zwischen Schule und Alltag finden wir immer wieder Gedanken, die wir teilen können.", { x: .52, y: .90 }, { emotion: "thoughtful", choices: ["Über Schule sprechen", "Über Training und Hobbys sprechen"] }),
    beat("future", "Über unsere gemeinsame Zukunft sprechen", "Ich möchte, dass wir weiter miteinander reden. Auch wenn der Alltag manchmal viel ist.", { x: .60, y: .76 }, { speaker: "Felice", art: "felice", emotion: "love" }),
    beat("remember", "Auf schöne Momente zurückblicken", "Dann erinnern wir uns an das, was uns schon verbindet.", { x: .55, y: .82 }, { emotion: "happy", animation: "reflection" }),
  ] }),
  {
    id: "morning-2026-10-08", title: "Ein liebevoller Morgen", date: "2026-10-08", order: 0, chapterNumber: 8, symbol: "☀", source: "historical", cast: ["Felice", "Elias"],
    place: "bedroom", scene: "message", requires: [], confirmed: true,
    description: "Am 8. Oktober um 7:15 schreibt Elias „Guten Morgen, mein Schatz“. Am Nachmittag soll ich raten, was er gestartet hat. Alle Nachrichten sind original.",
    illustration: "/rooms/felice-bedroom-v10.webp", staging: { start: 435, end: 460, spawn: { x: .5, y: .6 }, timeConfirmed: true },
    dialogue: [
      ...originalLines("morning-2026-10-08").slice(0, 2).map((line, index) => ({ ...line, emotion: index ? "laughing" : "love" })),
      narration("Am Nachmittag, 16:42."),
      ...originalLines("morning-2026-10-08").slice(2),
      narration("Gemeint war ein Plan für Weihnachten mit Justin und Paul. Ein ganz normaler Tag. Und trotzdem ein schöner.", "thoughtful"),
    ], interactions: ["Platz nehmen", "Die Morgennachricht öffnen", "Elias antworten", "Raten, was er gestartet hat"],
  },
  sequence({ id: "our-story-finale", title: "Unsere Geschichte geht weiter", date: STORY_END, period: "02.11.2026 · Spielerischer Ausblick", source: "future", chapterNumber: 8, place: "garden", start: 960, end: 1000, spawn: { x: .5, y: .65 }, illustration: "/rooms/garden-v06.webp", symbol: "♥", special: true, description: "Ein spielerischer Ausblick am Ende des Kalenders. Die Tage nach dem 8. Oktober sind keine abgeschlossenen historischen Erlebnisse. Felice und Elias schauen auf freigeschaltete Erinnerungen zurück und stehen am Ende nebeneinander.", steps: [
    beat("beginning", "Auf den gemeinsamen Anfang zurückblicken", "Die ersten Gespräche. Das Fahrrad. Die Schokolade. Die Gefühle, die langsam Worte fanden.", { x: .5, y: .65 }, { speaker: "Felice", art: "felice", emotion: "thoughtful", animation: "reflection" }),
    beat("winter", "Die Wintermomente wiedersehen", "Das erste Liebesgeständnis. Deine drei Reihen Punkte und mein „Ich liebe dich auch“. Die Parkbank, der Weihnachtsmarkt und Weihnachten mit unserem ersten Kuss.", { x: .6, y: .7 }, { emotion: "love", animation: "reflection" }),
    beat("year", "Unser Jahr im Album ansehen", "Valentinstag. Das Wochenende bei dir. Die Klassenfahrt. Und so viele kleine Tage dazwischen.", { x: .5, y: .65 }, { speaker: "Felice", art: "felice", emotion: "happy", animation: "reflection" }),
    // Closing lines chosen by Elias on 15.10.2026, after the chat of 22.11.2025 ("Also für immer ?").
    beat("together", "Neben Elias stehen", "Also für immer?", { x: .5, y: .65 }, { speaker: "Felice", art: "felice", emotion: "love" }),
    beat("forever", "Elias antworten lassen", "Genau so. ❤️", { x: .5, y: .65 }, { emotion: "love", animation: "heart" }),
  ] }),
];
// A single chronology bridges new scenes with existing stable IDs. Already
// completed memories keep their status even when a predecessor is added later.
const withChat = (event: StoryEvent): StoryEvent => ORIGINAL_CHATS[event.id]?.lines?.length ? { ...event, chat: { date: ORIGINAL_CHATS[event.id].date, lines: originalLines(event.id) } } : event;
const mainline = datedEvents.sort((a, b) => a.date!.localeCompare(b.date!) || a.order - b.order).map((event, index, events) => withChat({ ...event, requires: index ? [events[index - 1].id] : [] }));
export const STORY_EVENTS: StoryEvent[] = [
  ...mainline,
  // Existing mechanics and their saved completions remain separate drafts.
  // A legacy Christmas finish does not imply completion of the confirmed kiss.
  ...CHAPTERS.map((chapter, index): StoryEvent => ({
    id: `legacy-${chapter.id}`, title: chapter.title, date: null, period: chapter.id === "graduation" ? chapter.date : undefined, order: index, place: chapter.steps[0].place,
    scene: "legacy", requires: [], confirmed: false, source: "staged", chapter: chapter.id,
    description: chapter.id === "christmas" ? "Der vorhandene Weihnachtsentwurf bleibt mit seinen Abschlüssen erhalten. Die bestätigte Weihnachtsgeschichte vom 25. Dezember und der erste Kuss werden im Hauptkalender separat erlebt." : "Diese Geschichte gehört zu eurer Welt. Das historische Datum und der genaue Ablauf werden später mit bestätigten Angaben ergänzt. Der vorhandene Szenenentwurf bleibt spielbar.",
    illustration: chapter.id === "dog" ? "/rooms/garden-v06.webp" : chapter.id === "christmas" ? "/rooms/home-winter-v06.webp" : chapter.id === "school" ? "/rooms/zoerbig-market-v09.webp" : chapter.id === "graduation" ? "/rooms/graduation-gym-v08.webp" : "/rooms/goelzau-range-v1.webp",
    staging: { start: 840, end: 900, spawn: { x: .5, y: .7 }, timeConfirmed: false },
    dialogue: chapter.steps.map(step => ({ speaker: "Erzählung", text: step.text })), interactions: chapter.steps.map(step => step.label),
  })),
];

export type EventProgress = { cursor: number; topics: string[]; topic: string | null; line: number; visits: number; typed?: number; answers?: Record<string,string>; completedAt?: string };
export type StorySession = { id: string; returnPlayer: Point; returnDirection: "front" | "back" | "left" | "right" };
// Version 2 adds Felice's inventory and one-time flags (e.g. the intro). Version 1
// saves are migrated on read; nothing is dropped.
export type TimelineSave = { version: 2; clock: DaySave; progress: Record<string, EventProgress>; active: StorySession | null; inventory: string[]; flags: string[] };
export const INTRO_FLAG = "intro-seen";
export const emptyEvent = (): EventProgress => ({ cursor: 0, topics: [], topic: null, line: 0, visits: 0 });
export function historicalDate(date: string | null) { return date ? date.split("-").reverse().join(".") : "Historisches Datum noch offen"; }
export function eventById(id: string) { return STORY_EVENTS.find(event => event.id === id); }
export function initialTimeline(legacyDay?: DaySave, legacyStory?: StorySave, shootingCompleted = false): TimelineSave {
  const clock = legacyDay ? boundClock(legacyDay) : { ...initialDay(new Date(`${STORY_START}T12:00:00Z`)), date: STORY_START, season: "Herbst" as const };
  const progress: Record<string, EventProgress> = {};
  for (const id of legacyStory?.completed ?? []) progress[`legacy-${id}`] = { ...emptyEvent(), visits: 1, completedAt: "legacy" };
  if (shootingCompleted && !progress["legacy-shooting"]) progress["legacy-shooting"] = { ...emptyEvent(), visits: 1, completedAt: "legacy" };
  // Returning players (older day or chapter saves) are not shown the new-game intro.
  const returning = Boolean(legacyDay || legacyStory?.completed.length || shootingCompleted);
  return { version: 2, clock, progress, active: null, inventory: [], flags: returning ? [INTRO_FLAG] : [] };
}
/** Items earned by already completed memories, used when migrating version-1 saves. */
export function earnedRewards(progress: Record<string, EventProgress>) {
  return [...new Set(STORY_EVENTS.filter(event => progress[event.id]?.completedAt).flatMap(event => event.rewards ?? []))];
}
export function calendarSeason(date: string): Season {
  const month = Number(date.slice(5,7));
  return month === 12 || month <= 2 ? "Winter" : month <= 5 ? "Frühling" : month <= 8 ? "Sommer" : "Herbst";
}
export function storySeason(event: StoryEvent | undefined, clock: DaySave): Season { return calendarSeason(event?.date ?? clock.date); }
export function boundClock(clock: DaySave): DaySave {
  clock = { ...clock, season: calendarSeason(clock.date < STORY_START ? STORY_START : clock.date > STORY_END ? STORY_END : clock.date) };
  if (clock.date < STORY_START) return { ...clock, date: STORY_START, day: 1, minute: WAKE_MINUTE };
  if (clock.date > STORY_END) {
    const overflowDays = Math.round((Date.parse(`${clock.date}T12:00Z`) - Date.parse(`${STORY_END}T12:00Z`)) / 86400000);
    return { ...clock, date: STORY_END, day: Math.max(1, clock.day - overflowDays), minute: 1439 };
  }
  return clock;
}
export function advanceTimelineClock(clock: DaySave, minutes: number) {
  const result = advanceClock(clock, minutes);
  return { save: boundClock(result.save), notices: result.notices.filter(notice => notice.date < STORY_END || notice.date === STORY_END && notice.minute < 1440) };
}
export function sleepTimelineClock(clock: DaySave) { return clock.date === STORY_END && clock.minute >= WAKE_MINUTE ? clock : boundClock(sleepUntilMorning(clock)); }
/**
 * Sleeping skips unimportant days: Felice wakes at 5:30 on the next day that
 * holds a memory. If a memory is still open today or already due, she only
 * sleeps until the next morning. The date never moves backwards.
 */
export function sleepToStoryDay(save: TimelineSave): DaySave {
  const morning = sleepTimelineClock(save.clock);
  // Ordinary school days are lived one by one, never skipped.
  if (isRoutineDay(morning.date)) return morning;
  const next = nextEvent(save);
  if (save.active || !next?.date || next.date < morning.date) return morning;
  // A memory before the usual wake-up time (New Year at midnight) wakes Felice right when it starts.
  if (next.staging.start < WAKE_MINUTE) {
    if (next.date === save.clock.date || next.date === morning.date && save.clock.date === morning.date) return morning;
    return clockAtLeast(save.clock, next.date, next.staging.start);
  }
  if (next.date === morning.date) return morning;
  return clockAtLeast(morning, next.date, WAKE_MINUTE);
}
/** True while today's next memory is still ahead: Felice stays awake for it instead of sleeping past it. */
export function memoryPendingToday(save: TimelineSave) {
  const next = nextEvent(save);
  return Boolean(!save.active && next?.date && next.date === save.clock.date);
}
/** Felice sleeps in the evening (from 20:00) or after midnight, never in the middle of the afternoon. */
export const BEDTIME = 20 * 60;
export function canSleep(save: TimelineSave) {
  return !memoryPendingToday(save) && (save.clock.minute >= BEDTIME || save.clock.minute < WAKE_MINUTE);
}
/** On a school day the lesson is still ahead and was not attended yet. */
export function schoolPending(save: TimelineSave) {
  const { date, minute } = save.clock;
  return isSchoolDay(date) && !isRoutineDay(date) && minute < SCHOOL_END && !save.flags.includes(`routine-${date}-school`);
}
const WEEKDAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
export function weekday(date: string) { return WEEKDAYS[new Date(`${date}T12:00:00Z`).getUTCDay()]; }
/** Calendar sheets shown while sleeping; long jumps collapse into a gap marker ("…"). */
export function calendarPages(from: string, to: string): (string | null)[] {
  const total = Math.max(0, daysBetween(from, to));
  const at = (offset: number) => new Date(Date.parse(`${from}T12:00:00Z`) + offset * 86400000).toISOString().slice(0, 10);
  if (total <= 5) return Array.from({ length: total + 1 }, (_, i) => at(i));
  return [at(0), at(1), null, at(total - 1), at(total)];
}
export function daysBetween(from: string, to: string) { return Math.round((Date.parse(`${to}T12:00Z`) - Date.parse(`${from}T12:00Z`)) / 86400000); }
/** The day of the story shown to the player, always derived from the date so old or migrated counters cannot disagree with it. */
export function storyDayNumber(date: string) { return Math.max(1, daysBetween(STORY_START, date) + 1); }
export function eventStatus(save: TimelineSave, event: StoryEvent): "gesperrt" | "verfügbar" | "abgeschlossen" {
  if (save.progress[event.id]?.completedAt) return "abgeschlossen";
  if (!event.confirmed || !event.date || event.date < STORY_START || event.date > STORY_END) return "gesperrt";
  if (!event.requires.every(id => Boolean(save.progress[id]?.completedAt))) return "gesperrt";
  return save.clock.date > event.date || save.clock.date === event.date && save.clock.minute >= event.staging.start ? "verfügbar" : "gesperrt";
}
export function nextEvent(save: TimelineSave) {
  return STORY_EVENTS.find(event => event.confirmed && event.date && !save.progress[event.id]?.completedAt);
}
export function jumpToNext(save: TimelineSave): TimelineSave {
  const next = nextEvent(save);
  if (!next?.date || save.active) return save;
  return { ...save, clock: clockAtLeast(save.clock, next.date, next.staging.start) };
}
export function clockAtLeast(clock: DaySave, date: string, minute: number): DaySave {
  if (clock.date > date || clock.date === date && clock.minute >= minute) return clock;
  const days = Math.round((Date.parse(`${date}T12:00Z`) - Date.parse(`${clock.date}T12:00Z`)) / 86400000);
  return boundClock({ ...clock, date, minute, day: clock.day + days });
}
/** The single gate deciding whether a first (non-replay) play of a memory may start. */
export function canTrigger(save: TimelineSave, event: StoryEvent | undefined): boolean {
  return Boolean(event && event.scene !== "legacy" && !save.active && eventStatus(save, event) === "verfügbar");
}
export type StoryTrigger = { place: Place; point: Point; radius: number; mode: "enter" | "interact" | "phone"; label: string; hint: string };
const PLACE_HINTS: Partial<Record<Place, string>> = {
  bedroom: "in meinem Zimmer nachsehen", home: "ins Wohnzimmer gehen", kitchen: "in die Küche gehen", garden: "in den Garten gehen",
  radegast: "nach draußen gehen", playground: "zum Spielplatz gehen", christmasmarket: "nach Zörbig zum Weihnachtsmarkt fahren",
  eliasroom: "nach Zörbig zu Elias fahren", hotel: "ins Hotelzimmer gehen", hotelboys: "zu Elias, Paul und Justin ins Zimmer gehen",
  parliament: "nach Straßburg zum Parlament fahren", europapark: "in den Europa-Park fahren", school: "zum Pausenhof in Zörbig fahren", schoolway: "nach Zörbig auf den Schulweg fahren",
};
// The pasture lies beside the Radegast path; walking onto it starts the meeting.
const PASTURE_TRIGGER: Point = { x: .52, y: .50 };
/** Where and how a waiting memory is started from the world instead of a menu. */
export function storyTrigger(event: StoryEvent): StoryTrigger {
  if (event.scene === "encounter") return { place: "radegast", point: PASTURE_TRIGGER, radius: .055, mode: "enter", label: "Zum Treffpunkt", hint: event.hint ?? "Vielleicht sollte ich zum Treffpunkt gehen." };
  if (event.scene !== "sequence") return { place: "bedroom", point: { x: .60, y: .395 }, radius: .13, mode: "phone", label: "Handy", hint: event.hint ?? (event.scene === "chat" ? "Vielleicht schaue ich heute Abend auf mein Handy. Am Bett oder Schreibtisch kann ich in Ruhe schreiben." : "Mein Handy … Vielleicht ist eine Nachricht gekommen. Am Bett oder Schreibtisch kann ich nachsehen.") };
  const first = event.steps?.[0];
  const place = first?.place ?? event.place;
  return { place, point: first?.target ?? event.staging.spawn, radius: .13, mode: "interact", label: first?.label ?? event.title, hint: event.hint ?? `Vielleicht sollte ich ${PLACE_HINTS[place] ?? "mich ein bisschen umsehen"}.` };
}
/** On ordinary school days the thought follows the clock and what is already ticked off, so it never suggests school at night. */
function routineThought(save: TimelineSave) {
  const { date, minute } = save.clock;
  const done = (task: string) => save.flags.includes(`routine-${date}-${task}`);
  if (!done("school") && minute < SCHOOL_START) return done("wash") ? "Fertig gemacht. Jetzt los zur Schule, um 7:15 Uhr geht es los." : "Ein ganz normaler Schultag. Erst frischmachen, dann ab zur Schule.";
  if (!done("school") && minute < SCHOOL_END) return "Der Unterricht hat schon angefangen. Schnell ins Schulgebäude!";
  if (!done("homework")) return "Die Schule ist vorbei. Zu Hause noch Hausaufgaben machen, dann ins Bett.";
  return "Alles erledigt für heute. Jetzt kann ich ins Bett.";
}
/** Felice's gentle thought about what could come next; the key changes only when the situation does. */
export function storyHint(save: TimelineSave): { key: string; text: string } | null {
  if (save.active) return null;
  const next = nextEvent(save);
  if (!next?.date) return { key: "complete", text: "Unser Jahr ist im Album bewahrt. Ich kann mir jede Erinnerung noch einmal ansehen." };
  if (canTrigger(save, next)) return { key: `${next.id}:go`, text: storyTrigger(next).hint };
  if (isRoutineDay(save.clock.date)) return { key: `routine:${save.clock.date}`, text: routineThought(save) };
  if (schoolPending(save)) return { key: `school:${save.clock.date}:${save.clock.minute < SCHOOL_START}`, text: save.clock.minute < SCHOOL_START ? "Heute ist Schule. Um 7:15 Uhr geht es in Zörbig los." : "Der Unterricht läuft schon. Schnell nach Zörbig in die Schule!" };
  if (next.date === save.clock.date) return { key: `${next.id}:later`, text: "Heute passiert später noch etwas. Bis dahin kann ich mich umsehen – oder mich hinsetzen und ein bisschen warten." };
  return { key: `${next.id}:sleep`, text: "Heute ist ein ruhiger Tag. Wenn ich schlafen gehe, blättert der Kalender zum nächsten besonderen Tag." };
}
export type NextStep = { key: string; status: "active" | "go" | "later" | "sleep" | "routine" | "complete"; event: StoryEvent | null; place: Place | null; title: string; detail: string };
const minuteText = (minute: number) => `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
/** The one answer to "what now?". The world, the phone, the album and the map all show this. */
export function nextStepInfo(save: TimelineSave): NextStep {
  if (save.active) {
    const event = eventById(save.active.id) ?? null;
    return { key: `active:${save.active.id}`, status: "active", event, place: null, title: event?.title ?? "Laufende Erinnerung", detail: "Diese Erinnerung läuft gerade." };
  }
  const next = nextEvent(save);
  if (!next?.date) return { key: "complete", status: "complete", event: null, place: null, title: "Unser Jahr ist bewahrt", detail: "Jede Erinnerung lässt sich im Album noch einmal erleben." };
  if (canTrigger(save, next)) {
    const trigger = storyTrigger(next);
    return { key: `${next.id}:go`, status: "go", event: next, place: trigger.place, title: next.title, detail: trigger.mode === "phone" ? `Handy · ${PLACES[trigger.place].name}, am Bett oder Schreibtisch` : `Jetzt · ${PLACES[trigger.place].name}` };
  }
  if (isRoutineDay(save.clock.date)) return { key: `routine:${save.clock.date}`, status: "routine", event: next, place: null, title: "Ein normaler Schultag", detail: "Tagesablauf erledigen, danach ins Bett." };
  if (schoolPending(save)) return { key: `school:${save.clock.date}`, status: "routine", event: next, place: "school", title: "Schultag", detail: `Unterricht ${clockText(SCHOOL_START)}–${clockText(SCHOOL_END)} Uhr in Zörbig${next.date === save.clock.date ? `, danach ${next.title}` : ""}.` };
  if (next.date === save.clock.date) return { key: `${next.id}:later`, status: "later", event: next, place: null, title: next.title, detail: `Heute ab ${minuteText(next.staging.start)} Uhr. Bis dahin umsehen oder warten.` };
  return { key: `${next.id}:sleep`, status: "sleep", event: next, place: null, title: next.title, detail: `Am ${historicalDate(next.date)}. Schlafen gehen blättert den Kalender weiter.` };
}
/** Minutes to wait until today's next memory, or null when nothing is pending later today. */
export function waitingMinutes(save: TimelineSave) {
  const next = nextEvent(save);
  if (save.active || !next?.date || next.date !== save.clock.date || save.clock.minute >= next.staging.start) return null;
  return next.staging.start - save.clock.minute;
}
export function beginEvent(save: TimelineSave, id: string, player: Point, direction: StorySession["returnDirection"]): TimelineSave {
  const event = eventById(id);
  if (!event || !canTrigger(save, event)) return save;
  return { ...save, active: { id, returnPlayer: player, returnDirection: direction }, progress: { ...save.progress, [id]: save.progress[id] ?? emptyEvent() } };
}
export function completeEvent(save: TimelineSave, id: string, replay = false, now = new Date().toISOString()): TimelineSave {
  const event = eventById(id);
  if (!event || (!replay && save.active?.id !== id) || (replay && !save.progress[id]?.completedAt)) return save;
  const prior = save.progress[id] ?? emptyEvent();
  if (!replay && (event.scene === "sequence" && prior.cursor < (event.steps?.length ?? 1) || (event.scene === "confession" || event.scene === "message" || event.scene === "love") && prior.cursor < event.dialogue.length)) return save;
  if (!replay && (event.scene === "chat" && (new Set(prior.topics).size < 2 || prior.topic !== null) || event.scene === "encounter" && prior.cursor < 4)) return save;
  return {
    ...save, active: replay ? save.active : null,
    clock: replay || !event.date ? save.clock : clockAtLeast(save.clock, event.date, event.staging.end),
    // Replays never change real progress, including the inventory.
    inventory: replay ? save.inventory : [...new Set([...save.inventory, ...event.rewards ?? []])],
    progress: { ...save.progress, [id]: { ...prior, topic: null, line: 0, completedAt: prior.completedAt ?? now, visits: prior.visits + 1 } },
  };
}
// A strict versioned boundary prevents corrupt or newer saves being overwritten.
// Unknown event IDs are retained for future additions and removed configurations.
export function parseTimeline(raw: string): TimelineSave {
  const value = JSON.parse(raw);
  if (value?.version !== 1 && value?.version !== 2 || !value.clock || typeof value.clock !== "object" || !value.progress || typeof value.progress !== "object" || Array.isArray(value.progress)) throw new Error("Unbekannter Story-Kalender");
  const clock = parseDay(JSON.stringify(value.clock));
  if (clock.date < STORY_START || clock.date > STORY_END) throw new Error("Kalender außerhalb der Geschichte");
  const progress: Record<string, EventProgress> = {};
  for (const [id, state] of Object.entries(value.progress) as [string, EventProgress][]) {
    if (!/^[a-z0-9-]+$/.test(id) || !state || !Number.isInteger(state.cursor) || state.cursor < 0 || state.cursor > 64 || !Number.isInteger(state.line) || state.line < 0 || state.line > 64 || state.typed !== undefined && (!Number.isInteger(state.typed) || state.typed < 0 || state.typed > 10000) || !Number.isInteger(state.visits) || state.visits < 0 || !Array.isArray(state.topics) || !state.topics.every(topic => KNOWN_TOPIC_IDS.has(topic)) || state.topic !== null && !KNOWN_TOPIC_IDS.has(state.topic) || state.completedAt !== undefined && (typeof state.completedAt !== "string" || state.completedAt !== "legacy" && !Number.isFinite(Date.parse(state.completedAt)))) throw new Error("Beschädigter Story-Fortschritt");
    if (state.answers !== undefined && (!state.answers || typeof state.answers !== "object" || Array.isArray(state.answers) || Object.entries(state.answers).some(([key,answer]) => !/^\d{1,2}$/.test(key) || typeof answer !== "string" || !answer.trim() || answer.length > 180))) throw new Error("Beschädigte Chat-Antworten");
    progress[id] = { ...state, topics: [...new Set(state.topics)] };
  }
  const active = value.active;
  if (active !== null && (!active || !eventById(active.id) || eventById(active.id)?.scene === "legacy" || !progress[active.id] || progress[active.id].completedAt || !["front","back","left","right"].includes(active.returnDirection) || !Number.isFinite(active.returnPlayer?.x) || !Number.isFinite(active.returnPlayer?.y) || active.returnPlayer.x < 0 || active.returnPlayer.x > 1 || active.returnPlayer.y < 0 || active.returnPlayer.y > 1)) throw new Error("Beschädigte aktive Erinnerung");
  const idList = (list: unknown, label: string) => {
    if (!Array.isArray(list) || list.length > 128 || !list.every(entry => typeof entry === "string" && /^[a-z0-9-]{1,64}$/.test(entry))) throw new Error(label);
    return [...new Set(list as string[])];
  };
  // Version 1 → 2: rebuild the inventory from completed memories; a v1 player has already seen the beginning.
  if (value.version === 1) return { version: 2, clock: boundClock(clock), progress, active, inventory: earnedRewards(progress), flags: [INTRO_FLAG] };
  // Unknown item IDs and flags are kept for later additions.
  return { version: 2, clock: boundClock(clock), progress, active, inventory: idList(value.inventory, "Beschädigtes Inventar"), flags: idList(value.flags, "Beschädigte Story-Markierungen") };
}
