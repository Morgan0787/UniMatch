# Five independent amber glows — 8 November 2026

Replaces the two broad 14/18-second layers in [the previous release](ambient-light-2026-11-08.md). The shared Layout now renders five decorative, pointer-transparent spans: north, west, center, east and south. Each follows a separate four-point transform loop (12, 14, 11, 16 and 13 seconds), with offset starts and a stronger amber core. Home remains outside this shell.

Verified on the isolated production build: 106 browser assertions passed, no JavaScript exceptions. Nine non-Home route shells and authenticated Profile, Recommendations and EssayChecker fixtures fit 2560, 1440, 390 and 320 px. Search and Login positions were sampled two seconds apart: every light moved, including the central light, with opposing horizontal and vertical directions. Decorative layers are hidden from accessibility APIs, clipped to the viewport and cannot intercept clicks. Owner-selected always-on motion policy remains in effect.

Build, SEO validation, scoped Layout ESLint and diff whitespace checks passed. Browser screenshots and measurements: `output/playwright/ambient-v2-candidate/` (local ignored artifacts). Auth fixtures do not validate real account writes or admin authorization. Photo loading may also contribute to screenshot pixel differences; position measurements independently verify light travel.

Published commit 121c695c30edcda3d8298dc247635a38b7709615. Vercel dpl_4PewoWD83jHSXN2SyXDhuKamEKzh is READY in production. Public-site smoke: 11/11 checks passed via the public alias redirecting to getunimatch.app, including live central motion, Home exclusion and desktop/mobile fit.
