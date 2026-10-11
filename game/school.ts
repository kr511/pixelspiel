import { SCHOOL_START } from "./day.ts";
import type { Entity } from "./story.ts";

export const SCHOOL_ARRIVAL = 6 * 60;
export const SCHOOL_ELIAS_ID = "school-elias";

// Morning strangers use existing atlas frames without names or interactions.
// Keep their stable IDs for old saves, but Felice does not know this group yet.
type GroupMember = Pick<Entity, "x" | "y" | "art" | "facing">;
function additionalGroup(group: number, members: GroupMember[]): Entity[] {
  return members.map((member, index) => ({
    ...member, id: `school-group-${group}-${index + 1}`, name: "Schülergruppe",
    kind: "person", ambient: true, text: "Eine Gruppe wartet vor dem Unterricht auf dem Hof.",
  }));
}

export const SCHOOL_ADDITIONAL_GROUPS: Entity[][] = [
  additionalGroup(1, [
    { x: .50525, y: .38875, art: "pupil-three", facing: "right" },
    { x: .52475, y: .42125, art: "pupil-four", facing: "left" },
  ]),
  additionalGroup(2, [
    { x: .3605, y: .67817, art: "pupil-two", facing: "right" },
    { x: .3995, y: .68467, art: "pupil-five", facing: "left" },
    { x: .38, y: .71717, art: "pupil-six", facing: "back" },
  ]),
  additionalGroup(3, [
    { x: .8705, y: .5105, art: "pupil-one", facing: "right" },
    { x: .9095, y: .5105, art: "pupil-two", facing: "left" },
    { x: .8705, y: .5495, art: "pupil-five", facing: "right" },
    { x: .9095, y: .5495, art: "pupil-three", facing: "left" },
  ]),
  additionalGroup(4, [
    { x: .5805, y: .7235, art: "pupil-four", facing: "right" },
    { x: .6195, y: .7365, art: "pupil-six", facing: "left" },
  ]),
  additionalGroup(5, [
    { x: .1305, y: .65583, art: "pupil-five", facing: "right" },
    { x: .1695, y: .65583, art: "pupil-two", facing: "left" },
    { x: .15, y: .68833, art: "pupil-one", facing: "back" },
  ]),
];

export const SCHOOL_MORNING_ENTITIES: Entity[] = [
  { id: SCHOOL_ELIAS_ID, name: "Schüler", x: .83, y: .346, kind: "person", art: "elias", ambient: true, facing: "back", text: "Drei Schüler warten zusammen vor dem Unterricht." },
  { id: "school-paul", name: "Schüler", x: .8105, y: .307, kind: "person", art: "paul", ambient: true, facing: "right", text: "Drei Schüler warten zusammen vor dem Unterricht." },
  { id: "school-justin", name: "Schüler", x: .8495, y: .307, kind: "person", art: "justin", ambient: true, facing: "left", text: "Drei Schüler warten zusammen vor dem Unterricht." },
  { id: "school-pupil-left-1", name: "Schülerin", x: .2405, y: .587, kind: "person", art: "pupil-one", ambient: true, facing: "right", text: "Guten Morgen! Wir treffen uns vor der Schule immer hier auf dem Hof." },
  { id: "school-pupil-left-2", name: "Schüler", x: .2795, y: .587, kind: "person", art: "pupil-two", ambient: true, facing: "left", text: "Wir reden noch kurz, bevor es in die Klasse geht." },
  { id: "school-pupil-left-3", name: "Schülerin", x: .26, y: .626, kind: "person", art: "pupil-three", ambient: true, facing: "back", text: "Gleich geht der Unterricht los. Bis dahin bleiben wir noch zusammen draußen." },
  { id: "school-pupil-right-1", name: "Schüler", x: .8505, y: .827, kind: "person", art: "pupil-four", ambient: true, facing: "right", text: "Morgen! Ein paar Minuten zum Quatschen haben wir noch." },
  { id: "school-pupil-right-2", name: "Schülerin", x: .8895, y: .827, kind: "person", art: "pupil-five", ambient: true, facing: "left", text: "Wir warten hier noch auf den Unterrichtsbeginn." },
  { id: "school-pupil-right-3", name: "Schülerin", x: .87, y: .866, kind: "person", art: "pupil-six", ambient: true, facing: "back", text: "Heute sind schon einige auf dem Pausenhof. Guten Morgen!" },
  ...SCHOOL_ADDITIONAL_GROUPS.flat(),
];

const morningIds = new Set(SCHOOL_MORNING_ENTITIES.map(entity => entity.id));
export function isSchoolMorning(minute: number) { return minute >= SCHOOL_ARRIVAL && minute < SCHOOL_START; }
export function isSchoolMorningEntity(id: string) { return morningIds.has(id); }
