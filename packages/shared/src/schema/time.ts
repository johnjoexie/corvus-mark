// All persisted time is ISO 8601 in UTC (data protocol rule §1.3).
export function nowIso(): string {
  return new Date().toISOString()
}

export function isIsoUtc(value: string): boolean {
  // Accept the canonical Date#toISOString shape ending in Z.
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return false
  const ms = Date.parse(value)
  return Number.isFinite(ms)
}
