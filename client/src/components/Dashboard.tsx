import React from 'react'
import { Animator, Text } from '@arwes/react'
import { GameState } from '../types/gameData'
import { DASHBOARDS, getDashboard, WidgetId, PanelDisplay, GridDashboard, ColumnsDashboard } from '../dashboards'
import { ArwesPanel } from './ArwesPanel'
import { PlayerInfo } from './PlayerInfo'
import { ShipShieldsWidget, ShipHullWidget, ShipCargoWidget, ShipStatusWidget } from './ShipStatus'
import { TargetInfoWidget, TargetShieldsWidget, TargetHullWidget } from './TargetInfo'
import { NavHeadingWidget, NavSpeedometerWidget } from './Navigation'
import {
  AutopilotToggleWidget,
  FlightAssistToggleWidget,
  MapToggleWidget,
  SetaToggleWidget,
  TravelDriveToggleWidget,
} from './SystemFlags'
import { MissionOffers } from './MissionOffers'
import { ActiveMission } from './ActiveMission'
import { Comms } from './Comms'
import { Research } from './Research'
import { UnderAttackAlert } from './UnderAttackAlert'

interface Props {
  state: GameState
  wsConnected: boolean
  dashboardId: string
  dashboardScale: number
  onKeyPress: (action: string) => void
  onOpenSettings: () => void
  onChangeDashboard: (id: string) => void
  onChangeDashboardScale: (scale: number) => void
}

const DASHBOARD_SCALE_OPTIONS = [0.5, 0.6, 0.75, 0.85, 1, 1.1, 1.25, 1.4, 1.6, 1.8, 2]

function hasCombatTarget(target: GameState['combat']['target']): boolean {
  if (!target) return false
  return Boolean(
    target.name?.trim() ||
    target.shipName?.trim() ||
    target.faction?.trim() ||
    target.legalStatus?.trim() ||
    target.combatRank?.trim() ||
    target.isHostile ||
    target.bounty > 0 ||
    target.distance > 0,
  )
}

function renderWidget(
  id: WidgetId,
  state: GameState,
  onKeyPress: (action: string) => void,
  scale: number = 1,
): React.ReactNode {
  const target = hasCombatTarget(state.combat.target) ? state.combat.target : null

  switch (id) {
    case 'PlayerInfo':     return <PlayerInfo player={state.player} ship={state.ship} />
    case 'ShipShields':    return <ShipShieldsWidget ship={state.ship} />
    case 'ShipHull':       return <ShipHullWidget ship={state.ship} />
    case 'ShipCargo':      return <ShipCargoWidget ship={state.ship} />
    case 'ShipStatus':     return <ShipStatusWidget ship={state.ship} />
    case 'TargetShields':  return target ? <TargetShieldsWidget target={target} /> : null
    case 'TargetHull':     return target ? <TargetHullWidget target={target} /> : null
    case 'TargetInfo':     return <TargetInfoWidget target={target} />
    case 'NavHeading':     return <NavHeadingWidget player={state.player} flight={state.flight} />
    case 'NavSpeedometer': return <NavSpeedometerWidget flight={state.flight} scale={scale} />
    case 'FlightAssistToggle': return <FlightAssistToggleWidget flight={state.flight} onKeyPress={onKeyPress} />
    case 'SetaToggle':         return <SetaToggleWidget flight={state.flight} onKeyPress={onKeyPress} />
    case 'TravelDriveToggle':  return <TravelDriveToggleWidget flight={state.flight} onKeyPress={onKeyPress} />
    case 'AutopilotToggle':    return <AutopilotToggleWidget flight={state.flight} onKeyPress={onKeyPress} />
    case 'MapToggle':          return <MapToggleWidget flight={state.flight} onKeyPress={onKeyPress} />
    case 'ActiveMission':  return <ActiveMission mission={state.activeMission} />
    case 'MissionOffers':  return <MissionOffers offers={state.missionOffers} />
    case 'Comms':          return <Comms logbook={state.logbook} />
    case 'Research':       return <Research research={state.currentResearch} />
    case 'UnderAttack':
      if (state.combat.alertLevel === 0) return null
      return <UnderAttackAlert alertLevel={state.combat.alertLevel} attackerCount={state.combat.attackerCount} incomingMissiles={state.combat.incomingMissiles} />
  }
}

