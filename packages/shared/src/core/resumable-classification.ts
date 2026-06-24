import type { AiAssignment } from '../schema/ai-envelope'
import type { ClassificationBatch } from './classification-batches'

export interface CompletedClassificationBatch {
  batchRef: string
  assignments: AiAssignment[]
}

export interface ClassificationRunState {
  schemaVersion: number
  id: string
  traceId: string
  promptVersion: string
  status: 'planning' | 'previewing' | 'applying' | 'done' | 'failed' | 'degraded'
  phase: 'classify'
  batchTotal: number
  batchDone: number
  itemTotal: number
  itemDone: number
  checkpoint: {
    lastBatchRef?: string
    appliedCount: number
  }
  completedBatches: CompletedClassificationBatch[]
  createdAt: string
  updatedAt: string
}

export interface CreateClassificationRunStateInput {
  runId: string
  traceId: string
  batchTotal: number
  itemTotal: number
  promptVersion?: string
  now: string
}

export interface ResumeClassificationBatchesInput {
  state: ClassificationRunState
  batches: ClassificationBatch[]
  classifyBatch(batch: ClassificationBatch, batchIndex: number): Promise<AiAssignment[]>
  saveState(state: ClassificationRunState): Promise<void>
  now?: () => string
}

export function createClassificationRunState(
  input: CreateClassificationRunStateInput,
): ClassificationRunState {
  return {
    schemaVersion: 1,
    id: input.runId,
    traceId: input.traceId,
    promptVersion: input.promptVersion ?? 'classifier-v1',
    status: 'planning',
    phase: 'classify',
    batchTotal: input.batchTotal,
    batchDone: 0,
    itemTotal: input.itemTotal,
    itemDone: 0,
    checkpoint: { appliedCount: 0 },
    completedBatches: [],
    createdAt: input.now,
    updatedAt: input.now,
  }
}

export async function resumeClassificationBatches(input: ResumeClassificationBatchesInput): Promise<{
  state: ClassificationRunState
  assignments: AiAssignment[]
}> {
  const now = input.now ?? (() => new Date().toISOString())
  const completedByRef = new Map(
    input.state.completedBatches.map((batch) => [batch.batchRef, batch.assignments]),
  )
  const startIndex = input.state.checkpoint.lastBatchRef
    ? input.batches.findIndex((batch) => batchRef(batch) === input.state.checkpoint.lastBatchRef) + 1
    : 0
  let state: ClassificationRunState = { ...input.state, status: 'planning', updatedAt: now() }

  for (let index = Math.max(0, startIndex); index < input.batches.length; index += 1) {
    const batch = input.batches[index]
    if (!batch) continue
    const ref = batchRef(batch)
    const assignments = await input.classifyBatch(batch, index)
    completedByRef.set(ref, assignments)
    state = {
      ...state,
      batchDone: completedByRef.size,
      itemDone: [...completedByRef.keys()].reduce((count, completedRef) => {
        const completedIndex = input.batches.findIndex((candidate) => batchRef(candidate) === completedRef)
        return count + (input.batches[completedIndex]?.items.length ?? 0)
      }, 0),
      checkpoint: { ...state.checkpoint, lastBatchRef: ref },
      completedBatches: input.batches
        .map((candidate) => {
          const batchAssignments = completedByRef.get(batchRef(candidate))
          return batchAssignments
            ? { batchRef: batchRef(candidate), assignments: batchAssignments }
            : undefined
        })
        .filter((value): value is CompletedClassificationBatch => Boolean(value)),
      updatedAt: now(),
    }
    await input.saveState(state)
  }

  state = {
    ...state,
    status: 'done',
    batchDone: input.batches.length,
    itemDone: input.batches.reduce((count, batch) => count + batch.items.length, 0),
    updatedAt: now(),
  }
  await input.saveState(state)

  return {
    state,
    assignments: state.completedBatches.flatMap((batch) => batch.assignments),
  }
}

function batchRef(batch: ClassificationBatch): string {
  return batch.items[0]?.ref ?? ''
}
