"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { formatPlayTime, type AdventureSave, type AdventureSettings } from "./core";
import { ADVENTURE_ITEMS, CREDITS, LOVE_LETTER, MAIN_PUZZLES, MEMENTOS, PLANNED_MINUTES, WORDS, mainPuzzleOf, puzzleById, type EliasMessageDef } from "./content";
import { FxSprite } from "./fx";
import { assetUrl } from "../assets";
import { HINT_LEVELS, album, canCombineItems, canSkip, caseFile, chapterDef, hintPuzzle, hintsShown, objective, puzzleStatus, questLog } from "./engine";
import { CharacterArt } from "../WorldArt";

/** Shown wherever saving is explained: saves live only in this browser. */
export const LOCAL_SAVE_NOTE = "Spielstände werden nur lokal in diesem Browser auf diesem Gerät gespeichert. Wenn du Browserdaten, Cookies oder Websitedaten löschst (oder in einem privaten Fenster spielst), kann der Spielstand verloren gehen.";
export type SaveInfo = { savedAt: string | null; error: string | null; message?: string | null };
export const savedTime = (iso: string | null) => iso ? new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : null;

/* ----------------------------------------------------------------- HUD */

export function AdventureHud({ save, onJournal, onCase, onBag, onHint }: { save: AdventureSave; onJournal: () => void; onCase: () => void; onBag: () => void; onHint: () => void }) {
  const goal = objective(save), chapter = chapterDef(save);
  const log = questLog(save);
  const fragments = log.main.fragments;
  return <aside className="adv-hud" data-testid="adv-hud" aria-live="polite">
    <small>{chapter.subtitle}</small>
    <strong>Rette Elias</strong>
    <p data-testid="adv-objective">{goal.text}</p>
    <div className="adv-fragments" aria-label={`${fragments} von 4 Erinnerungsfragmenten, ${log.main.puzzles} von ${MAIN_PUZZLES.length} Haupt-Rätseln`}>{["▦", "✿", "◎", "✦"].map((symbol, index) => <span key={symbol} className={index < fragments ? "is-found" : ""} aria-hidden="true">{index < fragments ? symbol : "◇"}</span>)}<b data-testid="adv-main-progress">Rätsel {log.main.puzzles}/{MAIN_PUZZLES.length}</b></div>
    <nav className="adv-hud-buttons" aria-label="Abenteuer">
      <button onClick={onJournal}>Tagebuch <kbd>J</kbd></button>
      <button onClick={onCase}>Akte <kbd>K</kbd></button>
      <button onClick={onBag}>Tasche <kbd>I</kbd>{save.items.length > 0 && <b>{save.items.length}</b>}</button>
      <button onClick={onHint}>Hinweis <kbd>H</kbd></button>
    </nav>
  </aside>;
}

/* ------------------------------------------------------------- Modals */

function useModal() {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const node = ref.current; if (node && !node.open) node.showModal(); return () => { if (node?.open) node.close(); }; }, []);
  return ref;
}

export type JournalTab = "quests" | "case" | "album" | "settings";
export function AdventureJournal({ save, tab: initialTab, onClose, onCombineEvidence, onSettings, onRestart, onSave, saveInfo }: {
  save: AdventureSave; tab: JournalTab; onClose: () => void;
  onCombineEvidence: (a: string, b: string) => { ok?: boolean; text: string };
  onSettings: (settings: AdventureSettings) => void; onRestart: () => void;
  onSave: () => void; saveInfo: SaveInfo;
}) {
  const ref = useModal();
  const [tab, setTab] = useState<JournalTab>(initialTab);
  const tabs: [JournalTab, string][] = [["quests", "Aufgaben"], ["case", "Ermittlungsakte"], ["album", "Erinnerungsalbum"], ["settings", "Einstellungen"]];
  return <dialog ref={ref} className="story-modal adv-modal adv-journal" data-testid="adv-journal" onCancel={event => { event.preventDefault(); onClose(); }} aria-labelledby="adv-journal-title">
    <header className="adv-modal-head"><div><small>FELICE × ELIAS · DIE VERLORENEN ERINNERUNGEN</small><h1 id="adv-journal-title">Felices Tagebuch</h1></div><button className="modal-close" aria-label="Tagebuch schließen" onClick={onClose}>×</button></header>
    <div className="adv-tabs" role="tablist">{tabs.map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{label}</button>)}</div>
    <div className="adv-tab-body" role="tabpanel">
      {tab === "quests" && <QuestTab save={save}/>}
      {tab === "case" && <CaseTab save={save} onCombine={onCombineEvidence}/>}
      {tab === "album" && <AlbumTab save={save}/>}
      {tab === "settings" && <SettingsTab save={save} onSettings={onSettings} onRestart={onRestart} onSave={onSave} saveInfo={saveInfo}/>}
    </div>
    <div className="journal-bottom"><small>{saveInfo.error ?? `Automatisch gespeichert nach jedem Rätsel, Kapitel und Ortswechsel${saveInfo.savedAt ? ` · zuletzt ${savedTime(saveInfo.savedAt)} Uhr` : ""}.`}</small><button className="memory-primary" onClick={onClose}>Zurück ins Spiel</button></div>
  </dialog>;
}

