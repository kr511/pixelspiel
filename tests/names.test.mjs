import test from "node:test";
import assert from "node:assert/strict";
import { PEOPLE, displayName, initialNames, parseNames, renamePerson } from "../game/names.ts";

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
test("Unbekannte oder beschädigte Namensstände werden erkannt", () => {
  for (const value of ["broken", "null", JSON.stringify({ ...initialNames(), version: 2 }), JSON.stringify({ ...initialNames(), names: { wrong: "Name" } }), JSON.stringify({ ...initialNames(), names: { family: "x".repeat(33) } })]) assert.throws(() => parseNames(value));
});
