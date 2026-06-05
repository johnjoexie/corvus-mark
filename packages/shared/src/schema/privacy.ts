// Executable privacy oracle (see 04 §4). Enforced on EVERY outbound AI request in
// production, not just in tests. Fail-closed: a violation throws and the request is
// never sent.

export const AI_ITEM_ALLOWLIST = ['ref', 'title', 'sanitizedUrl', 'hostKey', 'currentPath'] as const

export interface OutboundItem {
  ref: string
  title: string
  sanitizedUrl: string
  hostKey?: string
  currentPath: string[]
}

export class PrivacyViolationError extends Error {
  constructor(message: string) {
    super(`privacy_violation: ${message}`)
    this.name = 'PrivacyViolationError'
  }
}

// Patterns for secret-looking values. Applied to ALL string values (titles included).
const SECRET_PATTERNS: RegExp[] = [
  /sk-[A-Za-z0-9]{16,}/, // OpenAI-style key
  /ghp_[A-Za-z0-9]{20,}/, // GitHub PAT
  /AKIA[0-9A-Z]{16}/, // AWS access key id
  /bearer\s+[A-Za-z0-9._-]+/i,
  /authorization\s*[:=]/i,
  /(api[_-]?key|secret|password)\s*[:=]/i,
  /\bcookie\s*[:=]/i,
]

function collectStrings(value: unknown, out: string[]): void {
  if (typeof value === 'string') out.push(value)
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out))
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => collectStrings(v, out))
}

function deepHasKey(value: unknown, key: string): boolean {
  if (Array.isArray(value)) return value.some((v) => deepHasKey(v, key))
  if (value && typeof value === 'object') {
    if (Object.prototype.hasOwnProperty.call(value, key)) return true
    return Object.values(value).some((v) => deepHasKey(v, key))
  }
  return false
}

/** Throws PrivacyViolationError if any item carries forbidden data. */
export function guardOutboundItems(items: OutboundItem[]): void {
  const allowed = new Set<string>(AI_ITEM_ALLOWLIST)
  for (const item of items) {
    const extra = Object.keys(item).filter((k) => !allowed.has(k))
    if (extra.length > 0) {
      throw new PrivacyViolationError(`item has non-allowlisted keys: ${extra.join(', ')}`)
    }
    // query/hash canary applies to sanitizedUrl ONLY (titles may contain ? or #).
    if (item.sanitizedUrl.includes('?') || item.sanitizedUrl.includes('#')) {
      throw new PrivacyViolationError('sanitizedUrl contains query/hash')
    }
    const strings: string[] = []
    collectStrings(item, strings)
    for (const s of strings) {
      for (const pat of SECRET_PATTERNS) {
        if (pat.test(s)) throw new PrivacyViolationError(`value matches secret pattern ${pat}`)
      }
    }
  }
}

/** Guards a full request envelope: items pass guardOutboundItems and no rawUrl anywhere. */
export function guardOutbound(envelope: { items: OutboundItem[] }): void {
  if (deepHasKey(envelope, 'rawUrl')) {
    throw new PrivacyViolationError('envelope contains a rawUrl field')
  }
  guardOutboundItems(envelope.items)
}
