import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, X } from 'lucide-react';
import { getLandingLabels } from './labels';
import { HeroLoadingScreen } from './HeroSceneFallback';
import { HERO_CENTERS } from './heroSceneData.js';
import { createHeroSceneRenderer, getHeroSceneFrame, HERO_SCENE_DURATION, projectHeroPoint } from './heroSceneRenderer.js';
import './hero-scene.css';

gsap.registerPlugin(ScrollTrigger);
const connections = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0], [0, 2], [2, 5]];

/** No playback clock: every visual state is a function of scroll time. */
export default function HeroExplorer({ heroRef, language, reduced, blocked, onDetail, universities: suppliedUniversities = [] }) {
  const copy = getLandingLabels(language);
  const universities = Array.isArray(suppliedUniversities) ? suppliedUniversities.filter(u => u?.id && u?.name).slice(0, 4) : [];
  const [ready, setReady] = useState(false), [available, setAvailable] = useState(true);
  const [attempt, setAttempt] = useState(0), [stage, setStage] = useState(0), [selected, setSelected] = useState(null);
  const root = useRef(null), canvas = useRef(null), surface = useRef(null);
  const labels = useRef([]), cores = useRef([]), earthCore = useRef(null), links = useRef(null);
  const origin = useRef(null), originLabel = useRef(null), pulse = useRef(null), caption = useRef(null);
  const dimensions = useRef({ width: 1, height: 1, labels: [] });
  const sceneTime = useRef(0), phase = useRef(0);
  const requestRender = useRef(() => {}), measureScene = useRef(() => {});
  const blockedRef = useRef(blocked), visible = useRef(true);
  blockedRef.current = blocked;
  const university = universities[selected ?? 0];
  const languageIndex = language === 'ru' ? 1 : 0;
  const failed = useCallback(() => { setAvailable(false); setReady(false); }, []);

  const updateOverlay = useCallback(time => {
    const { width, height, labels: bounds } = dimensions.current;
    const frame = getHeroSceneFrame(time, width, height);
    const position = (node, x, y, opacity) => {
      if (!node) return;
      node.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) translate(-50%,-50%)`;
      node.style.opacity = String(opacity);
      node.style.visibility = opacity > 0.035 ? 'visible' : 'hidden';
    };
    frame.labels.forEach((point, i) => {
      const edge = Math.min((bounds[i]?.width || 80) / 2 + 8, width / 2);
      const verticalEdge = (bounds[i]?.height || 24) / 2 + 4;
      position(labels.current[i], Math.max(edge, Math.min(width - edge, point.x)), Math.max(verticalEdge, Math.min(height - verticalEdge, point.y)), point.opacity);
      if (i === 3 && labels.current[i]?.tagName === 'BUTTON') labels.current[i].tabIndex = point.opacity > 0.035 ? 0 : -1;
    });
    const glow = (node, x, y, size, opacity) => {
      if (!node) return;
      node.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${(size / 200).toFixed(4)})`;
      node.style.opacity = String(opacity);
    };
    glow(earthCore.current, frame.earth[0], frame.earth[1], frame.scale * 1.75, 1 - frame.a);
    frame.cores.forEach((point, i) => glow(cores.current[i], point.x, point.y, point.size, point.opacity));
    position(origin.current, frame.origin[0], frame.origin[1], frame.c);
    position(originLabel.current, frame.origin[0], frame.origin[1] + 26, frame.c);
    position(pulse.current, frame.pulse[0], frame.pulse[1], frame.pulseOpacity);
    if (caption.current) caption.current.style.transform = `translateY(${frame.captionY.toFixed(2)}px)`;
    if (links.current) links.current.style.opacity = String(frame.a * (1 - frame.b) * 0.10);
    if (phase.current !== frame.stage) { phase.current = frame.stage; setStage(frame.stage); }
    if (root.current) {
      root.current.dataset.sceneTime = time.toFixed(3);
      root.current.dataset.sceneProgress = (time / HERO_SCENE_DURATION).toFixed(5);
    }
  }, []);

  useEffect(() => {
    const node = canvas.current, container = surface.current;
    if (!node || !container) return;
    let renderer, preparationTimeout;
    let disposed = false, request = 0, hasFrame = false, frameCount = 0;
    const draw = () => {
      request = 0;
      if (disposed || !renderer || !visible.current || blockedRef.current || document.hidden) return;
      try {
        const drawStarted = performance.now();
        if (!renderer.render(sceneTime.current)) return;
        updateOverlay(sceneTime.current);
        frameCount += 1;
        if (root.current) {
          root.current.dataset.renderFrames = String(frameCount);
          // CPU submission only; dirty-render gaps do not measure display FPS.
          root.current.dataset.drawCpuMs = (performance.now() - drawStarted).toFixed(2);
        }
        if (!hasFrame) { hasFrame = true; clearTimeout(preparationTimeout); setReady(true); }
      } catch { failed(); }
    };
    // Render after GSAP/Lenis updates in their existing frame, not a second RAF.
    // Joining their ticker avoids an extra frame of input latency.
    const tick = () => { if (request) draw(); };
    gsap.ticker.add(tick);
    const queue = () => {
      if (!disposed && renderer && visible.current && !blockedRef.current && !document.hidden) request = 1;
    };
    requestRender.current = queue;
    const measure = () => {
      const { width, height } = container.getBoundingClientRect();
      dimensions.current = { width, height, labels: labels.current.map(label => ({ width: label?.offsetWidth || 0, height: label?.offsetHeight || 0 })) };
      renderer?.resize(width, height, window.devicePixelRatio);
      container.querySelectorAll('line').forEach((line, i) => {
        const [first, second] = connections[i];
        const p = projectHeroPoint(HERO_CENTERS[first], width, height), q = projectHeroPoint(HERO_CENTERS[second], width, height);
        line.setAttribute('x1', String(p[0])); line.setAttribute('y1', String(p[1]));
        line.setAttribute('x2', String(q[0])); line.setAttribute('y2', String(q[1]));
      });
      queue();
    };
    measureScene.current = measure;
    const resize = new ResizeObserver(measure);
    resize.observe(container);
    const intersection = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting;
      if (entry.isIntersecting) queue();
      else request = 0;
    }, { threshold: 0.01 });
    intersection.observe(container);
    document.addEventListener('visibilitychange', queue);
    let worker;
    try {
      worker = new Worker(new URL('./heroScene.worker.js', import.meta.url), { type: 'module' });
      worker.onmessage = event => {
        worker.terminate();
        clearTimeout(preparationTimeout);
        if (disposed) return;
        try {
          renderer = createHeroSceneRenderer(node, event.data, failed);
          if (root.current) root.current.dataset.particles = String(renderer.count);
          measure();
        } catch { failed(); }
      };
      worker.onerror = event => { event.preventDefault(); if (!disposed) failed(); };
      worker.postMessage({ count: window.innerWidth < 600 ? 24000 : 48000 });
      preparationTimeout = window.setTimeout(() => {
        if (!renderer && !disposed) { worker.terminate(); failed(); }
      }, 12000);
    } catch { failed(); }
    return () => {
      disposed = true; worker?.terminate();
      clearTimeout(preparationTimeout);
      gsap.ticker.remove(tick);
      resize.disconnect(); intersection.disconnect();
      document.removeEventListener('visibilitychange', queue);
      renderer?.dispose();
      requestRender.current = () => {}; measureScene.current = () => {};
    };
  }, [attempt, failed, updateOverlay]);

  useEffect(() => { measureScene.current(); }, [language, selected, universities.length]);
  useEffect(() => { surface.current?.toggleAttribute('inert', !ready); }, [ready]);
  useEffect(() => { if (!blocked) requestRender.current(); }, [blocked]);
  useEffect(() => {
    if (!ready || !available || reduced) return;
    const value = { progress: 0 };
    const timeline = gsap.to(value, {
      progress: 1, ease: 'none',
      scrollTrigger: {
        id: 'unimatch-hero-story', trigger: heroRef.current, start: 'top top',
        end: () => `+=${window.innerHeight * (window.innerWidth < 600 ? 2.8 : 3.0)}`,
        pin: true, refreshPriority: 10, scrub: 0.55, invalidateOnRefresh: true,
      },
      onUpdate: () => {
        sceneTime.current = value.progress * HERO_SCENE_DURATION;
        heroRef.current?.classList.toggle('hero-immersed', value.progress > .00001);
        requestRender.current();
      },
    });
    ScrollTrigger.refresh();
    return () => { timeline.scrollTrigger?.kill(); timeline.kill(); heroRef.current?.classList.remove('hero-immersed'); };
  }, [heroRef, ready, available, reduced]);

  return <div ref={root} className={`hero-explorer pearl-story ${ready ? 'scene-ready' : available ? 'scene-loading' : ''}`} data-renderer={ready ? 'webgl' : available ? 'loading' : 'unavailable'} data-scene-time="0" data-motion={reduced ? 'reduced' : 'scroll'}>
    {!ready && available && <HeroLoadingScreen language={language} />}
    <div ref={surface} className="hero-scene-stage" aria-hidden={!ready}>
      <div className="hero-scene-cores" aria-hidden="true">
        <div ref={earthCore} className="hero-scene-core" />
        {HERO_CENTERS.map((_, i) => <div key={i} className="hero-scene-core" ref={node => { cores.current[i] = node; }} />)}
      </div>
      <canvas key={attempt} ref={canvas} className="hero-particle-canvas" role="img" aria-label={copy.scene} />
      <svg ref={links} className="hero-scene-links" aria-hidden="true">{connections.map((pair, i) => <line key={i} />)}</svg>
      <div className="hero-scene-labels">
        {copy.sceneSubjects.map((text, i) => i === 3 && university
          ? <button key={i} ref={node => { labels.current[i] = node; }} className="hero-subject-label hero-university-label" tabIndex={-1} aria-label={`${copy.explore} ${university.name}`} onClick={() => setSelected(selected ?? 0)}>{selected === null ? text : university.name}<ArrowUpRight size={11} /></button>
          : <span key={i} ref={node => { labels.current[i] = node; }} className={`hero-subject-label ${i === 3 ? 'hero-university-label' : ''}`}>{text}</span>)}
        <span ref={originLabel} className="hero-subject-label">{copy.sceneYou}</span>
      </div>
      <div ref={origin} className="hero-route-dot" aria-hidden="true" /><div ref={pulse} className="hero-route-pulse" aria-hidden="true" />
      <p ref={caption} className="hero-scene-caption" aria-live="polite">{copy.sceneChapters[stage]}</p>
    </div>
    <p id="scene-instructions" className="scene-instructions">{!available ? copy.sceneUnavailable : ready ? reduced ? copy.sceneReducedInstructions : copy.sceneInstructions : ''}</p>
    {!available && <button className="hero-scene-retry" onClick={() => {
      setAvailable(true); setAttempt(value => value + 1); setSelected(null);
    }}>{copy.retry}</button>}
    {selected !== null && university && <article className="scene-preview" aria-live="polite">
      <button className="scene-preview-close" onClick={() => { setSelected(null); labels.current[3]?.focus(); }} aria-label={copy.closePreview}><X size={16} /></button>
      <span className="eyebrow">{Array.isArray(university.country) ? university.country[languageIndex] : university.country}</span>
      <h2>{university.name}</h2>
      {university.description && <p>{Array.isArray(university.description) ? university.description[languageIndex] : university.description}</p>}
      <div className="hero-university-options" aria-label={copy.sceneUniversities}>{universities.map((item, i) => <button key={item.id} aria-label={item.name} aria-pressed={selected === i} onClick={() => setSelected(i)}>{i + 1}</button>)}</div>
      <button className="text-link" onClick={() => onDetail?.(university)}>{copy.exploreUniversity}<ArrowUpRight size={16} /></button>
    </article>}
  </div>;
}
