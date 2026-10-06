# UniMatch agent entrypoint

Before planning or editing, read `.opencode/context/README.md` and the context files it points to. Also respect the existing `PROJECT_CONTEXT.md` and `README.md`; they remain authoritative and must not be rewritten as part of routine tasks.

Use the context pack to avoid rediscovering the stack, product boundaries, data-quality rules, known schema gotchas, and current priorities. Inspect source files only after identifying the relevant area from the context.

Workflow expectations:

- Planner: load only the Skills relevant to the request and produce a compact, batch-sized plan with acceptance criteria.
- Coder: implement one dependency-ordered batch of no more than three files, write incrementally, and run a smoke check.
- Reviewer: verify the current batch in stages; do not create a large test suite and run every audit at once.
- Orchestrator: maintain `.opencode/session/<task-slug>.md` checkpoints and resume from them instead of restarting a feature.
- Never invent university data or silently broaden scope.
