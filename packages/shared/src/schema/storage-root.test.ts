import { describe, expect, it } from 'vitest'
import { measureStorageRootBytes, pruneStorageRoot, storageRootSchema } from './storage-root'

const baseRoot = {
  schemaVersion: 1,
  settings: { locale: 'en', activeDirectoryProfileId: 'dir_1', activePromptProfileId: 'prompt_1' },
  providers: [],
  providerCapabilities: [],
  runs: [],
  directoryProfiles: [],
  promptProfiles: [],
  classificationMemory: { schemaVersion: 1, entries: [] },
  moveLogs: [],
  transactions: [],
  traces: [],
  capabilities: { schemaVersion: 1, flags: {} },
  consents: [],
  policies: { schemaVersion: 1 },
  compatibility: { schemaVersion: 1 },
  migrations: [],
}

describe('storageRootSchema', () => {
  it('parses StorageRoot with integer schemaVersion', () => {
    expect(storageRootSchema.parse(baseRoot).schemaVersion).toBe(1)
  })

  it('measures serialized storage size', () => {
    expect(measureStorageRootBytes(baseRoot)).toBeGreaterThan(0)
  })

  it('prunes old rolled-back move logs while protecting live move logs', () => {
    const root = storageRootSchema.parse({
      ...baseRoot,
      moveLogs: Array.from({ length: 12 }, (_, i) => ({
        schemaVersion: 1,
        id: `move_${i}`,
        planId: 'plan_1',
        runId: 'run_1',
        traceId: 'trace_1',
        createdAt: `2026-06-05T00:${String(i).padStart(2, '0')}:00.000Z`,
        status: i === 0 ? 'completed' : 'rolled_back',
        items: [],
      })),
    })

    const pruned = pruneStorageRoot(root)

    expect(pruned.moveLogs.some((log) => log.id === 'move_0')).toBe(true)
    expect(pruned.moveLogs.length).toBeLessThanOrEqual(11)
  })

  it('keeps traces for the latest five runs only', () => {
    const root = storageRootSchema.parse({
      ...baseRoot,
      traces: Array.from({ length: 6 }, (_, i) => ({
        schemaVersion: 1,
        eventId: `evt_${i}`,
        traceId: `trace_${i}`,
        runId: `run_${i}`,
        phase: 'classify',
        level: 'info',
        message: 'batch completed',
        createdAt: `2026-06-05T00:0${i}:00.000Z`,
      })),
    })

    const pruned = pruneStorageRoot(root)

    expect([...new Set(pruned.traces.map((trace) => trace.runId))]).toEqual([
      'run_1',
      'run_2',
      'run_3',
      'run_4',
      'run_5',
    ])
  })
})
