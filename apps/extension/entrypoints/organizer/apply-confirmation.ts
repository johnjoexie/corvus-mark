import type { OrganizePlan } from '@corvus-mark/shared'

export interface ApplyConfirmation {
  runId: string
  itemCount: number
  applyCount: number
}

export function buildApplyConfirmation(plan: OrganizePlan): ApplyConfirmation {
  return {
    runId: plan.runId,
    itemCount: plan.items.length,
    applyCount: plan.items.filter((item) => item.selected && item.action !== 'keep').length,
  }
}

export function canApplyWithConfirmation(
  plan: OrganizePlan | undefined,
  confirmation: ApplyConfirmation | undefined,
): boolean {
  if (!plan || !confirmation) return false
  const current = buildApplyConfirmation(plan)
  return (
    confirmation.runId === current.runId &&
    confirmation.itemCount === current.itemCount &&
    confirmation.applyCount === current.applyCount
  )
}
