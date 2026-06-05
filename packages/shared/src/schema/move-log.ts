// schemaVersion is an integer migration counter (Decision D-01, see 10-execution-contracts).
export interface MoveLog {
  schemaVersion: number
  id: string
  planId: string
  runId: string
  traceId: string
  createdAt: string
  status: 'pending' | 'completed' | 'partial_failed' | 'rolled_back'
  items: MoveLogItem[]
}

export interface MoveLogItem {
  schemaVersion: number
  bookmarkId: string
  title: string
  oldParentId: string
  // oldIndex/newIndex are kept for diagnostics only; v0.1 does NOT restore position (see 03).
  oldIndex?: number
  newParentId: string
  newIndex?: number
  status:
    | 'pending'
    | 'success'
    | 'failed'
    | 'rolled_back'
    | 'skipped_stale_missing'
    | 'skipped_stale_moved'
    | 'already_satisfied'
    | 'rollback_skipped'
  error?: string
}
