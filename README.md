# UniMatch

![UniMatch — matching engine overview](hero.svg)

Find universities you can actually get into — not just the ones you dream about. UniMatch compares a student's GPA, IELTS, or TOPIK score against real admission requirements across Europe, the US, and Asia, and ranks results by honest admission chance instead of popularity.

## Why it's different

Most university-search sites are directories: browse, filter, hope. UniMatch inverts that — every listed university carries a transparent match percentage computed from the same numbers admissions officers actually look at (GPA, language scores, acceptance rate), so a student sees realistic reach/target/safety options instead of a wall of logos.

## How it works

- **Frontend** — Vite + React + Tailwind, component library via shadcn/ui
- **Backend** — Supabase (Postgres + Auth), migrated off the original Base44 platform
- **Core pages** — `Home`, `Search`, `Recommendations`, `Profile`, `Login`, plus internal tools (`AdminDataQuality`, `AdminFeedback`, `EssayChecker`)
- **Presentation** — actual Sites version-7 landing and shared visual theme, including the interactive particle scene. [Source and QA details](docs/qa/sites-design-port.md).
- **Scroll presentation** — MDX-inspired post-hero editorial transitions, reversible media/scene motion and a light cream palette, with a static reduced-motion mode. [Browser study and comparison](docs/qa/mdx-motion.md).
- **Hero story** — generated relief Earth, subject constellations and a university route controlled by scroll. A loading screen precedes the first frame; the first scroll hides the header/copy and expands the scene. [Implementation, QA and performance limits](docs/qa/hero-particle-story.md).

## Data quality

University records (GPA/IELTS thresholds, deadlines, tuition, scholarships) are collected from official admissions pages rather than generated. Each record is expected to carry a `source_url` and a `verified` flag so the app — and the built-in `AdminDataQuality` tool — can distinguish confirmed data from fields still awaiting verification.

## Getting started

```bash
npm install
npm run dev
```

### Required env vars

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Optional env vars

- `VITE_LOGIN_URL` (custom login route)
- `VITE_LLM_FUNCTION_NAME` (default: `invoke-llm`)
- `VITE_TABLE_UNIVERSITY` (default: `universities`)
- `VITE_TABLE_STUDENT_PROFILE` (default: `student_profiles`)
- `VITE_TABLE_USER_FEEDBACK` (default: `user_feedback`)

## Status

Actively developed, pre-launch solo project. Expect incomplete data coverage and rough edges outside the core search/match flow.

Action status messages appear as in-app notifications, including success confirmations and form errors.

## Agent-assisted development

Historical visual QA screenshots are retained in the [370517c Home archive](docs/qa/archive/370517c-home/README.md), with hashes and restoration instructions. [output/playwright](output/playwright/README.md) remains available for future temporary QA. The [hero previews](assets/hero/unimatch/README.md#files) retain draft/final renders and browser evidence; keep them until their history and baseline value have been reviewed.

Inactive legacy CSS and image-selection source are preserved in the [source archive](docs/archive/source/2026-10-13/README.md), with original paths, hashes and restoration instructions.

Start with [AGENTS.md](AGENTS.md) for task-specific guidance. [Context routing](docs/agents/context/README.md) identifies which documents to read; [documentation maintenance](docs/agents/context/MAINTENANCE.md) defines when to update them. For the Codex/OpenCode profile switch, see the [agent setup guide](docs/agents/README.md).