function QuestTab({ save }: { save: AdventureSave }) {
  const log = questLog(save);
  return <div className="adv-quests">
    <section className="adv-main-quest"><small>HAUPTQUEST</small><h2>{log.main.title}</h2><p>{log.main.text}</p><p className="adv-progress"><span style={{ width: `${log.main.puzzles / MAIN_PUZZLES.length * 100}%` }}/></p><small>{log.main.puzzles} von {MAIN_PUZZLES.length} Haupt-Rätseln · {log.main.fragments} von 4 Erinnerungsfragmenten · Spielzeit {formatPlayTime(save.playSeconds)} (geplant ca. {PLANNED_MINUTES} Min.)</small></section>
    {log.chapters.map(chapter => <section key={chapter.id} className={`adv-chapter is-${chapter.state}`}>
      <h3><small>{chapter.subtitle} · geplant ca. {chapter.minutes} Min.{chapter.seconds > 0 ? ` · gespielt ${formatPlayTime(chapter.seconds)}` : ""}</small>{chapter.title}<em>{chapter.state === "abgeschlossen" ? "✓ abgeschlossen" : chapter.state === "aktiv" ? "aktiv" : "gesperrt"}</em></h3>
      {chapter.tasks.length > 0 && <ul>{chapter.tasks.map(task => <li key={task.id} className={task.done ? "is-done" : ""}>{task.done ? "☑" : "☐"} {task.label}</li>)}</ul>}
    </section>)}
    <section className="adv-side"><h3>Nebenaufgaben (optional)</h3><ul>{log.side.map(quest => <li key={quest.id} className={quest.done ? "is-done" : ""}><strong>{quest.done ? "☑" : "☐"} {quest.title} · {quest.have}/{quest.total}</strong><span>{quest.text}</span></li>)}</ul></section>
  </div>;
}

function CaseTab({ save, onCombine }: { save: AdventureSave; onCombine: (a: string, b: string) => { ok?: boolean; text: string } }) {
  const file = caseFile(save);
  const [picked, setPicked] = useState<string[]>([]);
  const [message, setMessage] = useState<{ ok?: boolean; text: string } | null>(null);
  function pick(id: string) {
    const next = picked.includes(id) ? picked.filter(entry => entry !== id) : [...picked, id].slice(-2);
    setPicked(next); setMessage(null);
  }
  return <div className="adv-case">
    <p className="adv-case-help">Wähle zwei Hinweise und kombiniere sie zu einer Schlussfolgerung.{file.open > 0 && ` In diesem Kapitel fehlen noch ${file.open}.`}</p>
    {file.evidence.length ? <ul className="adv-evidence">{file.evidence.map(entry => <li key={entry.id}><button aria-pressed={picked.includes(entry.id)} onClick={() => pick(entry.id)}><small>{entry.source}</small><strong>{entry.title}</strong><span>{entry.text}</span></button></li>)}</ul> : <p className="inventory-empty">Noch keine Hinweise. Untersuche Gegenstände und sprich mit Menschen.</p>}
    <div className="adv-row"><button className="memory-primary" data-testid="adv-combine-evidence" disabled={picked.length !== 2} onClick={() => { setMessage(onCombine(picked[0], picked[1])); setPicked([]); }}>Hinweise kombinieren</button>{message && <p className={`adv-feedback ${message.ok ? "is-ok" : "is-wrong"}`} role="status">{message.text}</p>}</div>
    <h3>Schlussfolgerungen</h3>
    {file.conclusions.length ? <ul className="adv-conclusions">{file.conclusions.map(entry => <li key={entry.id}><strong>✦ {entry.title}</strong><span>{entry.text}</span></li>)}</ul> : <p className="inventory-empty">Noch keine Schlussfolgerungen.</p>}
  </div>;
}

