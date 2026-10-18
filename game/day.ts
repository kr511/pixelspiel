import type { Place, Point } from "./story";

export const DAY_KEY = "felice-elias.day.v061";
export const ACTION_MINUTES = 10;
export const WAKE_MINUTE = 5 * 60 + 30; // Aufstehzeit: jeden Morgen 5:30 Uhr
export const TRAVEL_MINUTES = 15; // Fallback für Wege ohne eigenen Eintrag
// Wegzeiten in Minuten je Strecke (in beide Richtungen). Kurze Wege im Haus, Bus als längster Abschnitt.
const TRAVEL_TIMES: [Place, Place, number][] = [
  ["bedroom", "home", 5], ["home", "kitchen", 5], ["home", "garden", 5], ["home", "radegast", 5], ["garden", "radegast", 5],
  ["radegast", "bus", 10], ["radegast", "playground", 10],
  ["bus", "zoerbig", 20], ["bus", "goelzau", 15], ["goelzau", "range", 10],
  ["zoerbig", "school", 10], ["zoerbig", "schoolway", 5], ["schoolway", "school", 5], ["school", "gym", 5],
  ["zoerbig", "christmasmarket", 10], ["zoerbig", "eliasroom", 10],
  // Klassenfahrt: verkürzte Spielwege.
  ["zoerbig", "hotel", 30], ["hotel", "hotelboys", 2], ["hotel", "parliament", 30], ["hotel", "europapark", 30],
];
export function travelMinutes(from: Place, to: Place) {
  return TRAVEL_TIMES.find(([a, b]) => a === from && b === to || a === to && b === from)?.[2] ?? TRAVEL_MINUTES;
}
export const SCHOOL_START = 7 * 60 + 15;
export const SCHOOL_END = 13 * 60;
export const NOTICE_TIMES = [8, 12, 15, 18, 21, 24].map(hour => hour * 60);
export const SEASONS = ["Frühling", "Sommer", "Herbst", "Winter"] as const;
export type Season = typeof SEASONS[number];
export type DaySave = { version: 1; date: string; minute: number; day: number; season: Season };
export type DayNotice = { date: string; minute: number };
export type RestSpot = { id: string; place: Place; name: string; kind: "bench" | "bed" | "chair"; approach: Point; position: Point; companion?: Point; furniture?: Point };

