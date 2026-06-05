import { describe, expect, it } from 'vitest'
import { aiRequestEnvelopeSchema, parseAiResponse } from './ai-envelope'

const validRequest = {
  schemaVersion: 1 as const,
  envelopeId: 'evt_1',
  runId: 'run_1',
  traceId: 'trace_1',
  createdAt: '2026-06-05T00:00:00.000Z',
  task: 'classify_bookmarks' as const,
  locale: 'en',
  directory: {
    mode: 'ai_recommend' as const,
    allowedRoots: ['Bookmarks Bar'],
    existingPaths: [['Dev']],
    maxDepth: 3,
    maxNewFolders: 12,
  },
  items: [{ ref: 'b0', title: 'React', sanitizedUrl: 'https://react.dev/', currentPath: ['Dev'] }],
  budget: { maxItems: 80, maxOutputTokens: 4096 },
}

describe('aiRequestEnvelope', () => {
  it('accepts a valid request', () => {
    expect(aiRequestEnvelopeSchema.safeParse(validRequest).success).toBe(true)
  })
  it('rejects unknown task', () => {
    expect(aiRequestEnvelopeSchema.safeParse({ ...validRequest, task: 'x' }).success).toBe(false)
  })
})

describe('parseAiResponse', () => {
  it('parses a valid response', () => {
    const r = parseAiResponse({
      schemaVersion: 1,
      envelopeId: 'evt_1',
      assignments: [
        { ref: 'b0', targetPath: ['Dev', 'Frontend'], confidence: 0.9, reason: 'docs', isNewFolder: false },
      ],
    })
    expect(r.assignments[0]?.ref).toBe('b0')
  })

  it('rejects confidence out of range', () => {
    expect(() =>
      parseAiResponse({
        schemaVersion: 1,
        envelopeId: 'evt_1',
        assignments: [{ ref: 'b0', targetPath: ['Dev'], confidence: 2, reason: 'x', isNewFolder: false }],
      }),
    ).toThrow()
  })

  it('rejects empty targetPath', () => {
    expect(() =>
      parseAiResponse({
        schemaVersion: 1,
        envelopeId: 'evt_1',
        assignments: [{ ref: 'b0', targetPath: [], confidence: 0.5, reason: 'x', isNewFolder: false }],
      }),
    ).toThrow()
  })

  it('rejects non-JSON garbage', () => {
    expect(() => parseAiResponse('not json')).toThrow()
  })
})
