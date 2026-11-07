"use client";

import { useEffect, useRef, useState } from "react";
import type { AdventureSave } from "./core";
import { MAIN_PUZZLES, mainPuzzleOf, puzzleById, type PuzzleUI } from "./content";
import { HINT_LEVELS, canSkip, hintsShown, puzzleStatus } from "./engine";

type Props = {
  save: AdventureSave; id: string; blocked: boolean;
  onSubmit: (answer: unknown) => { ok: boolean; feedback: string };
  onHint: () => void; onSkip: () => void; onClose: () => void;
};
const KIND_LABEL = { code: "Codeschloss", pattern: "Musterrätsel", combination: "Kombinationsrätsel", sequence: "Reihenfolge", deduction: "Deduktion", switch: "Schalterrätsel", heart: "Herzensfrage" } as const;

/** One modal for every puzzle type. Inputs are buttons, so keyboard, mouse and touch work alike. */
export function PuzzlePanel({ save, id, blocked, onSubmit, onHint, onSkip, onClose }: Props) {
  const puzzle = puzzleById(id)!;
  const dialog = useRef<HTMLDialogElement>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => { const node = dialog.current; if (node && !node.open) node.showModal(); return () => { if (node?.open) node.close(); }; }, []);
  const hints = hintsShown(save, id);
  const status = puzzleStatus(save, id);
  const record = save.puzzles[id];
  const main = mainPuzzleOf(id);
  function submit(answer: unknown) {
    if (blocked) return;
    const result = onSubmit(answer);
    setFeedback({ ok: result.ok, text: result.feedback });
  }
  return <dialog ref={dialog} className="story-modal adv-modal adv-puzzle" data-testid="adv-puzzle" data-puzzle={id} aria-labelledby="adv-puzzle-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <header className="adv-modal-head">
      <div><small data-testid="adv-main-label">{[main ? `Haupt-Rätsel ${main.number}/${MAIN_PUZZLES.length} · ${main.genre}${main.total > 1 ? ` · Teil ${main.part}/${main.total}` : ""}` : KIND_LABEL[puzzle.kind], status === "gelöst" ? "gelöst" : record?.failures ? `${record.failures} Fehlversuch${record.failures === 1 ? "" : "e"}` : null].filter(Boolean).join(" · ")}</small><h1 id="adv-puzzle-title">{puzzle.title}</h1></div>
      <button className="modal-close" aria-label="Rätsel schließen" onClick={onClose}>×</button>
    </header>
    <p className="adv-prompt">{puzzle.prompt}</p>
    {puzzle.clues.length > 0 && <ul className="adv-clues">{puzzle.clues.map(clue => <li key={clue}>{clue}</li>)}</ul>}
    <div className="adv-puzzle-body"><PuzzleInput ui={puzzle.ui} disabled={blocked || status === "gelöst"} onSubmit={submit}/></div>
    <p className={`adv-feedback${feedback ? feedback.ok ? " is-ok" : " is-wrong" : ""}`} role="status" aria-live="polite">{feedback?.text ?? " "}</p>
    <section className="adv-hints" aria-label="Hinweise">
      {hints.map((hint, index) => <p key={index}><b>Hinweis {index + 1}</b>{hint}</p>)}
      <div className="adv-hint-actions">
        {hints.length < HINT_LEVELS && <button className="memory-secondary" onClick={onHint} disabled={blocked}>💡 Hinweis {hints.length + 1}/{HINT_LEVELS}</button>}
        {canSkip(save, id) && <button className="memory-secondary adv-skip" onClick={onSkip} disabled={blocked}>Rätsel überspringen</button>}
      </div>
    </section>
  </dialog>;
}

