# Coding standards

## Inspect

Identify the affected area from the context pack, then inspect the target files and the direct callers or dependencies needed to understand their contracts.

## Change

For imports, matching, and university displays, apply the data and schema rules in `.opencode/context/DECISIONS.md`. Trace missing or unverified input through each changed transformation or fallback before accepting its output.

## Verify

Inspect the batch diff and run the smallest check that exercises the changed behavior. Interpret lint and typecheck results using the coverage notes in `.opencode/context/DECISIONS.md`. Record the command, result, and any unverified behavior in the task checkpoint specified by `.opencode/context/WORKFLOW.md`.

For documentation changes, check that every new or changed pointer resolves and states when to follow it.
