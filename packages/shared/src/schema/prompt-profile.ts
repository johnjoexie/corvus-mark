import { z } from 'zod'

export const promptProfileSchema = z.object({
  schemaVersion: z.number().int().positive(),
  id: z.string().min(1),
  name: z.string().min(1),
  promptVersion: z.string().min(1),
  locale: z.string().min(1),
  systemTemplate: z.string().min(1),
  responseFormatHint: z.enum(['json_object', 'none']),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type PromptProfile = z.infer<typeof promptProfileSchema>