export function initialDay(now = new Date()): DaySave {
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const month = now.getMonth();
  const season = month >= 2 && month <= 4 ? "Frühling" : month >= 5 && month <= 7 ? "Sommer" : month >= 8 && month <= 10 ? "Herbst" : "Winter";
  return { version: 1, date, minute: WAKE_MINUTE, day: 1, season };
}
function validDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(`${value}T12:00:00Z`))
    && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
}
function nextDate(date: string, days: number) {
  const next = new Date(`${date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}
export function parseDay(raw: string | null): DaySave {
  if (!raw) return initialDay();
  const value = JSON.parse(raw);
  if (value?.version !== 1 || !validDate(value.date) || !Number.isInteger(value.minute)
    || value.minute < 0 || value.minute >= 1440 || !Number.isInteger(value.day) || value.day < 1
    || !SEASONS.includes(value.season)) {
    throw new Error("Unbekannter Tagesstand");
  }
  return { version: 1, date: value.date, minute: value.minute, day: value.day, season: value.season };
}
export function advanceClock(save: DaySave, minutes: number): { save: DaySave; notices: DayNotice[] } {
  if (!Number.isInteger(minutes) || minutes < 0) throw new Error("Ungültige Aktionsdauer");
  const total = save.minute + minutes;
  const days = Math.floor(total / 1440);
  const notices: DayNotice[] = [];
  for (let offset = 0; offset <= days; offset++) {
    for (const minute of NOTICE_TIMES) {
      const at = offset * 1440 + minute;
      if (at > save.minute && at <= total) notices.push({ date: nextDate(save.date, offset), minute });
    }
  }
  return { save: { ...save, date: nextDate(save.date, days), day: save.day + days, minute: total % 1440 }, notices };
}
// Sleep deliberately skips every notice until the next morning.
export function sleepUntilMorning(save: DaySave): DaySave {
  const days = save.minute < WAKE_MINUTE ? 0 : 1;
  return { ...save, date: nextDate(save.date, days), day: save.day + days, minute: WAKE_MINUTE };
}
export function clockText(minute: number) {
  return `${Math.floor(minute / 60)}:${String(minute % 60).padStart(2, "0")}`;
}
export function activityAt(place: Place, minute: number) {
  if (place === "kitchen") return "Zuhause · Küche";
  if (place === "bedroom" || place === "home" || place === "garden") return "Zuhause";
  if (place === "range") return "Schießen · Gölzau";
  if (place === "goelzau") return "Gölzau · Auf dem Weg zum Schießen";
  if (place === "radegast") return "Radegast · Auf dem Weg zur Haltestelle";
  if (place === "schoolway") return "Zörbig · Schulweg";
  if (place === "zoerbig") return "Zörbig · Markt";
  if (place === "gym") return "Kleine Turnhalle";
  if (place === "playground") return "Spielplatz · Zeit draußen";
  if (place === "christmasmarket") return "Weihnachtsmarkt · Lichter und Winterluft";
  if (place === "eliasroom") return "Bei Elias zu Hause";
  if (place === "hotel" || place === "hotelboys") return "Klassenfahrt · Hotel in Kehl";
  if (place === "parliament") return "Klassenfahrt · Straßburg";
  if (place === "europapark") return "Klassenfahrt · Europa-Park";
  if (place === "school") return minute >= SCHOOL_START && minute < SCHOOL_END ? "Schule · Unterrichtszeit" : "Schule · Schulhof";
  return "Radegast · Haltestelle";
}

// Soft seasonal dawn/dusk for the atmosphere around Radegast.
const DAYLIGHT: Record<Season, [number, number]> = { Frühling: [360, 1200], Sommer: [285, 1290], Herbst: [420, 1080], Winter: [480, 990] };
export function seasonalLight(season: Season, minute: number) {
  const [dawn, dusk] = DAYLIGHT[season];
  const daylight = Math.max(0, Math.min(1, (minute - dawn + 45) / 90, (dusk + 45 - minute) / 90));
  return { daylight, season };
}

// How deep the night gets: winter nights are properly dark, short summer nights stay fairly bright.
const NIGHT_DEPTH: Record<Season, number> = { Frühling: .78, Sommer: .55, Herbst: .92, Winter: 1.12 };
const OUTDOOR_SHADE = .76; // Garten und Schulhof
const TOWN_SHADE = .62; // restliche Außenorte
const INDOOR_SHADE = .18;
const TOWN_PLACES: Place[] = ["bus", "radegast", "zoerbig", "schoolway", "goelzau", "playground", "christmasmarket", "parliament", "europapark"];
export function nightShade(place: Place, season: Season, daylight: number) {
  const base = place === "garden" || place === "school" ? OUTDOOR_SHADE : TOWN_PLACES.includes(place) ? TOWN_SHADE : INDOOR_SHADE;
  return Math.min(.9, (1 - daylight) * base * NIGHT_DEPTH[season]);
}

export const REST_SPOTS: RestSpot[] = [
  { id: "playground-bench", place: "playground", name: "Unsere Parkbank", kind: "bench", approach: { x: .43, y: .585 }, position: { x: .405, y: .515 }, companion: { x: .47, y: .515 } },
  { id: "market-bench", place: "christmasmarket", name: "Bank unter den Lichtern", kind: "bench", approach: { x: .78, y: .77 }, position: { x: .75, y: .715 }, companion: { x: .81, y: .715 } },
  { id: "elias-desk", place: "eliasroom", name: "Stuhl am Computer", kind: "chair", approach: { x: .30, y: .465 }, position: { x: .30, y: .405 }, companion: { x: .37, y: .405 } },
  { id: "elias-bed-edge", place: "eliasroom", name: "Elias’ Bettkante", kind: "chair", approach: { x: .735, y: .545 }, position: { x: .70, y: .48 }, companion: { x: .78, y: .48 } },
  { id: "elias-bed", place: "eliasroom", name: "Elias’ Bett", kind: "bed", approach: { x: .62, y: .58 }, position: { x: .755, y: .335 }, companion: { x: .70, y: .335 } },
  { id: "felice-desk", place: "bedroom", name: "Stuhl am Schreibtisch", kind: "chair", approach: { x: .60, y: .395 }, position: { x: .625, y: .315 }, companion: { x: .705, y: .325 } },
  { id: "felice-bed-edge", place: "bedroom", name: "Bettkante", kind: "chair", approach: { x: .48, y: .475 }, position: { x: .45, y: .40 }, companion: { x: .51, y: .40 } },
  { id: "home-sofa", place: "home", name: "Sofa im Wohnzimmer", kind: "chair", approach: { x: .36, y: .48 }, position: { x: .275, y: .412 }, companion: { x: .345, y: .412 } },
  { id: "kitchen-chairs", place: "kitchen", name: "Stuhl am Küchentisch", kind: "chair", approach: { x: .7, y: .64 }, position: { x: .654, y: .582 }, companion: { x: .783, y: .582 } },
  { id: "hotel-bed", place: "hotel", name: "Bett im Hotel", kind: "bed", approach: { x: .21, y: .50 }, position: { x: .21, y: .30 } },
  { id: "hotelboys-tv", place: "hotelboys", name: "Bettkante vor dem Fernseher", kind: "chair", approach: { x: .54, y: .46 }, position: { x: .54, y: .37 }, companion: { x: .60, y: .37 } },
  { id: "felice-bed", place: "bedroom", name: "Felices Bett", kind: "bed", approach: { x: .38, y: .49 }, position: { x: .385, y: .385 } },
  { id: "garden-bench", place: "garden", name: "Gartenbank", kind: "bench", approach: { x: .25, y: .65 }, position: { x: .215, y: .602 }, companion: { x: .28, y: .602 }, furniture: { x: .25, y: .61 } },
  { id: "bus-bench", place: "bus", name: "Bank an der Haltestelle", kind: "bench", approach: { x: .33, y: .485 }, position: { x: .312, y: .419 }, companion: { x: .362, y: .419 } },
  { id: "school-bench", place: "school", name: "Sitzrand am vorderen Baum", kind: "bench", approach: { x: .738, y: .738 }, position: { x: .711, y: .681 }, companion: { x: .768, y: .690 } },
  { id: "school-bench-right", place: "school", name: "Sitzmauer am Gehweg", kind: "bench", approach: { x: .582, y: .867 }, position: { x: .493, y: .846 }, companion: { x: .543, y: .883 } },
  { id: "range-bench", place: "range", name: "Bank am Schießstand", kind: "bench", approach: { x: .76, y: .89 }, position: { x: .725, y: .835 }, companion: { x: .79, y: .835 }, furniture: { x: .76, y: .845 } },
];
