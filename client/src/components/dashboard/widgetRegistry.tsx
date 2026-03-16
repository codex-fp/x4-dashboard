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
import { Research } from '../Research'
import { UnderAttackAlert } from '../UnderAttackAlert'
import { hasCombatTarget } from '../../utils/gameState'

interface RenderWidgetOptions {
  id: WidgetId
  state: GameState
  onKeyPress: (action: string) => void
  scale?: number
}

function getCombatTarget(state: GameState): CombatTarget | null {
  return hasCombatTarget(state.combat.target) ? state.combat.target : null
}

export function renderWidget({ id, state, onKeyPress, scale = 1 }: RenderWidgetOptions): React.ReactNode {
  const target = getCombatTarget(state)

  switch (id) {
    case 'PlayerInfo':
      return <PlayerInfo player={state.player} ship={state.ship} />
    case 'ShipShields':
      return <ShipShieldsWidget ship={state.ship} />
    case 'ShipHull':
      return <ShipHullWidget ship={state.ship} />
    case 'ShipCargo':
      return <ShipCargoWidget ship={state.ship} />
    case 'ShipStatus':
      return <ShipStatusWidget ship={state.ship} />
    case 'TargetShields':
      return target ? <TargetShieldsWidget target={target} /> : null
    case 'TargetHull':
      return target ? <TargetHullWidget target={target} /> : null
    case 'TargetInfo':
      return <TargetInfoWidget target={target} />
    case 'NavHeading':
      return <NavHeadingWidget player={state.player} flight={state.flight} />
    case 'NavSpeedometer':
      return <NavSpeedometerWidget flight={state.flight} scale={scale} />
    case 'FlightAssistToggle':
      return <FlightAssistToggleWidget flight={state.flight} onKeyPress={onKeyPress} />
    case 'SetaToggle':
      return <SetaToggleWidget flight={state.flight} onKeyPress={onKeyPress} />
    case 'TravelDriveToggle':
      return <TravelDriveToggleWidget flight={state.flight} onKeyPress={onKeyPress} />
    case 'AutopilotToggle':
      return <AutopilotToggleWidget flight={state.flight} onKeyPress={onKeyPress} />
    case 'MapToggle':
      return <MapToggleWidget flight={state.flight} onKeyPress={onKeyPress} />
    case 'ScanModeToggle':
      return <ScanModeToggleWidget flight={state.flight} onKeyPress={onKeyPress} />
    case 'LongRangeScanToggle':
      return <LongRangeScanToggleWidget flight={state.flight} onKeyPress={onKeyPress} />
    case 'MissionManagerToggle':
      return <MissionManagerToggleWidget flight={state.flight} onKeyPress={onKeyPress} />
    case 'ActiveMission':
      return <ActiveMission mission={state.activeMission} />
    case 'MissionOffers':
      return <MissionOffers offers={state.missionOffers} />
    case 'Comms':
      return <Comms logbook={state.logbook} />
    case 'Research':
      return <Research research={state.currentResearch} />
    case 'UnderAttack':
      return state.combat.alertLevel === 0 ? null : (
        <UnderAttackAlert
          alertLevel={state.combat.alertLevel}
          attackerCount={state.combat.attackerCount}
          incomingMissiles={state.combat.incomingMissiles}
        />
      )
  }
}
