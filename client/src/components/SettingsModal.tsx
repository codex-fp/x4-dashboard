import React, { useEffect, useState } from 'react'
import { KeyBinding, KeyBindings, RuntimeConfig, RuntimeConfigResponse } from '../types/gameData'

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

const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  allowRemoteControls: false,
  autoHotkeyPath: '',
  forceActivateGameWindow: false,
  gameWindowTitle: 'X4',
}

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
  const [runtimeConfig, setRuntimeConfig] = useState<RuntimeConfig>(DEFAULT_RUNTIME_CONFIG)
  const [startupInfo, setStartupInfo] = useState<{ port: number; mockMode: boolean } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [tested, setTested] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      requestJson<KeyBindings>('/api/keybindings'),
      requestJson<RuntimeConfigResponse>('/api/runtime-config'),
    ])
      .then(([bindingsData, runtimeData]: [KeyBindings, RuntimeConfigResponse]) => {
        const nextDraft: Record<string, string> = {}

        for (const [action, binding] of Object.entries(bindingsData.bindings || {})) {
          nextDraft[action] = binding.key
        }

        setBindings(bindingsData.bindings || {})
        setDraftBindings(nextDraft)
        setRuntimeConfig(runtimeData.config || DEFAULT_RUNTIME_CONFIG)
        setStartupInfo(runtimeData.startup || null)
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load settings from the server.')
        setLoading(false)
      })
  }, [])

  function updateRuntimeConfig<K extends keyof RuntimeConfig>(key: K, value: RuntimeConfig[K]) {
    setRuntimeConfig((current) => ({ ...current, [key]: value }))
  }

  function handleSave() {
    setSaving(true)
    setError('')

    const updatedBindings: Record<string, Partial<KeyBinding>> = {}
    for (const action of Object.keys(bindings)) {
      updatedBindings[action] = { key: draftBindings[action] || bindings[action]?.key || '' }
    }

    Promise.all([
      requestJson<RuntimeConfigResponse>('/api/runtime-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: runtimeConfig }),
      }),
      requestJson<KeyBindings>('/api/keybindings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bindings: updatedBindings }),
      }),
    ])
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
                <div className="settings-section-header">
                  <div>
                    <div className="settings-section-title">Runtime</div>
                    <div className="settings-section-copy">Control how the local server interacts with the host machine.</div>
                  </div>
                  {startupInfo && (
                    <div className="settings-startup-note">
                      Port {startupInfo.port} {startupInfo.mockMode ? '· Mock mode active' : ''}
                    </div>
                  )}
                </div>

                <label className="settings-toggle-row">
                  <div>
                    <div className="binding-label">Allow remote controls</div>
                    <div className="binding-desc">Lets other devices on your trusted LAN call control endpoints.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={runtimeConfig.allowRemoteControls}
                    onChange={(event) => updateRuntimeConfig('allowRemoteControls', event.target.checked)}
                  />
                </label>

                <label className="settings-toggle-row">
                  <div>
                    <div className="binding-label">Force activate game window</div>
                    <div className="binding-desc">Attempts to focus the X4 window before sending a key press.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={runtimeConfig.forceActivateGameWindow}
                    onChange={(event) => updateRuntimeConfig('forceActivateGameWindow', event.target.checked)}
                  />
                </label>

                <div className="settings-field-grid">
                  <label className="settings-field">
                    <span className="binding-label">Game window title match</span>
                    <input
                      className="binding-input"
                      value={runtimeConfig.gameWindowTitle}
                      onChange={(event) => updateRuntimeConfig('gameWindowTitle', event.target.value)}
                      placeholder="X4"
                      spellCheck={false}
                    />
                  </label>

                  <label className="settings-field">
                    <span className="binding-label">AutoHotkey executable path</span>
                    <input
                      className="binding-input"
                      value={runtimeConfig.autoHotkeyPath}
                      onChange={(event) => updateRuntimeConfig('autoHotkeyPath', event.target.value)}
                      placeholder="Optional custom path"
                      spellCheck={false}
                    />
                  </label>
                </div>

                <div className="settings-startup-note">
                  Port and mock mode still come from startup flags for now. These settings update the live runtime behavior without restarting the app.
                </div>
              </section>

              <section className="settings-section">
                <div className="settings-section-title">Key Bindings</div>
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
