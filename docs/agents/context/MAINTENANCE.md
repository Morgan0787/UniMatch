# Documentation maintenance

## Ownership and scope

The lead owns shared documentation consistency (Sol in the Codex profile). A worker may propose or implement assigned documentation changes in owned files; the lead checks them against the final implementation. Read-only advisors give recommendations; the lead records adopted decisions. Parallel workers return evidence and proposed updates instead of editing the same shared document.

| Document | Authoritative content | Update trigger |
| --- | --- | --- |
| Root `AGENTS.md` | Short routing instructions and essential project-specific boundaries | A recurring error, changed routing, or changed boundaries |
| `docs/agents/context/PROJECT.md` | Current product scope, architecture, verified state, and explicitly labelled priorities | A confirmed stable change to product, stack, architecture, or current state |
| `docs/agents/context/DECISIONS.md` | Active data/product constraints, schema gotchas, and verification coverage | An adopted decision, schema change, or measured tooling change |
| Root `PROJECT_CONTEXT.md` | Detailed import provenance and dated historical records | A data import, schema change, or discovery that corrects historical information |
| Root `README.md` | Human-facing setup, configuration, and usage | A change to setup, commands, environment requirements, or user-visible behavior |
| Root `CODING_STANDARDS.md` | Development and verification conventions | A change to checks, tooling, or team conventions |
| Active workflow's task checkpoint | Task-specific implementation, evidence, failures, and next action | Multi-batch, delegated, or interrupted work |

## Evidence and history

State what is implemented separately from what is verified. An implementation may exist while a check is pending; never mark it verified without a relevant command/result, inspected code, or trustworthy data evidence. Keep dates and compact evidence references for consequential updates. Put proposals and planned work under a labelled planned/priority section; a plan is not an implemented feature.

Record only confirmed stable facts in current context. If a task does not recheck an inherited fact, retain its existing provenance or label it historical/unverified instead of assigning a fresh verification date. Repository code/configuration is authoritative for current implementation; current shared decisions define intended guardrails. Resolve a conflict using evidence and the user's adopted requirements, then correct the document. Keep verification gaps explicit.

For `PROJECT_CONTEXT.md`, add dated import/schema records with scope, source or evidence, outcome, and remaining gaps. Preserve earlier history. Mark a superseded claim explicitly and point to its replacement; avoid silently rewriting an old record. Existing undated sections are inherited snapshots, not proof of today's database or deployment state. Leave unrelated historical entries intact.

Maintain each fact in one authoritative document and use links elsewhere. Archive snapshots are immutable recovery material, not active instructions. Preserve adopted constraints; change product/data decisions only when the task authorizes that decision, not merely to make a check pass. Keep credentials and environment values out of documentation.

## Completion check

Before finishing a change:
1. Compare the final implementation with the triggers above and identify affected documents.
2. Update only those documents, or record that no documentation update is needed. Keep updates in the same task as the behavior change.
3. Check changed paths/links and commands against the repository. Mark anything unverified; source claims from actual evidence.
4. In an existing task checkpoint, record documentation updated/no impact and implemented, verified, planned, or blocked work separately. In the final response, mention material documentation changes and unverified behavior; a separate checkpoint is unnecessary for a tiny edit.

Completion means the requested change is implemented, relevant verification has been performed or its limitation reported, and affected documentation agrees with that result. It does not require adding a narrative entry after every edit.
