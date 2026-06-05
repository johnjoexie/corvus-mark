// schemaVersion is an integer migration counter (Decision D-01, see 10-execution-contracts).
export interface OrganizePlan {
  schemaVersion: number
  id: string
  runId: string
  traceId: string
  createdAt: string
  items: OrganizePlanItem[]
  warnings: PlanWarning[]
  stats: PlanStats
}

export interface OrganizePlanItem {
  schemaVersion: number
  bookmarkId: string
  title: string
  sanitizedUrl: string
  urlKeyHash: string
  hostKey?: string
  currentPath: string[]
  targetPath: string[]
  // Snapshot of parent at plan-build time; apply rechecks it (precondition, see 03).
  expectedParentId: string
  previousStablePath?: string[]
  confidence: number
  stabilityStatus: 'stable' | 'changed' | 'new' | 'conflict'
  reason: string
  action: 'move' | 'keep'
  selected: boolean
  validationStatus: 'valid' | 'warning' | 'blocked'
  validationMessages: string[]
}

export interface PlanWarning {
  code: string
  message: string
  severity: 'info' | 'warning' | 'error'
  itemIds?: string[]
}

export interface PlanStats {
  totalItems: number
  moveItems: number
  keepItems: number
  blockedItems: number
  conflictItems: number
  lowConfidenceItems: number
  suggestedNewFolderCount: number
}
