import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { HERO_CENTERS, HERO_UNIVERSITY_POSITION, createHeroSceneData } from '../src/components/landing/heroSceneData.js';
import { getHeroSceneFrame, getHeroSceneLayout, heroRoutePoint, projectHeroPoint, HERO_SCENE_DURATION } from '../src/components/landing/heroSceneRenderer.js';

const count = 24000;
const startedAt = performance.now();
const first = createHeroSceneData(count);
const elapsedMs = performance.now() - startedAt;
const second = createHeroSceneData(count);
const names = ['earth', 'icon', 'iconNormal', 'ribbon', 'center', 'meta'];

assert.equal(HERO_CENTERS.length, 7);
assert.deepEqual(HERO_UNIVERSITY_POSITION, [0.66, -0.20, -0.08]);
for (const name of names) {
  assert.ok(first[name] instanceof Float32Array, `${name} must be a Float32Array`);
  assert.equal(first[name].length, count * 3, `${name} length`);
  assert.ok(first[name].every(Number.isFinite), `${name} must contain only finite values`);
  assert.deepEqual(first[name], second[name], `${name} must be deterministic`);
}

const radii = new Map();
for (let i = 0; i < count; i += 1) {
  const offset = i * 3;
  const radius = Math.hypot(first.earth[offset], first.earth[offset + 1], first.earth[offset + 2]);
  radii.set(radius.toFixed(3), (radii.get(radius.toFixed(3)) || 0) + 1);
  const normalLength = Math.hypot(first.iconNormal[offset], first.iconNormal[offset + 1], first.iconNormal[offset + 2]);
  assert.ok(normalLength > 0.98 && normalLength < 1.02, `icon normal ${i} must be normalized`);
}
assert.ok(radii.has('0.805') && radii.has('0.755'), 'earth must contain both raised land and lower ocean');
assert.ok(radii.get('0.805') > 0 && radii.get('0.755') > 0, 'land and ocean must both have particles');

for (let group = 0; group < HERO_CENTERS.length; group += 1) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  let found = 0;
  let palettePaintPoints = 0;
  for (let i = group; i < count; i += HERO_CENTERS.length) {
    found += 1;
    const offset = i * 3;
    for (let axis = 0; axis < 3; axis += 1) {
      const local = first.icon[offset + axis] - HERO_CENTERS[group][axis];
      assert.ok(Math.abs(local) <= 0.21, `icon group ${group} must stay within its design bounds`);
      if (group === 1 && axis === 2 && local > 0.03) palettePaintPoints += 1;
      if (group === 1 && axis === 2 && Math.abs(local) <= 0.03) {
        const x = first.icon[offset] - HERO_CENTERS[group][0];
        const y = first.icon[offset + 1] - HERO_CENTERS[group][1];
        assert.ok((x - 0.105) ** 2 + (y + 0.025) ** 2 >= 0.032 ** 2, 'palette thumb hole must stay open');
      }
      min[axis] = Math.min(min[axis], local);
      max[axis] = Math.max(max[axis], local);
    }
  }
  assert.ok(found > 1000, `icon group ${group} needs a useful sample`);
  assert.ok(max.some((value, axis) => value - min[axis] > 0.08), `icon group ${group} must not collapse`);
  if (group === 1) assert.ok(palettePaintPoints > 0, 'palette must include raised paint bumps');
}

const start = Array.from(first.ribbon.slice(0, 3));
const endOffset = (count - 1) * 3;
const end = Array.from(first.ribbon.slice(endOffset, endOffset + 3));
assert.ok(Math.hypot(...start) < 1.1 && Math.hypot(...end) < 1.1, 'ribbon endpoints must remain near the scene');
assert.ok(Math.hypot(end[0] - start[0], end[1] - start[1], end[2] - start[2]) > 0.8, 'ribbon must span distinct endpoints');

for (const [width, height] of [[1280, 800], [1243, 544], [390, 844], [320, 700]]) {
  const initialLayout = getHeroSceneLayout(0, width, height);
  const fullLayout = getHeroSceneLayout(1, width, height);
  assert.ok(fullLayout.scale > initialLayout.scale, 'the first scroll enlarges the scene');
  assert.equal(fullLayout.centerY, height / 2, 'the expanded scene uses the full viewport');
  const forwards = [];
  for (let frame = 0; frame <= 1680; frame += 1) {
    const state = getHeroSceneFrame(frame / 120, width, height);
    assert.ok([state.a, state.b, state.c, state.pulseOpacity].every(v => v >= 0 && v <= 1));
    for (const p of [...state.labels, ...state.cores]) assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y) && p.opacity >= 0 && p.opacity <= 1, 'every frame must have finite overlays');
    forwards.push(state);
  }
  for (let frame = 1680; frame >= 0; frame -= 1) assert.deepEqual(getHeroSceneFrame(frame / 120, width, height), forwards[frame], 'backward scroll must reproduce the same frame');
  assert.equal(forwards[0].stage, 0);
  assert.equal(forwards[600].stage, 1);
  assert.equal(forwards[1680].stage, 3);
  const destination = projectHeroPoint(HERO_UNIVERSITY_POSITION, width, height);
  assert.ok(forwards[1680].pulse.every((v, i) => Math.abs(v - destination[i]) < 1e-8), 'light arrives at the selected university');
}
assert.ok(Math.hypot(...heroRoutePoint(0).map((v, i) => v - HERO_UNIVERSITY_POSITION[i])) > 1.5, 'final route has a meaningful start and destination');
assert.equal(HERO_SCENE_DURATION, 14);
console.log(`Hero scene check passed: ${count.toLocaleString()} particles, land=${radii.get('0.805')}, ocean=${radii.get('0.755')}, generation=${elapsedMs.toFixed(1)}ms; 1,681 forward/reverse frames at four viewport sizes.`);
