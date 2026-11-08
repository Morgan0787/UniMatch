# Shared amber background — 8 November 2026

## Implemented

All nine routes rendered by the product Layout share two fixed amber light layers. Home returns before the shell and retains its landing scene. Upper/lower animation durations are 14/18 seconds (previous survey: 42/57), with wider independent drift and negative start delays. Only transform and opacity animate. Layers ignore pointer input; page canvases and account heroes expose the light while individual card fills remain unchanged. Existing owner motion policy remains in effect.

The shared source is src/styles/ambient-light.css, imported once by Layout. Search, University and survey no longer define competing ambient layers. No data, matching, authentication or account-write behavior changes.

## Verified

- Isolated production build and SEO checks passed; targeted Layout ESLint passed.
- Chrome built-preview report: 101/101 checks, no JavaScript exceptions. All routes checked as guest; Profile, Recommendations and EssayChecker additionally checked with local authentication/profile fixtures. Both light transforms actually advanced over 1.1 seconds, expected 14/18 second timings were present, page canvases exposed the light, and Home had no shared ambient animations.
- Widths 320, 390, 1440 and 2560 px passed without horizontal overflow. Pointer transparency and the existing owner reduced-motion policy passed.
- Actual Search and Profile screenshots visually inspected. Artifacts: output/playwright/ambient-candidate/ (ignored). Full admin tools behind admin access and real account saving are not exercised; admin guest access screens were checked.

## Publication

Pending scoped publication and target-environment smoke. Existing canonical-domain network block is unchanged.