function AlbumTab({ save }: { save: AdventureSave }) {
  const pages = album(save);
  return <div className="adv-album">
    <p>{pages.filter(page => page.unlocked && !page.bonus).length} von 4 Erinnerungsfragmenten wiederhergestellt.</p>
    <ul>{pages.map(page => <li key={page.id} className={page.unlocked ? "is-unlocked" : "is-locked"} data-bonus={page.bonus ?? false}>
      <span className="adv-album-symbol" aria-hidden="true">{page.unlocked ? page.symbol : "?"}</span>
      <small>{page.unlocked ? page.date : page.bonus ? "Nebenaufgabe" : "Noch verloren"}</small>
      <h3>{page.unlocked ? page.title : "Eine verlorene Erinnerung"}</h3>
      <p>{page.unlocked ? page.text : "Der Schatten hält diese Seite noch verborgen."}</p>
      {page.unlocked && MEMENTOS[page.id]?.photo && <figure className="adv-memento"><img src={assetUrl(MEMENTOS[page.id].photo!)} alt={MEMENTOS[page.id].caption ?? page.title} loading="lazy"/>{MEMENTOS[page.id].caption && <figcaption>{MEMENTOS[page.id].caption}</figcaption>}</figure>}
      {page.unlocked && MEMENTOS[page.id]?.audio && <audio className="adv-memento-audio" controls preload="none" src={assetUrl(MEMENTOS[page.id].audio!)}>Sprachnachricht</audio>}
    </li>)}</ul>
  </div>;
}

function SettingsTab({ save, onSettings, onRestart, onSave, saveInfo }: { save: AdventureSave; onSettings: (settings: AdventureSettings) => void; onRestart: () => void; onSave: () => void; saveInfo: SaveInfo }) {
  const [confirm, setConfirm] = useState(false);
  const settings = save.settings;
  const toggle = <K extends keyof AdventureSettings>(key: K, value: AdventureSettings[K]) => onSettings({ ...settings, [key]: value });
  return <div className="adv-settings">
    <fieldset className="adv-save-box"><legend>Spielstand</legend><div>
      <span data-testid="adv-save-status">{saveInfo.error ? `⚠ ${saveInfo.error}` : saveInfo.message ?? (saveInfo.savedAt ? `Zuletzt gespeichert um ${savedTime(saveInfo.savedAt)} Uhr · Spielzeit ${formatPlayTime(save.playSeconds)}` : "Noch nicht gespeichert.")}</span>
      <button data-testid="adv-save-now" onClick={onSave}>Jetzt speichern</button>
    </div><small>{LOCAL_SAVE_NOTE}</small></fieldset>
    <fieldset><legend>Textgröße</legend><div><button aria-pressed={settings.textSize === "normal"} onClick={() => toggle("textSize", "normal")}>Normal</button><button aria-pressed={settings.textSize === "large"} onClick={() => toggle("textSize", "large")}>Groß</button></div></fieldset>
    <fieldset><legend>Effekte (Schatten-Glitches, Flackern)</legend><div><button aria-pressed={settings.effects === "full"} onClick={() => toggle("effects", "full")}>Voll</button><button aria-pressed={settings.effects === "reduced"} onClick={() => toggle("effects", "reduced")}>Reduziert</button></div></fieldset>
    <fieldset><legend>Felices Gedanken mit dem nächsten Ziel</legend><div><button aria-pressed={settings.thoughts} onClick={() => toggle("thoughts", true)}>Anzeigen</button><button aria-pressed={!settings.thoughts} onClick={() => toggle("thoughts", false)}>Ausblenden</button></div></fieldset>
    <p className="adv-settings-note">Smartphone & Tablet: Joystick unten links zum Laufen, der Aktionsknopf unten rechts zum Untersuchen und Sprechen, Tagebuch · Akte · Tasche · Hinweis über die Knöpfe links oben, Pause oben rechts. Alles lässt sich ohne Tastatur antippen.<br/>Tastatur: WASD/Pfeile · E Benutzen · I Tasche · J Tagebuch · K Akte · H Hinweis · Esc Pause. Dialoge kannst du mit × überspringen.</p>
    <fieldset className="adv-danger"><legend>Neues Abenteuer</legend>{confirm ? <div><span>Wirklich von vorn beginnen? Der Abenteuer-Spielstand wird ersetzt. Die Chronik „Unser Jahr“ bleibt unberührt.</span><button onClick={onRestart}>Ja, neu beginnen</button><button onClick={() => setConfirm(false)}>Abbrechen</button></div> : <div><button onClick={() => setConfirm(true)}>Abenteuer neu starten …</button></div>}</fieldset>
  </div>;
}

