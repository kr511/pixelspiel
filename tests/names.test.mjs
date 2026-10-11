import test from "node:test";
import assert from "node:assert/strict";
import { PEOPLE, displayName, initialNames, parseNames, renamePerson } from "../game/names.ts";
import { SCHOOL_MORNING_ENTITIES } from "../game/school.ts";

test("Alle neun bisher genannten Freunde sind in der Namensliste enthalten", () => {
  for (const name of ["Elena", "Jason", "Luca", "Wyatt", "Ida", "Helena", "Linda", "Lina", "Alexandra"]) assert.ok(PEOPLE.some(person => person.name === name), name);
});
test("Ein ergänzter Familienname wird gespeichert und ändert keine Figuren-ID", () => {
  const person = PEOPLE.find(person => person.id === "family");
  const save = parseNames(JSON.stringify(renamePerson(initialNames(), person.id, "  Beispielname  ")));
  assert.equal(displayName(person, save), "Beispielname");
  assert.equal(person.id, "family");
  assert.equal(displayName(person, renamePerson(save, person.id, "")), "Felices Mutter");
});
test("Hintergrundschüler fehlen im Namenseditor, bestehende Namensstände bleiben lesbar", () => {
  assert.ok(!PEOPLE.some(person => person.id.startsWith("school-pupil-")));
  assert.ok(!PEOPLE.some(person => person.id.startsWith("school-group-") || person.id === "school-paul" || person.id === "school-justin"));
  assert.ok(PEOPLE.some(person => person.id === "paul"), "Paul bleibt in seinen späteren Szenen benannt");
  const save = parseNames(JSON.stringify({ ...initialNames(), names: { "school-pupil-left-1": "Alter Schülername", "school-paul": "Pauli" } }));
  assert.equal(save.names["school-pupil-left-1"], "Alter Schülername");
  assert.equal(save.names["school-paul"], "Pauli", "Der bisherige Namensstand bleibt erhalten");
  assert.equal(displayName(SCHOOL_MORNING_ENTITIES.find(person => person.id === "school-paul"), save), "Schüler", "Ein alter eigener Name verrät keine unbekannte Figur");
  assert.equal(displayName(SCHOOL_MORNING_ENTITIES.find(person => person.id === "school-pupil-left-1"), save), "Schülerin");
});
test("Unbekannte oder beschädigte Namensstände werden erkannt", () => {
  for (const value of ["broken", "null", JSON.stringify({ ...initialNames(), version: 2 }), JSON.stringify({ ...initialNames(), names: { wrong: "Name" } }), JSON.stringify({ ...initialNames(), names: { family: "x".repeat(33) } })]) assert.throws(() => parseNames(value));
});
