import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { cameraFor, projectPoint, offscreenGuide } from "../game/camera.ts";
import { CHARACTER_GRAPHICS, SCENE_GRAPHICS, CHAPTER_GRAPHICS, speakerGraphic, sceneBackground } from "../game/graphics.ts";
import { WALK_ATLASES } from "../game/graphics07.ts";
import { ENTITIES, PLACES, CHAPTERS } from "../game/story.ts";
import { WorldAudio, AUDIO_KEY, audioAllowed, parseMuted } from "../game/audio.ts";

test("Kamera zeigt an jeder Weltkante ausschließlich die Szene", () => {
  for(const zoom of [1,1.5,2]) for(const x of [0,.075,.5,.94,1]) for(const y of [0,.16,.5,.92,1]) {
    const camera=cameraFor({x,y},zoom), top=projectPoint({x:0,y:0},camera), bottom=projectPoint({x:1,y:1},camera), player=projectPoint({x,y},camera);
    assert.ok(top.x<=.00001&&top.y<=.00001&&bottom.x>=.99999&&bottom.y>=.99999);
    assert.ok(player.x>=0&&player.x<=1&&player.y>=0&&player.y<=1);
  }
  assert.equal(cameraFor({x:.5,y:.5},.5).zoom,1);
  assert.equal(cameraFor({x:.5,y:.5},NaN).zoom,1);
});

test("Zielhinweis zeigt aus dem Bild liegende Ziele an die richtige Bildschirmkante", () => {
  const camera=cameraFor({x:.5,y:.5});
  assert.equal(offscreenGuide({x:.5,y:.5},camera),null);
  const left=offscreenGuide({x:0,y:.5},camera), right=offscreenGuide({x:1,y:.5},camera), above=offscreenGuide({x:.5,y:0},camera);
  assert.ok(Math.abs(left.x-.09)<.0001&&left.angle===180);
  assert.ok(Math.abs(right.x-.91)<.0001&&right.angle===0);
  assert.ok(Math.abs(above.y-.09)<.0001&&above.angle===-90);
});

test("Alle Orte, Figuren und Sprecher besitzen verfügbare und passende Grafiken", () => {
  const asset=path=>assert.ok(existsSync(new URL(`../public${path}`,import.meta.url)),path);
  for(const place of Object.keys(PLACES)) {
    const scene=SCENE_GRAPHICS[place]; assert.ok(scene); asset(scene.background);
    if(scene.winter) asset(scene.winter);
    assert.equal(sceneBackground(place,false),scene.background);
    assert.equal(sceneBackground(place,true),scene.winter??scene.background);
    for(const entity of ENTITIES[place]) if(entity.kind!=="item") assert.ok(CHARACTER_GRAPHICS[entity.kind==="dog"?"dog":entity.art],entity.id);
  }
  for(const graphic of Object.values(CHARACTER_GRAPHICS)) { asset(graphic.sheet); asset(graphic.portrait.sheet); assert.ok(graphic.column<graphic.columns&&graphic.row<graphic.rows); assert.ok(graphic.anchor.x>=0&&graphic.anchor.x<=1&&graphic.anchor.y<=1); }
  for(const [sheet, atlas] of Object.entries(WALK_ATLASES)) {
    asset(sheet);
    const png = readFileSync(new URL(`../public${sheet}`,import.meta.url));
    assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],atlas.size,sheet);
  }
  for(const chapter of CHAPTERS) { asset(CHAPTER_GRAPHICS[chapter.id]); for(const step of chapter.steps) assert.ok(speakerGraphic(step.speaker),step.speaker); }
  assert.equal(speakerGraphic("Elias"),"elias"); assert.equal(speakerGraphic("Felices Stiefvater"),"stepfather");
});

function contextDouble() {
  const nodes=[];
  const param=()=>({value:0,cancelScheduledValues(){},setValueAtTime(value){this.value=value;},exponentialRampToValueAtTime(value){this.value=value;}});
  const source=()=>{ const node={started:0,stopped:0,connect(){},disconnect(){},start(){this.started++;},stop(){this.stopped++;this.onended?.();},frequency:param()}; nodes.push(node);return node; };
  return { nodes,state:"running",sampleRate:40,currentTime:0,destination:{},resume:async()=>{},createGain:()=>({gain:param(),connect(){},disconnect(){}}),createBuffer:(_channels,size)=>({getChannelData:()=>new Float32Array(size)}),createBufferSource:source,createOscillator:source,createBiquadFilter:()=>({frequency:param(),connect(){},disconnect(){}}) };
}

test("Ton startet nur nach Spielstart und stoppt bei Pause, Hintergrund, Hochformat und Übergang", () => {
  const policy={started:true,paused:false,hidden:false,landscape:true,transitioning:false};
  assert.ok(audioAllowed(policy));
  for(const flag of ["paused","hidden","transitioning"]) assert.equal(audioAllowed({...policy,[flag]:true}),false);
  for(const flag of ["started","landscape"]) assert.equal(audioAllowed({...policy,[flag]:false}),false);
});

test("Audiogeräte werden erst freigeschaltet; Stummschaltung bleibt separat gespeichert", async () => {
  const ctx=contextDouble();let calls=0;const saved=new Map();
  const audio=new WorldAudio(()=>{calls++;return ctx;});audio.load({getItem:key=>saved.get(key)??null,setItem:(key,value)=>saved.set(key,value)});
  audio.setScene("garden",true);audio.play("step",0);assert.equal(calls,0);
  await audio.unlock(); assert.equal(calls,1);assert.equal(ctx.nodes.length,1);
  audio.play("step",0);audio.play("step",92);audio.play("step",300);assert.equal(ctx.nodes.length,3,"Schritte werden gedrosselt");
  audio.toggleMuted();assert.ok(ctx.nodes[0].stopped);assert.equal(parseMuted(saved.get(AUDIO_KEY)),true);
  audio.play("shot");assert.equal(ctx.nodes.length,3);
  audio.toggleMuted();await audio.unlock();assert.equal(calls,1);assert.equal(ctx.nodes.length,4);
  audio.setScene("range",false);assert.ok(ctx.nodes[3].stopped);audio.play("shot");assert.equal(ctx.nodes.length,4);
  audio.stop();
});

test("Blockiertes Audio und gesperrte Browserdaten lassen das Spiel stumm weiterlaufen", async () => {
  const audio=new WorldAudio(()=>{throw new Error("blocked");});
  audio.load({getItem(){throw new Error("denied");},setItem(){throw new Error("denied");}});
  audio.setScene("bedroom",true);await audio.unlock();audio.play("interact");audio.toggleMuted();audio.stop();
  for(const raw of ["broken","null",'{"version":2,"muted":true}','{"version":1,"muted":"true"}']) assert.equal(parseMuted(raw),false);
});
