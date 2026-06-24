import { describe, expect, it } from 'vitest'

import { estimatePreviewCost, isPreviewCostConfirmed } from './preview-cost'

describe('preview cost confirmation', () => {
  it('requires confirmation before provider-backed preview requests', () => {
    const estimate = estimatePreviewCost({
      itemCount: 81,
      batchSize: 80,
      maxOutputTokensPerRequest: 4096,
      hasProviderKey: true,
    })

    expect(estimate.estimatedRequestCount).toBe(2)
    expect(estimate.estimatedMaxTokens).toBe(8192)
    expect(estimate.requiresNetworkConfirmation).toBe(true)
    expect(isPreviewCostConfirmed(estimate, undefined)).toBe(false)
    expect(isPreviewCostConfirmed(estimate, { confirmationId: estimate.confirmationId })).toBe(true)
  })

  it('does not require confirmation for offline fallback preview', () => {
    const estimate = estimatePreviewCost({
      itemCount: 81,
      batchSize: 80,
      maxOutputTokensPerRequest: 4096,
      hasProviderKey: false,
    })

    expect(estimate.estimatedRequestCount).toBe(0)
    expect(estimate.requiresNetworkConfirmation).toBe(false)
    expect(isPreviewCostConfirmed(estimate, undefined)).toBe(true)
  })
})
