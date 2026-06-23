import { describe, expect, it } from 'vitest'
import { acquireTaskLock, releaseTaskLock, type TaskLock, type TaskLockStore } from './task-lock'

class MemoryTaskLockStore implements TaskLockStore {
  lock: TaskLock | undefined

  async getTaskLock(): Promise<TaskLock | undefined> {
    return this.lock
  }

  async setTaskLock(lock: TaskLock): Promise<void> {
    this.lock = lock
  }

  async clearTaskLock(lockId: string): Promise<void> {
    if (this.lock?.lockId === lockId) this.lock = undefined
  }
}

describe('task lock', () => {
  it('acquires and releases an empty lock', async () => {
    const store = new MemoryTaskLockStore()

    const lock = await acquireTaskLock({
      store,
      lockId: 'run_1',
      kind: 'apply',
      acquiredAt: '2026-06-05T00:00:00.000Z',
      ttlMs: 120000,
    })

    expect(store.lock).toEqual(lock)
    await releaseTaskLock({ store, lockId: lock.lockId })
    expect(store.lock).toBeUndefined()
  })

  it('rejects an unexpired lock held by another run', async () => {
    const store = new MemoryTaskLockStore()
    store.lock = {
      schemaVersion: 1,
      lockId: 'run_active',
      kind: 'apply',
      acquiredAt: '2026-06-05T00:00:00.000Z',
      ttlMs: 120000,
    }

    await expect(
      acquireTaskLock({
        store,
        lockId: 'run_2',
        kind: 'rollback',
        acquiredAt: '2026-06-05T00:01:00.000Z',
        ttlMs: 120000,
      }),
    ).rejects.toThrow('another bookmark task is active')
    expect(store.lock.lockId).toBe('run_active')
  })

  it('reclaims an expired lock', async () => {
    const store = new MemoryTaskLockStore()
    store.lock = {
      schemaVersion: 1,
      lockId: 'run_stale',
      kind: 'apply',
      acquiredAt: '2026-06-05T00:00:00.000Z',
      ttlMs: 120000,
    }

    const lock = await acquireTaskLock({
      store,
      lockId: 'run_2',
      kind: 'rollback',
      acquiredAt: '2026-06-05T00:03:00.001Z',
      ttlMs: 120000,
    })

    expect(lock.lockId).toBe('run_2')
    expect(store.lock?.kind).toBe('rollback')
  })
})
