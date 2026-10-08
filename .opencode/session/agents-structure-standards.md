# AGENTS structure and coding standards

Branch: `codex/agents-structure-standards`

## Objective

Prune ineffective instructions, disclose conditional detail, move coding workflow rules to `CODING_STANDARDS.md`, and create one PR.

## Context checked

- `.opencode/context/README.md`, `PROJECT.md`, `DECISIONS.md`, `WORKFLOW.md`
- Root `AGENTS.md`, `README.md`, `PROJECT_CONTEXT.md`
- `writing-for-agents` skill

## Plan and acceptance

1. Conservative pass: remove duplication and no-ops.
2. Stronger pass: make conditional pointers and move coding standards.
3. Radical pass: minimize entrypoint while retaining reliable triggers and single sources of truth.
4. Review the diff and run focused documentation smoke checks.
5. Commit, push, and open one PR.

Acceptance: `AGENTS.md` has a checkable read path; `CODING_STANDARDS.md` carries coding and verification rules; data safeguards remain reachable; `README.md` and `PROJECT_CONTEXT.md` remain untouched; no duplicate or broken pointers.

## Status

Three sequential subagent passes completed. Pass 1 pruned AGENTS.md conservatively. Pass 2 removed duplicated role bullets and added CODING_STANDARDS.md. Pass 3 reduced AGENTS.md to two triggered pointers and kept concrete edit/verification actions in CODING_STANDARDS.md.

Reviewed files: AGENTS.md, CODING_STANDARDS.md. README.md, PROJECT_CONTEXT.md and the context pack are unchanged.

Verification: `git diff --check` passed; every referenced local document exists. Documentation-only change, so no application build was run.

Next action: commit these three files, push the branch and create one PR.
