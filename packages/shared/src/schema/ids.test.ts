import { describe, expect, it } from 'vitest'
import { createCorvusId } from './ids'
import { isIsoUtc, nowIso } from './time'

describe('ids', () => {
  it('creates prefixed ULID', () => {
    const id = createCorvusId('run')
    expect(id.startsWith('run_')).toBe(true)
    expect(id.length).toBeGreaterThan('run_'.length + 20)
  })
})

describe('time', () => {
  it('nowIso is ISO-8601 UTC', () => {
    expect(isIsoUtc(nowIso())).toBe(true)
  })
  it('rejects non-UTC', () => {
    expect(isIsoUtc('2026-06-05 10:00:00')).toBe(false)
  })
})
