import { describe, expect, it } from 'vitest'
import { traceEventSchema } from './trace'

const validTraceEvent = {
  schemaVersion: 1,
  eventId: 'evt_1',
  traceId: 'trace_1',
  runId: 'run_1',
  phase: 'classify' as const,
  level: 'info' as const,
  message: 'batch completed',
  createdAt: '2026-06-05T00:00:00.000Z',
  metadata: { batchRef: 'b1', itemCount: 80 },
}

describe('traceEventSchema', () => {
  it('parses a valid trace event', () => {
    expect(traceEventSchema.parse(validTraceEvent).eventId).toBe('evt_1')
  })

  it('rejects unknown phases', () => {
    expect(traceEventSchema.safeParse({ ...validTraceEvent, phase: 'unknown' }).success).toBe(false)
  })

  it('rejects privacy-bearing metadata keys', () => {
    expect(
      traceEventSchema.safeParse({
        ...validTraceEvent,
        metadata: { rawUrl: 'https://example.com/?token=1' },
      }).success,
    ).toBe(false)
  })
})
