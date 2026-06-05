import { browser } from 'wxt/browser'

export function App() {
  return (
    <main style={{ width: 260, padding: 12, fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 16, margin: '0 0 8px' }}>Corvus Mark</h1>
      <p style={{ fontSize: 12, color: '#555', margin: '0 0 12px' }}>
        AI suggests · You preview · Local code executes
      </p>
      <button
        type="button"
        onClick={() => browser.runtime.openOptionsPage()}
        style={{ width: '100%' }}
      >
        Open settings
      </button>
    </main>
  )
}
