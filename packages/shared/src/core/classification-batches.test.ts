import { describe, expect, it } from 'vitest'
import { buildClassificationBatches, mergeBatchAssignmentsWithFallback } from './classification-batches'
import type { NormalizedBookmark } from '../schema/bookmark'

function bookmark(id: string, hostKey: string, title: string): NormalizedBookmark {
  return {
    schemaVersion: 1,
    id,
    browserId: id,
    parentId: 'parent_1',
    index: 0,
    title,
    rawUrl: `https://${hostKey}/${id}`,
    sanitizedUrl: `https://${hostKey}/${id}`,
    urlKeyHash: `hash_${id}`,
    hostKey,
    currentPath: ['Bookmarks Bar'],
    isValidUrl: true,
    createdAt: '2026-06-05T00:00:00.000Z',
    updatedAt: '2026-06-05T00:00:00.000Z',
  }
}

describe('buildClassificationBatches', () => {
  it('splits bookmarks into stable batches capped at maxItems and preserves ref joins', () => {
    const bookmarks = Array.from({ length: 81 }, (_, index) =>
      bookmark(`bm_${index}`, index % 2 === 0 ? 'z.dev' : 'a.dev', `Title ${80 - index}`),
    )

    const batches = buildClassificationBatches(bookmarks, 80)

    expect(batches).toHaveLength(2)
    expect(batches[0]?.items).toHaveLength(80)
    expect(batches[1]?.items).toHaveLength(1)

    const joinedIds = batches.flatMap((batch) =>
      batch.items.map((item) => batch.refToBookmarkId.get(item.ref)),
    )
    expect(new Set(joinedIds).size).toBe(81)
    expect(joinedIds).toEqual(
      bookmarks
        .slice()
        .sort((a, b) => a.hostKey.localeCompare(b.hostKey) || a.title.localeCompare(b.title))
        .map((item) => item.id),
    )
  })

  it('fills missing AI refs with fallback assignments so joins lose no bookmarks', () => {
    const bookmarks = [bookmark('bm_1', 'a.dev', 'A'), bookmark('bm_2', 'b.dev', 'B')]
    const [batch] = buildClassificationBatches(bookmarks, 80)

    const merged = mergeBatchAssignmentsWithFallback({
      batches: [batch!],
      assignmentsByBatch: [
        [
          {
            ref: 'b0',
            targetPath: ['Bookmarks Bar', 'Dev'],
            confidence: 0.9,
            reason: 'ai',
            isNewFolder: false,
          },
        ],
      ],
      fallbackForBookmark: (normalizedBookmark) => ({
        targetPath: ['Uncategorized'],
        confidence: 0.5,
        reason: `fallback:${normalizedBookmark.id}`,
        isNewFolder: false,
      }),
    })

    expect(merged.assignments).toHaveLength(2)
    expect([...merged.refToBookmarkId.values()].sort()).toEqual(['bm_1', 'bm_2'])
    expect(merged.assignments.map((assignment) => assignment.targetPath)).toEqual([
      ['Bookmarks Bar', 'Dev'],
      ['Uncategorized'],
    ])
  })
})
