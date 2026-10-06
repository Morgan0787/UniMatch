# UniMatch — stable project brief

## Product

UniMatch helps Central Asian students find universities in Europe, the US, and Asia by ranking realistic admission chances from GPA, IELTS, TOPIK, and verified university data. It is a Vite/React portfolio and potential product, not the separate dating-site test project.

## Stack and deployment

- Frontend: Vite, React, Tailwind CSS, shadcn/ui.
- Backend: Supabase Postgres and Supabase Auth; migrated from Base44.
- Authentication: Google OAuth and email through Supabase Auth.
- Deployment: Vercel.
- Main areas: Home, Search, Recommendations, Profile, Login, and admin data-quality/feedback tools.

## Current data state

- Universities are matched from database fields, not invented by the UI.
- About 1,944 US records came from College Scorecard and intentionally have many null enrichment fields.
- About 24 South Korean records were researched and tracked with sources.
- Europe/Asia enrichment and the top-US enrichment pipeline are unfinished.
- `source_url` and an explicit `verified` flag are required for factual enrichment.

## Current priority

The product bottleneck is trustworthy data enrichment and the core search/match experience—not more infrastructure. Keep changes focused and preserve the existing data-quality rules.
