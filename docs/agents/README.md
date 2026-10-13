# UniMatch: Codex / OpenCode switch

Run these PowerShell commands from the UniMatch root:

```powershell
.\scripts\switch-agent-workflow.ps1 status
.\scripts\switch-agent-workflow.ps1 codex
.\scripts\switch-agent-workflow.ps1 opencode
```

Use `-WhatIf` for a preview. Finish active agent work before switching, then start a new chat/session in the chosen tool. The switch changes `docs/agents/WORKFLOW.md` and `.codex/config.toml`, and records their last applied hashes in ignored `.codex/workflow-state.json`. It preserves source code, shared data rules, OpenCode dependencies/session history, OmniRoute configuration, global Codex settings, and the existing `.codex/environments/environment.toml`.

## Codex setup

Open UniMatch as a local Codex project and start a new chat there (not a projectless chat elsewhere). Project `.codex` configuration is loaded only when the project is trusted. If Codex asks about project trust, review and accept this project's files in the app. Global settings are not changed by this switch. Explicit composer/model/speed selections may override project defaults: choose GPT-6.1 Sol, medium reasoning, Standard speed to match this profile.

The profile enables automatic delegation through AGENTS.md, defaults helpers to Luna high, and caps open helpers at two. Custom definitions under `.codex/agents/` are `luna_worker`, `luna_explorer`, and `astra_advisor`. Astra is consulted only under the active workflow's escalation criteria. Its config does not guarantee account access. If the available spawn API lacks named roles, use explicit model selection with fresh context; if neither is available, the lead must report it and work directly.

The two-helper limit, Sol medium, and escalation budget are project choices for Plus, not OpenAI-required settings. Luna high and Astra low follow official starting recommendations. Standard avoids speed premiums; helpers share the account's allowance. The routing policy is an agent instruction, not a deterministic difficulty detector or a hard monetary spending limit. No paid/API-key smoke run is required to parse these files.

## OpenCode setup

Selecting `opencode` restores the Planner/Coder/Reviewer workflow with the existing `kiro/claude-sonnet-4.5` / OmniRoute planner choice and `.opencode/session/` checkpoints. Your external provider setup remains as it was. Shared product/data context is still read from `docs/agents/context/README.md`. `.opencode/context/WORKFLOW.md` is preserved byte-for-byte as the original workflow reference.

## Maintenance and recovery

Edit profile templates under `docs/agents/profiles/codex/` or `docs/agents/profiles/opencode/`, then select that profile. If an active file was manually edited, the switch refuses to overwrite it: save the active content into the corresponding profile template, then switch. Maintain shared facts only in `docs/agents/context/`; old `.opencode/context/` fact files are compatibility pointers. Update root coding standards when verification conventions change.

Original AGENTS.md, CODING_STANDARDS.md, .gitignore, and all original context Markdown files were saved byte-for-byte in `docs/agents/legacy-opencode-2026-10-13/`, with SHA-256 hashes. This is a recovery snapshot, not active instructions. Product guardrails and the project brief were copied unchanged into the shared context. Existing task history remains in its original directory.

## Official references (checked 2026-10-13)

- [Subagents: project instructions, model defaults, custom agents, and limits](https://learn.chatgpt.com/docs/agent-configuration/subagents)
- [Configuration: project trust, model, reasoning, and service tier](https://learn.chatgpt.com/docs/config-file/config-reference)
- [Model selection](https://developers.openai.com/api/docs/guides/model-selection)
- [Pricing and shared usage](https://learn.chatgpt.com/docs/pricing)

## Documentation policy

Both workflow profiles use `docs/agents/context/MAINTENANCE.md`. Select context by the task conditions in `docs/agents/context/README.md`. Before completion, the lead checks documentation impact, updates only affected documents, and distinguishes implemented, verified, and planned work. Shared context carries current facts; `PROJECT_CONTEXT.md` preserves import history and marks superseded claims. Recovery snapshots and the original `.opencode/context/WORKFLOW.md` remain unchanged.
