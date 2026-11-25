// State, saving and rules glue of the puzzle adventure "Die verlorenen Erinnerungen".
// Moved out of Game.tsx unchanged; the world (Felice's position, movement) stays in Game.tsx
// and is reached through the small AdventureWorld interface.
import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { Place, Point } from "../story";
import { SPAWNS } from "../story";
import { worldAudio } from "../audio";
import { addPlayTime, newAdventure, type AdventureSave, type After as AdvAfter, type Line as AdvLine, type Outcome as AdvOutcome } from "./core";
import { chooseWords, finishMinigame, mainProgress, chapterOf as advChapterOf, combineEvidence, combineItems, enterPlace as advEnterPlace, openPuzzleRecord, skipPuzzle, submitPuzzle } from "./engine";
import { browserStorage, loadAdventure, setAsideDamaged, writeAdventure } from "./storage";
import type { JournalTab } from "./AdventureUI";
import { FRAGMENTS, MAIN_PUZZLES } from "./content";

/** Active play time is folded into the save at every write and at least this often. */
const ADV_AUTOSAVE_MS = 30000;
const solvedCount = (save: AdventureSave) => Object.values(save.puzzles).filter(record => record.status === "gelöst").length;

/** What the adventure needs from the shared world in Game.tsx. */
export type AdventureWorld = {
  playerRef: RefObject<Point>;
  /** Set while Felice sits or lies; a save then puts her back on the spot's approach point. */
  restRef: RefObject<{ spot: { approach: Point } } | null>;
  setPlayer(point: Point): void;
  setWalking(walking: boolean): void;
  clearMovement(): void;
};
/** Where a save puts Felice back: the approach point while she sits or lies, else her position. */
const savePoint = ({ playerRef, restRef }: Pick<AdventureWorld, "playerRef" | "restRef">) => restRef.current ? restRef.current.spot.approach : playerRef.current;

