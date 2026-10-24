"use client";

import { type PointerEvent, useRef } from "react";
import { Play } from "lucide-react";
import { useInput } from "./input";
import { worldAudio } from "./audio";
import { StartBackdrop } from "./StartBackdrop";
import { GAME_VERSION } from "./version";

export type StartProgress = { chapter: number; chapterTitle: string; completed: number; resume: string | null; done?: boolean };
export function GameUI({ started, loading = null, onStart, roomActive = true, transitioning = false, progress }: { started: boolean; loading?: number | null; onStart: () => void; roomActive?: boolean; transitioning?: boolean; progress?: StartProgress }) {
  const paused = useInput((state) => state.paused);
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
      {!started && (
        <div className="start-screen with-backdrop" data-game-control>
          <StartBackdrop/>
          <div className="start-card">
            <p className="start-kicker">Ein Jahr · acht Kapitel · Version {GAME_VERSION}</p>
            <h1>Felice <span>×</span> Elias</h1>
            <p className="start-subtitle">Unser erstes gemeinsames Jahr</p>
            {progress && progress.completed > 0 && <div className="start-progress"><div><span>Kapitel {progress.chapter} von 8 · {progress.chapterTitle}</span><span>{progress.completed} {progress.completed === 1 ? "Erinnerung" : "Erinnerungen"} bewahrt</span></div><ol aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <li key={index} className={progress.done || index + 1 < progress.chapter ? "is-done" : index + 1 === progress.chapter ? "is-current" : undefined}/>)}</ol></div>}
            {!progress?.completed && <span className="start-teaser">Lange Abende am Handy. Ein Fahrrad, ein Stück Schokolade. Zwei Nachrichten, die bleiben.</span>}
            <button className="start-enter" aria-label={loading !== null ? undefined : "Welt betreten"} aria-describedby={progress?.resume ? "start-resume" : undefined} disabled={loading !== null} onClick={() => { void worldAudio.unlock(); setPaused(false); onStart(); }}><span><b>{loading !== null ? `Welt lädt … ${Math.round(loading * 100)} %` : "Welt betreten"}</b>{loading === null && progress?.resume && <small id="start-resume">Weiter am {progress.resume}</small>}</span><Play size={18} fill="currentColor" aria-hidden="true"/></button>
            <small className="start-place">Zörbig · Radegast · Herbst 2025 bis Herbst 2026</small>
          </div>
        </div>
      )}
    </div>
  );
}
