import { describe, expect, it } from 'vitest'
import type { BookmarkManagerPort, LlmProviderPort, SecretStorePort } from './index'

describe('ports boundary', () => {
  it('defines browser, LLM, and secret ports without concrete dependencies', async () => {
    const bookmarkPort: BookmarkManagerPort = {
      getTree: async () => [],
      createFolder: async () => ({ id: 'f1', parentId: '0', title: 'Dev' }),
      moveBookmark: async () => ({ id: 'b1', parentId: 'f1', title: 'React', url: 'https://react.dev' }),
    }
    const llmPort: LlmProviderPort = {
      classifyBookmarks: async () => ({ schemaVersion: 1, envelopeId: 'evt_1', assignments: [] }),
    }
    const secretPort: SecretStorePort = {
      getSecret: async () => undefined,
      setSecret: async () => undefined,
      deleteSecret: async () => undefined,
    }

    await expect(bookmarkPort.getTree()).resolves.toEqual([])
    await expect(llmPort.classifyBookmarks({ schemaVersion: 1, envelopeId: 'evt_1' } as never)).resolves.toEqual({
      schemaVersion: 1,
      envelopeId: 'evt_1',
      assignments: [],
    })
    await expect(secretPort.getSecret('provider')).resolves.toBeUndefined()
  })
})
