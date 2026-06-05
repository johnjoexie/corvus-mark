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

// TODO: implement urlKeyHash with Web Crypto SHA-256 over the normalized raw URL + local salt
// (see requirements/10-execution-contracts/04). This skeleton only does the sanitize shape.
export async function sanitizeUrl(
  rawUrl: string,
  sanitizeLevel: UrlSanitizeLevel = 'strict',
): Promise<UrlInfo> {
  try {
    const url = new URL(rawUrl)
    const sanitizedUrl =
      sanitizeLevel === 'full' ? rawUrl : `${url.protocol}//${url.host}${url.pathname}`
    return {
      rawUrl,
      sanitizedUrl,
      urlKeyHash: 'TODO_HASH',
      hostKey: url.host.toLowerCase(),
      protocol: url.protocol,
      host: url.host,
      pathname: url.pathname,
      isValid: true,
      sanitizeLevel,
    }
  } catch {
    return {
      rawUrl,
      sanitizedUrl: '',
      urlKeyHash: 'TODO_HASH_INVALID',
      hostKey: '',
      isValid: false,
      sanitizeLevel,
    }
  }
}
