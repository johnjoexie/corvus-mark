import type { AiAssignment, AiRequestItem } from '../schema/ai-envelope'
import type { NormalizedBookmark } from '../schema/bookmark'

export interface ClassificationBatch {
  items: AiRequestItem[]
  bookmarks: NormalizedBookmark[]
  refToBookmarkId: Map<string, string>
}

export interface MergeBatchAssignmentsInput {
  batches: ClassificationBatch[]
  assignmentsByBatch: AiAssignment[][]
  fallbackForBookmark(bookmark: NormalizedBookmark): Omit<AiAssignment, 'ref'>
}

export interface MergedBatchAssignments {
  assignments: AiAssignment[]
  refToBookmarkId: Map<string, string>
}

export function buildClassificationBatches(
  bookmarks: NormalizedBookmark[],
  maxItems: number,
): ClassificationBatch[] {
  if (maxItems <= 0) throw new Error('maxItems must be positive')

  const sorted = bookmarks
    .slice()
    .sort((a, b) => a.hostKey.localeCompare(b.hostKey) || a.title.localeCompare(b.title))

  const batches: ClassificationBatch[] = []
  for (let offset = 0; offset < sorted.length; offset += maxItems) {
    const batchBookmarks = sorted.slice(offset, offset + maxItems)
    const refToBookmarkId = new Map<string, string>()
    const items = batchBookmarks.map((bookmark, index) => {
      const ref = `b${index}`
      refToBookmarkId.set(ref, bookmark.id)
      return {
        ref,
        title: bookmark.title,
        sanitizedUrl: bookmark.sanitizedUrl,
        hostKey: bookmark.hostKey,
        currentPath: bookmark.currentPath,
      }
    })
    batches.push({ items, bookmarks: batchBookmarks, refToBookmarkId })
  }

  return batches
}

export function mergeBatchAssignmentsWithFallback(
  input: MergeBatchAssignmentsInput,
): MergedBatchAssignments {
  const assignments: AiAssignment[] = []
  const refToBookmarkId = new Map<string, string>()

  input.batches.forEach((batch, batchIndex) => {
    const batchAssignments = input.assignmentsByBatch[batchIndex] ?? []
    const byRef = new Map(batchAssignments.map((assignment) => [assignment.ref, assignment]))

    batch.items.forEach((item, itemIndex) => {
      const globalRef = `b${batchIndex}_${item.ref}`
      const bookmark = batch.bookmarks[itemIndex]
      if (!bookmark) return
      const assignment = byRef.get(item.ref)
      assignments.push(
        assignment
          ? { ...assignment, ref: globalRef }
          : { ...input.fallbackForBookmark(bookmark), ref: globalRef },
      )
      refToBookmarkId.set(globalRef, bookmark.id)
    })
  })

  return { assignments, refToBookmarkId }
}
