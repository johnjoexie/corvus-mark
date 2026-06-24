import { describe, expect, it } from 'vitest'

import {
  createClassificationRunState,
  resumeClassificationBatches,
  type ClassificationRunState,
} from './resumable-classification'
import type { ClassificationBatch } from './classification-batches'
import type { AiAssignment } from '../schema/ai-envelope'

function batch(id: string): ClassificationBatch {
  return {
    items: [{ ref: id, title: id, sanitizedUrl: `https://example.com/${id}`, hostKey: 'example.com', currentPath: ['Inbox'] }],
    bookmarks: [],
    refToBookmarkId: new Map([[id, id]]),
  }
}

describe('resumable classification batches', () => {
  it('resumes from persisted checkpoint without re-running completed batches', async () => {
    let state: ClassificationRunState = createClassificationRunState({
      runId: 'run_1',
      traceId: 'trace_1',
      batchTotal: 3,
      itemTotal: 3,
      now: '2026-01-01T00:00:00.000Z',
    })
    const batches = [batch('b0'), batch('b1'), batch('b2')]
    const executed: string[] = []

    await expect(
      resumeClassificationBatches({
        state,
        batches,
        classifyBatch: async (current) => {
          executed.push(current.items[0]!.ref)
          if (current.items[0]!.ref === 'b1') throw new Error('worker_terminated')
          return [assignment(current.items[0]!.ref)]
        },
        saveState: async (next) => {
          state = next
        },
      }),
    ).rejects.toThrow('worker_terminated')

    expect(state.batchDone).toBe(1)
    expect(state.checkpoint.lastBatchRef).toBe('b0')
    expect(executed).toEqual(['b0', 'b1'])

    const resumed = await resumeClassificationBatches({
      state,
      batches,
      classifyBatch: async (current) => {
        executed.push(current.items[0]!.ref)
        return [assignment(current.items[0]!.ref)]
      },
      saveState: async (next) => {
        state = next
      },
    })

    expect(resumed.assignments.map((item) => item.ref)).toEqual(['b0', 'b1', 'b2'])
    expect(executed).toEqual(['b0', 'b1', 'b1', 'b2'])
    expect(state.status).toBe('done')
    expect(state.batchDone).toBe(3)
    expect(state.checkpoint.lastBatchRef).toBe('b2')
  })
})

function assignment(ref: string): AiAssignment {
  return {
    ref,
    targetPath: ['Reference'],
    confidence: 0.9,
    reason: 'test',
    isNewFolder: false,
  }
}
