"use client";

import { useEffect, useRef, useState } from "react";
import { TARGET_COUNTS, TARGET_ORDER, TARGET_SYMBOLS } from "./content";

type Target = keyof typeof TARGET_COUNTS;
const NAMES: Record<Target, string> = { star: "Stern", moon: "Mond", heart: "Herz" };
const LAYOUT: Target[] = ["star", "heart", "moon"];
const LIT_MS = 1700, GAP_MS = 380;

/**
 * Escape-room training: the three targets light up one after another; tap the lit one.
 * Nothing can be lost – a missed target simply comes back at the end, and "Ohne Zeitdruck"
 * keeps every target lit until it is tapped. The hit counter is the clue for the symbol lock.
 */
export function TargetChallenge({ blocked, onDone }: { blocked: boolean; onDone: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [queue, setQueue] = useState<Target[]>(TARGET_ORDER);
  const [lit, setLit] = useState<Target | null>(null);
  const [hits, setHits] = useState<Record<Target, number>>({ star: 0, moon: 0, heart: 0 });
  const [relaxed, setRelaxed] = useState(false);
  const [flash, setFlash] = useState<{ target: Target; ok: boolean } | null>(null);
  const [missed, setMissed] = useState(0);
  const done = queue.length === 0 && !lit;
  useEffect(() => {
    const node = dialog.current; if (node && !node.open) node.showModal();
    // Focus the instructions, not a target: a focus ring on a target would look like "lit".
    node?.querySelector<HTMLElement>(".adv-prompt")?.focus();
    return () => { if (node?.open) node.close(); };
  }, []);
  // Light the next target after a short gap.
  useEffect(() => {
    if (blocked || lit || !queue.length) return;
    const timer = window.setTimeout(() => setLit(queue[0]), GAP_MS);
    return () => window.clearTimeout(timer);
  }, [blocked, lit, queue]);
  // Too slow: the target goes back to the end of the queue.
  useEffect(() => {
    if (blocked || !lit || relaxed) return;
    const timer = window.setTimeout(() => { setQueue(previous => [...previous.slice(1), previous[0]]); setLit(null); setMissed(value => value + 1); }, LIT_MS);
    return () => window.clearTimeout(timer);
  }, [blocked, lit, relaxed]);
  useEffect(() => { if (!flash) return; const timer = window.setTimeout(() => setFlash(null), 320); return () => window.clearTimeout(timer); }, [flash]);
  function tap(target: Target) {
    if (blocked || done) return;
    if (target !== lit) { setFlash({ target, ok: false }); return; }
    setHits(previous => ({ ...previous, [target]: previous[target] + 1 }));
    setFlash({ target, ok: true });
    try { navigator.vibrate?.(25); } catch { /* optional */ }
    setQueue(previous => previous.slice(1)); setLit(null);
  }
  const total = TARGET_ORDER.length, scored = Object.values(hits).reduce((a, b) => a + b, 0);
  return <dialog ref={dialog} className="story-modal adv-modal adv-targets-game" data-testid="adv-targets-game" onCancel={event => event.preventDefault()} aria-labelledby="adv-targets-title">
    <header className="adv-modal-head"><div><small>Escape Room · Training</small><h1 id="adv-targets-title">Die Zielscheiben</h1></div></header>
    <p className="adv-prompt" tabIndex={-1}>{done ? "Training geschafft! Merk dir, welche Scheibe wie oft getroffen wurde." : "Tippe die Scheibe an, die gerade leuchtet. Verpasste Scheiben kommen später noch einmal."}</p>
    <div className="adv-target-row">{LAYOUT.map(target => <button key={target} data-target={target} className={`adv-target${lit === target ? " is-lit" : ""}${flash?.target === target ? flash.ok ? " is-hit" : " is-miss" : ""}`} aria-label={`${NAMES[target]}-Scheibe${lit === target ? " leuchtet" : ""}`} disabled={blocked || done} onClick={() => tap(target)}>
      <span aria-hidden="true">{TARGET_SYMBOLS[target]}</span>
    </button>)}</div>
    <div className="adv-target-score" aria-live="polite">{LAYOUT.map(target => <span key={target}><b>{TARGET_SYMBOLS[target]}</b> {NAMES[target]}: <strong data-testid={`adv-hits-${target}`}>{hits[target]}</strong></span>)}</div>
    <div className="adv-row adv-target-foot">
      <small>{scored}/{total} Treffer{missed ? ` · ${missed}× zu langsam – kein Problem` : ""}</small>
      {!done && <button className="memory-secondary" aria-pressed={relaxed} onClick={() => setRelaxed(value => !value)}>{relaxed ? "✓ Ohne Zeitdruck" : "Ohne Zeitdruck"}</button>}
      {done && <button className="memory-primary" data-testid="adv-targets-done" autoFocus onClick={onDone}>Treffer notieren</button>}
    </div>
  </dialog>;
}
