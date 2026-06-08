import { describe, expect, it } from 'vitest'
import { flattenBookmarkTree } from './bookmarks'

describe('flattenBookmarkTree', () => {
  it('returns only leaf bookmarks with their current path', () => {
    const flattened = flattenBookmarkTree([
      {
        id: '0',
        title: 'Bookmarks Bar',
        children: [
          {
            id: '1',
            parentId: '0',
            title: 'Dev',
            children: [{ id: '2', parentId: '1', title: 'React', url: 'https://react.dev' }],
          },
        ],
      },
    ])

    expect(flattened).toEqual([
      {
        id: '2',
        parentId: '1',
        title: 'React',
        url: 'https://react.dev',
        currentPath: ['Bookmarks Bar', 'Dev'],
      },
    ])
  })
})
