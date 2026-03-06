import React, { useEffect, useState } from 'react'
import { SystemFlags as SystemFlagsType, KeyBinding, KeyBindings } from '../types/gameData'

interface Props {
  systems: SystemFlagsType
  onKeyPress: (action: string) => void
}

const FLAG_CONFIG: Array<{
  key: keyof SystemFlagsType
  action: string
  icon: string
  label: string
}> = [
  { key: 'flightAssist',       action: 'flightAssist',  icon: '⊳', label: 'Flight Assist' },
  { key: 'seta',               action: 'seta',           icon: '≫', label: 'SETA' },
  { key: 'autopilot',          action: 'autopilot',      icon: '⊡', label: 'Autopilot' },
  { key: 'travelDrive',        action: 'travelDrive',    icon: '△', label: 'Travel Drive' },
  { key: 'shieldsUp',          action: 'shieldBoost',    icon: '⬡', label: 'Shield Boost' },
  { key: 'hardpointsDeployed', action: 'hardpoints',     icon: '⊠', label: 'Weapons' },
  { key: 'landingGearDown',    action: 'landingGear',    icon: '⊟', label: 'Landing Gear' },
  { key: 'lightsOn',           action: 'lightsOn',       icon: '⊙', label: 'Lights' },
  { key: 'boost',              action: 'boostEngine',    icon: '▲', label: 'Boost' },
  { key: 'silentRunning',      action: 'silentRunning',  icon: '◌', label: 'Silent' },
]

export function SystemFlags({ systems, onKeyPress }: Props) {
  const [bindings, setBindings] = useState<Record<string, KeyBinding>>({})
  const [pressing, setPressing] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/keybindings')
      .then(r => r.json())
      .then((data: KeyBindings) => setBindings(data.bindings || {}))
      .catch(() => {})
  }, [])

  function handlePress(action: string) {
    if (!bindings[action]) return

    setPressing(action)
    onKeyPress(action)
    setTimeout(() => setPressing(null), 200)
  }

  return (
    <>
      <div className="sysflags-grid">
        {FLAG_CONFIG.map(({ key, action, icon, label }) => {
          const isOn = !!systems[key]
          const binding = bindings[action]
          const isPressed = pressing === action

          return (
            <button
              key={key}
              className={`sysflag-btn ${isOn ? 'on' : 'off'} ${!binding ? 'no-binding' : ''}`}
              onClick={() => handlePress(action)}
              disabled={!binding}
              title={
                binding
                  ? `${label}: ${isOn ? 'ON' : 'OFF'} — Press: ${binding.key}`
                  : `${label}: No key binding. Configure in ⎔ KEY BINDINGS.`
              }
              style={isPressed ? { transform: 'scale(0.92)', opacity: 0.65 } : undefined}
            >
              <span className="sysflag-icon">{icon}</span>
              <span className="sysflag-name">{label}</span>
              <span className={`sysflag-state ${isOn ? 'state-on' : 'state-off'}`}>
                {isOn ? '● ON' : '○ OFF'}
              </span>
              {binding && (
                <span className="sysflag-key">{binding.key}</span>
              )}
            </button>
          )
        })}
      </div>

      <div style={{
        marginTop: '8px', fontSize: '9px', color: 'var(--c-text-dim)',
        letterSpacing: '1px', opacity: 0.55, lineHeight: 1.5,
      }}>
        Click to toggle · Keys sent to active game window · Configure via ⎔ KEY BINDINGS
      </div>
    </>
  )
}
