// Originalzeilen aus dem WhatsApp-Chat „Felinchen❤️“, ausgewählt nach Datum.
// Jede Zeile steht wortgetreu mit ihrer echten Uhrzeit; Tippfehler und Emojis bleiben.
// Ausgewählt sind kurze, schöne Stellen. Familie, Gesundheit, frühere Beziehungen
// und Intimes bleiben bewusst draußen. Die Uhrzeit gehört immer zum Datum des Ereignisses.

export type ChatSpeaker = "Felice" | "Elias";
/** One real message: "HH:MM", speaker, exact text. */
export type ChatLine = [time: string, speaker: ChatSpeaker, text: string];
/** One conversation thread of an evening, playable as a chat topic. */
export type ChatThread = { id: string; title: string; icon: string; lines: ChatLine[] };
/** Real chat material for one story event (keyed by event id). */
export type OriginalChat = {
  /** Date of all lines, YYYY-MM-DD. Must match the event's date. */
  date: string;
  /** Short excerpt shown in the album and, for phone scenes, as the scene itself. */
  lines?: ChatLine[];
  /** Threads the player picks from on a chat evening. */
  threads?: ChatThread[];
};
