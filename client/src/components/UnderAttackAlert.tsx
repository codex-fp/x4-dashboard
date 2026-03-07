import React from 'react'

interface Props {
  alertLevel: number      // 1 = alert (orange), 2 = combat (red)
  attackerCount: number
  incomingMissiles: number
}

export function UnderAttackAlert({ alertLevel, attackerCount, incomingMissiles }: Props) {
  const isCombat = alertLevel >= 2
  const modifier = isCombat ? 'combat' : 'alert'

  return (
    <div className={`under-attack-alert under-attack-alert--${modifier}`} role="alert">
      <span className="under-attack-icon">{isCombat ? '▲' : '!'}</span>
      <span className="under-attack-text">
        {isCombat ? 'UNDER ATTACK' : 'ALERT'}
      </span>
      {attackerCount > 0 && (
        <span className="under-attack-count">
          {attackerCount} {attackerCount === 1 ? 'ATTACKER' : 'ATTACKERS'}
        </span>
      )}
      {incomingMissiles > 0 && (
        <span className="under-attack-missile">
          ⟫ MISSILE LOCK ⟫
        </span>
      )}
      <span className="under-attack-icon">{isCombat ? '▲' : '!'}</span>
    </div>
  )
}
