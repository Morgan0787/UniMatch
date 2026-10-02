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

## Existing source of truth

For fuller history and import details, read the root `PROJECT_CONTEXT.md`. Do not rewrite it during normal feature work.
