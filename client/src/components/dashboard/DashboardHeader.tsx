import React from 'react'
import { Animator, Text } from '@arwes/react'
import { DASHBOARDS } from '../../dashboards'
import { ConnectionMeta, FlightState } from '../../types/gameData'

interface Props {
  meta: ConnectionMeta
  wsConnected: boolean
  dashboardId: string
  dashboardScale: number
  flight: FlightState
  inCombat: boolean
  onOpenSettings: () => void
  onChangeDashboard: (id: string) => void
  onChangeDashboardScale: (scale: number) => void
}

const DASHBOARD_SCALE_OPTIONS = [0.5, 0.6, 0.75, 0.85, 1, 1.1, 1.25, 1.4, 1.6, 1.8, 2]

function postMockAction(endpoint: string) {
  void fetch(endpoint, { method: 'POST' }).catch(() => {})
}

export function DashboardHeader({
  meta,
  wsConnected,
  dashboardId,
  dashboardScale,
  flight,
  inCombat,
  onOpenSettings,
  onChangeDashboard,
  onChangeDashboardScale,
}: Props) {
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
        <div className={`conn-badge ${wsConnected ? 'active' : 'inactive'}`}>
          <span className="conn-dot" />
          {wsConnected ? 'LIVE' : 'OFFLINE'}
        </div>

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
              className={`header-settings-btn ${inCombat ? 'mock-combat-active' : ''}`}
              onClick={() => postMockAction('/api/mock/combat')}
            >
              {inCombat ? 'END COMBAT' : 'START COMBAT'}
            </button>
          </>
        )}

        <select className="dashboard-selector" value={dashboardId} onChange={(event) => onChangeDashboard(event.target.value)}>
          {DASHBOARDS.map((dashboard) => (
            <option key={dashboard.id} value={dashboard.id}>
              {dashboard.label}
            </option>
          ))}
        </select>

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

        <button className="header-settings-btn" onClick={onOpenSettings}>
          SETTINGS
        </button>
      </div>
    </header>
  )
}
