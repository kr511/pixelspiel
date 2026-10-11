"use client";

import { useEffect, useRef, useState } from "react";
import { assetUrl } from "./assets";

// First school morning: the bus from Radegast to Zörbig as a 10 s landscape video cutscene.
const SRC = "/video/bus-ride.mp4";
const END = 10000;
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => { const t = clamp01(value); return t * t * (3 - 2 * t); };
const span = (elapsed: number, from: number, to: number) => ease((elapsed - from) / (to - from));

export function BusRide({ paused, onDone }: { paused: boolean; onDone: () => void }) {
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

  const fade = span(elapsed, 0, 600) * (1 - span(elapsed, END - 800, END));
  return <div className="bus-ride" role="dialog" aria-modal="true" aria-label="Busfahrt nach Zörbig: Felice sitzt im Bus" data-testid="bus-ride" data-elapsed={Math.round(elapsed)} style={{ opacity: fade }}>
    <video ref={video} className="bus-video" src={assetUrl(SRC)} autoPlay playsInline preload="auto" onTimeUpdate={event => setElapsed(event.currentTarget.currentTime * 1000)} onEnded={finish} onError={finish}/>
    <p className="bus-caption">Radegast → Zörbig · Montag, 10. November</p>
    <button className="intro-skip bus-skip" onClick={finish}>Überspringen <kbd>Enter</kbd></button>
  </div>;
}
