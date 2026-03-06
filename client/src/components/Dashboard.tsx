import React from 'react'
import { Animator, Text } from '@arwes/react'
import { GameState } from '../types/gameData'
import { DASHBOARDS, getDashboard, WidgetId, PanelDisplay, GridDashboard, ColumnsDashboard } from '../dashboards'
import { ArwesPanel } from './ArwesPanel'
import { UnderAttackAlert } from './UnderAttackAlert'
import { PlayerInfo } from './PlayerInfo'
import { ShipShieldsWidget, ShipHullWidget, ShipCargoWidget, ShipStatusWidget } from './ShipStatus'
import { TargetInfoWidget, TargetShieldsWidget, TargetHullWidget } from './TargetInfo'
import { NavHeadingWidget, NavSpeedometerWidget } from './Navigation'
import { SystemFlags } from './SystemFlags'
import { MissionOffers } from './MissionOffers'
import { ActiveMission } from './ActiveMission'
import { Comms } from './Comms'
import { Research } from './Research'

interface Props {
  state: GameState
  wsConnected: boolean
  dashboardId: string
  onKeyPress: (action: string) => void
  onOpenSettings: () => void
  onChangeDashboard: (id: string) => void
}

function renderWidget(
  id: WidgetId,
  state: GameState,
  onKeyPress: (action: string) => void,
): React.ReactNode {
  switch (id) {
    case 'PlayerInfo':     return <PlayerInfo player={state.player} ship={state.ship} />
    case 'ShipShields':    return <ShipShieldsWidget ship={state.ship} />
    case 'ShipHull':       return <ShipHullWidget ship={state.ship} />
    case 'ShipCargo':      return <ShipCargoWidget ship={state.ship} />
    case 'ShipStatus':     return <ShipStatusWidget ship={state.ship} />
    case 'TargetShields':  return state.combat.target ? <TargetShieldsWidget target={state.combat.target} /> : null
    case 'TargetHull':     return state.combat.target ? <TargetHullWidget target={state.combat.target} /> : null
    case 'TargetInfo':     return state.combat.target ? <TargetInfoWidget target={state.combat.target} /> : null
    case 'NavHeading':     return <NavHeadingWidget nav={state.navigation} systems={state.systems} />
    case 'NavSpeedometer': return <NavSpeedometerWidget nav={state.navigation} ship={state.ship} />
    case 'SystemFlags':    return <SystemFlags systems={state.systems} onKeyPress={onKeyPress} />
    case 'ActiveMission':  return <ActiveMission mission={state.activeMission} />
    case 'MissionOffers':  return <MissionOffers offers={state.missionOffers} />
    case 'Comms':          return <Comms comms={state.comms} logbook={state.logbook} />
    case 'Research':       return <Research research={state.currentResearch} />
    case 'UnderAttack':    return state.combat.underAttack ? <UnderAttackAlert attackType={state.combat.attackType} /> : null
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
      <div style={{ display: 'grid', gridTemplateColumns: internal.columns, flex: 1, minHeight: 0 }}>
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
              {renderWidget(w.id, state, onKeyPress)}
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
  const underAttackPlacement = config.panels.find(p => p.id === 'underAttack')
  const rowOffset = (underAttackPlacement && state.combat.underAttack)
    ? (underAttackPlacement.rowSpan ?? 1)
    : 0

  return (
    <div
      className="dashboard-grid"
      style={{ gridTemplateColumns: config.columns }}
    >
      {config.panels.map(item => {
        const content = renderPanel(item, state, onKeyPress)
        if (content === null) return null
        const effectiveRow = (item.id !== 'underAttack' && rowOffset > 0 && item.row >= underAttackPlacement!.row)
          ? item.row + rowOffset
          : item.row
        return (
          <div
            key={`${item.col}-${item.row}`}
            className="dashboard-grid-cell"
            style={{
              gridColumn: item.colSpan ? `${item.col} / span ${item.colSpan}` : item.col,
              gridRow:    item.rowSpan ? `${effectiveRow} / span ${item.rowSpan}` : effectiveRow,
              ...(item.scale && item.scale !== 1 ? { zoom: item.scale } : {}),
              ...(item.grow ? { alignSelf: 'stretch' } : {}),
              ...(item.height ? { height: item.height } : {}),
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

export function Dashboard({ state, wsConnected, dashboardId, onKeyPress, onOpenSettings, onChangeDashboard }: Props) {
  const { _meta, ship } = state
  const config = getDashboard(dashboardId)

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
            X4 FOUNDATIONS · COMMAND INTERFACE
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
          {_meta.simpitConnected && (
            <div className="conn-badge active">
              <span className="conn-dot" />
              SIMPIT
            </div>
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

          <button className="header-settings-btn" onClick={onOpenSettings}>
            ⎔ KEY BINDINGS
          </button>
        </div>
      </header>

      {/* ── Docked/Landed banner — full width, conditional ── */}
      {ship.isDockedOrLanded && (
        <div className="docked-banner">
          {ship.landingGearDown ? '⊟ DOCKED' : '▼ LANDED'}
          {state.docked?.stationName && ` · ${state.docked.stationName}`}
        </div>
      )}

      {/* ── Config-driven layout ────────────────── */}
      {config.layout === 'grid'
        ? <GridLayout config={config} state={state} onKeyPress={onKeyPress} />
        : <ColumnsLayout config={config} state={state} onKeyPress={onKeyPress} />
      }
    </div>
  )
}
