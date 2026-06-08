import { describe, expect, it } from 'vitest'
import { OpenAiCompatibleProvider, deepSeekPreset } from './openai-compatible-provider'

describe('OpenAiCompatibleProvider', () => {
  it('posts a guarded JSON classification request and parses the response', async () => {
    const provider = new OpenAiCompatibleProvider({
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-chat',
      apiKey: '<API_KEY>',
      fetch: async (_url, init) => {
        const body = JSON.parse(String(init?.body))
        expect(body.model).toBe('deepseek-chat')
        expect(JSON.stringify(body)).not.toContain('rawUrl')
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    schemaVersion: 1,
                    envelopeId: 'evt_1',
                    assignments: [
                      {
                        ref: 'b0',
                        targetPath: ['Dev'],
                        confidence: 0.9,
                        reason: 'developer host',
                        isNewFolder: false,
                      },
                    ],
                  }),
                },
              },
            ],
          }),
          { status: 200 },
        )
      },
    })

    const response = await provider.classifyBookmarks({
      schemaVersion: 1,
      envelopeId: 'evt_1',
      runId: 'run_1',
      traceId: 'trace_1',
      createdAt: '2026-06-05T00:00:00.000Z',
      task: 'classify_bookmarks',
      locale: 'en',
      directory: {
        mode: 'fallback',
        allowedRoots: ['Bookmarks Bar'],
        existingPaths: [],
        maxDepth: 3,
        maxNewFolders: 12,
      },
      items: [
        { ref: 'b0', title: 'React', sanitizedUrl: 'https://react.dev', hostKey: 'react.dev', currentPath: ['Dev'] },
      ],
      budget: { maxItems: 80, maxOutputTokens: 4096 },
    })

    expect(response.assignments[0]?.ref).toBe('b0')
  })

  it('exposes DeepSeek as an OpenAI-compatible preset', () => {
    expect(deepSeekPreset.baseUrl).toBe('https://api.deepseek.com')
    expect(deepSeekPreset.model).toBeTruthy()
  })
})
