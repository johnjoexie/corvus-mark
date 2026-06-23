import { describe, expect, it } from 'vitest'
import { recordTraceEvent, type TraceEventStore } from './trace-recorder'
import type { TraceEvent } from '../schema/trace'

class MemoryTraceEventStore implements TraceEventStore {
  events: TraceEvent[] = []

  async appendTraceEvent(event: TraceEvent): Promise<void> {
    this.events.push(event)
  }
}

describe('recordTraceEvent', () => {
  it('appends a validated trace event for a workflow phase', async () => {
    const store = new MemoryTraceEventStore()

    const event = await recordTraceEvent({
      store,
      eventId: 'evt_1',
      traceId: 'trace_1',
      runId: 'run_1',
      phase: 'preview',
      level: 'info',
      message: 'preview built',
      createdAt: '2026-06-05T00:00:00.000Z',
      metadata: { itemCount: 2, degraded: true },
    })

    expect(event.phase).toBe('preview')
    expect(store.events).toEqual([event])
  })

  it('rejects privacy-bearing metadata before appending', async () => {
    const store = new MemoryTraceEventStore()

    await expect(
      recordTraceEvent({
        store,
        eventId: 'evt_1',
        traceId: 'trace_1',
        runId: 'run_1',
        phase: 'classify',
        level: 'info',
        message: 'provider called',
        createdAt: '2026-06-05T00:00:00.000Z',
        metadata: { apiKey: '<SECRET>' },
      }),
    ).rejects.toThrow('trace metadata contains privacy-bearing keys')
    expect(store.events).toEqual([])
  })
})
