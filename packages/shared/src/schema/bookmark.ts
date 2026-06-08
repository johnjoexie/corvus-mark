import { z } from 'zod'

// A browser bookmark leaf from the WebExtension bookmarks API. Folder nodes are
// modeled separately later; v0.1 apply only moves leaves.
export const browserBookmarkNodeSchema = z.object({
  id: z.string().min(1),
  parentId: z.string().min(1),
  index: z.number().int().nonnegative().optional(),
  title: z.string(),
  url: z.string().min(1),
  dateAdded: z.number().nonnegative().optional(),
})

// Local normalized bookmark shape used after reading and sanitizing browser nodes.
export const normalizedBookmarkSchema = z.object({
  schemaVersion: z.number().int().positive(),
  id: z.string().min(1),
  browserId: z.string().min(1),
  parentId: z.string().min(1),
  index: z.number().int().nonnegative().optional(),
  title: z.string(),
  rawUrl: z.string().min(1),
  sanitizedUrl: z.string(),
  urlKeyHash: z.string(),
  hostKey: z.string(),
  currentPath: z.array(z.string().min(1)).min(1),
  isValidUrl: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type BrowserBookmarkNode = z.infer<typeof browserBookmarkNodeSchema>
export type NormalizedBookmark = z.infer<typeof normalizedBookmarkSchema>

export function roundTripNormalizedBookmark(value: unknown): NormalizedBookmark {
  return normalizedBookmarkSchema.parse(value)
}
