import { z } from 'zod'

// AI request/response envelopes (see 01). The model only proposes targetPath/confidence/
// reason; deterministic local code builds and validates the OrganizePlan.

export const aiRequestItemSchema = z.object({
  ref: z.string(),
  title: z.string(),
  sanitizedUrl: z.string(),
  hostKey: z.string().optional(),
  currentPath: z.array(z.string()),
})

export const aiRequestEnvelopeSchema = z.object({
  schemaVersion: z.literal(1),
  envelopeId: z.string(),
  runId: z.string(),
  traceId: z.string(),
  createdAt: z.string(),
  task: z.literal('classify_bookmarks'),
  locale: z.string(),
  directory: z.object({
    mode: z.enum(['ai_recommend', 'fallback']),
    allowedRoots: z.array(z.string()),
    existingPaths: z.array(z.array(z.string())),
    maxDepth: z.number().int().positive(),
    maxNewFolders: z.number().int().nonnegative(),
  }),
  items: z.array(aiRequestItemSchema),
  budget: z.object({
    maxItems: z.number().int().positive(),
    maxOutputTokens: z.number().int().positive(),
  }),
})

export const aiAssignmentSchema = z.object({
  ref: z.string(),
  targetPath: z.array(z.string()).min(1),
  confidence: z.number().min(0).max(1),
  reason: z.string().max(200),
  isNewFolder: z.boolean(),
})

export const aiResponseEnvelopeSchema = z.object({
  schemaVersion: z.literal(1),
  envelopeId: z.string(),
  assignments: z.array(aiAssignmentSchema),
})

export type AiRequestItem = z.infer<typeof aiRequestItemSchema>
export type AiRequestEnvelope = z.infer<typeof aiRequestEnvelopeSchema>
export type AiAssignment = z.infer<typeof aiAssignmentSchema>
export type AiResponseEnvelope = z.infer<typeof aiResponseEnvelopeSchema>

/**
 * Parse a model response against the strict schema. Throws on anything off-contract
 * (bad_json in the error taxonomy, see 01 §6). Callers drop bad batches to fallback.
 */
export function parseAiResponse(raw: unknown): AiResponseEnvelope {
  return aiResponseEnvelopeSchema.parse(raw)
}
