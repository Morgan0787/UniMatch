import landMask from '../landing/hero-landmask.js'

const landBytes = Uint8Array.from(atob(landMask.data), character => character.charCodeAt(0))
// The shared 256×128 raster has a one-row export streak across the Pacific
// at 16°S (columns 0–73). Repair this scene's copy without changing Home.
for (let column = 0; column < 74; column += 1) {
  const bit = 75 * landMask.width + column
  landBytes[bit >> 3] &= ~(1 << (bit & 7))
}
const GLOBE_RADIUS = 1.78
const GLOBE_YAW = 65 * Math.PI / 180

const TAU = Math.PI * 2

function seededRandom(seed) {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function allocate(count, pieces) {
  const output = new Float32Array(count * 3)
  let index = 0

  for (const [amount, sample] of pieces) {
    for (let item = 0; item < amount; item += 1) {
      const [x, y, z] = sample()
      output[index] = x
      output[index + 1] = y
      output[index + 2] = z
      index += 3
    }
  }

  return output
}

function distribute(count, fractions) {
  const amounts = fractions.map((fraction) => Math.floor(count * fraction))
  amounts[amounts.length - 1] += count - amounts.reduce((sum, amount) => sum + amount, 0)
  return amounts
}

function landCoverage(longitude, latitude) {
  const u = ((longitude / (Math.PI * 2) + .5) % 1 + 1) % 1 * landMask.width - .5
  const v = Math.max(0, Math.min(landMask.height - 1, (.5 - latitude / Math.PI) * landMask.height - .5))
  const x = Math.floor(u), y = Math.floor(v)
  const sample = (column, row) => {
    const wrapped = ((column % landMask.width) + landMask.width) % landMask.width
    const bit = Math.min(landMask.height - 1, row) * landMask.width + wrapped
    return (landBytes[bit >> 3] & (1 << (bit & 7))) !== 0 ? 1 : 0
  }
  const horizontal = u - x, vertical = v - y
  return (sample(x, y) * (1 - horizontal) + sample(x + 1, y) * horizontal) * (1 - vertical)
    + (sample(x, y + 1) * (1 - horizontal) + sample(x + 1, y + 1) * horizontal) * vertical
}

function globeRadius(longitude, latitude) {
  const longitudeStep = TAU / landMask.width
  const latitudeStep = Math.PI / landMask.height
  // A shallow, even land shelf with softened coasts; no synthetic mountain ridges.
  const land = landCoverage(longitude, latitude) * .4
    + landCoverage(longitude - longitudeStep, latitude) * .15
    + landCoverage(longitude + longitudeStep, latitude) * .15
    + landCoverage(longitude, latitude - latitudeStep) * .15
    + landCoverage(longitude, latitude + latitudeStep) * .15
  return GLOBE_RADIUS + land * .05
}

function globeTargets(count, random) {
  const points = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    // Equal-area shell, with sub-grain jitter to avoid visible sampling bands.
    const latitude = Math.asin(1 - 2 * (i + .5) / count)
    const longitude = i * Math.PI * (3 - Math.sqrt(5)) + (random() - .5) * .008
    const radius = globeRadius(longitude, latitude)
    const viewLongitude = longitude + GLOBE_YAW
    points.set([
      radius * Math.cos(latitude) * Math.cos(viewLongitude),
      radius * Math.sin(latitude),
      radius * Math.cos(latitude) * Math.sin(viewLongitude),
    ], i * 3)
  }
  return points
}

