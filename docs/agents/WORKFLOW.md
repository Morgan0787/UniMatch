# UniMatch workflow: Codex

## Lead and routing

Use GPT-6.1 Sol as the lead. The lead owns requirements, planning, integration, and final verification. For a small change, work directly. For independent, substantial work with explicit acceptance criteria, proactively delegate to Luna without asking for separate authorization. Prefer a deterministic script for repetitive transformations.

Start with one Luna; use two only when their assignments can run independently. Keep at most two subagents open in total, including advisors. Release completed slots before escalation. Only the lead starts helpers; helpers report blockers to the lead. Keep one writer per file and give writers explicit file ownership. When isolation is needed, use supported worktrees and integrate their changes sequentially.

Use `luna_worker` for bounded implementation and `luna_explorer` for focused read-only investigation. The project config defaults unconfigured helpers to GPT-6 Luna / high. Start helpers with fresh context: send the goal, named files, relevant contracts/guardrails, acceptance criteria, and the smallest verification command. Pass summaries and exact errors instead of full chat history or repository dumps.

If custom roles are unavailable but the spawn tool supports model selection, explicitly select `gpt-6-luna` / `high` or `gpt-6-astra` / `low` with fresh context and the same role instructions. If the tool cannot select or confirm the requested model, continue with the lead and report the limitation; avoid silently spawning expensive inherited-model helpers.

## Plan and implement

Select task-relevant context through `docs/agents/context/README.md`; read `CODING_STANDARDS.md` for edits. For multi-file work, make a compact dependency-ordered plan of coherent batches, normally 1-3 files, with acceptance criteria and the cheapest first check. For small changes, a separate planning agent and checkpoint are unnecessary.

Inspect named files and minimum direct dependencies. Load only applicable skills using the capabilities actually available in Codex; read their instructions when used. Implement a batch, inspect its diff, and immediately run the smallest meaningful behavior check. For UI changes, cover relevant loading, error, disabled, focus, mobile, success, and reduced-motion states.

## Verification and escalation

The lead checks every delegated result against acceptance criteria and the applicable guardrails in `docs/agents/context/DECISIONS.md`, then runs the relevant build/typecheck and focused behavior checks. Use lint only within its documented coverage; run `npm run check:matching` after matching logic changes. Add browser, accessibility, or security checks when the changed behavior requires them. Use independent review for consequential or difficult changes; perform routine review directly to save usage. Return concrete evidence, exact failures, and remaining unverified behavior.

A Luna result that fails validation or exposes an ambiguous contract returns to Sol. Sol handles the unresolved work; allow one focused Luna correction only when the fix is mechanical and cheaper than taking over.

Consult `astra_advisor` after two materially different Sol attempts fail the same acceptance criterion, or when the lead cannot resolve competing designs for a consequential public interface, auth boundary, or data/schema decision. Give Astra the constraint, minimal code/evidence, failed attempts, and a specific question. Astra advises read-only; Sol implements and verifies. Start with low reasoning. Limit automatic Astra consultations to one per unresolved issue and two per user task. After an unsuccessful consultation, report the concrete blocker instead of repeating the same loop. If Astra is unavailable to the account/client, continue with Sol and disclose the limitation; model names in files do not grant access.

## Checkpoints and Plus usage

For multi-batch, delegated, or interrupted work, maintain `.codex/session/<task-slug>.md` using `docs/agents/context/CHECKPOINT_TEMPLATE.md`: files/ownership, contracts, commands/results, failed attempts, next action, and advisor consultations. Resume from next action rather than repeating completed work. Summarize delegated files and verification in the final response.

Use Standard speed and medium reasoning for the Sol lead; use Luna high and Astra low as configured. Raise reasoning only for a specific unresolved problem. Keep Fast, Ultrafast, Max, and Ultra off by default. All helper work draws from the same account allowance; parallelism is a speed choice, not free usage. Respect explicit user settings and the actual client limits. Stop creating new helpers when the client reports a usage limit; do not automatically buy credits, change plans, or switch to API billing.

## Documentation completion

Before finishing, the lead applies `docs/agents/context/MAINTENANCE.md` to the final implementation and accepts any worker documentation updates. Keep implemented, verified, and planned work distinct. Update affected documents and existing checkpoints, then report relevant documentation changes and remaining verification gaps.
