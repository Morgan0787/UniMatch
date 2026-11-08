# Survey and preliminary matching — Liquid Glass

Owner: root. State: implemented and locally verified; isolated release candidate prepared on 8 November 2026, publication pending.

## Outcome and acceptance

Carry the accepted Search/University material into all three survey steps and preliminary results. Warm cream light field with visible upper/lower amber glows; translucent pearl surfaces; restrained graphite primary actions; amber checked choices. Existing three-step answers, validation, draft lifetime, matching evidence and saving/auth behavior remain authoritative.

Design: reuse the existing typeface, Radix selects, Lucide icons and glass controls; no dependencies. Ink #292e30, muted #625e59, canvas #f0eae7, pearl #fffdf9, amber #efc18b, focus #966433. Main form takes priority, compact contextual summary on desktop, earlier form content on mobile. Results emphasize institution/programme, photos, tuition and qualified conditions.

## Implemented

- Route-scoped `src/styles/survey-glass.css`: cream canvas, viewport-fixed amber light above/below, pearl surfaces, white rims and restrained graphite reflections. Explicit selectors replace the legacy blue canvas on this route. Reduced-transparency fallback and reduced-motion transitions are included; ambient light follows the existing owner motion policy in DECISIONS.md.
- All three steps: clear current/completed progress, keyboard-accessible return to completed steps, semantic subject icons and compact desktop answer summary. On phones the summary is omitted, the primary action spans the form and budget/currency controls align at the bottom.
- Results: visible photos and neutral compact monograms when a photo is unavailable, primary qualification reason and existing results caveat outside disclosures, two-column cards and a wider internal layout for a single result. Photo credits remain available; noncompact media used by Profile retains its existing caption placement.
- Preserved answer schema, draft lifetime, validation, evaluator, public catalogue contract and save/auth behavior. Fixed the refinement callback's missing return value so the existing success announcement works. Count wording no longer produces a Russian plural error for one university.
- Adopted read-only helper review suggestions: keep the main uncertainty visible and show the existing qualification caveat above results. No matching scores or promises of eligibility were introduced.

Production baseline b19ad8b matches the affected survey components (ignoring line endings); unrelated root changes are retained. The 8 November candidate contains only the survey changes and five semantic navigation class hooks, isolated from the root workspace's unrelated changes.

## Reference refinements — 8 November 2026

- Converted the desktop sidebar and form into one continuous pearl glass surface, removing the neighbouring panel rims and central partition.
- Floating navigation and survey surface fill the available viewport with 24 px desktop gutters. At 2560 px the sidebar stops growing at 480 px and choices use three columns. Phones retain a single-column form and compact navigation.
- Navigation has a thin white rim, translucent warm material, wider wordmark spacing and a compact language chip. Only the redundant current-survey guest CTA is hidden; sign-in remains available. Class hooks leave other routes' styling unchanged.
- Subject controls use 24 px thin-outline briefcase, monitor, gear, layers, code and dots icons. Secondary helper descriptions remain available through accessible descriptions. Progress uses thin bars and numbered labels.
- Upper and lower amber light layers move independently over 42 and 57 seconds with alternating smooth transforms and slight opacity variation. No gradient, filter or layout property is animated. These ambient animations remain active under reduced motion as explicitly required by the existing owner policy.
- Reference-direction screenshots inspected at 390, 1024, 1440 and 2560 px. This is an implementation inspired by the generated reference, not a pixel-identical rendering claim.

## Verification

- `node output/playwright/survey-glass-qa.cjs`: 93 assertions passed on 8 November, no browser runtime errors. Actual guest flow covers selections, invalid IELTS/focus, return with preserved answers, draft reload, results, refinement feedback, multiple-card comparison and conditions disclosures. Added width, border, requested icons, independent durations and actual movement checks for both light layers.
- Survey steps/results checked at 320, 390, 768, 1440 and 1920 px; EN/UZ mobile checked with reduced motion. No horizontal overflow or unnamed comboboxes detected. A 320 px keyboard-only currency change passed; dropdown options provide 44 px targets.
- Initial screenshots exposed inherited blue styling; scoped selectors corrected it. Computed outer-panel material is `blur(20px) saturate(1.2)` over a translucent pearl gradient, with no legacy root gradient. The harness waits for actual focused Radix options and asynchronous invalid-field focus. A new icon assertion was corrected to Lucide's actual `lucide-layers2` class before the final successful run.
- Targeted ESLint on the six affected JS/JSX modules, `tsc -p ./jsconfig.json`, `check-admission-draft.mjs`, `check-admission-fact-presentation.mjs`, Vite production build and `check-seo.mjs` passed.
- Final screenshots inspected from real local Chrome, including desktop budget/results, mobile budget and multiple-result fallbacks. Screenshot capture waits for the page to reach the top after lazy-photo decoding.

Isolated candidate on b19ad8b (8 November): production build/SEO, targeted ESLint, typecheck and draft checks passed. Chrome against the built preview with the real public catalogue passed 40 checks: all six widths from 320 to 2560 px, full-width material/navigation, actual ambient animation progress, invalid IELTS/focus, draft reload, results/caveats, compact language menu and Search/University regressions. No JavaScript errors, failed catalogue/bundle responses or remote writes. The baseline fact-presentation script fails on stale ungrouped amount expectations (`12500` versus the unchanged formatter's `12,500`); neither the formatter nor that script differs from b19ad8b in this candidate. Running its same assertions in an ignored temporary harness with only five grouping expectations reconciled passed. No unrelated formatter or test changes are included in the release. Candidate result screenshots initially captured lazy images before decoding; the capture helper now waits for decoding before final production evidence.

Browser fixture: local Vite at `http://127.0.0.1:5173`; 104 published catalogue records from the existing read-only public snapshot and cached Wikimedia photos. Remote writes were blocked. This verifies UI against a known snapshot, not current catalogue availability, real authentication, account saving or production deployment. No preserved before-image comparison is claimed.

## Evidence and maintenance

Local artifacts are ignored under `output/playwright/survey-glass/`:

- [Desktop survey](../../output/playwright/survey-glass/desktop-budget.png)
- [Reference direction, desktop](../../output/playwright/survey-glass/1440px-reference-direction.png)
- [Wide monitor](../../output/playwright/survey-glass/2560px-reference-direction.png)
- [Desktop results](../../output/playwright/survey-glass/desktop-results.png)
- [Mobile survey](../../output/playwright/survey-glass/390px-step-2.png)
- [Mobile results](../../output/playwright/survey-glass/390px-results.png)
- [Browser report](../../output/playwright/survey-glass/report.json)

README and stable project brief updated. No schema, import, data decision or agent-routing change. Next action: verify the isolated production build, publish the scoped candidate and smoke-test the live survey.
