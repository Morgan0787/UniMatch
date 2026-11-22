import React, { useEffect, useMemo, useRef } from 'react';
import './particle-loader.css';

const VARIANT_CONFIG = {
  full: { size: 196, count: 780 },
  card: { size: 132, count: 440 },
  pill: { size: 38, count: 115 },
  orbit: { size: 32, count: 90 },
};

const DEFAULT_LABELS = {
  en: 'Loading UniMatch…',
  ru: 'Загружаем UniMatch…',
  uz: 'UniMatch yuklanmoqda…',
};

function resolveFallbackLabel() {
  if (typeof document === 'undefined') return DEFAULT_LABELS.en;
  const lang = document.documentElement?.lang?.toLowerCase()?.slice(0, 2);
  return DEFAULT_LABELS[lang] || DEFAULT_LABELS.en;
}

function createLoaderParticles(count) {
  const particles = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  let state = 1337;
  const rand = () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };

  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const isHalo = i % 6 === 0;
    const u = rand();
    const shell = isHalo ? 0.88 + rand() * 0.24 : 0.48 + 0.52 * Math.cbrt(u);
    const phi = Math.acos(1 - 2 * t);
    const theta = i * goldenAngle + (rand() - 0.5) * 0.35;

    particles.push({
      phi,
      theta,
      shell,
      sizeBias: isHalo ? 0.58 + rand() * 0.45 : 0.72 + rand() * 0.82,
      phase: rand() * Math.PI * 2,
      speed: 0.72 + rand() * 0.56,
      tone: rand(),
    });
  }
  return particles;
}

