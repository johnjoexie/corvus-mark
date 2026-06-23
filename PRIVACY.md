# Privacy

Corvus Mark is local-first and BYOK.

## Data Sent to AI Providers

For classification, Corvus Mark sends only the minimum AI request item fields:

- per-batch opaque `ref`
- bookmark title
- strict-sanitized URL
- host key
- current path

The `ref` is not the real browser bookmark ID. The local `bookmarkId` to `ref` mapping
stays on device and is used only to join the AI response back into a local plan.

## Data Not Sent

Corvus Mark does not send:

- API keys
- raw URLs
- URL query strings
- URL hashes
- cookies
- browsing history
- page body content
- full bookmark tree
- real browser bookmark IDs
- local URL salt

## URL Handling

The AI-facing URL is strict-sanitized:

```text
https://example.com/path?a=1#token
-> https://example.com/path
```

For local stability and de-duplication, Corvus Mark computes a salted URL identity hash
from the normalized raw URL. The raw URL and salt stay local.

## Diagnostics

Diagnostic export is fail-closed. Before export, Corvus Mark computes a privacy statement
from the report contents and blocks export if forbidden data is detected.

## Telemetry

Corvus Mark v0.1 has no telemetry, analytics, account system, cloud sync, or Corvus
Mark-owned backend.