function bookTargets(count, random) {
  const [pageCount, textCount, spineCount, edgeCount] = distribute(count, [0.58, 0.08, 0.08, 0.26])
  const layers = 5
  const pageSurface = (side, width, height, layer = 0) => {
    const x = side * (0.09 + width * 1.71)
    const y = -0.86 + height * 1.72
    // Each leaf bows away from the gutter and curls gently toward its fore edge.
    const z = 0.025 + width * width * 0.25 + Math.sin(Math.PI * height) * 0.07 + Math.sin(Math.PI * width) * 0.035 + layer * 0.022
    return [x, y, z]
  }
  const page = () => {
    const side = random() < 0.5 ? -1 : 1
    const layer = Math.floor(random() * layers)
    return pageSurface(side, random(), random(), layer)
  }
  const textRow = () => {
    const side = random() < 0.5 ? -1 : 1
    const row = Math.floor(random() * 11)
    const height = 0.12 + row * 0.071 + (random() - 0.5) * 0.012
    const inset = row % 4 === 0 ? 0.28 : 0.12
    const width = inset + random() * (0.78 - inset)
    const [x, y, z] = pageSurface(side, width, height, layers - 1)
    return [x, y, z + 0.012]
  }
  const spine = () => {
    const angle = random() * TAU
    const y = -0.88 + random() * 1.76
    // A rounded binding bridges the two leaves and sinks into their center gutter.
    return [Math.cos(angle) * 0.105, y, -0.015 + Math.sin(angle) * 0.105]
  }
  const edge = () => {
    const choice = Math.floor(random() * 4)
    const side = random() < 0.5 ? -1 : 1
    const t = random()
    const layer = Math.floor(random() * layers)
    if (choice === 0 || choice === 1) {
      return pageSurface(side, t, choice === 0 ? 1 : 0, layer)
    }
    if (choice === 2) {
      return pageSurface(side, 1, t, layer)
    }
    // Fine parallel inner edges make the page stack visible around the gutter.
    const [x, y, z] = pageSurface(side, 0, t, layer)
    return [x + side * (layer - 2) * 0.009, y, z]
  }

  const points = allocate(count, [[pageCount, page], [textCount, textRow], [spineCount, spine], [edgeCount, edge]])
  for (let i = 0; i < points.length; i += 3) {
    const y = points[i + 1], z = points[i + 2]
    points[i + 1] = y * Math.cos(-.35) - z * Math.sin(-.35)
    points[i + 2] = y * Math.sin(-.35) + z * Math.cos(-.35)
  }
  return points
}

function capTargets(count, random) {
  const [boardCount, bandCount, detailCount] = distribute(count, [0.66, 0.21, 0.13])
  const view = (x, y, z) => {
    // A real horizontal board seen from above, with a cylindrical crown underneath.
    const diagonalX = (x - z) * Math.SQRT1_2
    const diagonalZ = (x + z) * Math.SQRT1_2
    return [diagonalX, y * Math.cos(.57) - diagonalZ * Math.sin(.57), y * Math.sin(.57) + diagonalZ * Math.cos(.57)]
  }
  const board = () => {
    const face = random()
    const x = (random() * 2 - 1) * 1.22
    const z = (random() * 2 - 1) * 1.22
    if (face < .56) return view(x, .62, z)
    if (face < .78) return view(x, .48, z)
    const edge = Math.floor(random() * 4)
    const t = random() * 2.44 - 1.22
    const depth = random() * .14
    if (edge === 0) return view(-1.22, .48 + depth, t)
    if (edge === 1) return view(1.22, .48 + depth, t)
    if (edge === 2) return view(t, .48 + depth, -1.22)
    return view(t, .48 + depth, 1.22)
  }
  const band = () => {
    const angle = random() * TAU
    const height = random()
    const crownRadius = .7 + Math.sin(height * Math.PI) * .09
    return view(crownRadius * Math.cos(angle), -.65 + height * .94, crownRadius * Math.sin(angle))
  }
  const detail = () => {
    if (random() < 0.42) {
      const t = random()
      const edge = Math.floor(random() * 4)
      const corners = [[-1.22, -1.22], [1.22, -1.22], [1.22, 1.22], [-1.22, 1.22]]
      const from = corners[edge]
      const to = corners[(edge + 1) % 4]
      const x = from[0] + (to[0] - from[0]) * t
      const z = from[1] + (to[1] - from[1]) * t
      const depth = random() * 0.16
      return view(x, .58 - depth, z)
    }

    // The cord crosses the board, drops from one corner, and fans into several tassel strands.
    const t = random()
    if (t < .35) return view(1.22 * t / .35, .61, -1.22 * t / .35)
    if (t < .88) return view(1.25, .58 - (t - .35) / .53 * 1.3, -1.22)
    const angle = random() * TAU
    const strand = Math.floor(random() * 7) - 3
    const brush = (t - .88) / .12
    const sway = Math.sin(brush * Math.PI + strand) * .025
    return view(1.25 + Math.cos(angle) * .035 + strand * .012 + sway, -.72 - brush * (.24 + Math.abs(strand) * .008), -1.22 + Math.sin(angle) * .035)
  }

  return allocate(count, [[boardCount, board], [bandCount, band], [detailCount, detail]])
}

export function createParticleShapes(count = 6500) {
  const safeCount = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0
  return {
    password: globeTargets(safeCount, seededRandom(0x51f15e)),
    magic: bookTargets(safeCount, seededRandom(0x0b00c5)),
    signup: capTargets(safeCount, seededRandom(0xc4a7)),
  }
}

