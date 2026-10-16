import { createHeroSceneData } from './heroSceneData.js';

// Build/upload once; no geometry generation or per-particle JS during scrolling.
self.onmessage = event => {
  const count = event.data?.count;
  if (!Number.isInteger(count) || count < 4000 || count > 48000) throw new Error('Invalid particle count');
  const data = createHeroSceneData(count);
  const transfer = Object.values(data).map(array => /** @type {ArrayBuffer} */ (array.buffer));
  self.postMessage(data, { transfer });
};
