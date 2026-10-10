import test from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY_STORY, CHAPTERS, ENTITIES, beginChapter, advanceStory, currentStep, parseStory, canWalk, routeTo } from '../game/story.ts';
import { photoFrame, PHOTO_DURATION } from '../game/graduation.ts';
import { personalConversation } from '../game/conversations.ts';

test('Abschluss 2026: beide Zeugnisse, Gespräch über Döner und danach gemeinsame Fotos', () => {
  let save=beginChapter(EMPTY_STORY,'graduation');
  assert.equal(save.place,'gym');
  const chapter=CHAPTERS.find(c=>c.id==='graduation');
  assert.equal(chapter.date,'Sommer 2026');
  assert.ok(['paul','justin','graduation-elias','graduation-principal','graduation-mayor'].every(id=>ENTITIES.gym.some(e=>e.id===id)));
  for(const step of chapter.steps){
    assert.equal(step.place,'gym');
    save=parseStory(JSON.stringify(advanceStory(save,step.target)));
  }
  assert.equal(currentStep(save),undefined);
  assert.ok(save.completed.includes('graduation'));
  assert.deepEqual(save.bag,['Eure Abschlusszeugnisse']);
  assert.equal(chapter.steps.at(-1).target,'graduation-photo');
  assert.equal(routeTo('school','gym').to,'gym');
  assert.ok(canWalk('gym',.5,.85));
  assert.equal(canWalk('gym',.2,.45),false,'Stuhlreihe gesperrt');
});

test('Vor dem vollständigen Fotomoment bleibt der Abschlussstand fortsetzbar', () => {
  let save=beginChapter(EMPTY_STORY,'graduation');
  while(currentStep(save).target!=='graduation-photo')save=advanceStory(save,currentStep(save).target);
  const reloaded=parseStory(JSON.stringify(save));
  assert.equal(currentStep(reloaded).target,'graduation-photo');
  assert.ok(!reloaded.completed.includes('graduation'));
  assert.ok(advanceStory(reloaded,'graduation-photo').completed.includes('graduation'));
});

test('Ein Weißblitz blendet zu drei automatischen Schnappschüssen über', () => {
  assert.deepEqual(photoFrame(0),{index:0,flash:1,complete:false});
  assert.equal(photoFrame(500).flash,.5);
  assert.equal(photoFrame(1000).flash,0);
  assert.equal(photoFrame(2000).index,0);
  assert.equal(photoFrame(5000).index,1);
  assert.equal(photoFrame(8000).index,2);
  assert.equal(photoFrame(PHOTO_DURATION-1).complete,false);
  assert.equal(photoFrame(PHOTO_DURATION).complete,true);
});

test('Die persönlichen Gespräche greifen Pauls Vorschlag und Jasons Fachabi auf', () => {
  assert.match(personalConversation('paul'),/Elias, Justin, Felice/);
  assert.match(personalConversation('jason'),/Fachabi/);
  assert.match(personalConversation('justin'),/vorgeschlagen/);
  assert.equal(personalConversation('unknown'),undefined);
});
