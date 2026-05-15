import React from 'react'
import { GameState } from '../types/gameData'
import { DashboardConfig } from '../dashboards'
import { DashboardOption } from '../dashboardStore'
import { DashboardHeader } from './dashboard/DashboardHeader'
import { GridLayout, ColumnsLayout } from './dashboard/DashboardLayouts'

interface Props {
  state: GameState
  wsConnected: boolean
  bridgeConnected: boolean
  lastDataTimestamp: number
  isInitialLoading: boolean
  dashboardId: string
  dashboardConfig: DashboardConfig
  dashboards: DashboardOption[]
  dashboardScale: number
  onKeyPress: (action: string) => void
  onChangeDashboard: (id: string) => void
  onChangeDashboardScale: (scale: number) => void
  onOpenDashboardManager: () => void
}

export function Dashboard({
  state,
  wsConnected,
  bridgeConnected,
  lastDataTimestamp,
  isInitialLoading,
  dashboardId,
  dashboardConfig,
  dashboards,
  dashboardScale,
  onKeyPress,
  onChangeDashboard,
  onChangeDashboardScale,
  onOpenDashboardManager,
}: Props) {
  const { _meta, ship } = state
  const config = dashboardConfig
  const combat = state.combat
  const scaledLayoutStyle: React.CSSProperties = {
    '--dashboard-scale': String(dashboardScale),
  } as React.CSSProperties

  return (
    <div className="dashboard">
      <DashboardHeader
        meta={_meta}
        wsConnected={wsConnected}
        bridgeConnected={bridgeConnected}
        lastDataTimestamp={lastDataTimestamp}
        dashboardId={dashboardId}
        dashboardScale={dashboardScale}
        dashboards={dashboards}
        flight={state.flight}
        combat={combat}
        onChangeDashboard={onChangeDashboard}
        onChangeDashboardScale={onChangeDashboardScale}
        onOpenDashboardManager={onOpenDashboardManager}
      />

      <div className="dashboard-scale-frame">
        <div className="dashboard-scale-content" style={scaledLayoutStyle}>
          {ship.isDockedOrLanded && (
            <div className="docked-banner">DOCKED</div>
          )}

          {config.layout === 'grid'
            ? <GridLayout config={config} state={state} onKeyPress={onKeyPress} isInitialLoading={isInitialLoading} wsConnected={wsConnected} />
            : <ColumnsLayout config={config} state={state} onKeyPress={onKeyPress} isInitialLoading={isInitialLoading} wsConnected={wsConnected} />
          }
        </div>
      </div>
    </div>
  )
}
