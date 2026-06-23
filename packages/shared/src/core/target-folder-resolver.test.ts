import { describe, expect, it } from 'vitest'
import { resolveTargetParentId } from './target-folder-resolver'
import type { BookmarkManagerPort, BrowserBookmarkTreeNode } from '../ports'

class MemoryBookmarkManager implements BookmarkManagerPort {
  private nextId = 100

  constructor(private readonly roots: BrowserBookmarkTreeNode[]) {}

  async getTree(): Promise<BrowserBookmarkTreeNode[]> {
    return this.roots
  }

  async createFolder(parentId: string, title: string): Promise<BrowserBookmarkTreeNode> {
    const parent = findNode(this.roots, parentId)
    if (!parent) throw new Error(`parent not found: ${parentId}`)
    const folder = { id: `folder_${this.nextId++}`, parentId, title, children: [] }
    parent.children = [...(parent.children ?? []), folder]
    return folder
  }

  async moveBookmark(id: string): Promise<BrowserBookmarkTreeNode> {
    const node = findNode(this.roots, id)
    if (!node) throw new Error(`bookmark not found: ${id}`)
    return node
  }
}

function findNode(nodes: BrowserBookmarkTreeNode[], id: string): BrowserBookmarkTreeNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node
    const child = findNode(node.children ?? [], id)
    if (child) return child
  }
  return undefined
}

describe('resolveTargetParentId', () => {
  it('reuses existing folders case-insensitively and creates missing path segments', async () => {
    const bookmarks = new MemoryBookmarkManager([
      {
        id: '1',
        title: 'Bookmarks Bar',
        children: [{ id: '10', parentId: '1', title: 'Dev', children: [] }],
      },
    ])

    const targetParentId = await resolveTargetParentId(bookmarks, [
      'bookmarks bar',
      'dev',
      'Frontend',
    ])

    expect(targetParentId).toBe('folder_100')
    const root = (await bookmarks.getTree())[0]
    expect(root?.children?.map((node) => node.title)).toEqual(['Dev'])
    expect(root?.children?.[0]?.children?.map((node) => node.title)).toEqual(['Frontend'])
  })

  it('returns an existing target folder without creating duplicates', async () => {
    const bookmarks = new MemoryBookmarkManager([
      {
        id: '1',
        title: 'Bookmarks Bar',
        children: [
          {
            id: '10',
            parentId: '1',
            title: 'Dev',
            children: [{ id: '11', parentId: '10', title: 'Frontend', children: [] }],
          },
        ],
      },
    ])

    await expect(
      resolveTargetParentId(bookmarks, ['Bookmarks Bar', 'dev', 'frontend']),
    ).resolves.toBe('11')
  })
})
