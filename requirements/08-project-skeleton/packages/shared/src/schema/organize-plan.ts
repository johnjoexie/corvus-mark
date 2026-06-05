export interface OrganizePlan {
  schemaVersion: '1.0'
  id: string
  runId: string
  traceId: string
  createdAt: string
  items: OrganizePlanItem[]
  warnings: PlanWarning[]
  stats: PlanStats
}

export interface OrganizePlanItem {
  schemaVersion: '1.0'
  bookmarkId: string
  title: string
  sanitizedUrl: string
  urlKeyHash: string
  hostKey?: string
  currentPath: string[]
  targetPath: string[]
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
