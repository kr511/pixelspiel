import { isRoutineDay } from "./timeline.ts";

// Felice's ordinary school days (10.–12.11.): tracked as timeline flags, one per task and day.
export type RoutineTask = "wake" | "wash" | "school" | "homework" | "sleep";
export const ROUTINE_TASKS: { id: RoutineTask; label: string }[] = [
  { id: "wake", label: "Aufstehen" }, { id: "wash", label: "Frischmachen" }, { id: "school", label: "Schule" },
  { id: "homework", label: "Hausaufgaben" }, { id: "sleep", label: "Schlafen" },
];
/** World items that complete a routine task, with the time they take. */
export const ROUTINE_ITEMS: Record<string, { task: RoutineTask; minutes: number; done: string }> = {
  wash: { task: "wash", minutes: 15, done: "Gesicht gewaschen, Zähne geputzt. Jetzt fühle ich mich wach." },
  homework: { task: "homework", minutes: 60, done: "Die Hausaufgaben sind fertig. Das wäre erledigt." },
};
export const routineFlag = (date: string, task: RoutineTask) => `routine-${date}-${task}`;
export const routineDone = (flags: string[], date: string, task: RoutineTask) => flags.includes(routineFlag(date, task));
export { isRoutineDay };
/** Tasks that must be finished before going to bed. */
export function routineOpen(flags: string[], date: string) {
  return ROUTINE_TASKS.filter(task => task.id !== "sleep" && task.id !== "wake" && !routineDone(flags, date, task.id));
}
