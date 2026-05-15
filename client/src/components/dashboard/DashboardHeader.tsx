import React from 'react'
import { Animator, Text } from '@arwes/react'
import { DashboardOption } from '../../dashboardStore'
import { CombatState, ConnectionMeta, FlightState } from '../../types/gameData'
import { withBasePath } from '../../utils/network'

interface Props {
  meta: ConnectionMeta
  wsConnected: boolean
  bridgeConnected: boolean
  lastDataTimestamp: number
  dashboardId: string
  dashboardScale: number
  dashboards: DashboardOption[]
  flight: FlightState
  combat: CombatState
  onChangeDashboard: (id: string) => void
  onChangeDashboardScale: (scale: number) => void
  onOpenDashboardManager: () => void
}

const DASHBOARD_SCALE_OPTIONS = [0.5, 0.6, 0.75, 0.85, 1, 1.1, 1.25, 1.4, 1.6, 1.8, 2]

function postMockAction(endpoint: string) {
  void fetch(withBasePath(endpoint), { method: 'POST' }).catch(() => {})
}

export function DashboardHeader({
  meta,
  wsConnected,
  bridgeConnected,
  lastDataTimestamp,
  dashboardId,
  dashboardScale,
  dashboards,
  flight,
  combat,
  onChangeDashboard,
  onChangeDashboardScale,
  onOpenDashboardManager,
}: Props) {
  const lastSyncText = (() => {
    if (lastDataTimestamp === 0 || bridgeConnected) return null
    const seconds = Math.floor((Date.now() - lastDataTimestamp) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ago`
  })()
  const hasCombatAlert = combat.alertLevel > 0
  const combatButtonLabel = combat.alertLevel === 0
    ? 'START ALERT'
    : combat.alertLevel === 1
      ? 'START COMBAT'
      : 'END COMBAT'
  const missileButtonLabel = combat.missileIncoming
    ? 'CLEAR MISSILE'
    : combat.missileLockingOn
      ? 'MISSILE INBOUND'
      : 'MISSILE LOCK'

  return (
    <header className="dashboard-header">
      <Animator>
        <Text
          as="div"
          manager="decipher"
          fixed
          contentStyle={{ fontFamily: "'Exo 2', sans-serif" }}
          className="header-logo"
        >
          X4 FOUNDATIONS - DASHBOARD
        </Text>
      </Animator>

      <div className="header-right">
        <div className={`conn-badge ${bridgeConnected ? 'active' : 'inactive'}`}>
          <span className="conn-dot" />
          {bridgeConnected ? 'LIVE' : 'OFFLINE'}
        </div>

        {lastSyncText && (
          <div className="conn-badge inactive" style={{ fontSize: '0.7em', padding: '2px 6px' }}>
            Last sync: {lastSyncText}
          </div>
        )}

        {meta.externalConnected && (
          <div className="conn-badge active">
            <span className="conn-dot" />
            EXT APP
          </div>
        )}

        {meta.mockMode && (
          <>
            <button
              className={`header-settings-btn ${flight.travelDrive ? 'mock-travel-active' : ''}`}
              onClick={() => postMockAction('/api/mock/travel')}
            >
              {flight.travelDrive ? 'END TRAVEL' : 'TRAVEL MODE'}
            </button>
            <button
              className={`header-settings-btn ${flight.boosting ? 'mock-boost-active' : ''}`}
              onClick={() => postMockAction('/api/mock/boost')}
            >
              {flight.boosting ? 'END BOOST' : 'BOOST'}
            </button>
            <button
              className={`header-settings-btn ${hasCombatAlert ? 'mock-combat-active' : ''}`}
              onClick={() => postMockAction('/api/mock/combat')}
            >
              {combatButtonLabel}
            </button>
            <button
              className={`header-settings-btn ${combat.missileIncoming || combat.missileLockingOn ? 'mock-combat-active' : ''}`}
              onClick={() => postMockAction('/api/mock/missile')}
            >
              {missileButtonLabel}
            </button>
            <button
              className="header-settings-btn"
              onClick={() => postMockAction('/api/mock/content-less')}
            >
              LESS LISTS
            </button>
            <button
              className="header-settings-btn"
              onClick={() => postMockAction('/api/mock/content-more')}
            >
              MORE LISTS
            </button>
          </>
        )}

        <select className="dashboard-selector" value={dashboardId} onChange={(event) => onChangeDashboard(event.target.value)}>
          {dashboards.map((dashboard) => (
            <option key={dashboard.id} value={dashboard.id}>
              {dashboard.source === 'custom' ? `* ${dashboard.label}` : dashboard.label}
            </option>
          ))}
        </select>

        <button className="header-settings-btn" onClick={onOpenDashboardManager}>
          EDIT
        </button>

        <label className="dashboard-scale-control">
          <span className="dashboard-scale-label">Scale</span>
          <select
            className="dashboard-selector dashboard-scale-selector"
            value={String(dashboardScale)}
            onChange={(event) => onChangeDashboardScale(Number(event.target.value))}
          >
            {DASHBOARD_SCALE_OPTIONS.map((scale) => (
              <option key={scale} value={String(scale)}>
                {Math.round(scale * 100)}%
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
  )
}
