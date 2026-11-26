"use client";

import { useState } from "react";
import { STORY_CHAPTERS, STORY_END, STORY_EVENTS, eventStatus, historicalDate, nextEvent, nextStepInfo, sceneMark, type StoryEvent, type TimelineSave } from "./timeline";
import { eventDateText, resolveStoryIllustration } from "./PhoneHub";
import { RadegastPasture } from "./StoryWorldArt";
import "./phone-album.css";

// The memory book: an open spread with the chapter's timeline on the left and one memory on the right.
// Chapters are bookmarks; memories not yet lived show neither title nor description.
export function TimelineJournal({ save, busyId, draftActive, onSelect, onJump, onDraft, onCalendarEnd, onCredits }: {
  save: TimelineSave; busyId?: string; draftActive: boolean; onSelect: (id: string) => void; onJump: () => void; onDraft: (event: StoryEvent) => void; onCalendarEnd?: () => void; onCredits?: () => void;
}) {
  const [openArtifact, setOpenArtifact] = useState<string | null>(null);
  const next = nextEvent(save);
  const dated = STORY_EVENTS.filter(event => event.confirmed && event.date);
  const completed = dated.filter(event => save.progress[event.id]?.completedAt).length;
  const blocked = Boolean(busyId) || draftActive;
  const lastFinished = [...dated].reverse().find(event => save.progress[event.id]?.completedAt);
  const [chapterNumber, setChapterNumber] = useState<number>(next?.chapterNumber ?? lastFinished?.chapterNumber ?? 1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const chapter = STORY_CHAPTERS.find(item => item.number === chapterNumber) ?? STORY_CHAPTERS[0];
  const chapterEvents = dated.filter(event => event.chapterNumber === chapter.number);
  const fallback = chapterEvents.find(event => event.id === next?.id) ?? [...chapterEvents].reverse().find(event => save.progress[event.id]?.completedAt) ?? chapterEvents[0];
  const selected = chapterEvents.find(event => event.id === selectedId) ?? fallback;
  const chapterDone = chapterEvents.filter(event => save.progress[event.id]?.completedAt).length;
  const openChapter = (number: number) => { setChapterNumber(number); setSelectedId(null); setOpenArtifact(null); };

  const memoryPage = (event: StoryEvent) => {
    const status = eventStatus(save, event), active = busyId === event.id;
    // The next memory keeps its title: "Als Nächstes" names it anyway.
    const locked = status === "gesperrt" && event.id !== next?.id, finished = status === "abgeschlossen";
    const mark = sceneMark(event);
    const answers = Object.entries(save.progress[event.id]?.answers ?? {}).sort(([a], [b]) => Number(a) - Number(b)).map(([, answer]) => answer.replace(/^„|“$/g, ""));
    return <article className={`book-memory timeline-card status-${status}${event.special ? " special-memory" : ""}`} key={event.id} data-event-id={event.id} data-status={status}>
      <div className="book-photo">
        <div className="book-photo-frame">{locked ? <div className="memory-silhouette" aria-hidden="true"><i/><i/></div> : event.illustration === "pasture" ? <RadegastPasture preview/> : <div className="book-photo-image" style={{ backgroundImage: `url(${resolveStoryIllustration(event.illustration)})` }}/>}</div>
        <span className="book-photo-tape" aria-hidden="true"/>
      </div>
      <time dateTime={event.date ?? undefined}>{eventDateText(event)}</time>
      {locked ? <>
        <h3>Noch nicht erlebt</h3>
        <p>{event.requires.length && !event.requires.every(id => save.progress[id]?.completedAt) ? "Erlebe zuerst die Erinnerungen davor." : "Dieser Tag kommt noch. Spiel weiter oder blättere im Kalender bis hierhin."}</p>
      </> : <>
        <h3>{event.title}</h3>
        <span className="book-mark" data-mark={mark.symbol}>{mark.symbol} {mark.label}</span>
        <p>{event.description}</p>
        {finished && event.scene === "sequence" && answers.length > 0 && <p className="memory-answers" data-testid="memory-answers"><small>Deine Entscheidungen</small>{answers.join(" · ")}</p>}
        {finished && event.chat && <blockquote className="memory-original" data-testid="memory-chat"><small className="memory-original-heading">Aus eurem Chat · {historicalDate(event.chat.date)}</small>{event.chat.lines.map((line, index) => <p key={index}><small>{line.speaker} · {line.time}</small>„{line.text}“</p>)}</blockquote>}
        {finished && event.artifacts && <div className="memory-artifacts" aria-label="Erinnerungsstücke">{event.artifacts.map(artifact => <div key={artifact.id} className="memory-artifact"><button aria-expanded={openArtifact === artifact.id} aria-controls={`artifact-${artifact.id}`} onClick={() => setOpenArtifact(openArtifact === artifact.id ? null : artifact.id)}><span aria-hidden="true">{artifact.symbol ?? "◇"}</span>{artifact.title}<b aria-hidden="true">{openArtifact === artifact.id ? "−" : "+"}</b></button>{openArtifact === artifact.id && <div id={`artifact-${artifact.id}`} className="memory-artifact-description" data-testid="memory-artifact-description"><p>{artifact.description}</p>{artifact.id === "elias-letter" && <small>Was im Brief steht, bleibt zwischen den beiden.</small>}</div>}</div>)}</div>}
      </>}
      <button className="memory-play-button" disabled={status === "gesperrt" || draftActive || Boolean(busyId && !active)} onClick={() => onSelect(event.id)}>{active ? "Weiterspielen" : finished ? "▶ Noch einmal erleben" : status === "verfügbar" ? "▶ Erinnerung erleben" : "Noch gesperrt"}</button>
    </article>;
  };

  return <>
    <div className="book-toolbar">
      <div className="book-progress"><strong>{completed} von {dated.length} Erinnerungen bewahrt</strong><progress value={completed} max={dated.length} aria-label="Fortschritt"/><small className="book-legend">♥ echte Nachrichten · ✎ nachgestellte Szene · ☆ Ausblick</small></div>
      <div className="calendar-next"><small>{next ? "ALS NÄCHSTES" : "EIN JAHR VOLLER ERINNERUNGEN"}</small><p>{next ? `${eventDateText(next)} · ${next.title}` : "„Also für immer?“ – „Genau so.“"}</p>{next && <p className="calendar-next-detail" data-testid="journal-next-step">{nextStepInfo(save).detail}</p>}
        {next ? <button className="memory-primary" disabled={blocked} onClick={eventStatus(save, next) === "verfügbar" ? () => onSelect(next.id) : onJump}>{eventStatus(save, next) === "verfügbar" ? "Nächste Erinnerung erleben" : "Bis dahin weiterblättern"} →</button>
          : save.clock.date < STORY_END && onCalendarEnd ? <button className="memory-primary" disabled={blocked} onClick={onCalendarEnd}>Zum {historicalDate(STORY_END)} weiterblättern →</button>
          : onCredits && save.progress["our-story-finale"]?.completedAt && <button className="memory-primary" data-testid="open-credits" onClick={onCredits}>Abspann ansehen →</button>}
      </div>
    </div>
    <div className="memory-book">
      <section className="book-page book-left memory-chapter" aria-labelledby="book-chapter-title" data-chapter={chapter.number} data-chapter-number={chapter.number}>
        <header><small>KAPITEL {chapter.number} · {chapter.period}</small><h2 id="book-chapter-title">{chapter.title}</h2></header>
        <ol className="book-timeline">{chapterEvents.map(event => {
          const status = eventStatus(save, event), locked = status === "gesperrt" && event.id !== next?.id;
          return <li key={event.id}><button className={`book-row status-${status}${event.id === selected?.id ? " is-selected" : ""}`} aria-current={event.id === selected?.id ? "true" : undefined} data-event-id={event.id} onClick={() => { setSelectedId(event.id); setOpenArtifact(null); }}>
            <time>{event.date ? historicalDate(event.date).slice(0, 6) : "·"}</time><span aria-hidden="true">{locked ? "◇" : event.symbol ?? "♡"}</span><b>{locked ? "Noch nicht erlebt" : event.title}</b><small aria-label={status}>{status === "abgeschlossen" ? "✓" : status === "verfügbar" ? "●" : ""}</small>
          </button></li>;
        })}</ol>
        <footer><span>{chapterDone} von {chapterEvents.length} bewahrt</span><span>S. {chapter.number}</span></footer>
      </section>
      <section className="book-page book-right" aria-label="Ausgewählte Erinnerung">{selected && memoryPage(selected)}</section>
      <nav className="book-bookmarks" aria-label="Kapitel">{STORY_CHAPTERS.map(item => {
        const events = dated.filter(event => event.chapterNumber === item.number);
        const reached = events.some(event => eventStatus(save, event) !== "gesperrt");
        return <button key={item.number} className={`book-bookmark bookmark-${item.number}${item.number === chapter.number ? " is-open" : ""}${reached ? "" : " is-locked"}`} aria-label={`Kapitel ${item.number}: ${reached ? item.title : "noch nicht erreicht"}`} aria-current={item.number === chapter.number ? "true" : undefined} onClick={() => openChapter(item.number)}>{item.number}</button>;
      })}</nav>
    </div>
    {STORY_EVENTS.some(event => !event.confirmed) && <details className="book-drafts">
      <summary>Weitere Geschichten ohne festes Datum</summary>
      <div className="timeline-grid future-grid">{STORY_EVENTS.filter(event => !event.confirmed).map(event => <article className="timeline-card future-memory" key={event.id} data-event-id={event.id} data-status={eventStatus(save, event)}><div className="timeline-cover"><div style={{ backgroundImage: `url(${resolveStoryIllustration(event.illustration)})` }}/><small>{eventStatus(save, event) === "abgeschlossen" ? "✓ Schon erlebt" : "Datum offen"}</small></div><div className="timeline-card-body"><time>{eventDateText(event)}</time><h3>{event.title}</h3><p>{event.description}</p><button disabled={blocked} onClick={() => onDraft(event)}>{save.progress[event.id]?.completedAt ? "Noch einmal spielen" : "Spielen"} <span>→</span></button></div></article>)}</div>
    </details>}
  </>;
}
