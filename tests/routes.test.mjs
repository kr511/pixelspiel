import test from "node:test";
import assert from "node:assert/strict";
import { advanceActor, standingActor, walkingRoute } from "../game/actors.ts";
import { canWalk, PLACES, SPAWNS, routeTo, parseStory } from "../game/story.ts";

test("Die neuen Fußwege lassen sich bis zu jedem Ausgang und zurück vollständig laufen", () => {
  for (const place of ["radegast", "zoerbig", "schoolway", "gym", "goelzau"]) {
    for (const exit of PLACES[place].exits) {
      for (const [from,to] of [[SPAWNS[place],exit],[exit,SPAWNS[place]]]) {
        let actor = { ...standingActor(from), route: walkingRoute(place,from,to) };
        assert.ok(actor.route.length, `${place}: ${exit.label}`);
        for (let i=0;i<3000 && actor.route.length;i++) {
          actor=advanceActor(place,"route-check",actor,1/60);
          assert.ok(canWalk(place,actor.position.x,actor.position.y),place);
        }
        assert.equal(actor.route.length,0,`${place}: ${exit.label}`);
        assert.ok(Math.hypot(actor.position.x-to.x,actor.position.y-to.y)<.003);
      }
    }
  }
});

test("Schul- und Schießweg führen über die neuen Ankunftsorte; alte Kapitelstände bleiben gültig", () => {
  assert.equal(routeTo("home","school").to,"radegast");
  assert.equal(routeTo("bus","school").to,"zoerbig");
  assert.equal(routeTo("bus","range").to,"goelzau");
  for(const place of ["bedroom","home","kitchen","garden","bus","school","range"]) {
    const old={version:1,chapter:"school",step:4,completed:["dog"],place,bag:["Fahrkarte"]};
    assert.deepEqual(parseStory(JSON.stringify(old)),old);
  }
});

test("Markt hält Brunnen und Säule frei und verbindet Bus, Markt, Schulweg und Schule", () => {
  assert.equal(canWalk('zoerbig',.50,.36),false,'Säulensockel');
  assert.equal(canWalk('zoerbig',.50,.64),false,'Brunnen');
  for(const [x,y] of [[.43,.275],[.50,.45],[.40,.70],[.24,.70]])assert.ok(canWalk('zoerbig',x,y),'Freier Platz');
  assert.equal(canWalk('zoerbig',.83,.40),false,'Rathausfassade');
  assert.equal(routeTo('zoerbig','school').to,'schoolway');
  assert.equal(routeTo('school','bus').to,'schoolway');
  for(const place of ['zoerbig','schoolway'])for(const exit of PLACES[place].exits)assert.ok(canWalk(exit.to,exit.spawn.x,exit.spawn.y),exit.label);
});
