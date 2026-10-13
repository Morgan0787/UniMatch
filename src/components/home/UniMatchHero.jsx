import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, Search, Sparkles } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/lib/i18n';
import './UniMatchHero.css';

const FRAME_COUNT = 120;
const MEDIA = `${import.meta.env.BASE_URL}media/unimatch-hero/`;
const COPY = {
    en: {
        headline: ['Your university.', 'Your new world.'],
        stages: ['Your potential', 'Your possibilities', 'Your next chapter'],
        scroll: 'Scroll to explore',
        skip: 'Explore UniMatch',
        aside: 'From your goals to your shortlist, see where studying abroad can take you.',
        routes: ['EUROPE', 'ASIA', 'SCHOLARSHIPS'],
        motion: 'Play the 3D scene while scrolling',
    },
    ru: {
        headline: ['Твой университет.', 'Твой новый мир.'],
        stages: ['Твой потенциал', 'Твои возможности', 'Твоя новая глава'],
        scroll: 'Листай и открывай',
        skip: 'Узнать о UniMatch',
        aside: 'От твоих целей до списка вузов — узнай, куда может привести учёба за рубежом.',
        routes: ['ЕВРОПА', 'АЗИЯ', 'СТИПЕНДИИ'],
        motion: 'Включить 3D-сцену при прокрутке',
    },
    uz: {
        headline: ['Sening universiteting.', 'Yangi dunyong.'],
        stages: ['Sening salohiyating', 'Sening imkoniyatlaring', 'Sening yangi sahifang'],
        scroll: 'Kashf qilish uchun suring',
        skip: 'UniMatch haqida',
        aside: 'Maqsadlaringdan mos universitetlar ro‘yxatigacha — xorijda o‘qish imkoniyatlarini ko‘r.',
        routes: ['YEVROPA', 'OSIYO', 'STIPENDIYALAR'],
        motion: 'Sahifani aylantirib 3D sahnani ko‘rish',
    },
};

/** Keep scroll and drawing outside React; retain at most 12 decoded frames. */
function useSequence(sectionRef, canvasRef, motionAllowed) {
    useEffect(() => {
        const section = sectionRef.current;
        const canvas = canvasRef.current;
        if (!section || !canvas) return;
        const context = canvas.getContext('2d', { alpha: true });
        if (!context) return;
        const mobile = window.matchMedia('(max-width: 767px)');
        const folder = mobile.matches ? 'mobile' : 'frames';
        const size = mobile.matches ? 560 : 960;
        canvas.width = canvas.height = size;
        /** @type {Map<number, ImageBitmap>} */
        const cache = new Map();
        /** @type {Map<number, AbortController>} */
        const pending = new Map();
        const failed = new Set();
        const retries = new Map();
        const retryTimers = new Set();
        let disposed = false;
        let raf = 0;
        let desired = 0;
        let displayed = -1;
        let direction = 1;
        let nearScene = true;
        let queue = [];

        function schedule() {
            if (!raf && !disposed) raf = window.requestAnimationFrame(update);
        }

        function pump() {
            while (!disposed && pending.size < 3 && queue.length) {
                const index = queue.shift();
                if (cache.has(index) || pending.has(index) || failed.has(index)) continue;
                const controller = new AbortController();
                pending.set(index, controller);
                let timedOut = false;
                const attempt = retries.get(index) || 0;
                const timeout = window.setTimeout(() => {
                    timedOut = true;
                    controller.abort();
                }, 8000 * (attempt + 1));
                fetch(`${MEDIA}${folder}/frame-${String(index + 1).padStart(4, '0')}.webp`, { signal: controller.signal })
                    .then(response => {
                        if (!response.ok) throw new Error('Frame unavailable');
                        return response.blob();
                    })
                    .then(blob => createImageBitmap(blob))
                    .then(bitmap => {
                        if (disposed || Math.abs(index - desired) > 12) {
                            bitmap.close();
                            return;
                        }
                        cache.set(index, bitmap);
                        while (cache.size > 12) {
                            const farthest = [...cache.keys()].sort((a, b) => Math.abs(b - desired) - Math.abs(a - desired))[0];
                            cache.get(farthest).close();
                            cache.delete(farthest);
                        }
                        schedule();
                    })
                    .catch(() => {
                        if (!controller.signal.aborted || timedOut) failed.add(index);
                        if (timedOut && !disposed && attempt < 2) {
                            retries.set(index, attempt + 1);
                            const retry = window.setTimeout(() => {
                                retryTimers.delete(retry);
                                failed.delete(index);
                                schedule();
                            }, 1000 * (attempt + 1));
                            retryTimers.add(retry);
                        }
                    })
                    .finally(() => {
                        window.clearTimeout(timeout);
                        pending.delete(index);
                        if (!disposed) pump();
                    });
            }
        }

        function update() {
            raf = 0;
            if (disposed) return;
            const bounds = section.getBoundingClientRect();
            const pin = section.querySelector('.um-hero__pin');
            const travel = Math.max(1, bounds.height - pin.clientHeight);
            const progress = motionAllowed ? Math.min(1, Math.max(0, (64 - bounds.top) / travel)) : 0;
            const next = Math.round(progress * (FRAME_COUNT - 1));
            if (next !== desired) direction = next > desired ? 1 : -1;
            desired = next;
            section.dataset.targetFrame = String(desired);
            section.dataset.stage = String(progress < 0.27 ? 0 : progress < 0.77 ? 1 : 2);
            section.style.setProperty('--um-progress', String(progress));
            if (cache.has(desired) && desired !== displayed) {
                context.clearRect(0, 0, size, size);
                context.drawImage(cache.get(desired), 0, 0, size, size);
                displayed = desired;
                section.dataset.frame = String(displayed);
                section.dataset.ready = 'true';
            }
            if (!nearScene && motionAllowed) return;
            const wanted = motionAllowed ? [0, 1, -1, 2, -2, 3, 4, 5, 6].map(offset => desired + offset * direction) : [0];
            queue = wanted.filter(index => index >= 0 && index < FRAME_COUNT && !cache.has(index) && !pending.has(index) && !failed.has(index));
            for (const [index, controller] of pending) {
                if (Math.abs(index - desired) > 12) controller.abort();
            }
            section.dataset.cachedFrames = String(cache.size);
            section.dataset.pendingFrames = String(pending.size);
            pump();
        }

        const observer = new IntersectionObserver(([entry]) => {
            nearScene = entry.isIntersecting;
            if (!nearScene) {
                queue = [];
                for (const controller of pending.values()) controller.abort();
            }
            schedule();
        }, { rootMargin: '200px' });
        observer.observe(section);
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);
        schedule();
        return () => {
            disposed = true;
            window.cancelAnimationFrame(raf);
            observer.disconnect();
            window.removeEventListener('scroll', schedule);
            window.removeEventListener('resize', schedule);
            for (const timer of retryTimers) window.clearTimeout(timer);
            for (const controller of pending.values()) controller.abort();
            for (const bitmap of cache.values()) bitmap.close();
        };
    }, [sectionRef, canvasRef, motionAllowed]);
}

