"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { RANGE_HEIGHT, RANGE_WIDTH, SHOT_COUNT, TARGET_RADIUS, TARGETS, recordShot, type Aim, type Shot } from "./shooting";
import { worldAudio } from "../audio";
import { assetUrl } from "../assets";

type Props = { blocked: boolean; onComplete: (score: number) => void; onLeave: () => void };
const AIM_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "KeyW", "KeyA", "KeyS", "KeyD"]);
const clamp = (value: number, max: number) => Math.max(0, Math.min(max, value));

export function ShootingMemory({ blocked, onComplete, onLeave }: Props) {
  const [stage, setStage] = useState<"intro" | "playing" | "result">("intro");
  const [shots, setShots] = useState<Shot[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [assetFailed, setAssetFailed] = useState(false);
  const surface = useRef<SVGSVGElement>(null);
  const reticle = useRef<SVGGElement>(null);
  const aim = useRef<Aim>({ x: TARGETS[0].x + 12, y: TARGETS[0].y + 10 });
  const drift = useRef<Aim>({ x: 0, y: 0 });
  const keys = useRef(new Set<string>());
  const shotsRef = useRef<Shot[]>([]);
  const lastShotAt = useRef(-Infinity);
  const activeTarget = Math.min(2, Math.floor(shots.length / 3));
  const score = shots.reduce((sum, shot) => sum + shot.points, 0);
  const finished = shots.length === SHOT_COUNT;

  useEffect(() => {
    if (stage !== "playing" || blocked || finished) return;
    surface.current?.focus();
    let frame = 0;
    let previous = performance.now();
    const animate = (now: number) => {
      const delta = Math.min((now - previous) / 1000, 0.05);
      previous = now;
      const held = keys.current;
      const dx = Number(held.has("ArrowRight") || held.has("KeyD")) - Number(held.has("ArrowLeft") || held.has("KeyA"));
      const dy = Number(held.has("ArrowDown") || held.has("KeyS")) - Number(held.has("ArrowUp") || held.has("KeyW"));
      aim.current = { x: clamp(aim.current.x + dx * delta * 120, RANGE_WIDTH), y: clamp(aim.current.y + dy * delta * 120, RANGE_HEIGHT) };
      drift.current = { x: Math.sin(now / 690) * 4, y: Math.cos(now / 870) * 3 };
      reticle.current?.setAttribute("transform", `translate(${aim.current.x + drift.current.x} ${aim.current.y + drift.current.y})`);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    const clear = () => keys.current.clear();
    window.addEventListener("blur", clear);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("blur", clear); clear(); };
  }, [stage, blocked, finished]);

  useEffect(() => {
    if (!finished || blocked) return;
    const timer = window.setTimeout(() => { setStage("result"); setShowResult(true); }, 750);
    return () => window.clearTimeout(timer);
  }, [finished, blocked]);

  function fire() {
    if (stage !== "playing" || blocked || shotsRef.current.length >= SHOT_COUNT) return;
    const now = performance.now();
    if (now - lastShotAt.current < 450) return;
    lastShotAt.current = now;
    const next = recordShot(shotsRef.current, { x: aim.current.x + drift.current.x, y: aim.current.y + drift.current.y });
    shotsRef.current = next;
    setShots(next);
    worldAudio.play("shot");
  }

  function point(event: PointerEvent<SVGSVGElement>) {
    const matrix = event.currentTarget.getScreenCTM();
    if (!matrix) return;
    const location = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    aim.current = { x: clamp(location.x, RANGE_WIDTH), y: clamp(location.y, RANGE_HEIGHT) };
  }

  function begin() {
    setStage("playing");
    surface.current?.focus();
  }

  return <section className="shooting-memory" aria-label="Erinnerung: Luftgewehrschießen in Gölzau" data-testid="shooting-memory">
    <div className="range-heading"><span>Undatierter Szenenentwurf</span><h1>Gölzau</h1><p>Ein ruhiger Moment. Nur du und die Scheibe.</p></div>
    <div className="range-frame">
      <svg ref={surface} className={`range-surface${stage === "playing" && !finished ? " is-aiming" : ""}`} viewBox={`0 0 ${RANGE_WIDTH} ${RANGE_HEIGHT}`} role="application" aria-label="Schießstand. Mit Maus oder Pfeiltasten zielen, klicken oder Leertaste zum Schießen. Auf dem Handy die aktive Scheibe antippen." tabIndex={stage === "playing" && !blocked ? 0 : -1}
        onPointerMove={(event) => { if (!blocked) point(event); }}
        onPointerDown={(event) => { if (event.button !== 0 || blocked) return; event.currentTarget.focus(); point(event); fire(); }}
        onKeyDown={(event) => {
          if (AIM_KEYS.has(event.code)) {
            event.preventDefault();
            if (blocked || stage !== "playing" || finished) return;
            keys.current.add(event.code);
            if (!event.repeat) {
              const dx = Number(event.code === "ArrowRight" || event.code === "KeyD") - Number(event.code === "ArrowLeft" || event.code === "KeyA");
              const dy = Number(event.code === "ArrowDown" || event.code === "KeyS") - Number(event.code === "ArrowUp" || event.code === "KeyW");
              aim.current = { x: clamp(aim.current.x + dx * 2, RANGE_WIDTH), y: clamp(aim.current.y + dy * 2, RANGE_HEIGHT) };
            }
          }
          if (event.code === "Space") { event.preventDefault(); if (!event.repeat) fire(); }
        }}
        onKeyUp={(event) => keys.current.delete(event.code)} onBlur={() => keys.current.clear()}>
        <rect width="900" height="600" fill="#c4c8ad" />
        <image href={assetUrl("/rooms/goelzau-range-v1.png")} width="900" height="600" onError={() => setAssetFailed(true)} />
        {assetFailed && <g><path d="M0 345H900V600H0Z" fill="#8d9c81" /><path d="M0 220H900" stroke="#aa8756" strokeWidth="18" /></g>}
        <rect width="900" height="600" fill="#262b2e" opacity=".13" />
        {TARGETS.map((target, index) => <g key={target.id} data-testid={`target-${target.id}`}>
          <rect x={target.x - 58} y={target.y - 60} width="116" height="124" fill="#453e35" />
          <rect x={target.x - 55} y={target.y - 57} width="110" height="116" fill="#eee2bd" />
          <text x={target.x} y={target.y - 70} textAnchor="middle" fill="#fff6d9" stroke="#403c33" strokeWidth=".6" fontSize="17" fontFamily="monospace">{target.lane}</text>
          {Array.from({ length: 10 }, (_, ring) => <circle key={ring} cx={target.x} cy={target.y} r={TARGET_RADIUS * (10 - ring) / 10} fill={ring >= 4 ? "#313333" : "#f2e6c5"} stroke={ring >= 4 ? "#acaf9a" : "#6c6959"} strokeWidth=".7" />)}
          {stage === "playing" && !finished && activeTarget === index && <g className="active-target-frame" stroke="#ffe1a0" strokeWidth="3" fill="none"><path d={`M${target.x - 63} ${target.y - 43}v-22h22 M${target.x + 41} ${target.y - 65}h22v22 M${target.x - 63} ${target.y + 43}v22h22 M${target.x + 41} ${target.y + 65}h22v-22`} /></g>}
        </g>)}
        {shots.map((shot, index) => <g key={index}>
          <circle cx={shot.x} cy={shot.y} r="2.7" fill="#191d1f" stroke="#ead49f" strokeWidth="1" />
          {index === shots.length - 1 && <g className="shot-burst"><circle cx={shot.x} cy={shot.y} r="12" fill="none" stroke="#fff4ce" strokeWidth="2" /><path d={`M${shot.x - 18} ${shot.y}h9 M${shot.x + 9} ${shot.y}h9 M${shot.x} ${shot.y - 18}v9 M${shot.x} ${shot.y + 9}v9`} stroke="#fff4ce" /></g>}
        </g>)}
        {/* Einfaches Pixel-Symbol eines Sport-Luftgewehrs: Schaft, langer Lauf, Druckluftkartusche. */}
        <g className="range-air-rifle" aria-label="Sport-Luftgewehr" shapeRendering="crispEdges" transform="translate(555 530)">
          <path d="M0 12h52v-9h32v8h47v17H71l-9 26H45l5-26H9v15H0Z" fill="#76533c" stroke="#322f2c" strokeWidth="4" />
          <path d="M73 4h127v7H73Z" fill="#3d4448" /><path d="M104 13h83v11h-83Z" fill="#99a6a4" stroke="#3e4849" strokeWidth="3" />
          <path d="M69-3h12v8H69ZM192-4h5v9h-5Z" fill="#222a2c" />
          <path d="M54 26h19v17H60" fill="none" stroke="#252d2e" strokeWidth="3" />
          <path d="M9 18h32v5H9Z" fill="#ac7c50" />
        </g>
        {stage === "playing" && !finished && <g ref={reticle} pointerEvents="none" className="range-reticle" transform={`translate(${TARGETS[0].x + 12} ${TARGETS[0].y + 10})`}>
          <circle r="14" fill="none" stroke="#102a2b" strokeWidth="4" /><circle r="14" fill="none" stroke="#faffee" strokeWidth="1.5" />
          <path d="M-22 0h15M7 0h15M0-22v15M0 7v15" stroke="#faffee" strokeWidth="2" /><circle r="1.7" fill="#e9b964" />
        </g>}
      </svg>
      {stage === "intro" && <div className="memory-story"><div className="memory-card">
        <span className="memory-eyebrow">Schießen in Gölzau · Luftgewehr</span>
        <h2>Ankommen. Durchatmen.</h2>
        <p>Das Licht der Halle. Vor dir die Scheiben. Ein Augenblick, in dem alles andere leise wird.</p>
        <p className="memory-input-hint">Fiktionalisierte Inszenierung · Historisches Datum und genauer Ablauf sind noch offen.</p>
        <p className="memory-instructions">Drei Scheiben, je drei Schüsse. Ziele auf die leuchtend markierte Bahn. Je näher an der Mitte, desto mehr Punkte – bis zu 10 pro Schuss.</p>
        <p className="memory-input-hint">Maus & Klick · Pfeiltasten & Leertaste · Antippen</p>
        <button className="memory-primary" onClick={begin} disabled={blocked}>In Ruhe anfangen</button>
        <button className="memory-text-button" onClick={onLeave} disabled={blocked}>Zurück in die Welt</button>
      </div></div>}
      {showResult && <div className="memory-story"><div className="memory-card memory-result" role="status">
        <span className="memory-eyebrow">Ein Moment für dich</span><h2>Das bleibt.</h2>
        <div className="memory-score">{score}<small> / 90 Punkte</small></div>
        <div className="target-results">{TARGETS.map((target, index) => <span key={target.id}>Bahn {target.lane}<strong>{shots.slice(index * 3, index * 3 + 3).reduce((sum, shot) => sum + shot.points, 0)} / 30</strong></span>)}</div>
        <p>{score >= 60 ? "Ein gutes Gefühl, wenn Ruhe und Konzentration zusammenfinden." : "Nicht jede Mitte muss getroffen sein. Dieser Moment gehört trotzdem dir."}</p>
        <p className="memory-instructions">Eine kleine Medaille erinnert dich im Zimmer an Gölzau.</p>
        <button className="memory-primary" onClick={() => onComplete(score)} disabled={blocked}>Erinnerung mit nach Hause nehmen</button>
      </div></div>}
    </div>
    {stage === "playing" && <div className="range-hud">
      <div><small>Luftgewehr</small><strong>{finished ? "Runde beendet" : `Bahn ${TARGETS[activeTarget].lane} · Schuss ${shots.length % 3 + 1} von 3`}</strong></div>
      <div className="range-ammo" aria-label={`${SHOT_COUNT - shots.length} Schüsse übrig`}>{Array.from({ length: SHOT_COUNT }, (_, index) => <i key={index} className={index < shots.length ? "spent" : ""} />)}</div>
      <div className="range-points" aria-live="polite"><strong>{score} <small>Punkte</small></strong><span>{shots.length ? shots[shots.length - 1].points > 0 ? `+${shots[shots.length - 1].points} · Treffer` : "Daneben · in Ruhe weiter" : "Atme durch. Du hast Zeit."}</span></div>
      <button className="memory-text-button" onClick={onLeave} disabled={blocked}>Verlassen</button>
    </div>}
    <p className="range-footer">{stage === "playing" ? "Maus / Pfeile: zielen · Klick / Leertaste / Tippen: Schuss · Esc: Pause" : "Felices Erinnerungen · Gölzau"}</p>
  </section>;
}
