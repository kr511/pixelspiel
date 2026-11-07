// Story, items, evidence, hotspots and the six main puzzles of
// "Felice × Elias – Die verlorenen Erinnerungen" (30-Minuten-Fassung).
//
// Persönliche Angaben folgen den bereits bestätigten Inhalten des Spiels
// (Schokolade am 19.11.2025, Schulweg Radegast–Zörbig, acht Menschen beim
// Weihnachtsessen am 25.12.2025, erster richtiger Kuss). Alles Übrige – der
// Schatten, die Zwischenwelt, Nebenfiguren und ihre Sätze – ist Spielgestaltung.
import type { Place, Point } from "../story.ts";
import {
  addEvidence, addFlag, addFragment, consumeItem, elias, everHad, felice, giveItem, hasEvidence, hasFlag, hasItem, line, narrate, shadow, solved,
  type AdventureSave, type After, type ChapterId, type Line, type Outcome, type PuzzleKind,
} from "./core.ts";

/* ------------------------------------------------------------------ Kapitel */

/** `minutes` is the planned share of the 25–35 minute first playthrough. */
export type ChapterDef = { id: ChapterId; number: number; title: string; subtitle: string; intro: string; minutes: number };
export const ADVENTURE_CHAPTERS: ChapterDef[] = [
  { id: "prolog", number: 0, title: "Das Verschwinden", subtitle: "Prolog · Felices Wohnung", minutes: 3, intro: "Elias ist verschwunden. Auf dem Schreibtisch liegt ein Brief, der vorher nicht da war – und die Haustür ist versiegelt." },
  { id: "radegast", number: 1, title: "Radegast", subtitle: "Kapitel 1 · Das erste Treffen", minutes: 6, intro: "Die Erinnerung an euer Treffen vom 19.11.2025 ist zerrissen. Sammle Hinweise und setze den Tag wieder zusammen." },
  { id: "schulweg", number: 2, title: "Der Schulweg", subtitle: "Kapitel 2 · Radegast → Zörbig", minutes: 5, intro: "Der Schatten hat euren gemeinsamen Weg durcheinandergebracht. Der Fahrplan an der Haltestelle stimmt nicht mehr." },
  { id: "zoerbig", number: 3, title: "Zörbig", subtitle: "Kapitel 3 · Der Trainingsraum", minutes: 5, intro: "Die kleine Turnhalle ist zu einem verschlossenen Trainingsraum geworden. Finde den Weg hinaus." },
  { id: "weihnachten", number: 4, title: "Weihnachten", subtitle: "Kapitel 4 · 25.12.2025", minutes: 6, intro: "Euer erstes gemeinsames Weihnachten ist eingefroren. Die Uhr steht still." },
  { id: "finale", number: 5, title: "Rette Elias", subtitle: "Finale · Das Erinnerungsarchiv", minutes: 5, intro: "Hinter einer Barriere aus Schatten wartet Elias. Nur eure Erinnerungen können sie lösen." },
  { id: "epilog", number: 6, title: "Zusammen", subtitle: "Abspann", minutes: 0, intro: "Elias ist frei. Eure Erinnerungen sind wieder hell." },
];
export const PLANNED_MINUTES = ADVENTURE_CHAPTERS.reduce((sum, chapter) => sum + chapter.minutes, 0);

export const ADVENTURE_INTRO: Line[] = [
  narrate("Ein grauer Novemberabend. Felices Zimmer ist still – viel zu still."),
  felice("Elias wollte doch längst hier sein. Er antwortet nicht, und sein Handy ist aus.", "sad"),
  narrate("Auf dem Schreibtisch schimmert etwas, das eben noch nicht da war."),
  narrate("Steuerung: Am Handy läufst du mit dem Joystick unten links und tippst auf den Aktionsknopf unten rechts. Am Computer: WASD oder Pfeiltasten und E. Tippe auf den Text, um weiterzulesen – mit × überspringst du ein Gespräch."),
];
/** The shadow bus ride (Schulweg → Pausenhof). Skippable at any time. */
export const ADV_RIDE_MS = 9000;
export const ADV_RIDE_THOUGHTS = [{ from: 1200, to: 4700, text: "Halte durch, Elias. Ich bin unterwegs." }, { from: 5100, to: 8300, text: "Unser Schulweg. Ich kenne ihn wieder." }];

/* --------------------------------------------------------------- Fragmente */

export type FragmentDef = { id: string; chapter: ChapterId; title: string; date: string; symbol: string; text: string; bonus?: boolean };
export const FRAGMENTS: FragmentDef[] = [
  { id: "f-chocolate", chapter: "radegast", title: "Die Schokolade", date: "19.11.2025 · Radegast", symbol: "▦", text: "Elias kam mit dem Fahrrad aus Zörbig zu dir nach Radegast und brachte Schokolade mit. Dir war kalt, du hattest keinen Appetit und hast sie nicht gegessen. Er war ein bisschen verlegen – und trotzdem hat dir schon seine Anwesenheit geholfen." },
  { id: "f-way", chapter: "schulweg", title: "Der gemeinsame Weg", date: "Herbst 2025 · Radegast → Zörbig", symbol: "✿", text: "Haltestelle, Bus, der Markt in Zörbig, der Pausenhof. Ein ganz gewöhnlicher Schulweg – und zusammen fühlt er sich völlig anders an." },
  { id: "f-focus", chapter: "zoerbig", title: "Ein Moment voller Konzentration", date: "Training · Zörbig", symbol: "◎", text: "Ruhig atmen, zielen, nicht aufgeben. Was dir wichtig ist, ist auch Elias wichtig. Im Trainingsraum erinnerst du dich daran, wie stark du bist." },
  { id: "f-star", chapter: "weihnachten", title: "Weihnachten", date: "25.12.2025 · Bei Felice zu Hause", symbol: "✦", text: "Acht Menschen am Tisch, warmes Licht und ein Platz für Elias. Euer erstes gemeinsames Weihnachtsessen – und der erste richtige Kuss." },
];
export const BONUS_PAGES: FragmentDef[] = [
  { id: "b-sparks", chapter: "epilog", bonus: true, title: "Kleine Lichter", date: "Nebenaufgabe", symbol: "✧", text: "Fünf kleine Funken, verstreut in eurer Welt. Jeder ist ein Moment, der zu klein für ein Album schien – und trotzdem geblieben ist." },
  { id: "b-friends", chapter: "epilog", bonus: true, title: "Unsere Freunde", date: "Nebenaufgabe · Pausenhof", symbol: "☺", text: "Elena, Jason, Luca und Wyatt standen auf dem Pausenhof bereit, als du sie gebraucht hast. Manche Wege geht man nicht allein." },
];

/**
 * Optional real photos and voice notes per fragment (files in public/adventure-memories/).
 * Empty entries are simply not shown. Example: "f-chocolate": { photo: "/adventure-memories/schokolade.jpg", caption: "Radegast, 19.11.2025" }
 */
export const MEMENTOS: Record<string, { photo?: string; audio?: string; caption?: string }> = {};

/* ---------------------------------------------------- Felices eigene Worte */

/** Every answer Felice chooses is kept and quoted in the ending („Deine Worte“). No answer is wrong. */
export const WORDS: Record<string, { chapter: ChapterId; label: string; quote: string }> = {
  "w-find": { chapter: "prolog", label: "„Ich finde dich, Elias.“", quote: "Ich finde dich, Elias." },
  "w-turn": { chapter: "prolog", label: "Den Brief umdrehen", quote: "Ich habe den Brief umgedreht – und deine Schrift gefunden." },
  "w-thanks": { chapter: "radegast", label: "„Danke. Das hilft mir sehr.“", quote: "Danke. Das hilft mir sehr." },
  "w-today": { chapter: "radegast", label: "„Hast du ihn heute gesehen?“", quote: "Hast du ihn heute gesehen?" },
  "w-m1-hold": { chapter: "radegast", label: "„Halte durch. Ich komme.“", quote: "Halte durch. Ich komme." },
  "w-m1-where": { chapter: "radegast", label: "„Wo genau bist du?“", quote: "Wo genau bist du? Ich hole dich." },
  "w-elena-thanks": { chapter: "schulweg", label: "„Danke, Elena. Ihr seid die Besten.“", quote: "Danke, Elena. Ihr seid die Besten." },
  "w-elena-promise": { chapter: "schulweg", label: "„Ich bring ihn zurück. Versprochen.“", quote: "Ich bring ihn zurück. Versprochen." },
  "w-m2-book": { chapter: "schulweg", label: "„Ich hab dein Heft. Ich pass drauf auf.“", quote: "Ich hab dein Heft. Ich pass drauf auf." },
  "w-m2-brave": { chapter: "schulweg", label: "„Soll er ruhig unruhig werden.“", quote: "Soll er ruhig unruhig werden." },
  "w-free": { chapter: "zoerbig", label: "„Gib ihn sofort frei!“", quote: "Gib ihn sofort frei!" },
  "w-want": { chapter: "zoerbig", label: "„Was willst du von uns?“", quote: "Was willst du von uns?" },
  "w-m3-soon": { chapter: "zoerbig", label: "„Gleich. Versprochen.“", quote: "Gleich. Versprochen." },
  "w-m3-warm": { chapter: "zoerbig", label: "„Ich bring dir Wärme mit.“", quote: "Ich bring dir Wärme mit." },
  "w-seat-always": { chapter: "weihnachten", label: "„Für dich ist immer ein Platz frei.“", quote: "Für dich ist immer ein Platz frei." },
  "w-seat-next": { chapter: "weihnachten", label: "„Neben mir. Wo sonst.“", quote: "Neben mir. Wo sonst." },
  "w-m4-now": { chapter: "weihnachten", label: "„Ich komme jetzt.“", quote: "Ich komme jetzt." },
  "w-m4-truth": { chapter: "weihnachten", label: "„Ich weiß, was wahr ist.“", quote: "Ich weiß, was wahr ist." },
  "w-hug": { chapter: "finale", label: "Ihn fest umarmen", quote: "Ich bin die letzten Schritte zu dir gelaufen." },
  "w-missed": { chapter: "finale", label: "„Du hast mir gefehlt.“", quote: "Du hast mir gefehlt." },
};
const said = (id: string, reply?: Line[]) => ({ id, label: WORDS[id].label, ...(reply ? { reply } : {}) });
export const saidFlag = (id: string) => `said-${id}`;
/** Felice's chosen words in story order (for the ending). */
export const spokenWords = (save: AdventureSave) => Object.entries(WORDS).filter(([id]) => hasFlag(save, saidFlag(id))).map(([id, word]) => ({ id, ...word }));
/** Remembers one of Felice's answers; only known ids count. */
export const rememberWords = (save: AdventureSave, id: string) => WORDS[id] ? addFlag(save, saidFlag(id)) : save;

