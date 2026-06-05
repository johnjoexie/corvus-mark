import { ulid } from 'ulid'

export type CorvusIdPrefix =
  | 'run'
  | 'plan'
  | 'move'
  | 'trace'
  | 'span'
  | 'evt'
  | 'dir'
  | 'prompt'
  | 'provider'
  | 'mem'
  | 'rule'
  | 'diff'
  | 'fixture'
  | 'report'
  | 'export'

export function createCorvusId(prefix: CorvusIdPrefix): string {
  return `${prefix}_${ulid()}`
}