function PuzzleInput({ ui, disabled, onSubmit }: { ui: PuzzleUI; disabled: boolean; onSubmit: (answer: unknown) => void }) {
  if (ui.type === "code") return <CodeInput length={ui.length} label={ui.label} disabled={disabled} onSubmit={onSubmit}/>;
  if (ui.type === "pattern") return <PatternInput size={ui.size} start={ui.start} disabled={disabled} onSubmit={onSubmit}/>;
  if (ui.type === "combination") return <DialInput dials={ui.dials} disabled={disabled} onSubmit={onSubmit}/>;
  if (ui.type === "sequence") return <SequenceInput cards={ui.cards} length={ui.length} disabled={disabled} onSubmit={onSubmit}/>;
  if (ui.type === "questions") return <QuestionInput questions={ui.questions} submit={ui.submit} disabled={disabled} onSubmit={onSubmit}/>;
  if (ui.type === "truth") return <TruthInput statements={ui.statements} disabled={disabled} onSubmit={onSubmit}/>;
  if (ui.type === "switch") return <SwitchInput ui={ui} disabled={disabled} onSubmit={onSubmit}/>;
  return null;
}
const Check = ({ disabled, onClick, label = "Prüfen" }: { disabled: boolean; onClick: () => void; label?: string }) => <button className="memory-primary adv-check" data-testid="adv-check" disabled={disabled} onClick={onClick}>{label}</button>;

function CodeInput({ length, label, disabled, onSubmit }: { length: number; label: string; disabled: boolean; onSubmit: (answer: unknown) => void }) {
  const [digits, setDigits] = useState(() => Array(length).fill(0));
  const turn = (index: number, delta: number) => setDigits(previous => previous.map((digit, i) => i === index ? (digit + delta + 10) % 10 : digit));
  return <div className="adv-code" onKeyDown={event => { if (/^\d$/.test(event.key) && event.target instanceof HTMLElement) { const index = Number(event.target.dataset.index ?? -1); if (index >= 0) { setDigits(previous => previous.map((d, i) => i === index ? Number(event.key) : d)); (event.target.parentElement?.nextElementSibling?.querySelector("[data-index]") as HTMLElement | null)?.focus(); } } }}>
    <small>{label}</small>
    <div className="adv-wheels">{digits.map((digit, index) => <div key={index} className="adv-wheel">
      <button aria-label={`Ziffer ${index + 1} erhöhen`} disabled={disabled} onClick={() => turn(index, 1)}>▲</button>
      <output data-index={index} tabIndex={0} aria-label={`Ziffer ${index + 1}: ${digit}`}>{digit}</output>
      <button aria-label={`Ziffer ${index + 1} verringern`} disabled={disabled} onClick={() => turn(index, -1)}>▼</button>
    </div>)}</div>
    <Check disabled={disabled} onClick={() => onSubmit(digits.map(String))}/>
  </div>;
}

function PatternInput({ size, start, disabled, onSubmit }: { size: number; start: boolean[]; disabled: boolean; onSubmit: (answer: unknown) => void }) {
  const [cells, setCells] = useState(start);
  return <div className="adv-pattern">
    <div className="adv-grid" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>{cells.map((lit, index) => <button key={index} aria-label={`Feld ${Math.floor(index / size) + 1}-${index % size + 1}`} aria-pressed={lit} className={lit ? "is-lit" : ""} disabled={disabled} onClick={() => setCells(previous => previous.map((value, i) => i === index ? !value : value))}/>)}</div>
    <div className="adv-row"><button className="memory-secondary" disabled={disabled} onClick={() => setCells(start)}>Zurücksetzen</button><Check disabled={disabled} onClick={() => onSubmit(cells)}/></div>
  </div>;
}

function DialInput({ dials, disabled, onSubmit }: { dials: { label: string; options: string[]; start: number }[]; disabled: boolean; onSubmit: (answer: unknown) => void }) {
  const [positions, setPositions] = useState(() => dials.map(dial => dial.start));
  const turn = (index: number, delta: number) => setPositions(previous => previous.map((value, i) => i === index ? (value + delta + dials[i].options.length) % dials[i].options.length : value));
  return <div className="adv-dials">
    {dials.map((dial, index) => <div key={index} className="adv-dial"><small>{dial.label}</small><div>
      <button aria-label={`${dial.label}: vorheriges`} disabled={disabled} onClick={() => turn(index, -1)}>◀</button>
      <output aria-live="polite">{dial.options[positions[index]]}</output>
      <button aria-label={`${dial.label}: nächstes`} disabled={disabled} onClick={() => turn(index, 1)}>▶</button>
    </div></div>)}
    <Check disabled={disabled} onClick={() => onSubmit(positions.map((position, index) => dials[index].options[position]))}/>
  </div>;
}

