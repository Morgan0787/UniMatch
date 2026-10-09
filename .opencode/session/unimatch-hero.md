# UniMatch original hero animation

Repository verified: Morgan0787/UniMatch, main. Read AGENTS.md and context pack.
Scope: Home hero only, generated art assets, isolated sequence component.
No university data, backend, auth code, or other pages changed.

Batch 1: procedural Blender source + editable scene + key renders.
Criteria: transparent fixed-size output; shared camera/materials; original continuous
sphere → open atlas and routes → sphere; no text in images.
Smoke: Blender 4.3.2 CPU render + Pillow RGBA WebP conversion succeeded.
Build has no OpenImageDenoise; denoising disabled deliberately.
Planner delegation requested by local workflow; OmniRoute/kiro unavailable, inherited planner used.

Batch 1 complete: original scene, keys and 24-frame draft inspected. Increased
camera composition scale while preserving padding. Full 120-frame render complete.

Batch 2 complete: package_frames.py, desktop/mobile WebP, manifest, MP4/GIF preview.
Optimized packaging uses four workers and WebP method 4. Desktop 10,016,266 bytes;
mobile 6,866,924 bytes. First/last render equality assertion passed. Alpha union
inside x159..840/y149..734 of 960px frame. No clipping.

Batch 3 complete: UniMatchHero.jsx, scoped CSS, Home.jsx first-section replacement.
Preserved existing translations, CTA routes, subsequent sections. Bounded 12-frame
cache and three requests; adaptive timeout + two bounded retries; reduced motion.
Reviewer initially found timeout retry gap; repaired and reviewer returned PASS.
Viewport constraint corrected after first screenshot so footer fits; scroll-link
right padding adjusted to avoid existing feedback button.

Checks completed: focused ESLint PASS, TypeScript PASS, production build PASS.
Browser QA PASS at 1280×720 and 390×844: beginning/atlas/routes/end, reverse/return,
pin3.5viewport, next-section release, CTA URLs, skip keyboard focus, no cropping,
bounded initial load/cache, correct resolution, no page errors. Reduced motion,
450ms loading, 9s timeout recovery without scrolling, missing-frame fallback PASS.

Preview serves on 5173 using dummy backend env vars; no production access.
MDX browser navigation failed CA verification; HTML fetched with verified curl.
No MDX art downloaded. No dependencies added or lockfiles changed.

Final checks complete: all 240 WebP browser decodes PASS; footer padding evidence
and repeat browser QA PASS; final production build, typecheck, focused ESLint and
git diff --check PASS. Built dist includes final media.

User requested a GitHub branch and PR. Prepared branch
`codex/unimatch-light-atlas-hero` from verified current `origin/main`
`3d06084f4d770a3d9cfe2ce15f1dbdb73435546d`. Source scope and ignored intermediates
checked before committing; all ready assets and browser evidence included.
