import type { BookmarkManagerPort } from '../ports'
import type { MoveLog, MoveLogItem } from '../schema/move-log'
import { moveLogSchema } from '../schema/move-log'
import type { OrganizePlan } from '../schema/organize-plan'

export interface MoveLogStore {
  saveMoveLog(moveLog: MoveLog): Promise<void>
}

export interface ApplySelectedPlanItemsInput {
  plan: OrganizePlan
  bookmarkManager: BookmarkManagerPort
  moveLogStore: MoveLogStore
  resolveTargetParentId(item: OrganizePlan['items'][number]): Promise<string>
  createdAt: string
  moveLogId: string
}

export interface RollbackMoveLogInput {
  moveLog: MoveLog
  bookmarkManager: BookmarkManagerPort
  moveLogStore: MoveLogStore
}

async function findBookmark(bookmarkManager: BookmarkManagerPort, id: string) {
  const nodes = await bookmarkManager.getTree()
  return nodes.find((node) => node.id === id)
}

export async function applySelectedPlanItems(input: ApplySelectedPlanItemsInput): Promise<MoveLog> {
  const selectedItems = input.plan.items
    .filter((item) => item.selected && item.action === 'move' && item.validationStatus !== 'blocked')
    .sort((a, b) => a.bookmarkId.localeCompare(b.bookmarkId))

  const moveLog: MoveLog = moveLogSchema.parse({
    schemaVersion: 1,
    id: input.moveLogId,
    planId: input.plan.id,
    runId: input.plan.runId,
    traceId: input.plan.traceId,
    createdAt: input.createdAt,
    status: 'pending',
    items: [],
  })
  await input.moveLogStore.saveMoveLog(moveLog)

  const targetParentIds = new Map<string, string>()
  for (const item of selectedItems) {
    targetParentIds.set(item.bookmarkId, await input.resolveTargetParentId(item))
  }

  for (const item of selectedItems) {
    const current = await findBookmark(input.bookmarkManager, item.bookmarkId)
    const newParentId = targetParentIds.get(item.bookmarkId)
    if (!newParentId) throw new Error(`target parent not resolved: ${item.bookmarkId}`)
    const logItem: MoveLogItem = {
      schemaVersion: 1,
      bookmarkId: item.bookmarkId,
      title: item.title,
      oldParentId: item.expectedParentId,
      newParentId,
      status: 'pending',
    }
    moveLog.items.push(logItem)
    await input.moveLogStore.saveMoveLog(moveLog)

    if (!current) {
      logItem.status = 'skipped_stale_missing'
      await input.moveLogStore.saveMoveLog(moveLog)
      continue
    }
    if (current.parentId === newParentId) {
      logItem.status = 'already_satisfied'
      await input.moveLogStore.saveMoveLog(moveLog)
      continue
    }
    if (current.parentId !== item.expectedParentId) {
      logItem.status = 'skipped_stale_moved'
      await input.moveLogStore.saveMoveLog(moveLog)
      continue
    }

    try {
      await input.bookmarkManager.moveBookmark(item.bookmarkId, { parentId: newParentId })
      logItem.status = 'success'
    } catch (error) {
      logItem.status = 'failed'
      logItem.error = error instanceof Error ? error.message : String(error)
    }
    await input.moveLogStore.saveMoveLog(moveLog)
  }

  moveLog.status = moveLog.items.some((item) => item.status === 'failed') ? 'partial_failed' : 'completed'
  await input.moveLogStore.saveMoveLog(moveLog)
  return moveLogSchema.parse(moveLog)
}

export async function rollbackMoveLog(input: RollbackMoveLogInput): Promise<MoveLog> {
  const moveLog = moveLogSchema.parse(input.moveLog)

  for (const item of moveLog.items.slice().reverse()) {
    if (item.status !== 'success') continue

    const current = await findBookmark(input.bookmarkManager, item.bookmarkId)
    if (!current || current.parentId !== item.newParentId) {
      item.status = 'rollback_skipped'
      await input.moveLogStore.saveMoveLog(moveLog)
      continue
    }

    await input.bookmarkManager.moveBookmark(item.bookmarkId, { parentId: item.oldParentId })
    item.status = 'rolled_back'
    await input.moveLogStore.saveMoveLog(moveLog)
  }

  moveLog.status = 'rolled_back'
  await input.moveLogStore.saveMoveLog(moveLog)
  return moveLogSchema.parse(moveLog)
}
