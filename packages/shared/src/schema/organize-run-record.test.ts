import { describe, expect, it } from 'vitest'
import { organizeRunRecordSchema } from './organize-run-record'

const validRunRecord = {
  schemaVersion: 1,
  id: 'run_1',
  traceId: 'trace_1',
  promptVersion: 'classifier-v1',
  status: 'planning' as const,
  phase: 'classify' as const,
  batchTotal: 14,
  batchDone: 6,
  itemTotal: 1000,
  itemDone: 480,
  checkpoint: {
    lastBatchRef: 'b479',
    appliedCount: 0,
  },
  createdAt: '2026-06-05T00:00:00.000Z',
  updatedAt: '2026-06-05T00:05:00.000Z',
}

describe('organizeRunRecordSchema', () => {
  it('parses a progress-bearing run record', () => {
    expect(organizeRunRecordSchema.parse(validRunRecord).checkpoint.lastBatchRef).toBe('b479')
  })

  it('rejects an impossible batch progress count', () => {
    expect(
      organizeRunRecordSchema.safeParse({
        ...validRunRecord,
        batchDone: 15,
      }).success,
    ).toBe(false)
  })

  it('allows degraded runs to record a reason', () => {
    expect(
      organizeRunRecordSchema.parse({
        ...validRunRecord,
        status: 'degraded',
        degradationReason: 'network',
      }).degradationReason,
    ).toBe('network')
  })
})
