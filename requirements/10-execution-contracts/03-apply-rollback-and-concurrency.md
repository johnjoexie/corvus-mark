# 03 — Apply, Rollback & Concurrency (closes #3, part of #9)

This is the highest-risk area: it mutates the user's real bookmarks. The v5 docs named
`MoveLog` and "rollback" but left the correctness model open. This file defines apply
ordering, preconditions, idempotency, deterministic rollback, and the v0.1 task lock.

> Promise to the user: **no destructive op, every applied move is reversible, and an
> interrupted apply never corrupts the tree.** v1.0 never calls `remove`/`removeTree`.

## 0. Scope (what apply touches)

- v0.1 **only moves leaf bookmark nodes** (nodes with a `url`). It never moves, reorders, or
  deletes existing folders, and never moves a folder node. It may *create* target folders.
- Containment is the unit of change: "this bookmark now lives under folder X". Folder
  structure the user already built is preserved.

---

## 1. The core hazard: indices drift

`chrome.bookmarks.move(id, { parentId, index })` shifts sibling indices on every move.
A plan captured at time T0 references parent ids and indices that are stale by the time
apply runs. Naive "move to recorded index" corrupts ordering. Therefore:

- **Apply addresses targets by `parentId` only, and appends** (`index` omitted → append to
  end of target folder). v0.1 does not promise intra-folder ordering; it promises correct
  *containment*. This removes the whole class of index-drift bugs.
- Ordering within a folder is explicitly a **non-goal for v0.1** (documented limitation).

## 2. Preconditions (optimistic concurrency)

Before applying each item, verify the world still matches the plan:

```text
precondition(item):
  node = chrome.bookmarks.get(item.bookmarkId)        // still exists?
  assert node exists                                   else -> skip (status: stale_missing)
  assert node.parentId == item.expectedParentId        else -> skip (status: stale_moved)
  assert target folder exists or will be created
```

- `OrganizePlanItem` gains `expectedParentId` (snapshot at plan build). If the user moved a
  bookmark between preview and apply, that item is **skipped, not forced** — recorded as
  `stale_moved` with a post-apply warning. Safety beats completeness.
- Folder creation is idempotent: resolve-or-create by case-insensitive path; never create a
  duplicate-cased sibling (`02`).

## 3. Apply algorithm (deterministic, resumable)

```text
apply(plan, selectedItems):
  acquire task lock (§5)                      // else abort: "another run is active"
  create MoveLog(status=pending) BEFORE any move
  resolve/create all needed folders first     // folders before moves
  for item in selectedItems (stable order by bookmarkId):
     record MoveLogItem(status=pending, oldParentId, newParentId)
     if not precondition(item): mark skipped; continue
     chrome.bookmarks.move(item.bookmarkId, { parentId: newParentId })   // append
     mark MoveLogItem success | failed(error)
     persist MoveLog after each item          // crash-safe progress
  set MoveLog.status = completed | partial_failed
  release task lock
```

Key properties:

- **Write-ahead**: `MoveLog` (and each item) is persisted *before/at* the move, so a crash
  mid-apply leaves a truthful log to resume or roll back from. No "we moved but forgot".
- **Folders first**: all target folders exist before any bookmark move, so a move never
  fails for a missing parent.
- **Idempotent re-apply**: re-running apply on the same plan re-checks preconditions; items
  already at their target are recorded `already_satisfied` and skipped.

## 4. Rollback algorithm (deterministic)

```text
rollback(moveLog):
  acquire task lock
  for item in moveLog.items where status == success, in REVERSE order:
     if precondition holds (node exists, currently under newParentId):
        chrome.bookmarks.move(bookmarkId, { parentId: oldParentId })   // append back
        mark rolled_back
     else:
        mark rollback_skipped(reason)   // user moved it again; don't fight the user
  set moveLog.status = rolled_back
  release task lock
```

- Rollback only touches items it actually moved (`status == success`). It never invents moves.
- Because apply appended (no index), rollback appends back to the original parent. Original
  intra-folder position is **not** restored in v0.1 (documented; matches §1 non-goal).
- If a bookmark was moved again by the user after apply, rollback skips it rather than
  yanking it — recorded with reason. The recovery guide already points users to browser HTML
  export as the ultimate backup.

## 5. Task lock in v0.1 (pulled forward from v0.5)

Concurrency corruption is possible in v0.1 the moment two contexts write `StorageRoot`/move
bookmarks (e.g., popup + options page, or a double-click). A minimal lock is therefore v0.1,
not v0.5.

```jsonc
// stored in chrome.storage.local under "taskLock"
{ "schemaVersion": 1, "lockId": "run_<ULID>", "kind": "apply|rollback",
  "acquiredAt": "ISO", "ttlMs": 120000 }
```

- Acquire = compare-and-set on `taskLock` (read, if absent or expired by `ttlMs`, write own).
- Any apply/rollback aborts with a clear message if the lock is held and unexpired.
- TTL prevents a crashed run from locking forever; an expired lock is reclaimable.
- v0.5 only *enhances* this (richer DiagnosticReport on contention); the guard itself is v0.1.

### 5.1 Single-writer invariant (why the CAS is safe)

`chrome.storage.local` has no transactions, so a naive compare-and-set could race between two
contexts. The design removes the race by routing **all** bookmark mutations and `StorageRoot`
writes through the **background service worker** (a single instance). Popup/options pages never
write directly — they send messages to the worker. Because the worker processes messages
serially, the lock CAS and every write are effectively atomic. UI contexts are read + request
only; the worker is the sole writer.

## 6. New/changed schema fields

- `OrganizePlanItem.expectedParentId: string` (snapshot for precondition).
- `MoveLogItem.status` extends to:
  `pending | success | failed | rolled_back | skipped_stale_missing | skipped_stale_moved | already_satisfied | rollback_skipped`.
- `MoveLog.status`: `pending | completed | partial_failed | rolled_back`.

(See `move-log.ts`; `oldIndex/newIndex` are kept for diagnostics only and are NOT used to
restore position in v0.1.)

## 7. Acceptance (DoD pointer)

See `06`: rollback scenario test (move N, roll back, tree equals original containment);
crash-injection test (kill after k moves → resume/rollback stays consistent); concurrency
test (second apply blocked by lock); stale-precondition test (user moves an item → skipped,
not corrupted).
