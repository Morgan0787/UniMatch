# Production motion diagnosis — 2026-10-17

## Reproduction and adopted behavior

The existing public release `d0e2685` loaded WebGL correctly, but a browser with
`prefers-reduced-motion: reduce` reported `data-motion=reduced`, zero pin spacers
and scene time `0.000` after scrolling 720.48 px. This reproduces the user's
static-production symptom. The original `5177` demonstration deliberately
overrode media preferences in an ignored local QA server; that behavior was not
shipped. The external report's claim that the difference came from browser
isolation is not the explanation for that local server.

The user explicitly selected **always enable animation regardless of Windows**.
Home therefore no longer reads the OS setting. Its downstream motion hooks use
the normal mode. The landing and shared presentation CSS no longer apply the
old motion-suppression/layout rules when the OS reports `reduce`. This supersedes
the original reduced-motion behavior documented on 2026-10-16.

## Lazy visual ownership

`hero-visual` is a persistent absolute container around the lazy scene and its
loading/error content. The page's exit tween targets this container instead of
querying `hero-explorer` before that lazy child exists. The loader renders in a
body portal so the visual wrapper's transform cannot trap it below the header
or hero copy. It still releases the body scroll lock when loading finishes.

## Verification

- Ordinary Vite server on `5181`, **without** a matchMedia override: OS query
  remained `true`; scene reported `scroll`, three pin spacers, and time advanced
  from `0.000` to `4.670` on a wheel gesture. Header and hero copy hid as intended.
- Scrolling past the hero changed the persistent wrapper's opacity to `0`,
  confirming that its exit tween exists. Reverse-scrolling restored the scene.
- Fresh local console had no GSAP missing-target warning or JS error; only the
  pre-existing React Router v7 migration notices appeared.
- Build/typecheck/lint and deployed verification are recorded in the task
  checkpoint and release result. Geometry math did not change; the existing
  four-viewport forward/reverse check passed.

## Other external-report findings

- The `profiles` initializer and student `student_profiles` API are different
  contracts. A focused read-only audit found caught best-effort warnings in
  `AuthContext.jsx`/`Login.jsx`, no internal retry timer/recursion there, and one
  React Query retry for separate entity queries. Supabase management reported
  `ACTIVE_HEALTHY` for `stgnymernufndwxtdfed`. A read-only
  `information_schema.tables` query confirmed `public.student_profiles` exists
  and `public.profiles` does not. No user rows were read and no database,
  authentication or authorization changes were made for this animation fix.
  This separate missing-table defect remains unresolved. `PGRST205` means the
  requested table was not found, per the [PostgREST error reference](https://docs.postgrest.org/en/stable/references/errors.html#group-2-schema-cache).
- `videoAvailable` starts false and is never enabled in the current landing.
  The tested DOM has no `/video.mp4` video element. The report's video request
  does not reproduce in this source path; no placeholder video was added.

The earlier ~35 FPS browser measurement remains a limitation, not a 60 FPS
guarantee. This fix changes motion activation and lazy-target ownership rather
than claiming a new performance result.
