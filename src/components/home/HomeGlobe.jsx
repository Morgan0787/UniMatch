import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

const motionQuery = '(prefers-reduced-motion: reduce)';

const chapterAt = progress => progress < 0.29 ? 0 : progress < 0.53 ? 1 : progress < 0.79 ? 2 : 3;

export default function HomeGlobe({ onChapterChange }) {
    const canvasRef = useRef(null);
    const artworkRef = useRef(null);
    const refreshRef = useRef(() => {});
    const [ready, setReady] = useState(false);
    const [paused, setPaused] = useState(null);
    const [reduced, setReduced] = useState(() => window.matchMedia(motionQuery).matches);
    const stoppedRef = useRef(reduced);
    const reducedRef = useRef(reduced);
    const stopped = paused ?? reduced;
    const motionLabel = stopped ? 'Включить плавное движение 3D-сцены' : 'Остановить плавное движение 3D-сцены';

    useEffect(() => {
        stoppedRef.current = stopped;
        reducedRef.current = reduced && stopped;
        refreshRef.current();
    }, [stopped, reduced]);

    useEffect(() => {
        const media = window.matchMedia(motionQuery);
        const update = () => { setReduced(media.matches); setPaused(null); };
        media.addEventListener('change', update);
        return () => media.removeEventListener('change', update);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const artwork = artworkRef.current;
        const hero = artwork.closest('.um-hero');
        const story = artwork.closest('.um-story');
        const abort = new AbortController();
        const pointer = { x: 0, y: 0 };
        let alive = true;
        let frame = 0;
        let lastTime = 0;
        let lastPaint = 0;
        let inView = true;
        let failed = false;
        let scene;
        let scrollFrame = 0;
        let progress = 0;
        let chapter = 0;

        function fail() {
            failed = true;
            cancelAnimationFrame(frame);
            frame = 0;
            scene?.dispose();
            scene = undefined;
            if (alive) setReady(false);
        }

        function render(delta = 0) {
            try {
                scene?.render(delta, stoppedRef.current ? { x: 0, y: 0 } : pointer);
            } catch {
                fail();
            }
        }

        function tick(time) {
            frame = 0;
            if (!alive || failed || document.hidden || !inView || stoppedRef.current) return;
            // Bound GPU work even on high-refresh displays and software WebGL.
            if (time - lastPaint < 1000 / 30) {
                frame = requestAnimationFrame(tick);
                return;
            }
            lastPaint = time;
            const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
            lastTime = time;
            render(delta);
            if (!failed) frame = requestAnimationFrame(tick);
        }

        function refresh() {
            cancelAnimationFrame(frame);
            frame = 0;
            lastTime = 0;
            lastPaint = 0;
            if (!scene || !alive || failed || document.hidden || !inView) return;
            if (stoppedRef.current) render();
            else frame = requestAnimationFrame(tick);
        }
        refreshRef.current = () => {
            scene?.setProgress(progress, reducedRef.current);
            refresh();
        };

        function resize() {
            if (!scene || failed) return;
            const { width, height } = artwork.getBoundingClientRect();
            if (width <= 0 || height <= 0) return;
            scene.resize(width, height);
            scene.setProgress(progress, reducedRef.current);
            render();
            refresh();
        }

        function updateScroll() {
            scrollFrame = 0;
            const bounds = story.getBoundingClientRect();
            const travel = Math.max(1, bounds.height - window.innerHeight);
            progress = Math.max(0, Math.min(1, -bounds.top / travel));
            const nextChapter = chapterAt(progress);
            if (nextChapter !== chapter) {
                chapter = nextChapter;
                onChapterChange(nextChapter);
            }
            scene?.setProgress(progress, reducedRef.current);
            if (scene && stoppedRef.current) render();
        }
        function scheduleScroll() {
            if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
        }

        function move(event) {
            if (event.pointerType !== 'mouse' || stoppedRef.current) return;
            const bounds = hero.getBoundingClientRect();
            pointer.x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
            pointer.y = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
        }
        function leave() { pointer.x = 0; pointer.y = 0; }
        function contextLost(event) {
            event.preventDefault();
            fail();
        }

        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(artwork);
        resizeObserver.observe(story);
        const intersection = new IntersectionObserver(([entry]) => {
            inView = entry.isIntersecting;
            refresh();
        });
        intersection.observe(artwork);
        hero.addEventListener('pointermove', move, { passive: true });
        hero.addEventListener('pointerleave', leave);
        canvas.addEventListener('webglcontextlost', contextLost);
        document.addEventListener('visibilitychange', refresh);
        window.addEventListener('scroll', scheduleScroll, { passive: true });
        window.addEventListener('resize', scheduleScroll);
        scheduleScroll();

        async function initialize() {
            try {
                const [module, response] = await Promise.all([
                    import('./globeScene'),
                    fetch('/geo/land-110m.json', { signal: abort.signal }),
                ]);
                if (!response.ok) throw new Error('Globe geography unavailable');
                const land = await response.json();
                if (!alive) return;
                scene = module.createGlobeScene(canvas, land, window.matchMedia('(max-width: 760px)').matches);
                scene.setProgress(progress, reducedRef.current);
                resize();
                if (!failed) setReady(true);
            } catch {
                if (alive) fail();
            }
        }
        initialize();

        return () => {
            alive = false;
            abort.abort();
            cancelAnimationFrame(frame);
            cancelAnimationFrame(scrollFrame);
            resizeObserver.disconnect();
            intersection.disconnect();
            hero.removeEventListener('pointermove', move);
            hero.removeEventListener('pointerleave', leave);
            canvas.removeEventListener('webglcontextlost', contextLost);
            document.removeEventListener('visibilitychange', refresh);
            window.removeEventListener('scroll', scheduleScroll);
            window.removeEventListener('resize', scheduleScroll);
            refreshRef.current = () => {};
            scene?.dispose();
        };
    }, []);

    return (
        <>
            <div className={`um-art${ready ? ' um-art-live' : ''}`} ref={artworkRef} aria-hidden="true">
                <img src="/images/unimatch-world.png" alt="" width="1536" height="1024" loading="eager" />
                <canvas ref={canvasRef} className="um-globe-canvas" />
            </div>
            {ready && (
                <button
                    type="button"
                    className="um-motion-control"
                    onClick={() => setPaused(!stopped)}
                    aria-label={motionLabel}
                    title={motionLabel}
                >
                    {stopped ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
                    <span>{motionLabel}</span>
                </button>
            )}
        </>
    );
}
