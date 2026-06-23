import { describe, expect, it } from 'vitest'
import { applySelectedPlanItems, rollbackMoveLog, type MoveLogStore } from './apply-rollback'
import type { BookmarkManagerPort, BrowserBookmarkTreeNode } from '../ports'
import type { OrganizePlan } from '../schema/organize-plan'

class MemoryBookmarkManager implements BookmarkManagerPort {
  nodes = new Map<string, BrowserBookmarkTreeNode>()
  operations: string[] = []
  failMoveIds = new Set<string>()

  constructor(nodes: BrowserBookmarkTreeNode[]) {
    nodes.forEach((node) => this.nodes.set(node.id, { ...node }))
  }

  async getTree(): Promise<BrowserBookmarkTreeNode[]> {
    return [...this.nodes.values()]
  }

  async createFolder(parentId: string, title: string): Promise<BrowserBookmarkTreeNode> {
    this.operations.push(`create:${title}`)
    const id = `folder_${this.nodes.size + 1}`
    const node = { id, parentId, title }
    this.nodes.set(id, node)
    return node
  }

  async moveBookmark(id: string, target: { parentId: string }): Promise<BrowserBookmarkTreeNode> {
    this.operations.push(`move:${id}`)
    if (this.failMoveIds.has(id)) throw new Error(`injected move failure: ${id}`)
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

function buildTwoItemPlan(): OrganizePlan {
  return {
    ...plan,
    stats: { ...plan.stats, totalItems: 2, moveItems: 2 },
    items: [
      plan.items[0]!,
      {
        ...plan.items[0]!,
        bookmarkId: 'b2',
        title: 'TypeScript',
        sanitizedUrl: 'https://typescriptlang.org',
        urlKeyHash: 'hash_2',
        hostKey: 'typescriptlang.org',
      },
    ],
  }
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

  it('resolves all target folders before moving any bookmark', async () => {
    const bookmarks = new MemoryBookmarkManager([
      { id: 'b1', parentId: 'old', title: 'React', url: 'https://react.dev' },
      { id: 'b2', parentId: 'old', title: 'TypeScript', url: 'https://typescriptlang.org' },
    ])
    const twoItemPlan = buildTwoItemPlan()

    await applySelectedPlanItems({
      plan: twoItemPlan,
      bookmarkManager: bookmarks,
      moveLogStore: new MemoryMoveLogStore(),
      resolveTargetParentId: async (item) => {
        bookmarks.operations.push(`resolve:${item.bookmarkId}`)
        return `new_${item.bookmarkId}`
      },
      createdAt: '2026-06-05T00:01:00.000Z',
      moveLogId: 'move_1',
    })

    expect(bookmarks.operations).toEqual(['resolve:b1', 'resolve:b2', 'move:b1', 'move:b2'])
  })

  it('keeps a truthful MoveLog when a later move fails so successful moves can roll back', async () => {
    const bookmarks = new MemoryBookmarkManager([
      { id: 'b1', parentId: 'old', title: 'React', url: 'https://react.dev' },
      { id: 'b2', parentId: 'old', title: 'TypeScript', url: 'https://typescriptlang.org' },
    ])
    bookmarks.failMoveIds.add('b2')

    const moveLog = await applySelectedPlanItems({
      plan: buildTwoItemPlan(),
      bookmarkManager: bookmarks,
      moveLogStore: new MemoryMoveLogStore(),
      resolveTargetParentId: async (item) => `new_${item.bookmarkId}`,
      createdAt: '2026-06-05T00:01:00.000Z',
      moveLogId: 'move_1',
    })

    expect(moveLog.status).toBe('partial_failed')
    expect(moveLog.items.map((item) => item.status)).toEqual(['success', 'failed'])
    expect(bookmarks.nodes.get('b1')?.parentId).toBe('new_b1')
    expect(bookmarks.nodes.get('b2')?.parentId).toBe('old')

    const rolledBack = await rollbackMoveLog({
      moveLog,
      bookmarkManager: bookmarks,
      moveLogStore: new MemoryMoveLogStore(),
    })

    expect(rolledBack.items.map((item) => item.status)).toEqual(['rolled_back', 'failed'])
    expect(bookmarks.nodes.get('b1')?.parentId).toBe('old')
    expect(bookmarks.nodes.get('b2')?.parentId).toBe('old')
  })

  it('marks an already-applied item as already_satisfied when re-running the same plan', async () => {
    const bookmarks = new MemoryBookmarkManager([
      { id: 'b1', parentId: 'new', title: 'React', url: 'https://react.dev' },
    ])

    const moveLog = await applySelectedPlanItems({
      plan,
      bookmarkManager: bookmarks,
      moveLogStore: new MemoryMoveLogStore(),
      resolveTargetParentId: async () => 'new',
      createdAt: '2026-06-05T00:01:00.000Z',
      moveLogId: 'move_1',
    })

    expect(moveLog.items[0]?.status).toBe('already_satisfied')
    expect(bookmarks.operations).not.toContain('move:b1')
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
