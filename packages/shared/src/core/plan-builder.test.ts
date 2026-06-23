import { describe, expect, it } from 'vitest'
import { buildOrganizePlan } from './plan-builder'

const bookmark = {
  schemaVersion: 1,
  id: 'bm_1',
  browserId: '12',
  parentId: '1',
  title: 'React docs',
  rawUrl: 'https://react.dev/learn',
  sanitizedUrl: 'https://react.dev/learn',
  urlKeyHash: 'hash_1',
  hostKey: 'react.dev',
  currentPath: ['Bookmarks Bar', 'Dev'],
  isValidUrl: true,
  createdAt: '2026-06-05T00:00:00.000Z',
  updatedAt: '2026-06-05T00:00:00.000Z',
}

describe('buildOrganizePlan', () => {
  it('marks low-confidence assignments as keep', () => {
    const plan = buildOrganizePlan({
      runId: 'run_1',
      traceId: 'trace_1',
      planId: 'plan_1',
      createdAt: '2026-06-05T00:00:00.000Z',
      bookmarks: [bookmark],
      assignments: [{ ref: 'b0', targetPath: ['Dev', 'Frontend'], confidence: 0.5, reason: 'docs', isNewFolder: false }],
      refToBookmarkId: new Map([['b0', 'bm_1']]),
      autoSelectConfidenceThreshold: 0.75,
      newFolderConfidenceThreshold: 0.85,
      maxDepth: 3,
      maxNewFolders: 12,
    })

    expect(plan.items[0]?.action).toBe('keep')
    expect(plan.stats.lowConfidenceItems).toBe(1)
  })

  it('blocks assignments deeper than maxDepth', () => {
    const plan = buildOrganizePlan({
      runId: 'run_1',
      traceId: 'trace_1',
      planId: 'plan_1',
      createdAt: '2026-06-05T00:00:00.000Z',
      bookmarks: [bookmark],
      assignments: [{ ref: 'b0', targetPath: ['A', 'B', 'C', 'D'], confidence: 0.9, reason: 'deep', isNewFolder: false }],
      refToBookmarkId: new Map([['b0', 'bm_1']]),
      autoSelectConfidenceThreshold: 0.75,
      newFolderConfidenceThreshold: 0.85,
      maxDepth: 3,
      maxNewFolders: 12,
    })

    expect(plan.items[0]?.validationStatus).toBe('blocked')
    expect(plan.stats.blockedItems).toBe(1)
  })

  it('blocks assignments outside allowed roots', () => {
    const plan = buildOrganizePlan({
      runId: 'run_1',
      traceId: 'trace_1',
      planId: 'plan_1',
      createdAt: '2026-06-05T00:00:00.000Z',
      bookmarks: [bookmark],
      assignments: [
        {
          ref: 'b0',
          targetPath: ['Injected Root', 'Secrets'],
          confidence: 0.9,
          reason: 'prompt injection',
          isNewFolder: false,
        },
      ],
      refToBookmarkId: new Map([['b0', 'bm_1']]),
      autoSelectConfidenceThreshold: 0.75,
      newFolderConfidenceThreshold: 0.85,
      maxDepth: 3,
      maxNewFolders: 12,
      allowedRoots: ['Bookmarks Bar', 'Other Bookmarks'],
    })

    expect(plan.items[0]?.validationStatus).toBe('blocked')
    expect(plan.items[0]?.action).toBe('keep')
    expect(plan.items[0]?.validationMessages).toContain('targetPath root is not allowed')
  })
})
