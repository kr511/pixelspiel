"use client";

import { useEffect, useRef, useState } from "react";
import { calendarPages, daysBetween, historicalDate, weekday } from "./timeline";

const NIGHT = 900, PAGE = 420, HOLD = 1300;

/** Sleep transition: night falls, the wall calendar flips to the next relevant day. */
export function CalendarFlip({ from, to, paused, onDone }: { from: string; to: string; paused: boolean; onDone: () => void }) {
  const pages = calendarPages(from, to);
  const duration = NIGHT + pages.length * PAGE + HOLD;
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
      previous = now; setElapsed(elapsedRef.current);
      if (elapsedRef.current >= duration) { finish(); return; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [paused, duration]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (!["Enter", "Space", "KeyE"].includes(event.code) || event.repeat) return;
      event.preventDefault(); event.stopImmediatePropagation();
      // The first press jumps to the final sheet, the second continues.
      if (elapsedRef.current < duration - HOLD) elapsedRef.current = duration - HOLD; else finish();
    };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, [duration]);

  const flipped = Math.max(0, Math.min(pages.length - 1, Math.floor((elapsed - NIGHT) / PAGE)));
  const turning = elapsed > NIGHT && elapsed < NIGHT + (pages.length - 1) * PAGE ? ((elapsed - NIGHT) % PAGE) / PAGE : 0;
  const page = pages[flipped], upcoming = pages[Math.min(pages.length - 1, flipped + 1)];
  const skipped = daysBetween(from, to);
  const label = (date: string | null) => date ? <><small>{weekday(date)}</small><strong>{Number(date.slice(8, 10))}</strong><span>{historicalDate(date).slice(3)}</span></> : <><small>&nbsp;</small><strong>…</strong><span>+{skipped - 3} Tage</span></>;

  return <div className="calendar-flip" role="dialog" aria-modal="true" aria-label={`Schlafen bis ${historicalDate(to)}`} data-testid="calendar-flip" data-to={to} onClick={() => { if (elapsedRef.current < duration - HOLD) elapsedRef.current = duration - HOLD; else finish(); }}>
    <div className="calendar-night" style={{ opacity: Math.min(1, elapsed / NIGHT) }}><span>Gute Nacht, Felice.</span></div>
    <div className="calendar-sheet" style={{ opacity: Math.min(1, Math.max(0, (elapsed - NIGHT * .6) / 300)) }}>
      <div className="calendar-rings" aria-hidden="true"><i/><i/></div>
      <div className="calendar-page under">{label(upcoming)}</div>
      <div className="calendar-page over" style={{ transform: `rotateX(${turning * 180}deg)`, opacity: turning > .5 ? 0 : 1 }}>{label(page)}</div>
    </div>
    <p className="calendar-caption" style={{ opacity: elapsed > duration - HOLD ? 1 : 0 }}>{skipped > 1 ? `${skipped} Tage später · ${historicalDate(to)}` : `Ein neuer Morgen · ${historicalDate(to)}`}</p>
    <small className="calendar-skip">Tippen oder Enter</small>
  </div>;
}
