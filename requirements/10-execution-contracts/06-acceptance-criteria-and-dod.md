# 06 — Acceptance Criteria & Definition of Done (closes #10)

The v5 execution plan had acceptance for some steps but not all (Steps 6 & 9 had none), and
"classify success" had no number. Without measurable DoD, no issue can be objectively closed
and the "loop until landable" gate has nothing to converge on. This file gives each v0.1
issue a checkable DoD and defines the convergence gate.

> Rule: an issue is **Done** only when its DoD checks are green in CI/local test, not when
> "it looks done".

---

## 1. Measurable thresholds (the missing numbers)

| Metric | v0.1 target |
|---|---|
| auto-select confidence threshold | >= 0.75 (below ⇒ `keep`, needs review) |
| new-folder confidence threshold | >= 0.85 |
| max new folders / run | <= 12 |
| max depth | <= 3 |
| plan completeness | 100% of items reach a path (worst case `Uncategorized`) |
| privacy guard | 0 forbidden tokens in any outbound payload / report |
| rollback fidelity | 100% of `success` items returned to original parent (containment) |
| storage ceiling | serialized StorageRoot < 3 MB after retention |
| classify batch | <= 80 items/request, join loses 0 items |

## 2. Per-issue DoD (v0.1 backlog)

| Issue | Done when |
|---|---|
| init monorepo | `pnpm install`, `pnpm dev`, local extension load all pass; empty pages render |
| schema: ids & time | `createCorvusId` prefix+ULID test; ISO-8601 UTC helper test |
| schema: URL sanitizer & hash | strict sanitize test; identity-key test (`?v=AAA≠?v=BBB`, `utm` noise ignored); invalid-scheme test (`04`) |
| schema: bookmark | Zod parse/round-trip test |
| schema: OrganizeRunRecord | Zod test incl. progress/checkpoint fields (`05`) |
| schema: OrganizePlan | Zod test incl. `expectedParentId` (`03`) |
| schema: MoveLog | Zod test incl. extended `status` enum (`03`) |
| schema: Trace & DiagnosticReport | Zod test; statement-is-computed test (`04`) |
| BookmarkManagerPort | port interface has no chrome import (boundary test) |
| ChromiumBookmarkAdapter | get tree / create folder / move (append) manual + mocked test |
| StorageRoot + schemaVersion | `schemaVersion: number`; load/save round-trip; size probe |
| SecretStorePort | key never in Trace/Diagnostic (guard test, `04`) |
| LlmProviderPort | port has no concrete provider import |
| DeepSeek provider | real integration smoke + recorded contract test (`01`) |
| OpenAI-compatible provider | contract test; DeepSeek is its preset (D-03) |
| default directory fallback | offline classifier completes `small-100` with 0 lost; ≤12 new folders (`02`) |
| read & flatten bookmarks | flatten test against fixture tree |
| build & validate OrganizePlan | invalid items → `blocked`; thresholds applied (`01`,`02`) |
| settings page | configure provider; key masked; no key in DOM dump |
| organizer & preview page | preview shows every change; nothing applied without confirm |
| apply selected | write-ahead MoveLog; folders-first; precondition skips stale (`03`) |
| MoveLog rollback | rollback scenario test = original containment (`03`) |
| basic Trace | TraceEvent recorded per phase; no secrets |
| schema unit tests | all schemas have round-trip + reject tests |
| README & privacy draft | present; privacy claims match the oracle (`04`) |

## 3. Cross-cutting test suites (must exist before v0.1 "done")

- **Privacy regression oracle** (`04` §4): adversarial fixtures, fail-closed.
- **Rollback & crash-injection** (`03` §7): interrupt apply, resume/rollback consistent.
- **Resumability** (`05` §4): interrupt classification, resume completes, no dup folders.
- **Concurrency lock** (`03` §5): second apply blocked.
- **Error taxonomy** (`01` §6): each code has a deterministic test.
- **Storage retention** (`05` §1): over-budget → prune protects live MoveLog.
- **Leaf-only scope** (`03` §0): a plan over a tree with folders never proposes moving a folder.
- **Prompt injection** (`01` §6b): adversarial-title fixture cannot escape `allowedRoots`/
  `maxDepth`/`maxNewFolders` regardless of model output.
- **Single-writer** (`03` §5.1): UI-context write attempts are rejected/routed to the worker.
- **Typecheck gate** (D-07): `tsc --noEmit` runs as a gate **separate from** `wxt build`
  (Vite does not type-check); both must pass.

## 4. Required fixtures (expand beyond `small-100`)

- `dup-urls` (same page, query-only diffs) — identity key correctness.
- `adversarial-privacy` (key-like title, query/hash URL, `javascript:`/`data:`).
- `deep-nested` & `already-organized` — idempotency / no-op plans.
- `non-ascii-emoji-titles` — naming & sanitize robustness.
- `large-5000` (synthetic) — batching, storage, resumability.

## 5. Loop convergence gate ("landable" = stop)

The plan is **landable** when ALL hold:

1. P0 closed: `01` AI I/O contract, `02` default taxonomy, `03` apply/rollback model all
   written, self-consistent, and reflected in schema.
2. Every v0.1 issue above has a DoD that maps to at least one concrete test.
3. The 6 cross-cutting suites (§3) and 5 fixtures (§4) are specified.
4. No internal contradiction remains (e.g., D-01 `schemaVersion` applied in the skeleton).

When 1–4 are true, requirements stop; implementation starts from schema + ports (per the
v5 development rule). Further changes go through ADR/RFC, not ad-hoc requirement growth.
