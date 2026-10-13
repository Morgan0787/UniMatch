# UniMatch context routing

Paths below are relative to the repository root. Choose documents by the task; a small isolated edit needs only the relevant rules and files. Reuse context already read in the current session unless it changed.

| Task or missing context | Read |
| --- | --- |
| Product scope, architecture, priorities, or first substantial work in an unfamiliar area | `docs/agents/context/PROJECT.md` |
| Imports, matching, university displays, auth access rules, or schema changes | Relevant sections of `docs/agents/context/DECISIONS.md` |
| Interpreting lint/typecheck coverage or choosing matching checks | Tooling coverage in `docs/agents/context/DECISIONS.md` |
| Implementation planning, delegation, or resuming multi-batch work | `docs/agents/WORKFLOW.md` |
| Detailed import history, schema background, or unresolved provenance | Relevant sections of root `PROJECT_CONTEXT.md` |
| Setup, environment configuration, or user-facing usage | Root `README.md` |
| Source, test, script, or documentation changes | `CODING_STANDARDS.md` |
| Completing a change or maintaining project documents | `docs/agents/context/MAINTENANCE.md` |
| Multi-batch, delegated, or interrupted task progress | `docs/agents/context/CHECKPOINT_TEMPLATE.md` at the active workflow's checkpoint path |
| Switching tools or changing agent settings | `docs/agents/README.md` |

Current product facts and active guardrails live in the shared context. Model routing lives in the workflow profiles. Historical imports and decisions remain in root `PROJECT_CONTEXT.md`; task progress belongs in checkpoints. Keep secrets, environment values, large generated output, and full chat transcripts out of these documents.
