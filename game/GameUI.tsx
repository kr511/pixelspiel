"use client";

import { type PointerEvent, useRef, useState, useSyncExternalStore } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useInput } from "./input";
import { worldAudio } from "./audio";

/** `keepOpen` entries (e.g. "Spiel speichern") run without leaving the pause menu. */
export type MenuEntry = { label: string; shortcut?: string; onSelect: () => void; keepOpen?: boolean; primary?: boolean };
/** Start-screen choices; without them the single "Welt betreten" button starts the chronicle. `confirm` asks once before replacing a save. */
export type StartMode = { id: string; label: string; detail: string; primary?: boolean; confirm?: string; onSelect: () => void };
export function GameUI({ started, onStart, roomActive = true, transitioning = false, place = "Felices Pixelzimmer", completed = 0, menu = [], modes = [], controls, saveStatus, saveNote, startNotice }: { started: boolean; onStart: () => void; roomActive?: boolean; transitioning?: boolean; place?: string; completed?: number; menu?: MenuEntry[]; modes?: StartMode[]; controls?: string; saveStatus?: string; saveNote?: string; startNotice?: string | null }) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const paused = useInput((state) => state.paused);
  const muted = useSyncExternalStore(worldAudio.subscribe, worldAudio.getMuted, worldAudio.getMuted);
  const setPaused = useInput((state) => state.setPaused);
  const setMove = useInput((state) => state.setMove);
  const stickOrigin = useRef({ x: 0, y: 0 });
  const stickPointer = useRef<number | null>(null);
  const moveX = useInput((state) => state.moveX);
  const moveY = useInput((state) => state.moveY);
  const stick = { x: moveX * 34, y: -moveY * 34 };

  function moveStick(event: PointerEvent<HTMLDivElement>) {
    const dx = event.clientX - stickOrigin.current.x;
    const dy = event.clientY - stickOrigin.current.y;
    const length = Math.max(1, Math.hypot(dx, dy));
    const limit = 34;
    const scale = Math.min(1, limit / length);
    const x = dx * scale; const y = dy * scale;
    setMove(x / limit, -y / limit);
  }

  function stopStick() { stickPointer.current = null; setMove(0, 0); }

  return (
    <div className="game-ui">
      <div className="world-title"><span>F × E</span><div><strong>Felice × Elias</strong><small>{place}{completed > 0 && ` · ${completed} Erinnerung bewahrt`}</small></div></div>
      {started && !transitioning && <button data-game-control className="pause-button" onClick={() => { if (paused) void worldAudio.unlock(); setPaused(!paused); }} aria-label={paused ? "Weiterspielen" : "Pause"}>{paused ? <Play size={18} /> : <Pause size={18} />}</button>}
      {started && <button data-game-control className="audio-button" onClick={() => worldAudio.toggleMuted()} aria-label={muted ? "Ton einschalten" : "Ton ausschalten"} aria-pressed={muted}>{muted ? <VolumeX size={18}/> : <Volume2 size={18}/>}</button>}
      {started && !paused && roomActive && !transitioning && <div className="controls-hint"><span className="desktop-hint">{controls ?? <>WASD / Pfeile · Laufen &nbsp; E · Interagieren &nbsp; J · Album &nbsp; I · Tasche &nbsp; Esc · Menü</>}</span><span className="mobile-hint">Joystick · Laufen &nbsp; Aktionsknopf · Sprechen & Benutzen</span></div>}
      {started && !paused && roomActive && !transitioning && (
        <div data-game-control className="joystick" onPointerDown={(event) => { try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Some browsers refuse capture; the active pointer is tracked below. */ } stickPointer.current = event.pointerId; stickOrigin.current = { x: event.clientX, y: event.clientY }; moveStick(event); }} onPointerMove={(event) => { if (stickPointer.current === event.pointerId) moveStick(event); }} onPointerUp={stopStick} onPointerCancel={stopStick} onLostPointerCapture={stopStick}>
          <div className="joystick-knob" style={{ transform: `translate(${stick.x}px, ${stick.y}px)` }} />
        </div>
      )}
      {(!started || paused) && (
        <div className="start-screen" data-game-control>
          <div className="start-card">
            <p>{started ? place : modes.length ? "Felice × Elias World · Version 1.0" : "Eure kleine Welt · Version 0.9"}</p>
            <h1>{started && paused ? "Kurze Pause?" : "Felice × Elias"}</h1>
            <span>{started && paused ? "Dein Moment wartet auf dich." : modes.length ? "Elias ist verschwunden. Ein Schatten hält ihn zwischen euren Erinnerungen gefangen. Löse sechs Rätsel, finde vier verlorene Erinnerungen – und hol ihn zurück. Ein Abenteuer für etwa 30 Minuten." : "Lange Abende am Handy. Ein Fahrrad, ein Stück Schokolade. Zwei Nachrichten, die bleiben. Erlebe euer gemeinsames Jahr in acht Kapiteln – vom ersten Schreiben bis zu den Erinnerungen, die bleiben."}</span>
            {!started && startNotice && <p className="start-notice" role="alert" data-testid="start-notice">{startNotice}</p>}
            {!started && modes.length > 0 ? <div className="start-modes" data-testid="start-modes">{modes.map(mode => confirming === mode.id
              ? <div key={mode.id} className="start-confirm" role="alertdialog" aria-label={mode.label}><p>{mode.confirm}</p><div><button data-testid="start-confirm-yes" className="is-primary" onClick={() => { setConfirming(null); void worldAudio.unlock(); setPaused(false); mode.onSelect(); }}><span><strong>Ja, neu beginnen</strong></span></button><button className="is-secondary" onClick={() => setConfirming(null)}><span><strong>Abbrechen</strong></span></button></div></div>
              : <button key={mode.id} data-mode={mode.id} className={mode.primary ? "is-primary" : "is-secondary"} onClick={() => { if (mode.confirm) { setConfirming(mode.id); return; } void worldAudio.unlock(); setPaused(false); mode.onSelect(); }}>{mode.primary && <Play size={17} fill="currentColor" />}<span><strong>{mode.label}</strong><small>{mode.detail}</small></span></button>)}</div>
            : <button onClick={() => { void worldAudio.unlock(); setPaused(false); if (!started) onStart(); }}><Play size={17} fill="currentColor" />{started && paused ? "Zurück zum Spiel" : "Welt betreten"}</button>}
            {started && paused && menu.length > 0 && <nav className="pause-menu" aria-label="Spielmenü">{menu.map(entry => <button key={entry.label} className={entry.primary ? "is-save" : undefined} data-testid={entry.keepOpen ? "pause-save" : undefined} onClick={() => { void worldAudio.unlock(); if (!entry.keepOpen) setPaused(false); entry.onSelect(); }}>{entry.label}{entry.shortcut && <kbd>{entry.shortcut}</kbd>}</button>)}</nav>}
            {started && paused && <small className="pause-autosave" data-testid="pause-save-status" role="status">{saveStatus ?? "Dein Fortschritt wird automatisch gespeichert."}</small>}
            {saveNote && (!started || paused) && <small className="save-note">{saveNote}</small>}
          </div>
        </div>
      )}
    </div>
  );
}
