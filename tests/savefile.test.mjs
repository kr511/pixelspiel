import test from "node:test";
import assert from "node:assert/strict";
import { SAVE_KEYS, exportSave, importSave, parseSaveFile, summarize } from "../game/savefile.ts";
import { TIMELINE_KEY, initialTimeline } from "../game/timeline.ts";
import { STORY_KEY } from "../game/story.ts";
import { NAMES_KEY, initialNames } from "../game/names.ts";

const memory = (initial = {}) => {
  const map = new Map(Object.entries(initial));
  return { map, getItem: key => map.get(key) ?? null, setItem: (key, value) => { map.set(key, value); }, removeItem: key => { map.delete(key); } };
};
const timelineRaw = () => JSON.stringify(initialTimeline());
const names = () => JSON.stringify({ ...initialNames(), names: { family: "Beispiel" } });

test("Export und Import ergeben einen identischen Spielstand", () => {
  const source = memory({ [TIMELINE_KEY]: timelineRaw(), [NAMES_KEY]: names() });
  const file = exportSave(source, "2026-10-13T10:00:00Z");
  const parsed = parseSaveFile(JSON.stringify(file));
  const target = memory({ [NAMES_KEY]: JSON.stringify(initialNames()), "felice-elias.audio.v1": JSON.stringify({ version: 1, muted: true }) });
  importSave(target, parsed);
  assert.equal(target.getItem(TIMELINE_KEY), source.getItem(TIMELINE_KEY));
  assert.equal(target.getItem(NAMES_KEY), source.getItem(NAMES_KEY));
  assert.equal(target.getItem("felice-elias.audio.v1"), null, "Nicht exportierte Schlüssel werden entfernt, damit nichts Altes übrig bleibt");
  assert.deepEqual(summarize(parsed), { gameDate: "2025-11-10", memories: 0, names: 1 });
});
test("Fremde, kaputte und manipulierte Dateien werden abgelehnt", () => {
  const good = exportSave(memory({ [TIMELINE_KEY]: timelineRaw() }));
  const bad = [
    "kein json", "null", JSON.stringify({ format: "anderes", version: 1, exportedAt: "x", data: {} }),
    JSON.stringify({ ...good, version: 2 }),
    JSON.stringify({ ...good, data: { ...good.data, "fremder.schluessel": "{}" } }),
    JSON.stringify({ ...good, data: { [TIMELINE_KEY]: "{\"version\":9}" } }),
    JSON.stringify({ ...good, data: { [NAMES_KEY]: names() } }),
    JSON.stringify({ ...good, data: { [TIMELINE_KEY]: 5 } }),
    "x".repeat(1_000_001),
  ];
  for (const raw of bad) assert.throws(() => parseSaveFile(raw));
});
test("Ein fehlgeschlagener Import stellt den alten Stand wieder her", () => {
  const file = parseSaveFile(JSON.stringify(exportSave(memory({ [TIMELINE_KEY]: timelineRaw(), [NAMES_KEY]: names() }))));
  const target = memory({ [STORY_KEY]: "alt" });
  const real = target.setItem;
  target.setItem = (key, value) => { if (key === NAMES_KEY) throw new Error("voll"); real(key, value); };
  assert.throws(() => importSave(target, file), /voll/);
  assert.equal(target.getItem(STORY_KEY), "alt");
  assert.equal(target.getItem(TIMELINE_KEY), null);
});
test("Export liest nur bekannte Schlüssel und verweigert kaputte Daten", () => {
  assert.ok(SAVE_KEYS.includes(TIMELINE_KEY));
  assert.throws(() => exportSave(memory({ [TIMELINE_KEY]: "kaputt" })));
  assert.deepEqual(exportSave(memory({ unbekannt: "1" })).data, {});
});
