"use client";

import { useEffect, useRef } from "react";
import { credits } from "./credits";
import { eventDateText } from "./PhoneHub";
import type { TimelineSave } from "./timeline";
import { GAME_VERSION } from "./version";

/** Closing credits after the finale. Only lists memories the player has experienced; nothing is added. */
export function Credits({ save, onClose, onOpenAlbum }: { save: TimelineSave; onClose: () => void; onOpenAlbum: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const data = credits(save);
  useEffect(() => { const node = dialog.current; if (node && !node.open) node.showModal(); return () => { if (node?.open) node.close(); }; }, []);
  return <dialog ref={dialog} className="story-modal credits-modal" data-testid="credits" aria-label="Abspann" onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="credits-roll">
      <header><small>FELICE × ELIAS WORLD · VERSION {GAME_VERSION}</small><h1>Unser Jahr</h1><p>10.11.2025 bis 02.11.2026</p></header>
      <dl className="credits-stats">
        <div><dt>Erinnerungen</dt><dd>{data.completed} von {data.total}</dd></div>
        <div><dt>Tage im Spiel</dt><dd>{data.storyDays}</dd></div>
        <div><dt>Erinnerungsstücke</dt><dd>{data.keepsakes}</dd></div>
      </dl>
      {data.chapters.map(chapter => <section key={chapter.number}><h2><small>Kapitel {chapter.number} · {chapter.period}</small>{chapter.title}</h2><ul>{chapter.memories.map(event => <li key={event.id}><span aria-hidden="true">{event.symbol ?? "♡"}</span>{event.title}<small>{eventDateText(event)}</small></li>)}</ul></section>)}
      <section><h2><small>Mit dabei</small>Felice und Elias</h2>{data.people.length > 0 && <p>{data.people.join(" · ")}</p>}<p>und alle, die dieses Jahr mit uns geteilt haben.</p></section>
      <p className="credits-note">Wo Originalnachrichten fehlen, sind Dialoge rekonstruiert. Inszenierte Szenen sind im Album gekennzeichnet.</p>
      <p className="credits-end">„Also für immer?“ – „Genau so.“ ❤️</p>
    </div>
    <div className="journal-bottom"><button className="memory-secondary" onClick={onOpenAlbum}>Album öffnen</button><button className="memory-primary" onClick={onClose}>Weiterspielen</button></div>
  </dialog>;
}
