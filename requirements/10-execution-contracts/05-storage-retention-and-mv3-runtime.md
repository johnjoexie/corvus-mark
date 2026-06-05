# 05 — Storage Retention & MV3 Runtime (closes #7, #9)

Two operational realities the v5 docs didn't bound:

1. **#7** `StorageRoot` grows unbounded (`runs`, `moveLogs`, `transactions`, `traces` only
   append) and `chrome.storage.local` is ~5–10 MB. It will break for real users over time.
2. **#9** Manifest V3 service workers are killed aggressively; a long organize run cannot
   assume it keeps running.

---

## 1. Storage budget & retention (closes #7)

### 1.1 Budget

- Target hard ceiling: keep `StorageRoot` serialized < **3 MB** (well under the ~5 MB limit,
  leaving headroom). A size probe runs after each write.

### 1.2 Retention policy (constants in the seed RulePack)

| Collection | Keep | On overflow |
|---|---|---|
| `runs` (OrganizeRunRecord) | last 20 | drop oldest |
| `moveLogs` | last 10, **plus** the most recent non-rolled-back one always | drop oldest rolled_back |
| `transactions` | last 10 | drop oldest |
| `traces` | last 5 runs, or cap N events/run | ring buffer per run |
| `classificationMemory` | bounded by LRU, cap 50k entries | evict least-recently-used |

- **Never auto-prune a `MoveLog` whose `status != rolled_back`**: that would destroy the only
  rollback source for the user's last action. Rollback availability beats history depth.

### 1.3 Overflow behavior

```text
afterWrite:
  size = measure(StorageRoot)
  if size > 3MB:
     prune per table above (oldest-first, respecting the rollback-safety rule)
     re-measure; if still > 3MB -> surface a non-blocking "history trimmed" notice
```

### 1.4 Pruning is also a migration concern

The migration runner (`schemaVersion`, D-01) may need to prune on upgrade if an older version
stored unbounded data. `StorageMigrationLog` records what was pruned.

## 2. MV3 service-worker lifecycle (closes #9)

### 2.1 The constraint

An MV3 background service worker can be terminated at any time (idle ~30s; long tasks are not
guaranteed). An organize run over thousands of bookmarks across many AI batches **will**
outlive a single worker activation.

### 2.2 Design: durable run state + resumable batches

- The run's progress lives in `OrganizeRunRecord` in `chrome.storage.local`, not in worker
  memory. Each batch result is persisted as it completes.

```jsonc
// OrganizeRunRecord (progress-bearing fields)
{ "schemaVersion": 1, "id": "run_<ULID>", "status": "planning|previewing|applying|done|failed|degraded",
  "batchTotal": 14, "batchDone": 6, "phase": "classify",
  "checkpoint": { "lastBatchRef": "b479", "appliedCount": 0 } }
```

- **Classification** is chunked into batches (`01` §4). After each batch persists, the worker
  may die; on next wake (user reopens UI / event), the run resumes from `checkpoint`.
- **Apply** is already write-ahead per item (`03` §3), so a worker death mid-apply leaves a
  truthful `MoveLog` to resume or roll back.
- Use **alarms / explicit user action** to resume, not a long-lived timer. v0.1 keeps it
  simple: resume is triggered when the user reopens the organizer; the UI shows "Resume run".

### 2.3 Where work runs

- Bookmark moves and storage writes happen in the service worker (has `chrome.bookmarks`).
- Network calls to AI providers also originate from the worker; long waits are split across
  batches so no single fetch is expected to span a full multi-thousand-item run.

## 3. Performance modes (v0.5 hook, v0.1 default)

- v0.1 ships a single default mode: `batchSize=80`, `concurrency=2` (1 for local providers).
- v0.5 "performance modes" only tune these constants; the resumable/write-ahead design above
  is fixed and not mode-dependent.

## 4. Acceptance (DoD pointer)

See `06`: retention test (synthesize > budget → prune keeps newest + protects live MoveLog);
resumability test (interrupt classification after k batches → resume completes the plan,
no duplicate folders); apply-interrupt test (covered in `03`).
