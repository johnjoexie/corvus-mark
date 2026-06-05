export type UrlSanitizeLevel = 'strict' | 'balanced' | 'full'

export interface UrlInfo {
  rawUrl?: string
  sanitizedUrl: string
  urlKeyHash: string
  hostKey: string
  protocol?: string
  host?: string
  pathname?: string
  isValid: boolean
  sanitizeLevel: UrlSanitizeLevel
}

// Only http(s) bookmarks are sent to AI / get an identity hash. Everything else
// (javascript:, data:, chrome:, file:, ...) is treated as not-valid (kept, never sent).
const VALID_PROTOCOLS = new Set(['http:', 'https:'])

// Tracking params must not fork identity (see 04 §2): utm_* + a few well-knowns.
const TRACKING_PARAMS = new Set(['gclid', 'fbclid', 'mc_eid', 'mc_cid', '_hsenc', '_hsmi'])
function isTrackingParam(key: string): boolean {
  return key.startsWith('utm_') || TRACKING_PARAMS.has(key.toLowerCase())
}

/**
 * Normalized raw URL used ONLY as the local identity hash input (never stored/sent).
 * Keeps the query (so ?v=AAA differs from ?v=BBB), sorts params for stability,
 * drops the fragment, and strips tracking params (so utm noise does not fork identity).
 */
export function normalizeForIdentity(rawUrl: string): string {
  const url = new URL(rawUrl)
  const params = [...url.searchParams.entries()]
    .filter(([k]) => !isTrackingParam(k))
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  const query = params.map(([k, v]) => `${k}=${v}`).join('&')
  const scheme = url.protocol.toLowerCase()
  const host = url.host.toLowerCase()
  return `${scheme}//${host}${url.pathname}${query ? `?${query}` : ''}`
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Identity key = SHA-256(salt || normalizedRawUrl). Only the hash is ever persisted. */
export async function computeUrlKeyHash(rawUrl: string, salt: string): Promise<string> {
  return sha256Hex(`${salt}\u0000${normalizeForIdentity(rawUrl)}`)
}

export async function sanitizeUrl(
  rawUrl: string,
  salt: string,
  sanitizeLevel: UrlSanitizeLevel = 'strict',
): Promise<UrlInfo> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return {
      rawUrl,
      sanitizedUrl: '',
      urlKeyHash: '',
      hostKey: '',
      isValid: false,
      sanitizeLevel,
    }
  }

  const isValid = VALID_PROTOCOLS.has(url.protocol.toLowerCase())
  // strict/balanced drop query+hash for the AI-facing URL; full keeps the raw URL.
  const sanitizedUrl =
    sanitizeLevel === 'full' ? rawUrl : `${url.protocol}//${url.host}${url.pathname}`

  return {
    rawUrl,
    sanitizedUrl,
    urlKeyHash: isValid ? await computeUrlKeyHash(rawUrl, salt) : '',
    hostKey: url.host.toLowerCase(),
    protocol: url.protocol,
    host: url.host,
    pathname: url.pathname,
    isValid,
    sanitizeLevel,
  }
}
