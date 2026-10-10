import test from 'node:test';
import assert from 'node:assert/strict';
import { assetUrl } from '../game/assets.ts';

test('Public assets load beneath the GitHub Pages repository path', () => {
  assert.equal(assetUrl('/rooms/school-v06.png', '/pixelgame/'), '/pixelgame/rooms/school-v06.png');
  assert.equal(assetUrl('/characters/felice-v1.png', '/pixelgame'), '/pixelgame/characters/felice-v1.png');
  assert.equal(assetUrl('/rooms/story-playground-v09.svg?preview=1#scene', '/pixelgame/'), '/pixelgame/rooms/story-playground-v09.svg?preview=1#scene');
});

test('Root hosting and Node-based readers retain existing asset URLs', () => {
  assert.equal(assetUrl('/rooms/school-v06.png', '/'), '/rooms/school-v06.png');
  assert.equal(assetUrl('/rooms/school-v06.png'), '/rooms/school-v06.png');
  assert.equal(assetUrl('/rooms/school-v06.png', './'), './rooms/school-v06.png');
});

test('External, inline, fragment, and relative references remain unchanged', () => {
  for (const source of ['https://example.org/image.png', 'http://example.org/image.png', '//example.org/image.png', 'data:image/svg+xml;base64,PHN2Zz4=', '#portrait-clip', 'rooms/image.png', './image.png', '../image.png', '']) {
    assert.equal(assetUrl(source, '/pixelgame/'), source);
  }
});
