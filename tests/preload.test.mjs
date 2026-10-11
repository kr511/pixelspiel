import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { preloadPlan } from '../game/preload-plan.ts';

const onDisk = (source) => existsSync(new URL(`../public${source}`, import.meta.url));

test('Der Startplan lädt zuerst die erste Szene und die Hauptfiguren', () => {
  const { critical } = preloadPlan('bedroom', 'Herbst');
  assert.ok(critical.includes('/rooms/felice-bedroom-v10.webp'));
  assert.ok(critical.includes('/characters/felice-walk-v1.webp'));
  assert.ok(critical.includes('/characters/elias-walk-v06-fixed.webp'));
  assert.ok(critical.length < 12);
});

test('Der Winter-Schulhof wird passend zur Jahreszeit vorgeladen', () => {
  assert.ok(preloadPlan('school', 'Winter').critical.includes('/rooms/school-court-winter-v092.webp'));
  assert.ok(preloadPlan('school', 'Frühling').critical.includes('/rooms/school-court-spring-v092.webp'));
});

test('Der Rest deckt alle Szenen und Spritesheets ab, ohne Doppelte', () => {
  const plan = preloadPlan('bedroom', 'Herbst');
  const all = [...plan.critical, ...plan.rest];
  assert.equal(new Set(all).size, all.length);
  for (const source of ['/rooms/zoerbig-market-v09.webp', '/rooms/goelzau-range-v1.webp', '/rooms/graduation-gym-v08.webp', '/rooms/garden-autumn-v092.webp', '/characters/neighbors-front-v07-alt2.webp', '/characters/portraits-v06.webp', '/characters/anuk-v06.webp']) {
    assert.ok(all.includes(source), source);
  }
});

test('Jede vorgeladene Datei existiert wirklich (SVG-Fallbacks dürfen fehlen)', () => {
  const plan = preloadPlan('bedroom', 'Herbst');
  const missing = [...plan.critical, ...plan.rest].filter(source => !onDisk(source));
  assert.deepEqual(missing.filter(source => !source.endsWith('.svg')), []);
  for (const source of plan.media) assert.ok(onDisk(source), source);
});
