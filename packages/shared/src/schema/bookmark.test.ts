import { describe, expect, it } from 'vitest'
import {
  browserBookmarkNodeSchema,
  normalizedBookmarkSchema,
  roundTripNormalizedBookmark,
} from './bookmark'

const validBrowserBookmarkNode = {
  id: '12',
  parentId: '1',
  index: 0,
  title: 'React docs',
  url: 'https://react.dev/learn',
  dateAdded: 1764873600000,
}

const validNormalizedBookmark = {
  schemaVersion: 1,
  id: 'bm_1',
  browserId: '12',
  parentId: '1',
  index: 0,
  title: 'React docs',
  rawUrl: 'https://react.dev/learn?utm_source=x',
  sanitizedUrl: 'https://react.dev/learn',
  urlKeyHash: 'hash_1',
  hostKey: 'react.dev',
  currentPath: ['Bookmarks Bar', 'Dev'],
  isValidUrl: true,
  createdAt: '2026-06-05T00:00:00.000Z',
  updatedAt: '2026-06-05T00:00:00.000Z',
}

describe('browserBookmarkNodeSchema', () => {
  it('parses a leaf browser bookmark node', () => {
    expect(browserBookmarkNodeSchema.parse(validBrowserBookmarkNode).url).toBe(
      'https://react.dev/learn',
    )
  })

  it('rejects a folder when a leaf bookmark is required', () => {
    expect(
      browserBookmarkNodeSchema.safeParse({
        id: '20',
        parentId: '1',
        title: 'Dev',
        children: [validBrowserBookmarkNode],
      }).success,
    ).toBe(false)
  })
})

describe('normalizedBookmarkSchema', () => {
  it('round-trips a normalized bookmark', () => {
    expect(roundTripNormalizedBookmark(validNormalizedBookmark)).toEqual(validNormalizedBookmark)
  })

  it('rejects an empty current path', () => {
    expect(
      normalizedBookmarkSchema.safeParse({
        ...validNormalizedBookmark,
        currentPath: [],
      }).success,
    ).toBe(false)
  })
})
