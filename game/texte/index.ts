// Alle Originalzeilen, nach Ereignis-ID. Eine Datei pro Kapitel, damit Texte
// ohne Spielcode gegengelesen und geändert werden können.
import type { OriginalChat } from "./chat.ts";
import { KAPITEL_1 } from "./kapitel-1.ts";
import { KAPITEL_2 } from "./kapitel-2.ts";
import { KAPITEL_3 } from "./kapitel-3.ts";
import { KAPITEL_4 } from "./kapitel-4.ts";
import { KAPITEL_5 } from "./kapitel-5.ts";
import { KAPITEL_6 } from "./kapitel-6.ts";
import { KAPITEL_7 } from "./kapitel-7.ts";
import { KAPITEL_8 } from "./kapitel-8.ts";

export type { ChatLine, ChatSpeaker, ChatThread, OriginalChat } from "./chat.ts";
export const ORIGINAL_CHATS: Record<string, OriginalChat> = {
  ...KAPITEL_1, ...KAPITEL_2, ...KAPITEL_3, ...KAPITEL_4, ...KAPITEL_5, ...KAPITEL_6, ...KAPITEL_7, ...KAPITEL_8,
};
