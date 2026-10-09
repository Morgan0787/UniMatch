# Home hero checkpoint — 2026-10-08

Scope: first screen only. Home has its own Russian shell; other pages retain LayoutContent and LanguageProvider. No backend/schema/data changes.

Completed: src/pages/Home.jsx, src/pages/Home.css, Home-only branch in src/Layout.jsx, public/images/unimatch-world.png, public/fonts/golos-text-regular.ttf.

Design: MDX visually inspected at mobile and desktop. Cool paper #f3f4f3, graphite #252e31, secondary #5d6568, orange #c64b2c, border #d8dcdc. Golos Text regular. Asymmetric artwork upper-right, light headline lower-left, stacked mobile composition. No fabricated testimonials or statistics. Original Home replaced with requested single screen.

Contracts: primary link /Search; secondary Radix dialog, localized title/close, focus trapping and restoration; account /Login or /Profile. Decorative art excluded from accessibility tree. CSS Home/dialog-scoped; reduced motion respected.

Checks: npm run build PASS; npm run typecheck PASS; npm run lint PASS; git diff --check PASS. Build has existing stale Browserslist advisory. Browser checks PASS: desktop 1440x900, mobile requested 390x844 (browser CSS width rounds to 391), narrow 320x740, tablet 768x1024. documentElement scrollWidth <= clientWidth throughout. Keyboard Tab stays inside dialog; Escape restores visible focus to trigger. /Search and /Login routes render existing screens. At 720x450 (200% desktop reflow equivalent, not browser zoom), no horizontal overflow; dialog scrolls inside viewport.

Environment: original .env has invalid Supabase URL, pre-existing error prevents application boot. .env unchanged. Local preview started with process-only localhost Supabase URL and inert key; no real backend results can be validated in that preview.

Failed attempts: initial combined delete/add patch rejected atomically, then applied via direct Home rewrite + patch. Sandboxed esbuild lacked parent-directory access; authorized elevated run succeeded. Initial browser navigation timed out during compilation; existing tab recovered.

Completed: independent reviewer PASS, no blockers. Screenshots: output/playwright/home-desktop.png and output/playwright/home-mobile.png. Contrast: secondary text 5.40:1; primary button text 13.87:1; focus ring 4.29:1. Art/font load successfully. Fixed React 18 fetchPriority warning using eager loading. No new dependencies. Preview remains running at http://127.0.0.1:5173 using process-only inert backend settings. Remaining limitation: real search results and authenticated profile require valid project environment; deliberately not changed in this task.


Artwork: generated with built-in image_gen; source copied into public/images/unimatch-world.png (1.84 MB). Static rendered illustration, no WebGL or animation runtime. Prompt:

Create a premium editorial 3D-rendered website hero illustration for UniMatch, helping Central Asian students discover universities abroad. Landscape 1536x1024. A large luminous frosted-glass globe, subtle pearlescent translucent surface, very fine etched latitude and longitude lines and delicate realistic embossed continental outlines (Eurasia facing camera), floating gently above a seamless cool off-white studio ground #f3f4f3. A single beautifully folded vermilion-orange paper airplane sweeps around the lower right of the sphere, its nose pointing upwards right, with one extremely fine pale metallic orbit arc that curves around globe. Globe centered around 55% x, 46% y, occupying 70% image height. Sophisticated physically rendered material, soft daylight from upper left, delicate contact shadows beneath sphere, gentle refraction and realistic paper folds, understated cinematic ambient occlusion. Clean luxurious design studio art direction, quiet atmosphere, extremely detailed materials. Background at all four edges must be uniform near #f3f4f3 for seamless compositing. No text, no labels, no symbols, no UI, no pedestal, no stars, no sparkles, no colored background gradients, no extra planets. This is a finished art asset, not a webpage mockup.