function SequenceInput({ cards, length, disabled, onSubmit }: { cards: { id: string; label: string; detail?: string }[]; length: number; disabled: boolean; onSubmit: (answer: unknown) => void }) {
  const [order, setOrder] = useState<string[]>([]);
  const card = (id: string) => cards.find(entry => entry.id === id)!;
  return <div className="adv-sequence">
    <ol className="adv-slots" aria-label="Deine Reihenfolge">{Array.from({ length }, (_, index) => <li key={index}>{order[index] ? <button disabled={disabled} onClick={() => setOrder(previous => previous.filter((_, i) => i !== index))} aria-label={`${card(order[index]).label} entfernen`}><b>{index + 1}</b>{card(order[index]).label}<span aria-hidden="true">×</span></button> : <span className="adv-empty-slot"><b>{index + 1}</b>…</span>}</li>)}</ol>
    <ul className="adv-pool" aria-label="Verfügbare Karten">{cards.filter(entry => !order.includes(entry.id)).map(entry => <li key={entry.id}><button data-card={entry.id} disabled={disabled || order.length >= length} onClick={() => setOrder(previous => [...previous, entry.id])}><strong>{entry.label}</strong>{entry.detail && <small>{entry.detail}</small>}</button></li>)}</ul>
    <div className="adv-row"><button className="memory-secondary" disabled={disabled} onClick={() => setOrder([])}>Zurücksetzen</button><Check disabled={disabled || order.length !== length} onClick={() => onSubmit(order)}/></div>
  </div>;
}

function QuestionInput({ questions, submit = "Prüfen", disabled, onSubmit }: { questions: { id: string; question: string; options: { id: string; label: string }[] }[]; submit?: string; disabled: boolean; onSubmit: (answer: unknown) => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  return <div className="adv-questions">
    {questions.map(question => <fieldset key={question.id}><legend>{question.question}</legend><div>{question.options.map(option => <button key={option.id} data-option={option.id} aria-pressed={answers[question.id] === option.id} disabled={disabled} onClick={() => setAnswers(previous => ({ ...previous, [question.id]: option.id }))}>{option.label}</button>)}</div></fieldset>)}
    <Check disabled={disabled} onClick={() => onSubmit(answers)} label={submit}/>
  </div>;
}

function TruthInput({ statements, disabled, onSubmit }: { statements: { id: string; text: string }[]; disabled: boolean; onSubmit: (answer: unknown) => void }) {
  const [chosen, setChosen] = useState<string[]>([]);
  return <div className="adv-truth">
    <ul>{statements.map(statement => <li key={statement.id}><button data-statement={statement.id} aria-pressed={chosen.includes(statement.id)} disabled={disabled} onClick={() => setChosen(previous => previous.includes(statement.id) ? previous.filter(id => id !== statement.id) : [...previous, statement.id])}><span aria-hidden="true">{chosen.includes(statement.id) ? "✦" : "○"}</span>{statement.text}</button></li>)}</ul>
    <Check disabled={disabled} onClick={() => onSubmit(chosen)} label="Die Wahrheit aussprechen"/>
  </div>;
}

function SwitchInput({ ui, disabled, onSubmit }: { ui: Extract<PuzzleUI, { type: "switch" }>; disabled: boolean; onSubmit: (answer: unknown) => void }) {
  const [lamps, setLamps] = useState(ui.start);
  const [presses, setPresses] = useState(0);
  function press(index: number) {
    const next = lamps.map((lit, lamp) => ui.switches[index].toggles.includes(lamp) ? !lit : lit);
    setLamps(next); setPresses(value => value + 1);
    if (next.every(Boolean)) onSubmit(next);
  }
  return <div className="adv-switches">
    <div className="adv-lamps" aria-label="Lampen">{lamps.map((lit, index) => <span key={index} className={lit ? "is-lit" : ""} role="img" aria-label={`${ui.lamps[index]}: ${lit ? "an" : "aus"}`}><i/>{ui.lamps[index]}</span>)}</div>
    <div className="adv-levers">{ui.switches.map((entry, index) => <button key={entry.label} disabled={disabled} onClick={() => press(index)}><span aria-hidden="true">⏻</span>{entry.label}</button>)}</div>
    <div className="adv-row"><small>{presses} Mal geschaltet</small><button className="memory-secondary" disabled={disabled} onClick={() => { setLamps(ui.start); setPresses(0); }}>Zurücksetzen</button><Check disabled={disabled} onClick={() => onSubmit(lamps)}/></div>
  </div>;
}
