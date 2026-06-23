import { describe, expect, it } from 'vitest'

import { buildApplyConfirmation, canApplyWithConfirmation } from './apply-confirmation'
import type { OrganizePlan, OrganizePlanItem } from '@corvus-mark/shared'

function item(overrides: Partial<OrganizePlanItem>): OrganizePlanItem {
  return {
    schemaVersion: 1,
    bookmarkId: 'b1',
    title: 'One',
    sanitizedUrl: 'https://example.com/one',
    urlKeyHash: 'hash-one',
    hostKey: 'example.com',
    currentPath: ['Bookmarks Bar'],
    targetPath: ['Dev'],
    expectedParentId: '1',
    confidence: 0.95,
    stabilityStatus: 'stable',
    reason: 'test',
    action: 'move',
    selected: true,
    validationStatus: 'valid',
    validationMessages: [],
    ...overrides,
  }
}

const plan: OrganizePlan = {
  schemaVersion: 1,
  id: 'plan_01',
  runId: 'run_01',
  traceId: 'trace_01',
  createdAt: '2026-01-01T00:00:00.000Z',
  items: [
    item({
      bookmarkId: 'b1',
      title: 'One',
    }),
    item({
      bookmarkId: 'b2',
      title: 'Two',
      targetPath: ['Reading'],
      action: 'keep',
      confidence: 0.4,
      selected: false,
    }),
  ],
  warnings: [],
  stats: {
    totalItems: 2,
    moveItems: 1,
    keepItems: 1,
    blockedItems: 0,
    conflictItems: 0,
    lowConfidenceItems: 1,
    suggestedNewFolderCount: 0,
  },
}

describe('apply confirmation gate', () => {
  it('requires a confirmation token for the current plan before applying', () => {
    expect(canApplyWithConfirmation(plan, undefined)).toBe(false)

    const confirmation = buildApplyConfirmation(plan)

    expect(canApplyWithConfirmation(plan, confirmation)).toBe(true)
  })

  it('rejects stale confirmation tokens from a different preview', () => {
    const confirmation = buildApplyConfirmation(plan)
    const changedPlan = {
      ...plan,
      runId: 'run_02',
      items: plan.items.slice(0, 1),
    }

    expect(canApplyWithConfirmation(changedPlan, confirmation)).toBe(false)
  })
})
