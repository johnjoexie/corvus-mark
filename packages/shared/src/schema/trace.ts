import { z } from 'zod'

const forbiddenMetadataKeys = new Set([
  'apiKey',
  'authorization',
  'Authorization',
  'rawUrl',
  'query',
  'hash',
  'cookie',
  'pageContent',
  'fullBookmarkTree',
  'browsingHistory',
  'salt',
])

function hasForbiddenKey(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasForbiddenKey)
  if (value && typeof value === 'object') {
    return Object.entries(value).some(
      ([key, child]) => forbiddenMetadataKeys.has(key) || hasForbiddenKey(child),
    )
  }
  return false
}

export const traceEventSchema = z
  .object({
    schemaVersion: z.number().int().positive(),
    eventId: z.string().min(1),
    traceId: z.string().min(1),
    runId: z.string().min(1),
    phase: z.enum(['read', 'sanitize', 'classify', 'build_plan', 'preview', 'apply', 'rollback']),
    level: z.enum(['info', 'warning', 'error']),
    message: z.string().min(1),
    createdAt: z.string(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((event) => !hasForbiddenKey(event.metadata), {
    message: 'trace metadata contains privacy-bearing keys',
    path: ['metadata'],
  })

export type TraceEvent = z.infer<typeof traceEventSchema>
