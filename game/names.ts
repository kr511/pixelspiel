import { ENTITIES, type Entity, type Place } from "./story.ts";

export const NAMES_KEY = "felice-elias.names.v07";
export const NAME_MODES = ["always", "nearby", "friends"] as const;
export type NameMode = typeof NAME_MODES[number];
export type NameSave = { version: 1; names: Record<string, string>; visibility: NameMode };
export const PEOPLE = Object.entries(ENTITIES).flatMap(([place, entities]) => entities.filter(entity => entity.kind === "person" && entity.art !== "elias").map(entity => ({ ...entity, place: place as Place })));
const ids = new Set(PEOPLE.map(entity => entity.id));
export function initialNames(): NameSave { return { version: 1, names: {}, visibility: "always" }; }
export function displayName(entity: Entity, save: NameSave): string { return save.names[entity.id] ?? entity.name; }
export function renamePerson(save: NameSave, id: string, value: string): NameSave {
  if (!ids.has(id)) throw new Error("Unbekannte Figur");
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length > 32 || /[\u0000-\u001f\u007f]/.test(name)) throw new Error("Der Name darf höchstens 32 Zeichen enthalten.");
  const names = { ...save.names };
  if (name) names[id] = name; else delete names[id];
  return { ...save, names };
}
export function parseNames(raw: string | null): NameSave {
  if (!raw) return initialNames();
  const value = JSON.parse(raw);
  if (value?.version !== 1 || !NAME_MODES.includes(value.visibility) || !value.names || typeof value.names !== "object" || Array.isArray(value.names)) throw new Error("Unbekannter Namensstand");
  let save: NameSave = { version: 1, visibility: value.visibility, names: {} };
  for (const [id, name] of Object.entries(value.names)) {
    if (typeof name !== "string") throw new Error("Unbekannter Name");
    save = renamePerson(save, id, name);
  }
  return save;
}