export function useAdventure(world: AdventureWorld) {
  // Saves: main slot + checkpoint slot in localStorage; a damaged main save is never overwritten without the player's choice.
  const [advInitial] = useState(() => loadAdventure(browserStorage()));
  const [adv, setAdv] = useState<AdventureSave>(advInitial.save);
  const advRef = useRef(advInitial.save);
  const advReadable = useRef(advInitial.state !== "damaged");
  const [advDamaged, setAdvDamaged] = useState(advInitial.state === "damaged");
  const [advError, setAdvError] = useState<string | null>(advInitial.state === "unavailable" ? "Dieser Browser erlaubt gerade kein lokales Speichern (privates Fenster oder gesperrte Websitedaten). Du kannst spielen, aber der Fortschritt geht beim Schließen verloren." : null);
  const [advSavedAt, setAdvSavedAt] = useState<string | null>(advInitial.save.savedAt);
  const [advSaveMessage, setAdvSaveMessage] = useState<string | null>(advInitial.state === "migrated" ? "Dein Spielstand aus der vorherigen Version wurde übernommen." : null);
  const playAcc = useRef(0);
  const [advRide, setAdvRide] = useState<AdvAfter | null>(null);
  const [advMinigame, setAdvMinigame] = useState(false);
  const [advReward, setAdvReward] = useState<{ key: number; title: string; symbol: string; main?: string; fragment: boolean } | null>(null);
  const [advFx, setAdvFx] = useState<{ key: number; name: "shadow-dissolve" | "heart-burst" } | null>(null);
  /** A scene change that waits until Elias' message was answered. */
  const advPendingTravel = useRef<Place | null>(null);
  const [advScript, setAdvScript] = useState<{ lines: AdvLine[]; index: number; after?: AdvAfter } | null>(null);
  const [advPuzzle, setAdvPuzzle] = useState<string | null>(null);
  const [advJournal, setAdvJournal] = useState<JournalTab | null>(null);
  const [advBag, setAdvBag] = useState(false);
  const [advHint, setAdvHint] = useState(false);
  const [advCutscene, setAdvCutscene] = useState<"elias-message" | "credits" | null>(null);
  const [glitch, setGlitch] = useState(0);
  /**
   * Every adventure change is written at once. Solved puzzles, chapter changes and manual saves
   * also refresh the checkpoint slot. Active play time collected since the last write is folded in.
   */
  const persistAdventure = useCallback((raw: AdventureSave, options: { checkpoint?: boolean } = {}) => {
    const prior = advRef.current;
    const next = addPlayTime(raw, playAcc.current, advChapterOf(prior)); playAcc.current = 0;
    const checkpoint = options.checkpoint || advChapterOf(prior) !== advChapterOf(next) || solvedCount(next) > solvedCount(prior);
    const result = advReadable.current ? writeAdventure(browserStorage(), next, { checkpoint }) : null;
    const stored = result?.ok ? { ...next, savedAt: result.savedAt, chapter: advChapterOf(next) } : next;
    advRef.current = stored; setAdv(stored);
    // Rewards that are felt, not only read: a returning fragment spins up to the HUD, a finished main puzzle is announced.
    const newFragment = FRAGMENTS.find(fragment => next.fragments.includes(fragment.id) && !prior.fragments.includes(fragment.id));
    const doneBefore = mainProgress(prior).filter(entry => entry.solved).length, doneNow = mainProgress(next).filter(entry => entry.solved);
    if (newFragment || doneNow.length > doneBefore) {
      const main = doneNow.length > doneBefore ? `Haupt-Rätsel ${doneNow.length}/${MAIN_PUZZLES.length} gelöst` : undefined;
      setAdvReward({ key: Date.now(), title: newFragment?.title ?? doneNow[doneNow.length - 1].title, symbol: newFragment?.symbol ?? "✦", main, fragment: Boolean(newFragment) });
      if (next.settings.effects !== "reduced") { try { navigator.vibrate?.([30, 50, 70]); } catch { /* optional */ } }
    }
    if (!result) return null;
    if (result.ok) { setAdvSavedAt(result.savedAt); setAdvError(null); } else setAdvError(result.error);
    return result;
  }, []);
  /** Moves Felice to another place of the adventure (exits, travel after a puzzle, the bus ride). */
  const advTravel = useCallback((place: Place, spawn: Point = SPAWNS[place]) => {
    const outcome = advEnterPlace(advRef.current, place);
    persistAdventure({ ...outcome.save, position: spawn });
    world.playerRef.current = spawn; world.setPlayer(spawn); world.setWalking(false); world.clearMovement();
    if (outcome.lines.length) setAdvScript({ lines: outcome.lines, index: 0 });
  }, [persistAdventure]);
  /* ------------------------------------------------ Abenteuer: Die verlorenen Erinnerungen */
  /** Applies an engine outcome: autosave first (so a skipped dialogue never loses progress), then show it. */
  function runAdventure(outcome: AdvOutcome) {
    persistAdventure({ ...outcome.save, position: world.playerRef.current });
    if (outcome.lines.length) setAdvScript({ lines: outcome.lines, index: 0, after: outcome.after });
    else runAdventureAfter(outcome.after);
  }
  function runAdventureAfter(after?: AdvAfter) {
    if (!after) return;
    if ((after.glitch || after.cutscene === "shadow" || after.cutscene === "barrier") && advRef.current.settings.effects !== "reduced") setGlitch(Date.now());
    if (after.cutscene === "bus") { world.clearMovement(); setAdvRide(after); return; }
    if (after.cutscene === "barrier") setAdvFx({ key: Date.now(), name: "shadow-dissolve" });
    if (after.minigame) { world.clearMovement(); setAdvMinigame(true); return; }
    // Elias' message comes first; a scene change waits until Felice has answered.
    if (after.cutscene === "elias-message" && after.travel) { advPendingTravel.current = after.travel; setAdvCutscene("elias-message"); return; }
    if (after.travel) advTravel(after.travel);
    if (after.puzzle) { persistAdventure(openPuzzleRecord(advRef.current, after.puzzle)); setAdvPuzzle(after.puzzle); }
    if (after.cutscene === "elias-message" || after.cutscene === "credits") setAdvCutscene(after.cutscene);
  }
  function answerElias(wordId: string) {
    persistAdventure(chooseWords(advRef.current, wordId));
    setAdvCutscene(null); world.clearMovement();
    const travel = advPendingTravel.current; advPendingTravel.current = null;
    if (travel) advTravel(travel);
  }
  function finishTargets() {
    setAdvMinigame(false); worldAudio.play("complete");
    runAdventure(finishMinigame(advRef.current, "targets"));
  }
  function finishAdventureRide() {
    const ride = advRide; setAdvRide(null);
    advTravel(ride?.travel ?? "school");
  }
  function advanceAdventureScript(choice?: string) {
    const script = advScript;
    if (!script) return;
    const current = script.lines[script.index];
    const picked = current?.choices?.find(entry => entry.label === choice);
    if (picked?.id) { persistAdventure(chooseWords(advRef.current, picked.id)); setAdvFx({ key: Date.now(), name: "heart-burst" }); }
    const lines = picked?.reply?.length ? [...script.lines.slice(0, script.index + 1), ...picked.reply, ...script.lines.slice(script.index + 1)] : script.lines;
    if (script.index + 1 >= lines.length) { setAdvScript(null); world.clearMovement(); runAdventureAfter(script.after); return; }
    setAdvScript({ lines, index: script.index + 1, after: script.after });
  }
  function skipAdventureScript() { const script = advScript; setAdvScript(null); world.clearMovement(); runAdventureAfter(script?.after); }
  function submitAdventurePuzzle(id: string, answer: unknown) {
    const result = submitPuzzle(advRef.current, id, answer);
    persistAdventure(result.save);
    if (result.ok) {
      worldAudio.play("complete");
      window.setTimeout(() => { setAdvPuzzle(null); runAdventure({ save: advRef.current, lines: result.lines, after: result.after }); }, 700);
    } else {
      worldAudio.play("interact");
      if (advRef.current.settings.effects !== "reduced") { try { navigator.vibrate?.(60); } catch { /* optional */ } }
    }
    return { ok: Boolean(result.ok), feedback: result.feedback };
  }
  function skipAdventurePuzzle(id: string) {
    const outcome = skipPuzzle(advRef.current, id);
    if (outcome.save === advRef.current) return;
    setAdvPuzzle(null); setAdvHint(false); worldAudio.play("complete"); runAdventure(outcome);
  }
  function combineAdventureItems(a: string, b: string) {
    const outcome = combineItems(advRef.current, a, b);
    const text = outcome.lines.map(entry => entry.text).join(" ");
    if (outcome.ok) { worldAudio.play("complete"); setAdvBag(false); runAdventure(outcome); } else persistAdventure(outcome.save);
    return { ok: outcome.ok, text };
  }
  function combineAdventureEvidence(a: string, b: string) {
    const outcome = combineEvidence(advRef.current, a, b);
    persistAdventure(outcome.save);
    if (outcome.ok) worldAudio.play("complete");
    return { ok: outcome.ok, text: outcome.lines.map(entry => entry.text).join(" ") };
  }
  useEffect(() => {
    if (!glitch) return;
    const timer = window.setTimeout(() => setGlitch(0), 900);
    return () => window.clearTimeout(timer);
  }, [glitch]);
  useEffect(() => {
    if (!advReward) return;
    const timer = window.setTimeout(() => setAdvReward(null), 3400);
    return () => window.clearTimeout(timer);
  }, [advReward]);
  useEffect(() => {
    if (!advFx) return;
    const timer = window.setTimeout(() => setAdvFx(null), 2200);
    return () => window.clearTimeout(timer);
  }, [advFx]);
  /** The player chose how to go on from a damaged save: keep the damaged text aside and save normally again. */
  function acceptDamagedSave() { setAsideDamaged(browserStorage()); advReadable.current = true; setAdvDamaged(false); }
  /** "Neues Spiel": a fresh save that keeps the settings, written to both slots. */
  function beginFreshAdventure() {
    playAcc.current = 0;
    const current = { ...newAdventure(), settings: advRef.current.settings };
    advRef.current = current; persistAdventure(current, { checkpoint: true }); setAdvSaveMessage(null);
    return current;
  }
  return {
    advInitial, adv, advRef, advReadable, advDamaged, acceptDamagedSave, beginFreshAdventure, advError, advSavedAt, advSaveMessage, setAdvSaveMessage, playAcc,
    advRide, advMinigame, setAdvMinigame, advReward, setAdvReward, advFx, setAdvFx, advScript, setAdvScript, advPuzzle, setAdvPuzzle,
    advJournal, setAdvJournal, advBag, setAdvBag, advHint, setAdvHint, advCutscene, setAdvCutscene, glitch, setGlitch,
    persistAdventure, advTravel, runAdventure, runAdventureAfter, answerElias, finishTargets, finishAdventureRide,
    advanceAdventureScript, skipAdventureScript, submitAdventurePuzzle, skipAdventurePuzzle, combineAdventureItems, combineAdventureEvidence,
  };
}

