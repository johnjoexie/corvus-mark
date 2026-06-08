import type { AiAssignment } from '../schema/ai-envelope'
import type { NormalizedBookmark } from '../schema/bookmark'
import type { OrganizePlan, OrganizePlanItem } from '../schema/organize-plan'
import { organizePlanSchema } from '../schema/organize-plan'

export interface BuildOrganizePlanInput {
  runId: string
  traceId: string
  planId: string
  createdAt: string
  bookmarks: NormalizedBookmark[]
  assignments: AiAssignment[]
  refToBookmarkId: Map<string, string>
  autoSelectConfidenceThreshold: number
  newFolderConfidenceThreshold: number
  maxDepth: number
  maxNewFolders: number
}

export function buildOrganizePlan(input: BuildOrganizePlanInput): OrganizePlan {
  const byId = new Map(input.bookmarks.map((bookmark) => [bookmark.id, bookmark]))
  let newFolderCount = 0

  const items: OrganizePlanItem[] = input.assignments.flatMap((assignment) => {
    const bookmarkId = input.refToBookmarkId.get(assignment.ref)
    const bookmark = bookmarkId ? byId.get(bookmarkId) : undefined
    if (!bookmark) return []

    const validationMessages: string[] = []
    if (assignment.targetPath.length > input.maxDepth) {
      validationMessages.push('targetPath exceeds maxDepth')
    }
    if (assignment.isNewFolder) {
      newFolderCount += 1
    }
    if (assignment.isNewFolder && assignment.confidence < input.newFolderConfidenceThreshold) {
      validationMessages.push('new folder confidence below threshold')
    }
    if (newFolderCount > input.maxNewFolders) {
      validationMessages.push('maxNewFolders exceeded')
    }

    const blocked = validationMessages.length > 0
    const lowConfidence = assignment.confidence < input.autoSelectConfidenceThreshold
    const action = blocked || lowConfidence ? 'keep' : 'move'

    return [
      {
        schemaVersion: 1,
        bookmarkId: bookmark.id,
        title: bookmark.title,
        sanitizedUrl: bookmark.sanitizedUrl,
        urlKeyHash: bookmark.urlKeyHash,
        hostKey: bookmark.hostKey,
        currentPath: bookmark.currentPath,
        targetPath: assignment.targetPath,
        expectedParentId: bookmark.parentId,
        confidence: assignment.confidence,
        stabilityStatus: 'new',
        reason: assignment.reason,
        action,
        selected: action === 'move',
        validationStatus: blocked ? 'blocked' : lowConfidence ? 'warning' : 'valid',
        validationMessages,
      },
    ]
  })

  const stats = {
    totalItems: items.length,
    moveItems: items.filter((item) => item.action === 'move').length,
    keepItems: items.filter((item) => item.action === 'keep').length,
    blockedItems: items.filter((item) => item.validationStatus === 'blocked').length,
    conflictItems: 0,
    lowConfidenceItems: items.filter(
      (item) => item.confidence < input.autoSelectConfidenceThreshold,
    ).length,
    suggestedNewFolderCount: newFolderCount,
  }

  return organizePlanSchema.parse({
    schemaVersion: 1,
    id: input.planId,
    runId: input.runId,
    traceId: input.traceId,
    createdAt: input.createdAt,
    items,
    warnings: [],
    stats,
  })
}
