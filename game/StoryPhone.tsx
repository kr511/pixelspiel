"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { EMOTIONS, dialogueEmotion, portraitIdForSpeaker, type Emotion } from "./dialogue";
import { PixelPortrait } from "./PixelPortrait";
import { worldAudio } from "./audio";
import { PhonePages, PhoneTabs, type PhoneTab } from "./PhoneHub";
import { CHAT_TOPICS, chatTopicForEvent, historicalDate, type EventProgress, type StoryEvent, type TimelineSave } from "./timeline";
import "./phone-album.css";

export function StoryPhone({ event, state, replay, blocked, paused, onPause, onChange, onClose, onComplete, timeline, onSelectMemory, onOpenAlbum, onJump }: {
  event: StoryEvent; state: EventProgress; replay: boolean; blocked: boolean;
  paused: boolean; onPause: () => void; onChange: (state: EventProgress) => void; onClose: () => void; onComplete: () => void;
  timeline?: TimelineSave; onSelectMemory?: (id: string) => void; onOpenAlbum?: () => void; onJump?: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const firstReplyRef = useRef<HTMLButtonElement>(null);
  const changedRef = useRef<string | null>(null);
  const onChangeRef = useRef(onChange);
  const stateRef = useRef(state);
  const [tab, setTab] = useState<PhoneTab>("Nachrichten");
  const [hidden, setHidden] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const love = event.scene === "love";
  const scripted = love || event.scene === "confession" || event.scene === "message";
  const topic = useMemo(() => state.topic ? chatTopicForEvent(state.topic, event) : undefined, [state.topic, event]);
  const messages = useMemo(() => scripted ? event.dialogue.slice(0, state.cursor) : [
    ...state.topics.flatMap(id => chatTopicForEvent(id, event)?.lines ?? []),
    ...(topic?.lines.slice(0, state.line) ?? []),
  ], [scripted, event, state.cursor, state.topics, topic, state.line]);
  const latest = messages.at(-1);
  const typed = state.typed ?? latest?.text.length ?? 0;
  const fullyTyped = !latest || typed >= latest.text.length;
  const messageBlocked = blocked || paused || hidden;
  const interrupted = messageBlocked || tab !== "Nachrichten";
  const interruptedRef = useRef(interrupted);
  const nextLine = scripted ? event.dialogue[state.cursor] : undefined;
  const speaker = latest?.speaker ?? "Felice";
  const emotion = latest?.emotion ?? (love ? "love" : event.scene === "confession" ? "shy" : topic?.id === "philosophy" ? "thoughtful" : state.topics.length > 1 ? "happy" : "neutral");
  const portraitEmotion = dialogueEmotion(latest?.text ?? "", EMOTIONS.includes(emotion as Emotion) ? emotion as Emotion : undefined);
  const update = useCallback((next: EventProgress) => onChangeRef.current(next), []);
  const checkpoint = `${event.id}:${state.cursor}:${state.topic ?? ""}:${state.line}:${state.topics.join(",")}`;
  const reveal = () => { if (!interrupted && latest && !fullyTyped) update({ ...state, typed: latest.text.length }); };

  useLayoutEffect(() => { onChangeRef.current = onChange; stateRef.current = state; interruptedRef.current = interrupted; }, [onChange, state, interrupted]);
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setHidden(document.hidden);
    const motionChange = () => setReduceMotion(motion.matches);
    change(); motionChange();
    document.addEventListener("visibilitychange", change); motion.addEventListener("change", motionChange);
    return () => { document.removeEventListener("visibilitychange", change); motion.removeEventListener("change", motionChange); };
  }, []);
  useEffect(() => { const node = ref.current; if (node && !node.open) node.showModal(); return () => node?.close(); }, []);
  useEffect(() => { changedRef.current = null; }, [checkpoint]);
  useEffect(() => {
    if (interrupted || !latest || fullyTyped) return;
    const timer = window.setTimeout(() => {
      if (!interruptedRef.current && stateRef.current === state) update({ ...state, typed: reduceMotion ? latest.text.length : Math.min(latest.text.length, typed + 3) });
    }, reduceMotion ? 0 : 42);
    return () => window.clearTimeout(timer);
  }, [state, latest, typed, fullyTyped, interrupted, reduceMotion, update]);
  useEffect(() => {
    if (interrupted || !fullyTyped) return;
    const incoming = scripted && nextLine && nextLine.speaker !== "Felice";
    const waitingLove = love && state.cursor === 1 && state.line === 0;
    const next = incoming ? { ...state, cursor: state.cursor + 1, typed: 0 } : waitingLove ? { ...state, line: 1 } : !scripted && state.topic && state.line === 1 ? { ...state, line: 2, typed: 0 } : null;
    if (!next) return;
    const timer = window.setTimeout(() => { if (!interruptedRef.current && stateRef.current === state) { update(next); worldAudio.play("interact"); } }, waitingLove ? 1600 : 1100);
    return () => window.clearTimeout(timer);
  }, [state, scripted, nextLine, love, fullyTyped, interrupted, update]);
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "auto" }); }, [messages.length, state.typed]);

  const sendScript = (choice?: string) => {
    if (interrupted || !fullyTyped || nextLine?.speaker !== "Felice" || love && state.line === 0 || changedRef.current === checkpoint) return;
    if (nextLine.choices?.length && (!choice || !nextLine.choices.includes(choice))) { firstReplyRef.current?.focus(); return; }
    changedRef.current = checkpoint;
    worldAudio.play(love ? "complete" : "interact");
    update({ ...state, cursor: state.cursor + 1, typed: 0, ...(choice ? { answers: { ...state.answers, [String(state.cursor)]: choice } } : {}) });
  };
  const sendTopic = () => {
    if (!topic || state.line < 2 || !fullyTyped || interrupted || changedRef.current === checkpoint) return;
    changedRef.current = checkpoint;
    update({ ...state, topics: [...new Set([...state.topics, topic.id])], topic: null, line: 0, typed: 0 });
  };
  const complete = () => {
    if (interrupted || !fullyTyped || changedRef.current === checkpoint || scripted && nextLine || !scripted && (state.topic !== null || state.topics.length < 2)) return;
    changedRef.current = checkpoint;
    onComplete();
  };
  const advance = () => {
    if (interrupted) return;
    if (!fullyTyped) { reveal(); return; }
    if (scripted && nextLine?.speaker === "Felice") sendScript();
    else if (scripted && !nextLine) complete();
    else if (topic) sendTopic();
  };
  const time = event.staging.timeConfirmed ? `${String(Math.floor(event.staging.start / 60)).padStart(2,"0")}:${String(event.staging.start % 60).padStart(2,"0")}` : scripted ? event.scene === "message" ? "Am Morgen · szenisch ergänzt" : "Ruhiger Abend · szenisch ergänzt" : state.topics.length === 0 ? `ca. ${String(Math.floor(event.staging.start/60)).padStart(2,"0")}:${String(event.staging.start%60).padStart(2,"0")}` : state.topics.length === 1 ? "Im Laufe des Abends" : "Bis ungefähr 23:00";
  return <dialog ref={ref} className={`story-modal story-phone phone-v09${love || event.scene === "confession" ? " love-phone" : ""}`} aria-label={`Handy · ${event.title}`} onCancel={e => { e.preventDefault(); onClose(); }} onKeyDown={e => {
    if (e.key === "Escape") { e.stopPropagation(); return; }
    if ((e.key === "Enter" || e.key === " ") && !(e.target instanceof Element && e.target.closest(".phone-tabs,.phone-header, .phone-page"))) {
      e.stopPropagation();
      if (e.repeat) { e.preventDefault(); return; }
      if (fullyTyped && e.target instanceof Element && e.target.closest("button") && !messageBlocked) return;
      e.preventDefault(); advance();
    }
  }}>
    <header className="phone-header"><span className="phone-portrait active-speaker-portrait" data-speaking-character={speaker.toLowerCase()} data-emotion={portraitEmotion}><PixelPortrait id={portraitIdForSpeaker(speaker)} emotion={portraitEmotion}/></span><div><small>{replay ? "ERINNERUNG ERNEUT ERLEBEN" : "CHAT MIT ELIAS"}</small><h2>{speaker} <span className="online-dot" aria-hidden="true"/></h2><time dateTime={event.date ?? undefined}>{historicalDate(event.date)} · {time}</time></div><button className="phone-pause" aria-label={paused ? "Chat fortsetzen" : "Chat pausieren"} onClick={onPause}>{paused ? "▶" : "Ⅱ"}</button><button className="modal-close" aria-label="Handy schließen" onClick={onClose}>×</button></header>
    {timeline && <PhoneTabs tab={tab} onChange={setTab}/>}
    {tab !== "Nachrichten" && timeline ? <PhonePages tab={tab} timeline={timeline} blocked={blocked} onSelectMemory={onSelectMemory} onOpenAlbum={onOpenAlbum} onJump={onJump} activeId={event.id}/> : <>
      <p className="reconstruction-note">{love ? "Die beiden Liebesnachrichten sind bestätigt. Uhrzeit, Pausen und Inszenierung sind spielerisch ergänzt." : scripted ? "Die Kernaussagen beruhen auf euren Angaben. Ohne Originalnachrichten ist der Wortlaut eine sinngemäße Rekonstruktion." : "Fiktionalisierte Rekonstruktion · Keine Originalnachrichten. Episodeneinteilung, Themenzuordnung und szenische Uhrzeiten sind ergänzt."}</p>
      <div className="phone-chat" ref={logRef} role="log" aria-live={fullyTyped ? "polite" : "off"} aria-busy={!fullyTyped} aria-label="Chat mit Elias" onClick={reveal}>
        {!scripted && <p className="chat-narration">{event.dialogue[0]?.text}</p>}
        {messages.map((line, index) => <div className={`chat-message from-${line.speaker.toLowerCase()}${index === messages.length - 1 ? " latest-message" : ""}`} key={`${index}-${line.text}`}><small>{line.speaker === "Erzählung" ? "ERZÄHLUNG" : line.speaker}{line.original ? " · BESTÄTIGTE NACHRICHT" : ""}</small><p>{index === messages.length - 1 ? line.text.slice(0, typed) : line.text}{index === messages.length - 1 && !fullyTyped && <span className="typing-caret" aria-hidden="true">▎</span>}</p>{scripted && state.answers?.[String(index)] && <small className="chat-answer-choice">Deine Entscheidung: {state.answers[String(index)]}</small>}{line.speaker === "Felice" && <span className="chat-delivered" aria-label="Gesendet">✓</span>}</div>)}
        {fullyTyped && (scripted && nextLine?.speaker !== "Felice" && nextLine || topic && state.line === 1) && <span className="chat-typing" role="status">{nextLine?.speaker === "Erzählung" ? "Ein Moment bleibt" : "Elias schreibt"}<span>· · ·</span></span>}
        {scripted && !nextLine && fullyTyped && <div className="love-moment" role="status"><span aria-hidden="true">{love || event.scene === "confession" ? "♥" : "☀"}</span><p>{love ? "Zwei Nachrichten. Ein gemeinsamer Anfang." : event.scene === "confession" ? "Ein Gefühl bekommt Worte." : "Ein kleiner Moment für eure Geschichte."}</p>{(love || event.scene === "confession") && <div className="heart-particles" aria-hidden="true"><i>♥</i><i>♥</i><i>♥</i></div>}</div>}
      </div>
      <footer className="phone-composer">
        {!fullyTyped && <button className="phone-reveal" disabled={messageBlocked} onClick={reveal}>Nachricht vollständig lesen <span>↵</span></button>}
        {scripted ? <>{nextLine?.speaker === "Felice" && <><p className="message-preview"><small>DEINE ANTWORT · {nextLine.original ? "BESTÄTIGTE NACHRICHT" : "REKONSTRUKTION"}</small>{nextLine.text}</p>{nextLine.choices?.length ? <div className="phone-reply-choices" role="group" aria-label="Wie möchtest du antworten?">{nextLine.choices.map((choice, index) => <button key={choice} ref={index === 0 ? firstReplyRef : undefined} className="memory-primary script-send script-choice" data-testid="phone-reply-choice" data-choice={choice} disabled={!fullyTyped || messageBlocked} onClick={() => sendScript(choice)}>{choice}<span aria-hidden="true"> ↗</span></button>)}</div> : <button ref={firstReplyRef} className={`memory-primary script-send${love ? " love-send" : ""}`} disabled={!fullyTyped || love && state.line === 0 || messageBlocked} onClick={() => sendScript()}>{love ? "„Ich liebe dich.“ senden" : state.cursor === 0 && event.scene === "confession" ? "Gefühle anvertrauen · Nachricht senden" : "Nachricht senden"} <span aria-hidden="true">↗</span></button>}</>}{!nextLine && <button className="memory-primary" disabled={!fullyTyped || messageBlocked} onClick={complete}>Diesen Moment bewahren ♥</button>}{nextLine?.speaker !== "Felice" && nextLine && <p>Dein Handy leuchtet auf …</p>}</> : <>
          {topic ? <button className="memory-primary" disabled={state.line < 2 || !fullyTyped || messageBlocked} onClick={sendTopic}>{state.line < 2 ? "Eine Nachricht kommt …" : topic.lines[2].speaker === "Erzählung" ? "Gedanken stehen lassen" : "Antwort senden"}</button> : <>
            <p>Worüber möchtest du schreiben? <span>{state.topics.length}/2 Themen für diesen Abend</span></p>
            <div className="chat-topics">{CHAT_TOPICS.map(topic => <button key={topic.id} disabled={state.topics.includes(topic.id) || !fullyTyped || messageBlocked} aria-pressed={state.topics.includes(topic.id)} onClick={() => { if (!interrupted) update({ ...state, topic: topic.id, line: 1, typed: 0 }); }}><span>{topic.icon}</span>{topic.title}{state.topics.includes(topic.id) && <small>✓</small>}</button>)}</div>
            {state.topics.length >= 2 && <button className="memory-primary" disabled={!fullyTyped || messageBlocked} onClick={complete}>Den Abend bewahren <span>→</span></button>}
          </>}
        </>}
      </footer>
    </>}
  </dialog>;
}