/** Elias' messages after each restored fragment: the signal gets stronger with every memory. */
export type EliasMessageDef = { signal: number; status: string; bubbles: string[]; replies: string[] };
export const ELIAS_MESSAGES: EliasMessageDef[] = [
  { signal: 1, status: "Signal schwach", bubbles: ["Felice? Ich weiß nicht, ob das ankommt.", "Ich bin irgendwo zwischen unseren Erinnerungen. Jedes Mal, wenn du eine zurückholst, wird es hier ein bisschen heller.", "Ich lebe. Ich warte auf dich. ♥"], replies: ["w-m1-hold", "w-m1-where"] },
  { signal: 2, status: "Signal wird stärker", bubbles: ["Eben ist es hier kurz warm geworden. Ich habe eine Bleistiftzeichnung gesehen … unser Schulweg?", "Aber der Schatten wird unruhig. Er hat sich in der Turnhalle versteckt.", "Pass auf dich auf. Bitte."], replies: ["w-m2-book", "w-m2-brave"] },
  { signal: 3, status: "Gutes Signal", bubbles: ["Ich kann dich fast hören! Du warst so konzentriert – genau wie beim Training.", "Und jetzt riecht es hier plötzlich nach Tannennadeln. Ist das … unser Weihnachten?", "Mir ist ein bisschen kalt. Beeil dich, ja?"], replies: ["w-m3-soon", "w-m3-warm"] },
  { signal: 4, status: "Volles Signal", bubbles: ["Felice. In deinem Zimmer ist ein Riss aus Licht. Ich bin direkt dahinter.", "Der Schatten hat Angst. Er wird versuchen, dich anzulügen. Glaub ihm kein Wort.", "Ich sehe dich gleich. ♥"], replies: ["w-m4-now", "w-m4-truth"] },
];
/** Which message plays depends only on how many fragments are back, so it can never be skipped or doubled. */
export const eliasMessageFor = (save: AdventureSave) => ELIAS_MESSAGES[Math.max(0, Math.min(ELIAS_MESSAGES.length, save.fragments.filter(id => FRAGMENTS.some(f => f.id === id)).length) - 1)];

/** The training targets of the escape room: each symbol lights up as often as it was hit in the training. */
export const TARGET_COUNTS = { star: 2, moon: 3, heart: 5 } as const;
export const TARGET_SYMBOLS = { star: "★", moon: "☾", heart: "♥" } as const;
/** Deterministic, mixed order of the 10 targets. */
export const TARGET_ORDER: (keyof typeof TARGET_COUNTS)[] = ["heart", "star", "moon", "heart", "moon", "heart", "star", "heart", "moon", "heart"];

/* ---------------------------------------------------------- Gegenstände */

export type AdventureItem = { id: string; name: string; symbol: string; description: string; quest: boolean };
export const ADVENTURE_ITEMS: Record<string, AdventureItem> = {
  "shadow-letter": { id: "shadow-letter", name: "Brief des Schattens", symbol: "✉", quest: true, description: "„Elias gehört jetzt zu mir. Ich bewahre ihn dort, wo vergessene Erinnerungen hingehen. Wenn eure Erinnerungen verblassen, verblasst auch er. – Der Schatten.“ Auf der Rückseite, ganz klein, in Elias' Schrift: „Felice, hol unsere Erinnerungen zurück. Ich warte.“" },
  ticket: { id: "ticket", name: "Fahrkarte", symbol: "▭", quest: true, description: "„Radegast → Zörbig, Markt. Gültig für den Schulbus.“ Einsteigen an der Haltestelle Radegast, aussteigen am Markt in Zörbig." },
  notebook: { id: "notebook", name: "Elias' Schulheft", symbol: "▤", quest: true, description: "Elias' Heft. Auf der letzten Seite hat er euren Schulweg gezeichnet: Haltestelle, Bus, Markt, Pausenhof – und zwei kleine Figuren, die nebeneinander gehen." },
};
/** Item combinations in the bag (order does not matter). The 30-minute route needs none, the mechanic stays available. */
export const RECIPES: { items: [string, string]; result: string; puzzle?: string; text: string }[] = [];

/* ------------------------------------------------------------- Ermittlung */

export type EvidenceDef = { id: string; chapter: ChapterId; title: string; text: string; source: string };
export const EVIDENCE: EvidenceDef[] = [
  { id: "ev-letter", chapter: "prolog", title: "Der Brief des Schattens", source: "Schreibtisch · Felices Zimmer", text: "Der Schatten hält Elias fest. Je mehr eure Erinnerungen verblassen, desto mehr verblasst auch er." },
  { id: "ev-mirror", chapter: "prolog", title: "Das Zeichen am Spiegel", source: "Schminktisch · Felices Zimmer", text: "In Elias' Schrift: „F ✕ E – unser Zeichen.“ Darunter hat er ein kleines Raster aus 3 × 3 Kästchen gemalt. Der Schatten hat es verwischt." },
  { id: "ev-tracks", chapter: "radegast", title: "Fahrradspuren", source: "Weg durch Radegast", text: "Schmale Reifenspuren im feuchten Laub. Sie kommen von der Straße, die an der Bushaltestelle vorbei Richtung Zörbig führt." },
  { id: "ev-driver", chapter: "radegast", title: "Aussage des Busfahrers", source: "Bushaltestelle", text: "„Ein Junge auf dem Fahrrad? Ja. Der kam die Straße aus Zörbig rüber, ganz schön weit bei der Kälte. Mit meinem Bus wäre er schneller gewesen.“" },
  { id: "ev-calendar", chapter: "radegast", title: "Kalenderblatt November 2025", source: "Aushang an der Haltestelle", text: "Montag, 10.11.: rot umkringelt – „erster Schultag“. Die Wochen beginnen montags. Die übrigen Tage sind vom Schatten verwischt." },
  { id: "ev-mother", chapter: "radegast", title: "Aussage von Mama", source: "Garten", text: "„Das war der Mittwoch in der Woche nach deinem ersten Schultag. Du kamst ganz durchgefroren rein, hattest keinen Hunger – und hast trotzdem gelächelt.“" },
  { id: "ev-neighbor", chapter: "radegast", title: "Aussage der Nachbarin", source: "Weg durch Radegast", text: "„Der Junge wusste gar nicht, wohin mit seinen Händen. Als du von seinem Geschenk nichts gegessen hast, wurde er ganz verlegen. Aber gestrahlt habt ihr beide.“" },
  { id: "ev-chocolate", chapter: "radegast", title: "Eine Tafel Schokolade", source: "Spielplatz", text: "Eine Tafel Schokolade, noch ungeöffnet. Der Schatten hat sie bis zum Spielplatz geweht." },
  { id: "ev-ticket", chapter: "schulweg", title: "Die Fahrkarte", source: "Wartehäuschen · Haltestelle", text: "„Radegast → Zörbig, Markt.“ Einsteigen an der Haltestelle Radegast, mit dem Bus fahren, aussteigen am Markt." },
  { id: "ev-note", chapter: "schulweg", title: "Elias' Zettel", source: "Wartehäuschen · Haltestelle", text: "„Damit du unseren Weg nie vergisst: Zwischen ‚Mit dem Bus fahren‘ und ‚An St. Mauritius vorbei‘ liegt genau eine Station. Und am Ende wartet immer der Pausenhof.“" },
  { id: "ev-driver2", chapter: "schulweg", title: "Der Fahrer des Schattenbusses", source: "Bushaltestelle", text: "„Mein Bus fährt nur Radegast – Zörbig Markt. Gölzau? Anderer Bus. Und der Weihnachtsmarkt hat im Herbst noch gar nicht auf.“" },
  { id: "ev-plan", chapter: "zoerbig", title: "Der Trainingsplan", source: "Trainingsraum", text: "„Jeder Schalter weckt zwei Lichter – nur der vierte weckt drei. Wenn alle Lichter brennen, zeigen die Scheiben ihre Zeichen. Gezählt wird wie im Training: von der schwächsten zur besten Scheibe.“" },
  { id: "ev-targets", chapter: "zoerbig", title: "Drei Zielscheiben", source: "Trainingsraum", text: "Stern-Scheibe: 2 Treffer. Herz-Scheibe: 5 Treffer. Mond-Scheibe: 3 Treffer." },
  { id: "ev-frozen", chapter: "weihnachten", title: "Das eingefrorene Wohnzimmer", source: "Wohnzimmer", text: "Sechs Menschen stehen mitten in der Bewegung erstarrt: Mama, dein Stiefvater, deine Halbschwester und ihr Freund, die Tochter deines Stiefvaters und ihr Freund." },
  { id: "ev-place-card", chapter: "weihnachten", title: "Eine Tischkarte", source: "Esstisch", text: "Auf der Tischkarte steht „Elias“. Sein Stuhl ist leer – aber gedeckt ist für ihn. Und dein eigener Platz wartet direkt daneben." },
  { id: "ev-clock", chapter: "weihnachten", title: "Die Inschrift der Uhr", source: "Wohnzimmer", text: "„Ich laufe erst weiter, wenn ich zeige, wie viele an diesem Tisch zusammengehören. Volle Stunde.“" },
];
export type ConclusionDef = { id: string; chapter: ChapterId; from: [string, string]; title: string; text: string };
export const CONCLUSIONS: ConclusionDef[] = [
  { id: "c-bike", chapter: "radegast", from: ["ev-tracks", "ev-driver"], title: "Mit dem Fahrrad aus Zörbig", text: "Elias ist mit dem Fahrrad aus Zörbig zu Felice nach Radegast gekommen." },
  { id: "c-date", chapter: "radegast", from: ["ev-mother", "ev-calendar"], title: "Das Datum", text: "Erster Schultag war Montag, der 10.11. Die Woche danach beginnt am 17.11. – ihr Mittwoch ist der 19.11.2025." },
  { id: "c-chocolate", chapter: "radegast", from: ["ev-chocolate", "ev-neighbor"], title: "Das Geschenk", text: "Elias hat Schokolade mitgebracht. Felice hat sie nicht gegessen – und er wurde verlegen." },
  { id: "c-presence", chapter: "radegast", from: ["ev-mother", "ev-neighbor"], title: "Was wirklich half", text: "Felice war kalt und hatte keinen Appetit. Trotzdem hat sie gestrahlt: Seine Anwesenheit hat ihr geholfen." },
  { id: "c-eight", chapter: "weihnachten", from: ["ev-frozen", "ev-place-card"], title: "Acht Plätze", text: "Sechs Menschen im Wohnzimmer, dazu Felice und Elias: Acht Menschen gehören an diesen Tisch." },
];

/* ---------------------------------------------------------------- Rätsel */

export type Requirement = { flags?: string[]; items?: string[]; evidence?: string[]; conclusions?: string[]; puzzles?: string[]; fragments?: string[] };
export type Reward = { flags?: string[]; fragments?: string[]; items?: string[]; consume?: string[]; evidence?: string[] };
export type PuzzleUI =
  | { type: "world" }
  | { type: "code"; length: number; label: string }
  | { type: "pattern"; size: number; start: boolean[] }
  | { type: "combination"; dials: { label: string; options: string[]; start: number }[] }
  | { type: "sequence"; length: number; cards: { id: string; label: string; detail?: string }[] }
  | { type: "questions"; submit?: string; questions: { id: string; question: string; options: { id: string; label: string }[] }[] }
  | { type: "truth"; statements: { id: string; text: string }[] }
  | { type: "switch"; lamps: string[]; switches: { label: string; toggles: number[] }[]; start: boolean[] };
