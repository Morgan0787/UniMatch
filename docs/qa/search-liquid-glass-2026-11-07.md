# Search Liquid Glass — 7 November 2026

Implemented locally on Search only. No deployment or account/database writes.

## Presentation

- Adapted the installed `liquid-glass-design` skill's material and contrast principles to web CSS. The skill's native iOS APIs are not used by this React app.
- Warm pearl field with upper and lower amber light, floating translucent navigation, glass search controls, fine white card edges and soft shadows.
- Dense graphite primary actions with one restrained highlight and white labels; light secondary controls. The filter drawer becomes a rounded bottom sheet on mobile.
- Search-scoped CSS and two class hooks in Search.jsx preserve existing functionality and shared fact presenters. Cards use a single backdrop blur, without additional blurred layers inside them; reduced-transparency and unsupported-backdrop fallbacks are included.

## Verification

- `npm run typecheck` passed. Targeted Search ESLint exited 0 with the existing unused `e` warning at line 145. Production build passed after the final CSS change.
- Chrome browser checks passed at 1440, 768, 390 and 320px: three/two/one/one columns, no horizontal overflow, named filter inputs.
- Mobile drawer fits the 390×844 viewport. IELTS selection applies to the URL; Escape closes the drawer and restores trigger focus.
- Search query, comparison selection, programme-detail navigation and browser Back restoring the query passed.
- Primary CTA has white text, graphite base, a 44px target and a visible keyboard focus outline. Reduced-motion card transform is disabled. Login navigation retains its original top position. No page JavaScript errors occurred.
- Inspected final desktop, mobile and filter screenshots. Following the owner's repeated request to match the reference, amber light now uses three viewport-fixed pools behind the glass, including the lower screen. Cards have wide cropped previews, rounded edges and amber condition disclosures; their primary label is Details / Подробнее / Batafsil. The full original photo is available inside the existing caption/credit disclosure, with original attribution and scope intact. The new browser check confirms that this full-frame view is accessible and uses `object-fit: contain`.
- Final typecheck and targeted Search/UniversityCard/UniversityPhoto ESLint passed (same existing Search warning). Final production build passed. All 16 browser checks passed. Owner visual acceptance remains pending; this is a working local implementation, not a claim of pixel-identical output or deployment.

## Composition follow-up

Search now uses its own `SearchProgrammePreview` rather than the shared compact fact layout: programme heading, two-column cost/language band, amber review status and academic clarification. It reuses `describePublicFact` and `TuitionValue` (which applies the shared tuition status); missing requirements stay unknown, historical prices retain their season/status/currency/period, and the existing University detail route continues to show complete facts and sources. No catalogue or matching logic changed.

Card photos are 144px high on desktop, with the bookmark and a compact photo-credit disclosure over the image. Full-frame photos, captions, scope and licensing remain in that disclosure. Mobile search controls no longer sit inside an oversized frosted container. Desktop screenshot shows the normal returning-visitor state after dismissing the first-visit hint; the browser matrix also covers the initial hint state.

Typecheck, focused component ESLint, `node scripts/check-admission-fact-presentation.mjs` and the final production build passed. Browser checks additionally verify the original EUR/semester amount and historical USD/year/unknown-language presentation. The design is inspected against the reference for composition and material; it adapts that reference to Search and real catalogue content rather than claiming identical copy or pixel alignment.

Browser external networking was denied by the environment. Verification served a freshly fetched anonymous public catalogue snapshot (2,063 rows) and original image bytes through test-only request interception. Application networking and catalogue code were not changed. These checks establish local presentation and interaction behavior, not production connectivity or authenticated writes.

Local ignored artifacts: [results](../../output/playwright/search-glass/results.json), [desktop](../../output/playwright/search-glass/search-desktop.png), [mobile](../../output/playwright/search-glass/search-390.png), [filters](../../output/playwright/search-glass/filters-mobile.png). Browser harness: `output/playwright/search-glass-review.cjs`.

## Final refinement

The cost qualifier stays beside the amount without a duplicate warning below. Language section minimums and applicability notices remain available through a native Conditions disclosure. Metadata text is larger, cards have translucent pearl material with fine edge reflections, and graphite actions use one broad highlight. At 320px the statistics and actions stack to preserve readable text. Photo credit chips are anchored to the image even when university titles wrap.

On Search, feedback is available in the footer instead of floating over card actions. Other pages retain the floating trigger. The browser harness verifies opening and closing this dialog without submitting anything.

Final production build, typecheck, focused Layout/preview ESLint and admission fact presentation checks passed. The extended browser matrix checks language conditions, a single historical price warning, full-frame photo disclosure without overflow, mobile action sizes, long university titles, and feedback placement in addition to the existing flows. Inspected the whole [mobile card](../../output/playwright/search-glass/card-mobile.png) and [expanded photo](../../output/playwright/search-glass/photo-expanded-mobile.png), including their lower controls and credit text. The external networking limitation described above still applies.

## Documentation impact

README links this local presentation update; DECISIONS clarifies the full-frame photo access for the accepted compact-preview direction. No architecture, data contract, schema, setup or agent-policy changes were needed. Broader page styling and release verification are outside this batch.

## Release candidate — 7 November 2026
Isolated from verified production fdb3fa59, preserving its login, pagination, scrollbar and SEO changes. Only Search presentation and the Search-specific feedback placement are included. Production build, typecheck, SEO checks and all 26 browser checks passed on this isolated candidate. The inherited fact-presentation script still expects ungrouped prices and fails on 12,500 versus 12500 under Node 24; its implementation is byte-equivalent to production after line-ending normalization and is unchanged by this release. No data or environment changes.

