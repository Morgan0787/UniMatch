import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
gsap.registerPlugin(ScrollTrigger);
export function usePageMotion(root, language, blocked, reduced) {
    const lenisRef = useRef(null);
    const blockedRef = useRef(blocked);
    useEffect(() => {
        if (reduced)
            return;
        // Lenis is the single scroll engine. Touch keeps native scrolling.
        const lenis = new Lenis({
            lerp: 0.085,
            smoothWheel: true,
            syncTouch: false,
            anchors: { duration: 1.4, offset: -90 },
        });
        lenisRef.current = lenis;
        lenis.on("scroll", ScrollTrigger.update);
        const tick = (time) => lenis.raf(time * 1000);
        // Scroll first, then GSAP's scrub tweens, then the hero's dirty draw.
        gsap.ticker.add(tick, false, true);
        // MDX gently advances the first editorial screens after input settles.
        // Use the same Lenis instance, allow interruption, and leave keyboard
        // navigation and the rest of the page in ordinary document flow.
        let snapTimer;
        let touchY = 0;
        const settle = (direction, target) => {
            window.clearTimeout(snapTimer);
            if (target instanceof Element && target.closest("a, button, input, textarea, select, [role=dialog]")) return;
            snapTimer = window.setTimeout(() => {
                const el = root.current;
                if (!el || blockedRef.current) return;
                const first = el.querySelector(".intro-upper");
                const next = el.querySelector(".experience-heading");
                if (!first || !next) return;
                const position = window.scrollY;
                const firstTop = first.closest("section").getBoundingClientRect().top + position;
                const nextTop = next.closest("section").getBoundingClientRect().top + position;
                if (position < firstTop - innerHeight * 0.55 || position > nextTop + innerHeight * 0.12) return;
                const stops = [firstTop + Math.max(0, (first.clientHeight - innerHeight) / 2), nextTop];
                const destination = direction > 0
                    ? stops.find(stop => stop > position + 35)
                    : [...stops].reverse().find(stop => stop < position - 35);
                if (destination !== undefined) lenis.scrollTo(destination, { duration: 0.85 });
            }, 220);
        };
        const onWheel = (event) => {
            if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) settle(Math.sign(event.deltaY), event.target);
        };
        const onTouchStart = (event) => { touchY = event.touches[0]?.clientY ?? 0; };
        const onTouchEnd = (event) => {
            const distance = touchY - (event.changedTouches[0]?.clientY ?? touchY);
            if (Math.abs(distance) > 20) settle(Math.sign(distance), event.target);
        };
        window.addEventListener("wheel", onWheel, { passive: true });
        window.addEventListener("touchstart", onTouchStart, { passive: true });
        window.addEventListener("touchend", onTouchEnd, { passive: true });
        return () => {
            window.clearTimeout(snapTimer);
            window.removeEventListener("wheel", onWheel);
            window.removeEventListener("touchstart", onTouchStart);
            window.removeEventListener("touchend", onTouchEnd);
            gsap.ticker.remove(tick);
            lenis.destroy();
            lenisRef.current = null;
        };
    }, [root, reduced]);
    useEffect(() => {
        blockedRef.current = blocked;
        if (blocked)
            lenisRef.current?.stop();
        else
            lenisRef.current?.start();
    }, [blocked, reduced]);
    useEffect(() => {
        const el = root.current;
        if (!el)
            return;
        if (reduced) {
            el.querySelectorAll("[data-counter]").forEach((target) => {
                target.textContent = String(Number(target.dataset.counter)).padStart(2, "0");
            });
            ScrollTrigger.refresh();
            return;
        }
        const ctx = gsap.context(() => {
            const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
            intro
                .from(".site-header", { opacity: 0, y: -12, duration: 0.9 }, 0)
                .from(".hero-title .line-inner", { yPercent: 110, duration: 1.2, stagger: 0.12 }, 0.15)
                .from(".hero-description", { opacity: 0, y: 22, duration: 1 }, 0.45)
                .from(".hero-action", { opacity: 0, y: 20, duration: 1 }, 0.6)
                .from(".hero-side", { opacity: 0, y: 22, duration: 1.1 }, 0.5);
            // Whole headings preserve natural wrapping; copy enters separately.
            const editorialScreens = [
                el.querySelector(".intro-upper"),
                el.querySelector(".experience-heading"),
            ].filter(Boolean);
            const heroExit = gsap.timeline({ scrollTrigger: {
                trigger: ".intro-section", start: "top bottom", end: "top 15%", scrub: 0.45,
            }});
            heroExit.fromTo(".hero-content, .scroll-hint", { autoAlpha: 1, y: 0 }, {
                autoAlpha: 0, y: -65, ease: "none",
            }, 0).fromTo(".hero-visual", { autoAlpha: 1, yPercent: 0 }, {
                autoAlpha: 0, yPercent: -8, ease: "none",
            }, 0);
            editorialScreens.forEach((screen) => {
                const heading = screen.querySelector("h2");
                const copy = screen.querySelector(".intro-copy, .experience-lead");
                const eyebrow = screen.querySelector(".eyebrow");
                gsap.from([eyebrow, heading, copy].filter(Boolean), {
                    y: (index) => index === 1 ? 110 : 75,
                    autoAlpha: 0, duration: 1.05, stagger: 0.1, ease: "power3.out",
                    scrollTrigger: { trigger: screen,
                        start: () => `top+=${heading.offsetTop} 92%`,
                        invalidateOnRefresh: true, toggleActions: "play none none reverse" },
                });
                gsap.to(screen, { autoAlpha: 0, y: -60, ease: "none",
                    scrollTrigger: { trigger: screen, start: "bottom 55%",
                        end: "bottom 8%", scrub: 0.45 } });
            });
            el.querySelectorAll("[data-reveal]").forEach((target) => {
                if (target.closest(".intro-upper, .experience-heading, .discover-section, .footer")) return;
                gsap.from(target, {
                    y: 35,
                    opacity: 0,
                    duration: 1.1,
                    ease: "power3.out",
                    scrollTrigger: { trigger: target, start: "top 87%", once: true },
                });
            });
            el.querySelectorAll("[data-text-reveal]").forEach((target) => {
                if (target.closest(".intro-upper, .experience-heading, .discover-section, .footer")) return;
                gsap.from(target, {
                    y: 60,
                    opacity: 0,
                    duration: 1.1,
                    ease: "power3.out",
                    scrollTrigger: { trigger: target, start: "top 84%", once: true },
                });
            });
            el.querySelectorAll("[data-counter]").forEach((target) => {
                const count = { value: 0 };
                const final = Number(target.dataset.counter);
                gsap.to(count, {
                    value: final,
                    duration: 1.2,
                    ease: "power2.out",
                    scrollTrigger: { trigger: target, start: "top 90%", once: true },
                    onUpdate: () => {
                        target.textContent = String(Math.round(count.value)).padStart(2, "0");
                    },
                });
            });
            const media = gsap.matchMedia();
            const select = gsap.utils.selector(el);
            media.add({ desktop: "(min-width: 800px)", mobile: "(max-width: 799px)" }, (context) => {
                const desktop = context.conditions.desktop;
                const frame = el.querySelector(".experience-media");
                if (frame) {
                    gsap.fromTo(frame, { clipPath: `inset(14% ${desktop ? 26 : 22}% 0% ${desktop ? 26 : 22}% round ${desktop ? 44 : 24}px)` }, {
                        clipPath: `inset(0% 0% 0% 0% round ${desktop ? 44 : 24}px)`,
                        ease: "none",
                        scrollTrigger: {
                            trigger: frame,
                            start: "top 95%",
                            end: "top 12%",
                            scrub: 0.65,
                        },
                    });
                    ScrollTrigger.create({ trigger: frame, start: "top 12%",
                        end: () => `+=${innerHeight * (desktop ? 0.65 : 0.45)}`,
                        pin: true, anticipatePin: 1, invalidateOnRefresh: true });
                }
                const scene = el.querySelector(".approach-stage");
                if (scene) {
                    const timeline = gsap.timeline({
                        scrollTrigger: {
                            trigger: scene,
                            start: "top top",
                            end: () => `+=${innerHeight * (desktop ? 1 : 0.8)}`,
                            pin: true,
                            scrub: 1,
                            anticipatePin: 1,
                        },
                    });
                    timeline
                        .to(select(".approach-title"), { autoAlpha: 0, y: -35, duration: 0.25 }, 0)
                        .fromTo(select(".orbit-tag-0"), { x: 0, y: 0 }, { x: desktop ? -55 : -8, y: desktop ? -60 : -95, duration: 1 }, 0)
                        .fromTo(select(".orbit-tag-1"), { x: 0, y: 0 }, { x: desktop ? 55 : 8, y: desktop ? -60 : -95, duration: 1 }, 0)
                        .fromTo(select(".orbit-tag-2"), { x: 0, y: 0 }, { x: desktop ? -55 : -8, y: desktop ? 60 : 95, duration: 1 }, 0)
                        .fromTo(select(".orbit-tag-3"), { x: 0, y: 0 }, { x: desktop ? 55 : 8, y: desktop ? 60 : 95, duration: 1 }, 0)
                        .to(select(".approach-background"), { scale: desktop ? 0.94 : 0.92, duration: 1, ease: "none" }, 0)
                        .fromTo(select(".approach-center-copy"), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.4 }, 0.5);
                }
            });
            el.querySelectorAll("[data-parallax]").forEach((target) => {
                gsap.fromTo(target, { yPercent: -5 }, {
                    yPercent: 5,
                    ease: "none",
                    scrollTrigger: {
                        trigger: target.parentElement,
                        start: "top bottom",
                        end: "bottom top",
                        scrub: 1,
                    },
                });
            });
            return () => media.revert();
        }, el);
        let cancelled = false;
        document.fonts.ready.then(() => {
            if (!cancelled)
                ScrollTrigger.refresh();
        });
        const refresh = () => ScrollTrigger.refresh();
        window.addEventListener("load", refresh);
        const timer = window.setTimeout(refresh, 600);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
            window.removeEventListener("load", refresh);
            ctx.revert();
        };
    }, [root, language, reduced]);
}