export type CheckResult = { ok: boolean; feedback: string };
export type PuzzleDef = {
  id: string; chapter: ChapterId; kind: PuzzleKind; title: string; place: Place; hotspot: string;
  prompt: string; clues: string[]; requires: Requirement; hints: [string, string, string];
  /** Failed attempts after which skipping is offered. */
  skipAfter: number; reward: Reward; solvedLines: Line[]; after?: After; ui: PuzzleUI;
  check: (answer: unknown) => CheckResult;
};
/** The six main puzzles of the 30-minute adventure. Three of them have two stages. */
export type MainPuzzle = { number: number; chapter: ChapterId; title: string; genre: string; parts: string[]; minutes: number };
export const MAIN_PUZZLES: MainPuzzle[] = [
  { number: 1, chapter: "prolog", title: "Das Schattensiegel", genre: "Musterrätsel", parts: ["p-seal"], minutes: 1 },
  { number: 2, chapter: "radegast", title: "Das Treffen rekonstruieren", genre: "Detektivrätsel", parts: ["p-meeting"], minutes: 3 },
  { number: 3, chapter: "schulweg", title: "Der manipulierte Fahrplan", genre: "Logikrätsel", parts: ["p-timetable"], minutes: 2 },
  { number: 4, chapter: "zoerbig", title: "Der Trainingsraum", genre: "Escape Room", parts: ["p-lamps", "p-symbols"], minutes: 3 },
  { number: 5, chapter: "weihnachten", title: "Das eingefrorene Weihnachten", genre: "Erinnerungsrätsel", parts: ["p-clock", "p-gifts"], minutes: 3 },
  { number: 6, chapter: "finale", title: "Die Barriere", genre: "Finale", parts: ["p-truth", "p-heart"], minutes: 2 },
];
export function mainPuzzleOf(id: string) {
  const main = MAIN_PUZZLES.find(entry => entry.parts.includes(id));
  return main ? { ...main, part: main.parts.indexOf(id) + 1, total: main.parts.length } : undefined;
}

const asStrings = (answer: unknown) => Array.isArray(answer) ? answer.map(value => String(value)) : [];
const asBools = (answer: unknown) => Array.isArray(answer) ? answer.map(value => value === true) : [];
const X_PATTERN = [true, false, true, false, true, false, true, false, true];
export const SWITCH_TOGGLES = [[0, 1], [1, 2], [2, 3], [0, 1, 3]];
export function applySwitch(state: boolean[], index: number) {
  const toggles = SWITCH_TOGGLES[index] ?? [];
  return state.map((lit, lamp) => toggles.includes(lamp) ? !lit : lit);
}
const GIFT_ORDER = ["g-scarf", "g-card", "g-plates", "g-candle", "g-ribbon"];
const ROUTE_ORDER = ["r-stop", "r-bus", "r-market", "r-church", "r-yard"];
const TRUE_STATEMENTS = ["t-bike", "t-presence", "t-eight", "t-way"];

