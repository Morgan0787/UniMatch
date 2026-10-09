# Live Home globe — 2026-10-09

Scope: replace the static first-screen art with a real Three.js scene. Keep Home copy/actions and all other pages/backend unchanged. Earlier Home redesign remains in the working tree.

Read order: context README, PROJECT, DECISIONS, WORKFLOW, CODING_STANDARDS. Applied existing frontend-design, frontend-engineering, web-accessibility-review and browser guidance. Planner completed dependency-ordered plan; OmniRoute model is unavailable, so inherited agent used.

Files: src/components/home/globeScene.js (GPU scene), src/components/home/HomeGlobe.jsx (React lifecycle and motion), src/pages/Home.jsx, src/pages/Home.css, public/geo/land-110m.json and SOURCE.md, @types/three development dependency and lockfile.

Visual: recognizable Natural Earth continents facing Central Asia, pearlescent inner core and translucent reflective outer shell, physical roughness/grain, small instanced surface facets, graticule, orbit tube, folded multi-surface airplane. Soft ground shadow is a procedural texture, no heavy realtime shadow map. Animation is genuine scene transforms and changing reflections, not movement of the fallback PNG. Existing PNG appears only during initialization or failure.

Motion: globe rotation, bounded airplane flight, subtle float and pointer-driven camera-relative scene tilt/light. 30fps cap; DPR <=1.25 desktop /1 mobile. Lazy import of Three scene. No continuous render when paused, reduced motion (unless explicitly played), out of view or document hidden. Resize renders one frame. Abort stale fetch; cancel RAF, disconnect observers/events and dispose GPU resources on unmount/error. Pause button is outside decorative aria-hidden artwork.

Checks so far: module import PASS; first visual desktop/mobile WebGL frame rendered, light/material pass corrected overexposure. Host browser prefers-reduced-motion=true; default scene is static and user can explicitly play. First motion verification and subsequent browser recovery timed out three times; user asked to close only preview tab. Optimized away transmission render pass and reduced pixel/geometry work afterward. Final responsive, animation and error-fallback checks still pending.

Typecheck: adding Three code initially caused TypeScript to inspect untyped dependency internals. Installed matching @types/three@0.171.0, corrected local inferred tuple types and resource type narrowing; typecheck/lint passed before final performance edits; final checks running.

Dependency note: committed package-lock.json already contained nested Git conflict markers (HEAD/ours/theirs). npm install normalized the invalid lock while adding type declarations. No dependency upgrades or npm audit fixes requested or applied.

Reference: MDX visually inspected again in browser including sphere deformation/light. Natural Earth provenance/license in public/geo/SOURCE.md. No runtime third-party texture/geodata fetches.

Next: browser recovery, play/pause pixel verification, pointer response, mobile/narrow screenshots, fallback and route regression, independent review. Existing invalid local Supabase URL remains untouched; preview uses process-only local inert settings from previous turn.

## Final verification — 2026-10-09

Reviewer PASS after repairs to InstancedMesh GPU disposal and matching visible/accessibility labels. Final `npm run build`, `npm run typecheck`, `npm run lint`, and `git diff --check` all PASS. The build prints a pre-existing stale Browserslist advisory.

Browser: live WebGL canvas rendered at 1440x900 and 390x844; 320x740 and 768x1024 have `scrollWidth <= clientWidth`. Computer and mobile screenshots saved at `output/playwright/home-3d-desktop.png` and `output/playwright/home-3d-mobile.png`. Host preference is `prefers-reduced-motion: reduce`, so initial scene is static. Pressing the localized control starts motion; pressing it again stops. Two mobile moving screenshots (`globe-mobile-moving-a/b.png`) differ at 2508/9350 sampled globe-region pixels. Two paused screenshots (`globe-mobile-paused-a/b.png`) differ at 0/9350 of the same samples. This measures visible motion versus a stable paused image, not FPS.

The mobile explanation dialog opens with keyboard Enter, closes with Escape and restores focus to its trigger. Canvas count remains one. Search route rendered unchanged. Tested failure by temporarily holding `land-110m.json` outside its expected filename, reloading, and verifying original image visible, WebGL control absent, `/Search` link and explanation dialog usable; restored the GeoJSON immediately. Final live 3D canvas restored and shown.

The final browser tab is open at `http://127.0.0.1:5173/Home` on a process-only preview configuration. Original `.env` remains invalid for Supabase and was not modified; real university results were outside this task's verification. The initial WebGL version overloaded browser automation after motion activation, triggering three tool timeouts. Replaced transmission rendering with a light reflective translucent shell and core, reduced geometry/DPR, and capped rendering to 30fps; browser controls and final visual checks recovered afterward. No final FPS benchmark was run.
