import React from 'react'
import { GameState, CombatTarget } from '../../types/gameData'
import { KnownWidgetId, WidgetId } from '../../dashboards'
import { PlayerInfo } from '../PlayerInfo'
import { ShipShieldsWidget, ShipHullWidget, ShipCargoWidget, ShipStatusWidget } from '../ShipStatus'
import { TargetInfoWidget, TargetShieldsWidget, TargetHullWidget } from '../TargetInfo'
import { NavHeadingWidget, NavSpeedometerWidget } from '../Navigation'
import {
  AutopilotToggleWidget,
  FlightAssistToggleWidget,
  LongRangeScanToggleWidget,
  MapToggleWidget,
  MissionManagerToggleWidget,
  ScanModeToggleWidget,
  SetaToggleWidget,
  TravelDriveToggleWidget,
} from '../SystemFlags'
import { MissionOffers } from '../MissionOffers'
import { ActiveMission } from '../ActiveMission'
import { Comms } from '../Comms'
import { Factions } from '../Factions'
import { Agents } from '../Agents'
import { Inventory } from '../Inventory'
import { Research } from '../Research'
import { TransactionLog } from '../TransactionLog'
import { UnderAttackAlert } from '../UnderAttackAlert'
import { hasCombatTarget } from '../../utils/gameState'

interface RenderWidgetOptions {
  id: WidgetId
  state: GameState
  onKeyPress: (action: string) => void
  scale?: number
  isInitialLoading: boolean
  isOffline: boolean
}

export interface WidgetMetadata {
  id: KnownWidgetId
  label: string
  category: 'Pilot' | 'Ship' | 'Target' | 'Navigation' | 'Controls' | 'Operations' | 'Alerts'
  minW: number
  minH: number
  defaultW: number
  defaultH: number
  supportsScale: boolean
  dataStateNote: string
}

