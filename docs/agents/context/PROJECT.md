# UniMatch — stable project brief

## Release recovery — 2026-11-05

The recovery candidate combines Release 18 (1ec35b3) with SEO/domain configuration from e1bf863. Publication and browser verification are pending. See [recovery evidence](../../qa/release-recovery-2026-11-05.md).

## Product

Search identifies the campus of the displayed programme and applies its annual tuition limit in the main list. Recommendations keep filter and sort in the URL, restore the card on return, and update favorites after confirming the profile write. [Usage](../../../README.md#how-it-works).

Recommendations Liquid Glass (8 November 2026): uses the accepted glass reference with responsive one-to-four-column cards, profile metric strip, budget/unknown filters, sorting and a mobile comparison dock. Reuses Search programme/photo presentation; ranking, daily selection and protected access remain unchanged. [Implementation and verification](../../qa/recommendations-glass-2026-11-08.md).

Amber background motion (8 November 2026): shared by all nine non-Home routes, including guest and authenticated account states. Five transform-only animations follow distinct 11–16-second loops through the center and edges; Home keeps its existing landing scene. [Implementation and verification](../../qa/ambient-glow-depth-2026-11-08.md).

Survey Liquid Glass (8 November 2026): survey and preliminary matching use a unified full-width pearl surface, floating navigation, outlined subject icons and independently animated amber light. Responsive form actions, desktop summary and result photos/caveats are verified locally. Matching and access rules are unchanged. See [survey QA and release status](../../qa/survey-liquid-glass-2026-11-07.md).

UniMatch helps Central Asian students find universities in Europe, the US, and Asia by ranking realistic admission chances from GPA, IELTS, TOPIK, and verified university data. It is a Vite/React portfolio and potential product, not the separate dating-site test project.

## Stack and deployment

- Organic discovery is live on `getunimatch.app`. Vite emits static university profiles from the validated anonymous publication feed, selected country and subject pages, editorial guides and EN/RU/UZ catalog variants. See [SEO publishing and verification](../../seo.md) for the production release and Search Console status.

- Frontend: Vite, React, Tailwind CSS, shadcn/ui; the Sites landing uses Three.js/React Three Fiber, GSAP and Lenis.
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
  The [deferred candidates](DECISIONS.md#deferred-dependency-candidates) are tracked separately; Three.js became active in the subsequent Sites transfer.

## Sites presentation — 2026-10-15

Actual version-7 Sites source now supplies Home, the interactive particle scene,
assets and shared product presentation across Search, Profile, Recommendations
and Login. Main data/matching contracts and protected routes remain. See the
[transfer and QA record](../../qa/sites-design-port.md) for provenance, integration
corrections, browser evidence and verification limits. This is a local repository
change; production publication has not been performed.

The 2026-10-16 post-hero refinement adds whole-heading editorial entrances,
reversible scene/media transitions and a warm milk/graphite palette. The first
fragment was compared before extending motion down the page. Reduced motion
keeps content static; the [MDX study and QA record](../../qa/mdx-motion.md)
distinguishes observed reference behavior, implementation choices and test limits.

## Hero particle story — 2026-10-16

Published at [unimatch-two.vercel.app](https://unimatch-two.vercel.app/).
The 2026-10-17 user decision supersedes the original OS-based static mode: Home
motion is always enabled. A persistent visual wrapper also fixes lazy-loading
timing for the hero exit tween. See the [production diagnosis](../../qa/production-motion.md).

Home's hero now uses a generated pearl particle story (Earth, subject symbols,
ribbon and university route). Scrolling reverses the same timeline; the first
scroll hides the header/copy and expands the scene. The old poster and scene
buttons are removed, with localized loading/error states instead. See the
[hero QA record](../../qa/hero-particle-story.md) for source ownership, browser
checks and measured performance limits; stable 60 FPS is not established.

## SEO, Warm Pearl Glass & verified source hygiene — 2026-11-22

- **Organic discovery, pre-hydration shells & Vercel headers (`scripts/seo-*.mjs`, `src/lib/seo.js`, `src/lib/discoveryContent.js`, `src/Layout.jsx`, `vercel.json`, `docs/seo.md`):** Allowed `web.archive.org` programme/source snapshots in `scripts/seo-catalog.mjs`, normalized `'UK'` -> `'United Kingdom'` and repeated `https://https://` schemes, removed duplicate `/University?id=<uuid>` action links from static university profiles (leaving inline interactive `<details>` on `src/App.jsx` scoped strictly to profile routes), projected validated/historical tuition, deadlines, requirements, institutional overviews, clean source labels via `namedPublicSources` / `isGenericSourceTitle` / `normalizeIntakeText`, replaced the white `#public-entry` box on `/`, `/Search`, `/ru/Search`, `/uz/Search` and `/AdmissionsSurvey` with route-matched Warm Pearl Glass / Hero shells (`PublicEntryContent`, `catalog-preview.json` preview cards, `<link rel="preconnect">`, chunk `modulepreload`, `useLayoutEffect` theme sync in `src/Layout.jsx`), fixed `countrySlug` multi-word normalization in `scripts/seo-pages.mjs`, expanded `scripts/seo-editorial.mjs` to 13 verified country hubs (`/countries/*`) and 9 EN/RU/UZ guides across 3 `translationKey` groups, added 6 verified `/study/*` hubs + `/study` index, added sibling/country/study internal links, `WebSite` `SearchAction` (`src/lib/seo.js`), per-profile `CollegeOrUniversity` (`sameAs`), `Course` (up to 3 programmes) and strictly sourced `FAQPage` JSON-LD with concise `<= 160` char `<meta name="description">`, added `308` redirects for lowercase/locale aliases (`/en`, `/search`, `/ru`, `/ru/search`, `/uz`, `/uz/search`, `/admissions-survey`, `/admissionssurvey`), and set `Cache-Control` rules on `/assets/`, `/assets/catalog-preview.json`, `/reference/`, `/images/`, and `/media/`.
- **Warm Pearl Glass UI, icons, copy & responsive layout (`src/index.css`, `src/styles/*.css`, `src/Layout.jsx`, `src/pages/*.jsx`, `src/components/**/*.jsx`):** Unified `DiscoveryContent`, `Profile`, `Recommendations`, `EssayChecker`, `ComparisonModal`, `Search`, `AdmissionsSurvey`, `University`, `Login`, `AdminFeedback`, `AdminDataQuality`, `PageNotFound`, `ChanceIndicator`, `UserNotRegisteredError`, and `release-pages.css` on `#f0eae7`/`.ambient-light-field` warm glass tokens (`#292823` ink, `#252c2f` graphite CTAs, `#704a2d`/`#855a36` accents), unified `--product-shell-max` (`1360px`, widening to `1440px` at `>=1600px`) across `.product-nav`, footer and page containers, grounded `.unimatch-app` as a `100dvh` flex column, redesigned `.product-footer` (`src/Layout.jsx`, `src/styles/product-theme.css`) into a unified rounded Warm Pearl Glass architectural card aligned to `--product-shell-max` (brand emblem + `UNIMATCH` wordmark + tagline, `QUICK LINKS` icon pills, and a direct `CONTACT US` pill strip for Telegram/Instagram using `lucide-react` `Send`/`Instagram`/`ArrowUpRight` without layout-breaking accordions or per-route background overrides, with `FeedbackButton` clearance across desktop/tablet/mobile), anchored `/Login` card top edge, single-line title sizing and `ResizeObserver`-smoothed tab panel heights with calmed `ParticleScene` morph/hover motion (`0px` tab-switch layout jump, no empty card bottom gap or desktop scroll void above footer), redesigned the standalone `/University` detail page (`src/pages/University.jsx`, `src/components/search/UniversityDetailModal.jsx`, `src/components/admissions/PublishedProgrammeFacts.jsx`, `src/components/admissions/OfficialSources.jsx`, `src/styles/university-glass.css`) with a compact breadcrumb topbar, split editorial Warm Pearl hero (`h1`, monogram, `Save` / `Visit Website`, right-framed photo collapsing cleanly when absent), a 2-column desktop workspace (`1.48fr / .92fr` at `>=1024px`) pairing the primary `2x2` programme stat bento grid, pill disclosures, about/scholarship cards with a scannable context rail (Campus Life `lucide-react` status rows, merged International Support & Contacts, and Visa guidance with clickable external links) while keeping `.university-detail-embedded` single-column on `/universities/:slug`, harmonized university card typography and layout across `UniversityCover`, `SearchProgrammePreview`, `TuitionValue`, `UniversityCard`, `search-page.css` and `recommendations-glass.css` (removed bold `Main university` clash and mid-word ellipsis truncation, replaced cramped 50/50 split stats with full-width Warm Pearl stat rows preventing orphan `IELTS minimum / 6` breaks, styled inline year pills and `40px` `Conditions` disclosure pills, removed mid-card `What to check` voids, and aligned row baselines), aligned card header/photo/action baselines across Search, Recommendations and Survey results, restored Search toolbar concentric glass padding (`16px 20px` desktop / `14px 16px` mobile), `48px` input/button height parity, flush mobile toolbar width and boolean `FilterPanel` reset-count guard, replaced the blocking modal filter overlay on `/Search` with a persistent collapsible sticky left glass sidebar (`>= 1024px`) and inline non-blocking panel (`< 1024px`) beside live university results, restored compact tablet summary banner and mobile/tiny-screen wrapping, hid collapsed footer `<details>` children off-layout, fixed Survey result step-advance scroll target above `.product-nav`, replaced all native disclosure markers (`▶`/`+`/`−`) and text symbol glyphs (`↗`/`→`/`✓`/`•`/emoji) with `lucide-react` vector icons and compact pill triggers (`Photo credit`, `About these matches`), tightened noisy UI copy across `copy.js` / `polishCopy.js` / `resultPresentation.js` / `ComparisonModal` / `PublishedProgrammeFacts`, formatted short source acronyms (`EER`, `DACS`), fixed hero `<h1>` token concatenation (`Lines`, `UniMatchHero.jsx`), added explicit `<h1>` landmarks on `EssayChecker` guest/unavailable views, aligned `LanguageSwitcher` and `UniversityPhoto` WCAG 2.5.3 accessible label order, and `Footer` (`Layout.jsx`, `product-theme.css`) + added a shared 3D-projected micro-particle sphere `<ParticleLoader />` (`src/components/ui/ParticleLoader.jsx`, `particle-loader.css`, `variants: full | card | pill | orbit`, zero WebGL bloat, `#public-entry`-safe and `prefers-reduced-motion`-compliant) across `App.jsx` (`PageLoading`, inline discovery details), `RequireAuth.jsx`, `HeroSceneFallback.jsx` (`HeroLoadingScreen`), `University.jsx`, `EssayChecker.jsx`, `Search.jsx`, `Recommendations.jsx`, `Profile.jsx`, and `AdminFeedback.jsx`, tightened vertical spacing, eliminated oversized viewport height voids & radial-glow section seams between `#intro`, `.experience-heading`, `.experience-media`, and `#approach`, and redesigned `.experience-details` + `.values-grid` (`src/components/landing/Landing.jsx`, `src/components/landing/story.css`, `src/components/landing/usePageMotion.js`) into a responsive 2-over-3 Warm Pearl Glass Bento system with equalized card baselines, high-contrast pills, and compact horizontal tablet value strips, redesigned `#discover`'s destination filter bar (`.collection-controls` Warm Pearl Glass dock, `SlidersHorizontal` label, readable `44px` chips, high-contrast active/shortlist pills, dark-frosted `.card-number`/`.save-button` card overlays, warm card loading placeholder, and `ParticleLoader` pill loading state), alongside darkened muted text colors for WCAG contrast compliance.
- **Database verification & SQL patch (`scripts/supabase-seo-sources-patch.sql`):** Read-only audit of all 104 published rows and 565 unique URLs generated an idempotent SQL patch (`98` rows) resolving broken apex domains, double-scheme websites, verified `404`/`400`/timed-out URLs, 3 quarantined Polish rows (`oc90-038`, `oc90-044` incl. missing `monthDay: null`, `oc90-045`), 2 Belgium archive `name`/`degree` source references, `'UK'` -> `'United Kingdom'`, 210 internal source labels, 65 concatenated text strings, and 11 directly verified official university tuition entries (`adaptPublicCatalog` passes `104` institutions / `0` issues in offline Node validation; not applied live because no service-role credential exists in workspace).
- **Verified locally (2026-11-22):** Live-feed Vite build emits `141` sitemap URLs (`104` profiles, `13` country hubs, `6` `/study/*` hubs, `9` EN/RU/UZ guides, `4` directory indexes, `5` app entry routes); `check:seo`, `typecheck`, `lint`, `check:matching` (36 groups), `check:admissions` (11 scripts), `check-catalog.mjs`, and `check-hero-scene.mjs` pass. Chromium/Playwright pre-JS visual captures (`0` overflow, no `.discovery-embedded` card) + hydrated CLS checks (`compare_seo_fallback.mjs`: `0` on `/`, `0.0147` desktop / `0.0364` slow 3G on `/AdmissionsSurvey`, `0.0537` desktop / `0.0492` slow 3G on `/Search`), Search toolbar glass alignment check (`16px 20px` padding, `48px` height parity), DOM audits across `1920×1080`, `1440×900`, `768×1024`, `390×844`, and `320×568` (`43/43` runs: `0` horizontal overflow, `0` offscreen elements, `0` console/page errors), and `axe-core` across 15 routes × desktop (`1280x900`) & mobile (`390x844`) (`30/30 PASS`, `0` WCAG 2.0/2.1 AA violations) pass (pre-existing unrelated `scripts/check-comparison.mjs:9` still fails expecting unformatted `/17970 GBP/`). Production `www.getunimatch.app` TLS certificate/domain setup in Vercel Dashboard and Google Search Console inspection remain external user actions. See [SEO audit report](../../../SEO_INDEXING_AUDIT_REPORT.md).

## Current priority

The product bottleneck is trustworthy data enrichment and the core search/match experience—not more infrastructure. Keep changes focused and preserve the existing data-quality rules.

## Maintenance

For confirmed product/architecture/state changes, follow `docs/agents/context/MAINTENANCE.md`. Keep current facts distinct from planned priorities; record evidence when updating a consequential claim.
