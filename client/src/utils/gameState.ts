import { CombatTarget, ShipControlState } from '../types/gameData'

export function isShipTelemetryLive(control: ShipControlState): boolean {
  return control.controlled
}

export function getShipTelemetryNotice(control: ShipControlState): { title: string; detail: string } {
  if (control.occupied) {
    return {
      title: 'Cockpit Idle',
      detail: 'Aboard ship without active control.',
    }
  }

  return {
    title: 'No Ship Control',
    detail: 'Ship telemetry is unavailable until a ship is under control.',
  }
}

export function hasCombatTarget(target: CombatTarget | null): target is CombatTarget {
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