export const WIDGET_REGISTRY: WidgetMetadata[] = [
  { id: 'PlayerInfo', label: 'Pilot Profile', category: 'Pilot', minW: 3, minH: 2, defaultW: 4, defaultH: 2, supportsScale: true, dataStateNote: 'Pilot identity, credits, sector, and ship.' },
  { id: 'ShipShields', label: 'Ship Shields', category: 'Ship', minW: 3, minH: 1, defaultW: 4, defaultH: 2, supportsScale: true, dataStateNote: 'Controlled ship shield status.' },
  { id: 'ShipHull', label: 'Ship Hull', category: 'Ship', minW: 3, minH: 1, defaultW: 4, defaultH: 2, supportsScale: true, dataStateNote: 'Controlled ship hull status.' },
  { id: 'ShipCargo', label: 'Ship Cargo', category: 'Ship', minW: 3, minH: 1, defaultW: 4, defaultH: 2, supportsScale: true, dataStateNote: 'Cargo-oriented placeholder widget.' },
  { id: 'ShipStatus', label: 'Ship Status', category: 'Ship', minW: 4, minH: 2, defaultW: 5, defaultH: 3, supportsScale: true, dataStateNote: 'Controlled ship status summary.' },
  { id: 'TargetShields', label: 'Target Shields', category: 'Target', minW: 3, minH: 1, defaultW: 4, defaultH: 2, supportsScale: true, dataStateNote: 'Current target shields.' },
  { id: 'TargetHull', label: 'Target Hull', category: 'Target', minW: 3, minH: 1, defaultW: 4, defaultH: 2, supportsScale: true, dataStateNote: 'Current target hull.' },
  { id: 'TargetInfo', label: 'Target Info', category: 'Target', minW: 4, minH: 2, defaultW: 5, defaultH: 3, supportsScale: true, dataStateNote: 'Current target identity and combat details.' },
  { id: 'NavHeading', label: 'Navigation Heading', category: 'Navigation', minW: 4, minH: 2, defaultW: 5, defaultH: 2, supportsScale: true, dataStateNote: 'Sector, heading, legal status, and speed facts.' },
  { id: 'NavSpeedometer', label: 'Speedometer', category: 'Navigation', minW: 4, minH: 4, defaultW: 6, defaultH: 5, supportsScale: true, dataStateNote: 'Live speed, boost, and travel drive readout.' },
  { id: 'FlightAssistToggle', label: 'Flight Assist', category: 'Controls', minW: 2, minH: 2, defaultW: 3, defaultH: 2, supportsScale: true, dataStateNote: 'Host keypress control.' },
  { id: 'SetaToggle', label: 'SETA', category: 'Controls', minW: 2, minH: 2, defaultW: 3, defaultH: 2, supportsScale: true, dataStateNote: 'Host keypress control.' },
  { id: 'TravelDriveToggle', label: 'Travel Drive', category: 'Controls', minW: 2, minH: 2, defaultW: 3, defaultH: 2, supportsScale: true, dataStateNote: 'Host keypress control.' },
  { id: 'AutopilotToggle', label: 'Autopilot', category: 'Controls', minW: 2, minH: 2, defaultW: 3, defaultH: 2, supportsScale: true, dataStateNote: 'Host keypress control.' },
  { id: 'MapToggle', label: 'Map', category: 'Controls', minW: 2, minH: 2, defaultW: 3, defaultH: 2, supportsScale: true, dataStateNote: 'Host keypress control.' },
  { id: 'ScanModeToggle', label: 'Scan Mode', category: 'Controls', minW: 2, minH: 2, defaultW: 3, defaultH: 2, supportsScale: true, dataStateNote: 'Host keypress control.' },
  { id: 'LongRangeScanToggle', label: 'Long Range Scan', category: 'Controls', minW: 2, minH: 2, defaultW: 3, defaultH: 2, supportsScale: true, dataStateNote: 'Host keypress control.' },
  { id: 'MissionManagerToggle', label: 'Mission Manager', category: 'Controls', minW: 2, minH: 2, defaultW: 3, defaultH: 2, supportsScale: true, dataStateNote: 'Host keypress control.' },
  { id: 'ActiveMission', label: 'Active Mission', category: 'Operations', minW: 4, minH: 2, defaultW: 5, defaultH: 3, supportsScale: true, dataStateNote: 'Current active mission details.' },
  { id: 'MissionOffers', label: 'Mission Offers', category: 'Operations', minW: 4, minH: 4, defaultW: 5, defaultH: 6, supportsScale: true, dataStateNote: 'Available mission offers.' },
  { id: 'Comms', label: 'Comms', category: 'Operations', minW: 4, minH: 4, defaultW: 5, defaultH: 6, supportsScale: true, dataStateNote: 'Logbook and communication feed.' },
  { id: 'Research', label: 'Research', category: 'Operations', minW: 4, minH: 2, defaultW: 5, defaultH: 3, supportsScale: true, dataStateNote: 'Current research progress.' },
  { id: 'Factions', label: 'Factions', category: 'Operations', minW: 5, minH: 4, defaultW: 6, defaultH: 6, supportsScale: true, dataStateNote: 'Faction standings.' },
  { id: 'Agents', label: 'Agents', category: 'Operations', minW: 5, minH: 4, defaultW: 6, defaultH: 6, supportsScale: true, dataStateNote: 'Diplomacy agents and missions.' },
  { id: 'Inventory', label: 'Inventory', category: 'Operations', minW: 5, minH: 4, defaultW: 6, defaultH: 6, supportsScale: true, dataStateNote: 'Player inventory.' },
  { id: 'TransactionLog', label: 'Transaction Log', category: 'Operations', minW: 5, minH: 4, defaultW: 6, defaultH: 6, supportsScale: true, dataStateNote: 'Recent financial events.' },
  { id: 'UnderAttack', label: 'Under Attack Alert', category: 'Alerts', minW: 6, minH: 1, defaultW: 12, defaultH: 1, supportsScale: true, dataStateNote: 'Missile and attack warning state.' },
]

const WIDGET_METADATA_BY_ID = new Map<string, WidgetMetadata>(WIDGET_REGISTRY.map((widget) => [widget.id, widget]))

