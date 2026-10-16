# UniMatch — decisions and gotchas

## Product rules

- Profile and Recommendations require login; Home and Search stay public.
- Missing GPA/IELTS/TOPIK may use clearly labelled regional estimates through `EstimatedField`, never a fabricated school-specific number.
- Missing tuition, acceptance rate, degree levels, or notable programs must display `Not published` unless verified data exists.
- Never treat an LLM-generated number as fact without `source_url` and `verified`.
- Do not scrape or reuse competitor databases such as Studyportals.

## Schema gotchas

- The column is quoted camelCase `topikLevel`, text values such as `TOPIK 4`; it is not `topik_level`.
- `user_feedback` sorts by `created_date`, not `created_at`.
- `tuition_currency_note` is not a real column and must not be imported.
- Korean tuition is often in KRW millions; check magnitude before treating it as USD.
- Null US data is an expected data gap, not permission to fill in plausible values.

## Tooling coverage gotchas

- ESLint applies **no rules at all** to `src/lib/**` and `src/components/ui/**`, and its single config object's `files` globs (`src/components/**` minus the `ignores` entry, `src/pages/**`, `src/Layout.jsx`) never match them or `App.jsx`/`main.jsx`. Verified: `eslint --print-config src/components/ui/ChanceIndicator.jsx` prints `undefined`, and `--print-config src/lib/matching.js` prints a config with `"rules": {}` — parsed with zero rules applied. The `eslint.config.js:14` `src/lib/**` ignores entry is inert, because no `files` glob matches those paths in the first place.
- TypeScript **does** cover `src/lib/**` and `src/components/ui/**`. `jsconfig.json:20`'s `exclude` only filters the `include` roots; `checkJs` then pulls the excluded files into the program through imports. Verified: `tsc -p ./jsconfig.json --listFiles` lists `src/lib/matching.js`, `src/components/ui/ChanceIndicator.jsx` and `src/components/ui/EstimatedField.jsx`, and a bogus method call injected into each produced a real `TS2339`/`TS2304`. `App.jsx`, `main.jsx` and the `src/api` path in that exclude are genuinely uncovered — `src/api` does not exist.
- So: a green `npm run typecheck` *is* evidence about `src/lib/**` and `src/components/ui/**`; a green `npm run lint` is **not**. Both cover `src/components/search/**`, `src/components/comparison/**` and `src/pages/**`.
- `react-hooks/exhaustive-deps` is not enabled; only `rules-of-hooks` is registered.
- There is no test framework (no vitest/jest, no `npm test`, no `*.test.*`). `scripts/check-matching.mjs` is a plain-Node assertion script; run it with `npm run check:matching` (or `node scripts/check-matching.mjs`). It is wired to a package script but nothing runs it automatically in CI, so run it by hand after touching `src/lib/matching.js`.
- Catalog ordering/filtering/pagination has a separate plain-Node check: `node scripts/check-catalog.mjs`. Run it after changing `src/lib/catalogResults.js`; it checks full-collection filtering, stable ordering, complete pages, null preservation and input immutability.
- Hero geometry and reversible overlay math have a separate plain-Node check: `node scripts/check-hero-scene.mjs`. It does not measure GPU pixels, scroll integration or display FPS; use the [hero browser QA record](../../qa/hero-particle-story.md) for those limits.
- Lockfile reproducibility, verified 2026-10-13 on Windows with Node 24.14.0/npm 11.18.0: the pre-existing nested conflict in `package-lock.json` was repaired, preserving all 661 earlier records, and the missing `ws@8.18.3` record was restored from Git `3c68feb` (also matching the installed version). JSON has no duplicate keys, root dependency specifications match `package.json`, and required dependency/peer references and version ranges resolve. An isolated `npm ci --ignore-scripts --no-audit --no-fund` installed 610 packages at their exact locked versions without changing the lockfile; no-emit typecheck and production build passed using that fresh installation. Build used dummy Supabase settings and disabled environment-file loading. Lifecycle scripts and other platforms were not verified; dependency reduction was not performed. The earlier invalid-lock limitation is superseded by this result.

## Routing utility entrypoints

- `src/utils/createPageUrl.js` is the canonical implementation, typed with JSDoc `@param {string}` and `@returns {string}`. Both `src/utils/index.js` and `src/utils/index.ts` explicitly re-export `./createPageUrl.js`; neither entrypoint is removed.
- Verified on 2026-10-13: Vite resolves `@/utils` to `index.js`, while TypeScript resolves it to `index.ts`. Both expose `(pageName: string): string` and the same runtime function through Vite; a direct ordinary-Node ESM import of `index.js` also works. Keep the shared implementation independent of UI/auth code and preserve the existing behavior: prepend `/` and replace each ASCII space with `-`.
- Earlier TS-based re-export approaches were superseded: an explicit `.ts` import produced TS5097 when checking the JS shim, and an extensionless TS target broke direct Node imports. The explicit `.js` target preserves Node compatibility and JSDoc-derived declarations without compiler/configuration changes.

## Deferred dependency candidates

No dependencies were removed during the 2026-10-13 cleanup. After the 2026-10-15
Sites transfer activated Three.js, these 15 packages
remain for a separate decision: `@hello-pangea/dnd`, `@hookform/resolvers`,
`@radix-ui/react-toast`, `@stripe/react-stripe-js`, `@stripe/stripe-js`,
`canvas-confetti`, `html2canvas`, `jspdf`, `lodash`, `moment`, `react-hot-toast`,
`react-leaflet`, `react-markdown`, `react-quill`, and `zod`.

Repository searches found no direct module imports/requires/dynamic package
strings for them in the examined source, scripts, asset tooling and root configs.
This does not exclude external/manual consumers, computed module names or planned
features. Retained UI inventory is intentional: `src/components/ui/chart.jsx`
imports Recharts, whose installed metadata declares `lodash` as a dependency;
therefore lodash has a real retained consumer and is not a no-consumer package.
Stripe's React wrapper peers Stripe JS; jsPDF optionally depends on html2canvas;
react-quill depends on quilljs with nested lodash 2.x; resolvers peers React Hook
Form, though the retained form component does not use a resolver. Check these
relationships and the intended features before any package reduction.

## Supabase auth callbacks

Keep `onAuthStateChange` synchronous and perform profile database calls outside
its callback. Browser QA on 2026-10-15 reproduced a session-lock deadlock on an
authenticated reload; moving profile initialization into a React effect restored
Profile loading. Do not fix this by weakening protected-route checks or bypassing
Supabase session validation. See the [transfer QA record](../../qa/sites-design-port.md).

## Landing modal scrolling

Home motion policy (user-selected 2026-10-17): always run the scroll story and
editorial motion regardless of `prefers-reduced-motion`. Keep JS and CSS behavior
consistent; do not ship a development-only preference override as the fix.
See the [production motion check](../../qa/production-motion.md).

Shared `DialogContent` must retain `data-lenis-prevent`: Home pauses Lenis while
a modal is open, and its stopped handler otherwise cancels native wheel events
inside the portaled university dialog. Keep Radix's background scroll lock.
See the [release regression check](../../qa/public-release.md).

## Existing source of truth

For detailed import provenance or schema history, read the relevant sections of root `PROJECT_CONTEXT.md`. Maintain active constraints here and add dated historical updates there according to `docs/agents/context/MAINTENANCE.md`. Existing tooling evidence is inherited; recheck it when changing the tooling or relying on a disputed coverage claim.
