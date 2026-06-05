import { describe, expect, it } from 'vitest'
import { computeUrlKeyHash, sanitizeUrl } from './url'

const SALT = 'test-salt'

describe('sanitizeUrl', () => {
  it('strict drops query and hash from the AI-facing URL', async () => {
    const info = await sanitizeUrl('https://react.dev/learn?x=1#frag', SALT)
    expect(info.sanitizedUrl).toBe('https://react.dev/learn')
    expect(info.sanitizedUrl).not.toContain('?')
    expect(info.sanitizedUrl).not.toContain('#')
    expect(info.hostKey).toBe('react.dev')
    expect(info.isValid).toBe(true)
  })

  it('marks non-http(s) schemes invalid and gives no identity hash', async () => {
    for (const u of ['javascript:alert(1)', 'data:text/html,x', 'file:///etc/passwd']) {
      const info = await sanitizeUrl(u, SALT)
      expect(info.isValid).toBe(false)
      expect(info.urlKeyHash).toBe('')
    }
  })

  it('returns invalid for malformed URLs', async () => {
    const info = await sanitizeUrl('not a url', SALT)
    expect(info.isValid).toBe(false)
  })
})

describe('identity hash (urlKeyHash)', () => {
  it('distinguishes query-only differences', async () => {
    const a = await computeUrlKeyHash('https://youtube.com/watch?v=AAA', SALT)
    const b = await computeUrlKeyHash('https://youtube.com/watch?v=BBB', SALT)
    expect(a).not.toBe(b)
  })

  it('ignores tracking-param noise', async () => {
    const clean = await computeUrlKeyHash('https://x.com/p', SALT)
    const noisy = await computeUrlKeyHash('https://x.com/p?utm_source=z&gclid=123', SALT)
    expect(clean).toBe(noisy)
  })

  it('is order-independent for query params', async () => {
    const one = await computeUrlKeyHash('https://x.com/p?a=1&b=2', SALT)
    const two = await computeUrlKeyHash('https://x.com/p?b=2&a=1', SALT)
    expect(one).toBe(two)
  })

  it('depends on salt', async () => {
    const s1 = await computeUrlKeyHash('https://x.com/p', 'salt1')
    const s2 = await computeUrlKeyHash('https://x.com/p', 'salt2')
    expect(s1).not.toBe(s2)
  })
})
