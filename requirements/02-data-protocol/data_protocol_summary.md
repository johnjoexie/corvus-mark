# Corvus Mark v5.0 Data Protocol Summary

This file summarizes the final protocol decisions. Detailed schema skeleton is in `08-project-skeleton/packages/shared/src/schema`.

---

## 1. Universal Rules

1. All persistent objects have `schemaVersion`.
2. IDs use semantic prefix + ULID.
3. Time uses ISO 8601 UTC.
4. URL default policy is strict sanitize.
5. exact URL memory uses local salted hash.
6. AI request/response uses Envelope.
7. AI output must be Zod validated.
8. MoveLog is rollback source of truth.
9. OrganizeRunRecord connects the full run lifecycle.
10. DiagnosticReport must pass privacy validation.

---

## 2. Core Objects

- StorageRoot
- SettingsState
- BrowserBookmarkNode
- NormalizedBookmark
- DirectoryProfile
- DirectoryProfileDiff
- PromptProfile
- AiProviderConfig
- ProviderCapability
- AiRequestEnvelope
- AiResponseEnvelope
- OrganizeRunRecord
- OrganizePlan
- PlanDiff
- MoveLog
- BookmarkOperationTransaction
- ClassificationMemoryState
- RulePack
- TestFixture
- TraceEvent
- DiagnosticReport
- CapabilityState
- DataPolicies
- UserConsentRecord
- SchemaCompatibilityMatrix

---

## 3. Privacy

Default AI payload includes only:

- bookmark id
- title
- sanitized URL
- current path
- host key

It must not include:

- API Key
- Authorization Header
- raw URL
- query
- hash
- cookies
- page body
- browsing history

---

## 4. StorageRoot

```ts
export interface StorageRoot {
  schemaVersion: number
  settings: SettingsState
  providers: AiProviderConfig[]
  providerCapabilities: ProviderCapability[]
  pricingHints: ProviderPricingHint[]
  runs: OrganizeRunRecord[]
  directoryProfiles: DirectoryProfile[]
  directoryAliases: DirectoryAlias[]
  promptProfiles: PromptProfile[]
  classificationMemory: ClassificationMemoryState
  moveLogs: MoveLog[]
  transactions: BookmarkOperationTransaction[]
  traces: TraceStore
  capabilities: CapabilityState
  consents: UserConsentRecord[]
  policies: DataPolicies
  compatibility: SchemaCompatibilityMatrix
  migrations: StorageMigrationLog[]
}
```

---

## 5. First Implementation Order

1. IDs.
2. Time.
3. URL sanitizer + hash.
4. Bookmark schema.
5. DirectoryProfile.
6. PromptProfile.
7. AI envelopes.
8. OrganizeRunRecord.
9. OrganizePlan.
10. MoveLog.
11. Trace.
12. DiagnosticReport.
13. StorageRoot.
14. Test fixtures.
