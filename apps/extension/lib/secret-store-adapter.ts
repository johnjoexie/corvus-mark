import type { SecretStorePort } from '@corvus-mark/shared'

interface StorageArea {
  get(key: string): Promise<Record<string, unknown>>
  set(items: Record<string, unknown>): Promise<void>
  remove(key: string): Promise<void>
}

function storageKey(key: string): string {
  return `secret:${key}`
}

export function maskSecret(value: string | undefined): string {
  if (!value) return ''
  if (value.length <= 8) return '*'.repeat(value.length)
  return `${value.slice(0, 4)}********${value.slice(-4)}`
}

export class StorageSecretStoreAdapter implements SecretStorePort {
  constructor(private readonly storage: StorageArea) {}

  async getSecret(key: string): Promise<string | undefined> {
    const result = await this.storage.get(storageKey(key))
    const value = result[storageKey(key)]
    return typeof value === 'string' ? value : undefined
  }

  async setSecret(key: string, value: string): Promise<void> {
    await this.storage.set({ [storageKey(key)]: value })
  }

  async deleteSecret(key: string): Promise<void> {
    await this.storage.remove(storageKey(key))
  }
}
