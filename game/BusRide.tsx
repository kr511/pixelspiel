"use client";

import { useEffect, useRef, useState } from "react";
import { assetUrl } from "./assets";

// First school morning: the bus from Radegast to Zörbig as a 12 s landscape video cutscene.
const SRC = "/video/bus-ride.mp4";
const END = 12000;
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => { const t = clamp01(value); return t * t * (3 - 2 * t); };
const span = (elapsed: number, from: number, to: number) => ease((elapsed - from) / (to - from));

/** The adventure reuses the ride with its own caption, thought overlays and a shorter (still skippable) duration. */
export function BusRide({ paused, onDone, caption = "Radegast → Zörbig · Montag, 10. November", thoughts = [], duration = END }: { paused: boolean; onDone: () => void; caption?: string; thoughts?: { from: number; to: number; text: string }[]; duration?: number }) {
  const [elapsed, setElapsed] = useState(0);
  const video = useRef<HTMLVideoElement>(null);
  const finished = useRef(false);
  const done = useRef(onDone);
  useEffect(() => { done.current = onDone; });
  const finish = () => { if (finished.current) return; finished.current = true; done.current(); };

  useEffect(() => {
    const el = video.current; if (!el) return;
    if (paused) { el.pause(); return; }
    el.play().catch(() => { el.muted = true; el.play().catch(finish); });
  }, [paused]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (!["Enter", "Space", "Escape"].includes(event.code) || event.repeat) return;
      event.preventDefault(); event.stopImmediatePropagation(); finish();
    };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, []);

  const fade = span(elapsed, 0, 600) * (1 - span(elapsed, duration - 800, duration));
  return <div className="bus-ride" role="dialog" aria-modal="true" aria-label="Busfahrt nach Zörbig: Felice sitzt im Bus" data-testid="bus-ride" data-elapsed={Math.round(elapsed)} style={{ opacity: fade }}>
    <video ref={video} className="bus-video" src={assetUrl(SRC)} autoPlay playsInline preload="auto" onTimeUpdate={event => { const ms = event.currentTarget.currentTime * 1000; setElapsed(ms); if (ms >= duration) finish(); }} onEnded={finish} onError={finish}/>
    {thoughts.map(thought => { const opacity = span(elapsed, thought.from, thought.from + 700) * (1 - span(elapsed, thought.to - 700, thought.to)); return opacity > 0 ? <p key={thought.from} className="bus-thought" style={{ opacity, transform: `translateY(${(1 - opacity) * 8}px)` }}><small>Felice denkt</small>{thought.text}</p> : null; })}
    <p className="bus-caption">{caption}</p>
    <button className="intro-skip bus-skip" onClick={finish}>Überspringen <kbd>Enter</kbd></button>
  </div>;
}
