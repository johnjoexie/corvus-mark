import { z } from 'zod'

// schemaVersion is an integer migration counter (Decision D-01, see 10-execution-contracts).

export const planWarningSchema = z.object({
  code: z.string(),
  message: z.string(),
  severity: z.enum(['info', 'warning', 'error']),
  itemIds: z.array(z.string()).optional(),
})

export const planStatsSchema = z.object({
  totalItems: z.number().int().nonnegative(),
  moveItems: z.number().int().nonnegative(),
  keepItems: z.number().int().nonnegative(),
  blockedItems: z.number().int().nonnegative(),
  conflictItems: z.number().int().nonnegative(),
  lowConfidenceItems: z.number().int().nonnegative(),
  suggestedNewFolderCount: z.number().int().nonnegative(),
})

export const organizePlanItemSchema = z.object({
  schemaVersion: z.number().int(),
  bookmarkId: z.string(),
  title: z.string(),
  sanitizedUrl: z.string(),
  urlKeyHash: z.string(),
  hostKey: z.string().optional(),
  currentPath: z.array(z.string()),
  targetPath: z.array(z.string()),
  // Snapshot of parent at plan-build time; apply rechecks it (precondition, see 03).
  expectedParentId: z.string(),
  previousStablePath: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1),
  stabilityStatus: z.enum(['stable', 'changed', 'new', 'conflict']),
  reason: z.string(),
  action: z.enum(['move', 'keep']),
  selected: z.boolean(),
  validationStatus: z.enum(['valid', 'warning', 'blocked']),
  validationMessages: z.array(z.string()),
})

export const organizePlanSchema = z.object({
  schemaVersion: z.number().int(),
  id: z.string(),
  runId: z.string(),
  traceId: z.string(),
  createdAt: z.string(),
  items: z.array(organizePlanItemSchema),
  warnings: z.array(planWarningSchema),
  stats: planStatsSchema,
})

export type PlanWarning = z.infer<typeof planWarningSchema>
export type PlanStats = z.infer<typeof planStatsSchema>
export type OrganizePlanItem = z.infer<typeof organizePlanItemSchema>
export type OrganizePlan = z.infer<typeof organizePlanSchema>
