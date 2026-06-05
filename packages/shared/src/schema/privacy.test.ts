import { describe, expect, it } from 'vitest'
import { guardOutbound, guardOutboundItems, PrivacyViolationError, type OutboundItem } from './privacy'

const ok: OutboundItem = {
  ref: 'b0',
  title: 'React docs',
  sanitizedUrl: 'https://react.dev/learn',
  hostKey: 'react.dev',
  currentPath: ['Dev'],
}

describe('guardOutbound', () => {
  it('passes clean items', () => {
    expect(() => guardOutbound({ items: [ok] })).not.toThrow()
  })

  it('allows ? or # in titles (not a leak)', () => {
    expect(() => guardOutbound({ items: [{ ...ok, title: 'What is React? #frontend' }] })).not.toThrow()
  })

  it('blocks query/hash in sanitizedUrl', () => {
    expect(() => guardOutboundItems([{ ...ok, sanitizedUrl: 'https://x.com/p?q=1' }])).toThrow(
      PrivacyViolationError,
    )
  })

  it('blocks non-allowlisted keys (e.g. rawUrl on item)', () => {
    const bad = { ...ok, rawUrl: 'https://x.com/p?secret=1' } as unknown as OutboundItem
    expect(() => guardOutboundItems([bad])).toThrow(PrivacyViolationError)
  })

  it('blocks rawUrl anywhere in the envelope', () => {
    const env = { items: [ok], meta: { rawUrl: 'https://x.com' } }
    expect(() => guardOutbound(env as unknown as { items: OutboundItem[] })).toThrow(
      PrivacyViolationError,
    )
  })

  it('blocks secret-looking values in any field (incl. title)', () => {
    expect(() => guardOutboundItems([{ ...ok, title: 'key sk-ABCDEFGHIJKLMNOP123' }])).toThrow(
      PrivacyViolationError,
    )
  })
})
