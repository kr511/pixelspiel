"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { assetUrl } from "./assets";
import { worldAudio } from "./audio";

// Elias looks back a year later, then the film dissolves into the quiet morning of 10.11.2025:
// black "Ein Jahr später" → autumn Zörbig (his memories) → Radegast and a push toward Felice's home →
// her bedroom at dawn → hand-over to play. Only facts the game already knows are narrated.
// Music: drop a file at public/audio/intro.mp3 (optional; the intro plays silently without it).
export const INTRO_MUSIC = "/audio/intro.mp3";
const INTRO_MUSIC_VOLUME = .08; // very quiet background, 0–1
const ZOERBIG_IN = 2000, TOWN_IN = 19600, HOUSE_PUSH = 31000, ROOM_IN = 35600, END = 43500;
export const INTRO_DURATION = END;
/** Narration, fade in at `from`, out at `to`. Speaker is always Elias. */
const LINES: { from: number; to: number; text: string }[] = [
  { from: 3300, to: 7300, text: "Ich denke oft an diesen Herbst zurück." },
  { from: 7700, to: 11700, text: "An lange Abende am Handy." },
  { from: 12100, to: 16300, text: "Die Schokolade, die du abgelehnt hast." },
  { from: 16700, to: 20700, text: "An zwei Nachrichten, die geblieben sind." },
  { from: 21300, to: 25700, text: "Angefangen hat es ganz leise." },
  { from: 26100, to: 30500, text: "Mit einem ganz normalen Morgen in Radegast." },
  { from: 36600, to: 41300, text: "Felice wusste noch nicht, was dieser Herbst werden würde." },
];
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => { const t = clamp01(value); return t * t * (3 - 2 * t); };
const span = (elapsed: number, from: number, to: number) => ease((elapsed - from) / (to - from));
/** 0 → 1 → 0 across a window with soft edges. */
const window_ = (elapsed: number, from: number, to: number, edge = 700) => span(elapsed, from, from + edge) * (1 - span(elapsed, to - edge, to));

export function IntroCinematic({ paused, onDone }: { paused: boolean; onDone: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  const finished = useRef(false);
  const done = useRef(onDone);
  const music = useRef<HTMLAudioElement | null>(null);
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

  // Optional intro music: respects the mute switch, follows pause, fades with the film.
  useEffect(() => {
    let audio: HTMLAudioElement | undefined;
    try {
      audio = new Audio(assetUrl(INTRO_MUSIC));
      audio.preload = "auto"; audio.volume = 0; audio.loop = false;
      audio.addEventListener("error", () => { audio = undefined; music.current = null; });
      music.current = audio;
    } catch { /* No audio support: the intro stays silent. */ }
    return () => { audio?.pause(); music.current = null; };
  }, []);
  useEffect(() => {
    const audio = music.current;
    if (!audio) return;
    if (paused || worldAudio.getMuted()) { audio.pause(); return; }
    audio.play().catch(() => { /* Blocked or missing file: stay silent. */ });
  }, [paused]);
  useEffect(() => {
    const audio = music.current;
    if (!audio) return;
    const level = Math.min(span(elapsed, 0, 3000), 1 - span(elapsed, END - 3500, END));
    try { audio.volume = worldAudio.getMuted() ? 0 : INTRO_MUSIC_VOLUME * level; } catch { /* Ignore volume errors. */ }
  }, [elapsed]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (!["Enter", "Space", "Escape"].includes(event.code) || event.repeat) return;
      event.preventDefault(); event.stopImmediatePropagation(); finish();
    };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, []);

  // Zörbig: slow drift while Elias remembers. Radegast: pan, then the push toward the home door.
  const zoerbigOpacity = span(elapsed, ZOERBIG_IN, ZOERBIG_IN + 1800) * (1 - span(elapsed, TOWN_IN - 400, TOWN_IN + 1400));
  const zoerbigStyle: CSSProperties = { opacity: zoerbigOpacity, transform: `scale(${1.06 + .1 * span(elapsed, ZOERBIG_IN, TOWN_IN + 1400)}) translate(${-2 * span(elapsed, ZOERBIG_IN, TOWN_IN)}%, 0)` };
  const townOpacity = span(elapsed, TOWN_IN, TOWN_IN + 1500) * (1 - span(elapsed, ROOM_IN - 600, ROOM_IN + 200));
  const pan = span(elapsed, TOWN_IN, HOUSE_PUSH), push = span(elapsed, HOUSE_PUSH, ROOM_IN + 200);
  // The home door on the Radegast painting sits near (38 %, 21 %).
  const townStyle: CSSProperties = { opacity: townOpacity, transformOrigin: "38% 21%", transform: `translate(${(1 - pan) * 3}%, ${(1 - pan) * 4}%) scale(${1.12 + pan * .1 + push * 1.25})` };
  const roomOpacity = span(elapsed, ROOM_IN, ROOM_IN + 1200);
  const roomStyle: CSSProperties = { opacity: roomOpacity, transform: `scale(${1.14 - .14 * span(elapsed, ROOM_IN, END - 600)})` };
  const curtain = span(elapsed, END - 1200, END);
  const yearLater = window_(elapsed, 300, 2900, 900);
  const dateTitle = window_(elapsed, 27200, 33200, 1000);

  return <div className="intro-cinematic" role="dialog" aria-modal="true" aria-label="Intro: Ein Jahr später blickt Elias auf einen Herbstmorgen in Radegast zurück" data-testid="intro-cinematic" data-elapsed={Math.round(elapsed)} style={{ opacity: 1 - curtain }}>
    <div className="intro-layer intro-zoerbig" style={zoerbigStyle}><img src={assetUrl("/rooms/zoerbig-market-v09.webp")} alt=""/><div className="intro-autumn-grade"/></div>
    <div className="intro-layer intro-town" style={townStyle}><img src={assetUrl("/rooms/radegast-walk-v075.webp")} alt=""/><div className="intro-autumn-grade"/></div>
    <div className="intro-leaves" style={{ opacity: Math.max(zoerbigOpacity, townOpacity) }} aria-hidden="true">{Array.from({ length: 26 }, (_, i) => <i key={i} style={{ left: `${(i * 37 + 9) % 104}%`, animationDelay: `${-((i * .61) % 7)}s`, animationDuration: `${4.5 + i % 5}s`, animationPlayState: paused ? "paused" : "running" }}/>)}</div>
    <div className="intro-layer intro-room" style={roomStyle}><img src={assetUrl("/rooms/felice-bedroom-v10.webp")} alt=""/><div className="intro-dawn"/></div>
    <div className="intro-bars" aria-hidden="true"/>
    <p className="intro-year" style={{ opacity: yearLater }}>Ein Jahr später</p>
    {LINES.map(line => { const opacity = window_(elapsed, line.from, line.to, 800); return opacity > 0 ? <p key={line.from} className="intro-line" style={{ opacity, transform: `translateY(${(1 - opacity) * 6}px)` }}><small>Elias</small>{line.text}</p> : null; })}
    <p className="intro-title" style={{ opacity: dateTitle }}><small>Radegast</small>Montag, 10. November 2025</p>
    <button className="intro-skip" onClick={finish}>Überspringen <kbd>Enter</kbd></button>
  </div>;
}
