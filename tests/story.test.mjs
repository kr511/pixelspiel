import test from "node:test";
import assert from "node:assert/strict";
import { CHAPTERS, ENTITIES, PLACES, SPAWNS, EMPTY_STORY, advanceStory, beginChapter, canWalk, currentStep, parseStory, routeTo } from "../game/story.ts";

test("Alle Kapitel sind vollständig spielbar, speicherbar und wiederholbar", () => {
  let save = { ...EMPTY_STORY };
  for (const chapter of CHAPTERS) {
    save = beginChapter(save,chapter.id);
    for (const step of chapter.steps) {
      assert.equal(currentStep(save)?.id,step.id);
      save = {...save,place:step.place};
      assert.ok(ENTITIES[step.place].some(e=>e.id===step.target));
      assert.equal(advanceStory(save,"wrong"),save,"Falsche Aktionen lösen keine Aufgabe");
      save = parseStory(JSON.stringify(advanceStory(save,step.target)));
    }
    assert.equal(currentStep(save),undefined);
    assert.ok(save.completed.includes(chapter.id));
  }
  assert.equal(save.completed.length,CHAPTERS.length);
  const replay = beginChapter(save,"dog");
  assert.equal(replay.step,0);
  assert.equal(replay.completed.length,CHAPTERS.length);
  assert.deepEqual(replay.bag,[]);
});

test("Inventar wird aufgenommen und abgegeben; falscher Ort zählt nicht", () => {
  let s = beginChapter(EMPTY_STORY,"dog");
  assert.equal(advanceStory({...s,place:"bus"},"family").step,0);
  s = advanceStory(s,"family"); s = advanceStory(s,"blanket");
  assert.deepEqual(s.bag,["Hundekissen"]);
  s = advanceStory({...s,place:"garden"},"dog-bed");
  assert.deepEqual(s.bag,[]);
});

test("Alle Orte sind in beide Richtungen verbunden und alle Spawns begehbar", () => {
  for (const from of Object.keys(PLACES)) {
    assert.ok(canWalk(from,SPAWNS[from].x,SPAWNS[from].y),from);
    for (const to of Object.keys(PLACES)) if (from !== to) assert.ok(routeTo(from,to),`${from} → ${to}`);
    for (const exit of PLACES[from].exits) {
      assert.ok(canWalk(exit.to,exit.spawn.x,exit.spawn.y),`${from} → ${exit.to}: Spawn`);
      assert.ok(PLACES[exit.to].exits.some(e=>e.to===from),`${from} → ${exit.to}: Rückweg`);
    }
  }
});

test("Jede Person, jedes Questobjekt und jeder Ausgang ist laufend erreichbar", () => {
  const grid = .009;
  for (const place of Object.keys(PLACES)) {
    const spawn = SPAWNS[place];
    const points = [spawn]; const seen = new Set(["0,0"]); const cells = [[0,0]];
    for(let i=0;i<cells.length;i++) {
      const [x,y] = cells[i];
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx=x+dx,ny=y+dy,key=`${nx},${ny}`;
        const p={x:spawn.x+nx*grid,y:spawn.y+ny*grid};
        if(seen.has(key)||!canWalk(place,p.x,p.y))continue;
        seen.add(key);cells.push([nx,ny]);points.push(p);
      }
    }
    for(const target of [...ENTITIES[place],...PLACES[place].exits]) {
      assert.ok(points.some(p=>Math.hypot(p.x-target.x,p.y-target.y)<.08),`${place}: ${target.name??target.label}`);
    }
  }
});

test("Kaputte oder zukünftige Spielstände werden erkannt, vorhandene Daten bleiben intakt", () => {
  for(const raw of ["broken","null",JSON.stringify({...EMPTY_STORY,version:2}),JSON.stringify({...EMPTY_STORY,place:"toString"}),JSON.stringify({...EMPTY_STORY,step:90}),JSON.stringify({...EMPTY_STORY,completed:["unknown"]})]) assert.throws(()=>parseStory(raw));
  assert.deepEqual(parseStory(null),EMPTY_STORY);
});


test("Gespeicherte Kuscheldecke wird zum Hundekissen und Anuks Kapitel bleibt fortsetzbar", () => {
  const old={version:1,chapter:"dog",step:2,completed:[],place:"garden",bag:["Kuscheldecke"]};
  const saved=parseStory(JSON.stringify(old));
  assert.deepEqual(saved.bag,["Hundekissen"]);
  assert.deepEqual(advanceStory(saved,"dog-bed").bag,[]);
});
