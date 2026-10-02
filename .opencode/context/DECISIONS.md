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

- `npm run lint` and `npm run typecheck` do **not** cover `src/lib/**`, `src/components/ui/**`, `src/api`, or `App.jsx`/`main.jsx`. Excludes live in `eslint.config.js:14` (`ignores`) and `jsconfig.json:20` (`exclude`). Passing lint/typecheck is therefore **not** evidence about a file in those paths — lint or typecheck the file directly, and do not assume a green run checked it.
- `react-hooks/exhaustive-deps` is not enabled; only `rules-of-hooks` is registered.
- There is no test framework (no vitest/jest, no `npm test`, no `*.test.*`). `scripts/check-matching.mjs` is a plain-Node assertion script and must be run manually via `node scripts/check-matching.mjs` — nothing invokes it automatically.

## Existing source of truth

For fuller history and import details, read the root `PROJECT_CONTEXT.md`. Do not rewrite it during normal feature work.
