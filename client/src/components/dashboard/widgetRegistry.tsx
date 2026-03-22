import React from 'react'
import { GameState, CombatTarget } from '../../types/gameData'
import { WidgetId } from '../../dashboards'
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

function getCombatTarget(state: GameState): CombatTarget | null {
  return hasCombatTarget(state.combat.target) ? state.combat.target : null
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
    case 'TransactionLog':
      return <TransactionLog transactionLog={state.transactionLog} dataState={dataState} />
    case 'UnderAttack':
      return !state.control.controlled || (!state.combat.missileIncoming && !state.combat.missileLockingOn) ? null : (
        <UnderAttackAlert
          missileIncoming={state.combat.missileIncoming}
          missileLockingOn={state.combat.missileLockingOn}
        />
      )
  }
}
