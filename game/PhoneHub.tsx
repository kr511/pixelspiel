"use client";

import { useEffect, useRef, useState } from "react";
import { ChatHistory } from "./ChatHistory";
import { PixelPortrait } from "./PixelPortrait";
import { assetUrl } from "./assets";
import { STORY_CHAPTERS, STORY_EVENTS, STORY_END, STORY_START, chatTopicForEvent, eventStatus, historicalDate, nextEvent, nextStepInfo, type StoryEvent, type TimelineSave } from "./timeline";
import "./phone-album.css";

export type PhoneTab = "Nachrichten" | "WhatsApp" | "Verlauf" | "Kalender" | "Erinnerungen";
const TABS: PhoneTab[] = ["Nachrichten", "WhatsApp", "Verlauf", "Kalender", "Erinnerungen"];
export function resolveStoryIllustration(illustration: string): string {
  const scenes: Record<string, string> = {
    // Only reference files that exist; the pixel variants for winter playground,
    // market and pasture have not been delivered yet.
    playground: "/rooms/story-playground-winter-v09.svg",
    christmasmarket: "/rooms/story-christmasmarket-v09.svg",
    eliasroom: "/rooms/story-eliasroom-pixel-v10.webp",
    pasture: "/rooms/story-treffpunkt-v11.webp",
  };
  return assetUrl(scenes[illustration] ?? illustration);
}

