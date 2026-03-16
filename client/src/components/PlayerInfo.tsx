import React from 'react'
import { PlayerInfo as PlayerInfoType, ShipStatus } from '../types/gameData'
import { formatCredits } from '../utils/format'

interface Props {
  player: PlayerInfoType
  ship: ShipStatus
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

      {player.sector && (
        <div className="player-location">
          <span>⌖</span>
          <span className="location-sector">{player.sector}</span>
          {player.sectorOwner && (
            <span className="location-owner">({player.sectorOwner})</span>
          )}
        </div>
      )}

      {ship.name && (
        <div className="ship-name-badge">◆ {ship.name}{ship.type ? ` · ${ship.type}` : ''}</div>
      )}

      {!hasData && (
        <div className="offline-hint">Waiting for game data…</div>
      )}
    </>
  )
}
