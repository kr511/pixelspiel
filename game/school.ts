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
    { x: .50, y: .38, art: "pupil-three", facing: "right" },
    { x: .53, y: .43, art: "pupil-four", facing: "left" },
  ]),
  additionalGroup(2, [
    { x: .35, y: .67, art: "pupil-two", facing: "right" },
    { x: .41, y: .68, art: "pupil-five", facing: "left" },
    { x: .38, y: .73, art: "pupil-six", facing: "back" },
  ]),
  additionalGroup(3, [
    { x: .85, y: .49, art: "pupil-one", facing: "right" },
    { x: .92, y: .50, art: "pupil-two", facing: "left" },
    { x: .85, y: .58, art: "pupil-five", facing: "back" },
    { x: .92, y: .59, art: "pupil-three", facing: "back" },
  ]),
  additionalGroup(4, [
    { x: .56, y: .72, art: "pupil-four", facing: "right" },
    { x: .63, y: .74, art: "pupil-six", facing: "left" },
  ]),
  additionalGroup(5, [
    { x: .11, y: .65, art: "pupil-five", facing: "right" },
    { x: .19, y: .65, art: "pupil-two", facing: "left" },
    { x: .15, y: .69, art: "pupil-one", facing: "back" },
  ]),
];

export const SCHOOL_MORNING_ENTITIES: Entity[] = [
  { id: SCHOOL_ELIAS_ID, name: "Schüler", x: .81, y: .37, kind: "person", art: "elias", ambient: true, facing: "back", text: "Drei Schüler warten zusammen vor dem Unterricht." },
  { id: "school-paul", name: "Schüler", x: .79, y: .29, kind: "person", art: "paul", ambient: true, facing: "right", text: "Drei Schüler warten zusammen vor dem Unterricht." },
  { id: "school-justin", name: "Schüler", x: .87, y: .31, kind: "person", art: "justin", ambient: true, facing: "left", text: "Drei Schüler warten zusammen vor dem Unterricht." },
  { id: "school-pupil-left-1", name: "Schülerin", x: .22, y: .57, kind: "person", art: "pupil-one", ambient: true, facing: "right", text: "Guten Morgen! Wir treffen uns vor der Schule immer hier auf dem Hof." },
  { id: "school-pupil-left-2", name: "Schüler", x: .30, y: .58, kind: "person", art: "pupil-two", ambient: true, facing: "left", text: "Wir reden noch kurz, bevor es in die Klasse geht." },
  { id: "school-pupil-left-3", name: "Schülerin", x: .26, y: .66, kind: "person", art: "pupil-three", ambient: true, facing: "back", text: "Gleich geht der Unterricht los. Bis dahin bleiben wir noch zusammen draußen." },
  { id: "school-pupil-right-1", name: "Schüler", x: .83, y: .82, kind: "person", art: "pupil-four", ambient: true, facing: "right", text: "Morgen! Ein paar Minuten zum Quatschen haben wir noch." },
  { id: "school-pupil-right-2", name: "Schülerin", x: .91, y: .81, kind: "person", art: "pupil-five", ambient: true, facing: "left", text: "Wir warten hier noch auf den Unterrichtsbeginn." },
  { id: "school-pupil-right-3", name: "Schülerin", x: .87, y: .90, kind: "person", art: "pupil-six", ambient: true, facing: "back", text: "Heute sind schon einige auf dem Pausenhof. Guten Morgen!" },
  ...SCHOOL_ADDITIONAL_GROUPS.flat(),
];

const morningIds = new Set(SCHOOL_MORNING_ENTITIES.map(entity => entity.id));
export function isSchoolMorning(minute: number) { return minute >= SCHOOL_ARRIVAL && minute < SCHOOL_START; }
export function isSchoolMorningEntity(id: string) { return morningIds.has(id); }
