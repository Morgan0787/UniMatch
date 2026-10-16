# Hero particle story — 2026-10-16

Implemented locally in Home. No publication or backend writes were performed.
The approved university-route preview supplies the composition: relief Earth →
seven subject symbols → folding ribbon → arc from the visitor to a university.
The material follows the observed MDX pearl/granular shell and peach inner glow;
the production scene generates its own geometry and does not play MDX frames.

## Current behavior

- The scene starts automatically when its first WebGL frame is ready. Scroll
  controls one deterministic timeline in both directions; there are no scene
  selection or playback buttons.
- The first downward scroll hides the header and hero copy. The scene expands
  into the full hero viewport using projection uniforms, without resizing the
  canvas every frame. Returning to the top restores the copy and header.
- A localized loading screen replaces the old image poster, including during
  lazy module loading. It disappears on the first rendered frame. Worker errors
  or a 12-second preparation timeout release the screen; context loss shows a
  retry action while leaving the page and catalog available.
- Reduced motion keeps a static generated Earth without a hero pin. It does not
  replace the user's OS preference in production.
- University previews use existing supplied records and open the existing detail
  modal. No university facts, matching rules, auth rules or database schema were
  changed by this scene integration.

## Rendering and ownership

`HeroExplorer.jsx` owns the worker, observers, GSAP ticker callback and renderer.
Geometry is generated once in `heroScene.worker.js` and transferred to seven
immutable GPU buffers. One point draw renders 48,000 particles for an initially
wide window, or 24,000 for an initially narrow window. Resizing retains the
initial particle count. Pixel ratio is capped at 1.5/1.35. Offscreen, background
and dialog-blocked scenes stop drawing. Unmount releases the worker, buffers,
program, context, observers and ticker callback. Existing Lenis remains the only
scroll engine.

Luna supplied the deterministic geometry and offline land mask; the lead
integrated and checked them. The mask is baked from world-atlas 2.0.2 / Natural
Earth data and requires no runtime map request or added package. An Astra
read-only performance review informed ticker ordering and measurement design.

## Verification

- `node scripts/check-hero-scene.mjs`: finite deterministic particle arrays,
  land/ocean relief, icon normals and palette hole; 1,681 forward/reverse states
  at 1280×800, 1243×544, 390×844 and 320×700, including full-screen expansion and
  pulse arrival. These assertions check geometry/overlay math, not every GPU
  pixel.
- Browser: actual wheel scrolling down and up on `5177/Home`, enlarged Earth,
  constellation, final route, restored header/copy at `scrollY=0`, no controls
  or poster, and no console errors on the clean final tab. RU compact-phone
  labels at 320 px do not overlap or create horizontal overflow. UZ was checked
  on the user's page; EN was checked during integration.
- Loading screen was inspected with an **ignored QA-only** eight-second worker
  delay. Production has no artificial delay. Context loss and retry were
  exercised with a QA-only button; rendering recovered and catalog remained.
- Opening a university from the scene and the existing detail dialog worked.
  The earlier reverse-scroll copy restoration defect was fixed with explicit
  GSAP start/end states. Intermediate hot reloads briefly referenced a removed
  poster export; a clean final load has no such module error.
- Build, lint and typecheck are run against the final source; results are kept
  in the task checkpoint. Matching/catalog assertions are independent checks
  whose coverage does not prove visual correctness.

## Performance evidence and limits

The final foreground 8.016-second forward/reverse sweep at 1280×800 collected
**all** RAF intervals, including long gaps: 280 intervals, mean 28.63 ms
(about 35 frames/s), median 33.1 ms, p95 44 ms, maximum 70 ms, seven gaps over
50 ms. One main-thread long task lasted 51 ms. There were 277 scene draws.
See [raw summary](hero-particle-story/performance.json). This is a development
build in the Windows Codex browser, not a physical-phone or cross-browser
benchmark. Stable 60 FPS is **not established** by these results.

Diagnostic runs before the final fullscreen changes separated point drawing,
all GL updates and overlay updates. GL submission alone was not the dominant
cost. Removing the scrolled header's backdrop and avoiding extra RAF scheduling
improved measured frame time, while density was preserved. These comparisons
are exploratory, not a controlled claim of a particular percentage improvement.
The shipped `data-draw-cpu-ms` measures CPU submission only; it is not display FPS.
QA preference overrides, sweeps, GL bypasses and worker delays remain in ignored
`.tmp` helpers and are absent from production source.

## Saved views

- [Loading](hero-particle-story/loading.jpg)
- [Full-screen Earth](hero-particle-story/fullscreen-earth.jpg)
- [Final route](hero-particle-story/final-route.jpg)
- [Compact phone constellation](hero-particle-story/mobile-fullscreen.jpg)

The mobile QA screenshot contains a diagnostic button outside the product UI.
Physical devices, Safari/Firefox and deployed asset delivery remain unverified.
