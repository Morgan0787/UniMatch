# UniMatch context pack

This directory is the stable, low-cost context layer for OpenCode sessions. It exists so a Planner can understand the project quickly without rescanning the repository or rereading long chat history.

## Read order

1. `PROJECT.md` — compact project identity, stack, boundaries, and current priorities.
2. `DECISIONS.md` — non-negotiable product and data rules plus known schema gotchas.
3. `WORKFLOW.md` — how Planner, Coder, Reviewer, Skills, and verification should cooperate.
4. Read the root `PROJECT_CONTEXT.md` only when the task touches data imports, Supabase schema, or a detail not covered above.

## Maintenance rules

- Update these files when a stable architectural or product fact changes.
- Do not put transient chat discussion, provider quotas, secrets, or generated output here.
- Do not copy `.env` values into this context.
- Prefer short, factual notes with dates for changes.
- The root `PROJECT_CONTEXT.md` and `README.md` remain source documents; this pack is an agent-oriented index, not a replacement.
