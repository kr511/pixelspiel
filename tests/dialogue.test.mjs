import test from 'node:test';
import assert from 'node:assert/strict';
import { EMOTIONS, dialogueAdvanceIntent, dialogueCharacters, dialogueEmotion, nextVisibleLength, portraitIdForSpeaker, portraitSeed } from '../game/dialogue.ts';

test('Acht Emotionen: Autorenangaben sind maßgeblich, alte Dialoge erhalten passende Ausdrücke', () => {
  assert.equal(new Set(EMOTIONS).size, 8);
  assert.equal(dialogueEmotion('Ich liebe dich.'), 'love');
  assert.equal(dialogueEmotion('Ich bin etwas unsicher.'), 'shy');
  assert.equal(dialogueEmotion('Wir sprechen über das Universum.'), 'thoughtful');
  assert.equal(dialogueEmotion('Ich liebe dich.', 'shy'), 'shy');
  assert.equal(dialogueEmotion('Hallo.'), 'neutral');
});

test('Tippen zeigt erst den ganzen Text; mehrere Antworten brauchen eine tatsächliche Auswahl', () => {
  assert.equal(dialogueAdvanceIntent({ blocked:false, visible:4, total:30, choiceCount:2 }), 'reveal');
  assert.equal(dialogueAdvanceIntent({ blocked:false, visible:30, total:30, choiceCount:2 }), 'choose');
  assert.equal(dialogueAdvanceIntent({ blocked:false, visible:30, total:30, choiceCount:1 }), 'advance');
  assert.equal(dialogueAdvanceIntent({ blocked:true, visible:4, total:30, choiceCount:0 }), 'blocked');
  assert.equal(dialogueAdvanceIntent({ blocked:true, visible:30, total:30, choiceCount:1 }), 'blocked');
});

test('Schreibmaschine erhält kombinierte Herzen, Umlaute und Emoji-Familien als sichtbare Zeichen', () => {
  assert.deepEqual(dialogueCharacters('A❤️B'), ['A','❤️','B']);
  assert.deepEqual(dialogueCharacters('e\u0301 👩‍❤️‍👨'), ['e\u0301',' ','👩‍❤️‍👨']);
  assert.equal(nextVisibleLength(9,10),10);
  assert.equal(nextVisibleLength(10,10),10);
  assert.equal(nextVisibleLength(0,0),0);
});

test('Jeder Sprecher hat eine stabile Identität; unbekannte NPCs werden nicht zusammengelegt', () => {
  assert.equal(portraitIdForSpeaker('Felice'),'felice');
  assert.equal(portraitIdForSpeaker('Trainer Hans'),'hans');
  assert.equal(portraitIdForSpeaker('Elias','paul'),'paul');
  assert.equal(portraitIdForSpeaker('Nora'),'npc:nora');
  assert.notEqual(portraitIdForSpeaker('Nora'),portraitIdForSpeaker('Mila'));
  assert.equal(portraitSeed('jason'),portraitSeed('jason'));
  assert.notEqual(portraitSeed('jason'),portraitSeed('paul'));
});