export function AdventureBag({ save, nearby, onClose, onUse, onCombine }: {
  save: AdventureSave; nearby: { id: string; name: string } | null; onClose: () => void;
  onUse: (item: string) => void; onCombine: (a: string, b: string) => { ok?: boolean; text: string };
}) {
  const ref = useModal();
  const items = save.items.map(id => ADVENTURE_ITEMS[id]).filter(Boolean);
  const [selected, setSelected] = useState<string | null>(items[0]?.id ?? null);
  const [combining, setCombining] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok?: boolean; text: string } | null>(null);
  const item = items.find(entry => entry.id === selected);
  function choose(id: string) {
    if (combining && combining !== id) { setMessage(onCombine(combining, id)); setCombining(null); setSelected(null); return; }
    setSelected(id); setMessage(null);
  }
  return <dialog ref={ref} className="story-modal inventory-modal adv-modal adv-bag" data-testid="adv-bag" onCancel={event => { event.preventDefault(); onClose(); }} onKeyDown={event => { if (event.code === "KeyI") { event.preventDefault(); onClose(); } }}>
    <div className="inventory-heading"><div><small>FELICES TASCHE</small><h1>Gegenstände</h1></div><button className="modal-close" aria-label="Tasche schließen" onClick={onClose}>×</button></div>
    {combining && <p className="adv-combine-banner" role="status">Womit möchtest du „{ADVENTURE_ITEMS[combining]?.name}“ kombinieren? <button onClick={() => setCombining(null)}>Abbrechen</button></p>}
    {items.length ? <div className="inventory-body">
      <ul className="inventory-grid" aria-label="Gegenstände">{items.map(entry => <li key={entry.id}><button aria-pressed={entry.id === selected || entry.id === combining} data-item={entry.id} onClick={() => choose(entry.id)}><span aria-hidden="true">{entry.symbol}</span><small>{entry.name}</small></button></li>)}</ul>
      {item && !combining && <article className="inventory-detail" aria-live="polite"><span className="inventory-symbol" aria-hidden="true">{item.symbol}</span><small>{item.quest ? "Questgegenstand · kann nicht verloren gehen" : "Gegenstand"}</small><h2>{item.name}</h2><p>{item.description}</p>
        <div className="adv-row">
          <button className="memory-primary" data-testid="adv-use" onClick={() => onUse(item.id)}>{nearby ? `Hier benutzen: ${nearby.name}` : "Benutzen"}</button>
          {items.length > 1 && canCombineItems() && <button className="memory-secondary" data-testid="adv-combine" onClick={() => { setCombining(item.id); setMessage(null); }}>Kombinieren …</button>}
        </div>
      </article>}
    </div> : <p className="inventory-empty">Deine Tasche ist leer.</p>}
    {message && <p className={`adv-feedback ${message.ok ? "is-ok" : "is-wrong"}`} role="status">{message.text}</p>}
    <div className="journal-bottom"><small>Wähle einen Gegenstand, um ihn zu untersuchen. Questgegenstände bleiben, bis die Geschichte sie braucht.</small><button className="memory-primary" onClick={onClose}>Zurück ins Spiel</button></div>
  </dialog>;
}

