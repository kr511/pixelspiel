"use client";

import { useEffect, useRef, useState } from "react";
import { CharacterArt } from "./WorldArt";

// First school morning: the bus from Radegast to Zörbig, seen from inside. Felice leans against the
// window while autumn trees slide past, and a thought bubble opens. Only generic, non-factual thoughts.
const END = 15000;
const THOUGHTS: { from: number; to: number; text: string }[] = [
  { from: 3000, to: 8300, text: "Noch ein ganz normaler Montag …" },
  { from: 8900, to: 13700, text: "Mal sehen, was dieser Herbst bringt." },
];
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => { const t = clamp01(value); return t * t * (3 - 2 * t); };
const span = (elapsed: number, from: number, to: number) => ease((elapsed - from) / (to - from));

/** One seamless 480-unit tile of autumn trees; the strip is two tiles wide and scrolls by half its width. */
function Strip({ className, trees, ground, poles = false }: { className: string; trees: { x: number; y: number; r: number; fill: string }[]; ground: string; poles?: boolean }) {
  const tile = (dx: number) => <g key={dx} transform={`translate(${dx} 0)`}>
    <rect y="214" width="480" height="56" fill={ground}/>
    {trees.map((tree, i) => <g key={i}><rect x={tree.x - 5} y={tree.y} width="10" height={214 - tree.y} fill="#4a3322"/><circle cx={tree.x} cy={tree.y} r={tree.r} fill={tree.fill}/><circle cx={tree.x - tree.r * .3} cy={tree.y - tree.r * .3} r={tree.r * .45} fill="#ffffff22"/></g>)}
    {poles && [90, 330].map(x => <g key={x}><rect x={x} y="60" width="5" height="160" fill="#3a2f26"/><rect x={x - 14} y="70" width="33" height="4" fill="#3a2f26"/></g>)}
  </g>;
  return <svg className={className} viewBox="0 0 960 270" preserveAspectRatio="none" aria-hidden="true">{tile(0)}{tile(480)}</svg>;
}

export function BusRide({ paused, onDone }: { paused: boolean; onDone: () => void }) {
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

  const fade = span(elapsed, 0, 1200) * (1 - span(elapsed, END - 1300, END));
  const running = paused ? "paused" : "running";
  return <div className="bus-ride" role="dialog" aria-modal="true" aria-label="Busfahrt nach Zörbig: Felice lehnt am Fenster und denkt nach" data-testid="bus-ride" data-elapsed={Math.round(elapsed)} style={{ opacity: fade }}>
    <div className="bus-window">
      <div className="bus-sky"/>
      <div className="bus-layer bus-far" style={{ animationPlayState: running }}><Strip className="bus-strip" ground="#6b573a" trees={[{ x: 60, y: 168, r: 24, fill: "#b8672a" }, { x: 170, y: 158, r: 28, fill: "#d68a35" }, { x: 300, y: 166, r: 22, fill: "#a24a22" }, { x: 415, y: 158, r: 26, fill: "#e0a040" }]}/></div>
      <div className="bus-layer bus-near" style={{ animationPlayState: running }}><Strip className="bus-strip" ground="#3d3226" poles trees={[{ x: 120, y: 130, r: 56, fill: "#c4571f" }, { x: 250, y: 150, r: 46, fill: "#dc9234" }, { x: 400, y: 124, r: 60, fill: "#a8441c" }]}/></div>
      <div className="bus-glass"/>
      <i className="bus-rain" style={{ animationPlayState: running }}/>
    </div>
    <div className="bus-pole" aria-hidden="true"/>
    <div className="bus-seat" aria-hidden="true"/>
    <div className="bus-felice" style={{ animationPlayState: running }}><CharacterArt id="felice" portrait/></div>
    {THOUGHTS.map(thought => { const opacity = span(elapsed, thought.from, thought.from + 700) * (1 - span(elapsed, thought.to - 700, thought.to)); return opacity > 0 ? <p key={thought.from} className="bus-thought" style={{ opacity, transform: `translateY(${(1 - opacity) * 8}px)` }}><small>Felice denkt</small>{thought.text}</p> : null; })}
    <p className="bus-caption">Radegast → Zörbig · Montag, 10. November</p>
    <button className="intro-skip bus-skip" onClick={finish}>Überspringen <kbd>Enter</kbd></button>
  </div>;
}
