import { describe, expect, it } from 'vitest'
import { ChromiumBookmarkAdapter } from './chromium-bookmark-adapter'

describe('ChromiumBookmarkAdapter', () => {
  it('wraps bookmarks getTree, create, and move', async () => {
    const calls: string[] = []
    const adapter = new ChromiumBookmarkAdapter({
      bookmarks: {
        getTree: async () => {
          calls.push('getTree')
          return [{ id: '0', title: 'Bookmarks Bar', children: [] }]
        },
        create: async (input) => {
          calls.push(`create:${input.parentId}:${input.title}`)
          return { id: '1', parentId: input.parentId, title: input.title }
        },
        move: async (id, target) => {
          calls.push(`move:${id}:${target.parentId}`)
          return { id, parentId: target.parentId, title: 'React', url: 'https://react.dev' }
        },
      },
    })

    await expect(adapter.getTree()).resolves.toHaveLength(1)
    await expect(adapter.createFolder('0', 'Dev')).resolves.toMatchObject({ id: '1' })
    await expect(adapter.moveBookmark('b1', { parentId: '1' })).resolves.toMatchObject({
      parentId: '1',
    })
    expect(calls).toEqual(['getTree', 'create:0:Dev', 'move:b1:1'])
  })
})
