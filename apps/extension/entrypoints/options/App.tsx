import { useEffect, useRef, useState } from 'react'
import { browser } from 'wxt/browser'
import type { BackgroundRequest, BackgroundResponse, ProviderSettings } from '../../lib/messages'
import { ApiKeyField } from './api-key-field'

export function App() {
  const [settings, setSettings] = useState<ProviderSettings>({
    provider: 'deepseek',
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-chat',
    apiKeyMasked: '',
  })
  const apiKeyInputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    void browser.runtime
      .sendMessage<BackgroundRequest, BackgroundResponse>({ type: 'get-settings' })
      .then((response) => {
        if (response.ok && 'settings' in response) setSettings(response.settings)
      })
  }, [])

  async function save() {
    const apiKey = apiKeyInputRef.current?.value.trim()
    const response = await browser.runtime.sendMessage<BackgroundRequest, BackgroundResponse>({
      type: 'save-settings',
      settings: {
        provider: settings.provider,
        baseUrl: settings.baseUrl,
        model: settings.model,
      },
      apiKey: apiKey || undefined,
    })
    if (response.ok && 'settings' in response) {
      setSettings(response.settings)
      if (apiKeyInputRef.current) apiKeyInputRef.current.value = ''
      setStatus('Saved locally')
    } else {
      setStatus(response.ok ? 'Saved' : response.error)
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: '40px auto', fontFamily: 'system-ui', padding: 16 }}>
      <h1 style={{ fontSize: 20 }}>Settings</h1>
      <label style={{ display: 'block', marginBottom: 12 }}>
        Provider
        <select
          value={settings.provider}
          onChange={(event) =>
            setSettings({ ...settings, provider: event.target.value as ProviderSettings['provider'] })
          }
          style={{ display: 'block', width: '100%', marginTop: 4 }}
        >
          <option value="deepseek">DeepSeek</option>
          <option value="openai-compatible">OpenAI-compatible</option>
        </select>
      </label>
      <label style={{ display: 'block', marginBottom: 12 }}>
        Base URL
        <input
          value={settings.baseUrl}
          onChange={(event) => setSettings({ ...settings, baseUrl: event.target.value })}
          style={{ display: 'block', width: '100%', marginTop: 4 }}
        />
      </label>
      <label style={{ display: 'block', marginBottom: 12 }}>
        Model
        <input
          value={settings.model}
          onChange={(event) => setSettings({ ...settings, model: event.target.value })}
          style={{ display: 'block', width: '100%', marginTop: 4 }}
        />
      </label>
      <ApiKeyField inputRef={apiKeyInputRef} apiKeyMasked={settings.apiKeyMasked} />
      <button type="button" onClick={() => void save()}>
        Save
      </button>
      <p style={{ color: '#555' }}>{status || 'Keys are stored locally and shown only masked.'}</p>
    </main>
  )
}
