// Prints the modelled play time of the intended adventure route per chapter.
// Run: node --experimental-strip-types scripts/adventure-playtime.mjs
import { ADVENTURE_CHAPTERS } from "../game/adventure/content.ts";
import { MODEL, playRoute, summarize } from "../tests/adventure-route.mjs";

const { seconds, log } = playRoute({ roundTrip: false });
const { chapters, total } = summarize(seconds);
const byKind = {};
for (const entry of log) { const kind = entry.what.startsWith("Rätsel") ? "Rätsel lösen" : entry.what.startsWith("Lösung") || ["Dialog", "Ankunft", "Intro", "Liebesbrief"].includes(entry.what) ? "Lesen" : entry.what.startsWith("Szene") ? "Zwischensequenzen" : ["Laufen", "Ortswechsel", "Suchen"].includes(entry.what) ? "Laufen & Suchen" : "Akte & Tasche"; byKind[kind] = (byKind[kind] ?? 0) + entry.seconds; }
console.log("Kapitel            geplant   Modell");
for (const chapter of ADVENTURE_CHAPTERS.filter(entry => entry.minutes)) {
  const modelled = chapters.find(entry => entry.chapter === chapter.id)?.minutes ?? 0;
  console.log(`${chapter.title.padEnd(18)} ${String(chapter.minutes).padStart(4)} Min ${modelled.toFixed(1).padStart(6)} Min`);
}
const epilog = chapters.find(entry => entry.chapter === "epilog");
if (epilog) console.log(`${"(Abspann)".padEnd(18)}          ${epilog.minutes.toFixed(1).padStart(6)} Min`);
console.log(`${"Gesamt".padEnd(18)} ${String(ADVENTURE_CHAPTERS.reduce((sum, c) => sum + c.minutes, 0)).padStart(4)} Min ${total.toFixed(1).padStart(6)} Min`);
console.log("\nAnteile:", Object.entries(byKind).map(([kind, value]) => `${kind} ${(value / 60).toFixed(1)} Min`).join(" · "));
console.log("Annahmen:", JSON.stringify({ charsPerSecond: MODEL.charsPerSecond, walkFactor: MODEL.walkFactor, thinking: MODEL.thinking }));