function renderParticlesFrame(ctx, width, height, particles, time, compactGlow) {
  ctx.clearRect(0, 0, width, height);

  const cx = width * 0.5;
  const cy = height * 0.5;
  const radius = Math.min(width, height) * 0.36;

  // Soft warm stone-champagne backdrop halo so bright pearl micro-grains shine crisply even on white glass cards.
  const halo = ctx.createRadialGradient(cx - radius * 0.1, cy - radius * 0.1, radius * 0.08, cx, cy, radius * 1.24);
  halo.addColorStop(0, compactGlow ? 'rgba(174, 148, 118, 0.36)' : 'rgba(172, 148, 120, 0.42)');
  halo.addColorStop(0.48, compactGlow ? 'rgba(216, 184, 146, 0.2)' : 'rgba(218, 186, 148, 0.26)');
  halo.addColorStop(0.78, compactGlow ? 'rgba(232, 214, 193, 0.08)' : 'rgba(232, 214, 193, 0.12)');
  halo.addColorStop(1, 'rgba(244, 239, 232, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 1.24, 0, Math.PI * 2);
  ctx.fill();

  const rotY = time * 0.58;
  const rotX = 0.3 + 0.1 * Math.sin(time * 0.45);
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);

  const projected = [];
  const scaleBase = Math.max(0.55, Math.min(width, height) / 210);

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const breath = 1 + 0.08 * Math.sin(time * 1.45 - p.phi * 1.9 + p.phase * 0.4) + 0.035 * Math.cos(time * 2.1 + p.phase);
    const swirl = p.theta + time * 0.2 * p.speed + 0.1 * Math.sin(time * 1.05 + p.phi);
    const tiltPhi = p.phi + 0.045 * Math.cos(time * 0.85 + p.phase);

    const sinPhi = Math.sin(tiltPhi);
    const lx = p.shell * breath * sinPhi * Math.cos(swirl);
    const ly = p.shell * breath * Math.cos(tiltPhi);
    const lz = p.shell * breath * sinPhi * Math.sin(swirl);

    // Rotate around Y then X for coherent 3D sculptural orb drift.
    const rx = lx * cosY - lz * sinY;
    const rz0 = lx * sinY + lz * cosY;
    const ry = ly * cosX - rz0 * sinX;
    const rz = ly * sinX + rz0 * cosX;

    const perspective = 2.65 / (2.65 - rz);
    const sx = cx + rx * radius * perspective;
    const sy = cy + ry * radius * perspective;

    const depth = (rz + 1.25) / 2.5;
    const glint = Math.pow(Math.max(0, Math.sin(time * 1.8 + p.phase * 9.7)), 10);
    const pointSize = Math.max(0.45, Math.min(1.55, p.sizeBias * (0.48 + depth * 0.62) * scaleBase * (0.85 + perspective * 0.18)));

    projected.push({ sx, sy, depth, pointSize, tone: p.tone, glint });
  }

  projected.sort((a, b) => a.depth - b.depth);

  for (let i = 0; i < projected.length; i++) {
    const pt = projected[i];
    const alpha = Math.min(0.95, Math.max(0.22, 0.24 + pt.depth * 0.58 + pt.glint * 0.18));

    if (pt.tone < 0.18 && pt.depth < 0.44) {
      // Subtle stone-bronze shadow micro-grains anchor 3D depth over light pearl backgrounds.
      ctx.fillStyle = `rgba(134, 108, 82, ${alpha * 0.72})`;
    } else if (pt.tone < 0.52) {
      ctx.fillStyle = `rgba(214, 174, 128, ${alpha * 0.86})`;
    } else {
      ctx.fillStyle = `rgba(255, 253, 249, ${alpha})`;
    }

    ctx.beginPath();
    ctx.arc(pt.sx, pt.sy, pt.pointSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Animated 3D-projected Warm Pearl micro-particle sphere loader used for navigation transitions,
 * authenticated bootstrap checks, and inline asynchronous loading surfaces.
 * @param {{
 *   variant?: 'full' | 'card' | 'pill' | 'orbit',
 *   size?: number,
 *   label?: string,
 *   decorative?: boolean,
 *   overlay?: boolean,
 *   className?: string,
 * }} [props]
 */
export default function ParticleLoader({
  variant = 'full',
  size = undefined,
  label = undefined,
  decorative = false,
  overlay = false,
  className = '',
} = {}) {
  const canvasRef = useRef(/** @type {HTMLCanvasElement | null} */ (null));
  const preset = VARIANT_CONFIG[variant] || VARIANT_CONFIG.full;
  const resolvedSize = size ?? preset.size;
  const particles = useMemo(() => createLoaderParticles(preset.count), [preset.count]);
  const resolvedLabel = label !== undefined ? label : resolveFallbackLabel();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(resolvedSize * dpr);
    canvas.height = Math.round(resolvedSize * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const compactGlow = variant === 'pill' || variant === 'orbit';
    const media = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;

    if (media?.matches) {
      renderParticlesFrame(ctx, resolvedSize, resolvedSize, particles, 0.45, compactGlow);
      return undefined;
    }

    let rafId = 0;
    const startedAt = performance.now();

    const tick = (now) => {
      const elapsed = (now - startedAt) / 1000;
      renderParticlesFrame(ctx, resolvedSize, resolvedSize, particles, elapsed, compactGlow);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [particles, resolvedSize, variant]);

  const canvasNode = (
    <canvas
      ref={canvasRef}
      width={resolvedSize}
      height={resolvedSize}
      style={{ width: `${resolvedSize}px`, height: `${resolvedSize}px` }}
      className="particle-loader-canvas"
      aria-hidden="true"
    />
  );

  if (variant === 'orbit') {
    return (
      <span
        className={`particle-loader-orbit ${className}`.trim()}
        role={decorative ? undefined : 'status'}
        aria-live={decorative ? undefined : 'polite'}
        aria-label={decorative ? undefined : (resolvedLabel || resolveFallbackLabel())}
      >
        {canvasNode}
      </span>
    );
  }

  if (variant === 'pill') {
    return (
      <div
        className={`particle-loader-pill ${className}`.trim()}
        role={decorative ? undefined : 'status'}
        aria-live={decorative ? undefined : 'polite'}
        aria-busy="true"
      >
        {canvasNode}
        {resolvedLabel ? <span>{resolvedLabel}</span> : null}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={`particle-loader-card ${className}`.trim()}
        role={decorative ? undefined : 'status'}
        aria-live={decorative ? undefined : 'polite'}
        aria-busy="true"
      >
        <div className="particle-loader-orb-wrap">{canvasNode}</div>
        {resolvedLabel ? <p className="particle-loader-label">{resolvedLabel}</p> : null}
      </div>
    );
  }

  return (
    <div
      className={`particle-loader-stage ${overlay ? 'particle-loader-fixed' : ''} ${className}`.trim()}
      role={decorative ? undefined : 'status'}
      aria-live={decorative ? undefined : 'polite'}
      aria-busy="true"
    >
      <div className="particle-loader-panel">
        <div className="particle-loader-orb-wrap">{canvasNode}</div>
        {resolvedLabel ? (
          <div className="particle-loader-caption">
            <span className="particle-loader-dot" aria-hidden="true" />
            <span>{resolvedLabel}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
