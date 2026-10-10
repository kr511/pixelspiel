"use client";

import { useEffect } from "react";
import { MEMORIES } from "./catalog";
import { useMemories } from "./store";

export function MemoryTransition() {
  const phase = useMemories((state) => state.phase);
  const activeId = useMemories((state) => state.activeId);
  const finish = useMemories((state) => state.finishTransition);
  const transitioning = phase === "entering" || phase === "leaving";
  useEffect(() => {
    if (!transitioning) return;
    const timer = window.setTimeout(finish, 1300);
    return () => window.clearTimeout(timer);
  }, [transitioning, phase, finish]);
  if (!transitioning) return null;
  const memory = MEMORIES.find((item) => item.id === activeId);
  return <div className="memory-transition" role="status" aria-live="polite" key={phase}>
    <span className="memory-transition-star" aria-hidden="true">✦</span>
    <p>{phase === "entering" ? memory?.heading : "Zurück in eurer Welt …"}</p>
    <small>{phase === "entering" ? "Ein kleiner Moment, der bleibt." : "Jede Erinnerung macht diesen Ort ein Stück mehr zu deinem."}</small>
  </div>;
}
