# University and controls Liquid Glass — 7 November 2026

## Goal

Continue the accepted Search appearance on public university details, filter controls and the language switcher. The user's follow-up requests a university card across the available viewport width and ordinary visible information sections instead of accordion triggers. Root owns integration and verification. The completed `glass_controls` helper owned the initial filter/language component hooks and controls stylesheet; root made subsequent integration and accessibility corrections.

## State

- Phase: release candidate verified; publication in progress.
- Verified: 7 November 2026 against the current working tree. The workspace contains unrelated existing changes; this task does not claim or publish them.
- Next action: publish the isolated candidate through the existing main-branch deployment and verify the canonical public site.

## Files and behavior

- `src/pages/University.jsx`, `src/styles/university-glass.css`: viewport-wide layout with 24px desktop / 16px mobile gutters, pearl translucent card, fixed amber light above and below, floating navigation, dense graphite website action.
- `src/components/search/UniversityDetailModal.jsx`: reuse the licensed `UniversityPhoto` component on the public page. About, campus life, student support, visa and applicable scholarships render as static sections for `heading="h1"`. The shared modal retains its collapsible presentation. Programme fact/source disclosures and photo credits remain available.
- `src/components/search/FilterPanel.jsx`, `src/styles/glass-controls.css`: glass select triggers, portaled option lists, amber slider/value/chip selection states. The existing drawer provides the surrounding material.
- `src/components/i18n/LanguageSwitcher.jsx`: reuse the existing dropdown radio wrappers, translate the trigger label, show the selected language, and stop the submenu's Escape event from closing the parent mobile navigation.
- `src/types/ui-shims.d.ts`: declare the existing radio wrapper exports for this JSX consumer.

## Contracts and decisions

Adapted the installed `liquid-glass-design` material guidance to existing web components; consulted frontend design, Playwright, accessibility and React review guidance. No native iOS APIs or new UI dependency were introduced. University data, generic US visa labels, source-language notices, uncertainty, programme selection, filters, return navigation and save/auth contracts are preserved. No schema or matching change.

## Verification

Passed for the initial extension (the mobile language follow-up below supersedes its mobile dropdown evidence):

- `node node_modules/typescript/bin/tsc -p ./jsconfig.json`
- `node node_modules/eslint/bin/eslint.js src/components/i18n/LanguageSwitcher.jsx src/components/search/FilterPanel.jsx src/components/search/UniversityDetailModal.jsx src/pages/University.jsx --quiet`
- `node node_modules/vite/bin/vite.js build`
- `node output/playwright/glass-extension-review.cjs`: **24 checks passed**, no JavaScript errors or remote writes.

Browser evidence is local and ignored: `output/playwright/glass-extension/results.json`, `university-{1440,768,390,320}.png`, `university-open-sections.png`, `filters-desktop.png`, `filters-mobile.png`, `filter-options.png`, `filters-advanced.png`, `language-menu.png`, `language-mobile.png`. The script reused existing QA helpers and the captured public catalogue/media fixture from the Search review. It did not mutate a remote service. External network restrictions prevented treating this as live backend verification.

Checked the fixed amber field, preserved programme tuition, static visible visa/information sections, card width and overflow at 320/390/768/1440px, full original photo access, IELTS URL state, degree selection, filter portal styling, mobile filter dismissal/focus, language selection persistence and mobile language menu Escape/focus. Screenshots were visually inspected. Authenticated saving and every legacy university data variation were not exercised.

Earlier attempts corrected QA timing/locator assumptions. An actual mobile Escape propagation issue was fixed in the language dropdown. The final focus check waits for Radix dismissal and automatic focus restoration. A stopped local server was restarted before the accepted run. Relevant checks were repeated after the final source changes; no unresolved failure remains.

## Documentation impact

README records the new visible behavior and distinguishes this local extension from the previously published Search release. No architecture, data policy, setup or verification convention changed, so current decisions/project architecture documents need no update. Earlier Search release evidence remains unchanged.

## Mobile language refinement — 7 November 2026

The user found the mobile language popup oversized and visually detached. `LanguageSwitcher` now accepts an inline presentation, used only by the mobile navigation caller in `src/Layout.jsx`. A globe and three native radio segments (EN / RU / UZ) occupy one row within the panel. The selected segment has an amber surface; full language names remain accessible. Desktop retains its existing dropdown. No overlay covers the login actions, and each segment retains a minimum 44px touch target. Styling lives in `glass-controls.css`.

Final typecheck, focused ESLint for Layout/LanguageSwitcher and production build passed. `node output/playwright/language-compact-review.cjs` passed **39 checks**: all three languages persist and expose checked state at 320/390/768px; native arrow-key selection works; the menu fits without overflow; Escape closes navigation and returns focus; desktop retains three dropdown choices; no JavaScript errors or remote writes. The first script attempt targeted the visually hidden input with a pointer; it was corrected to click the visible label, matching actual use. Source did not change for that retry.

Screenshots visually inspected: `output/playwright/language-compact/mobile-390.png`; additional 320px and 768px screenshots and `results.json` are in the same ignored evidence directory. This follow-up is verified locally and not published. README has been updated. The initial extension script's mobile-dropdown interaction is historical; use the new focused script for the current mobile control.

## Navigation panel refinement — 7 November 2026

The user clarified that the oversized element was the entire navigation panel. Updated `src/Layout.jsx` and `src/styles/glass-controls.css`: a floating panel under the menu toggle, maximum width 320px, 10px inner spacing, 44px navigation rows with smaller icons, current-page semantics and amber highlight. Guest actions sit side by side; the inline language control remains. The pearl surface uses an opaque gradient so text behind the panel does not interfere with its content. Outside pointer presses dismiss the panel; Escape restores toggle focus as before. The panel scrolls within short viewports.

Root completed the change without delegation. Typecheck, focused Layout ESLint and production build passed. `node output/playwright/navigation-compact-review.cjs` passed **57 checks**, covering the existing language/keyboard behavior plus four navigation links, the active page, dimensions, readable guest actions, outside dismissal and link dismissal. The guest panel measured 296×323px at viewport 320px and 320×323px at 390/768px. Desktop language dropdown remained available; no JavaScript errors or remote writes. Screenshots at 320px and 390px were inspected. A visual correction removed background text bleed and an inherited extra panel inset; the accepted browser check and build include that correction.

Evidence: `output/playwright/navigation-compact/results.json` and `mobile-{320,390,768}.png`. Earlier mobile screenshots are historical. Authenticated account content was not exercised by this guest-focused browser run. README records the compact panel and dismissal behavior. No new data, auth or architecture contract was introduced; publication remains pending.

## Isolated release candidate — 7 November 2026

Prepared from production commit 6cc00a5ed527ba41fcf52e66d75dc74482e67bb0 in a clean clone, excluding unrelated workspace changes. Payload: Layout, LanguageSwitcher, FilterPanel, UniversityDetailModal, University, UI wrapper type declarations, the two glass stylesheets, this QA record and the README pointer. No package, environment, data or backend changes.

Candidate typecheck, focused ESLint, Vite production build and built SEO checks passed. Browser checks against the isolated candidate at port 5175 passed: university/filter/language extension (22), compact guest navigation (57), authenticated account fixture and short landscape viewport (17). No JavaScript errors or attempted remote writes. This adds 96 passing assertions. Authenticated checks use a local session fixture; login credentials, real account mutations and logout requests were not exercised. Candidate desktop university and 390px navigation screenshots were visually inspected.

Local evidence: output/playwright/university-release-{extension,navigation,account}/results.json and corresponding screenshots. Production checks will use live public data and images without catalogue or media fixtures.
