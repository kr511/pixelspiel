"use client";

import { type PointerEvent, useRef, useSyncExternalStore } from "react";
import { Play, Volume2, VolumeX } from "lucide-react";
import { useInput } from "./input";
import { worldAudio } from "./audio";
import { StartBackdrop } from "./StartBackdrop";
import { GAME_VERSION } from "./version";

export type MenuEntry = { label: string; shortcut?: string; onSelect: () => void };
export function GameUI({ started, loading = null, onStart, roomActive = true, transitioning = false, place = "Felices Pixelzimmer", completed = 0, menu = [] }: { started: boolean; loading?: number | null; onStart: () => void; roomActive?: boolean; transitioning?: boolean; place?: string; completed?: number; menu?: MenuEntry[] }) {
  const paused = useInput((state) => state.paused);
  const muted = useSyncExternalStore(worldAudio.subscribe, worldAudio.getMuted, worldAudio.getMuted);
  const setPaused = useInput((state) => state.setPaused);
  const setMove = useInput((state) => state.setMove);
  const stickOrigin = useRef({ x: 0, y: 0 });
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

  function stopStick() { setMove(0, 0); }

  return (
    <div className="game-ui">
      {started && !paused && roomActive && !transitioning && (
        <div data-game-control className="joystick" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); stickOrigin.current = { x: event.clientX, y: event.clientY }; moveStick(event); }} onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) moveStick(event); }} onPointerUp={stopStick} onPointerCancel={stopStick}>
          <div className="joystick-knob" style={{ transform: `translate(${stick.x}px, ${stick.y}px)` }} />
        </div>
      )}
      {(!started || paused) && (
        <div className={`start-screen${started ? "" : " with-backdrop"}`} data-game-control>
          {!started && <StartBackdrop/>}
          <div className="start-card">
            <p>{started ? `${place}${completed > 0 ? ` · ${completed} ${completed === 1 ? "Erinnerung" : "Erinnerungen"} bewahrt` : ""}` : `Eure kleine Welt · Version ${GAME_VERSION}`}</p>
            <h1>{started && paused ? "Kurze Pause?" : "Felice × Elias"}</h1>
            <span>{started && paused ? "Dein Moment wartet auf dich." : "Lange Abende am Handy. Ein Fahrrad, ein Stück Schokolade. Zwei Nachrichten, die bleiben. Erlebe euer gemeinsames Jahr in acht Kapiteln – vom ersten Schreiben bis zu den Erinnerungen, die bleiben."}</span>
            <button disabled={!started && loading !== null} onClick={() => { void worldAudio.unlock(); setPaused(false); if (!started) onStart(); }}><Play size={17} fill="currentColor" />{started && paused ? "Zurück zum Spiel" : loading !== null ? `Welt lädt … ${Math.round(loading * 100)} %` : "Welt betreten"}</button>
            {started && paused && menu.length > 0 && <nav className="pause-menu" aria-label="Spielmenü">{menu.map(entry => <button key={entry.label} onClick={() => { void worldAudio.unlock(); setPaused(false); entry.onSelect(); }}>{entry.label}{entry.shortcut && <kbd>{entry.shortcut}</kbd>}</button>)}<button className="pause-sound" aria-pressed={muted} onClick={() => worldAudio.toggleMuted()}>{muted ? <VolumeX size={16} aria-hidden="true"/> : <Volume2 size={16} aria-hidden="true"/>}{muted ? "Ton an" : "Ton aus"}</button></nav>}
            {started && paused && <small className="pause-autosave">Dein Fortschritt wird automatisch gespeichert.</small>}
          </div>
        </div>
      )}
    </div>
  );
}
