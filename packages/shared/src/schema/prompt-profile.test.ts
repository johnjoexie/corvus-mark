import { describe, expect, it } from 'vitest'
import { promptProfileSchema } from './prompt-profile'

const validPromptProfile = {
  schemaVersion: 1,
  id: 'prompt_1',
  name: 'Default classifier',
  promptVersion: 'classifier-v1',
  locale: 'en',
  systemTemplate:
    'Return only JSON matching the schema. Use existing paths when possible. Never output URLs or secrets.',
  responseFormatHint: 'json_object' as const,
  createdAt: '2026-06-05T00:00:00.000Z',
  updatedAt: '2026-06-05T00:00:00.000Z',
}

describe('promptProfileSchema', () => {
  it('parses a versioned prompt profile', () => {
    expect(promptProfileSchema.parse(validPromptProfile).promptVersion).toBe('classifier-v1')
  })

  it('rejects an empty prompt version', () => {
    expect(
      promptProfileSchema.safeParse({
        ...validPromptProfile,
        promptVersion: '',
      }).success,
    ).toBe(false)
  })

  it('rejects an empty system template', () => {
    expect(
      promptProfileSchema.safeParse({
        ...validPromptProfile,
        systemTemplate: '',
      }).success,
    ).toBe(false)
  })
})
