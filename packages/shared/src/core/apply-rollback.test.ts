import { describe, expect, it } from 'vitest'
import { applySelectedPlanItems, rollbackMoveLog, type MoveLogStore } from './apply-rollback'
import type { BookmarkManagerPort, BrowserBookmarkTreeNode } from '../ports'
import type { OrganizePlan } from '../schema/organize-plan'

class MemoryBookmarkManager implements BookmarkManagerPort {
  nodes = new Map<string, BrowserBookmarkTreeNode>()

  constructor(nodes: BrowserBookmarkTreeNode[]) {
    nodes.forEach((node) => this.nodes.set(node.id, { ...node }))
  }

  async getTree(): Promise<BrowserBookmarkTreeNode[]> {
    return [...this.nodes.values()]
  }

  async createFolder(parentId: string, title: string): Promise<BrowserBookmarkTreeNode> {
    const id = `folder_${this.nodes.size + 1}`
    const node = { id, parentId, title }
    this.nodes.set(id, node)
    return node
  }

  async moveBookmark(id: string, target: { parentId: string }): Promise<BrowserBookmarkTreeNode> {
    const node = this.nodes.get(id)
    if (!node) throw new Error('missing bookmark')
    const moved = { ...node, parentId: target.parentId }
    this.nodes.set(id, moved)
    return moved
  }
}

class MemoryMoveLogStore implements MoveLogStore {
  writes: unknown[] = []

  async saveMoveLog(value: unknown): Promise<void> {
    this.writes.push(JSON.parse(JSON.stringify(value)))
  }
}

const plan: OrganizePlan = {
  schemaVersion: 1,
  id: 'plan_1',
  runId: 'run_1',
  traceId: 'trace_1',
  createdAt: '2026-06-05T00:00:00.000Z',
  warnings: [],
  stats: {
    totalItems: 1,
    moveItems: 1,
    keepItems: 0,
    blockedItems: 0,
    conflictItems: 0,
    lowConfidenceItems: 0,
    suggestedNewFolderCount: 0,
  },
  items: [
    {
      schemaVersion: 1,
      bookmarkId: 'b1',
      title: 'React',
      sanitizedUrl: 'https://react.dev',
      urlKeyHash: 'hash_1',
      hostKey: 'react.dev',
      currentPath: ['Bookmarks Bar', 'Dev'],
      targetPath: ['Bookmarks Bar', 'Frontend'],
      expectedParentId: 'old',
      confidence: 0.9,
      stabilityStatus: 'new',
      reason: 'docs',
      action: 'move',
      selected: true,
      validationStatus: 'valid',
      validationMessages: [],
    },
  ],
}

describe('applySelectedPlanItems', () => {
  it('persists MoveLog before moving a bookmark', async () => {
    const bookmarks = new MemoryBookmarkManager([
      { id: 'b1', parentId: 'old', title: 'React', url: 'https://react.dev' },
    ])
    const store = new MemoryMoveLogStore()

    const moveLog = await applySelectedPlanItems({
      plan,
      bookmarkManager: bookmarks,
      moveLogStore: store,
      resolveTargetParentId: async () => 'new',
      createdAt: '2026-06-05T00:01:00.000Z',
      moveLogId: 'move_1',
    })

    expect(store.writes.length).toBeGreaterThanOrEqual(2)
    expect(moveLog.items[0]?.status).toBe('success')
    expect(bookmarks.nodes.get('b1')?.parentId).toBe('new')
  })

  it('skips stale moved bookmarks instead of forcing them', async () => {
    const bookmarks = new MemoryBookmarkManager([
      { id: 'b1', parentId: 'somewhere_else', title: 'React', url: 'https://react.dev' },
    ])

    const moveLog = await applySelectedPlanItems({
      plan,
      bookmarkManager: bookmarks,
      moveLogStore: new MemoryMoveLogStore(),
      resolveTargetParentId: async () => 'new',
      createdAt: '2026-06-05T00:01:00.000Z',
      moveLogId: 'move_1',
    })

    expect(moveLog.items[0]?.status).toBe('skipped_stale_moved')
    expect(bookmarks.nodes.get('b1')?.parentId).toBe('somewhere_else')
  })
})

describe('rollbackMoveLog', () => {
  it('rolls successful moves back to the old parent', async () => {
    const bookmarks = new MemoryBookmarkManager([
      { id: 'b1', parentId: 'new', title: 'React', url: 'https://react.dev' },
    ])
    const applied = await applySelectedPlanItems({
      plan,
      bookmarkManager: new MemoryBookmarkManager([
        { id: 'b1', parentId: 'old', title: 'React', url: 'https://react.dev' },
      ]),
      moveLogStore: new MemoryMoveLogStore(),
      resolveTargetParentId: async () => 'new',
      createdAt: '2026-06-05T00:01:00.000Z',
      moveLogId: 'move_1',
    })

    const rolledBack = await rollbackMoveLog({
      moveLog: applied,
      bookmarkManager: bookmarks,
      moveLogStore: new MemoryMoveLogStore(),
    })

    expect(rolledBack.status).toBe('rolled_back')
    expect(bookmarks.nodes.get('b1')?.parentId).toBe('old')
  })
})
