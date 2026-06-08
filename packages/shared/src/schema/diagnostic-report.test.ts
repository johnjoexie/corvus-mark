import { describe, expect, it } from 'vitest'
import {
  diagnosticReportExportSchema,
  isDiagnosticExportable,
  toExportableDiagnosticReport,
} from './diagnostic-report'

const validReport = {
  schemaVersion: 1,
  reportId: 'report_1',
  createdAt: '2026-06-05T00:00:00.000Z',
  errors: [],
  traceSummary: { phases: ['classify'] },
  privacy: {
    includesApiKey: false,
    includesAuthorizationHeader: false,
    includesRawUrl: false,
    includesQuery: false,
    includesHash: false,
    includesCookie: false,
    includesPageContent: false,
    includesFullBookmarkTree: false,
    includesBrowsingHistory: false,
  },
}

describe('diagnostic report export', () => {
  it('rejects reports with non-exportable privacy statements', () => {
    const report = {
      ...validReport,
      privacy: { ...validReport.privacy, includesApiKey: true },
    }

    expect(isDiagnosticExportable(report.privacy)).toBe(false)
    expect(diagnosticReportExportSchema.safeParse(report).success).toBe(false)
  })

  it('computes privacy for export instead of trusting handwritten false flags', () => {
    expect(() =>
      toExportableDiagnosticReport({
        ...validReport,
        traceSummary: { Authorization: '<TOKEN>' },
      }),
    ).toThrow(/not exportable/)
  })

  it('returns an exportable object without privacy-bearing fields', () => {
    const exported = toExportableDiagnosticReport(validReport)
    const serialized = JSON.stringify(exported)

    expect(serialized).not.toContain('Bearer ')
    expect(exported.privacy.includesApiKey).toBe(false)
  })
})
