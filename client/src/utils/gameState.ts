import { CombatTarget } from '../types/gameData'

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