function renderPanelContent(
  panel: PanelDisplay,
  state: GameState,
  onKeyPress: (action: string) => void,
): React.ReactNode {
  const { internal } = panel
  if (internal.layout === 'grid') {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: internal.columns,
        gap: internal.gap ?? '6px',
        justifyContent: internal.justifyContent,
        justifyItems: internal.justifyItems,
        alignContent: internal.alignContent,
        alignItems: internal.alignItems,
        width: internal.width,
        flex: 1,
        minHeight: 0,
      }}>
        {internal.widgets.map(w => (
          <div
            key={w.id}
            style={{
              display: 'flex', flexDirection: 'column',
              gridColumn: w.colSpan ? `${w.col} / span ${w.colSpan}` : w.col,
              gridRow: w.rowSpan ? `${w.row} / span ${w.rowSpan}` : w.row,
              ...(w.scale && w.scale !== 1 ? { zoom: w.scale } : {}),
              ...(w.grow ? { alignSelf: 'stretch' } : {}),
              ...(w.height ? { height: w.height } : {}),
            }}
          >
            {renderWidget(w.id, state, onKeyPress)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'row' }}>
      {internal.columns.map((col, i) => (
        <div
          key={i}
          style={{
            width: col.width,
            flex: col.width ? undefined : 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          {col.widgets.map(w => (
            <div
              key={w.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                ...(w.scale && w.scale !== 1 ? { zoom: w.scale } : {}),
                ...(w.grow ? { flex: 1, minHeight: 0 } : w.height ? { height: w.height } : {}),
              }}
            >
              {renderWidget(w.id, state, onKeyPress, w.scale ?? 1)}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function renderPanel(
  panel: PanelDisplay,
  state: GameState,
  onKeyPress: (action: string) => void,
): React.ReactNode {
  const color = panel.colorFn ? panel.colorFn(state) : (panel.color ?? 'primary')
  const content = renderPanelContent(panel, state, onKeyPress)
  if (panel.frameless) return content
  return (
    <ArwesPanel title={panel.title} titleIcon={panel.titleIcon} color={color} style={panel.style}>
      {content}
    </ArwesPanel>
  )
}

interface LayoutProps {
  state: GameState
  onKeyPress: (action: string) => void
}

function GridLayout({ config, state, onKeyPress }: LayoutProps & { config: GridDashboard }) {
  return (
    <div
      className="dashboard-grid"
      style={{ gridTemplateColumns: config.columns }}
    >
      {config.panels.map(item => {
        const content = renderPanel(item, state, onKeyPress)
        if (content === null) return null
        return (
          <div
            key={`${item.col}-${item.row}`}
            className="dashboard-grid-cell"
            style={{
              gridColumn: item.colSpan ? `${item.col} / span ${item.colSpan}` : item.col,
              gridRow:    item.rowSpan ? `${item.row} / span ${item.rowSpan}` : item.row,
              ...(item.scale && item.scale !== 1 ? { zoom: item.scale } : {}),
              ...(item.grow ? { alignSelf: 'stretch' } : {}),
              ...(item.height ? { height: item.height } : {}),
              ...(item.frameless && item.style ? item.style : {}),
            }}
          >
            {content}
          </div>
        )
      })}
    </div>
  )
}

function ColumnsLayout({ config, state, onKeyPress }: LayoutProps & { config: ColumnsDashboard }) {
  return (
    <div className="dashboard-columns">
      {config.columns.map((col, colIdx) => (
        <div
          key={colIdx}
          className="dashboard-column"
          style={col.width ? { width: col.width, flexShrink: 0 } : { flex: 1 }}
        >
          {col.panels.map((item, idx) => {
            const content = renderPanel(item, state, onKeyPress)
            if (content === null) return null
            return (
              <div
                key={idx}
                className="dashboard-grid-cell"
                style={{
                  ...(item.scale && item.scale !== 1 ? { zoom: item.scale } : {}),
                  ...(item.grow ? { flex: 1, minHeight: 0 } : {}),
                  ...(item.height ? { height: item.height } : {}),
                }}
              >
                {content}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function toggleMockCombat() {
  fetch('/api/mock/combat', { method: 'POST' }).catch(() => {})
}

function toggleMockTravel() {
  fetch('/api/mock/travel', { method: 'POST' }).catch(() => {})
}

function toggleMockBoost() {
  fetch('/api/mock/boost', { method: 'POST' }).catch(() => {})
}

export function Dashboard({
  state,
  wsConnected,
  dashboardId,
  dashboardScale,
  onKeyPress,
  onOpenSettings,
  onChangeDashboard,
  onChangeDashboardScale,
}: Props) {
  const { _meta, ship } = state
  const config = getDashboard(dashboardId)
  const inCombat     = state.combat.alertLevel > 0
  const inTravel     = state.flight.travelDrive
  const inBoost      = state.flight.boosting
  const scaledLayoutStyle: React.CSSProperties = {
    '--dashboard-scale': String(dashboardScale),
  } as React.CSSProperties

  return (
    <div className="dashboard">
      {/* ── Header ─────────────────────────────── */}
      <header className="dashboard-header">
        <Animator>
          <Text
            as="div"
            manager="decipher"
            fixed
            contentStyle={{ fontFamily: "'Exo 2', sans-serif" }}
            className="header-logo"
          >
            X4 FOUNDATIONS · DASHBOARD
          </Text>
        </Animator>

        <div className="header-right">
          <div className={`conn-badge ${wsConnected ? 'active' : 'inactive'}`}>
            <span className="conn-dot" />
            {wsConnected ? 'LIVE' : 'OFFLINE'}
          </div>
          {_meta.externalConnected && (
            <div className="conn-badge active">
              <span className="conn-dot" />
              EXT APP
            </div>
          )}
          {_meta.mockMode && (
            <>
              <button
                className={`header-settings-btn ${inTravel ? 'mock-travel-active' : ''}`}
                onClick={toggleMockTravel}
              >
                {inTravel ? '△ END TRAVEL' : '△ TRAVEL MODE'}
              </button>
              <button
                className={`header-settings-btn ${inBoost ? 'mock-boost-active' : ''}`}
                onClick={toggleMockBoost}
              >
                {inBoost ? '▲ END BOOST' : '▲ BOOST'}
              </button>
              <button
                className={`header-settings-btn ${inCombat ? 'mock-combat-active' : ''}`}
                onClick={toggleMockCombat}
              >
                {inCombat ? '⚔ END COMBAT' : '⚔ START COMBAT'}
              </button>
            </>
          )}
          {/* ── Dashboard selector ── */}
          <select
            className="dashboard-selector"
            value={dashboardId}
            onChange={e => onChangeDashboard(e.target.value)}
          >
            {DASHBOARDS.map(d => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>

          <label className="dashboard-scale-control">
            <span className="dashboard-scale-label">Scale</span>
            <select
              className="dashboard-selector dashboard-scale-selector"
              value={String(dashboardScale)}
              onChange={e => onChangeDashboardScale(Number(e.target.value))}
            >
              {DASHBOARD_SCALE_OPTIONS.map(scale => (
                <option key={scale} value={String(scale)}>{Math.round(scale * 100)}%</option>
              ))}
            </select>
          </label>

          <button className="header-settings-btn" onClick={onOpenSettings}>
            ⎔ KEY BINDINGS
          </button>
        </div>
      </header>

      <div className="dashboard-scale-frame">
        <div className="dashboard-scale-content" style={scaledLayoutStyle}>
          {/* ── Docked/Landed banner — full width, conditional ── */}
          {ship.isDockedOrLanded && (
            <div className="docked-banner">▼ DOCKED</div>
          )}

          {/* ── Config-driven layout ────────────────── */}
          {config.layout === 'grid'
            ? <GridLayout config={config} state={state} onKeyPress={onKeyPress} />
            : <ColumnsLayout config={config} state={state} onKeyPress={onKeyPress} />
          }
        </div>
      </div>
    </div>
  )
}
