# Corvus Mark v5.0 Engineering Governance Summary

---

## 1. Permission Boundary

v1.0 required permissions:

```json
{
  "permissions": ["bookmarks", "storage"],
  "optional_host_permissions": [
    "https://api.deepseek.com/*",
    "https://api.openai.com/*",
    "https://openrouter.ai/*",
    "https://api.anthropic.com/*",
    "https://generativelanguage.googleapis.com/*",
    "http://localhost/*",
    "http://127.0.0.1/*"
  ]
}
```

Forbidden in v1.0:

- history
- cookies
- tabs
- scripting
- webRequest
- all_urls
- content script
- chrome.bookmarks.remove
- chrome.bookmarks.removeTree

---

## 2. Network Boundary

v1.0 has no Corvus Mark backend.

Network requests are only sent to user-configured AI Providers.

No telemetry.  
No analytics.  
No hidden tracking.

---

## 3. Secret Handling

Use `SecretStorePort`.

API Key:

- local only
- masked in UI
- never exported
- never in Trace
- never in DiagnosticReport

---

## 4. Quality Gates

v1.0 release requires:

- lint pass
- unit test pass
- schema test pass
- privacy regression test pass
- provider contract test pass
- feature flag test pass
- storage migration test pass
- package boundary check pass
- dependency audit pass
- license compliance check pass
- SBOM generated
- checksum generated
- Chrome local load pass
- Edge local load pass
- rollback scenario pass
- diagnostic export pass

---

## 5. Governance Documents

Required:

- Threat Model
- RFC process
- ADR records
- Dependency Policy
- License Compliance Policy
- Recovery Guide
- Store Compliance
- Release Checklist
