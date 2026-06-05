export interface MoveLog {
  schemaVersion: '1.0'
  id: string
  planId: string
  runId: string
  traceId: string
  createdAt: string
  status: 'pending' | 'completed' | 'partial_failed' | 'rolled_back'
  items: MoveLogItem[]
}

export interface MoveLogItem {
  schemaVersion: '1.0'
  bookmarkId: string
  title: string
  oldParentId: string
  oldIndex?: number
  newParentId: string
  newIndex?: number
  status: 'pending' | 'success' | 'failed' | 'rolled_back'
  error?: string
}
