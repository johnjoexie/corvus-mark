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

export const diagnosticReportExportSchema = diagnosticReportSchema.refine(
  (report) => isDiagnosticExportable(report.privacy),
  {
    message: 'diagnostic report is not exportable',
    path: ['privacy'],
  },
)

export type DiagnosticPrivacyStatement = z.infer<typeof diagnosticPrivacyStatementSchema>
export type DiagnosticReport = z.infer<typeof diagnosticReportSchema>

/** True only when the report carries no forbidden data (every flag false). */
export function isDiagnosticExportable(privacy: DiagnosticPrivacyStatement): boolean {
  return Object.values(privacy).every((v) => v === false)
}

function collectStrings(value: unknown, out: string[]): void {
  if (typeof value === 'string') out.push(value)
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, out))
  else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectStrings(item, out))
  }
}

function computePrivacyStatement(report: Omit<DiagnosticReport, 'privacy'>): DiagnosticPrivacyStatement {
  const serialized = JSON.stringify(report)
  const strings: string[] = []
  collectStrings(report, strings)

  return {
    includesApiKey: /sk-[A-Za-z0-9]{16,}|api[_-]?key/i.test(serialized),
    includesAuthorizationHeader: /authorization|bearer\s+/i.test(serialized),
    includesRawUrl: /rawUrl/i.test(serialized),
    includesQuery: strings.some((value) => /https?:\/\/[^"'\s?]+[?][^"'\s]+/.test(value)),
    includesHash: strings.some((value) => /https?:\/\/[^"'\s#]+#[^"'\s]+/.test(value)),
    includesCookie: /cookie/i.test(serialized),
    includesPageContent: /pageContent/i.test(serialized),
    includesFullBookmarkTree: /fullBookmarkTree/i.test(serialized),
    includesBrowsingHistory: /browsingHistory/i.test(serialized),
  }
}

export function toExportableDiagnosticReport(value: unknown): DiagnosticReport {
  const parsed = diagnosticReportSchema.parse(value)
  const { privacy: _ignored, ...withoutPrivacy } = parsed
  const privacy = computePrivacyStatement(withoutPrivacy)
  const report = { ...withoutPrivacy, privacy }

  if (!isDiagnosticExportable(privacy)) {
    throw new Error('diagnostic report is not exportable')
  }
  return diagnosticReportExportSchema.parse(report)
}
