# Public website release — 2026-10-16

Scope: publish the integrated Sites presentation, reversible particle hero and
shared product theme, including the university-detail wheel-scroll repair.
Release target: `Morgan0787/UniMatch`, `main`, existing Vercel project `uni_match`
in `007capral007-4656s-projects`. Unrelated `docs/business-turks-2026/` is excluded.

## Wheel-scroll regression

The original Home → Myongji University detail flow reproduced the reported
problem in the real browser: dialog `scrollTop` stayed `0` after a downward wheel
gesture, despite `overflow-y:auto` and `scrollHeight=2010` / `clientHeight=487`.

Home correctly stops its Lenis instance while a detail dialog is open. However,
Lenis's stopped handler calls `preventDefault()` for wheel events, including
events originating in the portaled dialog. The shared `DialogContent` now has
`data-lenis-prevent`, which Lenis checks before its stopped-state handler. Radix
retains the page lock and focus behavior; the dialog uses native scrolling.

The same gesture after the repair moved the dialog from `0` to `543.68` pixels.
This browser interaction is the regression check; a source-string unit assertion
would not exercise the event path. Reverse scrolling returned it to `0`; after
closing the modal, ordinary page scrolling moved from `6996.59` to `7214.26`.

## Release hygiene

- Runtime source/assets and related QA records are included. Environment files,
  `.tmp`, build output, dependencies and unrelated business documents are excluded.
- Removed an obsolete decorative URL for absent `glass-globe.avif`; the current
  intro already uses a gradient. Corrected the asset manifest to match retained
  files and the generated hero.
- The existing project already builds this GitHub repository with Vite/Node 24.
  No environment values, auth credentials or database writes are part of this change.
- Deployment outcome and exact commit are recorded in the task checkpoint and
  user-facing release result. Existing visual/performance limits remain in the
  [hero QA record](hero-particle-story.md).
