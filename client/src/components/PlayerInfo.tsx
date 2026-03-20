import React from 'react'
import { PlayerInfo as PlayerInfoType, ShipStatus } from '../types/gameData'
import { formatCredits } from '../utils/format'
import { WidgetStateNotice } from './WidgetStateNotice'

interface Props {
  player: PlayerInfoType
  ship: ShipStatus
  dataState: 'loading' | 'offline' | 'ready'
}

export function PlayerInfo({ player, ship, dataState }: Props) {
  if (dataState === 'loading') {
    return <WidgetStateNotice tone="loading" title="Syncing pilot telemetry" detail="Awaiting the first bridge update." compact />
  }

  if (dataState === 'offline') {
    return <WidgetStateNotice tone="offline" title="Pilot feed unavailable" detail="Reconnect the dashboard host to resume live data." compact />
  }

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
    </>
  )
}
