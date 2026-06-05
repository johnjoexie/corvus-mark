import { z } from 'zod'

// schemaVersion is an integer migration counter (Decision D-01, see 10-execution-contracts).

export const moveLogItemSchema = z.object({
  schemaVersion: z.number().int(),
  bookmarkId: z.string(),
  title: z.string(),
  oldParentId: z.string(),
  // oldIndex/newIndex are kept for diagnostics only; v0.1 does NOT restore position (see 03).
  oldIndex: z.number().int().optional(),
  newParentId: z.string(),
  newIndex: z.number().int().optional(),
  status: z.enum([
    'pending',
    'success',
    'failed',
    'rolled_back',
    'skipped_stale_missing',
    'skipped_stale_moved',
    'already_satisfied',
    'rollback_skipped',
  ]),
  error: z.string().optional(),
})

export const moveLogSchema = z.object({
  schemaVersion: z.number().int(),
  id: z.string(),
  planId: z.string(),
  runId: z.string(),
  traceId: z.string(),
  createdAt: z.string(),
  status: z.enum(['pending', 'completed', 'partial_failed', 'rolled_back']),
  items: z.array(moveLogItemSchema),
})

export type MoveLogItem = z.infer<typeof moveLogItemSchema>
export type MoveLog = z.infer<typeof moveLogSchema>
