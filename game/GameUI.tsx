"use client";

import { type PointerEvent, useRef, useState, useSyncExternalStore } from "react";
import { Play, Volume2, VolumeX } from "lucide-react";
import { useInput } from "./input";
import { worldAudio } from "./audio";
import { StartBackdrop } from "./StartBackdrop";
import { GAME_VERSION } from "./version";

/** `keepOpen` entries (e.g. "Spiel speichern") run without leaving the pause menu. */
export type MenuEntry = { label: string; shortcut?: string; onSelect: () => void; keepOpen?: boolean; primary?: boolean };
/** Start-screen choices; without them the single "Welt betreten" button starts the chronicle. `confirm` asks once before replacing a save. */
export type StartMode = { id: string; label: string; detail: string; primary?: boolean; confirm?: string; onSelect: () => void };
export function GameUI({ started, loading = null, onStart, roomActive = true, transitioning = false, place = "Felices Pixelzimmer", completed = 0, menu = [], modes = [], saveStatus, saveNote, startNotice }: { started: boolean; loading?: number | null; onStart: () => void; roomActive?: boolean; transitioning?: boolean; place?: string; completed?: number; menu?: MenuEntry[]; modes?: StartMode[]; controls?: string; saveStatus?: string; saveNote?: string; startNotice?: string | null }) {
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
  const waiting = !started && loading !== null;

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
      {started && !paused && roomActive && !transitioning && (
        <div data-game-control className="joystick" onPointerDown={(event) => { try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Some browsers refuse capture; the active pointer is tracked below. */ } stickPointer.current = event.pointerId; stickOrigin.current = { x: event.clientX, y: event.clientY }; moveStick(event); }} onPointerMove={(event) => { if (stickPointer.current === event.pointerId) moveStick(event); }} onPointerUp={stopStick} onPointerCancel={stopStick} onLostPointerCapture={stopStick}>
          <div className="joystick-knob" style={{ transform: `translate(${stick.x}px, ${stick.y}px)` }} />
        </div>
      )}
      {(!started || paused) && (
        <div className={`start-screen${started ? "" : " with-backdrop"}`} data-game-control>
          {!started && <StartBackdrop/>}
          <div className="start-card">
            <p>{started ? `${place}${completed > 0 ? ` · ${completed} ${completed === 1 ? "Erinnerung" : "Erinnerungen"} bewahrt` : ""}` : modes.length ? `Felice × Elias World · Version ${GAME_VERSION}` : `Eure kleine Welt · Version ${GAME_VERSION}`}</p>
            <h1>{started && paused ? "Kurze Pause?" : "Felice × Elias"}</h1>
            <span>{started && paused ? "Dein Moment wartet auf dich." : modes.length ? "Elias ist verschwunden. Ein Schatten hält ihn zwischen euren Erinnerungen gefangen. Löse sechs Rätsel, finde vier verlorene Erinnerungen – und hol ihn zurück. Ein Abenteuer für etwa 30 Minuten." : "Lange Abende am Handy. Ein Fahrrad, ein Stück Schokolade. Zwei Nachrichten, die bleiben. Erlebe euer gemeinsames Jahr in acht Kapiteln – vom ersten Schreiben bis zu den Erinnerungen, die bleiben."}</span>
            {!started && startNotice && <p className="start-notice" role="alert" data-testid="start-notice">{startNotice}</p>}
            {!started && modes.length > 0 ? <div className="start-modes" data-testid="start-modes">{waiting && <small className="start-loading">Welt lädt … {Math.round((loading ?? 0) * 100)} %</small>}{modes.map(mode => confirming === mode.id
              ? <div key={mode.id} className="start-confirm" role="alertdialog" aria-label={mode.label}><p>{mode.confirm}</p><div><button data-testid="start-confirm-yes" className="is-primary" onClick={() => { setConfirming(null); void worldAudio.unlock(); setPaused(false); mode.onSelect(); }}><span><strong>Ja, neu beginnen</strong></span></button><button className="is-secondary" onClick={() => setConfirming(null)}><span><strong>Abbrechen</strong></span></button></div></div>
              : <button key={mode.id} data-mode={mode.id} disabled={waiting} className={mode.primary ? "is-primary" : "is-secondary"} onClick={() => { if (mode.confirm) { setConfirming(mode.id); return; } void worldAudio.unlock(); setPaused(false); mode.onSelect(); }}>{mode.primary && <Play size={17} fill="currentColor" />}<span><strong>{mode.label}</strong><small>{mode.detail}</small></span></button>)}</div>
            : <button disabled={waiting} onClick={() => { void worldAudio.unlock(); setPaused(false); if (!started) onStart(); }}><Play size={17} fill="currentColor" />{started && paused ? "Zurück zum Spiel" : loading !== null ? `Welt lädt … ${Math.round(loading * 100)} %` : "Welt betreten"}</button>}
            {started && paused && menu.length > 0 && <nav className="pause-menu" aria-label="Spielmenü">{menu.map(entry => <button key={entry.label} className={entry.primary ? "is-save" : undefined} data-testid={entry.keepOpen ? "pause-save" : undefined} onClick={() => { void worldAudio.unlock(); if (!entry.keepOpen) setPaused(false); entry.onSelect(); }}>{entry.label}{entry.shortcut && <kbd>{entry.shortcut}</kbd>}</button>)}<button className="pause-sound" aria-pressed={muted} onClick={() => worldAudio.toggleMuted()}>{muted ? <VolumeX size={16} aria-hidden="true"/> : <Volume2 size={16} aria-hidden="true"/>}{muted ? "Ton an" : "Ton aus"}</button></nav>}
            {started && paused && <small className="pause-autosave" data-testid="pause-save-status" role="status">{saveStatus ?? "Dein Fortschritt wird automatisch gespeichert."}</small>}
            {saveNote && (!started || paused) && <small className="save-note">{saveNote}</small>}
          </div>
        </div>
      )}
    </div>
  );
}
