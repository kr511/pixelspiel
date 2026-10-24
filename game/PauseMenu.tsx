"use client";

import { useEffect, useRef, type ReactNode } from "react";

export type PauseTab = { id: string; label: string; content: ReactNode };

/** The pause menu: the world rests behind, a side sheet holds the bag, the map, the save file and the options. */
export function PauseMenu({ tabs, tab, onTab, onResume, place, completed }: { tabs: PauseTab[]; tab: string; onTab: (id: string) => void; onResume: () => void; place: string; completed: number }) {
  const resume = useRef<HTMLButtonElement>(null);
  useEffect(() => { resume.current?.focus({ preventScroll: true }); }, []);
  const current = tabs.find(entry => entry.id === tab) ?? tabs[0];
  return <div className="pause-overlay" data-game-control role="dialog" aria-modal="true" aria-label="Pause">
    <div className="pause-title" aria-hidden="true"><strong>Pause</strong><span>Die Zeit im Spiel steht still.</span></div>
    <aside className="pause-sheet">
      <button ref={resume} className="pause-resume" onClick={onResume}>Zurück zum Spiel <kbd aria-hidden="true">Esc</kbd></button>
      <p className="pause-place">{place}{completed > 0 && ` · ${completed} ${completed === 1 ? "Erinnerung" : "Erinnerungen"} bewahrt`}</p>
      <div className="pause-tabs" role="tablist" aria-label="Menü">{tabs.map(entry => <button key={entry.id} role="tab" id={`pause-tab-${entry.id}`} aria-selected={entry.id === current.id} aria-controls="pause-panel" onClick={() => onTab(entry.id)}>{entry.label}</button>)}</div>
      <section className="pause-panel" id="pause-panel" role="tabpanel" aria-labelledby={`pause-tab-${current.id}`}>{current.content}</section>
      <small className="pause-autosave">Dein Fortschritt wird automatisch gespeichert.</small>
    </aside>
  </div>;
}
