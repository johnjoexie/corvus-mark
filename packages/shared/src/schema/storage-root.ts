import { z } from 'zod'
import { directoryProfileSchema } from './directory-profile'
import { diagnosticPrivacyStatementSchema } from './diagnostic-report'
import { moveLogSchema } from './move-log'
import { organizeRunRecordSchema } from './organize-run-record'
import { promptProfileSchema } from './prompt-profile'
import { traceEventSchema } from './trace'

const unknownRecordSchema = z.record(z.string(), z.unknown())

export const classificationMemoryEntrySchema = z.object({
  schemaVersion: z.number().int().positive(),
  urlKeyHash: z.string().min(1),
  targetPath: z.array(z.string().min(1)).min(1),
  confirmedAt: z.string(),
  lastUsedAt: z.string(),
})

export const storageRootSchema = z.object({
  schemaVersion: z.number().int().positive(),
  settings: unknownRecordSchema,
  providers: z.array(unknownRecordSchema),
  providerCapabilities: z.array(unknownRecordSchema),
  runs: z.array(organizeRunRecordSchema),
  directoryProfiles: z.array(directoryProfileSchema),
  promptProfiles: z.array(promptProfileSchema),
  classificationMemory: z.object({
    schemaVersion: z.number().int().positive(),
    entries: z.array(classificationMemoryEntrySchema),
  }),
  moveLogs: z.array(moveLogSchema),
  transactions: z.array(unknownRecordSchema),
  traces: z.array(traceEventSchema),
  capabilities: z.object({
    schemaVersion: z.number().int().positive(),
    flags: z.record(z.string(), z.boolean()),
  }),
  consents: z.array(unknownRecordSchema),
  policies: z.object({
    schemaVersion: z.number().int().positive(),
    diagnosticPrivacy: diagnosticPrivacyStatementSchema.optional(),
  }),
  compatibility: z.object({ schemaVersion: z.number().int().positive() }),
  migrations: z.array(unknownRecordSchema),
})

export type ClassificationMemoryEntry = z.infer<typeof classificationMemoryEntrySchema>
export type StorageRoot = z.infer<typeof storageRootSchema>

export function measureStorageRootBytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength
}

function pruneTraces(root: StorageRoot): StorageRoot['traces'] {
  const byRun = new Map<string, StorageRoot['traces']>()
  for (const trace of root.traces) {
    byRun.set(trace.runId, [...(byRun.get(trace.runId) ?? []), trace])
  }

  const latestRunIds = [...byRun.entries()]
    .map(([runId, traces]) => ({
      runId,
      latestAt: traces.reduce(
        (latest, trace) => (trace.createdAt > latest ? trace.createdAt : latest),
        '',
      ),
    }))
    .sort((a, b) => a.latestAt.localeCompare(b.latestAt))
    .slice(-5)
    .map((entry) => entry.runId)

  return latestRunIds.flatMap((runId) =>
    (byRun.get(runId) ?? [])
      .slice()
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(-100),
  )
}

export function pruneStorageRoot(root: StorageRoot): StorageRoot {
  const runs = root.runs.slice(-20)
  const transactions = root.transactions.slice(-10)
  const traces = pruneTraces(root)
  const classificationMemory = {
    ...root.classificationMemory,
    entries: root.classificationMemory.entries
      .slice()
      .sort((a, b) => a.lastUsedAt.localeCompare(b.lastUsedAt))
      .slice(-50_000),
  }

  const liveMoveLogs = root.moveLogs.filter((log) => log.status !== 'rolled_back')
  const rolledBackMoveLogs = root.moveLogs.filter((log) => log.status === 'rolled_back').slice(-10)

  return {
    ...root,
    runs,
    transactions,
    traces,
    classificationMemory,
    moveLogs: [...liveMoveLogs, ...rolledBackMoveLogs].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    ),
  }
}
