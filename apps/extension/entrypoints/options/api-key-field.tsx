import type { RefObject } from 'react'

export function ApiKeyField({
  inputRef,
  apiKeyMasked,
}: {
  inputRef: RefObject<HTMLInputElement | null>
  apiKeyMasked: string
}) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      API key
      <input
        ref={inputRef}
        type="password"
        autoComplete="off"
        placeholder={apiKeyMasked || 'Not set'}
        style={{ display: 'block', width: '100%', marginTop: 4 }}
      />
    </label>
  )
}
