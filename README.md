# Corvus Mark

AI-powered organizer for native Chromium bookmarks.

Corvus Mark reads your existing browser bookmarks, builds an AI-assisted organize plan,
lets you preview every proposed change, and then applies selected moves locally with a
write-ahead MoveLog for rollback.

Core promise:

```text
AI suggests. User previews. Local deterministic code executes.
```

## Current v0.1 Scope

- Chromium extension built with WXT, React, TypeScript, Zod, and pnpm.
- BYOK provider settings for DeepSeek and OpenAI-compatible providers.
- Strict URL sanitization for AI-facing payloads.
- Local salted URL identity hashes for stability and de-duplication.
- Default offline directory fallback.
- Preview plan generation before any bookmark move.
- Selected bookmark moves only; no folder moves, no deletes.
- MoveLog rollback for successful moves.
- Runtime TraceEvent recording without secrets.

## Privacy Model

AI requests are guarded before send. The model receives only:

- per-batch opaque `ref`
- bookmark title
- strict-sanitized URL without query or hash
- host key
- current path

Corvus Mark does not send raw URLs, query strings, hashes, API keys, cookies, browsing
history, page content, the full bookmark tree, or real browser bookmark IDs to AI
providers.

API keys are stored locally in browser extension storage and shown only masked in the UI.
Corvus Mark v0.1 has no telemetry, analytics, account system, cloud sync, or Corvus
Mark-owned backend.

## Development

```sh
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

For local extension development:

```sh
pnpm dev
```

## Repository Layout

```text
apps/extension      WXT browser extension
packages/shared    schema, ports, and core deterministic logic
requirements       product, contract, and release planning documents
```

## Safety Boundaries

Corvus Mark v0.1 does not:

- delete bookmarks or folders
- move folders
- read browsing history
- read page body content
- upload API keys
- send raw URL query/hash to AI providers
- move bookmarks without preview and explicit apply action
