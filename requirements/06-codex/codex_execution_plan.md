# Codex Execution Plan

## Step 1 — Project Skeleton

Create WXT + React + TypeScript + pnpm workspace.

Acceptance:

- pnpm install works
- pnpm dev works
- extension loads locally
- empty popup/options/organizer pages render

## Step 2 — Shared Schema

Implement `packages/shared/src/schema`:

- ids
- time
- url
- bookmark
- directory-profile
- prompt-profile
- ai-envelope
- organize-run-record
- organize-plan
- move-log
- trace
- diagnostic-report
- storage-root

Acceptance:

- Zod schema tests pass
- URL sanitizer tests pass
- ID factory tests pass

## Step 3 — Ports

Implement:

- BookmarkManagerPort
- LlmProviderPort
- SecretStorePort
- CapabilityService

Acceptance:

- no concrete browser/AI dependency in core

## Step 4 — Chromium Adapter

Implement ChromiumBookmarkAdapter.

Acceptance:

- get tree
- create folder
- move bookmark
- local browser manual test

## Step 5 — DeepSeek Provider

Implement DeepSeek through OpenAI-compatible API.

Acceptance:

- mock tests
- contract tests
- manual test guide

## Step 6 — Organizer Pipeline

Implement:

- read bookmarks
- sanitize URLs
- recommend directory fallback
- classify
- build Plan
- validate Plan
- preview
- apply selected
- MoveLog rollback

## Step 7 — Diagnostics

Implement:

- TraceEvent
- DiagnosticReport
- redactSecrets
- privacy regression tests

## Step 8 — OpenFeature

Implement:

- Local Static Provider
- CapabilityService
- default free flags
- feature flag tests

## Step 9 — UI Polish

Implement minimal UI:

- Popup
- Settings
- Organizer
- Preview
- Diagnostics

## Step 10 — Release Gate

Run:

- lint
- tests
- build
- Chrome local load
- rollback scenario
- diagnostic export
