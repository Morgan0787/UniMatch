# Sites design transfer — 2026-10-15

## Source and scope

The implementation uses actual source from UniMatch Sites project
`appgprj_6acbed08b0d88191a6e3f34c8fbb49e7`, version 7, commit
`052df00dd694a36e2667d930bffdcb51253944dd`.
The [published reference](https://unimatch-universities.abuzzbasil4.chatgpt.site/)
identifies the design; the fetched commit identifies the copied source.

`src/components/landing/` contains the source landing, header, discovery,
Three/Fiber scene, GSAP/Lenis motion, content and CSS. Home renders that landing.
`public/reference/` and `public/images/` preserve the source assets. The shared
product theme and layout extend the same presentation to Search, Profile,
Recommendations, Login, cards and dialogs. This replaces the earlier standalone
HTML design proposal; it is a repository implementation, not a production deployment.

## Integration differences

- Main Supabase API, matching calculations, unknown-data handling, EUR displays,
  route utilities, notifications and public/protected route boundaries remain.
- Landing university cards and scene labels use actual API records; saved items
  use the signed-in profile. Guests receive no invented GPA. Personal matching
  continues through Recommendations and its existing login boundary.
- Added source runtime dependencies Fiber 8.18.0, GSAP 3.15.0 and Lenis 1.3.26,
  plus Three declarations 0.171.0. Existing locked package versions were retained.
  GSAP declaration paths keep JavaScript dependency internals out of checkJs.
- Completed Uzbek control labels and missing search/filter translations. Corrected
  menu font spacing, narrow-screen scene label placement, section anchor offsets,
  reduced-motion orbit-label overlap and recommendation subtitle contrast.
- Source video was absent from the fetched repository, so the existing photo
  fallback is used without repeatedly requesting a missing video.
- Dialogs have accessible titles. Search reset also clears the text query.
- Search uses the source full-width grid, right-hand filter drawer and 24-item
  pagination, including the source `catalogResults.js`. Stable interleaving keeps
  country variety without reshuffling cards when a dialog opens. Country options
  reflect fetched records; choosing All Countries/All Regions clears that filter.
  Essay and feedback components also carry their source theme hooks.
- Browser QA reproduced an existing Supabase session-lock deadlock after restoring
  a login. Profile creation now runs in a React effect outside the auth callback.
  Session and route access rules are unchanged. The installed auth-js source
  explicitly documents this callback restriction; see also the
  [Supabase callback reference](https://supabase.com/docs/reference/javascript/auth-onauthstatechange).

## Verification

Local browser checks covered desktop 1280px, tablet 768px, mobile 390px and narrow
320px views. Home was inspected in EN/RU/UZ, including the menu, lower sections,
loaded photography, shadows, scene labels, catalog states, detail dialog and
mobile filters. Search showed actual API records; the no-results reset restored
the list. At 320px, document overflow was zero and all four scene labels remained
within the 305px content area (the remaining width was the browser scrollbar).
At 768px, the approach heading stayed below the fixed header and orbit labels
did not overlap its central text in reduced-motion mode.

A separate ignored local fixture server supplied synthetic users/universities
and in-memory REST writes. It exercised password login, Profile, Recommendations
and session restoration without production writes or paid AI requests. The
profile rendered after reload following the auth correction. Mobile profile and
recommendation headers/cards were visually inspected; the recommendation subtitle
uses dark gray on the light background. Missing GPA and tuition remained explicitly
unknown in the fixture recommendations.

Source hash comparison found no differences in the copied reference/image assets
or in landing.css, content.js, uz.js, usePageMotion.js and ui.jsx. Adapted components
are described above. Build, lint, no-emit typecheck and all 36 matching assertion
groups passed during integration; final reruns are recorded in the task checkpoint.
`node scripts/check-catalog.mjs` passed checks for complete pagination without
duplicates, filtering beyond the first page, stable order, preserved null fields
and unchanged input records. Browser navigation reached 25–48 / 186, page 2 / 8,
with 24 rendered cards, no sidebar and zero horizontal overflow.

The browser used reduced-motion preferences. Continuous animation performance,
physical devices, live OAuth/profile writes and production deployment were not
tested. Browser tooling emitted unrelated external telemetry failures; these were
distinguished from application console errors. No claim of universal device or
backend coverage is made.
