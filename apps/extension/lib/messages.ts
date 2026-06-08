import type { MoveLog, OrganizePlan } from '@corvus-mark/shared'

export interface ProviderSettings {
  provider: 'deepseek' | 'openai-compatible'
  baseUrl: string
  model: string
  apiKeyMasked: string
}

export type BackgroundRequest =
  | { type: 'get-settings' }
  | { type: 'save-settings'; settings: Omit<ProviderSettings, 'apiKeyMasked'>; apiKey?: string }
  | { type: 'preview-plan' }
  | { type: 'apply-plan'; plan: OrganizePlan }
  | { type: 'rollback-last' }

export type BackgroundResponse =
  | { ok: true; settings: ProviderSettings }
  | { ok: true; plan: OrganizePlan; degraded: boolean }
  | { ok: true; moveLog: MoveLog }
  | { ok: false; error: string }
