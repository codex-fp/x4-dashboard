import React, { useEffect, useState } from 'react'
import { FlightState, KeyBinding, KeyBindings } from '../types/gameData'

interface Props {
  flight: FlightState
  onKeyPress: (action: string) => void
}

interface FlagConfig {
  key?: keyof FlightState
  action: string
  icon: string
  label: string
  stateless?: boolean
}

const FLAG_CONFIG: Record<string, FlagConfig> = {
  flightAssist: { key: 'flightAssist', action: 'flightAssist', icon: '⊳', label: 'Flight Assist' },
  seta: { key: 'seta', action: 'seta', icon: '≫', label: 'SETA' },
  travelDrive: { key: 'travelDrive', action: 'travelDrive', icon: '△', label: 'Travel Drive' },
  autopilot: { action: 'autopilot', icon: '◈', label: 'Autopilot', stateless: true },
  map: { action: 'openMap', icon: '⌖', label: 'Map', stateless: true },
}

let bindingsCache: Record<string, KeyBinding> | null = null
let bindingsRequest: Promise<Record<string, KeyBinding>> | null = null

function loadBindings(): Promise<Record<string, KeyBinding>> {
  if (bindingsCache) return Promise.resolve(bindingsCache)

  if (!bindingsRequest) {
    bindingsRequest = fetch('/api/keybindings')
      .then(r => r.json())
      .then((data: KeyBindings) => {
        bindingsCache = data.bindings || {}
        return bindingsCache
      })
      .catch(() => ({}))
  }

  return bindingsRequest
}

function useSystemFlagBindings() {
  const [bindings, setBindings] = useState<Record<string, KeyBinding>>(bindingsCache || {})

  useEffect(() => {
    let active = true

    loadBindings().then(data => {
      if (active) setBindings(data)
    })

    return () => {
      active = false
    }
  }, [])

  return bindings
}

function SystemFlagToggle({ flight, onKeyPress, config }: Props & { config: FlagConfig }) {
  const bindings = useSystemFlagBindings()
  const [pressing, setPressing] = useState<string | null>(null)
  const { key, action, icon, label, stateless } = config

  function handlePress() {
    if (!bindings[action]) return

    setPressing(action)
    onKeyPress(action)
    setTimeout(() => setPressing(null), 200)
  }

  const isOn = key ? !!flight[key] : false
  const binding = bindings[action]
  const isPressed = pressing === action
  const stateLabel = stateless ? '◌ CMD' : isOn ? '● ON' : '○ OFF'

  return (
    <button
      className={`sysflag-btn ${isOn ? 'on' : 'off'} ${!binding ? 'no-binding' : ''}`}
      onClick={handlePress}
      disabled={!binding}
      title={
        binding
          ? `${label}: ${stateless ? 'COMMAND' : isOn ? 'ON' : 'OFF'} - Press: ${binding.key}`
          : `${label}: No key binding. Configure in KEY BINDINGS.`
      }
      style={isPressed ? { transform: 'scale(0.92)', opacity: 0.65 } : undefined}
    >
      <span className="sysflag-icon">{icon}</span>
      <span className="sysflag-name">{label}</span>
      <span className={`sysflag-state ${!stateless && isOn ? 'state-on' : 'state-off'}`}>
        {stateLabel}
      </span>
      {binding && <span className="sysflag-key">{binding.key}</span>}
    </button>
  )
}

export function FlightAssistToggleWidget(props: Props) {
  return <SystemFlagToggle {...props} config={FLAG_CONFIG.flightAssist} />
}

export function SetaToggleWidget(props: Props) {
  return <SystemFlagToggle {...props} config={FLAG_CONFIG.seta} />
}

export function TravelDriveToggleWidget(props: Props) {
  return <SystemFlagToggle {...props} config={FLAG_CONFIG.travelDrive} />
}

export function AutopilotToggleWidget(props: Props) {
  return <SystemFlagToggle {...props} config={FLAG_CONFIG.autopilot} />
}

export function MapToggleWidget(props: Props) {
  return <SystemFlagToggle {...props} config={FLAG_CONFIG.map} />
}