// Surface directions give each grain the same lighting as the sculpture it belongs to.
export function createParticleNormals(shapes) {
  const result = {}
  for (const [method, points] of Object.entries(shapes)) {
    const normals = new Float32Array(points.length)
    const count = points.length / 3
    for (let i = 0; i < count; i++) {
      const j = i * 3
      let x = points[j], y = points[j + 1], z = points[j + 2]
      if (method === 'password') {
        const radius = Math.hypot(x, y, z)
        const latitude = Math.asin(Math.max(-1, Math.min(1, y / radius)))
        const viewLongitude = Math.atan2(z, x)
        const longitude = viewLongitude - GLOBE_YAW
        const epsilon = .006
        const slopeLongitude = (globeRadius(longitude + epsilon, latitude) - globeRadius(longitude - epsilon, latitude)) / (2 * epsilon * radius * Math.max(.04, Math.cos(latitude)))
        const slopeLatitude = (globeRadius(longitude, latitude + epsilon) - globeRadius(longitude, latitude - epsilon)) / (2 * epsilon * radius)
        // Surface gradients gently shade the softened continent edges.
        x = x / radius + Math.sin(viewLongitude) * slopeLongitude + Math.sin(latitude) * Math.cos(viewLongitude) * slopeLatitude
        y = y / radius - Math.cos(latitude) * slopeLatitude
        z = z / radius - Math.cos(viewLongitude) * slopeLongitude + Math.sin(latitude) * Math.sin(viewLongitude) * slopeLatitude
      } else if (method === 'magic') {
        const [pageCount, textCount, spineCount] = distribute(count, [.58, .08, .08, .26])
        if (i < pageCount + textCount) {
          // The two page leaves curve in depth; rotate their surface normals with the book.
          const side = x < 0 ? -1 : 1
          const width = Math.min(1, Math.max(0, (Math.abs(x) - .09) / 1.71))
          const localY = y * Math.cos(-.35) + z * Math.sin(-.35)
          const height = Math.min(1, Math.max(0, (localY + .86) / 1.72))
          const nx = -side * (width * .5 + Math.cos(Math.PI * width) * .035 * Math.PI / 1.71)
          let ny = -Math.cos(Math.PI * height) * .07 * Math.PI / 1.72
          let nz = 1
          const rotatedY = ny * Math.cos(-.35) - nz * Math.sin(-.35)
          const rotatedZ = ny * Math.sin(-.35) + nz * Math.cos(-.35)
          x = nx; y = rotatedY; z = rotatedZ
        } else if (i < pageCount + textCount + spineCount) {
          // The binding normals radiate from the rounded spine's cross-section.
          const localZ = -y * Math.sin(-.35) + z * Math.cos(-.35)
          x /= .105
          const normalZ = localZ / .105
          y = -normalZ * Math.sin(-.35)
          z = normalZ * Math.cos(-.35)
        } else {
          // The edge allocation contains page rims; their front-facing light follows the leaves.
          x = -Math.sign(x) * .12
          y = Math.sin(.35)
          z = Math.cos(.35)
        }
      } else if (method === 'signup') {
        if (i < Math.floor(count * .66) || i >= Math.floor(count * .66) + Math.floor(count * .21)) {
          x = 0; y = Math.cos(.57); z = Math.sin(.57)
        } else {
          const localZ = -y * Math.sin(.57) + z * Math.cos(.57)
          y = -localZ * Math.sin(.57); z = localZ * Math.cos(.57)
        }
      }
      const length = Math.hypot(x, y, z) || 1
      normals[j] = x / length; normals[j + 1] = y / length; normals[j + 2] = z / length
    }
    result[method] = normals
  }
  return result
}

// Surface grains stay quiet; raised continents, page print, and sculpted edges
// receive semantic accent weight for the detail shader.
export function createParticleDetails(shapes) {
  const result = {}
  for (const [method, points] of Object.entries(shapes)) {
    const count = Math.floor(points.length / 3)
    const details = new Float32Array(count)
    if (method === 'password') {
      for (let i = 0; i < count; i += 1) {
        const j = i * 3
        const radius = Math.hypot(points[j], points[j + 1], points[j + 2])
        details[i] = landCoverage(Math.atan2(points[j + 2], points[j]) - GLOBE_YAW, Math.asin(Math.max(-1, Math.min(1, points[j + 1] / radius))))
      }
    } else if (method === 'magic') {
      const [pageCount, textCount, spineCount] = distribute(count, [.58, .08, .08, .26])
      const textEnd = pageCount + textCount
      for (let i = pageCount; i < textEnd; i += 1) details[i] = 1
      for (let i = textEnd; i < textEnd + spineCount; i += 1) details[i] = .68
      for (let i = textEnd + spineCount; i < count; i += 1) details[i] = .56
    } else if (method === 'signup') {
      const [boardCount, bandCount] = distribute(count, [.66, .21, .13])
      for (let i = boardCount; i < boardCount + bandCount; i += 1) details[i] = .6
      for (let i = boardCount + bandCount; i < count; i += 1) details[i] = 1
    }
    result[method] = details
  }
  return result
}
