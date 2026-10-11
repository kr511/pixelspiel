import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { preloadPlan } from '../game/preload-plan.ts';

const onDisk = (source) => existsSync(new URL(`../public${source}`, import.meta.url));

test('Der Startplan lädt zuerst die erste Szene und die Hauptfiguren', () => {
  const { critical } = preloadPlan('bedroom', 'Herbst');
  assert.ok(critical.includes('/rooms/felice-bedroom-v10.png'));
  assert.ok(critical.includes('/characters/felice-walk-v1.png'));
  assert.ok(critical.includes('/characters/elias-walk-v06-fixed.png'));
  assert.ok(critical.length < 12);
});

test('Der Winter-Schulhof wird passend zur Jahreszeit vorgeladen', () => {
  assert.ok(preloadPlan('school', 'Winter').critical.includes('/rooms/school-court-winter-v092.png'));
  assert.ok(preloadPlan('school', 'Frühling').critical.includes('/rooms/school-court-spring-v092.png'));
});

test('Der Rest deckt alle Szenen und Spritesheets ab, ohne Doppelte', () => {
  const plan = preloadPlan('bedroom', 'Herbst');
  const all = [...plan.critical, ...plan.rest];
  assert.equal(new Set(all).size, all.length);
  for (const source of ['/rooms/zoerbig-market-v09.png', '/rooms/goelzau-range-v1.png', '/rooms/graduation-gym-v08.png', '/rooms/garden-autumn-v092.png', '/characters/neighbors-front-v07-alt2.png', '/characters/portraits-v06.png', '/characters/anuk-v06.png']) {
    assert.ok(all.includes(source), source);
  }
});

test('Jede vorgeladene Datei existiert wirklich (SVG-Fallbacks dürfen fehlen)', () => {
  const plan = preloadPlan('bedroom', 'Herbst');
  const missing = [...plan.critical, ...plan.rest].filter(source => !onDisk(source));
  assert.deepEqual(missing.filter(source => !source.endsWith('.svg')), []);
  for (const source of plan.media) assert.ok(onDisk(source), source);
});
