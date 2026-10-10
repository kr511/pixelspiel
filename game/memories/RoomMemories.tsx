"use client";

import { MEMORIES } from "./catalog";
import { useMemories } from "./store";

export function RoomMemories({ nearbyId }: { nearbyId?: string }) {
  const progress = useMemories((state) => state.progress);
  return <>{MEMORIES.filter((memory) => memory.enabled).map((memory) => {
    const completed = Boolean(progress[memory.id]);
    return <div key={memory.id} className={`room-memory-object${completed ? " is-completed" : ""}${nearbyId === memory.id ? " is-nearby" : ""}`} style={{ left: `${memory.object.x * 100}%`, top: `${memory.object.y * 100}%` }} role="img" aria-label={`${memory.object.name}${completed ? ", mit Erinnerungsmedaille" : ""}`}>
      <span className="memory-photo"><span /></span>
      {completed && memory.roomEffect === "shooting-medal" && <span className="memory-medal" data-testid="shooting-medal" aria-hidden="true"><i />✦</span>}
      {!completed && <span className="memory-sparkle" aria-hidden="true">✦</span>}
    </div>;
  })}</>;
}
