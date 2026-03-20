import React from 'react'
import { ActiveMission as ActiveMissionType } from '../types/gameData'
import { formatCredits, formatTimeRemaining } from '../utils/format'
import { toPlainText, truncateText } from '../utils/text'
import { WidgetStateNotice } from './WidgetStateNotice'

interface Props {
  mission: ActiveMissionType | null
  dataState: 'loading' | 'offline' | 'ready'
}

export function ActiveMission({ mission, dataState }: Props) {
  if (dataState === 'loading') {
    return <WidgetStateNotice tone="loading" title="Syncing mission tracker" detail="Waiting for your active assignment." compact />
  }

  if (dataState === 'offline') {
    return <WidgetStateNotice tone="offline" title="Mission tracker offline" detail="Reconnect to restore active mission telemetry." compact />
  }

  if (!mission || !mission.name) {
    return <WidgetStateNotice tone="empty" title="No active mission" detail="Accept or activate a mission to track it here." compact />
  }

  const isUrgent = mission.timeleft > 0 && mission.timeleft < 300
  const description = truncateText(toPlainText(mission.description || ''), 200)

  return (
    <>
      {mission.completed && (
        <div style={{
          fontSize: '11px', color: 'var(--c-green)', letterSpacing: '3px',
          marginBottom: '6px', textTransform: 'uppercase',
        }}>
          ◆ MISSION COMPLETE
        </div>
      )}

      <div className="active-mission-name">{mission.name}</div>

      {description && (
        <div className="active-mission-desc" style={{ whiteSpace: 'pre-line' }}>
          {description}
        </div>
      )}

      <div className="active-mission-meta">
        {mission.reward > 0 && (
          <div>
            <div className="meta-label">Reward</div>
            <div className="meta-value reward">⊕ {formatCredits(mission.reward)} Cr</div>
          </div>
        )}
        {mission.timeleft > 0 && (
          <div>
            <div className="meta-label">Time Left</div>
            <div
              className="meta-value"
              style={{ color: isUrgent ? 'var(--c-red)' : 'var(--c-cyan)' }}
            >
              {formatTimeRemaining(mission.timeleft)}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
