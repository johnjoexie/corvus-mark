export interface TaskLock {
  schemaVersion: 1
  lockId: string
  kind: 'apply' | 'rollback'
  acquiredAt: string
  ttlMs: number
}

export interface TaskLockStore {
  getTaskLock(): Promise<TaskLock | undefined>
  setTaskLock(lock: TaskLock): Promise<void>
  clearTaskLock(lockId: string): Promise<void>
}

export interface AcquireTaskLockInput {
  store: TaskLockStore
  lockId: string
  kind: TaskLock['kind']
  acquiredAt: string
  ttlMs: number
}

export interface ReleaseTaskLockInput {
  store: TaskLockStore
  lockId: string
}

function isLockActive(lock: TaskLock, nowIso: string): boolean {
  return Date.parse(nowIso) - Date.parse(lock.acquiredAt) <= lock.ttlMs
}

export async function acquireTaskLock(input: AcquireTaskLockInput): Promise<TaskLock> {
  const current = await input.store.getTaskLock()
  if (current && isLockActive(current, input.acquiredAt)) {
    throw new Error('another bookmark task is active')
  }

  const lock: TaskLock = {
    schemaVersion: 1,
    lockId: input.lockId,
    kind: input.kind,
    acquiredAt: input.acquiredAt,
    ttlMs: input.ttlMs,
  }
  await input.store.setTaskLock(lock)
  return lock
}

export async function releaseTaskLock(input: ReleaseTaskLockInput): Promise<void> {
  await input.store.clearTaskLock(input.lockId)
}
