# 02 — Default Directory Taxonomy (closes #2)

`default directory fallback` and `AI directory recommendation` are the ground floor of
classification. The v5 docs named them but gave no content. Without a concrete default
taxonomy, offline/fallback mode cannot produce a plan and the AI has no `allowedRoots`
to reuse. This file defines the v0.1 seed.

---

## 1. Seed taxonomy (v0.1)

A small, opinionated, English-keyed set. Depth 2 max in the seed; AI may go to depth 3.

```text
Dev
  Frontend
  Backend
  DevOps
  AI/ML
  Languages
  Tools
Reading
  Articles
  Docs
  Papers
Media
  Video
  Music
  Images
Shopping
News
Social
Finance
Work
Personal
Reference
Uncategorized        // terminal sink; never auto-deleted
```

- The seed ships as a static `RulePack` (`rule_<ULID>`), versioned with `schemaVersion: 1`.
- `Uncategorized` is the guaranteed sink: any item with no confident target lands here, so a
  plan is always complete and reversible.

## 2. Host → category seed rules (offline classifier)

Offline mode and the pre-AI pass use deterministic `hostKey` rules. Seed examples (extensible):

```text
github.com, gitlab.com, stackoverflow.com   -> Dev
react.dev, developer.mozilla.org            -> Dev/Frontend
arxiv.org                                    -> Reading/Papers
youtube.com, bilibili.com                    -> Media/Video
medium.com, substack.com                     -> Reading/Articles
amazon.*, taobao.com                         -> Shopping
*.gov, news sites                            -> News
```

- Rules match on `hostKey` (and registrable domain), never on raw URL.
- Unmatched hosts in offline mode → `Reference` if the host repeats >= 3 times, else
  `Uncategorized`.

## 3. Naming & locale rules (D-02)

- Folder names come from the active `locale`. v0.1 ships `en` names (above). A `zh-CN`
  message bundle maps the same keys to Chinese names; switching locale renames the *display*
  mapping, not historical folders already created.
- Folder name constraints: <= 40 chars, no `/`, trimmed, collapse duplicate whitespace,
  case-insensitive de-dup against `existingPaths`.
- Reuse beats create: if an existing folder matches the target path case-insensitively, reuse
  it instead of creating a sibling with different casing.

## 4. v0.1 limits (the missing constraints)

| Limit | v0.1 value | Why |
|---|---|---|
| `maxDepth` | 3 | keeps trees navigable; advanced limits are Pro |
| `maxNewFolders` per run | 12 | prevents AI folder explosion |
| max folder name length | 40 | UI + browser sanity |
| min confidence to auto-select | 0.75 | below → `action: keep`, needs user review |
| min confidence to create new folder | 0.85 | new folders are higher-cost mistakes |

- These are constants in the seed `RulePack`, surfaced read-only in Settings for v0.1
  (editable limits are a Pro feature: "advanced directory limits").

## 5. Interaction with stability & memory

- A user-confirmed path in `ClassificationMemoryState` overrides both the seed rules and AI.
- When the seed taxonomy changes between versions, existing remembered paths are preserved;
  the seed only affects items with no memory.

## 6. Acceptance (DoD pointer)

See `06`: offline classifier produces a complete plan for the `small-100` fixture with zero
items lost (everything reaches a path, worst case `Uncategorized`); new-folder count never
exceeds `maxNewFolders`; locale switch renames display without touching created folders.
