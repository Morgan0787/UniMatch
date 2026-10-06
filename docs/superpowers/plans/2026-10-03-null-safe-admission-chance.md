# Null-Safe Admission Chance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the matching engine from converting NULL admission data into a confident "High Chance" verdict, and render an honest "Not enough data" state instead.

**Architecture:** Extract the three duplicated copies of `calculateChance` into one pure, dependency-light module (`src/lib/matching.js`) that returns an explicit `unknown` verdict when `min_gpa` is NULL. Add a fourth visual state to the existing `ChanceIndicator`. Verify the pure module with a plain-Node assertion script, because this repo has no test framework.

**Tech Stack:** Vite 6, React 18, Tailwind 3, shadcn/ui, Supabase (read path only), plain Node ESM for verification.

**Spec:** No separate spec document. Design decided in-session and recorded in `.opencode/context/DECISIONS.md` + `PROJECT_CONTEXT.md`; the approved decision is that a NULL `min_gpa` yields a "Not enough data" state, not high/medium/low.

## Global Constraints

- Regional estimates from `src/lib/regionalEstimates.js` are **display-only** and must **never** enter chance math (`PROJECT_CONTEXT.md:29`, and the module's own header comment at `regionalEstimates.js:6`).
- Never substitute a plausible value for a NULL admission field. Unknown stays unknown (`DECISIONS.md:6`, `DECISIONS.md:17`).
- Missing tuition, acceptance rate, degree levels, notable programs must display `Not published` (`DECISIONS.md:7`).
- Any factual enrichment needs `source_url` + `verified` (`DECISIONS.md:8`). This plan adds no new data and invents none.
- Schema: the column is quoted camelCase `topikLevel` (TEXT, e.g. `"TOPIK 4"`), **not** `topik_level`. `user_feedback` sorts by `created_date`. `tuition_currency_note` is not a real column.
- The `chance.*` i18n namespace exists in exactly three locales in `src/lib/i18n/translations.js`: `en` (line ~218), `ru` (line ~489), `uz` (line ~760). All three must gain the new key together.
- No new runtime dependency. No test framework is to be introduced by this plan (see "Verification strategy").
- `src/lib/**` is excluded from both ESLint and `tsc` (`eslint.config.js:9-14`, `jsconfig.json:19-20`), so `matching.js` gets **no** automated lint/type coverage. The Node assertion script is the only automated guard on it — this is why Task 1 is not optional.

## Review Focus

Five failure modes a reasonable person would expect to be handled, which the current code does not:

1. **A US university selected into the compare tray.** `min_gpa`/`tuition_min` are NULL, and `ComparisonModal.jsx:283,298` call `.toLocaleString()`/`.toFixed()` unguarded — the modal throws and the page white-screens. Expected: renders `Not published`.
2. **A student with no GPA in their profile.** `UniversityCard.jsx:14` returns `'medium'` — a mid verdict invented from absence of data. Expected: `unknown`.
3. **A student who has a GPA, viewing a university with no published cutoff.** Expected: `unknown` with an explanation, never `high`.
4. **A verdict string that `ChanceIndicator` does not recognise.** `ChanceIndicator.jsx:30` silently falls back to `config.medium`, so any typo or stale caller renders a confident "Medium Chance". Expected: an unrecognised verdict is visibly `unknown`, not `medium`.
5. **Keyboard/screen-reader use of the new state.** The neutral badge carries an explanatory note. Expected: the note is announced, not colour-only, and the state is not conveyed by the icon alone.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/matching.js` **(create)** | Pure, framework-free admission-chance logic. Single source of truth. No React, no Supabase, no `@/` alias imports — relative imports only, so plain `node` can execute it. |
| `scripts/check-matching.mjs` **(create)** | Plain-Node assertions pinning the null-safety contract. The only automated coverage `src/lib/**` gets. |
| `src/components/ui/ChanceIndicator.jsx` **(modify)** | Presentation only. Gains a fourth `unknown` state; loses the silent `medium` fallback. |
| `src/lib/i18n/translations.js` **(modify)** | Adds `chance.unknown` to the `en`/`ru`/`uz` `chance` blocks. |
| `src/components/search/UniversityCard.jsx` **(modify)** | Deletes its local `calculateChance`; imports the shared one. |
| `src/components/search/UniversityDetailModal.jsx` **(modify)** | Same, plus guards the two null crashes. |
| `src/pages/Profile.jsx` **(modify)** | Deletes its local `calculateChance`; imports the shared one. |
| `src/pages/Recommendations.jsx` **(modify)** | Null-safe `calculateMatchScore`, guarded tuition render, corrected badge conditions. |
| `src/components/comparison/ComparisonModal.jsx` **(modify)** | Guards the two null crashes; uses the shared verdict. |

`matching.js` deliberately stays out of `src/lib/i18n` and `src/components` so it remains runnable under bare Node.

---

### Task 1: Pure null-safe matching module

**Files:**
- Create: `src/lib/matching.js`
- Create: `scripts/check-matching.mjs`

**Interfaces:**
- Consumes: `US_GPA_HOLISTIC_NOTE` from `src/lib/usGenericInfo.js`, imported as `./usGenericInfo.js` from `matching.js` and `../src/lib/usGenericInfo.js` from the script. No `@/` alias anywhere in this task — Node cannot resolve it.
- Produces:
  ```js
  export const VERDICT = { HIGH: 'high', MEDIUM: 'medium', LOW: 'low', UNKNOWN: 'unknown' }
  export function hasGpaData(university)            // -> boolean
  export function calculateChance(university, userGpa, userIelts, userTopik)
      // -> 'high' | 'medium' | 'low' | 'unknown'
  export function describeMissingChanceData(university)
      // -> null | { code: 'us-holistic' | 'no-gpa-published', note: string }
  ```
  `calculateChance` preserves the existing numeric weights and thresholds exactly as they are today (`gpaWeight` 50 when Korean with `topikLevel`, else 60; IELTS 40 / TOPIK 30 + IELTS 20; `>=80` high, `>=50` medium, else low). Only the NULL handling changes.

- [ ] **Step 1: Write the failing assertion script**

  Create `scripts/check-matching.mjs`. It imports `{ VERDICT, calculateChance, describeMissingChanceData, hasGpaData }` from `../src/lib/matching.js` and asserts, using `node:assert/strict`:

  | # | Fixture | Expected |
  |---|---|---|
  | 1 | `{ country: 'United States', min_gpa: null, required_ielts: null }`, `userGpa 3.9` | `VERDICT.UNKNOWN` |
  | 2 | same, `userGpa 4.0`, `userIelts 7.5` | `VERDICT.UNKNOWN` (IELTS must not change the outcome) |
  | 3 | `{ country: 'United States', min_gpa: 3.5, required_ielts: null }`, `userGpa 3.9` | `VERDICT.HIGH` (guards against over-correcting) |
  | 4 | `{ country: 'Germany', min_gpa: 3.5, required_ielts: 7.0 }`, `userGpa 3.2` | `VERDICT.LOW` |
  | 5 | `{ country: 'Germany', min_gpa: 3.5, required_ielts: 7.0 }`, `userGpa 3.45` | `VERDICT.MEDIUM` |
  | 6 | `{ country: 'South Korea', topikLevel: 'TOPIK 4', min_gpa: 3.0, required_ielts: null }`, `userGpa 3.5`, `userTopik 'TOPIK 5'` | `VERDICT.HIGH` (assert the exact verdict, not merely "not unknown" — Korean/TOPIK rows must keep scoring: 50 GPA + 30 TOPIK + 20 IELTS = 100) |
  | 7 | fixture 1 with `userGpa 0` / `null` / `undefined` | `VERDICT.UNKNOWN` (replaces today's fabricated `'medium'`) |
  | 8 | `hasGpaData` on `min_gpa: null`, `undefined`, and `3.5` | `false`, `false`, `true` |
  | 9 | `describeMissingChanceData` on fixture 1 | `{ code: 'us-holistic', note: US_GPA_HOLISTIC_NOTE }` |
  | 10 | `describeMissingChanceData` on `{ country: 'Germany', min_gpa: null }` | `{ code: 'no-gpa-published', note: <string> }` |
  | 11 | `describeMissingChanceData` on `{ country: 'Germany', min_gpa: 3.5 }` | `null` |

  Fixture 9 must import `US_GPA_HOLISTIC_NOTE` and assert equality by reference, so the note cannot drift from the single source in `usGenericInfo.js`.

- [ ] **Step 2: Run the script and confirm it fails**

  Run: `node scripts/check-matching.mjs`
  Expected: fails with `ERR_MODULE_NOT_FOUND` for `../src/lib/matching.js`.

- [ ] **Step 3: Implement `src/lib/matching.js`**

  ```js
  export const VERDICT = { HIGH: 'high', MEDIUM: 'medium', LOW: 'low', UNKNOWN: 'unknown' }
  export function hasGpaData(university) {
    return university?.min_gpa !== null && university?.min_gpa !== undefined
  }
  export function calculateChance(university, userGpa, userIelts, userTopik) { /* ... */ }
  export function describeMissingChanceData(university) { /* ... */ }
  ```

  Two guards, both returning `VERDICT.UNKNOWN`, in this order:
  1. `!userGpa` — the student has no GPA, so no verdict is possible.
  2. `!hasGpaData(university)` — the university has no published cutoff.

  Then run today's scoring body **unchanged** for the remaining cases. Copy the existing thresholds verbatim; this task changes NULL handling only. Do not add, rename, or "improve" any weight.

  `describeMissingChanceData` returns `null` when `hasGpaData` is true, `{ code: 'us-holistic', note: US_GPA_HOLISTIC_NOTE }` when `university.country === 'United States'`, and `{ code: 'no-gpa-published', note: <one short sentence> }` otherwise.

- [ ] **Step 4: Run the script and confirm it passes**

  Run: `node scripts/check-matching.mjs`
  Expected: all 11 assertions pass, exit code 0.

- [ ] **Step 5: Confirm the module is genuinely framework-free**

  Run: `node --input-type=module -e "import('./src/lib/matching.js').then(m=>console.log(Object.keys(m).join(',')))"`
  Expected: prints the four exported names. If this throws on `@/` or `react`, the relative-import rule was violated — fix before continuing.

- [ ] **Step 6: Commit**

  ```bash
  git add src/lib/matching.js scripts/check-matching.mjs
  git commit -m "fix(matching): return unknown verdict when min_gpa is null"
  ```

---

### Task 2: `ChanceIndicator` fourth state + i18n keys

**Files:**
- Modify: `src/components/ui/ChanceIndicator.jsx:9-30`
- Modify: `src/lib/i18n/translations.js` — the `chance` block at ~218 (en), ~489 (ru), ~760 (uz)

**Interfaces:**
- Consumes: `VERDICT` from `src/lib/matching.js` and `describeMissingChanceData` from the same module.
- Produces: `ChanceIndicator({ chance, size })` additionally accepts `chance === 'unknown'`, plus a new optional prop `reason?: string` — an explanatory sentence rendered for screen readers only.

**Depends on:** Task 1.

- [ ] **Step 1: Add the i18n key to all three locales**

  Add one key to each of the three `chance` blocks:
  - en: `unknown: 'Not enough data'`
  - ru: `unknown: 'Недостаточно данных'`
  - uz: `unknown: 'Maʼlumot yetarli emas'`

  Add to **all three in the same edit.** Note `translations.js:832-833` builds `ru: deepMerge(en, ru)` and `uz: deepMerge(en, uz)`, so a key added only to `en` does **not** render as a raw key — it silently falls back to English text. The reason to edit all three is that the badge must actually be translated; the fallback hides the omission rather than surfacing it.

- [ ] **Step 2: Add the `unknown` visual config**

  Add a fourth entry to the `config` map in `ChanceIndicator.jsx`, visually neutral so it cannot be mistaken for a verdict: `bg-slate-50 text-slate-600 border-slate-200`, `icon: HelpCircle` from `lucide-react`, `iconColor: 'text-slate-400'`.

- [ ] **Step 3: Replace the silent `medium` fallback**

  `ChanceIndicator.jsx:30` currently reads `const { label, color, icon: Icon, iconColor } = config[chance] || config.medium;`. Any unrecognised `chance` therefore renders a confident "Medium Chance".

  Replace the `|| config.medium` fallback with an explicit lookup that treats only the three real verdicts as scorable and resolves everything else — including `undefined`, a typo, or a stale caller — to the `unknown` config. Keep the `cn()` wrapper and the `size` prop handling exactly as they are.

- [ ] **Step 4: Render the reason accessibly**

  Accept `reason` and, when present, render it in a `<span className="sr-only">` sibling of the label. The state must not be conveyed by colour or icon alone — see Review Focus #5. When `reason` is absent, render no `sr-only` node at all rather than an empty one.

- [ ] **Step 5: Verify**

  Run: `npm run lint` → expect 0 errors (existing warnings unchanged).
  Run: `npm run typecheck` → expect clean.
  Run: `node -e "import('./src/lib/i18n/translations.js').then(m=>{const s=m.translations;const miss=['en','ru','uz'].filter(k=>!s[k].chance.unknown);if(miss.length)throw new Error('missing chance.unknown in: '+miss)})"` → expect no output, exit 0.

  This assertion is weak on its own and must not be trusted alone: because `ru`/`uz` are `deepMerge(en, …)`, `s.ru.chance.unknown` resolves to the English string whenever the `ru` block was never edited. To prove all three were edited, also confirm the values differ from `s.en.chance.unknown`:

  Run: `node -e "import('./src/lib/i18n/translations.js').then(m=>{const s=m.translations;const en=s.en.chance.unknown;for(const k of ['ru','uz'])if(s[k].chance.unknown===en)throw new Error(k+' not translated - fell back to English')})"` → expect no output, exit 0.

- [ ] **Step 6: Commit**

  ```bash
  git add src/components/ui/ChanceIndicator.jsx src/lib/i18n/translations.js
  git commit -m "feat(ui): add unknown state to ChanceIndicator with i18n keys"
  ```

---

### Task 3: Migrate the three duplicated `calculateChance` copies

**Files:**
- Modify: `src/components/search/UniversityCard.jsx:13-72`
- Modify: `src/components/search/UniversityDetailModal.jsx` (~line 28)
- Modify: `src/pages/Profile.jsx` (~line 128)

**Interfaces:**
- Consumes: `calculateChance`, `describeMissingChanceData`, `VERDICT` from `src/lib/matching.js`; `VERDICT.UNKNOWN` handling from the updated `ChanceIndicator`.
- Produces: no new exports. All three call sites keep rendering `<ChanceIndicator chance={...} />`; each now also passes `reason={describeMissingChanceData(university)?.note}`.

**Depends on:** Tasks 1 and 2.

Ship these three together. Migrating one copy while two still run the old logic leaves the bug live on the other pages, and `git revert` of a partial migration is harder than reverting all three.

- [ ] **Step 1: Replace the local function in `UniversityCard.jsx`**

  Delete the local `calculateChance` (lines 13-72) entirely and import the shared one:
  ```js
  import { calculateChance, describeMissingChanceData } from '@/lib/matching'
  ```
  The existing call site at line 76 (`const chance = calculateChance(university, userGpa, userIelts, userTopik)`) needs no change. Leave `showHolisticGpaNote` at line 83 and the `hasTuitionMin`/`hasTuitionMax` guards at lines 81-82 alone — the 2026-07-26 display work is correct and must survive this refactor.

- [ ] **Step 2: Pass the reason to the indicator in `UniversityCard.jsx`**

  Add `reason={describeMissingChanceData(university)?.note}` to the existing `<ChanceIndicator>` in that file.

- [ ] **Step 3: Repeat both steps in `UniversityDetailModal.jsx`**

  Delete its local copy, import the shared module, add the `reason` prop. Do **not** yet touch the `toLocaleString()`/`toFixed()` calls at lines 283 and 298 — Task 4 owns those, so a crash fix can be reverted independently of this migration.

- [ ] **Step 4: Repeat both steps in `Profile.jsx`**

  Delete its local copy, import the shared module, add the `reason` prop. Leave the correct `?.` usage at line 313 untouched.

- [ ] **Step 5: Verify no stale copy survives**

  Run: `rg -n "function calculateChance" src/` → expect exactly one hit, in `src/lib/matching.js`.
  Run: `rg -n "userGpa - |profile.gpa - " src/` → expect no hits outside `src/lib/matching.js`.
  Run: `npm run lint` → 0 errors.
  Run: `npm run typecheck` → clean.

- [ ] **Step 6: Commit**

  ```bash
  git add src/components/search/UniversityCard.jsx src/components/search/UniversityDetailModal.jsx src/pages/Profile.jsx
  git commit -m "refactor(matching): use shared null-safe calculateChance in card, modal, profile"
  ```

---

### Task 4: Eliminate the null render crashes

**Files:**
- Modify: `src/components/search/UniversityDetailModal.jsx:283,298`
- Modify: `src/components/comparison/ComparisonModal.jsx:283,298,357`
- Modify: `src/pages/Recommendations.jsx:238`

**Interfaces:**
- Consumes: `calculateChance`, `VERDICT` from `src/lib/matching.js`.
- Produces: no new exports.

**Depends on:** Task 3 (the modal files are already being edited there).

These are white-screen bugs and are independently shippable — if the scoring work stalls, ship this alone.

- [ ] **Step 1: Guard the tuition render in `Recommendations.jsx:238`**

  `university.tuition_min.toLocaleString()` throws for every NULL-tuition row. Note the existing `=== 0` guard immediately above it does **not** catch `null`. Render the literal string `Not published` when `tuition_min` is null or undefined, reusing whatever translation key the file already uses for that phrase — do not introduce a second, differently-worded variant.

- [ ] **Step 2: Guard `UniversityDetailModal.jsx:283` and `:298`**

  Same treatment for `uni.tuition_min.toLocaleString()` and `uni.min_gpa.toFixed(1)`. For `min_gpa`, show `Not published` rather than a regional estimate — `DECISIONS.md:6` permits estimates for display, but `Not published` is unambiguous and this file already has that pattern.

- [ ] **Step 3: Guard `ComparisonModal.jsx:283` and `:298`**

  Same two guards. This is Review Focus #1: selecting any US university currently throws a `TypeError` and white-screens the page.

- [ ] **Step 4: Fix the comparison chance column at `ComparisonModal.jsx:357`**

  It runs its own score arithmetic. Switch it to the shared `calculateChance` so the compare tray cannot disagree with the cards it was opened from.

- [ ] **Step 5: Verify**

  Run: `npm run lint` → 0 errors. Run: `npm run typecheck` → clean. Run: `npm run build` → succeeds.
  Browser: open `/search`, select a US university (e.g. any College Scorecard row), add two to compare, open the compare tray. Expect the modal to render with `Not published` in place of tuition and GPA — not a blank page.

- [ ] **Step 6: Commit**

  ```bash
  git add src/components/search/UniversityDetailModal.jsx src/components/comparison/ComparisonModal.jsx src/pages/Recommendations.jsx
  git commit -m "fix: guard null tuition_min and min_gpa renders that crashed the modal"
  ```

---

### Task 5: Null-safe `calculateMatchScore` and corrected badges

**Files:**
- Modify: `src/pages/Recommendations.jsx:24-130` (`calculateMatchScore`), `:272`, `:292` (badges)

**Interfaces:**
- Consumes: `hasGpaData`, `describeMissingChanceData` from `src/lib/matching.js`.
- Produces: `calculateMatchScore(university, profile, countryWeights = {})` → `number | null`. Returning `null` for "cannot be scored honestly" is what lets the caller render the same `unknown` state as the cards instead of a misleading percentage.

**Depends on:** Task 1.

- [ ] **Step 1: Make the GPA term NULL-aware**

  Line 31 (`const gpaDiff = profile.gpa - university.min_gpa`) inflates to full marks when `min_gpa` is NULL, identical to the card bug. Guard it with `hasGpaData(university)`.

- [ ] **Step 2: Make the budget term NULL-aware**

  Line 61 `(university.tuition_min || 0) + (university.living_cost_estimate || 8000)` invents both operands. Note `normalizeUniversity` (`apiClient.js:92`) has already coerced `living_cost_estimate` to `8000`, so the `|| 8000` here is a *second* fabrication on top of the first. A NULL `tuition_min` must not earn the maximum 18 points for looking free.

- [ ] **Step 3: Return `null` instead of a misleading percentage**

  When `min_gpa` is NULL, return `null` rather than a number. At the call site, render the `unknown` `ChanceIndicator` in place of the percentage. This is the honest outcome and is the reason `calculateMatchScore`'s return type widens.

- [ ] **Step 4: Fix the two badge conditions**

  `profile.gpa >= null` and `null >= 15` are both `true`, so "✓ GPA fit" (line ~272) and "✓ diverse campus" (line ~292) render for rows with no data. Both must require real data via `hasGpaData(university)` and a non-null `international_students_percent`.

- [ ] **Step 5: Fix the >100% result**

  `maxScore` accumulates to 110 (25+20+18+20+10+7+5+5) while lines 119-127 add up to 10 bonus points on top, so `Math.round((score / maxScore) * 100)` at line 129 can return a value above 100. Clamp to 100. Report this in the PR description as a pre-existing bug found in passing, not as part of the null-safety work.

- [ ] **Step 6: Verify**

  Run: `npm run lint` → 0 errors. Run: `npm run typecheck` → clean.
  Browser: `/recommendations` with a completed profile. Expect US rows to show `Not enough data` instead of a percentage, and expect no row to display a badge asserting a GPA or diversity fit it has no data for. Confirm no percentage renders above 100%.

- [ ] **Step 7: Commit**

  ```bash
  git add src/pages/Recommendations.jsx
  git commit -m "fix(matching): stop calculateMatchScore awarding points for null data"
  ```

---

### Task 6: Fix the default sort that ranks unknown data as most reachable

**Files:**
- Modify: `src/pages/Search.jsx:101,108`

**Interfaces:**
- Consumes: `hasGpaData` from `src/lib/matching.js`.
- Produces: no new exports.

**Depends on:** Task 1.

- [ ] **Step 1: Stop sorting NULL `min_gpa` to the front**

  The default sort comparator treats NULL as `0`, so every no-data university sorts as the most reachable. Push rows where `!hasGpaData(university)` to the end of the comparison instead of coercing their `min_gpa` to `0`.

- [ ] **Step 2: Verify**

  Run: `npm run lint` → 0 errors. Run: `npm run typecheck` → clean.
  Browser: `/search` with the default sort and no filters. Expect rows with published cutoffs to sort ahead of rows without.

- [ ] **Step 3: Commit**

  ```bash
  git add src/pages/Search.jsx
  git commit -m "fix(search): sort universities without a published gpa cutoff last"
  ```

---

## Verification strategy

**There is no test framework in this repo.** No vitest, no jest, no `test` script in `package.json`, and zero `*.test.*` / `*.spec.*` files. This plan does not add one — introducing a runner is a dependency decision that belongs to the user, not to a bug fix.

Coverage therefore comes from three places:

1. **`node scripts/check-matching.mjs`** — 11 assertions pinning the null-safety contract for the pure module. This is the only automated guard, and it matters more than usual here because `eslint.config.js:9-14` and `jsconfig.json:19-20` both exclude `src/lib/**`.
2. **The existing project commands** — `npm run lint` (eslint, `--quiet`), `npm run typecheck` (`tsc -p ./jsconfig.json`), `npm run build` (`vite build`). All three must pass before any commit; all three are currently green, so any new failure is yours.
3. **Manual browser pass** — see below.

### Browser checklist (run against `npm run dev`)

- `/search` → a College Scorecard US row shows `Not enough data`, not `High Chance`. Switch the language selector to ru and uz; the badge must read `Недостаточно данных` / `Maʼlumot yetarli emas`, never a raw key.
- A US row added to the compare tray and the tray opened → the modal renders. Tuition and GPA read `Not published`. **This is the regression that white-screens today.**
- A Korean row (the 24 researched ones) still shows a real `High`/`Medium`/`Low` verdict — Korean/TOPIK scoring must not have been collaterally broken.
- A row that does have a published `min_gpa` still shows a real verdict — confirm the fix did not over-correct into showing `Not enough data` everywhere.
- `/recommendations` with a completed profile → US rows show `Not enough data`; no row shows a percentage above 100; no row shows "✓ GPA fit" or "✓ diverse campus" without the underlying data.
- Keyboard-only pass over a card's `Not enough data` badge: the state and its reason are announced, not conveyed by colour alone.

### Suggested follow-up, not in this plan

Adding Vitest + `@testing-library/react` would make `matching.js` and `ChanceIndicator` regression-safe against future edits. That is a dependency addition and a scope decision — recommend raising it separately.

---

## Explicitly deferred

Each of these is a real defect. None belongs in this plan because each is an independent subsystem, independently shippable, and mixing them would exceed the batch discipline in `WORKFLOW.md`.

| Item | Verdict | Reason |
|---|---|---|
| `apiClient.js:134` — `list()` defaults to `limit = 1000` against a ~1968-row table with no `order` | **Defer — but treat as the next plan, and treat it as high severity.** Roughly half the database is invisible, and which half is arbitrary. `Profile.jsx:41-48` resolves saved universities against that same truncated list, so saved universities silently vanish. `AdminDataQuality.jsx:49` already passes `5000`, which proves the rows are fetchable — the default is the bug. | Orthogonal to scoring; changing the fetch limit will visibly reorder Search and Recommendations and deserves its own review. |
| `FilterPanel.jsx:32,34` + `Search.jsx:87-88` — `value="all"` is treated as a literal country | **Defer — smallest fix in this review.** Zero results, and `Search.jsx:70` persists it to `localStorage`, so the page stays broken across reloads until Reset. Maps `"all"` back to `''`. | Two-line fix, but needs its own verification pass because the broken state is cached in the browser. |
| `AdminDataQuality.jsx:147-237` — "Scan & Fix" writes normalized fabrications back to the live table | **Defer — URGENT, and the only irreversible item here.** `apiClient.js:92,96,97-99` turns NULL into `8000` / `false` / `{}`, and the page PUTs those back. `{}` is truthy, so `UniversityDetailModal.jsx:334,416` then render the campus-life and support cards with every checkmark greyed out instead of the honest empty state — permanently, after one scan. `updateDeadline` (`:84-98`) splits a date string without validating parts, so `"2025"` becomes `"2026-undefined-undefined"`. The corruption regex `/[^\x00-\x7F]{10,}/` (`:56`) flags the 24 Korean universities' own-language text. It also writes a `data_quality_flags` column not present in `entities/University`, which would abort the loop mid-way with earlier rows already committed. | Directly violates `DECISIONS.md:17`. Needs its own plan: a dry-run diff, an explicit confirm, server-side gating, and an RLS check. **Actionable now: do not press "Scan & Fix" against the live Supabase project until this is fixed — the writes are not reversible without a backup.** |
| `apiClient.js:193-199` — `...user.user_metadata` spreads *after* authoritative `id`/`email`, so `role` is self-assignable via `supabase.auth.updateUser` | **Defer.** This makes the `user.role !== 'admin'` checks cosmetic, and `handleRemoveDuplicates` (`:263-368`) deletes rows while grouping by name only, ignoring country/city. But whether that is exploitable depends entirely on RLS policies on `universities`, which are not asserted anywhere in this repo and which I cannot verify from the client code. | Fixing the spread order is a one-line change, but the security decision depends on the actual RLS posture, which needs a Supabase dashboard check. Do not half-fix this on code review alone. |

### One-line backlog (not planned here)

Missing i18n keys `search.firstVisitHint` / `filters.topikHint`; `'United States'` vs `'USA'` string mismatch between `UniversityCard.jsx:83` / `UniversityDetailModal.jsx:99` and `FilterPanel.jsx:10`; `OnboardingTour.jsx:85` bypassing `handleClose` so `hasSeenOnboarding` never persists on ESC; `src/lib/**` excluded from lint and typecheck; `react-hooks/exhaustive-deps` not enabled; duplicated `src/utils/index.js` + `index.ts`; `ensureUserProfile` duplicated verbatim in `AuthContext.jsx:15-48` and `Login.jsx:66-99` (non-atomic check-then-insert against a `profiles` table not in the documented schema); unused `countryImages.jsx` on the retired `source.unsplash.com/featured` endpoint; `US_GENERIC_SUPPORT_NOTE` exported but never imported despite `PROJECT_CONTEXT.md:70` claiming it is wired in; `"€null/year"` interpolated into the LLM prompt at `ComparisonModal.jsx:43-44,114-115`; unvalidated AI response shape at `apiClient.js:230`; hardcoded "400+ universities" / "85% find a match" / named testimonials on `Home.jsx:21-29`; 11 unused dependencies; single 931 KB bundle with no code splitting.