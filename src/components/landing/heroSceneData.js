import landMask from './hero-landmask.js';

export const HERO_CENTERS = [
  [-0.78, -0.12, 0.08],
  [-0.40, -0.58, -0.10],
  [0.14, -0.48, 0.16],
  [0.73, -0.28, 0],
  [0.65, 0.36, -0.10],
  [0.02, 0.57, 0.06],
  [-0.65, 0.47, -0.05],
];

export const HERO_UNIVERSITY_POSITION = [0.66, -0.20, -0.08];

const LAND_WIDTH = landMask.width;
const LAND_HEIGHT = landMask.height;
const LAND_BITS = decodeBase64(landMask.data);

function decodeBase64(value) {
  const binary = globalThis.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function isLand(longitude, latitude) {
  const x = Math.min(LAND_WIDTH - 1, Math.max(0, Math.floor((longitude + 180) / 360 * LAND_WIDTH)));
  const y = Math.min(LAND_HEIGHT - 1, Math.max(0, Math.floor((90 - latitude) / 180 * LAND_HEIGHT)));
  const bit = y * LAND_WIDTH + x;
  return (LAND_BITS[bit >> 3] & (1 << (bit & 7))) !== 0;
}

function createRandom(seed = 2517) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function boxPoint(random, x, y, z, sx, sy, sz) {
  const point = [(random() * 2 - 1) * sx, (random() * 2 - 1) * sy, (random() * 2 - 1) * sz];
  const face = Math.floor(random() * 6);
  const axis = Math.floor(face / 2);
  const sign = face % 2 ? 1 : -1;
  point[axis] = [sx, sy, sz][axis] * sign;
  const normal = [0, 0, 0];
  normal[axis] = sign;
  return { point: [point[0] + x, point[1] + y, point[2] + z], normal };
}

function cylinderPoint(random, x, y, z, radius, halfHeight) {
  const angle = random() * Math.PI * 2;
  return {
    point: [x + Math.cos(angle) * radius, y + (random() * 2 - 1) * halfHeight, z + Math.sin(angle) * radius],
    normal: [Math.cos(angle), 0, Math.sin(angle)],
  };
}

function normalize(vector) {
  const length = Math.hypot(vector[0], vector[1], vector[2]) || 1;
  return vector.map(value => value / length);
}

function iconPoint(random, group) {
  const choice = random();
  if (group === 0) {
    if (choice < 0.60) return boxPoint(random, 0, 0, 0, 0.125, 0.125, 0.038);
    if (choice < 0.78) return boxPoint(random, 0, 0, 0.05, 0.073, 0.073, 0.008);
    const side = Math.floor(random() * 4);
    const offset = (Math.floor(random() * 4) - 1.5) * 0.067;
    return side < 2
      ? boxPoint(random, offset, side === 0 ? -0.16 : 0.16, 0, 0.011, 0.04, 0.015)
      : boxPoint(random, side === 2 ? -0.16 : 0.16, offset, 0, 0.04, 0.011, 0.015);
  }
  if (group === 1) {
    // Flat palette volume with a circular thumb hole and five raised paint dabs.
    if (choice < 0.12) {
      const bump = Math.floor(random() * 5);
      const angle = (bump / 5) * Math.PI * 2 - 0.8;
      const radius = 0.112;
      const centerX = Math.cos(angle) * radius;
      const centerY = Math.sin(angle) * radius * 0.76;
      const a = random() * Math.PI * 2;
      const r = 0.010 * Math.sqrt(random());
      const z = 0.031 + 0.008 * Math.sqrt(Math.max(0, 1 - (r / 0.010) ** 2));
      return { point: [centerX + Math.cos(a) * r, centerY + Math.sin(a) * r, z], normal: normalize([Math.cos(a), Math.sin(a), 0.8]) };
    }
    let x; let y;
    do {
      const angle = random() * Math.PI * 2;
      const radius = Math.sqrt(random());
      x = Math.cos(angle) * 0.17 * radius;
      y = Math.sin(angle) * 0.13 * radius;
    } while ((x - 0.105) ** 2 + (y + 0.025) ** 2 < 0.032 ** 2);
    const side = random() > 0.5 ? 1 : -1;
    return { point: [x, y, side * 0.028], normal: [0, 0, side] };
  }
  if (group === 2) {
    if (choice < 0.65) {
      const result = boxPoint(random, 0, -0.028, 0, 0.16, 0.02, 0.13);
      const x = result.point[0];
      const z = result.point[2];
      const [nx, ny, nz] = result.normal;
      result.point = [x * 0.85 - z * 0.5, result.point[1] + z * 0.5, x * 0.3 + z * 0.7];
      result.normal = normalize([nx * 0.85 - nz * 0.5, ny + nz * 0.5, nx * 0.3 + nz * 0.7]);
      return result;
    }
    if (choice < 0.94) return cylinderPoint(random, 0, 0.04, 0, 0.09, 0.045);
    return boxPoint(random, 0.12, 0.07, 0.08, 0.007, 0.10, 0.007);
  }
  if (group === 3) {
    if (choice < 0.38) return boxPoint(random, 0, -0.09, 0, 0.17, 0.025, 0.07);
    if (choice < 0.8) return boxPoint(random, (Math.floor(random() * 3) - 1) * 0.115, 0.025, 0, 0.021, 0.09, 0.035);
    const result = boxPoint(random, 0, -0.11, 0, 0.16, 0.017, 0.035);
    result.point[1] = -0.15 + Math.abs(result.point[0]) * 0.5;
    return result;
  }
  if (group === 4) {
    if (choice < 0.84) return boxPoint(random, 0, 0.025, 0, 0.15, 0.10, 0.045);
    const angle = random() * Math.PI;
    return { point: [Math.cos(angle) * 0.065, -0.08 - Math.sin(angle) * 0.05, 0], normal: [0, 0, 1] };
  }
  if (group === 5) {
    const result = choice < 0.63
      ? cylinderPoint(random, 0, 0, 0, 0.045, 0.10)
      : choice < 0.76
        ? boxPoint(random, 0, -0.12, 0, 0.065, 0.012, 0.03)
        : choice < 0.88
          ? boxPoint(random, 0, -0.19, 0, 0.05, 0.01, 0.025)
          : cylinderPoint(random, 0, 0.17, 0, 0.004, 0.07);
    const [x, y, z] = result.point;
    const [nx, ny, nz] = result.normal;
    result.point = [x * 0.77 - y * 0.64, x * 0.64 + y * 0.77, z];
    result.normal = normalize([nx * 0.77 - ny * 0.64, nx * 0.64 + ny * 0.77, nz]);
    return result;
  }
  const angle = random() * Math.PI * 2;
  const radius = 0.058 + random() * 0.065;
  if (choice <= 0.64) return { point: [Math.cos(angle) * radius, Math.sin(angle) * radius, (random() > 0.5 ? 1 : -1) * 0.026], normal: normalize([Math.cos(angle), Math.sin(angle), 0.2]) };
  const toothAngle = Math.floor(random() * 8) * Math.PI / 4;
  const tooth = boxPoint(random, 0, 0.14, 0, 0.027, 0.035, 0.027);
  const [x, y, z] = tooth.point;
  const [nx, ny, nz] = tooth.normal;
  tooth.point = [x * Math.cos(toothAngle) - y * Math.sin(toothAngle), x * Math.sin(toothAngle) + y * Math.cos(toothAngle), z];
  tooth.normal = normalize([nx * Math.cos(toothAngle) - ny * Math.sin(toothAngle), nx * Math.sin(toothAngle) + ny * Math.cos(toothAngle), nz]);
  return tooth;
}

export function createHeroSceneData(count) {
  if (!Number.isInteger(count) || count < 1) throw new RangeError('count must be a positive integer');
  const earth = new Float32Array(count * 3);
  const icon = new Float32Array(count * 3);
  const iconNormal = new Float32Array(count * 3);
  const ribbon = new Float32Array(count * 3);
  const center = new Float32Array(count * 3);
  const meta = new Float32Array(count * 3);
  const random = createRandom();

  for (let i = 0; i < count; i += 1) {
    const group = i % HERO_CENTERS.length;
    const y = 1 - (2 * (i + 0.5)) / count;
    const angle = i * 2.3999632297;
    const planarRadius = Math.sqrt(1 - y * y);
    const longitude = ((angle * 180 / Math.PI + 180) % 360) - 180;
    const latitude = -Math.asin(y) * 180 / Math.PI;
    const earthRadius = isLand(longitude, latitude) ? 0.805 : 0.755;
    const local = iconPoint(random, group);
    const centerPosition = HERO_CENTERS[group];
    const u = i / Math.max(1, count - 1);
    const route = [-0.99 + 1.72 * u, 0.13 - 0.41 * u + 0.26 * Math.sin(u * Math.PI * 2), 0.46 * Math.sin(u * Math.PI * 2)];
    const ribbonAngle = i * 2.39996;
    const tube = 0.025 + 0.065 * Math.sin(Math.PI * u);
    const offset = i * 3;

    earth.set([planarRadius * Math.cos(angle) * earthRadius, y * earthRadius, planarRadius * Math.sin(angle) * earthRadius], offset);
    icon.set(local.point.map((value, axis) => value + centerPosition[axis]), offset);
    iconNormal.set(normalize(local.normal || local.point), offset);
    ribbon.set([
      route[0] + Math.cos(ribbonAngle) * tube * 0.48,
      route[1] + Math.sin(ribbonAngle) * tube,
      route[2] + Math.cos(ribbonAngle) * tube,
    ], offset);
    center.set(centerPosition, offset);
    meta.set([random(), u, 0.65 + random() * 0.5], offset);
  }

  return { earth, icon, iconNormal, ribbon, center, meta };
}
