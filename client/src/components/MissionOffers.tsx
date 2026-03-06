import React, { useState } from 'react'
import { MissionOffers as MissionOffersType, MissionEntry } from '../types/gameData'

interface Props {
  offers: MissionOffersType | null
}

const DIFF_LABELS = ['', 'Trivial', 'Simple', 'Standard', 'Hard', 'Very Hard', 'Extreme']

function diffClass(d: number) {
  return `diff-${Math.max(1, Math.min(6, d))}`
}

function formatCredits(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return n.toLocaleString()
}

function formatDuration(secs: number): string {
  if (!secs) return ''
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function MissionItem({ mission, type }: { mission: MissionEntry; type: string }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={`mission-item ${type}`}
      onClick={() => setExpanded(e => !e)}
      style={{ cursor: 'pointer' }}
    >
      <div className="mission-row" style={{ marginBottom: '3px' }}>
        <span className={`diff-badge ${diffClass(mission.difficulty)}`}>
          {DIFF_LABELS[mission.difficulty] || `D${mission.difficulty}`}
        </span>
        {mission.duration > 0 && (
          <span style={{ fontSize: '9px', color: 'var(--c-text-dim)' }}>
            ◷ {formatDuration(mission.duration)}
          </span>
        )}
      </div>
      <div className="mission-name">{mission.name || '(Unnamed)'}</div>
      <div className="mission-row" style={{ marginTop: '3px' }}>
        {mission.reward > 0 && (
          <span className="mission-reward">⊕ {formatCredits(mission.reward)} Cr</span>
        )}
        {!mission.reward && mission.rewardtext && (
          <span className="mission-reward">{mission.rewardtext}</span>
        )}
      </div>
      {expanded && mission.description && (
        <div
          style={{
            marginTop: '5px', fontSize: '10px', color: 'var(--c-text-dim)',
            lineHeight: '1.5', borderTop: '1px solid var(--c-border-dim)', paddingTop: '5px',
          }}
          dangerouslySetInnerHTML={{ __html: mission.description }}
        />
      )}
    </div>
  )
}

const GROUPS = [
  { key: 'plot',      label: 'Plot',      color: '#ff9800' },
  { key: 'guild',     label: 'Guild',     color: '#4caf50' },
  { key: 'coalition', label: 'Coalition', color: '#9c27b0' },
  { key: 'other',     label: 'Other',     color: '#2196f3' },
]

export function MissionOffers({ offers }: Props) {
  const hasAny = offers && Object.values(offers).some(g => g && g.length > 0)

  return (
    <>
      {!hasAny && (
        <div className="empty-state">No missions available</div>
      )}

      {offers && GROUPS.map(({ key, label, color }) => {
        const group = (offers as any)[key] as any[]
        if (!group?.length) return null

        const allMissions: Array<{ m: MissionEntry; type: string }> = []
        for (const offer of group) {
          if (offer.missions) {
            for (const m of Object.values(offer.missions) as MissionEntry[]) {
              allMissions.push({ m, type: key })
            }
          }
        }
        if (!allMissions.length) return null

        return (
          <div key={key} className="mission-type-group">
            <div className="mission-type-header" style={{ color }}>
              {label} ({allMissions.length})
            </div>
            {allMissions.slice(0, 10).map((item, i) => (
              <MissionItem key={i} mission={item.m} type={item.type} />
            ))}
            {allMissions.length > 10 && (
              <div className="empty-state">+{allMissions.length - 10} more</div>
            )}
          </div>
        )
      })}
    </>
  )
}
