# Login particle preview — 9 November 2026

## Implemented locally

- Right-aligned glass auth form; pearl/amber background inherited from the application.
- Password globe, magic-link open book, signup graduation cap. Seeded custom geometry, 32,000 reusable points, surface normals, Home-inspired near-white pearl shader and depth testing. One Points draw call; no external models or new packages.
- Approximately one-second target morph; interrupted transitions snapshot the current shape. Damped hover vortex continues with a stationary pointer and recovers after leaving. Hidden documents stop the render loop.
- Scene is lazy and absent below 1024 CSS px. Reduced motion defaults to a static SVG, with an explicit scene opt-in and pause control. WebGL failure/context loss uses the SVG. EN/RU/UZ copy and typed form values persist across auth tabs.
- Auth handlers, API contracts, Google provider and safe return routing are preserved. No deployment or real auth write was performed.

## Evidence

### Animation refinement

The local refinement adds finer antialiased particles, correct output color conversion, restrained energy-driven amber glints and a small drifting fringe. The one-second morph now spreads and reforms in a seeded wave. Smoothed pointer input drives a persistent, locally varied vortex, while the damped recovery retains the silhouette. Globe-to-book/cap rotation follows the shortest angle. Book pages/spine and cap crown/tassel have been refined without new dependencies or external assets.

After these changes, build, typecheck, scoped ESLint and the complete browser harness passed again. Deterministic finite geometry was checked at 0, 1 and 32,000 points. Final desktop captures cover all three shapes. The embedded browser timed out while refreshing this revision; the standalone browser verified WebGL and captured the result.

Browser harness: `output/playwright/auth-particles-qa.cjs`; results and captures: `output/playwright/auth-particles-20261108/`. These local outputs are ignored by git. The browser uses installed Chrome and SwiftShader; auth requests are intercepted before any submit.

Verified on the final local build: password error, OTP/signup messages and request bodies/redirects, rapid switching with retained values and unchanged form bounds, ongoing stationary-hover movement, finite recovery, hidden-page pause; widths 1920, 1366, 1024, 1023, 768, 390 and 320 without horizontal overflow; RU/UZ mobile tabs without downloading the scene chunk; static reduced-motion/WebGL-unavailable modes; no normal-flow browser/shader errors.

Focused code checks pass: `npm run typecheck`, scoped ESLint, `node scripts/check-login-return.mjs`, and `npm run build`. Geometry/normal buffers were checked for deterministic finite values at 0, 1 and 32,000 points.

Final browser recheck passed: reduced-motion opt-in starts WebGL and pause restores the static illustration; intercepted Google authorization retains the provider and safe return URL. The embedded browser also successfully started the WebGL scene through the opt-in control.

### Pearl material and geometry refinement

The latest local revision replaces graphite with pearl particles, champagne details, a broad soft key light and restrained amber bounce. Static SVG illustrations use the same lighter palette. The globe now has stylised continent silhouettes and a fine latitude/longitude grid; the book has layered edges, binding and sparse printed rows on its upper leaf. Semantic detail weights morph alongside positions and normals, including interrupted transitions. Particle count and the accepted motion remain unchanged.

Typecheck, build, scoped ESLint and deterministic geometry/normal/detail checks at 0, 1 and 32,000 points passed for this revision. The standalone browser captured the pearl globe, but its subsequent tab click timed out; it did not complete a new full screenshot pass. The embedded browser successfully verified the globe and book, rapid signup/password/magic-link switches and the enabled animation. It remains open on the book with motion enabled. Earlier full auth, responsive and fallback coverage above applies to the preceding animation revision; auth handlers and motion behavior were not changed in this material refinement.

### Home pearl palette and raised continents

This revision supersedes the champagne palette and globe grid described above. All figures now use near-white particles with cool pearl shadows, following Home's globe palette. The auth globe reuses Home's bundled land mask, removes the latitude/longitude geometry, and distributes points across a continuous sphere with raised continents. Small procedural ridges provide stylised relief rather than measured geographic elevation. Surface-gradient normals light the raised coasts and ridges; detail weights follow the same land mask. Static illustrations also use the cooler palette and a globe without grid lines. Motion, particle count, form behavior and dependencies are unchanged.

Build, typecheck and scoped ESLint passed. Deterministic geometry, finite values, unit normals and bounded detail weights passed at 0, 1 and 32,000 points. Globe radii span approximately 1.78–1.994 scene units. The embedded browser visibly verified the live white globe and book, raised continent silhouettes during rotation, and rapid signup/magic-link/password switching. No browser errors were recorded. The animation remains enabled in the local preview on Password. Current capture: `output/playwright/auth-particles-20261108/home-pearl-relief.jpg`. The attempted larger viewport override did not change the native screenshot dimensions and was reset; no new large-screen certification is claimed. Earlier full responsive/auth coverage applies to the preceding animation revision.

### Softened continent correction

User review rejected the procedural ridges as vein-like. Removed all synthetic ridges and hills, reduced the maximum land lift to .05 scene units, and softened coast coverage with neighboring land-mask samples. The continuous globe shell and cool pearl palette remain. This supersedes the 1.994 maximum radius above; current radius bounds are 1.78–1.83. Deterministic finite geometry, unit normals and shallow radius bounds passed at 0/1/32000 points; scoped ESLint and build passed. The embedded browser visibly verified the softened animated globe with no recorded console errors. Current capture: `output/playwright/auth-particles-20261108/soft-continent-relief.jpg`. Preview remains local with animation enabled; no deployment.

## Limits and review

The embedded browser was observed with `prefers-reduced-motion: reduce`; its initial sparse image was the old SVG fallback rather than the live WebGL scene. The fallback has been replaced with shaded vector illustrations and an explicit motion opt-in.

Software rendering checks behavior, not representative hardware frame rate. Real Google completion, delivered email links and authenticated sessions remain unverified. Visual acceptance, including resemblance to the LOOT reference, belongs to the local preview review; this is not an accepted production design.
