import test from 'node:test';
import assert from 'node:assert/strict';
import { TREE_SILHOUETTES, WINTER_TREE_SILHOUETTES } from '../game/foreground.ts';
import { SCENE_GRAPHICS, foregroundPath, sceneBackground } from '../game/graphics.ts';

// Match SVG's evenodd rule so a leaf gap remains transparent even when it is
// surrounded by the outer crown contour.
function contains(path, x, y) {
  let inside = false;
  for (const ring of path.split('Z').filter(Boolean)) {
    const values = ring.match(/-?\d+(?:\.\d+)?/g).map(Number);
    for (let i = 0, j = values.length - 2; i < values.length; j = i, i += 2) {
      const ax = values[i], ay = values[i + 1], bx = values[j], by = values[j + 1];
      if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside;
    }
  }
  return inside;
}

test('Schulbäume verdecken Blätter und Kübel, lassen Blattlücken und Pflaster frei', () => {
  const samples = {
    schoolNorthWest: { solid: [[30.383, 33.174], [39.155, 40.112], [39.075, 43.381]], air: [[33.014, 38.596], [45.056, 39.075], [39.872, 45.215]] },
    schoolNorthEast: { solid: [[66.667, 31.898], [66.587, 43.062], [67.145, 46.252]], air: [[73.764, 43.86], [71.77, 45.455]] },
    schoolSouthWest: { solid: [[47.049, 52.632], [49.442, 62.998]], air: [[54.944, 61.404], [40.431, 61.563], [52.472, 63.397]] },
    schoolSouthEast: { solid: [[74.003, 55.981], [75.518, 65.789]], air: [[81.898, 63.796], [77.751, 67.703], [66.986, 64.195]] },
  };
  for (const [name, { solid, air }] of Object.entries(samples)) {
    for (const [x, y] of solid) assert.ok(contains(TREE_SILHOUETTES[name], x, y), `${name}: Blatt/Kübel ${x},${y}`);
    for (const [x, y] of air) assert.equal(contains(TREE_SILHOUETTES[name], x, y), false, `${name}: freie Luft/Pflaster ${x},${y}`);
  }
});

test('Gartenbäume verdecken Krone und Stamm ohne das Gras daneben auszuschneiden', () => {
  for (const [name, solid, air] of [
    ['gardenWest', [[28.309, 22.329], [15.152, 34.29]], [[28.309, 27.113], [22.727, 32.695], [20.734, 33.493]]],
    ['gardenEast', [[79.745, 23.923], [84.051, 37.719]], [[65.391, 25.518], [89.314, 37.48], [80.542, 37.48]]],
  ]) {
    for (const [x, y] of solid) assert.ok(contains(TREE_SILHOUETTES[name], x, y), `${name}: Krone/Stamm`);
    for (const [x, y] of air) assert.equal(contains(TREE_SILHOUETTES[name], x, y), false, `${name}: freie Luft/Gras`);
  }
});

test('Jahreszeiten verwenden dieselben begrenzten Silhouetten und die gemessene Standtiefe', () => {
  const layers = ['school', 'garden'].flatMap(place => SCENE_GRAPHICS[place].foreground.filter(layer => layer.path));
  assert.equal(layers.length, 6);
  assert.deepEqual(new Set(layers.map(layer => layer.path)), new Set(Object.values(TREE_SILHOUETTES)));
  for (const layer of layers) {
    for (const path of [layer.path, layer.winterPath]) {
    const values = path.match(/-?\d+(?:\.\d+)?/g).map(Number);
    assert.ok(values.every(value => value >= 0 && value <= 100));
    assert.ok(Math.max(...values.filter((_, index) => index % 2)) <= layer.depth + .25, 'Standtiefe endet am Stamm/Kübel');
    assert.ok(values.length / 2 < 1200, 'Kontur bleibt vereinfacht');
    assert.ok(path.split('Z').length < 40, 'Nur sichtbare Blattlücken und Konturen');
    }
  }
});

test('Winterkonturen umfassen Schneekappen und lassen weiterhin Zweiglücken und Boden frei', () => {
  assert.ok(contains(WINTER_TREE_SILHOUETTES.gardenWest, 17.943, 4.785), 'Neue Schneekappe');
  assert.equal(contains(TREE_SILHOUETTES.gardenWest, 17.943, 4.785), false, 'Sommerkrone endet tiefer');
  for (const [name, air] of [
    ['schoolNorthWest', [[33.014, 38.596], [45.056, 39.075], [39.872, 45.215]]],
    ['schoolNorthEast', [[71.77, 45.455]]],
    ['schoolSouthWest', [[54.944, 61.404]]],
    ['schoolSouthEast', [[77.751, 67.703]]],
    ['gardenWest', [[22.328, 33.333]]],
    ['gardenEast', [[89.314, 37.48]]],
  ]) {
    for (const [x, y] of air) assert.equal(contains(WINTER_TREE_SILHOUETTES[name], x, y), false, `${name}: freie Luft/Boden im Winter`);
  }
});

test('Vordergrundkontur folgt dem geladenen Bild, auch wenn das Winterbild auf Sommer zurückfällt', () => {
  for (const place of ['school', 'garden']) {
    const scene = SCENE_GRAPHICS[place], winter = sceneBackground(place, 'Winter');
    for (const layer of scene.foreground.filter(layer => layer.path)) {
      assert.equal(foregroundPath(layer, winter, winter), layer.winterPath);
      assert.equal(foregroundPath(layer, scene.background, winter), layer.path, 'Sommer-Fallback verwendet die Sommerkontur');
      for (const season of ['Frühling', 'Sommer', 'Herbst']) {
        assert.equal(foregroundPath(layer, sceneBackground(place, season), winter), layer.path);
      }
    }
  }
});
