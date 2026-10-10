"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { PixelPortrait } from "./PixelPortrait";
import { dialogueAdvanceIntent, dialogueCharacters, dialogueEmotion, nextVisibleLength, portraitIdForSpeaker, type Emotion } from "./dialogue";

export type DialogueBoxProps = {
  speaker: string; art?: string; text: string; emotion?: Emotion; choices?: string[];
  blocked: boolean; onAdvance: (choice?: string) => void; ending?: boolean; note?: string;
  onCancel?: () => void; onPause?: () => void; paused?: boolean;
};

function subscribeReducedMotion(notify: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
}
function reducedMotionSnapshot() { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
function subscribeVisibility(notify: () => void) {
  document.addEventListener("visibilitychange", notify);
  return () => document.removeEventListener("visibilitychange", notify);
}
function visibilitySnapshot() { return document.hidden; }
function serverSnapshot() { return false; }

export function DialogueBox({ speaker, art, text, emotion, choices, blocked, onAdvance, ending = false, note, onCancel, onPause, paused = false }: DialogueBoxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const firstChoiceRef = useRef<HTMLButtonElement>(null);
  const advanced = useRef(false);
  const characters = useMemo(() => dialogueCharacters(text), [text]);
  const [visible, setVisible] = useState(0);
  const hidden = useSyncExternalStore(subscribeVisibility, visibilitySnapshot, serverSnapshot);
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, reducedMotionSnapshot, serverSnapshot);
  const finished = visible >= characters.length;
  const portraitEmotion = dialogueEmotion(text, emotion);

  useEffect(() => {
    const node = dialogRef.current;
    if (node && !node.open) node.showModal();
    textRef.current?.focus({ preventScroll: true });
    return () => node?.close();
  }, []);
  useEffect(() => {
    if (blocked || hidden || visible >= characters.length) return;
    const last = characters[Math.max(0, visible - 1)];
    const timer = window.setTimeout(() => {
      if (!document.hidden) setVisible(current => reducedMotion ? characters.length : nextVisibleLength(current, characters.length));
    }, reducedMotion ? 0 : /[.!?…]/.test(last ?? "") ? 170 : /[,;:]/.test(last ?? "") ? 80 : 28);
    return () => window.clearTimeout(timer);
  }, [visible, characters, blocked, hidden, reducedMotion]);

  function act(choice?: string) {
    if (advanced.current) return;
    const intent = dialogueAdvanceIntent({ blocked, visible, total: characters.length, choiceCount: choice ? 1 : choices?.length ?? 0 });
    if (intent === "blocked") return;
    if (intent === "reveal") { setVisible(characters.length); return; }
    if (intent === "choose") { firstChoiceRef.current?.focus(); return; }
    advanced.current = true;
    onAdvance(choice ?? (choices?.length === 1 ? choices[0] : undefined));
  }

  return <dialog ref={dialogRef} className={`fx-dialogue${ending ? " fx-dialogue-ending" : ""}`} data-testid="dialogue-box" data-emotion={portraitEmotion} aria-labelledby="fx-dialogue-speaker" aria-describedby="fx-dialogue-accessible-text" onCancel={event => { event.preventDefault(); if (!blocked) onCancel?.(); }} onKeyDown={event => {
    if (event.key !== "Enter" && event.code !== "Space" && event.key !== " ") return;
    event.stopPropagation();
    if (event.repeat) { event.preventDefault(); return; }
    const button = (event.target as HTMLElement).closest("button");
    if (button?.classList.contains("dialogue-pause")) return;
    if (finished && button && !blocked) return;
    event.preventDefault(); act();
  }}>
    <div className="fx-dialogue-top"><div className="fx-dialogue-speaker-portrait"><PixelPortrait id={portraitIdForSpeaker(speaker, art)} emotion={portraitEmotion}/></div><div className="fx-dialogue-nameplate"><small>{note ?? (ending ? "ERINNERUNG BEWAHRT" : "FIKTIONALISIERTER DIALOG")}</small><h2 id="fx-dialogue-speaker">{speaker}</h2></div>{onCancel && <button className="fx-dialogue-close" aria-label="Gespräch unterbrechen" disabled={blocked} onClick={onCancel}>×</button>}</div>
    <div className="fx-dialogue-body" aria-busy={!finished}>
      <div ref={textRef} tabIndex={0} className="fx-dialogue-text" data-testid="dialogue-text" data-visible={visible} data-complete={finished} onClick={() => act()} aria-label={finished ? "Dialogtext. Tippen zum Fortsetzen." : "Dialogtext. Tippen zeigt die ganze Nachricht."}>
        <span aria-hidden="true">{characters.slice(0, visible).join("")}{!finished && <span className="fx-typewriter-cursor">▍</span>}</span>
      </div>
      <p id="fx-dialogue-accessible-text" className="fx-dialogue-sr">{text}</p>
      {blocked && <p className="fx-dialogue-pause" role="status">Gespräch pausiert</p>}
      <div className="fx-dialogue-controls">
        {onPause && <button className="dialogue-pause" onClick={onPause} aria-label={paused ? "Gespräch fortsetzen" : "Gespräch pausieren"}>{paused ? "▶ Fortsetzen" : "Ⅱ Pause"}</button>}
        {choices?.length ? <div className="fx-dialogue-choices" aria-label="Deine Antwort">{choices.map((choice, index) => <button key={`${index}-${choice}`} ref={index === 0 ? firstChoiceRef : undefined} data-testid="dialogue-choice" data-choice={choice} disabled={blocked || !finished} onClick={() => act(choice)}>{choice}</button>)}</div> : <button className="fx-dialogue-next" data-testid="dialogue-next" disabled={blocked} onClick={() => act()}>{!finished ? "Text anzeigen" : ending ? "Das bleibt ♥" : "Weiter"}<span aria-hidden="true">▸</span></button>}
        {!!choices?.length && !finished && <button className="fx-dialogue-reveal" data-testid="dialogue-next" disabled={blocked} onClick={() => act()}>Text anzeigen <span aria-hidden="true">▸</span></button>}
        <small className="fx-dialogue-hint">{choices && choices.length > 1 && finished ? "Wähle deine Antwort" : "Enter · Leertaste · Tippen"}</small>
      </div>
    </div>
  </dialog>;
}
