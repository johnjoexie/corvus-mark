// Each field is COMPUTED by the redaction scan (see 04), not hand-written, so it cannot lie.
// All must be false for the report to be exportable; a true value blocks export (fail-closed).
export interface DiagnosticPrivacyStatement {
  includesApiKey: boolean
  includesAuthorizationHeader: boolean
  includesRawUrl: boolean
  includesQuery: boolean
  includesHash: boolean
  includesCookie: boolean
  includesPageContent: boolean
  includesFullBookmarkTree: boolean
  includesBrowsingHistory: boolean
}

// schemaVersion is an integer migration counter (Decision D-01, see 10-execution-contracts).
export interface DiagnosticReport {
  schemaVersion: number
  reportId: string
  createdAt: string
  errors: unknown[]
  traceSummary: unknown
  privacy: DiagnosticPrivacyStatement
}
