import { z } from 'zod'

export const organizeRunCheckpointSchema = z.object({
  lastBatchRef: z.string().optional(),
  appliedCount: z.number().int().nonnegative(),
})

export const organizeRunRecordSchema = z
  .object({
    schemaVersion: z.number().int().positive(),
    id: z.string().min(1),
    traceId: z.string().min(1),
    promptVersion: z.string().min(1),
    status: z.enum(['planning', 'previewing', 'applying', 'done', 'failed', 'degraded']),
    phase: z.enum(['read', 'sanitize', 'classify', 'build_plan', 'preview', 'apply', 'rollback']),
    batchTotal: z.number().int().nonnegative(),
    batchDone: z.number().int().nonnegative(),
    itemTotal: z.number().int().nonnegative(),
    itemDone: z.number().int().nonnegative(),
    checkpoint: organizeRunCheckpointSchema,
    degradationReason: z
      .enum(['auth', 'rate_limit', 'timeout', 'network', 'bad_json', 'partial', 'budget_exceeded'])
      .optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .refine((run) => run.batchDone <= run.batchTotal, {
    message: 'batchDone must not exceed batchTotal',
    path: ['batchDone'],
  })
  .refine((run) => run.itemDone <= run.itemTotal, {
    message: 'itemDone must not exceed itemTotal',
    path: ['itemDone'],
  })

export type OrganizeRunCheckpoint = z.infer<typeof organizeRunCheckpointSchema>
export type OrganizeRunRecord = z.infer<typeof organizeRunRecordSchema>
