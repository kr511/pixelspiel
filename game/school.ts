import { SCHOOL_START } from "./day.ts";
import type { Entity } from "./story.ts";

export const SCHOOL_ARRIVAL = 6 * 60;
export const SCHOOL_ELIAS_ID = "school-elias";

// Morning groups use existing atlas frames; the unnamed pupils are scenery.
// Elias waits with his own friends, apart from the group at the window grilles.
export const SCHOOL_MORNING_ENTITIES: Entity[] = [
  { id: SCHOOL_ELIAS_ID, name: "Elias", x: .81, y: .37, kind: "person", art: "elias", text: "Guten Morgen! Wir warten hier noch zusammen, bis der Unterricht beginnt." },
  { id: "school-paul", name: "Paul", x: .79, y: .29, kind: "person", art: "paul", text: "Morgen, Felice! Justin, Elias und ich reden noch ein bisschen vor dem Unterricht." },
  { id: "school-justin", name: "Justin", x: .87, y: .31, kind: "person", art: "justin", text: "Hey Felice! Wir sind schon da. Bis zum Unterricht ist noch etwas Zeit." },
  { id: "school-pupil-left-1", name: "Schülerin", x: .22, y: .57, kind: "person", art: "pupil-one", ambient: true, facing: "right", text: "Guten Morgen! Wir treffen uns vor der Schule immer hier auf dem Hof." },
  { id: "school-pupil-left-2", name: "Schüler", x: .30, y: .58, kind: "person", art: "pupil-two", ambient: true, facing: "left", text: "Wir reden noch kurz, bevor es in die Klasse geht." },
  { id: "school-pupil-left-3", name: "Schülerin", x: .26, y: .66, kind: "person", art: "pupil-three", ambient: true, facing: "back", text: "Gleich geht der Unterricht los. Bis dahin bleiben wir noch zusammen draußen." },
  { id: "school-pupil-right-1", name: "Schüler", x: .83, y: .82, kind: "person", art: "pupil-four", ambient: true, facing: "right", text: "Morgen! Ein paar Minuten zum Quatschen haben wir noch." },
  { id: "school-pupil-right-2", name: "Schülerin", x: .91, y: .81, kind: "person", art: "pupil-five", ambient: true, facing: "left", text: "Wir warten hier noch auf den Unterrichtsbeginn." },
  { id: "school-pupil-right-3", name: "Schülerin", x: .87, y: .90, kind: "person", art: "pupil-six", ambient: true, facing: "back", text: "Heute sind schon einige auf dem Pausenhof. Guten Morgen!" },
];

const morningIds = new Set(SCHOOL_MORNING_ENTITIES.map(entity => entity.id));
export function isSchoolMorning(minute: number) { return minute >= SCHOOL_ARRIVAL && minute < SCHOOL_START; }
export function isSchoolMorningEntity(id: string) { return morningIds.has(id); }
