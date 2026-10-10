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
