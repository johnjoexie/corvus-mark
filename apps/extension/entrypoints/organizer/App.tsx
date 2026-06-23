import { useState } from 'react'
import type { MoveLog, OrganizePlan } from '@corvus-mark/shared'
import { browser } from 'wxt/browser'
import type { BackgroundRequest, BackgroundResponse } from '../../lib/messages'
import {
  buildApplyConfirmation,
  canApplyWithConfirmation,
  type ApplyConfirmation,
} from './apply-confirmation'

export function App() {
  const [plan, setPlan] = useState<OrganizePlan | undefined>()
  const [moveLog, setMoveLog] = useState<MoveLog | undefined>()
  const [status, setStatus] = useState('Ready')
  const [confirmation, setConfirmation] = useState<ApplyConfirmation | undefined>()

  async function send(request: BackgroundRequest): Promise<BackgroundResponse> {
    return browser.runtime.sendMessage<BackgroundRequest, BackgroundResponse>(request)
  }

  async function preview() {
    setStatus('Building preview...')
    const response = await send({ type: 'preview-plan' })
    if (response.ok && 'plan' in response) {
      setPlan(response.plan)
      setConfirmation(undefined)
      setStatus(response.degraded ? 'Preview built with offline fallback' : 'Preview built with AI')
    } else {
      setStatus(response.ok ? 'Preview built' : response.error)
    }
  }

  async function apply() {
    if (!plan) return
    if (!canApplyWithConfirmation(plan, confirmation)) {
      const next = buildApplyConfirmation(plan)
      setConfirmation(next)
      setStatus(`Confirm apply: ${next.applyCount} selected moves from ${next.itemCount} preview items`)
      return
    }
    setStatus('Applying selected moves...')
    const response = await send({ type: 'apply-plan', plan })
    setConfirmation(undefined)
    if (response.ok && 'moveLog' in response) {
      setMoveLog(response.moveLog)
      setStatus(`Apply result: ${response.moveLog.status}`)
    } else {
      setStatus(response.ok ? 'Applied' : response.error)
    }
  }

  async function rollback() {
    setStatus('Rolling back...')
    const response = await send({ type: 'rollback-last' })
    if (response.ok && 'moveLog' in response) {
      setMoveLog(response.moveLog)
      setStatus(`Rollback result: ${response.moveLog.status}`)
    } else {
      setStatus(response.ok ? 'Rolled back' : response.error)
    }
  }

  return (
    <main style={{ maxWidth: 880, margin: '24px auto', fontFamily: 'system-ui', padding: 16 }}>
      <h1 style={{ fontSize: 20 }}>Organizer</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button type="button" onClick={() => void preview()}>
          Generate preview
        </button>
        <button type="button" disabled={!plan} onClick={() => void apply()}>
          {plan && confirmation ? 'Confirm apply' : 'Apply selected'}
        </button>
        <button type="button" onClick={() => void rollback()}>
          Rollback
        </button>
      </div>
      <p style={{ color: '#555' }}>{status}</p>
      {plan ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th align="left">Title</th>
              <th align="left">Current</th>
              <th align="left">Target</th>
              <th align="left">Action</th>
            </tr>
          </thead>
          <tbody>
            {plan.items.map((item) => (
              <tr key={item.bookmarkId}>
                <td>{item.title}</td>
                <td>{item.currentPath.join(' / ')}</td>
                <td>{item.targetPath.join(' / ')}</td>
                <td>{item.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {moveLog ? <p style={{ fontSize: 12 }}>MoveLog: {moveLog.status}</p> : null}
    </main>
  )
}
