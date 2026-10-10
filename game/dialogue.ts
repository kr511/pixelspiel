/** Presentation only: this module never changes the historical story or calendar. */
export type Emotion = "neutral" | "happy" | "love" | "shy" | "sad" | "laughing" | "thoughtful" | "surprised";
export const EMOTIONS: readonly Emotion[] = ["neutral", "happy", "love", "shy", "sad", "laughing", "thoughtful", "surprised"];
export const EMOTION_NAMES: Record<Emotion, string> = {
  neutral: "neutral", happy: "glücklich", love: "verliebt", shy: "verlegen",
  sad: "traurig", laughing: "lachend", thoughtful: "nachdenklich", surprised: "überrascht",
};

const SPEAKERS: Record<string, string> = {
  felice: "felice", elias: "elias", "felice & elias": "elias", anuk: "dog",
  "felices mutter": "mother", mutter: "mother", "felices stiefvater": "stepfather",
  "felices halbschwester": "halfsister", "freund der halbschwester": "partner-one",
  "tochter des stiefvaters": "stepsister", "ihr freund": "partner-two", freunde: "friend",
  "am schießstand": "host", "trainer hans": "hans", hans: "hans", "trainer fritz": "fritz", fritz: "fritz",
  paul: "paul", justin: "justin", schulleiter: "host", bürgermeister: "stepfather",
  elena: "elena", jason: "jason", luca: "luca", wyatt: "wyatt", ida: "ida", helena: "helena",
  linda: "linda", lina: "lina", alexandra: "alexandra", alexander: "alexander", magdalena: "magdalena",
  erzählung: "narrator", "unsere geschichte": "narrator",
};

/** An explicit existing asset ID takes precedence; unknown NPC names stay distinct. */
export function portraitIdForSpeaker(speaker: string, art?: string): string {
  if (art?.trim()) return art.trim().toLowerCase();
  const name = speaker.trim().toLowerCase();
  return SPEAKERS[name] ?? `npc:${name || "unbekannt"}`;
}

/** Optional fallback for old dialogue data. Authored emotion always takes precedence. */
export function dialogueEmotion(text: string, explicit?: Emotion): Emotion {
  if (explicit) return explicit;
  if (/\b(haha|hihi|lachen|lachend|lustig)\b/i.test(text)) return "laughing";
  if (/ich liebe dich|verliebt|kuss|küssen|herz|♥|❤️/i.test(text)) return "love";
  if (/verlegen|unbeholfen|unsicher|unangenehm|schüchtern|nervös/i.test(text)) return "shy";
  if (/traurig|vermiss|weinen|tut mir leid/i.test(text)) return "sad";
  if (/überrascht|wirklich\?|oh!|wow|staunen/i.test(text)) return "surprised";
  if (/nachdenk|gedanken|universum|weltall|leben und tod|zukunft|philosoph/i.test(text)) return "thoughtful";
  if (/freu|schön|danke|lächel|glücklich|gemütlich/i.test(text)) return "happy";
  return "neutral";
}

/** Split by visible characters, keeping combined emoji and accents intact. */
export function dialogueCharacters(text: string): string[] {
  if (typeof Intl.Segmenter === "function") return Array.from(new Intl.Segmenter("de", { granularity: "grapheme" }).segment(text), entry => entry.segment);
  return Array.from(text);
}

export function nextVisibleLength(current: number, total: number): number {
  return Math.min(Math.max(0, total), Math.max(0, current) + 1);
}

export function dialogueAdvanceIntent({ blocked, visible, total, choiceCount }: {
  blocked: boolean; visible: number; total: number; choiceCount: number;
}): "blocked" | "reveal" | "choose" | "advance" {
  if (blocked) return "blocked";
  if (visible < total) return "reveal";
  return choiceCount > 1 ? "choose" : "advance";
}

/** Stable decoration for NPCs that share one of the original atlas frames. */
export function portraitSeed(id: string): number {
  let value = 2166136261;
  for (const character of id) { value ^= character.codePointAt(0) ?? 0; value = Math.imul(value, 16777619); }
  return value >>> 0;
}
