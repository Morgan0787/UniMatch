# UniMatch — Project Context

This file preserves detailed import provenance and project history. Read relevant sections when a task needs import/schema background; use `docs/agents/context/README.md` to choose current context instead of attaching this entire file to every chat.

## How to read and maintain this history (2026-10-13)

Current product scope and labelled priorities live in `docs/agents/context/PROJECT.md`; active data/product guardrails live in `docs/agents/context/DECISIONS.md`. Setup and usage live in root `README.md`. The undated sections below are inherited historical snapshots, not newly verified statements about the live database, deployment, branch state, or backlog. Where they conflict with confirmed current shared context, treat the historical claim as superseded and link to its replacement after verification.

For import/schema changes, add a dated record with source/evidence, implemented outcome, verification results, and planned or unresolved work separately. Preserve prior records and explicitly mark superseded claims. Follow `docs/agents/context/MAINTENANCE.md`. This documentation change does not reverify the historical counts or feature claims below.

## What it is
UniMatch matches Central Asian (primarily Uzbek) students to universities in Europe, US, and Asia based on GPA/IELTS/TOPIK, ranked by realistic admission chance rather than popularity. Built by a solo developer as both a portfolio piece (Babson College application) and a potential business.

## Stack
- Frontend: Vite + React + Tailwind, shadcn/ui
- Backend: Supabase (Postgres + Auth), migrated off Base44
- Auth: Supabase Auth with Google OAuth + email, working as of last check
- Deploy: Vercel

## Database state (Supabase project: UniMatch4.0)
- `universities` table exists, schema matches frontend code exactly (see Known Gotchas below)
- ~1944 US universities imported via College Scorecard API (official govt data, no GPA/IELTS — those fields intentionally null for US records)
- ~24 South Korean universities imported via Gemini-assisted research batches (verified/source_url tracked)
- ~918 universities across Europe/Asia still NOT imported (batched into 39 CSV files of 25 each, original list sourced from a prior partner's Base44 database that turned out to be mostly synthetic/fabricated data — only name/country/city/website from that source were trustworthy, everything else was regenerated)
- `student_profiles` and `user_feedback` tables created, RLS enabled

## Known gotchas (don't rediscover these)
- Column `"topikLevel"` (camelCase, quoted, TEXT type, values like `"TOPIK 4"`) — NOT `topik_level` snake_case integer. Code in 7 files expects this exact format.
- `user_feedback` sorts by literal column `created_date`, not `created_at`.
- `tuition_currency_note` is NOT a real column in this Supabase project — don't include it when preparing CSVs.
- Korean-university tuition figures often come in KRW (millions) not USD — check magnitude before import.

## Product decisions made
- **Auth gating**: Profile and Recommendations require login (redirect to /Login). Search and Home stay open to everyone.
- **Missing GPA/IELTS/TOPIK**: shown via `EstimatedField` component — a region-based ballpark range labeled "estimate", never fed into the actual chance-matching calculation. Never invent a specific number for a specific university.
- **Missing tuition/acceptance_rate/degree_levels/notable_programs**: no synthetic estimate exists for these (too much variance between schools) — show "Not published" instead.
- **Data sourcing principle**: never accept LLM-generated numbers as fact without a `source_url` and explicit `verified` flag. This whole pipeline exists because a prior partner's data (GPA/IELTS/scholarships) turned out to be AI-fabricated and nearly shipped as real.
- Do not scrape/reuse data from competitor sites (e.g. Studyportals) — database-rights and ToS risk, plus it undermines the actual differentiator (accuracy).

## Open TODOs
- 37 of 39 Gemini-research batches still need processing + import
- `codex/fix-lint-errors-minimally` branch on GitHub is stale/superseded — don't merge without review
- `npm run lint:fix` would clean ~19 unused-import warnings
- User acquisition plan (IELTS/tutoring centers, Telegram channels, personal SAT-prep network) designed but not yet executed — this is the actual current bottleneck, not more infrastructure

## Historical working agreements (use AGENTS.md for current routing)
- Prefer official/government data sources over LLM web-research where they exist (e.g. College Scorecard for US) — more accurate, no rate limits, no hallucination risk.
- When an AI can't verify a fact, it should say so explicitly (empty field / "not verified"), not fill in a plausible-sounding number.
- Long chat threads get expensive to keep running — start a fresh chat per major task phase, using this file to re-establish context.



## Bug fixed 2026-07-26
apiClient.js normalizeUniversity() was coercing null min_gpa/tuition_min to 0 via asNumber(x, 0) fallback.
This made ALL 1944 US universities show "GPA 0.0" and null-tuition ones show "Free" incorrectly.
Fix: use asNullableNumber() for min_gpa, tuition_min, tuition_max instead — preserves null so
EstimatedField/"Not published" fallback logic works as designed.

## Known data gap (not a bug)
All 1944 US university rows (College Scorecard import) have NULL campus_life, international_support,
visa_info, min_gpa, degree_levels. Cards look "empty" because there's genuinely no data — this is
expected per the "never invent data" rule, not something to fix in code. Real fix = data enrichment
(same Gemini-research process used for the 24 Korean universities), applied to US rows too, or
prioritize importing the 918 pending Europe/Asia records which have richer data.


## Fixed 2026-07-26
- apiClient.js: min_gpa/tuition_min/tuition_max now use asNullableNumber (were falling back to 0, causing fake "Free" tuition and fake "0.0 GPA" on all US universities)
- UniversityCard.jsx + UniversityDetailModal.jsx: tuition now shows min–max range when both values exist
- Root data gap unchanged: all 1944 US rows still lack campus_life/visa_info/international_support/min_gpa — cards will keep showing "Not published" there until real data is imported (see earlier gap note)


## Added 2026-07-26 — generic US fallback content
New file src/lib/usGenericInfo.js: US_GENERIC_VISA_INFO, US_GPA_HOLISTIC_NOTE, US_GENERIC_SUPPORT_NOTE.
These are federal-law/well-documented general facts (F-1 visa rules, holistic admissions norm),
NOT fabricated per-university data. Wired into UniversityCard.jsx and UniversityDetailModal.jsx:
- min_gpa null + country=="United States" → show "Holistic admissions" note instead of blank/estimate
- visa_info null + country=="United States" → show generic F-1 visa card, clearly labeled
  "General info — not specific to this university"
Per-university verified data always overrides these when present.

## Next up
Point-enrich top 200 US universities (by popularity/affordability) via Gemini research batches,
same process used for the 24 Korean universities — real min_gpa, campus_life, notable_programs,
international_support per school. Free tier Gemini, manual batches of ~25.
