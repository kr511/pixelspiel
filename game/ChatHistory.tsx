"use client";

import { useEffect, useMemo, useState } from "react";
import { assetUrl } from "./assets";
import { historicalDate } from "./timeline";

// The full WhatsApp history from scripts/chat-import.mjs. The files live in public/chat/,
// which is git-ignored: only the local version has them; online the tab explains that.
type ChatIndex = { title: string; messages: number; private: number; days: { date: string; count: number }[] };
/** [time, "F" | "E" | "P", text]; "P" is a hidden private passage whose text is the message count. */
type ChatEntry = [string, "F" | "E" | "P", string];
type ChatMonth = Record<string, ChatEntry[]>;

const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const monthName = (month: string) => `${MONTHS[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`;
const monthCache = new Map<string, Promise<ChatMonth>>();
let indexCache: Promise<ChatIndex | null> | null = null;
const loadIndex = () => indexCache ??= fetch(assetUrl("/chat/index.json")).then(response => response.ok ? response.json() as Promise<ChatIndex> : null).catch(() => null);
function loadMonth(month: string) {
  if (!monthCache.has(month)) monthCache.set(month, fetch(assetUrl(`/chat/${month}.json`)).then(response => {
    if (!response.ok) throw new Error(month);
    return response.json() as Promise<ChatMonth>;
  }));
  return monthCache.get(month)!;
}

/** Days are readable up to Felice's current in-game date. */
export function ChatHistory({ currentDate }: { currentDate: string }) {
  const [index, setIndex] = useState<ChatIndex | null | undefined>(undefined);
  const [selected, setSelected] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<{ date: string; entries: ChatEntry[] | null } | null>(null);
  const entries = loaded?.date === selected ? loaded.entries : null;
  const failed = loaded?.date === selected && loaded.entries === null;
  useEffect(() => { let alive = true; loadIndex().then(value => { if (alive) setIndex(value); }); return () => { alive = false; }; }, []);
  const days = useMemo(() => index?.days.filter(day => day.date <= currentDate) ?? [], [index, currentDate]);
  const months = useMemo(() => [...new Set(days.map(day => day.date.slice(0, 7)))].reverse(), [days]);
  useEffect(() => {
    if (!selected) return;
    let alive = true;
    loadMonth(selected.slice(0, 7)).then(month => { if (alive) setLoaded({ date: selected, entries: month[selected] ?? [] }); }).catch(() => { if (alive) setLoaded({ date: selected, entries: null }); });
    return () => { alive = false; };
  }, [selected]);

  if (index === undefined) return <p className="phone-empty">Chat wird geladen …</p>;
  if (index === null) return <div className="phone-empty"><span aria-hidden="true">💬</span><p>Euer ganzer Chatverlauf ist nur in der lokalen Version auf deinem PC enthalten. Dort einmal <code>node scripts/chat-import.mjs</code> ausführen.</p></div>;
  if (selected) {
    const position = days.findIndex(day => day.date === selected);
    const previous = days[position - 1]?.date, next = days[position + 1]?.date;
    return <div className="phone-history-detail chat-history-day">
      <button className="phone-back" onClick={() => setSelected(null)}>← Alle Tage</button>
      <h4>{historicalDate(selected)}</h4>
      {failed && <p className="phone-empty">Dieser Tag konnte nicht geladen werden.</p>}
      {!failed && !entries && <p className="phone-empty">Lädt …</p>}
      {entries?.map(([time, who, text], line) => who === "P"
        ? <p className="chat-private" key={line}>· · · {text === "1" ? "1 private Nachricht" : `${text} private Nachrichten`} ausgeblendet · · ·</p>
        : <div className={`chat-message from-${who === "F" ? "felice" : "elias"}`} key={line}><small>{who === "F" ? "Felice" : "Elias"} · {time}</small><p>{text}</p></div>)}
      <div className="chat-day-nav">
        <button disabled={!previous} onClick={() => previous && setSelected(previous)}>← Tag davor</button>
        <button disabled={!next} onClick={() => next && setSelected(next)}>Nächster Tag →</button>
      </div>
    </div>;
  }
  return <>
    <div className="phone-page-heading"><small>WHATSAPP · {index.title}</small><h3>Euer ganzer Chat</h3><p>Alle Nachrichten bis zum {historicalDate(currentDate)}, wortgetreu mit Uhrzeit. Intime Stellen sind ausgeblendet.</p></div>
    {days.length === 0 && <p className="phone-empty">Bis zu diesem Tag habt ihr euch noch nicht geschrieben.</p>}
    {months.map(month => <section key={month} className="chat-history-month" aria-label={monthName(month)}>
      <h4>{monthName(month)}</h4>
      <div className="phone-list">{days.filter(day => day.date.startsWith(month)).reverse().map(day => <button className="phone-event-row" key={day.date} onClick={() => setSelected(day.date)}>
        <span aria-hidden="true">💬</span><div><small>{historicalDate(day.date)}</small><strong>{day.count} {day.count === 1 ? "Nachricht" : "Nachrichten"}</strong></div><b aria-hidden="true">→</b>
      </button>)}</div>
    </section>)}
  </>;
}
