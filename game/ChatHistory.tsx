"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { assetUrl } from "./assets";
import { historicalDate } from "./timeline";

// The full WhatsApp history from scripts/chat-import.mjs. The files live in public/chat/,
// which is git-ignored: only the local version has them; online the tab explains that.
type ChatIndex = { title: string; messages: number; private: number; days: { date: string; count: number }[] };
/** [time, "F" | "E" | "P", text]; "P" is a hidden private passage whose text is the message count. */
type ChatEntry = [string, "F" | "E" | "P", string];
type ChatMonth = Record<string, ChatEntry[]>;

/** From this many messages a day counts as a "long chat day": its messages arrive live in the world. */
export const LIVE_CHAT_MIN = 150;
const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const monthName = (month: string) => `${MONTHS[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`;
const toMinute = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
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

function useChatIndex() {
  const [index, setIndex] = useState<ChatIndex | null | undefined>(undefined);
  useEffect(() => { let alive = true; loadIndex().then(value => { if (alive) setIndex(value); }); return () => { alive = false; }; }, []);
  return index;
}
/** Entries of one day; null while loading or when unavailable. */
function useChatDay(date: string | null) {
  const [loaded, setLoaded] = useState<{ date: string; entries: ChatEntry[] | null } | null>(null);
  useEffect(() => {
    if (!date) return;
    let alive = true;
    loadMonth(date.slice(0, 7)).then(month => { if (alive) setLoaded({ date, entries: month[date] ?? [] }); }).catch(() => { if (alive) setLoaded({ date, entries: null }); });
    return () => { alive = false; };
  }, [date]);
  return { entries: loaded?.date === date ? loaded.entries : null, failed: Boolean(date) && loaded?.date === date && loaded.entries === null };
}

/** Days are readable up to Felice's current in-game date; today only up to the current game time. */
export function ChatHistory({ currentDate, currentMinute = 1439, initialDate = null }: { currentDate: string; currentMinute?: number; initialDate?: string | null }) {
  const index = useChatIndex();
  const [selected, setSelected] = useState<string | null>(initialDate);
  const day = useChatDay(selected);
  const days = useMemo(() => index?.days.filter(day => day.date <= currentDate) ?? [], [index, currentDate]);
  const months = useMemo(() => [...new Set(days.map(day => day.date.slice(0, 7)))].reverse(), [days]);
  const today = selected === currentDate;
  const entries = today ? day.entries?.filter(([time]) => toMinute(time) <= currentMinute) : day.entries;
  const pending = today && day.entries ? day.entries.length - (entries?.length ?? 0) : 0;

  if (index === undefined) return <p className="phone-empty">Chat wird geladen …</p>;
  if (index === null) return <div className="phone-empty"><span aria-hidden="true">💬</span><p>Euer ganzer Chatverlauf ist nur in der Version auf deinem PC.</p></div>;
  if (selected) {
    const position = days.findIndex(day => day.date === selected);
    const previous = days[position - 1]?.date, next = days[position + 1]?.date;
    return <div className="phone-history-detail chat-history-day">
      <button className="phone-back" onClick={() => setSelected(null)}>← Alle Tage</button>
      <h4>{historicalDate(selected)}{today ? " · heute" : ""}</h4>
      {day.failed && <p className="phone-empty">Dieser Tag konnte nicht geladen werden.</p>}
      {!day.failed && !day.entries && <p className="phone-empty">Lädt …</p>}
      {entries?.length === 0 && <p className="phone-empty">Heute habt ihr euch bis jetzt noch nicht geschrieben.</p>}
      {entries?.map(([time, who, text], line) => who === "P"
        ? <p className="chat-private" key={line}>· · · {text === "1" ? "1 private Nachricht" : `${text} private Nachrichten`} ausgeblendet · · ·</p>
        : <div className={`chat-message from-${who === "F" ? "felice" : "elias"}`} key={line}><small>{who === "F" ? "Felice" : "Elias"} · {time}</small><p>{text}</p></div>)}
      {pending > 0 && <p className="chat-private">Im Laufe des Tages kommen noch Nachrichten dazu.</p>}
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
        <span aria-hidden="true">💬</span><div><small>{historicalDate(day.date)}{day.date === currentDate ? " · heute" : ""}</small><strong>{day.count} {day.count === 1 ? "Nachricht" : "Nachrichten"}</strong></div><b aria-hidden="true">→</b>
      </button>)}</div>
    </section>)}
  </>;
}

/**
 * On long chat days the real messages arrive while Felice walks around: whenever the
 * game clock passes a message's time, a small phone notification shows it. Entering a
 * day (load, sleep, calendar jump) never replays what was already sent.
 */
export function LiveChatToast({ date, minute, hidden, onOpen }: { date: string; minute: number; hidden: boolean; onOpen: () => void }) {
  const index = useChatIndex();
  const busy = Boolean(index?.days.find(day => day.date === date && day.count >= LIVE_CHAT_MIN));
  const { entries } = useChatDay(busy ? date : null);
  const sent = useMemo(() => entries?.filter(([time, who]) => who !== "P" && toMinute(time) <= minute) ?? null, [entries, minute]);
  const seen = useRef<{ date: string; count: number } | null>(null);
  const [toast, setToast] = useState<{ lines: ChatEntry[]; more: number } | null>(null);
  useEffect(() => {
    if (!sent) return;
    const previous = seen.current;
    seen.current = { date, count: sent.length };
    if (!previous || previous.date !== date || sent.length <= previous.count) return;
    const fresh = sent.slice(previous.count);
    const show = window.setTimeout(() => setToast({ lines: fresh.slice(-2), more: Math.max(0, fresh.length - 2) }), 0);
    return () => window.clearTimeout(show);
  }, [sent, date]);
  useEffect(() => {
    if (!toast) return;
    const hide = window.setTimeout(() => setToast(null), 7000);
    return () => window.clearTimeout(hide);
  }, [toast]);
  if (!toast || hidden) return null;
  return <button className="live-chat-toast" data-testid="live-chat-toast" onClick={() => { setToast(null); onOpen(); }} aria-label="Neue Nachricht, im Handy lesen">
    <small>💬 {index?.title ?? "WhatsApp"}{toast.more ? ` · +${toast.more} weitere` : ""}</small>
    {toast.lines.map(([time, who, text], line) => <span key={line}><b>{who === "F" ? "Felice" : "Elias"} · {time}</b>{text.length > 140 ? `${text.slice(0, 140)} …` : text}</span>)}
  </button>;
}
