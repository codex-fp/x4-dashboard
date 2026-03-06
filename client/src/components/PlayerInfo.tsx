import React from 'react'
import { PlayerInfo as PlayerInfoType, ShipStatus } from '../types/gameData'

interface Props {
  player: PlayerInfoType
  ship: ShipStatus
}

function formatCredits(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)         return `${(n / 1_000).toFixed(0)}K`
  return n.toLocaleString()
}

export function PlayerInfo({ player, ship }: Props) {
  const hasData = player.name !== '–' && player.name !== 'UNKNOWN'

  return (
    <>
      <div className="player-row">
        <div>
          <div className="player-name">{player.name}</div>
          {player.faction && (
            <div className="player-faction">{player.faction}</div>
          )}
        </div>
        <div className="player-credits">
          <div className="credits-value">{formatCredits(player.credits)}</div>
          <span className="credits-label">credits</span>
        </div>
      </div>

      {player.sectorname && (
        <div className="player-location">
          <span>⌖</span>
          <span className="location-sector">{player.sectorname}</span>
          {player.sectorowner && (
            <span className="location-owner">({player.sectorowner})</span>
          )}
        </div>
      )}

      {ship.name && (
        <div className="ship-name-badge">◆ {ship.name}{ship.class ? ` · ${ship.class}` : ''}</div>
      )}

      {!hasData && (
        <div className="offline-hint">Waiting for game data…</div>
      )}
    </>
  )
}