export function HintPanel({ save, place, onHint, onSkip, onOpen, onClose }: { save: AdventureSave; place: string; onHint: (id: string) => void; onSkip: (id: string) => void; onOpen: (id: string) => void; onClose: () => void }) {
  const ref = useModal();
  const puzzle = hintPuzzle(save);
  const goal = objective(save);
  const status = puzzle ? puzzleStatus(save, puzzle.id) : null;
  const hints = puzzle ? hintsShown(save, puzzle.id) : [];
  return <dialog ref={ref} className="story-modal adv-modal adv-hint-panel" data-testid="adv-hint-panel" onCancel={event => { event.preventDefault(); onClose(); }}>
    <header className="adv-modal-head"><div><small>HILFE</small><h1>Ein kleiner Hinweis</h1></div><button className="modal-close" aria-label="Hilfe schließen" onClick={onClose}>×</button></header>
    <p className="adv-prompt"><b>Aktuelles Ziel:</b> {goal.text}</p>
    {puzzle && <section className="adv-hints">
      <h2>{puzzle.title} <small>· {(() => { const main = mainPuzzleOf(puzzle.id); return main ? `Haupt-Rätsel ${main.number}/${MAIN_PUZZLES.length}${main.total > 1 ? `, Teil ${main.part}/${main.total}` : ""} · ` : ""; })()}{status}</small></h2>
      {status === "gesperrt" ? <p>Für dieses Rätsel fehlt dir noch etwas. Folge deinem aktuellen Ziel – die Aufgabenliste im Tagebuch (J) zeigt jeden Schritt.</p> : <>
        {hints.map((hint, index) => <p key={index}><b>Hinweis {index + 1}</b>{hint}</p>)}
        <div className="adv-hint-actions">
          {hints.length < HINT_LEVELS && <button className="memory-secondary" data-testid="adv-next-hint" onClick={() => onHint(puzzle.id)}>💡 Hinweis {hints.length + 1}/{HINT_LEVELS} zeigen</button>}
          {puzzle.ui.type !== "world" && puzzle.place === place && <button className="memory-secondary" onClick={() => onOpen(puzzle.id)}>Rätsel öffnen</button>}
          {canSkip(save, puzzle.id) && <button className="memory-secondary adv-skip" onClick={() => onSkip(puzzle.id)}>Rätsel überspringen</button>}
        </div>
        <small>Hinweise sind freiwillig und kosten nichts: Stufe 1 gibt eine Richtung, Stufe 2 einen konkreten Tipp, Stufe 3 die Lösung. Nach mehreren Fehlversuchen kannst du ein Rätsel auch überspringen.</small>
      </>}
    </section>}
    <div className="journal-bottom"><button className="memory-primary" onClick={onClose}>Zurück ins Spiel</button></div>
  </dialog>;
}
export const puzzleTitle = (id: string) => puzzleById(id)?.title ?? "Rätsel";

/* ----------------------------------------------------------- Cutscenes */

/** Elias' message after each restored fragment. The signal bars fill up with every memory; Felice answers in her own words. */
export function EliasMessage({ message, onReply }: { message: EliasMessageDef; onReply: (wordId: string) => void }) {
  const ref = useModal();
  const [sent, setSent] = useState<string | null>(null);
  const reply = useRef(onReply);
  useEffect(() => { reply.current = onReply; });
  // The answer stays visible as a sent bubble for a moment before the game continues.
  useEffect(() => { if (!sent) return; const timer = window.setTimeout(() => reply.current(sent), 1400); return () => window.clearTimeout(timer); }, [sent]);
  return <dialog ref={ref} className="adv-message" data-testid="adv-elias-message" data-signal={message.signal} onCancel={event => { event.preventDefault(); onReply(sent ?? message.replies[0]); }}>
    <div className="adv-phone"><header><span>Elias</span><small>jetzt · {message.status} <i className="adv-signal" aria-label={`Signal ${message.signal} von 4`}>{[1, 2, 3, 4].map(bar => <b key={bar} className={bar <= message.signal ? "is-on" : ""}/>)}</i></small></header>
      {message.bubbles.map((text, index) => <p key={index} className={`adv-bubble${message.signal < 3 && index === 1 ? " is-glitchy" : ""}`}>{text}</p>)}
      {sent ? <p className="adv-bubble is-mine" role="status">{WORDS[sent]?.quote}</p>
        : <div className="adv-replies">{message.replies.map((id, index) => <button key={id} className={index === 0 ? "memory-primary" : "memory-secondary"} data-reply={id} autoFocus={index === 0} onClick={() => setSent(id)}>{WORDS[id]?.label}</button>)}</div>}
    </div>
  </dialog>;
}

