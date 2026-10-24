"use client";

import { useEffect, useRef, useState } from "react";
import { credits } from "./credits";
import { eventDateText, resolveStoryIllustration } from "./PhoneHub";
import type { TimelineSave } from "./timeline";
import { GAME_VERSION } from "./version";

/** Closing credits after the finale. Only lists memories the player has experienced; nothing is added.
 *  The roll scrolls slowly by itself; scrolling by hand or pressing the button stops it. */
export function Credits({ save, onClose, onOpenAlbum }: { save: TimelineSave; onClose: () => void; onOpenAlbum: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const roll = useRef<HTMLDivElement>(null);
  const data = credits(save);
  const [rolling, setRolling] = useState(() => typeof window === "undefined" || !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => { const node = dialog.current; if (node && !node.open) node.showModal(); return () => { if (node?.open) node.close(); }; }, []);
  useEffect(() => {
    if (!rolling) return;
    let frame = 0, last = performance.now(), offset = roll.current?.scrollTop ?? 0;
    const step = (now: number) => {
      const node = roll.current;
      if (!node) return;
      offset += (now - last) * .028;
      last = now;
      node.scrollTop = offset;
      if (node.scrollTop + node.clientHeight >= node.scrollHeight - 1) { setRolling(false); return; }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [rolling]);
  const stop = () => setRolling(false);
  return <dialog ref={dialog} className="story-modal credits-modal" data-testid="credits" aria-label="Abspann" onCancel={event => { event.preventDefault(); onClose(); }}>
    <div ref={roll} className="credits-roll" onWheel={stop} onTouchStart={stop} onKeyDown={stop} tabIndex={0}>
      <header><small>Felice × Elias · Version {GAME_VERSION}</small><h1>Unser Jahr</h1><p>10.11.2025 bis 02.11.2026</p></header>
      <dl className="credits-stats">
        <div><dt>Erinnerungen</dt><dd>{data.completed} von {data.total}</dd></div>
        <div><dt>Tage im Spiel</dt><dd>{data.storyDays}</dd></div>
        <div><dt>Erinnerungsstücke</dt><dd>{data.keepsakes}</dd></div>
      </dl>
      {data.chapters.filter(chapter => chapter.memories.length > 0).map(chapter => {
        const picture = chapter.memories.find(event => event.illustration !== "pasture" && event.scene !== "chat") ?? chapter.memories[0];
        return <section key={chapter.number}>
          <div className="credits-picture" aria-hidden="true" style={picture.illustration === "pasture" ? undefined : { backgroundImage: `url(${resolveStoryIllustration(picture.illustration)})` }}/>
          <h2><small>Kapitel {chapter.number} · {chapter.period}</small>{chapter.title}</h2>
          <ul>{chapter.memories.map(event => <li key={event.id}><span aria-hidden="true">{event.symbol ?? "♡"}</span>{event.title}<small>{eventDateText(event)}</small></li>)}</ul>
        </section>;
      })}
      <section><h2><small>Mit dabei</small>Felice und Elias</h2>{data.people.length > 0 && <p>{data.people.join(" · ")}</p>}<p>und alle, die dieses Jahr mit uns geteilt haben.</p></section>
      <p className="credits-note">♥ echte Nachrichten · ✎ nachgestellte Szenen</p>
      <p className="credits-end"><span>„Also für immer?“</span><span>„Genau so.“</span><b aria-hidden="true">♥</b></p>
    </div>
    <div className="journal-bottom"><button className="memory-secondary" onClick={() => setRolling(value => !value)}>{rolling ? "❚❚ Anhalten" : "▶ Weiterrollen"}</button><button className="memory-secondary" onClick={onOpenAlbum}>Erinnerungsbuch</button><button className="memory-primary" onClick={onClose}>Weiterspielen</button></div>
  </dialog>;
}
