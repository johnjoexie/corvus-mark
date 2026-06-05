import { z } from 'zod'

// Each field is COMPUTED by the redaction scan (see 04), not hand-written, so it cannot lie.
// All must be false for the report to be exportable; a true value blocks export (fail-closed).
export const diagnosticPrivacyStatementSchema = z.object({
  includesApiKey: z.boolean(),
  includesAuthorizationHeader: z.boolean(),
  includesRawUrl: z.boolean(),
  includesQuery: z.boolean(),
  includesHash: z.boolean(),
  includesCookie: z.boolean(),
  includesPageContent: z.boolean(),
  includesFullBookmarkTree: z.boolean(),
  includesBrowsingHistory: z.boolean(),
})

// schemaVersion is an integer migration counter (Decision D-01, see 10-execution-contracts).
export const diagnosticReportSchema = z.object({
  schemaVersion: z.number().int(),
  reportId: z.string(),
  createdAt: z.string(),
  errors: z.array(z.unknown()),
  traceSummary: z.unknown(),
  privacy: diagnosticPrivacyStatementSchema,
})

export type DiagnosticPrivacyStatement = z.infer<typeof diagnosticPrivacyStatementSchema>
export type DiagnosticReport = z.infer<typeof diagnosticReportSchema>

/** True only when the report carries no forbidden data (every flag false). */
export function isDiagnosticExportable(privacy: DiagnosticPrivacyStatement): boolean {
  return Object.values(privacy).every((v) => v === false)
}