/** Shown when a memory fragment comes back: the Blender-rendered fragment spins, then flies up to the HUD. */
export function RewardBurst({ title, symbol, main, fragment, reduced }: { title: string; symbol: string; main?: string; fragment: boolean; reduced: boolean }) {
  return <div className="adv-reward" role="status" data-testid="adv-reward" aria-live="assertive">
    <FxSprite name="fragment" scale={2} reduced={reduced}/>
    <p><small>{fragment ? "Erinnerung zurückgeholt" : "Geschafft"} {symbol}</small><strong>{title}</strong>{main && <em>{main}</em>}</p>
  </div>;
}

export function ShadowGlitch({ reduced }: { reduced: boolean }) {
  if (reduced) return <div className="adv-glitch is-reduced" aria-hidden="true"/>;
  return <div className="adv-glitch" aria-hidden="true"><i/><i/><i/></div>;
}

export function AdventureCredits({ onDone, playSeconds, words, reduced }: { onDone: () => void; playSeconds: number; words: { id: string; quote: string }[]; reduced: boolean }) {
  const ref = useModal();
  const [stage, setStage] = useState<"words" | "letter" | "credits">(words.length ? "words" : "letter");
  return <dialog ref={ref} className="adv-credits" data-testid="adv-credits" data-stage={stage} onCancel={event => { event.preventDefault(); if (stage === "words") setStage("letter"); else if (stage === "letter") setStage("credits"); else onDone(); }}>
    {stage === "words" ? <article className="adv-words-card" aria-labelledby="adv-words-title" data-testid="adv-words">
      <FxSprite name="heart-burst" scale={2} reduced={reduced} className="adv-words-hearts"/>
      <small>Unterwegs hast du gesagt</small>
      <h1 id="adv-words-title">Deine Worte</h1>
      <ul>{words.map((word, index) => <li key={word.id} style={{ animationDelay: `${index * 0.35}s` }}>„{word.quote}“</li>)}</ul>
      <p className="adv-words-last">Und am Ende: „Weil wir zusammengehören.“</p>
      <button className="memory-primary" autoFocus onClick={() => setStage("letter")}>{"Elias' Brief lesen"}</button>
    </article> : stage === "letter" ? <article className="adv-letter-card" aria-labelledby="adv-letter-title">
      <div className="journal-duo" aria-hidden="true"><CharacterArt id="felice"/><CharacterArt id="elias"/></div>
      <h1 id="adv-letter-title">Für Felice</h1>
      {LOVE_LETTER.map((paragraph, index) => <p key={index} className={index === LOVE_LETTER.length - 1 ? "adv-signature" : undefined}>{paragraph}</p>)}
      <button className="memory-primary" autoFocus onClick={() => setStage("credits")}>Das bleibt ♥</button>
    </article> : <section className="adv-roll" aria-label="Abspann">
      <div className="adv-roll-inner">
        <h1>Felice × Elias</h1><h2>Die verlorenen Erinnerungen</h2>
        {CREDITS.map(entry => <p key={entry.role}><small>{entry.role}</small>{entry.names}</p>)}
        <p data-testid="adv-credits-time"><small>Eure Spielzeit</small>{formatPlayTime(playSeconds)}</p>
        <p className="adv-roll-end">Unsere Geschichte ist noch lange nicht zu Ende. ❤️</p>
      </div>
      <button className="memory-primary" autoFocus onClick={onDone}>Abenteuer abschließen</button>
    </section>}
  </dialog>;
}

/* ----------------------------------------------------------- World art */

