import { createCorvusId } from '@corvus-mark/shared'

export function App() {
  // Touch the shared package so the workspace dependency is exercised at build time.
  const sampleRunId = createCorvusId('run')
  return (
    <main style={{ maxWidth: 880, margin: '24px auto', fontFamily: 'system-ui', padding: 16 }}>
      <h1 style={{ fontSize: 20 }}>Organizer</h1>
      <p style={{ color: '#555' }}>
        Read bookmarks → AI plan → preview table → apply selected → rollback. Skeleton placeholder.
      </p>
      <p style={{ fontSize: 12, color: '#999' }}>sample run id: {sampleRunId}</p>
    </main>
  )
}
