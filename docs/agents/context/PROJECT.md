# UniMatch — stable project brief

## Product

UniMatch helps Central Asian students find universities in Europe, the US, and Asia by ranking realistic admission chances from GPA, IELTS, TOPIK, and verified university data. It is a Vite/React portfolio and potential product, not the separate dating-site test project.

## Stack and deployment

- Frontend: Vite, React, Tailwind CSS, shadcn/ui.
- Backend: Supabase Postgres and Supabase Auth; migrated from Base44.
- Authentication: Google OAuth and email through Supabase Auth.
- Deployment: Vercel.
- Main areas: Home, Search, Recommendations, Profile, Login, and admin data-quality/feedback tools.
- Notifications: `src/App.jsx` mounts the shared `src/components/ui/sonner.jsx` renderer for the pages' Sonner calls. Legacy toast files remain available but are not mounted.

## Notification verification — 2026-10-13

Production Vite build passed with dummy Supabase settings, environment-file loading disabled and isolated output; `npm run typecheck -- --noEmit` also passed. Local Chrome checks at 1280×900 and 390×844 exercised the actual feedback form with a mocked POST 500 response: one error notification appeared above the open dialog. Test calls through the same Sonner instance verified visible success/error messages, loading-to-success/error replacement by the same ID, and no duplicates after repeated calls. One Sonner container was present while notifications were displayed, and no page JavaScript errors were observed. Live database writes, paid AI calls, authenticated profile saves and admin operations were not exercised.

## Data snapshot inherited on 2026-10-13

The counts and pipeline state below came from the previous context; they were not rechecked against the live database during the documentation migration. Verify them when a task needs current counts.

- Universities are matched from database fields, not invented by the UI.
- About 1,944 US records came from College Scorecard and intentionally have many null enrichment fields.
- About 24 South Korean records were researched and tracked with sources.
- Europe/Asia enrichment and the top-US enrichment pipeline are unfinished.
- `source_url` and an explicit `verified` flag are required for factual enrichment.

## Confirmed cleanup state — 2026-10-13

- README uses the existing root hero illustration; the missing Vite favicon link
  was removed. No custom favicon was introduced.
- Two inactive legacy sources are preserved in the [source archive](../../archive/source/2026-10-13/README.md),
  and 19 historical screenshots in the [Home QA archive](../../qa/archive/370517c-home/README.md).
  Original paths/hashes and checked restoration commands are documented there;
  restoration was not executed and external/manual consumers remain unverified.
- The [routing utility contract](DECISIONS.md#routing-utility-entrypoints) preserves
  both entrypoints, types and ordinary Node compatibility. The
  [tooling verification](DECISIONS.md#tooling-coverage-gotchas) records successful
  isolated clean installation, build and no-emit typecheck with their limits.
- Final `npm run lint` passed on the clean installation with the unchanged ESLint
  config. Matching passed all 36 assertion groups after archive moves; archive
  build CSS matched the previous build byte-for-byte. Existing notification
  checks are recorded above and were not repeated for unrelated cleanup.
- Protected materials and pre-existing edits were retained; no dependency
  reduction, staging, commit, push, live backend writes or paid calls occurred.
  The [16 deferred candidates](DECISIONS.md#deferred-dependency-candidates) remain.

## Current priority

The product bottleneck is trustworthy data enrichment and the core search/match experience—not more infrastructure. Keep changes focused and preserve the existing data-quality rules.

## Maintenance

For confirmed product/architecture/state changes, follow `docs/agents/context/MAINTENANCE.md`. Keep current facts distinct from planned priorities; record evidence when updating a consequential claim.