/** Small pixel props for the adventure's hotspots, drawn in the 24 × 24 grid of SceneArt. */
export function AdventureProp({ art }: { art: string }) {
  const kind = art.replace("adv:", "");
  if (kind === "shadow") return <svg className="adv-shadow-figure" viewBox="0 0 40 60" shapeRendering="crispEdges" aria-hidden="true"><path d="M14 4h12v4h4v10h-2v6h4v6h4v14h-4v12h-4v4H12v-4H8V44H4V30h4v-6h4v-6h-2V8h4Z" fill="#160f26" opacity=".92"/><path d="M8 52h-4v4h4zm28 0h-4v4h4zM20 56h-4v4h4z" fill="#160f26" opacity=".5"/><rect x="15" y="12" width="3" height="2" fill="#c9b6ff"/><rect x="22" y="12" width="3" height="2" fill="#c9b6ff"/></svg>;
  return <svg className={`adv-prop adv-prop-${kind}`} viewBox="0 0 24 24" shapeRendering="crispEdges" aria-hidden="true">{PROPS[kind] ?? PROPS.spark}</svg>;
}
const PROPS: Record<string, ReactNode> = {
  letter: <><rect x="3" y="6" width="18" height="13" fill="#efe1c2" stroke="#6b5338"/><path d="M3 6l9 7 9-7" fill="none" stroke="#6b5338"/><rect x="10" y="11" width="4" height="4" fill="#6d4fb0"/></>,
  mirror: <><rect x="6" y="2" width="12" height="16" rx="5" fill="#a9c3c9" stroke="#76624a" strokeWidth="2"/><path d="M9 7l6 6M15 7l-6 6" stroke="#5b4592" strokeWidth="1.5"/><rect x="10" y="18" width="4" height="4" fill="#76624a"/></>,
  drawer: <><rect x="3" y="7" width="18" height="13" fill="#9a6d4b" stroke="#5e412b"/><rect x="5" y="9" width="14" height="4" fill="#b78559"/><rect x="11" y="10" width="2" height="2" fill="#f0d49a"/></>,
  door: <><rect x="5" y="1" width="14" height="22" fill="#7a5638" stroke="#3f2c1c"/><rect x="7" y="3" width="10" height="8" fill="#916845"/><rect x="15" y="12" width="2" height="3" fill="#e3c27c"/><path d="M8 15h6M8 17h6" stroke="#2d1f3f" strokeWidth="1" opacity=".7"/></>,
  note: <><rect x="5" y="3" width="14" height="18" fill="#f5ecd2" stroke="#8c7a55"/><path d="M8 8h8M8 11h8M8 14h5" stroke="#7a6a4a"/><rect x="10" y="1" width="4" height="3" fill="#c9524a"/></>,
  jar: <><rect x="6" y="6" width="12" height="15" rx="2" fill="#c7a77c" stroke="#7a5e3d"/><rect x="5" y="3" width="14" height="4" fill="#9b7650"/><circle cx="10" cy="13" r="2" fill="#7a5130"/><circle cx="14" cy="16" r="2" fill="#7a5130"/></>,
  tracks: <><path d="M2 20q6-6 10-8t10-9" fill="none" stroke="#4d3b2a" strokeWidth="2" strokeDasharray="2 2"/><path d="M5 22q6-6 10-8t8-8" fill="none" stroke="#4d3b2a" strokeWidth="1" strokeDasharray="1 3" opacity=".6"/></>,
  rift: <><circle cx="12" cy="12" r="9" fill="#2a1f45" opacity=".75"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4" stroke="#c9b6ff" strokeWidth="2"/><rect x="9" y="9" width="6" height="6" fill="#ffe2a0"/></>,
  chest: <><rect x="3" y="9" width="18" height="12" fill="#8c5a32" stroke="#4a2e1a"/><rect x="3" y="6" width="18" height="5" fill="#a46c3d" stroke="#4a2e1a"/><rect x="10" y="10" width="4" height="5" fill="#e3c27c" stroke="#7a5e2d"/></>,
  calendar: <><rect x="3" y="3" width="18" height="18" fill="#f4ead2" stroke="#7a6a4a"/><rect x="3" y="3" width="18" height="4" fill="#b84a3e"/><g fill="#7a6a4a"><rect x="6" y="9" width="2" height="2"/><rect x="10" y="9" width="2" height="2"/><rect x="14" y="9" width="2" height="2"/><rect x="6" y="13" width="2" height="2"/><rect x="10" y="13" width="2" height="2"/><rect x="14" y="13" width="2" height="2"/></g><circle cx="7" cy="10" r="2.5" fill="none" stroke="#b84a3e"/></>,
  ticket: <><rect x="2" y="7" width="20" height="11" rx="2" fill="#e8cf9e" stroke="#826642"/><path d="M16 8v9M5 11h7M5 14h5" stroke="#7f755c" strokeDasharray="2 1"/></>,
  timetable: <><path d="M12 13v10" stroke="#5d6254" strokeWidth="2"/><rect x="2" y="1" width="20" height="14" fill="#e4d8ae" stroke="#6c7b53"/><path d="M5 5h14M5 8h10M5 11h12" stroke="#5f7851"/></>,
  bus: <><rect x="1" y="5" width="22" height="13" rx="2" fill="#3b3157" opacity=".85" stroke="#c9b6ff"/><rect x="3" y="7" width="5" height="4" fill="#c9b6ff" opacity=".6"/><rect x="10" y="7" width="5" height="4" fill="#c9b6ff" opacity=".6"/><rect x="17" y="7" width="4" height="8" fill="#ffe2a0" opacity=".7"/><circle cx="6" cy="19" r="2" fill="#1c1630"/><circle cx="18" cy="19" r="2" fill="#1c1630"/></>,
  leaves: <><path d="M3 18q5-6 9-4t9 3" fill="#a5683a"/><path d="M4 20q6-4 8-2t8 1" fill="#c58f45"/><rect x="9" y="12" width="3" height="2" fill="#d9a84f"/><rect x="15" y="14" width="2" height="2" fill="#8a4f2c"/></>,
  switch: <><rect x="3" y="3" width="18" height="18" fill="#59606a" stroke="#2c3036"/><g fill="#c7c9b0"><rect x="6" y="7" width="2" height="10"/><rect x="10" y="7" width="2" height="10"/><rect x="14" y="7" width="2" height="10"/><rect x="18" y="7" width="1" height="10"/></g><g fill="#e05a43"><rect x="5" y="9" width="4" height="2"/><rect x="9" y="13" width="4" height="2"/><rect x="13" y="9" width="4" height="2"/></g></>,
  targets: <>{[10, 7, 4, 1].map((r, i) => <circle key={r} cx="12" cy="12" r={r} fill={i % 2 ? "#5a3a6e" : "#e9d6b2"}/>)}<rect x="11" y="11" width="2" height="2" fill="#ffe2a0"/></>,
  dial: <><rect x="4" y="1" width="16" height="22" fill="#4b3d6e" stroke="#211a33"/><circle cx="12" cy="7" r="3" fill="#c9b6ff"/><circle cx="12" cy="13" r="3" fill="#c9b6ff"/><circle cx="12" cy="19" r="3" fill="#c9b6ff"/><path d="M12 5v2M12 11v2M12 17v2" stroke="#211a33"/></>,
  card: <><rect x="4" y="7" width="16" height="11" fill="#f8efd8" stroke="#a8874f"/><path d="M7 11h10M7 14h6" stroke="#8c6b3c"/><path d="M12 7l2-3" stroke="#a8874f"/></>,
  clock: <><circle cx="12" cy="12" r="10" fill="#efe3c6" stroke="#6e5232" strokeWidth="2"/><path d="M12 12V5M12 12l4 2" stroke="#3a2a1a" strokeWidth="2"/><rect x="11" y="11" width="2" height="2" fill="#b84a3e"/></>,
  gift: <><rect x="3" y="9" width="18" height="12" fill="#b84a3e" stroke="#6e2a24"/><rect x="11" y="9" width="3" height="12" fill="#f0d49a"/><rect x="3" y="6" width="18" height="4" fill="#c95a4c" stroke="#6e2a24"/><path d="M12 6q-5-5-6 0M12 6q5-5 6 0" fill="none" stroke="#f0d49a" strokeWidth="2"/></>,
  pedestal: <><rect x="2" y="9" width="5" height="12" fill="#5a4b88"/><rect x="9" y="7" width="6" height="14" fill="#6f5fa0"/><rect x="17" y="9" width="5" height="12" fill="#5a4b88"/><rect x="3" y="6" width="3" height="3" fill="#ffe2a0"/><rect x="10" y="4" width="4" height="3" fill="#ffe2a0"/><rect x="18" y="6" width="3" height="3" fill="#ffe2a0"/></>,
  chocolate: <><rect x="3" y="7" width="18" height="11" fill="#6b3a24" stroke="#3a1f12"/><rect x="3" y="7" width="7" height="11" fill="#c9a24a"/><path d="M13 7v11M17 7v11M10 12h11" stroke="#4a2716"/></>,
  spark: <><path d="M12 2l2 7 7 3-7 3-2 7-2-7-7-3 7-3z" fill="#ffe2a0"/><rect x="11" y="11" width="2" height="2" fill="#fff8e0"/></>,
};