export function getWidgetMetadata(id: string): WidgetMetadata | null {
  return WIDGET_METADATA_BY_ID.get(id) ?? null
}

function getCombatTarget(state: GameState): CombatTarget | null {
  return hasCombatTarget(state.combat.target) ? state.combat.target : null
}

function UnknownWidget({ id }: { id: string }) {
  return (
    <div className="unknown-widget">
      <div className="unknown-widget-kicker">Unavailable widget</div>
      <div className="unknown-widget-id">{id}</div>
    </div>
  )
}

export function renderWidget({ id, state, onKeyPress, scale = 1, isInitialLoading, isOffline }: RenderWidgetOptions): React.ReactNode {
  const target = getCombatTarget(state)
  const dataState = isInitialLoading ? 'loading' : isOffline ? 'offline' : 'ready'

  switch (id) {
    case 'PlayerInfo':
      return <PlayerInfo player={state.player} ship={state.ship} dataState={dataState} />
    case 'ShipShields':
      return <ShipShieldsWidget ship={state.ship} control={state.control} />
    case 'ShipHull':
      return <ShipHullWidget ship={state.ship} control={state.control} />
    case 'ShipCargo':
      return <ShipCargoWidget ship={state.ship} control={state.control} />
    case 'ShipStatus':
      return <ShipStatusWidget ship={state.ship} control={state.control} />
    case 'TargetShields':
      return target ? <TargetShieldsWidget target={target} /> : null
    case 'TargetHull':
      return target ? <TargetHullWidget target={target} /> : null
    case 'TargetInfo':
      return <TargetInfoWidget target={target} />
    case 'NavHeading':
      return <NavHeadingWidget player={state.player} flight={state.flight} control={state.control} />
    case 'NavSpeedometer':
      return <NavSpeedometerWidget flight={state.flight} control={state.control} scale={scale} />
    case 'FlightAssistToggle':
      return <FlightAssistToggleWidget flight={state.flight} control={state.control} onKeyPress={onKeyPress} />
    case 'SetaToggle':
      return <SetaToggleWidget flight={state.flight} control={state.control} onKeyPress={onKeyPress} />
    case 'TravelDriveToggle':
      return <TravelDriveToggleWidget flight={state.flight} control={state.control} onKeyPress={onKeyPress} />
    case 'AutopilotToggle':
      return <AutopilotToggleWidget flight={state.flight} control={state.control} onKeyPress={onKeyPress} />
    case 'MapToggle':
      return <MapToggleWidget flight={state.flight} control={state.control} onKeyPress={onKeyPress} />
    case 'ScanModeToggle':
      return <ScanModeToggleWidget flight={state.flight} control={state.control} onKeyPress={onKeyPress} />
    case 'LongRangeScanToggle':
      return <LongRangeScanToggleWidget flight={state.flight} control={state.control} onKeyPress={onKeyPress} />
    case 'MissionManagerToggle':
      return <MissionManagerToggleWidget flight={state.flight} control={state.control} onKeyPress={onKeyPress} />
    case 'ActiveMission':
      return <ActiveMission mission={state.activeMission} dataState={dataState} />
    case 'MissionOffers':
      return <MissionOffers offers={state.missionOffers} dataState={dataState} />
    case 'Comms':
      return <Comms logbook={state.logbook} dataState={dataState} />
    case 'Research':
      return <Research research={state.currentResearch} dataState={dataState} />
    case 'Factions':
      return <Factions factions={state.factions} dataState={dataState} />
    case 'Agents':
      return <Agents agents={state.agents} dataState={dataState} />
    case 'Inventory':
      return <Inventory inventory={state.inventory} dataState={dataState} />
    case 'TransactionLog':
      return <TransactionLog transactionLog={state.transactionLog} dataState={dataState} />
    case 'UnderAttack':
      return !state.control.controlled || (!state.combat.missileIncoming && !state.combat.missileLockingOn) ? null : (
        <UnderAttackAlert
          missileIncoming={state.combat.missileIncoming}
          missileLockingOn={state.combat.missileLockingOn}
        />
      )
    default:
      return <UnknownWidget id={id} />
  }
}
