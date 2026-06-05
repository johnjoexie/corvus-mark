# 04 — URL Key, Salt & Privacy Oracle (closes #5, #8)

Two tightly-coupled problems the v5 docs left open:

1. **#5** strict sanitize removes query/hash, but classification stability & de-dup rely on a
   URL key — collapsing many distinct pages onto one key would mis-merge bookmarks.
2. **#8** the privacy promise is the product's trust anchor, but the skeleton only had a
   struct of `false` literals, which proves nothing at runtime.

---

## 1. The de-dup hazard (why sanitized URL is the wrong key)

`strict sanitize = protocol://host/pathname` drops query/hash. But many distinct bookmarks
differ only there:

```text
https://youtube.com/watch?v=AAA   -> https://youtube.com/watch   (collapsed!)
https://youtube.com/watch?v=BBB   -> https://youtube.com/watch   (collapsed!)
https://app/docs?id=1  and  ?id=2 -> same key                    (collapsed!)
```

If `urlKeyHash` were computed from the sanitized URL, two different videos become "the same
bookmark" → wrong stability memory and wrong de-dup.

## 2. Decision D-05: identity key vs AI key are different

| Key | Computed from | Where used | Leaves device? |
|---|---|---|---|
| `urlKeyHash` (identity) | **raw URL**, salted SHA-256 | stability memory, de-dup | **No** — only the hash is stored, never the raw URL |
| `sanitizedUrl` (AI input) | strict-sanitized URL | AI payload, UI display | Yes (to user-configured provider only) |
| `hostKey` | registrable host, lowercased | offline rules, grouping | Yes |

- Identity is precise (raw URL based) **without** ever persisting or transmitting the raw URL:
  only `urlKeyHash = SHA256(salt || normalizedRawUrl)` is stored.
- `normalizedRawUrl` for hashing = lowercase scheme+host, keep path, **keep query**, drop
  fragment, sort query params, strip well-known tracking params (`utm_*`, `gclid`, `fbclid`).
  This makes `?v=AAA` vs `?v=BBB` distinct while `?utm_source=x` noise does not fork identity.
- The AI still only sees `sanitizedUrl` (no query). Identity precision and AI privacy are
  decoupled — that is the whole point.

## 3. Salt lifecycle (the missing piece)

- A single per-install random salt (`saltId` + 32 random bytes) is generated on first run and
  stored in `chrome.storage.local` under `DataPolicies.urlSalt`. Never exported, never in
  Trace/DiagnosticReport (it would make hashes reversible-ish across leaks).
- **Reinstall / new device** → new salt → old `urlKeyHash` values no longer match. Documented
  consequence: classification memory is device-local and does **not** survive reinstall. This
  is acceptable for v0.1 (memory is an optimization, not data the user owns) and is stated in
  the recovery guide. Pro "sync" is where cross-device memory would live.
- Salt rotation is not a v0.1 feature; rotating would invalidate all memory (documented).

## 4. Executable privacy oracle (closes #8)

The privacy guarantee must be enforced by code, not asserted by a struct of `false`.

### 4.1 Outbound allowlist (single source of truth)

Every field allowed in an AI request item is enumerated:

```ts
export const AI_ITEM_ALLOWLIST = ['ref','title','sanitizedUrl','hostKey','currentPath'] as const
```

### 4.2 Pre-send guard (runtime, blocks the request)

```text
guardOutbound(envelope):
  for each item:
     extraKeys = keys(item) - AI_ITEM_ALLOWLIST
     assert extraKeys is empty                 else THROW privacy_violation (request blocked)
  // secret-pattern scan applies to ALL string values (titles included):
  assert no value matches secret patterns (apiKey regexes, "Bearer ", "Authorization", cookie)
  // query/hash canary applies to item.sanitizedUrl ONLY — titles may legitimately contain ? or #:
  assert no item.sanitizedUrl contains "?" or "#"
  assert envelope has no rawUrl field anywhere (deep scan)
```

- This guard runs on **every** request in production, not just in tests. A violation throws
  and the request is never sent (fail-closed).

### 4.3 Diagnostic redaction guard

```text
guardDiagnostic(report):
  deepScan(report) must not contain: apiKey, salt, Authorization, raw query/hash,
                                     cookies, page content, full bookmark tree, history
  DiagnosticPrivacyStatement is COMPUTED from the scan result, not hand-written.
```

The `DiagnosticPrivacyStatement` (currently hardcoded `false`s) becomes the *output* of the
scan, so it can never lie.

### 4.4 Privacy regression test = the oracle

`06` defines: for the `small-100` fixture plus adversarial fixtures (a bookmark whose title
contains an API-key-looking string, a URL with query/hash, a `javascript:`/`data:` URL), the
test builds every outbound envelope and every DiagnosticReport and asserts both guards pass
and that no forbidden token appears. A new code path that leaks data fails this test.

## 5. Edge-case URL handling (sanitizer hardening)

- `javascript:`, `data:`, `chrome:`, `file:` schemes → `isValid: false`, never sent to AI,
  classified to `Uncategorized` (or kept).
- Punycode/IDN hosts → normalized to ASCII `hostKey`.
- Malformed URLs → `isValid: false`, kept in place, surfaced as a plan warning.

## 6. Acceptance (DoD pointer)

See `06`: identity test (`?v=AAA` vs `?v=BBB` ⇒ different `urlKeyHash`; `?utm_source` noise ⇒
same); guard tests (adversarial fixtures blocked); statement-is-computed test; salt-missing →
generated-once test.