export function eventDateText(event: StoryEvent) {
  if (!event.date) return event.period ? `${event.period} · Genaues Datum offen` : historicalDate(null);
  if (event.source === "staged") return event.period ?? historicalDate(event.date);
  return `${historicalDate(event.date)}${event.until && event.until !== event.date ? ` – ${historicalDate(event.until)}` : ""}`;
}
export function PhoneTabs({ tab, onChange }: { tab: PhoneTab; onChange: (tab: PhoneTab) => void }) {
  return <nav className="phone-tabs" role="tablist" aria-label="Handyfunktionen">{TABS.map((name, index) => <button key={name} role="tab" aria-selected={tab === name} aria-controls={`phone-tab-${index}`} id={`phone-tab-button-${index}`} tabIndex={tab === name ? 0 : -1} onClick={() => onChange(name)} onKeyDown={e => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault(); const target = e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : (index + (e.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length;
    onChange(TABS[target]); (e.currentTarget.parentElement?.children[target] as HTMLElement)?.focus();
  }}>{["✉", "💬", "☷", "▦", "♡"][index]} <span>{name}</span></button>)}</nav>;
}
export function PhonePages({ tab, timeline, blocked = false, onSelectMemory, onOpenAlbum, onJump, activeId, chatDate = null }: {
  tab: PhoneTab; timeline: TimelineSave; blocked?: boolean; onSelectMemory?: (id: string) => void; onOpenAlbum?: () => void; onJump?: () => void; activeId?: string; chatDate?: string | null;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const next = nextEvent(timeline);
  const dated = STORY_EVENTS.filter(event => event.confirmed && event.date);
  const chats = dated.filter(event => ["chat", "love", "confession", "message"].includes(event.scene) && timeline.progress[event.id]);
  const selected = chats.find(event => event.id === selectedId);
  const progress = selected ? timeline.progress[selected.id] : undefined;
  const messages = selected && progress ? selected.scene === "chat" ? [
    ...progress.topics.flatMap(id => chatTopicForEvent(id, selected)?.lines ?? []),
    ...(progress.topic ? chatTopicForEvent(progress.topic, selected)?.lines.slice(0, progress.line) ?? [] : []),
  ] : selected.dialogue.slice(0, progress.cursor) : [];
  const notifications = dated.filter(event => eventStatus(timeline, event) === "verfügbar");
  const complete = dated.filter(event => timeline.progress[event.id]?.completedAt).length;
  const canSelect = (event: StoryEvent) => !blocked && Boolean(onSelectMemory) && (!activeId || activeId === event.id) && eventStatus(timeline, event) !== "gesperrt";
  const select = (event: StoryEvent) => { if (canSelect(event)) onSelectMemory?.(event.id); };
  return <section className={`phone-page phone-page-${tab.toLowerCase()}`} role="tabpanel" id={`phone-tab-${TABS.indexOf(tab)}`} aria-labelledby={`phone-tab-button-${TABS.indexOf(tab)}`}>
    {tab === "Nachrichten" && <>
      <div className="phone-page-heading"><small>FELICES HANDY</small><h3>Ein neuer Moment wartet</h3><p>Nachrichten, gemeinsame Abende und Erinnerungen aus eurer Geschichte.</p></div>
      {notifications.length > 0 ? notifications.map(event => <button className="phone-event-row incoming-notification" key={event.id} disabled={!canSelect(event)} onClick={() => select(event)}><span aria-hidden="true">{event.symbol ?? "✉"}</span><div><small>{eventDateText(event)}</small><strong>{event.title}</strong><p>{event.id === activeId ? "Geöffnete Szene fortsetzen" : "Zum gemeinsamen Moment"}</p></div><b aria-hidden="true">→</b></button>) : <div className="phone-empty"><span aria-hidden="true">☾</span><p>{next ? "Für heute sind keine neuen Nachrichten offen. Im Kalender kannst du zum nächsten wichtigen Tag weiterblättern." : "Alle vorgesehenen Momente sind bewahrt. Dein Chatverlauf und das Album bleiben hier."}</p>{next && onJump && <button disabled={blocked || Boolean(activeId)} onClick={onJump}>Zum nächsten Storytag →</button>}</div>}
      {activeId && <p className="phone-small-note">Die laufende Szene bleibt erhalten. Weitere Ereignisse kannst du nach ihrem Abschluss öffnen.</p>}
    </>}
    {tab === "WhatsApp" && <ChatHistory currentDate={timeline.clock.date} currentMinute={timeline.clock.minute} initialDate={chatDate}/>}
    {tab === "Verlauf" && <>
      <div className="phone-page-heading"><small>GESPEICHERTE NACHRICHTEN</small><h3>Unsere Abende</h3><p>Die Abende zeigen echte Nachrichten aus eurem Chat, wortgetreu und mit Uhrzeit. Nur ältere Spielstände enthalten noch rekonstruierte Zeilen.</p></div>
      {selected && <div className="phone-history-detail"><button className="phone-back" onClick={() => setSelectedId(null)}>← Alle Gespräche</button><h4>{selected.title}</h4><time>{eventDateText(selected)}</time>{messages.length ? messages.map((line, index) => <div className={`chat-message from-${line.speaker.toLowerCase()}`} key={`${selected.id}-${index}`}><small>{line.speaker}{line.original ? ` · ORIGINAL${line.time ? ` · ${line.time}` : ""}` : line.speaker === "Erzählung" ? "" : " · REKONSTRUKTION"}</small><p>{line.text}</p>{selected.scene !== "chat" && progress?.answers?.[String(index)] && <small className="chat-answer-choice">Deine Entscheidung: {progress.answers[String(index)]}</small>}</div>) : <p>Dieses Gespräch wurde geöffnet. Die erste Nachricht ist noch unterwegs.</p>}<button className="memory-primary" disabled={!canSelect(selected)} onClick={() => select(selected)}>{timeline.progress[selected.id]?.completedAt ? "Diesen Abend erneut erleben" : "Gespräch fortsetzen"} →</button></div>}
      {!selected && <div className="phone-list">{chats.map(event => <button className="phone-event-row" key={event.id} onClick={() => setSelectedId(event.id)}><span aria-hidden="true">{event.symbol ?? "✉"}</span><div><small>{eventDateText(event)}</small><strong>{event.title}</strong><p>{timeline.progress[event.id]?.completedAt ? "Gespeicherter Abend" : "Bisherige Nachrichten"}</p></div><b aria-hidden="true">→</b></button>)}{chats.length === 0 && <p className="phone-empty">Hier erscheinen die Gespräche, sobald du sie erlebt hast.</p>}</div>}
    </>}
    {tab === "Kalender" && <>
      <div className="phone-page-heading"><small>AKTUELLE SPIELZEIT</small><h3>{historicalDate(timeline.clock.date)}</h3><p>{String(Math.floor(timeline.clock.minute / 60)).padStart(2,"0")}:{String(timeline.clock.minute % 60).padStart(2,"0")} Uhr · {timeline.clock.season}</p><small>{historicalDate(STORY_START)} — {historicalDate(STORY_END)}</small></div>
      <progress value={complete} max={dated.length} aria-label="Erinnerungsfortschritt"/><p className="phone-small-note">{complete} von {dated.length} Erinnerungen · Historische Szenen haben ihre eigene Zeit. Wiederholungen verändern die aktuelle Spielzeit nicht.</p>
      {next && <div className="phone-next-date"><small>ALS NÄCHSTES</small><h4>{next.title}</h4><p>{eventDateText(next)}</p><p className="phone-small-note" data-testid="phone-next-step">{nextStepInfo(timeline).detail}</p><button disabled={blocked || Boolean(activeId) || (eventStatus(timeline, next) === "verfügbar" ? !onSelectMemory : !onJump)} onClick={eventStatus(timeline, next) === "verfügbar" ? () => select(next) : onJump}>{eventStatus(timeline, next) === "verfügbar" ? "Erinnerung erleben" : "Zeit erzählerisch weiterblättern"} →</button></div>}
      <ol className="phone-chapter-calendar">{STORY_CHAPTERS.map(chapter => <li key={chapter.number}><span>{chapter.number}</span><div><strong>{chapter.title}</strong><small>{chapter.period}</small></div></li>)}</ol>
    </>}
    {tab === "Erinnerungen" && <>
      <div className="phone-page-heading"><small>DEIN ERINNERUNGSALBUM</small><h3>Unsere Geschichte</h3><p>{complete} {complete === 1 ? "gemeinsamer Moment" : "gemeinsame Momente"} bewahrt.</p></div>
      {onOpenAlbum && <button className="memory-primary phone-open-album" disabled={blocked} onClick={onOpenAlbum}>Das ganze Album öffnen ♡</button>}
      <div className="phone-memory-grid">{dated.map(event => {
        const status = eventStatus(timeline, event);
        const illustration = resolveStoryIllustration(event.illustration);
        return <button className={`phone-memory-card${status === "gesperrt" ? " locked-silhouette" : ""}`} key={event.id} disabled={!canSelect(event)} onClick={() => select(event)}><span className={`phone-memory-image${event.scene === "chat" ? " chat-night" : ""}`} style={status === "gesperrt" || event.scene === "chat" ? undefined : { backgroundImage: `url(${illustration})` }}><i aria-hidden="true">{status === "gesperrt" ? "◇" : event.symbol ?? "♡"}</i></span><small>{eventDateText(event)}</small><strong>{event.title}</strong><span>{status === "abgeschlossen" ? "✓ Erneut erleben" : status === "verfügbar" ? "Erleben →" : "Noch gesperrt"}</span></button>;
      })}</div>
    </>}
  </section>;
}

export function PhoneHub({ timeline, onClose, onSelectMemory, onJump, onOpenAlbum, blocked = false, activeId, paused, onPause, chatDate = null }: {
  timeline: TimelineSave; onClose: () => void; onSelectMemory: (id: string) => void; onJump: () => void; onOpenAlbum?: () => void; blocked?: boolean; activeId?: string; paused?: boolean; onPause?: () => void;
  /** Opens straight on this day of the WhatsApp tab (from a live message). */
  chatDate?: string | null;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<PhoneTab>(chatDate ? "WhatsApp" : "Nachrichten");
  useEffect(() => { const node = ref.current; if (node && !node.open) node.showModal(); return () => node?.close(); }, []);
  return <dialog ref={ref} className="story-modal story-phone phone-v09 phone-hub" aria-label="Felices Handy" onCancel={e => { e.preventDefault(); onClose(); }} onKeyDown={e => { if (e.key === "Escape") e.stopPropagation(); }}>
    <header className="phone-header"><span className="phone-portrait active-speaker-portrait"><PixelPortrait id="felice" emotion="happy"/></span><div><small>FELICE × ELIAS</small><h2>Mein Handy</h2><time>{historicalDate(timeline.clock.date)}</time></div>{onPause && <button className="phone-pause" aria-label={paused ? "Handy fortsetzen" : "Handy pausieren"} onClick={onPause}>{paused ? "▶" : "Ⅱ"}</button>}<button className="modal-close" aria-label="Handy schließen" onClick={onClose}>×</button></header>
    <PhoneTabs tab={tab} onChange={setTab}/><PhonePages tab={tab} timeline={timeline} blocked={blocked} onSelectMemory={onSelectMemory} onJump={onJump} onOpenAlbum={onOpenAlbum} activeId={activeId} chatDate={chatDate}/>
  </dialog>;
}
