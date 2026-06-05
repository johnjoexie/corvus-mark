# Feature Flags

Corvus Mark uses OpenFeature with Local Static Provider in v1.0.

Business code must not directly call OpenFeature SDK. Use CapabilityService.

Example flags:

```text
feature.multi-prompt-profiles
feature.prompt-profile-export
feature.organize-plan-export
feature.scheduled-organize
feature.auto-classify-new-bookmarks
feature.provider-fallback
feature.advanced-directory-limits
feature.advanced-stability-report
```
