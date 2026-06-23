import type { TraceEvent } from '../schema/trace'
import { traceEventSchema } from '../schema/trace'

export interface TraceEventStore {
  appendTraceEvent(event: TraceEvent): Promise<void>
}

export interface RecordTraceEventInput {
  store: TraceEventStore
  eventId: string
  traceId: string
  runId: string
  phase: TraceEvent['phase']
  level: TraceEvent['level']
  message: string
  createdAt: string
  metadata?: Record<string, unknown>
}

export async function recordTraceEvent(input: RecordTraceEventInput): Promise<TraceEvent> {
  const event = traceEventSchema.parse({
    schemaVersion: 1,
    eventId: input.eventId,
    traceId: input.traceId,
    runId: input.runId,
    phase: input.phase,
    level: input.level,
    message: input.message,
    createdAt: input.createdAt,
    metadata: input.metadata,
  })
  await input.store.appendTraceEvent(event)
  return event
}