export type Adventure = ReturnType<typeof useAdventure>;

/** Counts active play time and autosaves while the adventure runs; flushes the save when the page is hidden. */
export function useAdventureAutosave({ advReadable, advRef, playAcc, persistAdventure }: Pick<Adventure, "advReadable" | "advRef" | "playAcc" | "persistAdventure">, world: Pick<AdventureWorld, "playerRef" | "restRef">, active: boolean, running: boolean) {
  // Active play time (no pause, no hidden tab, no rotate prompt) plus a quiet autosave of position and time.
  useEffect(() => {
    if (!active || !running) return;
    let last = performance.now();
    const tick = window.setInterval(() => { const now = performance.now(); if (!document.hidden) playAcc.current += Math.min(5, (now - last) / 1000); last = now; }, 1000);
    const autosave = window.setInterval(() => { if (!document.hidden && advReadable.current) persistAdventure({ ...advRef.current, position: savePoint(world) }); }, ADV_AUTOSAVE_MS);
    return () => { window.clearInterval(tick); window.clearInterval(autosave); };
  }, [active, running, persistAdventure]);
  // Closing the tab, switching apps on the phone or locking the screen writes the latest state.
  useEffect(() => {
    if (!active) return;
    const flush = () => { if (advReadable.current) persistAdventure({ ...advRef.current, position: savePoint(world) }); };
    const hidden = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("pagehide", flush); document.addEventListener("visibilitychange", hidden);
    return () => { window.removeEventListener("pagehide", flush); document.removeEventListener("visibilitychange", hidden); };
  }, [active, persistAdventure]);
}
