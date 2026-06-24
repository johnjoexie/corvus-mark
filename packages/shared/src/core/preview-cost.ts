export interface PreviewCostEstimate {
  itemCount: number
  batchSize: number
  estimatedRequestCount: number
  estimatedMaxTokens: number
  requiresNetworkConfirmation: boolean
  requiresLargeRunConfirmation: boolean
  confirmationId: string
}

export interface PreviewCostConfirmation {
  confirmationId: string
}

export function estimatePreviewCost(input: {
  itemCount: number
  batchSize: number
  maxOutputTokensPerRequest: number
  hasProviderKey: boolean
}): PreviewCostEstimate {
  const estimatedRequestCount =
    input.hasProviderKey && input.itemCount > 0 ? Math.ceil(input.itemCount / input.batchSize) : 0
  const estimatedMaxTokens = estimatedRequestCount * input.maxOutputTokensPerRequest
  return {
    itemCount: input.itemCount,
    batchSize: input.batchSize,
    estimatedRequestCount,
    estimatedMaxTokens,
    requiresNetworkConfirmation: estimatedRequestCount > 0,
    requiresLargeRunConfirmation: estimatedRequestCount > 50,
    confirmationId: `preview:${input.itemCount}:${input.batchSize}:${estimatedRequestCount}:${estimatedMaxTokens}`,
  }
}

export function isPreviewCostConfirmed(
  estimate: PreviewCostEstimate,
  confirmation: PreviewCostConfirmation | undefined,
): boolean {
  if (!estimate.requiresNetworkConfirmation) return true
  return confirmation?.confirmationId === estimate.confirmationId
}
