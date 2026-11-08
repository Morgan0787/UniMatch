/* eslint-disable react/no-unknown-property -- These JSX elements are Three.js objects rendered by R3F. */
import React, { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { DynamicDrawUsage } from 'three'
import { createParticleDetails, createParticleNormals, createParticleShapes } from './particleShapes'

const COUNT = 26000
const VERTEX = `
  attribute float aSize;
  attribute vec3 aNormal;
  varying vec3 vColor;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vDetail;
  varying float vEnergy;
  varying float vSeed;
  attribute float aDetail;
  attribute float aEnergy;
  attribute float aSeed;
  uniform float uPixelRatio;
  void main() {
    vColor = color;
    vDetail = aDetail;
    vEnergy = aEnergy;
    vSeed = aSeed;
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * aNormal);
    vView = normalize(-viewPosition.xyz);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = clamp(aSize * uPixelRatio * (36.0 + aEnergy * 9.0) / -viewPosition.z, 1.0, 7.0);
  }
`
const FRAGMENT = `
  varying vec3 vColor;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vDetail;
  varying float vEnergy;
  varying float vSeed;
  uniform float uTime;
  void main() {
    vec2 grain = (gl_PointCoord - 0.5) * 2.0;
    float radius = dot(grain, grain);
    if (radius > 1.0) discard;
    vec3 normal = normalize(vNormal);
    float facing = dot(normal, vView);
    if (facing < -0.12 && vEnergy < 0.1) discard;
    vec3 key = normalize(vec3(-0.7, 0.9, 1.4));
    vec3 amber = normalize(vec3(1.2, 0.4, 0.5));
    float diffuse = max(0.0, dot(normal, key));
    float warm = pow(max(0.0, dot(normal, amber)), 3.0);
    float specular = pow(max(0.0, dot(normal, normalize(key + vView))), 22.0);
    float rim = pow(1.0 - max(facing, 0.0), 3.0);
    float grainLight = 0.91 + 0.09 * sqrt(1.0 - radius);
    // Home's near-white, slightly cool pearl palette, with relief-driven shading.
    float hemisphere = smoothstep(-0.6, 0.9, normal.y);
    vec3 lit = vColor * (0.66 + diffuse * 0.25 + hemisphere * 0.07);
    vec3 detail = vec3(0.82, 0.85, 0.83) * (0.66 + diffuse * 0.28 + hemisphere * 0.06);
    lit = mix(lit, detail, vDetail * 0.42);
    lit += vec3(0.08, 0.065, 0.04) * warm * 0.16;
    lit += vec3(0.16, 0.17, 0.165) * specular;
    lit += vec3(0.08, 0.085, 0.08) * rim;
    float glint = pow(max(0.0, sin(uTime * 0.8 + vSeed * 91.0)), 18.0);
    lit += vec3(0.13, 0.14, 0.13) * (vEnergy * 0.35 + glint * 0.1);
    gl_FragColor = vec4(lit * grainLight, (1.0 - smoothstep(0.65, 1.0, radius)) * 0.96);
    #include <colorspace_fragment>
  }
`

function ParticleFigure({ method, pointer }) {
  const positionAttribute = useRef(/** @type {import('three').BufferAttribute | null} */ (null))
  const normalAttribute = useRef(/** @type {import('three').BufferAttribute | null} */ (null))
  const energyAttribute = useRef(/** @type {import('three').BufferAttribute | null} */ (null))
  const detailAttribute = useRef(/** @type {import('three').BufferAttribute | null} */ (null))
  const material = useRef(/** @type {import('three').ShaderMaterial | null} */ (null))
  const data = useMemo(() => {
    const shapes = createParticleShapes(COUNT)
    const normals = createParticleNormals(shapes)
    const details = createParticleDetails(shapes)
    const colors = new Float32Array(COUNT * 3)
    const sizes = new Float32Array(COUNT)
    const seeds = new Float32Array(COUNT)
    const energy = new Float32Array(COUNT)
    const drift = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      const seed = ((i * 16807) % 2147483647) / 2147483647
      seeds[i] = (Math.sin(i * 127.1 + 311.7) * 43758.5453) % 1
      seeds[i] -= Math.floor(seeds[i])
      const variation = .96 + seeds[i] * .04
      colors.set([.93 * variation, .95 * variation, .94 * variation], i * 3)
      sizes[i] = .42 + seeds[i] * .24
      drift.set([Math.sin(i * 2.39), Math.cos(i * 1.71), Math.sin(seed * 912.5)], i * 3)
    }
    return {
      shapes, normals, details, colors, sizes, seeds, energy, drift,
      detailBase: details.password.slice(), detailFrom: details.password.slice(),
      normalBase: normals.password.slice(), normalFrom: normals.password.slice(),
      normalPositions: normals.password.slice(),
      base: shapes.password.slice(), from: shapes.password.slice(),
      positions: shapes.password.slice(), velocity: new Float32Array(COUNT * 3),
      elapsed: 0, morph: 1, yaw: 0, pitch: 0, pointerX: 0, pointerY: 0, pointerStrength: 0,
    }
  }, [])
  const uniforms = useMemo(() => ({ uPixelRatio: { value: 1 }, uTime: { value: 0 } }), [])

  useEffect(() => {
    // Snapshot the in-flight shape, so another tab click never snaps back.
    data.from.set(data.base)
    data.normalFrom.set(data.normalBase)
    data.detailFrom.set(data.detailBase)
    data.morph = 0
  }, [method, data])

  useFrame((state, frameDelta) => {
    const dt = Math.min(frameDelta, 1)
    data.elapsed += frameDelta
    data.morph = Math.min(1, data.morph + frameDelta)
    const t = data.elapsed
    const target = data.shapes[method]
    const targetNormals = data.normals[method]
    const targetDetails = data.details[method]
    // Keep long-running globe orbits continuous, then take the shortest route to the reading view.
    if (method === 'password') data.yaw += dt * .085
    else {
      const difference = Math.atan2(Math.sin(Math.sin(t * .38) * .1 - data.yaw), Math.cos(Math.sin(t * .38) * .1 - data.yaw))
      data.yaw += difference * (1 - Math.exp(-2.5 * dt))
    }
    data.pitch += (Math.sin(t * .34) * .045 - data.pitch) * Math.min(1, dt * 2)
    const cos = Math.cos(data.yaw), sin = Math.sin(data.yaw)
    const cp = Math.cos(data.pitch), sp = Math.sin(data.pitch)
    const bob = Math.sin(t * .6) * .055
    const pointerBlend = 1 - Math.exp(-8 * dt)
    data.pointerX += (pointer.current.x * state.viewport.width / 2 - data.pointerX) * pointerBlend
    data.pointerY += (pointer.current.y * state.viewport.height / 2 - data.pointerY) * pointerBlend
    data.pointerStrength += ((pointer.current.active ? 1 : 0) - data.pointerStrength) * (1 - Math.exp(-4 * dt))
    const mx = data.pointerX, my = data.pointerY
    const decay = Math.exp(-7 * dt)
    for (let i = 0; i < COUNT; i++) {
      const j = i * 3
      const seed = data.seeds[i]
      const localProgress = Math.max(0, Math.min(1, (data.morph - seed * .1) / .9))
      const progress = localProgress * localProgress * (3 - 2 * localProgress)
      data.detailBase[i] = data.detailFrom[i] + (targetDetails[i] - data.detailFrom[i]) * progress
      let x = data.from[j] + (target[j] - data.from[j]) * progress
      let y = data.from[j + 1] + (target[j + 1] - data.from[j + 1]) * progress
      let z = data.from[j + 2] + (target[j + 2] - data.from[j + 2]) * progress
      data.base[j] = x; data.base[j + 1] = y; data.base[j + 2] = z
      const nx = data.normalFrom[j] + (targetNormals[j] - data.normalFrom[j]) * progress
      const ny = data.normalFrom[j + 1] + (targetNormals[j + 1] - data.normalFrom[j + 1]) * progress
      const nz = data.normalFrom[j + 2] + (targetNormals[j + 2] - data.normalFrom[j + 2]) * progress
      data.normalBase[j] = nx; data.normalBase[j + 1] = ny; data.normalBase[j + 2] = nz
      data.normalPositions[j] = nx * cos + nz * sin
      const normalZ = -nx * sin + nz * cos
      data.normalPositions[j + 1] = ny * cp - normalZ * sp
      data.normalPositions[j + 2] = ny * sp + normalZ * cp
      const spread = Math.sin(progress * Math.PI) * .65
      x += data.drift[j] * spread
      y += data.drift[j + 1] * spread
      z += data.drift[j + 2] * spread
      if (method === 'magic') y += Math.sin(t * 1.2 + Math.abs(x) * 1.5) * Math.abs(x) * .025
      const breathing = Math.sin(t * .65 + x * 1.6 + y * 1.2) * .016
      x += nx * breathing; y += ny * breathing; z += nz * breathing
      let tx = x * cos + z * sin
      const rotatedZ = -x * sin + z * cos
      let ty = y * cp - rotatedZ * sp + bob
      let tz = y * sp + rotatedZ * cp
      // A small fringe stays detached, so the sculpture breathes outside its silhouette.
      if (seed < .018) {
        const driftPhase = t * .35 + seed * 1800
        tx += Math.cos(driftPhase) * .24 + nx * .18
        ty += Math.sin(driftPhase * .8) * .22 + ny * .18
        tz += Math.sin(driftPhase) * .25 + nz * .18
      }
      const dx = tx - mx, dy = ty - my
      const distance = Math.sqrt(dx * dx + dy * dy) + .001
      const falloff = Math.max(0, 1 - distance / 1.18)
      const influence = falloff * falloff * (3 - 2 * falloff) * data.pointerStrength
      // A persistent local eddy: neighbouring grains orbit at different depths and rates.
      const phase = t * (1.1 + seed * .8) + seed * Math.PI * 2
      const orbit = .22 + seed * .5
      tx += (dx / distance * .38 - dy / distance * .7 + Math.cos(phase) * orbit) * influence
      ty += (dy / distance * .38 + dx / distance * .7 + Math.sin(phase) * orbit) * influence
      tz += Math.sin(phase * .7) * influence * .7
      data.energy[i] = influence + Math.sin(progress * Math.PI) * .25
      // Exact critically damped spring: stable even when a slow GPU skips frames.
      for (let axis = 0; axis < 3; axis++) {
        const index = j + axis
        const destination = axis === 0 ? tx : axis === 1 ? ty : tz
        const displacement = data.positions[index] - destination
        const step = (data.velocity[index] + 7 * displacement) * dt
        data.positions[index] = destination + (displacement + step) * decay
        data.velocity[index] = (data.velocity[index] - 7 * step) * decay
      }
    }
    if (positionAttribute.current) positionAttribute.current.needsUpdate = true
    if (normalAttribute.current) normalAttribute.current.needsUpdate = true
    if (energyAttribute.current) energyAttribute.current.needsUpdate = true
    if (detailAttribute.current) detailAttribute.current.needsUpdate = true
    if (material.current) {
      material.current.uniforms.uPixelRatio.value = state.gl.getPixelRatio()
      material.current.uniforms.uTime.value = t
    }
  })

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute ref={positionAttribute} attach="attributes-position" args={[data.positions, 3]} usage={DynamicDrawUsage} />
        <bufferAttribute attach="attributes-color" args={[data.colors, 3]} />
        <bufferAttribute ref={normalAttribute} attach="attributes-aNormal" args={[data.normalPositions, 3]} usage={DynamicDrawUsage} />
        <bufferAttribute attach="attributes-aSize" args={[data.sizes, 1]} />
        <bufferAttribute ref={detailAttribute} attach="attributes-aDetail" args={[data.detailBase, 1]} usage={DynamicDrawUsage} />
        <bufferAttribute attach="attributes-aSeed" args={[data.seeds, 1]} />
        <bufferAttribute ref={energyAttribute} attach="attributes-aEnergy" args={[data.energy, 1]} usage={DynamicDrawUsage} />
      </bufferGeometry>
      <shaderMaterial ref={material} vertexShader={VERTEX} fragmentShader={FRAGMENT} uniforms={uniforms}
        transparent depthWrite vertexColors toneMapped={false} />
    </points>
  )
}

export default function ParticleScene({ method, active, onFailure, fallback }) {
  const pointer = useRef({ x: 0, y: 0, active: false })
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const lost = event => { event.preventDefault(); onFailure() }
    canvas?.addEventListener('webglcontextlost', lost)
    return () => canvas?.removeEventListener('webglcontextlost', lost)
  }, [onFailure])
  return (
    <div className="auth-canvas" onPointerMove={event => {
      if (event.pointerType === 'touch') return
      const rect = event.currentTarget.getBoundingClientRect()
      pointer.current.x = (event.clientX - rect.left) / rect.width * 2 - 1
      pointer.current.y = 1 - (event.clientY - rect.top) / rect.height * 2
      pointer.current.active = true
    }} onPointerLeave={() => { pointer.current.active = false }}>
      <Canvas ref={canvasRef} dpr={[1, 1.5]} camera={{ position: [0, 0, 7], fov: 36 }}
        frameloop={active ? 'always' : 'never'} gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }} fallback={fallback}>
        <ParticleFigure method={method} pointer={pointer} />
      </Canvas>
    </div>
  )
}
