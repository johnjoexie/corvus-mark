# 10 — Execution Contracts (v0.1 buildable layer)

> The v5 package fixed the **product**. This folder fixes the **execution contracts**:
> exactly what the AI exchanges, how bookmarks are moved/rolled back safely, how data
> is kept private and bounded. Without these, v0.1 cannot be built without rework.
>
> 核心原则不变：AI suggests. User previews. Local deterministic code executes.

This folder is the answer to the v1 requirements-completeness review. It closes the gaps that
blocked a buildable v0.1.

## Documents

| File | Closes | Topic |
|---|---|---|
| `01-ai-classification-contract.md` | #1, #6 | AI request/response envelope JSON, prompt contract, model output schema, batching, budget, error taxonomy & degradation |
| `02-default-directory-taxonomy.md` | #2 | Seed default categories, naming/locale rules, v0.1 depth/count limits |
| `03-apply-rollback-and-concurrency.md` | #3, #9(lock) | Apply ordering, preconditions, idempotency, deterministic rollback, v0.1 task lock |
| `04-url-key-salt-and-privacy-oracle.md` | #5, #8 | URL key strategy, salt lifecycle, executable privacy allowlist + regression oracle |
| `05-storage-retention-and-mv3-runtime.md` | #7, #9 | StorageRoot retention/pruning, chrome.storage budget, MV3 service-worker lifecycle & resumable batches |
| `06-acceptance-criteria-and-dod.md` | #10 | Per-issue measurable Definition of Done + loop convergence gate |

## Decision D-01: `schemaVersion` is an integer (closes #4)

The v5 docs were inconsistent: `data_protocol_summary.md` declared `StorageRoot.schemaVersion: number`,
while the skeleton used the string literal `schemaVersion: '1.0'` on each object.

**Decision: every persisted object uses `schemaVersion: number`, an integer starting at `1`.**

- Rationale: storage migration is driven by a monotonic counter, not a marketing version.
  Integers compare cleanly in migration runners and never collide with product version `v1.0`.
- The skeleton `.ts` files are updated to `schemaVersion: number` with literal `1`.
- Product/release versions (`v0.1`, `v1.0`) are unrelated to `schemaVersion` and never mixed in.

## Minor decisions (the 3 non-top-10 items)

- **D-02 i18n framework**: v0.1 ships English-only UI but all user-facing strings go through a
  single `t(key)` indirection (a flat in-repo message map; no heavy i18n lib in v0.1). zh-CN is a
  later message bundle, not a code change. This keeps the "bilingual" promise cheap and avoids a
  late refactor.
- **D-03 DeepSeek vs OpenAI-compatible boundary**: there is **one** `OpenAiCompatibleProvider`.
  DeepSeek is a *named preset* of it (base URL + model id + capability flags), not a separate
  adapter. Same for OpenRouter and any OpenAI-compatible endpoint. Only providers with a
  genuinely different wire format (Anthropic, Gemini, Ollama native) get their own adapter.
- **D-04 Threat Model timing**: the formal Threat Model stays a v1.0 governance doc, but the
  **secret-handling and privacy invariants it would assert are made executable in v0.1** via
  `04-url-key-salt-and-privacy-oracle.md`. The doc is late; the enforcement is not.

## Pass 2 — residual risks (adversarial review, folded into the docs)

A second red-team pass surfaced 4 residual risks; all folded in (no new files):

- **R1 single-writer invariant** (`03` §5.1): all mutations route through the background
  service worker, making the lock CAS and storage writes effectively atomic.
- **R2 leaf-only scope** (`03` §0): v0.1 only moves leaf bookmarks; folders are never moved/
  reordered/deleted, only created.
- **R3 prompt injection / untrusted input** (`01` §6b): titles/URLs are untrusted LLM input;
  safety rests on "nothing privileged is reachable" + strict output validation, never on model
  obedience.
- **R4 large-run cost guard** (`01` §4): extra confirmation when a run exceeds ~50 requests.

## Implementation validation (2026-06-05) — Step 1 built green

The v0.1 skeleton was actually scaffolded at the repo root and built, to prove the contracts
are buildable. Result: `pnpm install` ✓, `pnpm test` ✓ (3/3), `pnpm build` ✓
(chrome-mv3: manifest + popup/options/organizer pages + background), `pnpm typecheck` ✓.
Toolchain: pnpm 9.15.9, node 26, WXT 0.20.26, React 19, Vite 8.

Building surfaced 3 gaps the paper review missed (implementation-driven adversarial pass):

- **D-06 WebExtension API convention**: use WXT's typed `browser` (cross-browser, polyfilled),
  **not** the global `chrome.*`. `tsc` flagged `chrome` as untyped; more importantly `browser`
  is what makes the Edge/Brave compatibility promise (compat doc) real. The
  `ChromiumBookmarkAdapter` must wrap `browser.bookmarks`, not `chrome.bookmarks`.
- **D-07 typecheck is a separate gate from build**: `wxt build` (Vite) does **not** type-check;
  it bundled successfully *with* a type error present. The quality gate must run
  `tsc --noEmit` independently (added as `typecheck`). Reflected in `06` DoD.
- **D-08 seed vs implementation drift**: `requirements/08-project-skeleton` is a *seed* now
  superseded by the real root `packages/`/`apps/`. The seed is frozen as historical reference;
  the root tree is the source of truth. Also pin a node engines range for reproducibility
  (SBOM/dependency-audit concern in the v1.0 governance doc).

## How this maps to the original review (10 + 3)

P0: #1 (01), #2 (02), #3 (03).
P1: #4 (this README, D-01), #5 (04), #6 (01), #7 (05), #8 (04).
P2: #9 (03 lock + 05 runtime), #10 (06).
Minor: i18n (D-02), provider boundary (D-03), threat-model timing (D-04).
