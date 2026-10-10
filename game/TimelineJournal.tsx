"use client";

import { useState } from "react";
import { STORY_CHAPTERS, STORY_END, STORY_EVENTS, STORY_START, eventStatus, historicalDate, nextEvent, type StoryEvent, type TimelineSave } from "./timeline";
import { eventDateText, resolveStoryIllustration } from "./PhoneHub";
import { RadegastPasture } from "./StoryWorldArt";
import "./phone-album.css";

export function TimelineJournal({ save, busyId, draftActive, onSelect, onJump, onDraft, onCalendarEnd }: {
  save: TimelineSave; busyId?: string; draftActive: boolean; onSelect: (id: string) => void; onJump: () => void; onDraft: (event: StoryEvent) => void; onCalendarEnd?: () => void;
}) {
  const [openArtifact, setOpenArtifact] = useState<string | null>(null);
  const next = nextEvent(save);
  const dated = STORY_EVENTS.filter(event => event.confirmed && event.date);
  const completed = dated.filter(event => save.progress[event.id]?.completedAt).length;
  const blocked = Boolean(busyId) || draftActive;

  const memoryCard = (event: StoryEvent) => {
    const status = eventStatus(save, event), active = busyId === event.id;
    const locked = status === "gesperrt";
    const finished = status === "abgeschlossen";
    return <article className={`timeline-card status-${status}${event.special ? " special-memory" : ""}${locked ? " locked-silhouette" : ""}`} key={event.id} data-event-id={event.id} data-status={status}>
      <div className="timeline-cover">
        {locked ? <div className="memory-silhouette" aria-hidden="true"><i/><i/></div> : event.illustration === "pasture" ? <RadegastPasture preview/> : <div style={{ backgroundImage: `url(${resolveStoryIllustration(event.illustration)})` }}/>}<span aria-hidden="true">{locked ? "◇" : event.symbol ?? (event.special ? "♥" : event.scene === "encounter" ? "▦" : "☾")}</span><small>{finished ? "✓ Abgeschlossen" : status === "verfügbar" ? "✦ Verfügbar" : "Gesperrt"}</small>
      </div>
      <div className="timeline-card-body">
        <time dateTime={event.date ?? undefined}>{eventDateText(event)}</time><h3>{event.title}</h3><p>{event.description}</p>
        {finished && event.dialogue.some(line => line.original) && <blockquote className="memory-original">{event.dialogue.filter(line => line.original).map((line, index) => <p key={index}><small>{line.speaker} · Bestätigte Nachricht</small>„{line.text}“</p>)}</blockquote>}
        {finished && event.artifacts && <div className="memory-artifacts" aria-label="Erinnerungsstücke">{event.artifacts.map(artifact => <div key={artifact.id} className="memory-artifact"><button aria-expanded={openArtifact === artifact.id} aria-controls={`artifact-${artifact.id}`} onClick={() => setOpenArtifact(openArtifact === artifact.id ? null : artifact.id)}><span aria-hidden="true">{artifact.symbol ?? "◇"}</span>{artifact.title}<b aria-hidden="true">{openArtifact === artifact.id ? "−" : "+"}</b></button>{openArtifact === artifact.id && <div id={`artifact-${artifact.id}`} className="memory-artifact-description" data-testid="memory-artifact-description"><p>{artifact.description}</p>{artifact.id === "elias-letter" && <small>Der Originaltext des Briefes liegt nicht vor. Hier wird kein erfundener Brief gezeigt.</small>}</div>}</div>)}</div>}
        <button className="memory-play-button" disabled={locked || draftActive || Boolean(busyId && !active)} onClick={() => onSelect(event.id)}>{active ? "Weiterspielen" : finished ? "Erneut erleben" : status === "verfügbar" ? "Erinnerung erleben" : "Noch nicht freigeschaltet"}<span aria-hidden="true">{locked ? "◇" : "→"}</span></button>
        {locked && <small>{event.requires.length && !event.requires.every(id => save.progress[id]?.completedAt) ? "Erlebe zuerst die vorherige Geschichte." : "Blättere im Kalender bis zu diesem Moment."}</small>}
      </div>
    </article>;
  };

  return <>
    <section className="story-calendar" aria-label="Story-Kalender">
      <div><small>DER ZEITRAUM EURER GESCHICHTE</small><p>{historicalDate(STORY_START)} <span>—</span> {historicalDate(STORY_END)}</p><strong>{completed} von {dated.length} Erinnerungen bewahrt</strong><progress value={completed} max={dated.length} aria-label="Story-Fortschritt"/><p className="album-clock-note">Aktuelle Spielzeit: {historicalDate(save.clock.date)} · {String(Math.floor(save.clock.minute / 60)).padStart(2, "0")}:{String(save.clock.minute % 60).padStart(2, "0")} Uhr</p></div>
      <div className="calendar-next"><small>{next ? "ALS NÄCHSTES" : "EIN JAHR VOLLER ERINNERUNGEN"}</small><p>{next ? `${eventDateText(next)} · ${next.title}` : "Unsere Geschichte ist noch lange nicht zu Ende. ❤️"}</p>{next ? <button className="memory-primary" disabled={blocked} onClick={eventStatus(save, next) === "verfügbar" ? () => onSelect(next.id) : onJump}>{eventStatus(save, next) === "verfügbar" ? "Nächste Erinnerung erleben" : "Zeit bis dahin weiterblättern"} →</button> : save.clock.date < STORY_END && onCalendarEnd && <button className="memory-primary" disabled={blocked} onClick={onCalendarEnd}>Zum 02.11.2026 weiterblättern →</button>}<p className="album-clock-note">Erneut erlebte Erinnerungen behalten ihr eigenes Datum. Deine aktuelle Spielzeit bleibt dabei erhalten.</p></div>
    </section>
    <nav className="album-chapter-nav" aria-label="Kapitel im Erinnerungsalbum">{STORY_CHAPTERS.map(chapter => <button key={chapter.number} onClick={() => document.getElementById(`memory-chapter-${chapter.number}`)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" })}><span>{chapter.number}</span>{chapter.period}</button>)}</nav>
    {STORY_CHAPTERS.map(chapter => <section className="memory-chapter" id={`memory-chapter-${chapter.number}`} key={chapter.number} aria-labelledby={`memory-chapter-title-${chapter.number}`} data-chapter={chapter.number} data-chapter-number={chapter.number}>
      <div className="story-section-heading"><small>KAPITEL {chapter.number} · {chapter.period}</small><h2 id={`memory-chapter-title-${chapter.number}`}>{chapter.title}</h2><p>{chapter.description}</p></div>
      <div className="timeline-grid">{dated.filter(event => event.chapterNumber === chapter.number).map(memoryCard)}</div>
    </section>)}
    <div className="story-section-heading"><small>WEITERE GESCHICHTEN</small><h2>Platz für das, was noch kommt</h2><p>Historische Daten und Abläufe sind noch offen. Die vorhandenen Szenen bleiben als fiktionalisierte Entwürfe erhalten.</p></div>
    <div className="timeline-grid future-grid">{STORY_EVENTS.filter(event => !event.confirmed).map(event => <article className="timeline-card future-memory" key={event.id} data-event-id={event.id} data-status={eventStatus(save, event)}><div className="timeline-cover"><div style={{ backgroundImage: `url(${resolveStoryIllustration(event.illustration)})` }}/><small>{eventStatus(save, event) === "abgeschlossen" ? "✓ Vorhandener Abschluss bewahrt" : "Angaben offen"}</small></div><div className="timeline-card-body"><time>{eventDateText(event)}</time><h3>{event.title}</h3><p>{event.description}</p><button disabled={blocked} onClick={() => onDraft(event)}>{save.progress[event.id]?.completedAt ? "Szenenentwurf erneut erleben" : "Undatierten Szenenentwurf spielen"} <span>→</span></button></div></article>)}</div>
  </>;
}
