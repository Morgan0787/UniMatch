# Coding standards

## Inspect

Use `docs/agents/context/README.md` to select context for the affected area, then inspect the target files and minimum direct callers or dependencies needed to understand their contracts.

## Change

For imports, matching, and university displays, apply the data and schema rules in `docs/agents/context/DECISIONS.md`. Trace missing or unverified input through each changed transformation or fallback before accepting its output.

## Verify

Inspect the batch diff and run the smallest check that exercises the changed behavior. Interpret lint and typecheck results using the coverage notes in `docs/agents/context/DECISIONS.md`. Record the command, result, and any unverified behavior in the task checkpoint specified by `docs/agents/WORKFLOW.md`.

Before completing a change, follow `docs/agents/context/MAINTENANCE.md`: update documentation affected by the final implementation, distinguish implemented/verified/planned work, and check every new or changed pointer and command.
