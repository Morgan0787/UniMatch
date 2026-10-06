# UniMatch — agent workflow

## Planner

Use the `planner` agent with `kiro/claude-sonnet-4.5` first through the OmniRoute `planner` combo. Load only relevant Skills, normally no more than two at once. Read this context pack before source files. Produce a compact plan divided into dependency-ordered batches of 1–3 files, with acceptance criteria, risks, and the cheapest first smoke check. Do not edit files or rescan the repository.

## Coder

Use only the current approved batch and relevant Skills. Inspect named files plus the minimum direct dependencies, preserve unrelated work, write incrementally, and run a smoke check immediately after the batch. For UI, cover loading, error, disabled, focus, mobile, success, and reduced-motion states where relevant.

## Reviewer

Review the diff first, then verify in stages: build/typecheck, focused behavior, and only then browser/accessibility/security checks relevant to the batch. For UI, use `playwright`, `web-accessibility-review`, and screenshot evidence when applicable. For backend/auth/input/secrets, use `backend-engineering` and `security-best-practices` as relevant. Return PASS or FAIL with concrete evidence and exact remediation; do not edit.

## Repair loop

After every batch, maintain `.opencode/session/<task-slug>.md` with completed files, remaining files, verified contracts, commands/results, failed attempts, and next action. Pass only failed criteria, affected files, failed command, and next action back to the Coder. After two failures on the same batch, recover directly instead of retrying the same subagent. Keep ordinary tasks to at most two repair cycles; do not re-plan unchanged work or rescan the entire repository.

## Skills

Skills are available through OpenCode's native `skill` tool. Agents should load them when the task matches, not merely mention them in prose. Do not ask the user to approve trusted local Skills individually. If a Skill is not relevant, do not load it just to enlarge a checklist.