export const PUZZLES: PuzzleDef[] = [
  {
    id: "p-seal", chapter: "prolog", kind: "pattern", title: "Das Schattensiegel", place: "home", hotspot: "adv-door",
    prompt: "Über der Haustür liegt ein Siegel aus Schatten: neun Felder in einem 3 × 3-Raster. „Nur euer Zeichen öffnet diese Tür.“",
    clues: ["Tippe Felder an, um sie leuchten zu lassen oder zu löschen.", "Ein Zeichen steht zwischen euren Namen: Felice ✕ Elias."], requires: { flags: ["letter-read"] },
    hints: ["Am Spiegel in deinem Zimmer hat Elias euer Zeichen notiert. Es steht auch in deiner Akte.", "Euer Zeichen ist das ✕ zwischen F und E. Zeichne es ins Raster – von Ecke zu Ecke.", "Lass genau die vier Ecken und die Mitte leuchten – alle anderen Felder bleiben dunkel."],
    skipAfter: 4, reward: { flags: ["prolog-done", "door-unlocked"] },
    solvedLines: [narrate("Das ✕ leuchtet auf. Das Siegel zerspringt in tausend kleine Lichter, und die Haustür schwingt auf."), shadow("Du hast eine Tür geöffnet. Aber draußen sind eure Erinnerungen längst zerfallen. Radegast. Der Schulweg. Zörbig. Weihnachten. Alles gehört jetzt mir."), felice("Dann hole ich sie mir zurück. Eine nach der anderen. Und dann hole ich Elias.", "neutral")],
    after: { glitch: true }, ui: { type: "pattern", size: 3, start: [false, false, false, true, true, true, false, false, false] },
    check(answer) {
      const grid = asBools(answer);
      if (grid.length !== 9) return { ok: false, feedback: "Das Siegel braucht alle neun Felder." };
      if (grid.every((lit, index) => lit === X_PATTERN[index])) return { ok: true, feedback: "Das Siegel erkennt euer Zeichen." };
      const lit = grid.filter(Boolean).length;
      return { ok: false, feedback: lit === 0 ? "Das Siegel bleibt dunkel. Ohne Licht kein Zeichen." : `Das Siegel flackert – ${lit} ${lit === 1 ? "Feld leuchtet" : "Felder leuchten"}, aber es erkennt kein Zeichen.` };
    },
  },
  {
    id: "p-meeting", chapter: "radegast", kind: "deduction", title: "Das Treffen rekonstruieren", place: "radegast", hotspot: "adv-meeting",
    prompt: "Am Treffpunkt flimmert eine zerrissene Erinnerung. Beantworte jede Frage mit deinen Schlussfolgerungen, damit sie wieder ganz wird.",
    clues: ["Kombiniere in der Akte je zwei Hinweise zu einer Schlussfolgerung."], requires: { conclusions: ["c-bike", "c-date", "c-chocolate", "c-presence"] },
    hints: ["Alle Antworten stehen in deinen vier Schlussfolgerungen in der Akte.", "Datum: der Mittwoch in der Woche nach Montag, dem 10.11. Weg: Fahrradspuren und Busfahrer. Geschenk: die ungeöffnete Tafel.", "19.11. · Fahrrad · aus Zörbig · Schokolade · seine Anwesenheit."],
    skipAfter: 4, reward: { flags: ["meeting-restored", "ch1-done"], fragments: ["f-chocolate"] },
    solvedLines: [narrate("Die Bilder fügen sich zusammen: Ein Fahrrad auf der kalten Straße aus Zörbig. Elias, der verlegen eine Tafel Schokolade hinhält. Felice, der kalt ist – und die trotzdem lächelt."), felice("Ich weiß es wieder. Es war nicht die Schokolade. Es war, dass er da war.", "love"), narrate("Aus dem Bild löst sich ein warm leuchtender Splitter: das erste Erinnerungsfragment."), felice("Die Schokolade. Unser erstes Treffen. Ich habe sie wieder.", "love")],
    after: { cutscene: "elias-message" },
    ui: { type: "questions", submit: "Erinnerung zusammensetzen", questions: [
      { id: "when", question: "Wann habt ihr euch getroffen?", options: [{ id: "d10", label: "Montag, 10.11." }, { id: "d12", label: "Mittwoch, 12.11." }, { id: "d19", label: "Mittwoch, 19.11." }, { id: "d26", label: "Mittwoch, 26.11." }] },
      { id: "how", question: "Wie ist Elias gekommen?", options: [{ id: "bus", label: "Mit dem Bus" }, { id: "bike", label: "Mit dem Fahrrad" }, { id: "walk", label: "Zu Fuß" }] },
      { id: "from", question: "Woher kam er?", options: [{ id: "goelzau", label: "Aus Gölzau" }, { id: "zoerbig", label: "Aus Zörbig" }, { id: "radegast", label: "Aus Radegast" }] },
      { id: "gift", question: "Was hat er mitgebracht?", options: [{ id: "flowers", label: "Blumen" }, { id: "letter", label: "Einen Brief" }, { id: "chocolate", label: "Schokolade" }] },
      { id: "help", question: "Was hat Felice an diesem Tag geholfen?", options: [{ id: "eat", label: "Die Schokolade zu essen" }, { id: "presence", label: "Seine Anwesenheit" }, { id: "jacket", label: "Eine warme Jacke" }] },
    ] },
    check(answer) {
      const value = answer && typeof answer === "object" ? answer as Record<string, string> : {};
      const expected: Record<string, string> = { when: "d19", how: "bike", from: "zoerbig", gift: "chocolate", help: "presence" };
      const answered = Object.keys(expected).filter(key => value[key]).length;
      if (answered < 5) return { ok: false, feedback: "Beantworte zuerst alle fünf Fragen." };
      const right = Object.entries(expected).filter(([key, option]) => value[key] === option).length;
      return right === 5 ? { ok: true, feedback: "Alle fünf Antworten stimmen." } : { ok: false, feedback: `${right} von 5 Antworten stimmen. Die Erinnerung flimmert noch.` };
    },
  },
  {
    id: "p-timetable", chapter: "schulweg", kind: "sequence", title: "Der manipulierte Fahrplan", place: "bus", hotspot: "adv-timetable",
    prompt: "Der Schatten hat euren Schulweg durcheinandergewürfelt und zwei falsche Stationen hineingeschmuggelt. Lege die fünf echten Stationen in die richtige Reihenfolge.",
    clues: ["Drei Hinweise verraten den echten Weg: die Fahrkarte, Elias' Zettel und der Busfahrer.", "Tippe Karten an, um sie auf den Fahrplan zu legen. Tippe eine gelegte Karte an, um sie zu entfernen."], requires: {},
    hints: ["Alle drei Hinweise liegen hier an der Haltestelle und stehen danach in deiner Akte: Fahrkarte und Zettel am Wartehäuschen, die Aussage beim Busfahrer.", "Gölzau und der Weihnachtsmarkt gehören nicht dazu. Die Fahrkarte verrät die ersten drei Schritte: Haltestelle Radegast, mit dem Bus fahren, aussteigen am Markt.", "Haltestelle Radegast → Mit dem Bus fahren → Aussteigen am Markt Zörbig → An St. Mauritius vorbei → Auf den Pausenhof."],
    skipAfter: 4, reward: { flags: ["timetable-fixed"] },
    solvedLines: [narrate("Die Buchstaben auf dem Fahrplan hören auf zu zittern. In der Ferne brummt ein Motor: Ein blasser Bus aus Schatten hält an der Haltestelle."), felice("Ein Schattenbus … Na gut. Hauptsache, er fährt nach Zörbig.", "surprised")],
    ui: { type: "sequence", length: 5, cards: [
      { id: "r-market", label: "Aussteigen am Markt Zörbig" }, { id: "r-goelzau", label: "Abzweig nach Gölzau" }, { id: "r-stop", label: "Haltestelle Radegast" },
      { id: "r-yard", label: "Auf den Pausenhof" }, { id: "r-xmas", label: "Bummel über den Weihnachtsmarkt" }, { id: "r-church", label: "An St. Mauritius vorbei" }, { id: "r-bus", label: "Mit dem Bus fahren" },
    ] },
    check(answer) {
      const order = asStrings(answer);
      if (order.length !== 5) return { ok: false, feedback: "Lege genau fünf Stationen auf den Fahrplan." };
      if (order.includes("r-goelzau") || order.includes("r-xmas")) return { ok: false, feedback: "Eine Station gehört gar nicht zu eurem Schulweg. Der Fahrplan zittert." };
      const right = order.findIndex((id, index) => id !== ROUTE_ORDER[index]);
      return right === -1 ? { ok: true, feedback: "Der Fahrplan stimmt wieder." } : { ok: false, feedback: right === 0 ? "Schon die erste Station stimmt nicht." : `Die ersten ${right} ${right === 1 ? "Station stimmt" : "Stationen stimmen"}, danach gerät der Weg durcheinander.` };
    },
  },
  {
    id: "p-lamps", chapter: "zoerbig", kind: "switch", title: "Die Lichter des Trainingsraums", place: "gym", hotspot: "adv-switchboard",
    prompt: "Die Tür hinter dir ist ins Schloss gefallen. Vier Lampen, vier Schalter – jeder Schalter schaltet mehrere Lampen gleichzeitig um. Bring alle vier Lampen zum Leuchten.",
    clues: ["„Jeder Schalter weckt zwei Lichter – nur der vierte weckt drei.“", "Du kannst jederzeit zurücksetzen. Nichts geht dabei kaputt."], requires: { fragments: ["f-way"] },
    hints: ["Probiere jeden Schalter einzeln und beobachte, welche Lampen sich verändern. Zweimal derselbe Schalter hebt sich auf.", "Schalter 1 = Lampen 1+2, Schalter 2 = 2+3, Schalter 3 = 3+4, Schalter 4 = 1+2+4. Am Anfang leuchten die Lampen 2 und 3.", "Drücke vom Anfangszustand aus Schalter 1, Schalter 2 und Schalter 3 je einmal."],
    skipAfter: 5, reward: { flags: ["lamps-lit"] },
    solvedLines: [narrate("Alle vier Lampen leuchten. An der Wand erscheinen drei Zielscheiben mit Zeichen: ein Stern, ein Herz, ein Mond."), narrate("Dann wird es kalt. In der Mitte des Raumes zieht sich Dunkelheit zusammen – und bekommt eine Gestalt.")],
    after: { cutscene: "shadow" }, ui: { type: "switch", lamps: ["Lampe 1", "Lampe 2", "Lampe 3", "Lampe 4"], switches: SWITCH_TOGGLES.map((toggles, index) => ({ label: `Schalter ${index + 1}`, toggles })), start: [false, true, true, false] },
    check(answer) {
      const lamps = asBools(answer);
      return lamps.length === 4 && lamps.every(Boolean) ? { ok: true, feedback: "Alle Lichter brennen." } : { ok: false, feedback: `${lamps.filter(Boolean).length} von 4 Lampen leuchten.` };
    },
  },
  {
    id: "p-symbols", chapter: "zoerbig", kind: "combination", title: "Das Symbolschloss", place: "gym", hotspot: "adv-symbol-door",
    prompt: "Der einzige Ausgang: eine Tür mit drei Drehscheiben. Auf jeder Scheibe: Stern, Herz, Mond, Raute und Blume. Darüber: „Wie im Training.“",
    clues: ["Lies den Trainingsplan und zähle die Treffer auf den Zielscheiben."], requires: { flags: ["shadow-met"] },
    hints: ["Der Trainingsplan sagt: von der schwächsten zur besten Scheibe. Die Treffer auf den Zielscheiben bestimmen die Reihenfolge.", "Stern: 2 Treffer, Mond: 3 Treffer, Herz: 5 Treffer.", "Stelle die Scheiben auf Stern · Mond · Herz."],
    skipAfter: 4, reward: { fragments: ["f-focus"], flags: ["ch3-done"] },
    solvedLines: [narrate("Die Scheiben rasten ein. Hinter der Tür liegt kein Flur – nur ein ruhiges, helles Licht: das dritte Erinnerungsfragment."), felice("Ruhig atmen. Zielen. Nicht aufgeben. Das kann ich.", "happy"), narrate("Das Licht wird wärmer und heller. Es riecht nach Tannennadeln und Plätzchen. Als du die Augen wieder öffnest, stehst du zu Hause im Wohnzimmer – und draußen liegt Schnee.")],
    after: { glitch: true, cutscene: "elias-message", travel: "home" }, ui: { type: "combination", dials: [0, 1, 2].map(index => ({ label: `Scheibe ${index + 1}`, options: ["★ Stern", "♥ Herz", "☾ Mond", "◆ Raute", "✿ Blume"], start: [3, 4, 3][index] })) },
    check(answer) {
      const value = asStrings(answer);
      const expected = ["★ Stern", "☾ Mond", "♥ Herz"];
      const right = expected.filter((symbol, index) => value[index] === symbol).length;
      return right === 3 ? { ok: true, feedback: "Das Schloss öffnet sich." } : { ok: false, feedback: `${right} von 3 Scheiben stehen richtig.` };
    },
  },
  {
    id: "p-clock", chapter: "weihnachten", kind: "combination", title: "Die stehengebliebene Uhr", place: "home", hotspot: "adv-clock",
    prompt: "Die Wohnzimmeruhr ist stehen geblieben. „Ich laufe erst weiter, wenn ich zeige, wie viele an diesem Tisch zusammengehören. Volle Stunde.“",
    clues: ["Zähle, wer an den Tisch gehört – auch wer gerade fehlt."], requires: { fragments: ["f-focus"] },
    hints: ["Die Uhr fragt nach einer Anzahl, nicht nach einer Uhrzeit. „Volle Stunde“ heißt: Minuten auf 00.", "Zähle die sechs eingefrorenen Menschen. Dann lies die Tischkarte am Esstisch – und vergiss dich selbst nicht.", "Acht Menschen gehören an den Tisch: Stelle die Uhr auf 8:00."],
    skipAfter: 4, reward: { flags: ["clock-running"] },
    solvedLines: [narrate("Tick. Tack. Die Zeiger bewegen sich wieder. Ein Hauch Wärme geht durch das Wohnzimmer, und unter dem Baum schimmern Geschenke mit kleinen Anhängern."), felice("Acht. Mit dir sind wir acht. Dein Platz ist hier, Elias.", "love")],
    ui: { type: "combination", dials: [
      { label: "Stunde", options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"], start: 11 },
      { label: "Minuten", options: ["00", "15", "30", "45"], start: 2 },
    ] },
    check(answer) {
      const [hour, minute] = asStrings(answer);
      if (hour === "8" && minute === "00") return { ok: true, feedback: "Die Uhr läuft wieder." };
      if (minute !== "00") return { ok: false, feedback: "Die Uhr will eine volle Stunde." };
      if (hour === "7") return { ok: false, feedback: "Die Zeiger zittern … Jemand fehlt noch am Tisch." };
      if (hour === "6") return { ok: false, feedback: "Die Uhr bleibt stehen. Du hast an euch beide noch nicht gedacht." };
      return { ok: false, feedback: "Die Uhr bleibt stehen. Diese Zahl gehört nicht zu diesem Tisch." };
    },
  },
  {
    id: "p-gifts", chapter: "weihnachten", kind: "sequence", title: "Die Geschenke unter dem Baum", place: "home", hotspot: "adv-gifts",
    prompt: "Unter dem Baum liegen sechs Geschenke mit Anhängern. Lege die fünf, die zu diesem Abend gehören, in die Reihenfolge, in der der Abend geschah.",
    clues: ["Jeder Anhänger verrät, wann sein Moment kommt.", "„Nur was an diesem Abend geschah, gehört unter den Baum.“"], requires: { flags: ["clock-running"] },
    hints: ["Lies jeden Anhänger genau: Manche nennen, was vor oder nach ihnen kommt. Ein Geschenk gehört zum Morgen danach.", "Der Abend beginnt mit dem Ankommen und endet mit dem ersten richtigen Kuss. Die Kraniche gehören zum 26.12.", "Mütze & Schal → Grußkarte → Festtagsgeschirr → Kerze vom Tisch → Rotes Band."],
    skipAfter: 4, reward: { fragments: ["f-star"], flags: ["ch4-done", "archive-open"] },
    solvedLines: [narrate("Die Geschenke öffnen sich nacheinander. Ankommen. Alle begrüßen. Den Tisch decken. Gemeinsam essen. Und dann – der erste richtige Kuss."), felice("Unser erstes Weihnachten. Das nimmt mir niemand weg.", "love"), narrate("Das vierte Erinnerungsfragment leuchtet. In deinem Zimmer, gleich nebenan, öffnet sich ein Riss aus Licht: der Weg ins Erinnerungsarchiv.")],
    after: { glitch: true, cutscene: "elias-message" }, ui: { type: "sequence", length: 5, cards: [
      { id: "g-candle", label: "Kerze vom Tisch", detail: "„Ich brenne, während alle zusammen essen.“" },
      { id: "g-cranes", label: "Gefaltete Kraniche", detail: "„Ich gehöre zum Morgen danach.“" },
      { id: "g-scarf", label: "Mütze & Schal", detail: "„Ich werde abgelegt, wenn die Tür aufgeht.“" },
      { id: "g-ribbon", label: "Rotes Band", detail: "„Ich bin das Letzte an diesem Abend – und das Schönste.“" },
      { id: "g-plates", label: "Festtagsgeschirr", detail: "„Ich komme, wenn alle begrüßt sind, aber bevor jemand isst.“" },
      { id: "g-card", label: "Grußkarte", detail: "„Ich sage Hallo zu allen acht.“" },
    ] },
    check(answer) {
      const order = asStrings(answer);
      if (order.length !== 5) return { ok: false, feedback: "Lege genau fünf Geschenke in die Reihe." };
      if (order.includes("g-cranes")) return { ok: false, feedback: "Ein Geschenk gehört nicht zu diesem Abend, sondern zum Morgen danach." };
      const first = order.findIndex((id, index) => id !== GIFT_ORDER[index]);
      return first === -1 ? { ok: true, feedback: "So war euer Abend." } : { ok: false, feedback: first === 0 ? "Der Abend beginnt anders." : `Die ersten ${first} ${first === 1 ? "Geschenk passt" : "Geschenke passen"} – danach stimmt die Reihenfolge nicht.` };
    },
  },
  {
    id: "p-truth", chapter: "finale", kind: "deduction", title: "Die Lügen des Schattens", place: "archive", hotspot: "adv-shadow",
    prompt: "Der Schatten flüstert sieben Sätze über euch. Nur die wahren Erinnerungen geben Licht. Wähle alle Sätze, die wirklich stimmen – und keinen anderen.",
    clues: ["Alles, was du brauchst, steht in deinem Album und deiner Akte."], requires: { flags: ["pedestals-lit"] },
    hints: ["Vier Sätze sind wahr, drei sind Lügen des Schattens.", "Elias kam nicht mit dem Bus, die Schokolade blieb ungegessen, und vom Markt seid ihr immer zu Fuß gegangen.", "Wahr sind: Fahrrad aus Zörbig · seine Anwesenheit hat geholfen · acht am Weihnachtstisch · gemeinsam ist ein gewöhnlicher Weg anders."],
    skipAfter: 4, reward: { flags: ["lies-broken"] },
    solvedLines: [felice("Du kannst mir nichts mehr einreden. Ich weiß, was wahr ist – weil ich es erlebt habe.", "neutral"), narrate("Die Barriere bekommt tiefe Risse. Der Schatten zieht sich zusammen, kleiner und leiser als zuvor."), shadow("Dann beantworte mir eine letzte Frage, Felice.")],
    after: { puzzle: "p-heart" }, ui: { type: "truth", statements: [
      { id: "t-bike", text: "Elias kam mit dem Fahrrad aus Zörbig zu mir nach Radegast." },
      { id: "t-ate", text: "Ich habe seine Schokolade sofort aufgegessen." },
      { id: "t-presence", text: "Schon seine Anwesenheit hat mir geholfen." },
      { id: "t-busschool", text: "Vom Markt sind wir mit dem Bus bis vor die Schule gefahren." },
      { id: "t-eight", text: "Am Weihnachtstisch waren wir acht – mit einem Platz für Elias." },
      { id: "t-alone", text: "Elias ist ohne mich besser dran." },
      { id: "t-way", text: "Zusammen fühlt sich sogar ein gewöhnlicher Weg anders an." },
    ] },
    check(answer) {
      const chosen = new Set(asStrings(answer));
      if (!chosen.size) return { ok: false, feedback: "Wähle die Sätze, die wahr sind." };
      const wrong = [...chosen].filter(id => !TRUE_STATEMENTS.includes(id)).length;
      const missing = TRUE_STATEMENTS.filter(id => !chosen.has(id)).length;
      if (!wrong && !missing) return { ok: true, feedback: "Nur die Wahrheit bleibt." };
      if (chosen.has("t-alone")) return { ok: false, feedback: "„Elias ist ohne mich besser dran“ – genau das will der Schatten, dass du glaubst. Er lügt." };
      return { ok: false, feedback: wrong ? `Unter deiner Auswahl ${wrong === 1 ? "ist eine Lüge" : `sind ${wrong} Lügen`} des Schattens.` : `Es ${missing === 1 ? "fehlt noch ein wahrer Satz" : `fehlen noch ${missing} wahre Sätze`}.` };
    },
  },
  {
    id: "p-heart", chapter: "finale", kind: "heart", title: "Die letzte Frage", place: "archive", hotspot: "adv-shadow",
    prompt: "„Warum bist du hier, Felice? Warum gehst du durch all eure Erinnerungen, nur um ihn zurückzuholen?“ Nur die ehrliche Antwort löst die Barriere.",
    clues: ["Denk an alles, was du zurückgeholt hast: die Schokolade, den Weg, das Training, Weihnachten."], requires: { flags: ["lies-broken"] },
    hints: ["Jede Erinnerung, die du zurückgeholt hast, erzählt dasselbe – von euch beiden, nicht von Pflicht oder Mut.", "Die Uhr im Wohnzimmer hat es schon gesagt: Sie zeigte, wie viele an diesem Tisch zusammengehören.", "Antworte: „Weil wir zusammengehören.“"],
    skipAfter: 3, reward: { flags: ["barrier-down"] },
    solvedLines: [felice("Weil wir zusammengehören.", "love"), shadow("Zusammen … Dagegen … kann ich nichts …"), felice("Ohne Vergessen bleibt nur das, was zählt.", "love"), narrate("Die Barriere zerbricht in warmes Licht. Der Schatten löst sich auf wie Nebel in der Morgensonne. Elias steht ganz still – und dann sieht er dich.")],
    after: { cutscene: "barrier" }, ui: { type: "questions", submit: "Antworten", questions: [
      { id: "why", question: "Warum bist du hier?", options: [{ id: "promise", label: "Weil ich es ihm versprochen habe." }, { id: "letter", label: "Weil dein Brief es verlangt hat." }, { id: "brave", label: "Weil ich keine Angst vor dir habe." }, { id: "together", label: "Weil wir zusammengehören." }] },
    ] },
    check(answer) {
      const value = answer && typeof answer === "object" ? (answer as Record<string, string>).why : undefined;
      if (!value) return { ok: false, feedback: "Wähle deine Antwort." };
      if (value === "together") return { ok: true, feedback: "Die Barriere zittert – und zerbricht." };
      return { ok: false, feedback: value === "brave" ? "„Mut allein hätte dich nicht so weit gebracht“, flüstert der Schatten. „Was ist es wirklich?“" : "Der Schatten lacht leise: „Das ist nicht der wahre Grund. Was hält euch wirklich zusammen?“" };
    },
  },
];
export const puzzleById = (id: string) => PUZZLES.find(puzzle => puzzle.id === id);

/* --------------------------------------------------------------- Hotspots */

export type Hotspot = {
  id: string; place: Place; x: number; y: number; display?: Point; name: string; kind: "person" | "item"; art: string;
  visible: (save: AdventureSave) => boolean;
  interact: (save: AdventureSave) => Outcome;
  /** Items that can be used here (from the bag). */
  accepts?: Record<string, (save: AdventureSave) => Outcome>;
  /** Shown frozen (Weihnachten) or ghostly. */
  look?: (save: AdventureSave) => "frozen" | "ghost" | "glow" | undefined;
};
const say = (save: AdventureSave, ...lines: Line[]): Outcome => ({ save, lines });
const after = (save: AdventureSave, afterValue: After, ...lines: Line[]): Outcome => ({ save, lines, after: afterValue });
const inChapter = (save: AdventureSave, ...chapters: ChapterId[]) => chapters.includes(chapterOf(save));
const evidence = (save: AdventureSave, id: string, ...lines: Line[]): Outcome => {
  const known = hasEvidence(save, id);
  const def = EVIDENCE.find(entry => entry.id === id)!;
  return { save: addEvidence(save, id), lines: known ? lines : [...lines, narrate(`Neuer Hinweis in der Akte: „${def.title}“.`)] };
};

/** The chapter follows the story flags; it is never trusted from storage and therefore cannot drift. */
export function chapterOf(save: AdventureSave): ChapterId {
  if (save.completedAt) return "epilog";
  if (!hasFlag(save, "prolog-done")) return "prolog";
  if (!save.fragments.includes("f-chocolate")) return "radegast";
  if (!save.fragments.includes("f-way")) return "schulweg";
  if (!save.fragments.includes("f-focus")) return "zoerbig";
  if (!save.fragments.includes("f-star")) return "weihnachten";
  return "finale";
}

const SPARKS: { id: string; place: Place; x: number; y: number }[] = [
  { id: "spark-garden", place: "garden", x: .62, y: .72 },
  { id: "spark-playground", place: "playground", x: .30, y: .74 },
  { id: "spark-kitchen", place: "kitchen", x: .30, y: .72 },
  { id: "spark-zoerbig", place: "zoerbig", x: .36, y: .46 },
  { id: "spark-school", place: "school", x: .88, y: .86 },
];
export const SPARK_IDS = SPARKS.map(spark => spark.id);
const FRIENDS = ["friend-elena", "friend-jason", "friend-luca", "friend-wyatt"];

function sparkSpot(spark: typeof SPARKS[number]): Hotspot {
  return {
    id: `adv-${spark.id}`, place: spark.place, x: spark.x, y: spark.y, name: "Ein kleines Licht", kind: "item", art: "adv:spark",
    visible: save => !hasFlag(save, spark.id) && !inChapter(save, "prolog", "finale", "epilog"),
    interact(save) {
      let next = addFlag(save, spark.id);
      const count = SPARK_IDS.filter(id => hasFlag(next, id)).length;
      const lines = [narrate(`Ein kleiner Erinnerungsfunke. (${count}/5)`)];
      if (count === 5) { next = addFragment(addFlag(next, "sq-sparks-done"), "b-sparks"); lines.push(felice("Fünf kleine Lichter. Kleine Momente sind auch Erinnerungen.", "happy"), narrate("Nebenaufgabe erfüllt: Eine neue Seite im Erinnerungsalbum.")); }
      return { save: next, lines };
    },
  };
}
/** Friends on the schoolyard. Elena keeps Elias' notebook; giving it back restores the second fragment. */
function friendSpot(id: string, name: string, art: string, x: number, y: number, text: string): Hotspot {
  return {
    id: `adv-${id}`, place: "school", x, y, name, kind: "person", art,
    visible: save => inChapter(save, "schulweg", "zoerbig") && hasFlag(save, "arrived-school"),
    interact(save) {
      let next = addFlag(save, id);
      let lines: Line[] = [line(name, text, "neutral", { art })];
      const returnsNotebook = id === "friend-elena" && !everHad(next, "notebook");
      if (returnsNotebook) {
        next = addFlag(addFragment(giveItem(next, "notebook"), "f-way"), "ch2-done");
        lines = [
          line(name, "Felice! Endlich. Das hier lag heute Morgen ganz allein auf dem Pausenhof – Elias' Heft. Ich wusste, dass du kommst.", "happy", { art }),
          narrate("Auf der letzten Seite: euer Schulweg, mit Bleistift gezeichnet. Haltestelle, Bus, Markt, St. Mauritius, Pausenhof – und zwei kleine Figuren, die nebeneinander gehen."),
          felice("Ein ganz normaler Weg. Und trotzdem war er mit dir so viel schöner.", "love"),
          narrate("Aus der Zeichnung löst sich ein Licht: das zweite Erinnerungsfragment. Neu in der Tasche: Elias' Schulheft."),
          felice("Elena …", "happy", { choices: [said("w-elena-thanks", [line(name, "Ach was. Hol ihn einfach zurück, ja?", "happy", { art })]), said("w-elena-promise", [line(name, "Das weiß ich. Du gibst nicht auf.", "happy", { art })])] }),
          line(name, "Die Turnhalle da hinten ist seit heute Morgen dunkel. Irgendwas stimmt da nicht. Pass auf dich auf, ja?", "thoughtful", { art }),
        ];
      }
      if (FRIENDS.every(friend => hasFlag(next, friend)) && !hasFlag(next, "sq-friends-done")) {
        next = addFragment(addFlag(next, "sq-friends-done"), "b-friends");
        lines = [...lines, narrate("Nebenaufgabe erfüllt: Du hast mit allen vier Freunden gesprochen. Eine neue Seite im Erinnerungsalbum.")];
      }
      return { save: next, lines, after: returnsNotebook ? { glitch: true, cutscene: "elias-message" } : undefined };
    },
  };
}
function frozenSpot(id: string, name: string, art: string, x: number, y: number, echo: string): Hotspot {
  return {
    id: `adv-frozen-${id}`, place: "home", x, y, name, kind: "person", art,
    visible: save => inChapter(save, "weihnachten"),
    look: save => hasFlag(save, "clock-running") ? undefined : "frozen",
    interact(save) {
      if (hasFlag(save, "clock-running")) return say(save, line(name, echo, "happy", { art }));
      return evidence(save, "ev-frozen", narrate(`${name} steht mitten in der Bewegung still, wie aus Eis. Ganz leise, wie ein Echo: „${echo}“`));
    },
  };
}

/** Solving a puzzle that lives in the world (not in a panel). */
export function solvePuzzleInWorld(save: AdventureSave, id: string, skipped = false): Outcome {
  const puzzle = puzzleById(id)!;
  if (solved(save, id)) return { save, lines: [] };
  const next = applyReward({ ...save, puzzles: { ...save.puzzles, [id]: { ...(save.puzzles[id] ?? { failures: 0, hints: 0 }), status: "gelöst", ...(skipped ? { skipped: true } : {}) } } }, puzzle.reward);
  return { save: next, lines: puzzle.solvedLines, after: puzzle.after, ok: true };
}
/** Rewards are idempotent so they can be re-applied to repair an inconsistent save. */
export function applyReward(save: AdventureSave, reward: Reward): AdventureSave {
  let next = save;
  for (const id of reward.consume ?? []) next = consumeItem(next, id);
  for (const id of reward.items ?? []) next = giveItem(next, id);
  for (const id of reward.evidence ?? []) next = addEvidence(next, id);
  for (const id of reward.fragments ?? []) next = addFragment(next, id);
  if (reward.flags?.length) next = addFlag(next, ...reward.flags);
  return next;
}
const openPuzzle = (save: AdventureSave, id: string, ...lines: Line[]): Outcome => ({ save, lines, after: { puzzle: id } });

export const HOTSPOTS: Hotspot[] = [
  /* ---- Prolog: Felices Wohnung ---- */
  {
    id: "adv-letter", place: "bedroom", x: .655, y: .405, display: { x: .655, y: .30 }, name: "Ein fremder Brief", kind: "item", art: "adv:letter",
    visible: () => true, look: save => hasFlag(save, "letter-read") ? undefined : "glow",
    interact(save) {
      if (hasFlag(save, "letter-read")) return say(save, felice("Der Brief des Schattens. Ich trage ihn in meiner Tasche – damit ich nicht vergesse, warum ich das hier tue."));
      const next = addEvidence(giveItem(addFlag(save, "letter-read"), "shadow-letter"), "ev-letter");
      return after(next, { glitch: true },
        narrate("Auf dem Schreibtisch liegt ein Umschlag, der eben noch nicht da war. Er ist kalt wie Winterluft."),
        shadow("Elias gehört jetzt zu mir. Ich bewahre ihn dort, wo vergessene Erinnerungen hingehen. Wenn eure Erinnerungen verblassen, verblasst auch er."),
        felice("Elias …? Das ist nicht lustig. Wo ist er?", "surprised", { choices: [
          said("w-find", [felice("Egal, wo du bist. Ich finde dich.", "neutral")]),
          said("w-turn", [narrate("Auf der Rückseite, ganz klein, in Elias' Schrift: „Felice, hol unsere Erinnerungen zurück. Ich warte.“")]),
        ] }),
        narrate("Der Brief liegt jetzt in deiner Tasche. Links oben steht immer dein aktuelles Ziel. Über „Hinweis“ bekommst du jederzeit Hilfe in drei Stufen – ganz freiwillig."),
        felice("Zuerst muss ich hier raus. Die Haustür ist im Wohnzimmer, gleich nebenan.", "neutral"));
    },
  },
  {
    id: "adv-mirror", place: "bedroom", x: .565, y: .405, display: { x: .56, y: .20 }, name: "Spiegel am Schminktisch", kind: "item", art: "adv:mirror",
    visible: () => true,
    interact: save => evidence(save, "ev-mirror", narrate("Auf dem Spiegel steht in Elias' Schrift: „F ✕ E – unser Zeichen.“ Darunter ein kleines Raster aus 3 × 3 Kästchen. Der Schatten hat die Kästchen verwischt."), felice("Unser Zeichen … das ✕ zwischen unseren Namen.", "love")),
  },
  {
    id: "adv-door", place: "home", x: .17, y: .54, display: { x: .085, y: .47 }, name: "Haustür", kind: "item", art: "adv:door",
    visible: save => !hasFlag(save, "prolog-done"),
    look: save => hasFlag(save, "letter-read") ? "glow" : undefined,
    interact(raw) {
      const save = addFlag(raw, "door-seen");
      if (!hasFlag(save, "letter-read")) return say(save, narrate("Die Haustür ist zu. Über dem Schloss liegt ein dunkler Schleier."), felice("Was ist das? … Auf meinem Schreibtisch hat vorhin etwas geschimmert. Das sehe ich mir zuerst an."));
      return openPuzzle(save, "p-seal", narrate("Über dem Schloss liegt ein Siegel aus Schatten: neun Felder, drei mal drei."), shadow("Nur euer Zeichen öffnet diese Tür. Kennst du es noch?"));
    },
  },
  /* ---- Kapitel 1: Radegast ---- */
  {
    id: "adv-tracks", place: "radegast", x: .47, y: .355, name: "Spuren im Laub", kind: "item", art: "adv:tracks",
    visible: save => inChapter(save, "radegast"),
    interact: save => evidence(save, "ev-tracks", narrate("Schmale Reifenspuren im feuchten Laub. Sie kommen von der Straße, die an der Bushaltestelle vorbei Richtung Zörbig führt."), felice("Fahrradspuren. Jemand ist hier mit dem Rad angekommen.")),
  },
  {
    id: "adv-neighbor", place: "radegast", x: .585, y: .635, name: "Nachbarin", kind: "person", art: "partner-two",
    visible: save => inChapter(save, "radegast"),
    interact: save => evidence(save, "ev-neighbor", line("Nachbarin", "Ach, Felice! Ich weiß noch, wie der Junge mit dem Fahrrad hier stand. Er wusste gar nicht, wohin mit seinen Händen. Als du von seinem Geschenk nichts gegessen hast, wurde er ganz verlegen. Aber gestrahlt habt ihr beide.", "happy", { art: "partner-two" }), felice("Das hast du gesehen? Ich … ich kann mich kaum erinnern.", "sad", { choices: [said("w-thanks", [line("Nachbarin", "Gern, Kind. Manche Dinge vergisst man nicht wirklich.", "happy", { art: "partner-two" })]), said("w-today", [line("Nachbarin", "Heute? Nein … Seltsam. Es ist, als wäre der Tag heute ganz grau.", "thoughtful", { art: "partner-two" })])] })),
  },
  {
    id: "adv-meeting", place: "radegast", x: .535, y: .505, name: "Der Treffpunkt", kind: "item", art: "adv:rift",
    visible: save => inChapter(save, "radegast") && !solved(save, "p-meeting"),
    interact(save) {
      const missing = 4 - CONCLUSIONS.filter(entry => entry.chapter === "radegast" && save.conclusions.includes(entry.id)).length;
      if (missing > 0) return say(addFlag(save, "meeting-seen"), narrate("Hier, am Treffpunkt, flimmert die Luft. Bruchstücke eines Tages: kalte Hände, ein Fahrrad, eine Tafel Schokolade – dann zerreißt das Bild wieder."), felice(`Ich brauche mehr Gewissheit. Noch ${missing} ${missing === 1 ? "Schlussfolgerung fehlt" : "Schlussfolgerungen fehlen"} in meiner Akte. Hinweise finde ich hier, im Garten, an der Haltestelle und auf dem Spielplatz.`));
      return openPuzzle(addFlag(save, "meeting-seen"), "p-meeting", narrate("Die zerrissene Erinnerung wartet. Jetzt weißt du genug, um sie zusammenzusetzen."));
    },
  },
  {
    id: "adv-driver", place: "bus", x: .60, y: .62, name: "Busfahrer", kind: "person", art: "host",
    visible: save => inChapter(save, "radegast", "schulweg"),
    interact(save) {
      if (inChapter(save, "radegast")) return evidence(save, "ev-driver", line("Busfahrer", "Ein Junge auf dem Fahrrad? Ja, an den erinnere ich mich. Der kam die Straße aus Zörbig rüber – ganz schön weit bei der Kälte. Mit meinem Bus wäre er schneller gewesen.", "neutral", { art: "host" }));
      return evidence(save, "ev-driver2", line("Busfahrer", "Mein Bus fährt nur Radegast – Zörbig Markt. Gölzau? Anderer Bus. Und der Weihnachtsmarkt hat im Herbst noch gar nicht auf. Ohne Fahrkarte fährt hier übrigens niemand.", "neutral", { art: "host" }));
    },
  },
  {
    id: "adv-calendar", place: "bus", x: .45, y: .46, display: { x: .45, y: .32 }, name: "Aushang", kind: "item", art: "adv:calendar",
    visible: save => inChapter(save, "radegast"),
    interact: save => evidence(save, "ev-calendar", narrate("Am Aushang hängt ein Kalenderblatt: November 2025. Montag, der 10.11., ist rot umkringelt: „erster Schultag“. Die Wochen beginnen montags. Die übrigen Tage sind verwischt.")),
  },
  {
    id: "adv-mother", place: "garden", x: .55, y: .55, name: "Felices Mutter", kind: "person", art: "mother",
    visible: save => inChapter(save, "radegast", "schulweg", "zoerbig"),
    interact(save) {
      if (!inChapter(save, "radegast")) return say(save, line("Felices Mutter", "Du siehst entschlossen aus. Was auch immer du suchst – du schaffst das.", "happy", { art: "mother" }));
      return evidence(save, "ev-mother", line("Felices Mutter", "Der Tag, an dem Elias mit dem Fahrrad kam? Das war der Mittwoch in der Woche nach deinem ersten Schultag. Du kamst ganz durchgefroren rein, hattest keinen Hunger – und hast trotzdem gelächelt.", "happy", { art: "mother" }), felice("Mama … weißt du, wo Elias jetzt ist?", "sad"), line("Felices Mutter", "Nein. Aber ich weiß, dass du ihn findest.", "neutral", { art: "mother" }));
    },
  },
  {
    id: "adv-chocolate", place: "playground", x: .56, y: .645, name: "Etwas unter der Bank", kind: "item", art: "adv:chocolate",
    visible: save => inChapter(save, "radegast") && !hasEvidence(save, "ev-chocolate"),
    interact: save => evidence(save, "ev-chocolate", narrate("Unter der Bank liegt eine Tafel Schokolade, noch ungeöffnet. Der Schatten hat sie bis hierher geweht."), felice("Seine Schokolade. Ich habe sie damals nicht gegessen … das weiß ich noch.", "sad")),
  },
  /* ---- Kapitel 2: Der Schulweg ---- */
  {
    id: "adv-ticket", place: "bus", x: .39, y: .48, display: { x: .405, y: .40 }, name: "Fahrkarte", kind: "item", art: "adv:ticket",
    visible: save => inChapter(save, "schulweg") && !everHad(save, "ticket"),
    interact: save => ({ save: addEvidence(giveItem(save, "ticket"), "ev-ticket"), lines: [narrate("Eine Fahrkarte klemmt am Wartehäuschen: „Radegast → Zörbig, Markt. Gültig für den Schulbus.“"), narrate("Neu in der Tasche: Fahrkarte. Neuer Hinweis in der Akte: „Die Fahrkarte“.")] }),
  },
  {
    id: "adv-busnote", place: "bus", x: .30, y: .50, name: "Notizzettel", kind: "item", art: "adv:note",
    visible: save => inChapter(save, "schulweg"),
    interact: save => evidence(save, "ev-note", narrate("Ein Zettel in Elias' Schrift: „Damit du unseren Weg nie vergisst: Zwischen ‚Mit dem Bus fahren‘ und ‚An St. Mauritius vorbei‘ liegt genau eine Station. Und am Ende wartet immer der Pausenhof.“"), felice("Er hat aus unserem Schulweg ein Rätsel gemacht. Typisch.", "love")),
  },
  {
    id: "adv-timetable", place: "bus", x: .45, y: .46, display: { x: .45, y: .32 }, name: "Fahrplan", kind: "item", art: "adv:timetable",
    visible: save => inChapter(save, "schulweg"),
    look: save => solved(save, "p-timetable") ? undefined : "ghost",
    interact: save => solved(save, "p-timetable") ? say(save, felice("Radegast → Zörbig Markt. Der Fahrplan stimmt wieder.")) : openPuzzle(save, "p-timetable", narrate("Die Stationen auf dem Fahrplan zittern und tauschen ständig die Plätze.")),
  },
  {
    id: "adv-shadowbus", place: "bus", x: .69, y: .49, name: "Schattenbus", kind: "item", art: "adv:bus",
    visible: save => solved(save, "p-timetable") && !hasFlag(save, "bus-boarded") && inChapter(save, "schulweg"),
    interact: save => say(save, line("Fahrer des Schattenbusses", "Fahrkarte, bitte.", "neutral", { art: "host" }), felice(hasItem(save, "ticket") ? "Die Fahrkarte ist in meiner Tasche. Ich zeige sie ihm: Tasche öffnen → Fahrkarte → „Hier benutzen“." : "Eine Fahrkarte … Am Wartehäuschen klemmte doch eine.")),
    accepts: {
      ticket: save => ({ save: addFlag(save, "bus-boarded"), lines: [line("Fahrer des Schattenbusses", "Radegast – Zörbig Markt. Für dich halte ich heute direkt am Pausenhof. Steig ein.", "neutral", { art: "host" }), narrate("Die Türen öffnen sich zischend.")], after: { cutscene: "bus", travel: "school" } }),
    },
  },
  {
    id: "adv-church-sign", place: "zoerbig", x: .60, y: .26, display: { x: .60, y: .19 }, name: "Zörbig · Markt", kind: "item", art: "landmark",
    visible: save => inChapter(save, "schulweg"),
    interact: save => say(save, narrate("Der Markt in Zörbig. Von hier seid ihr zu Fuß weiter, an St. Mauritius vorbei zum Pausenhof. Unten rechts geht es zur Schule.")),
  },
  friendSpot("friend-elena", "Elena", "elena", .18, .295, "Pass gut auf Elias' Heft auf. Und auf dich."),
  friendSpot("friend-jason", "Jason", "jason", .25, .295, "Elias hat vorhin noch von dir erzählt. Dann war er plötzlich weg – als hätte ihn der Nebel verschluckt."),
  friendSpot("friend-luca", "Luca", "luca", .18, .39, "Die kleine Turnhalle ist abgeschlossen, aber drinnen brennt manchmal ein komisches Licht. Sei vorsichtig."),
  friendSpot("friend-wyatt", "Wyatt", "wyatt", .25, .39, "Hey Felice. Wenn du jemanden suchst: Wir sind da. Du musst das nicht allein machen."),
  /* ---- Kapitel 3: Trainingsraum (Escape Room) ---- */
  {
    id: "adv-plan", place: "gym", x: .21, y: .33, display: { x: .21, y: .27 }, name: "Trainingsplan", kind: "item", art: "adv:note",
    visible: save => inChapter(save, "zoerbig"),
    interact: save => evidence(save, "ev-plan", narrate("„Jeder Schalter weckt zwei Lichter – nur der vierte weckt drei. Wenn alle Lichter brennen, zeigen die Scheiben ihre Zeichen. Gezählt wird wie im Training: von der schwächsten zur besten Scheibe.“")),
  },
  {
    id: "adv-switchboard", place: "gym", x: .50, y: .32, display: { x: .50, y: .23 }, name: "Schaltkasten", kind: "item", art: "adv:switch",
    visible: save => inChapter(save, "zoerbig"),
    interact: save => solved(save, "p-lamps") ? say(save, felice("Alle vier Lampen brennen.")) : openPuzzle(save, "p-lamps", narrate("Ein alter Schaltkasten mit vier Hebeln. Darüber vier Lampen – zwei glimmen schwach.")),
  },
  {
    id: "adv-targets", place: "gym", x: .79, y: .62, display: { x: .79, y: .52 }, name: "Zielscheiben", kind: "item", art: "adv:targets",
    visible: save => inChapter(save, "zoerbig"),
    interact(save) {
      if (!solved(save, "p-lamps")) return say(save, felice("Zu dunkel. Ich erkenne nur Umrisse von drei Scheiben. Ich brauche mehr Licht."));
      if (hasEvidence(save, "ev-targets")) return say(save, felice("Stern 2 Treffer, Mond 3, Herz 5. Das steht auch in meiner Akte."));
      return { save, lines: [narrate("Die drei Scheiben beginnen nacheinander zu leuchten. Ein Training! Tippe jede leuchtende Scheibe an – und zähl mit, welche wie oft dran war.")], after: { minigame: "targets" } };
    },
  },
  {
    id: "adv-gym-shadow", place: "gym", x: .50, y: .55, name: "Der Schatten", kind: "item", art: "adv:shadow",
    visible: save => inChapter(save, "zoerbig") && solved(save, "p-lamps") && !hasFlag(save, "shadow-met"),
    interact: save => after(addFlag(save, "shadow-met"), { glitch: true },
      shadow("Du bist weit gekommen, Felice. Weiter, als ich dachte."),
      felice("Wer bist du? Und warum hast du Elias?", "neutral", { choices: [
        said("w-free", [shadow("Frei? Ich halte ihn nicht fest. Ich bin nur das, was übrig bleibt, wenn man vergisst.")]),
        said("w-want", [shadow("Nichts. Ich nehme nur, was verblasst. Und ihr verblasst so leicht.")]),
      ] }),
      shadow("Alltag. Stress. Müdigkeit. Kleine Momente, die niemand aufschreibt. Daraus bin ich gemacht."),
      felice("Dann schreibe ich sie eben auf. Jede einzelne.", "neutral"),
      shadow("Wir werden sehen. Die Tür dort ist der einzige Ausgang. Das Schloss kennt die Reihenfolge. Kennst du sie auch?"),
      narrate("Der Schatten zerfließt. Zurück bleibt nur Kälte – und die Tür mit den drei Drehscheiben.")),
  },
  {
    id: "adv-symbol-door", place: "gym", x: .80, y: .30, display: { x: .80, y: .22 }, name: "Tür mit Symbolschloss", kind: "item", art: "adv:dial",
    visible: save => inChapter(save, "zoerbig"),
    interact(save) {
      if (!hasFlag(save, "shadow-met")) return say(save, felice(solved(save, "p-lamps") ? "Erst … dieser Schatten in der Mitte des Raumes." : "Drei Drehscheiben mit Symbolen. Ohne Licht weiß ich nicht, worauf ich sie stellen soll."));
      return openPuzzle(save, "p-symbols", narrate("Drei Drehscheiben: Stern, Herz, Mond, Raute, Blume."));
    },
  },
  /* ---- Kapitel 4: Weihnachten ---- */
  frozenSpot("mother", "Mama", "mother", .28, .50, "Schön, dass ihr da seid. Hier ist immer Platz für euch."),
  frozenSpot("stepfather", "Dein Stiefvater", "stepfather", .75, .52, "Wir sind heute zu acht am Tisch. Macht es euch gemütlich."),
  frozenSpot("halfsister", "Deine Halbschwester", "halfsister", .32, .70, "Schön, dass du dieses Jahr dabei bist, Elias."),
  frozenSpot("partner-one", "Ihr Freund", "partner-one", .18, .62, "Ich freue mich auf den gemeinsamen Abend."),
  frozenSpot("stepsister", "Tochter deines Stiefvaters", "stepsister", .76, .80, "Heute sind wir zu acht. Das wird ein schöner Abend."),
  frozenSpot("partner-two", "Ihr Freund", "partner-two", .86, .65, "Jetzt fehlt nur noch das gemeinsame Essen."),
  {
    id: "adv-place-card", place: "home", x: .57, y: .53, display: { x: .57, y: .44 }, name: "Tischkarte", kind: "item", art: "adv:card",
    visible: save => inChapter(save, "weihnachten"),
    interact: save => evidence(save, "ev-place-card", narrate("Auf der Tischkarte steht „Elias“. Sein Stuhl ist leer – aber gedeckt ist für ihn. Und dein eigener Platz wartet direkt daneben."), felice("Elias' Platz …", "love", { choices: [said("w-seat-always", [felice("Für dich ist immer ein Platz frei. Immer.", "love")]), said("w-seat-next", [felice("Neben mir. Wo sonst.", "happy")])] })),
  },
  {
    id: "adv-clock", place: "home", x: .79, y: .62, display: { x: .90, y: .33 }, name: "Wohnzimmeruhr", kind: "item", art: "adv:clock",
    visible: save => inChapter(save, "weihnachten"),
    interact(save) {
      const next = addEvidence(save, "ev-clock");
      if (solved(save, "p-clock")) return say(next, felice("Tick, tack. Die Zeit läuft wieder."));
      return openPuzzle(next, "p-clock", narrate("Die Uhr ist stehen geblieben. Darunter eine Inschrift: „Ich laufe erst weiter, wenn ich zeige, wie viele an diesem Tisch zusammengehören. Volle Stunde.“"));
    },
  },
  {
    id: "adv-gifts", place: "home", x: .45, y: .62, display: { x: .45, y: .60 }, name: "Geschenke unter dem Baum", kind: "item", art: "adv:gift",
    visible: save => inChapter(save, "weihnachten"),
    interact: save => solved(save, "p-clock") ? openPuzzle(save, "p-gifts", narrate("Sechs Geschenke mit kleinen Anhängern.")) : say(save, narrate("Die Geschenke sind von einer dünnen Eisschicht überzogen. Erst muss die Zeit wieder laufen.")),
  },
  /* ---- Finale: Erinnerungsarchiv ---- */
  {
    id: "adv-pedestals", place: "archive", x: .50, y: .64, name: "Vier Sockel", kind: "item", art: "adv:pedestal",
    visible: save => inChapter(save, "finale"),
    look: save => hasFlag(save, "pedestals-lit") ? "glow" : undefined,
    interact(save) {
      if (hasFlag(save, "pedestals-lit")) return say(save, felice("Alle vier Erinnerungen leuchten. Jetzt bleibt nur noch der Schatten."));
      return say(addFlag(save, "pedestals-lit", "archive-entered"),
        narrate("Vier Sockel. Eines nach dem anderen finden deine Fragmente ihren Platz: ▦ die Schokolade · ✿ der gemeinsame Weg · ◎ die Konzentration · ✦ Weihnachten."),
        narrate("Vier Lichter steigen auf und treffen die Barriere. Sie flackert."),
        shadow("Hübsche Bilder. Aber Bilder lügen. Komm her, Felice. Ich kenne bessere Geschichten über euch …"));
    },
  },
  {
    id: "adv-shadow", place: "archive", x: .50, y: .485, name: "Der Schatten", kind: "item", art: "adv:shadow",
    visible: save => inChapter(save, "finale") && !hasFlag(save, "barrier-down"),
    interact(save) {
      if (!hasFlag(save, "pedestals-lit")) return say(addFlag(save, "archive-entered"), shadow("Du bist also gekommen. Sieh ihn dir an. Er wartet, und er verblasst."), felice("Nicht mehr lange. Erst bringe ich unsere Erinnerungen zu den Sockeln.", "neutral"));
      if (!solved(save, "p-truth")) return openPuzzle(save, "p-truth", shadow("Sieben Sätze über euch. Welche davon sind wahr, Felice? Bist du dir sicher?"));
      return openPuzzle(save, "p-heart", shadow("Eine letzte Frage. Warum bist du hier?"));
    },
  },
  {
    id: "adv-elias", place: "archive", x: .50, y: .36, name: "Elias", kind: "person", art: "elias",
    visible: save => inChapter(save, "finale"),
    look: save => hasFlag(save, "barrier-down") ? undefined : "ghost",
    interact(save) {
      if (!hasFlag(save, "barrier-down")) return say(save, elias("Felice! Ich höre dich … ganz leise. Die Barriere – unsere Erinnerungen können sie lösen.", "sad"));
      return after(addFlag(save, "reunited"), { cutscene: "credits" }, ...REUNION);
    },
  },
  {
    id: "adv-elias-home", place: "bedroom", x: .58, y: .64, name: "Elias", kind: "person", art: "elias",
    visible: save => chapterOf(save) === "epilog",
    interact: save => say(save, elias("Ich bin wieder da. Und ich gehe so schnell nirgendwo mehr hin.", "love", { choices: [
      { label: "„Versprochen?“", reply: [elias("Versprochen. Und wenn doch mal ein Schatten kommt – du weißt ja jetzt, wie man ihn besiegt.", "laughing")] },
      { label: "Seine Hand nehmen", reply: [narrate("Elias drückt deine Hand. Draußen wird es langsam hell.")] },
    ] })),
  },
  ...SPARKS.map(sparkSpot),
];

/** Final scene. Choices change only the words, never the outcome. */
const REUNION: Line[] = [
  elias("Felice … du bist wirklich hier.", "surprised"),
  felice("Natürlich bin ich hier. Hast du etwa gedacht, ich lasse dich einfach gehen?", "love", { choices: [
    said("w-hug", [narrate("Du läufst die letzten Schritte. Elias fängt dich auf. Für einen langen Moment sagt keiner von euch etwas.")]),
    said("w-missed", [elias("Du mir auch. Jede Sekunde.", "love")]),
  ] }),
  elias("Ich habe alles gesehen. Wie du den Brief gelesen hast. Wie du in Radegast jeden gefragt hast. Den Schulweg. Den Trainingsraum. Weihnachten.", "love"),
  elias("Und ich habe gehört, was du dem Schatten geantwortet hast.", "shy"),
  felice("Weil wir zusammengehören.", "love"),
  elias("Weil wir zusammengehören. Kein Schatten kann das vergessen machen.", "love"),
  elias("Darf ich dir etwas geben? Ich habe es mir aufgeschrieben, für genau diesen Moment.", "shy"),
];

/** The personal message. Elias can replace these lines with his own words at any time. */
export const LOVE_LETTER: string[] = [
  "Liebe Felice,",
  "seit dem Tag, an dem ich mit dem Fahrrad zu dir nach Radegast gefahren bin, mit einer Tafel Schokolade und viel zu kalten Händen, ist so viel passiert.",
  "Du hast sie nicht gegessen. Und trotzdem war es einer der wichtigsten Tage für mich – weil du gesagt hast, dass es dir schon geholfen hat, dass ich da war.",
  "Genau das möchte ich für dich sein: da. Auf dem Schulweg, an langen Abenden, am Weihnachtstisch und an allen Tagen, die noch kommen.",
  "Kein Schatten kann löschen, was wir zusammen erlebt haben. Weil wir zusammengehören. Und ich freue mich auf jede Erinnerung, die wir noch sammeln.",
  "Ich liebe dich.",
  "Dein Elias ♥",
];
export const CREDITS: { role: string; names: string }[] = [
  { role: "Eine Geschichte von", names: "Felice & Elias" },
  { role: "Hauptfigur", names: "Felice" },
  { role: "Gerettet", names: "Elias" },
  { role: "Mit", names: "Mama, der Familie, Elena, Jason, Luca, Wyatt, der Nachbarin und dem Busfahrer" },
  { role: "Schauplätze", names: "Radegast · Der Schulweg · Zörbig · Weihnachten · Das Erinnerungsarchiv" },
  { role: "Die Antwort", names: "Weil wir zusammengehören." },
];

/* ---------------------------------------------------------------- Aufgaben */

export type Task = { id: string; label: string; done: (save: AdventureSave) => boolean; place?: Place; target?: string };
export const CHAPTER_TASKS: Record<ChapterId, Task[]> = {
  prolog: [
    { id: "t-letter", label: "Lies den fremden Brief auf deinem Schreibtisch", done: save => hasFlag(save, "letter-read"), place: "bedroom", target: "adv-letter" },
    { id: "t-mirror", label: "Sieh dir den Spiegel am Schminktisch an", done: save => hasEvidence(save, "ev-mirror") || solved(save, "p-seal"), place: "bedroom", target: "adv-mirror" },
    { id: "t-seal", label: "Öffne das Schattensiegel an der Haustür im Wohnzimmer", done: save => solved(save, "p-seal"), place: "home", target: "adv-door" },
  ],
  radegast: [
    { id: "t-r-tracks", label: "Untersuche die Spuren auf dem Weg durch Radegast", done: save => hasEvidence(save, "ev-tracks"), place: "radegast", target: "adv-tracks" },
    { id: "t-r-neighbor", label: "Sprich mit der Nachbarin", done: save => hasEvidence(save, "ev-neighbor"), place: "radegast", target: "adv-neighbor" },
    { id: "t-r-mother", label: "Frag Mama im Garten", done: save => hasEvidence(save, "ev-mother"), place: "garden", target: "adv-mother" },
    { id: "t-r-bus", label: "Sieh dich an der Bushaltestelle um (Aushang und Busfahrer)", done: save => hasEvidence(save, "ev-driver") && hasEvidence(save, "ev-calendar"), place: "bus", target: "adv-driver" },
    { id: "t-r-playground", label: "Such auf dem Spielplatz nach Spuren", done: save => hasEvidence(save, "ev-chocolate"), place: "playground", target: "adv-chocolate" },
    { id: "t-r-conclude", label: "Ziehe in der Akte vier Schlussfolgerungen", done: save => CONCLUSIONS.filter(entry => entry.chapter === "radegast").every(entry => save.conclusions.includes(entry.id)) },
    { id: "t-r-meeting", label: "Rekonstruiere das Treffen am Treffpunkt", done: save => solved(save, "p-meeting"), place: "radegast", target: "adv-meeting" },
  ],
  schulweg: [
    { id: "t-s-clues", label: "Sammle an der Haltestelle Fahrkarte, Elias' Zettel und die Aussage des Busfahrers", done: save => everHad(save, "ticket") && hasEvidence(save, "ev-note") && hasEvidence(save, "ev-driver2"), place: "bus", target: "adv-ticket" },
    { id: "t-s-timetable", label: "Repariere den manipulierten Fahrplan", done: save => solved(save, "p-timetable"), place: "bus", target: "adv-timetable" },
    { id: "t-s-board", label: "Zeig dem Fahrer des Schattenbusses deine Fahrkarte", done: save => hasFlag(save, "bus-boarded"), place: "bus", target: "adv-shadowbus" },
    { id: "t-s-school", label: "Fahr zum Pausenhof in Zörbig", done: save => hasFlag(save, "arrived-school"), place: "school" },
    { id: "t-s-notebook", label: "Sprich mit Elena – sie hat etwas von Elias", done: save => everHad(save, "notebook"), place: "school", target: "adv-friend-elena" },
  ],
  zoerbig: [
    { id: "t-z-enter", label: "Geh in den Trainingsraum (kleine Turnhalle am Pausenhof)", done: save => hasFlag(save, "arrived-gym"), place: "gym" },
    { id: "t-z-plan", label: "Lies den Trainingsplan", done: save => hasEvidence(save, "ev-plan"), place: "gym", target: "adv-plan" },
    { id: "t-z-lamps", label: "Bring alle vier Lampen zum Leuchten", done: save => solved(save, "p-lamps"), place: "gym", target: "adv-switchboard" },
    { id: "t-z-shadow", label: "Stell dich dem Schatten", done: save => hasFlag(save, "shadow-met"), place: "gym", target: "adv-gym-shadow" },
    { id: "t-z-targets", label: "Zähle die Treffer auf den Zielscheiben", done: save => hasEvidence(save, "ev-targets"), place: "gym", target: "adv-targets" },
    { id: "t-z-door", label: "Öffne das Symbolschloss und entkomme", done: save => solved(save, "p-symbols"), place: "gym", target: "adv-symbol-door" },
  ],
  weihnachten: [
    { id: "t-w-home", label: "Sieh dich im Wohnzimmer um", done: save => hasFlag(save, "arrived-xmas"), place: "home" },
    { id: "t-w-look", label: "Sieh dir die Eingefrorenen und die Tischkarte an", done: save => hasEvidence(save, "ev-frozen") && hasEvidence(save, "ev-place-card"), place: "home", target: "adv-place-card" },
    { id: "t-w-clock", label: "Bring die stehengebliebene Uhr wieder zum Laufen", done: save => solved(save, "p-clock"), place: "home", target: "adv-clock" },
    { id: "t-w-gifts", label: "Lege die Geschenke in die richtige Reihenfolge", done: save => solved(save, "p-gifts"), place: "home", target: "adv-gifts" },
  ],
  finale: [
    { id: "t-f-enter", label: "Betritt das Erinnerungsarchiv durch den Riss in deinem Zimmer", done: save => hasFlag(save, "arrived-archive") || save.place === "archive", place: "archive" },
    { id: "t-f-pedestals", label: "Bring die vier Erinnerungsfragmente zu den Sockeln", done: save => hasFlag(save, "pedestals-lit"), place: "archive", target: "adv-pedestals" },
    { id: "t-f-truth", label: "Entlarve die Lügen des Schattens", done: save => solved(save, "p-truth"), place: "archive", target: "adv-shadow" },
    { id: "t-f-heart", label: "Beantworte die letzte Frage des Schattens", done: save => solved(save, "p-heart"), place: "archive", target: "adv-shadow" },
    { id: "t-f-elias", label: "Geh zu Elias", done: save => hasFlag(save, "reunited"), place: "archive", target: "adv-elias" },
  ],
  epilog: [],
};
export const SIDE_QUESTS: { id: string; title: string; text: string; progress: (save: AdventureSave) => [number, number] }[] = [
  { id: "sq-sparks", title: "Kleine Lichter", text: "Finde fünf Erinnerungsfunken in Garten, Küche, Spielplatz, Zörbig und auf dem Pausenhof.", progress: save => [SPARK_IDS.filter(id => hasFlag(save, id)).length, 5] },
  { id: "sq-friends", title: "Freundeskreis", text: "Sprich auf dem Pausenhof mit Elena, Jason, Luca und Wyatt.", progress: save => [FRIENDS.filter(id => hasFlag(save, id)).length, 4] },
];
