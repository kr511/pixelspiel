import test from "node:test";
import assert from "node:assert/strict";
import { movementStep, walkingFrame, WALK_SPEED } from "../game/motion.ts";
import { REST_GRAPHICS, SPRITE_FRAMES } from "../game/graphics.ts";
import { WALK_ATLASES } from "../game/graphics07.ts";

test("Laufen bleibt bei 15, 30, 60 und 144 Bildern pro Sekunde gleich schnell", () => {
  for (const rate of [15,30,60,144]) {
    let point = { x: .2, y: .2 };
    for (let i=0; i<rate; i++) point = movementStep(point,{x:1,y:0},1/rate,()=>true);
    assert.ok(Math.abs(point.x-(.2+WALK_SPEED)) < 1e-10);
    assert.equal(point.y,.2);
  }
  const diagonal = movementStep({x:0,y:0},{x:1,y:1},.1,()=>true);
  assert.ok(Math.abs(Math.hypot(diagonal.x,diagonal.y)-WALK_SPEED*.1)<1e-10);
});

test("Kollisionen verhindern Durchlaufen und erlauben Gleiten an Möbelkanten", () => {
  const start = {x:.49,y:.3};
  const next = movementStep(start,{x:1,y:1},1,(x)=>x<.5);
  assert.ok(next.x<.5 && next.y>start.y);
  assert.ok(Math.hypot(next.x-start.x,next.y-start.y)<=WALK_SPEED*.1);
  assert.deepEqual(movementStep(start,{x:0,y:0},.1,()=>true),start);
  assert.deepEqual(movementStep(start,{x:1,y:0},.1,()=>false),start);
});

test("Laufzyklus hat neutrale Zwischenbilder; alle Spriteausschnitte bleiben im Atlas", () => {
  assert.deepEqual([0,.03,.06,.085,.11].map(walkingFrame),[0,1,0,2,0]);
  const atlases = [...Object.values(SPRITE_FRAMES), ...Object.values(WALK_ATLASES), {size:REST_GRAPHICS.size,frames:[[REST_GRAPHICS.feliceSeated,REST_GRAPHICS.eliasSeated,REST_GRAPHICS.feliceLying]]}];
  for (const {size,frames} of atlases) for (const row of frames) for (const [x,y,w,h] of row) {
    assert.ok(x>=0 && y>=0 && w>0 && h>0 && x+w<=size[0] && y+h<=size[1]);
  }
});

test("Ecken: Felice rutscht an einer Möbelkante vorbei statt hängenzubleiben", async () => {
  const { movementStep: step } = await import("../game/motion.ts");
  // Box from x .5 to .6, y .4 to .5. Walking right at y .495 grazes its lower corner.
  const free = (x, y) => !(x > .5 && x < .6 && y > .4 && y < .5);
  let point = { x: .45, y: .495 };
  for (let i = 0; i < 60; i++) point = step(point, { x: 1, y: 0 }, 1/30, free);
  assert.ok(point.x > .6, `kommt an der Kante vorbei (x=${point.x.toFixed(3)})`);
  assert.ok(point.y >= .5 && point.y < .52, "nur kleiner Seitenschritt");
  // Head-on into the middle of a wall: no sliding, no tunnelling.
  let wall = { x: .45, y: .45 };
  for (let i = 0; i < 60; i++) wall = step(wall, { x: 1, y: 0 }, 1/30, free);
  assert.ok(wall.x <= .5 && Math.abs(wall.y - .45) < 1e-9);
  // Thin wall with a gap behind: the nudge must not cross it.
  const thin = (x, y) => !(y > .49 && y < .493) && !(x > .5 && x < .6 && y > .4 && y < .49);
  let blocked = { x: .45, y: .488 };
  for (let i = 0; i < 30; i++) blocked = step(blocked, { x: 1, y: 0 }, 1/30, thin);
  assert.ok(blocked.y <= .49, "kein Sprung durch eine dünne Wand");
});

test("Weiches Anfahren und Bremsen, ohne Blickrichtungs-Flackern", async () => {
  const { easeInput, facing } = await import("../game/motion.ts");
  let v = { x: 0, y: 0 };
  v = easeInput(v, { x: 1, y: 0 }, 1/60);
  assert.ok(v.x > .15 && v.x < .5, "erster Frame schon spürbar, aber nicht sofort voll");
  for (let i = 0; i < 20; i++) v = easeInput(v, { x: 1, y: 0 }, 1/60);
  assert.ok(v.x > .95, "nach etwa einer Drittelsekunde volle Geschwindigkeit");
  for (let i = 0; i < 12; i++) v = easeInput(v, { x: 0, y: 0 }, 1/60);
  assert.deepEqual(v, { x: 0, y: 0 }, "Stillstand nach kurzer Zeit exakt null");
  assert.equal(facing("right", .7, .72), "right", "fast diagonal bleibt die alte Richtung");
  assert.equal(facing("right", .3, .9), "front");
  assert.equal(facing("front", -.9, .3), "left");
});
