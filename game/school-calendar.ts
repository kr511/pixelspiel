// Felice's school year at the Sekundarschule Zörbig, 2025/26 (Sachsen-Anhalt).
// Every weekday is a school day except holidays, the class trip and anything after the
// certificates on 26.06.2026. Dates from the official holiday calendar (Kalenderpedia).

/** Zeugnisübergabe in der kleinen Turnhalle; afterwards the Sekundarschule is over. */
export const GRADUATION_DAY = "2026-06-26";
const FIRST_SCHOOL_DAY = "2025-11-10";

const BREAKS: [from: string, to: string][] = [
  ["2025-12-22", "2026-01-05"], // Weihnachtsferien
  ["2026-01-31", "2026-02-06"], // Winterferien
  ["2026-03-30", "2026-04-04"], // Osterferien
  ["2026-04-20", "2026-04-24"], // Klassenfahrt nach Kehl
  ["2026-05-26", "2026-05-29"], // Pfingstferien
];
const PUBLIC_HOLIDAYS = ["2026-04-06", "2026-05-01", "2026-05-14", "2026-05-25"]; // Ostermontag, 1. Mai, Himmelfahrt, Pfingstmontag

const weekdayOf = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay();

export function isSchoolDay(date: string) {
  if (date < FIRST_SCHOOL_DAY || date > GRADUATION_DAY) return false;
  const day = weekdayOf(date);
  if (day === 0 || day === 6) return false;
  return !PUBLIC_HOLIDAYS.includes(date) && !BREAKS.some(([from, to]) => date >= from && date <= to);
}

export const schoolOver = (date: string) => date > GRADUATION_DAY;
/** The graduation crowd only stands in the gym from the certificate day on. */
export const graduationHeld = (date: string) => date >= GRADUATION_DAY;
