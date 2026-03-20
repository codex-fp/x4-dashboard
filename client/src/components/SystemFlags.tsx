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
  autopilot: { key: 'autopilot', action: 'autopilot', icon: '◈', label: 'Autopilot' },
  map: { action: 'openMap', icon: '⌖', label: 'Map', stateless: true },
  scanMode: { key: 'scanMode', action: 'scanMode', icon: '◌', label: 'Scan Mode' },
  longRangeScan: { key: 'longRangeScan', action: 'longRangeScan', icon: '◎', label: 'Long-Range' },
  missionManager: { action: 'openMissionManager', icon: '▤', label: 'Missions', stateless: true },
}

let bindingsCache: Record<string, KeyBinding> | null = null
let bindingsRequest: Promise<Record<string, KeyBinding>> | null = null

function loadBindings(): Promise<Record<string, KeyBinding>> {
  if (bindingsCache) return Promise.resolve(bindingsCache)

  if (!bindingsRequest) {
    bindingsRequest = fetch('/api/keybindings')
      .then(r => {
        if (!r.ok) throw new Error('Unable to load key bindings')
        return r.json()
      })
      .then((data: KeyBindings) => {
        bindingsCache = data.bindings || {}
        return bindingsCache
      })
      .finally(() => {
        bindingsRequest = null
      })
  }

  return bindingsRequest
}

function useSystemFlagBindings() {
  const [bindings, setBindings] = useState<Record<string, KeyBinding>>(bindingsCache || {})
  const [loading, setLoading] = useState(!bindingsCache)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    let active = true

    setLoading(!bindingsCache)
    setLoadFailed(false)

    loadBindings()
      .then(data => {
        if (!active) return
        setBindings(data)
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setBindings({})
        setLoading(false)
        setLoadFailed(true)
      })

    return () => {
      active = false
    }
  }, [])

  return { bindings, loading, loadFailed }
}

function SystemFlagToggle({ flight, onKeyPress, config }: Props & { config: FlagConfig }) {
  const { bindings, loading, loadFailed } = useSystemFlagBindings()
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
  const hasBinding = Boolean(binding?.key)
  const isPressed = pressing === action
  const stateLabel = loading
    ? '… SYNC'
    : loadFailed
      ? '◌ HOST'
      : !hasBinding
        ? '∅ UNSET'
        : stateless
          ? '◌ CMD'
          : isOn ? '● ON' : '○ OFF'

  function getTitle(): string {
    if (loading) {
      return `${label}: Loading key binding from the Server Launcher.`
    }

    if (loadFailed) {
      return `${label}: Key bindings unavailable. Check the Server Launcher connection.`
    }

    if (!hasBinding) {
      return `${label}: No key binding. Configure it in the Server Launcher.`
    }

    return `${label}: ${stateless ? 'COMMAND' : isOn ? 'ON' : 'OFF'} - Press: ${binding?.key}`
  }

  return (
    <button
      className={`sysflag-btn ${isOn ? 'on' : 'off'} ${stateless ? 'stateless' : ''} ${loading ? 'binding-loading' : ''} ${loadFailed ? 'binding-error' : ''} ${!loading && !loadFailed && !hasBinding ? 'no-binding' : ''}`}
      onClick={handlePress}
      disabled={loading || loadFailed || !hasBinding}
      title={getTitle()}
      style={isPressed ? { transform: 'scale(0.92)', opacity: 0.65 } : undefined}
    >
      <span className="sysflag-icon">{icon}</span>
      <span className="sysflag-name">{label}</span>
      <span className={`sysflag-state ${!stateless && isOn ? 'state-on' : 'state-off'}`}>
        {stateLabel}
      </span>
      {hasBinding && <span className="sysflag-key">{binding?.key}</span>}
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

export function ScanModeToggleWidget(props: Props) {
  return <SystemFlagToggle {...props} config={FLAG_CONFIG.scanMode} />
}

export function LongRangeScanToggleWidget(props: Props) {
  return <SystemFlagToggle {...props} config={FLAG_CONFIG.longRangeScan} />
}

export function MissionManagerToggleWidget(props: Props) {
  return <SystemFlagToggle {...props} config={FLAG_CONFIG.missionManager} />
}
