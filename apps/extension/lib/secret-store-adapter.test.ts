import { describe, expect, it } from 'vitest'
import { maskSecret, StorageSecretStoreAdapter } from './secret-store-adapter'

describe('StorageSecretStoreAdapter', () => {
  it('stores, reads, and deletes provider secrets through injected storage', async () => {
    const data = new Map<string, unknown>()
    const store = new StorageSecretStoreAdapter({
      get: async (key) => ({ [key]: data.get(key) }),
      set: async (items) => {
        Object.entries(items).forEach(([key, value]) => data.set(key, value))
      },
      remove: async (key) => {
        data.delete(key)
      },
    })

    await store.setSecret('deepseek', '<API_KEY>')
    await expect(store.getSecret('deepseek')).resolves.toBe('<API_KEY>')
    await store.deleteSecret('deepseek')
    await expect(store.getSecret('deepseek')).resolves.toBeUndefined()
  })

  it('masks secrets for UI display', () => {
    expect(maskSecret('sk-1234567890abcdef')).toBe('sk-1********cdef')
    expect(maskSecret(undefined)).toBe('')
  })
})
