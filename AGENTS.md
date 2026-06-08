# Project AI Entry

This file is the AI entry point for this project. Any agent working in this
repository must read it before making project changes.

## Global Rules

This project follows Johnjoe's AI workstation rules. Resolve the workstation
root from `$AI_ROOT_PATH` first. If it is empty or unset, stop and ask the user
to export it before continuing.

Read only the task-relevant files under:

- `$AI_ROOT_PATH/AGENTS.md`
- `$AI_ROOT_PATH/common/rules/agent-rule-loading.md`
- `$AI_ROOT_PATH/common/context-routing.md`

Then load additional rules, roles, skills, workflows, and templates according
to `$AI_ROOT_PATH/common/context-routing.md`.

## Project Boundaries

- Modify only task-related files in this repository.
- Do not modify secrets, certificates, tokens, `.env`, or production config.
- Do not send API keys, raw URLs, salts, Authorization headers, or private data
  to external services or model payloads.
- Do not perform unrelated refactors.
- Do not skip verification.
- Do not run `git commit`, `git push`, `git tag`, or history-rewriting commands
  without explicit user approval.

## Required Startup Check

For important tasks, confirm:

1. Goal
2. Scope
3. Inputs
4. Outputs
5. Success criteria
6. Risks
7. Verification method

For development tasks, run the environment scan from the resolved workstation
root before implementation:

```sh
python3 "$AI_ROOT_PATH/tools/envscan/envscan.py"
```
