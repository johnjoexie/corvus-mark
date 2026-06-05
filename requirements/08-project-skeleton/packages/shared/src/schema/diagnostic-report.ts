export interface DiagnosticPrivacyStatement {
  includesApiKey: false
  includesAuthorizationHeader: false
  includesRawUrl: false
  includesQuery: false
  includesHash: false
  includesCookie: false
  includesPageContent: false
  includesFullBookmarkTree: false
  includesBrowsingHistory: false
}

export interface DiagnosticReport {
  schemaVersion: '1.0'
  reportId: string
  createdAt: string
  errors: unknown[]
  traceSummary: unknown
  privacy: DiagnosticPrivacyStatement
}
