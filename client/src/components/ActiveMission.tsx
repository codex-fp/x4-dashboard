import React from 'react'
import { ActiveMission as ActiveMissionType } from '../types/gameData'

interface Props {
  mission: ActiveMissionType | null
}

function formatTime(secs: number): string {
  if (!secs || secs <= 0) return '∞'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = Math.floor(secs % 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function formatCredits(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return n.toLocaleString()
}

export function ActiveMission({ mission }: Props) {
  if (!mission || !mission.name) return null

  const isUrgent = mission.timeleft > 0 && mission.timeleft < 300

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

      {mission.description && (
        <div
          className="active-mission-desc"
          dangerouslySetInnerHTML={{
            __html: mission.description.slice(0, 200) + (mission.description.length > 200 ? '…' : ''),
          }}
        />
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
              ◷ {formatTime(mission.timeleft)}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
