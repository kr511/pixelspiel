import { SCHOOL_START } from "./day.ts";
import type { Entity, Point } from "./story.ts";

export const SCHOOL_ARRIVAL = 6 * 60;
export const SCHOOL_ELIAS_ID = "school-elias";

// Pupils stand in small circles and look at each other.
type Facing = NonNullable<Entity["facing"]>;
export type Spot = Point & { facing: Facing };
export function ringFormation(center: Point, count: number, radius: number, start = 0): Spot[] {
  if (count === 2) return [{ x: center.x - radius, y: center.y, facing: "right" }, { x: center.x + radius, y: center.y, facing: "left" }];
  return Array.from({ length: count }, (_, i) => {
    const angle = (start + i / count) * Math.PI * 2;
    const x = center.x + Math.sin(angle) * radius, y = center.y - Math.cos(angle) * radius;
    const dx = center.x - x, dy = center.y - y;
    return { x: +x.toFixed(3), y: +y.toFixed(3), facing: Math.abs(dx) > Math.abs(dy) ? dx > 0 ? "right" : "left" : dy > 0 ? "front" : "back" };
  });
}

// Morning strangers use existing atlas frames without names or interactions.
// Keep their stable IDs for old saves, but Felice does not know this group yet.
const ARRIVALS = ["school-group-2-3", "school-group-4-2", "school-group-5-3"];
function additionalGroup(group: number, center: Point, art: string[], radius: number): Entity[] {
  return ringFormation(center, art.length, radius).map((spot, index) => ({
    ...spot, id: `school-group-${group}-${index + 1}`, art: art[index], name: "Schülergruppe",
    kind: "person", ambient: true, text: ARRIVALS.includes(`school-group-${group}-${index + 1}`) ? "Guten Morgen! Ich bin gerade mit dem Bus angekommen." : "Eine Gruppe wartet vor dem Unterricht auf dem Hof.",
  }));
}

export const SCHOOL_ADDITIONAL_GROUPS: Entity[][] = [
  additionalGroup(1, { x: .515, y: .41 }, ["pupil-three", "pupil-four"], .03),
  additionalGroup(2, { x: .38, y: .69 }, ["pupil-two", "pupil-five", "pupil-six"], .04),
  additionalGroup(3, { x: .885, y: .53 }, ["pupil-one", "pupil-two", "pupil-five", "pupil-three"], .05),
  additionalGroup(4, { x: .60, y: .73 }, ["pupil-one", "pupil-two"], .035),
  additionalGroup(5, { x: .15, y: .675 }, ["pupil-five", "pupil-two", "pupil-one"], .04),
];

function trio(prefix: string, center: Point, people: { art: string; name: string; text: string }[]): Entity[] {
  return ringFormation(center, people.length, .04).map((spot, i) => ({ ...spot, id: `${prefix}${i + 1}`, kind: "person", ambient: true, ...people[i] }));
}
const LEFT = ["Guten Morgen! Wir treffen uns vor der Schule immer hier auf dem Hof.", "Wir reden noch kurz, bevor es in die Klasse geht.", "Gleich geht der Unterricht los. Bis dahin bleiben wir noch zusammen draußen."];
const RIGHT = ["Morgen! Ein paar Minuten zum Quatschen haben wir noch.", "Wir warten hier noch auf den Unterrichtsbeginn.", "Heute sind schon einige auf dem Pausenhof. Guten Morgen!"];
const WAITING = "Drei Schüler warten zusammen vor dem Unterricht.";

export const SCHOOL_MORNING_ENTITIES: Entity[] = [
  ...ringFormation({ x: .83, y: .325 }, 3, .04).map((spot, i) => ({ ...spot, id: [SCHOOL_ELIAS_ID, "school-paul", "school-justin"][i], name: "Schüler", kind: "person" as const, art: ["elias", "paul", "justin"][i], ambient: true, text: WAITING })),
  ...trio("school-pupil-left-", { x: .26, y: .61 }, [{ art: "pupil-one", name: "Schülerin", text: LEFT[0] }, { art: "pupil-two", name: "Schüler", text: LEFT[1] }, { art: "pupil-three", name: "Schülerin", text: LEFT[2] }]),
  ...trio("school-pupil-right-", { x: .87, y: .86 }, [{ art: "pupil-four", name: "Schüler", text: RIGHT[0] }, { art: "pupil-five", name: "Schülerin", text: RIGHT[1] }, { art: "pupil-six", name: "Schülerin", text: RIGHT[2] }]),
  ...SCHOOL_ADDITIONAL_GROUPS.flat(),
];

const morningIds = new Set(SCHOOL_MORNING_ENTITIES.map(entity => entity.id));
const arrivalIds = new Set(ARRIVALS);
export function isSchoolMorning(minute: number) { return minute >= SCHOOL_ARRIVAL && minute < SCHOOL_START; }
export function isSchoolMorningEntity(id: string) { return morningIds.has(id); }
/** These pupils come from the market after the others and join their group; see school-dismissal.ts. */
export const SCHOOL_ARRIVAL_IDS = ARRIVALS;
export function isSchoolArrival(id: string) { return arrivalIds.has(id); }
