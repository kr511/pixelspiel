"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { assetUrl } from "./assets";

// Shot timings in milliseconds. Black title → autumn Radegast with drifting
// leaves → push toward Felice's home → her bedroom at dawn → hand-over to play.
const TOWN_IN = 1700, HOUSE_PUSH = 7200, ROOM_IN = 9000, END = 12600;
export const INTRO_DURATION = END;
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => { const t = clamp01(value); return t * t * (3 - 2 * t); };
const span = (elapsed: number, from: number, to: number) => ease((elapsed - from) / (to - from));

export function IntroCinematic({ paused, onDone }: { paused: boolean; onDone: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  const finished = useRef(false);
  const done = useRef(onDone);
  useEffect(() => { done.current = onDone; });
  const finish = () => { if (finished.current) return; finished.current = true; done.current(); };

  useEffect(() => {
    if (paused) return;
    let frame = 0, previous: number | undefined;
    const tick = (now: number) => {
      if (!document.hidden && previous !== undefined) elapsedRef.current += Math.min(100, now - previous);
      previous = now;
      setElapsed(elapsedRef.current);
      if (elapsedRef.current >= END) { finish(); return; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [paused]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (!["Enter", "Space", "Escape"].includes(event.code) || event.repeat) return;
      event.preventDefault(); event.stopImmediatePropagation(); finish();
    };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, []);

  const townOpacity = span(elapsed, TOWN_IN, TOWN_IN + 1300) * (1 - span(elapsed, ROOM_IN - 600, ROOM_IN + 200));
  const pan = span(elapsed, TOWN_IN, HOUSE_PUSH), push = span(elapsed, HOUSE_PUSH, ROOM_IN + 200);
  // The home door on the Radegast painting sits near (38 %, 21 %).
  const townStyle: CSSProperties = { opacity: townOpacity, transformOrigin: "38% 21%", transform: `translate(${(1 - pan) * 3}%, ${(1 - pan) * 4}%) scale(${1.12 + pan * .1 + push * 1.25})` };
  const roomOpacity = span(elapsed, ROOM_IN, ROOM_IN + 1200);
  const roomStyle: CSSProperties = { opacity: roomOpacity, transform: `scale(${1.14 - .14 * span(elapsed, ROOM_IN, END - 600)})` };
  const curtain = span(elapsed, END - 900, END);
  const titleOpacity = span(elapsed, 250, 1000) * (1 - span(elapsed, 5600, 6600));

  return <div className="intro-cinematic" role="dialog" aria-modal="true" aria-label="Intro: Ein Herbstmorgen in Radegast" data-testid="intro-cinematic" data-elapsed={Math.round(elapsed)} style={{ opacity: 1 - curtain }}>
    <div className="intro-layer intro-town" style={townStyle}><img src={assetUrl("/rooms/radegast-walk-v075.png")} alt=""/><div className="intro-autumn-grade"/></div>
    <div className="intro-leaves" style={{ opacity: townOpacity }} aria-hidden="true">{Array.from({ length: 26 }, (_, i) => <i key={i} style={{ left: `${(i * 37 + 9) % 104}%`, animationDelay: `${-((i * .61) % 7)}s`, animationDuration: `${4.5 + i % 5}s`, animationPlayState: paused ? "paused" : "running" }}/>)}</div>
    <div className="intro-layer intro-room" style={roomStyle}><img src={assetUrl("/rooms/felice-bedroom-rest-v065.png")} alt=""/><div className="intro-dawn"/></div>
    <div className="intro-bars" aria-hidden="true"/>
    <p className="intro-title" style={{ opacity: titleOpacity }}><small>Radegast</small>Samstag, 01. November 2025</p>
    <button className="intro-skip" onClick={finish}>Überspringen <kbd>Enter</kbd></button>
  </div>;
}
