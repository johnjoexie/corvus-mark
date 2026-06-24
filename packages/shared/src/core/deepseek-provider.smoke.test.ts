import { describe, expect, it } from 'vitest'
import { OpenAiCompatibleProvider, deepSeekPreset } from './openai-compatible-provider'

describe('DeepSeek provider smoke', () => {
  it.skipIf(!process.env.DEEPSEEK_API_KEY)(
    'classifies one bookmark through the real DeepSeek OpenAI-compatible API',
    async () => {
      const provider = new OpenAiCompatibleProvider({
        baseUrl: deepSeekPreset.baseUrl,
        model: deepSeekPreset.model,
        apiKey: process.env.DEEPSEEK_API_KEY!,
      })

      const response = await provider.classifyBookmarks({
        schemaVersion: 1,
        envelopeId: 'evt_deepseek_smoke',
        runId: 'run_deepseek_smoke',
        traceId: 'trace_deepseek_smoke',
        createdAt: '2026-01-01T00:00:00.000Z',
        task: 'classify_bookmarks',
        locale: 'en',
        directory: {
          mode: 'fallback',
          allowedRoots: ['Dev', 'Reading', 'Reference', 'Uncategorized'],
          existingPaths: [['Dev'], ['Reading'], ['Reference'], ['Uncategorized']],
          maxDepth: 3,
          maxNewFolders: 12,
        },
        items: [
          {
            ref: 'b0',
            title: 'React documentation',
            sanitizedUrl: 'https://react.dev/learn',
            hostKey: 'react.dev',
            currentPath: ['Bookmarks Bar'],
          },
        ],
        budget: { maxItems: 1, maxOutputTokens: 512 },
      })

      expect(response.assignments).toHaveLength(1)
      expect(response.assignments[0]?.ref).toBe('b0')
      expect(response.assignments[0]?.targetPath.length).toBeGreaterThan(0)
      expect(response.assignments[0]?.confidence).toBeGreaterThanOrEqual(0)
    },
    30_000,
  )
})
