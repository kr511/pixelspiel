/** Szenen hinter dem Startbildschirm; sie wechseln alle fünf Sekunden. */
export const START_SLIDES = [
  { src: "/rooms/radegast-walk-v075.webp", caption: "Radegast" },
  { src: "/rooms/school-court-secondary-v075.webp", caption: "Sekundarschule Zörbig" },
  { src: "/rooms/zoerbig-market-v09.webp", caption: "Zörbig · Markt" },
] as const;
export const START_SLIDE_MS = 5000;
