import React, { useEffect, useState } from 'react'
import { KeyBinding, KeyBindings } from '../types/gameData'

interface Props {
  onClose: () => void
  onTestKey: (action: string) => void
}

const NOTE = `Key format (Windows SendKeys):
  {F1}-{F12}  Function keys      ^a  Ctrl+A
  {ESC}       Escape             +a  Shift+A
  {ENTER}     Enter              %a  Alt+A
  {SPACE}     Spacebar           {UP} {DOWN} {LEFT} {RIGHT}
  a-z, 0-9    Regular keys`

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = typeof data?.error === 'string' ? data.error : response.statusText
    throw new Error(message)
  }

  return data as T
}

export function SettingsModal({ onClose, onTestKey }: Props) {
  const [bindings, setBindings] = useState<Record<string, KeyBinding>>({})
  const [draftBindings, setDraftBindings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [tested, setTested] = useState<string | null>(null)

  useEffect(() => {
    requestJson<KeyBindings>('/api/keybindings')
      .then((bindingsData) => {
        const nextDraft: Record<string, string> = {}

        for (const [action, binding] of Object.entries(bindingsData.bindings || {})) {
          nextDraft[action] = binding.key
        }

        setBindings(bindingsData.bindings || {})
        setDraftBindings(nextDraft)
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load settings from the server.')
        setLoading(false)
      })
  }, [])

  function handleSave() {
    setSaving(true)
    setError('')

    const updatedBindings: Record<string, Partial<KeyBinding>> = {}
    for (const action of Object.keys(bindings)) {
      updatedBindings[action] = { key: draftBindings[action] || bindings[action]?.key || '' }
    }

    requestJson<KeyBindings>('/api/keybindings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bindings: updatedBindings }),
      })
      .then(() => {
        setSaving(false)
        onClose()
      })
      .catch((saveError) => {
        setError(`Save failed: ${saveError.message}`)
        setSaving(false)
      })
  }

  function handleTest(action: string) {
    setTested(action)
    onTestKey(action)
    setTimeout(() => setTested(null), 800)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">SETTINGS</div>
          <button className="modal-close" onClick={onClose}>X</button>
        </div>

        <div className="modal-body">
          {error && <div className="settings-error">{error}</div>}

          {loading ? (
            <div className="offline-hint">Loading...</div>
          ) : (
            <>
              <section className="settings-section">
                <div className="settings-section-title">Key Bindings</div>
                <div className="settings-section-copy">Host-level launcher options now live in the Server Launcher. This web dialog only edits control mappings.</div>
                <pre className="modal-note">{NOTE}</pre>

                <div className="settings-binding-header">
                  <span />
                  <span>Action</span>
                  <span>Key combo</span>
                  <span>Test</span>
                </div>

                {Object.entries(bindings).map(([action, binding]) => (
                  <div key={action} className="binding-row settings-binding-row">
                    <div className={`settings-binding-dot ${draftBindings[action] ? 'active' : ''}`} />
                    <div>
                      <div className="binding-label">{binding.label}</div>
                      <div className="binding-desc">{binding.description}</div>
                    </div>
                    <input
                      className="binding-input"
                      value={draftBindings[action] ?? binding.key}
                      onChange={(event) => setDraftBindings((current) => ({ ...current, [action]: event.target.value }))}
                      placeholder="e.g. {F1}"
                      spellCheck={false}
                    />
                    <button
                      className="binding-test-btn"
                      onClick={() => handleTest(action)}
                      style={tested === action ? { borderColor: 'var(--c-green)', color: 'var(--c-green)' } : undefined}
                    >
                      {tested === action ? 'OK' : 'Test'}
                    </button>
                  </div>
                ))}
              </section>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn btn-save" onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