export default function UniMatchHero() {
    const { t, language } = useLanguage();
    const copy = COPY[language] || COPY.en;
    const sectionRef = useRef(null);
    const canvasRef = useRef(null);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const [motionOptIn, setMotionOptIn] = useState(false);
    const motionAllowed = !prefersReducedMotion || motionOptIn;
    useSequence(sectionRef, canvasRef, motionAllowed);

    useEffect(() => {
        const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
        const updatePreference = event => setPrefersReducedMotion(event.matches);
        setPrefersReducedMotion(preference.matches);
        preference.addEventListener('change', updatePreference);
        return () => preference.removeEventListener('change', updatePreference);
    }, []);

    function skipScene(event) {
        event.preventDefault();
        const next = sectionRef.current?.nextElementSibling;
        if (next instanceof HTMLElement) {
            next.scrollIntoView({ behavior: 'auto', block: 'start' });
            next.setAttribute('tabindex', '-1');
            next.focus({ preventScroll: true });
        }
    }

    return (
        <section ref={sectionRef} className="um-hero" data-stage="0" data-motion-enabled={motionAllowed} aria-labelledby="um-hero-title">
            <div className="um-hero__pin">
                <div className="um-hero__layout">
                    <div className="um-hero__copy">
                        <h1 id="um-hero-title">{copy.headline[0]}<span>{copy.headline[1]}</span></h1>
                        <p className="um-hero__description">{t('home.subtitle')}</p>
                        <div className="um-hero__actions">
                            <Link className="um-hero__primary" to={createPageUrl('Search')}><Search size={18} aria-hidden="true" />{t('home.findMyUniversities')}<ArrowRight size={17} aria-hidden="true" /></Link>
                            <Link className="um-hero__secondary" to={createPageUrl('Profile')}>{t('home.buildMyProfile')}<ArrowRight size={17} aria-hidden="true" /></Link>
                        </div>
                        {prefersReducedMotion && !motionOptIn && (
                            <button className="um-hero__motion-toggle" type="button" onClick={() => setMotionOptIn(true)}>
                                <Sparkles size={14} aria-hidden="true" />{copy.motion}
                            </button>
                        )}
                    </div>
                    <aside className="um-hero__aside">
                        <p>{copy.aside}</p>
                        <div className="um-hero__routes" aria-hidden="true">
                            {copy.routes.map(route => <span key={route}>{route}</span>)}
                        </div>
                    </aside>
                    <div className="um-hero__art" aria-hidden="true">
                        <div className="um-hero__ambient" />
                        <img className="um-hero__poster" src={`${MEDIA}poster.webp`} alt="" width="960" height="960" fetchPriority="high" />
                        <canvas ref={canvasRef} className="um-hero__canvas" />
                    </div>
                </div>
                <div className="um-hero__footer">
                    <div className="um-hero__chapters" aria-hidden="true">{copy.stages.map((stage, i) => <span key={stage} data-chapter={i}><b>0{i + 1}</b>{stage}</span>)}</div>
                    <a href="#unimatch-interlude" className="um-hero__scroll" onClick={skipScene}><span>{copy.scroll}</span><ArrowDown size={15} aria-hidden="true" /><span className="sr-only">{copy.skip}</span></a>
                    <div className="um-hero__progress" aria-hidden="true" />
                </div>
            </div>
        </section>
    );
}

const INTERLUDE_COPY = {
    en: { eyebrow: 'A new chapter', first: 'Your future', second: 'starts with a choice.' },
    ru: { eyebrow: 'Новая глава', first: 'Твоё будущее', second: 'начинается с выбора.' },
    uz: { eyebrow: 'Yangi sahifa', first: 'Kelajaging', second: 'tanlovdan boshlanadi.' },
};

export function UniMatchInterlude() {
    const { language } = useLanguage();
    const copy = INTERLUDE_COPY[language] || INTERLUDE_COPY.en;

    return (
        <section className="um-interlude" id="unimatch-interlude" aria-labelledby="um-interlude-title">
            <div className="um-interlude__glow" aria-hidden="true" />
            <div className="um-interlude__content">
                <p>{copy.eyebrow}</p>
                <h2 id="um-interlude-title">{copy.first}<br /><span>{copy.second}</span></h2>
            </div>
        </section>
    );
}
