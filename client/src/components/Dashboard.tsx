import React from 'react'
import { GameState } from '../types/gameData'
import { getDashboard } from '../dashboards'
import { DashboardHeader } from './dashboard/DashboardHeader'
import { GridLayout, ColumnsLayout } from './dashboard/DashboardLayouts'

interface Props {
  state: GameState
  wsConnected: boolean
  bridgeConnected: boolean
  lastDataTimestamp: number
  isInitialLoading: boolean
  dashboardId: string
  dashboardScale: number
  onKeyPress: (action: string) => void
  onChangeDashboard: (id: string) => void
  onChangeDashboardScale: (scale: number) => void
}

export function Dashboard({
  state,
  wsConnected,
  bridgeConnected,
  lastDataTimestamp,
  isInitialLoading,
  dashboardId,
  dashboardScale,
  onKeyPress,
  onChangeDashboard,
  onChangeDashboardScale,
}: Props) {
  const { _meta, ship } = state
  const config = getDashboard(dashboardId)
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
        flight={state.flight}
        combat={combat}
        onChangeDashboard={onChangeDashboard}
        onChangeDashboardScale={onChangeDashboardScale}
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
