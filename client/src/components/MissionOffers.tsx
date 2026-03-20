import React, { useState } from 'react'
import { MissionOffers as MissionOffersType, MissionEntry, MissionOffer } from '../types/gameData'
import { formatCredits, formatShortDuration } from '../utils/format'
import { toPlainText } from '../utils/text'
import { WidgetStateNotice } from './WidgetStateNotice'

interface Props {
  offers: MissionOffersType | null
  dataState: 'loading' | 'offline' | 'ready'
}

const DIFF_LABELS = ['', 'Trivial', 'Simple', 'Standard', 'Hard', 'Very Hard', 'Extreme']

function diffClass(d: number) {
  return `diff-${Math.max(1, Math.min(6, d))}`
}

function MissionItem({ mission, type }: { mission: MissionEntry; type: string }) {
  const [expanded, setExpanded] = useState(false)
  const description = toPlainText(mission.description || '')

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
            {formatShortDuration(mission.duration)}
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
      {expanded && description && (
        <div
          style={{
            marginTop: '5px', fontSize: '10px', color: 'var(--c-text-dim)',
            lineHeight: '1.5', borderTop: '1px solid var(--c-border-dim)', paddingTop: '5px',
            whiteSpace: 'pre-line',
          }}
        >
          {description}
        </div>
      )}
    </div>
  )
}

interface MissionGroupConfig {
  key: keyof MissionOffersType
  label: string
  color: string
}

const GROUPS: MissionGroupConfig[] = [
  { key: 'plot',      label: 'Plot',      color: '#ff9800' },
  { key: 'guild',     label: 'Guild',     color: '#4caf50' },
  { key: 'coalition', label: 'Coalition', color: '#9c27b0' },
  { key: 'other',     label: 'Other',     color: '#2196f3' },
]

function flattenMissionOffers(group: MissionOffer[] | undefined, type: string): Array<{ mission: MissionEntry; type: string }> {
  if (!group?.length) return []

  const missions: Array<{ mission: MissionEntry; type: string }> = []

  for (const offer of group) {
    for (const mission of Object.values(offer.missions || {})) {
      missions.push({ mission, type })
    }
  }

  return missions
}

export function MissionOffers({ offers, dataState }: Props) {
  if (dataState === 'loading') {
    return <WidgetStateNotice tone="loading" title="Syncing mission board" detail="Collecting mission offers from the bridge." />
  }

  if (dataState === 'offline') {
    return <WidgetStateNotice tone="offline" title="Mission board offline" detail="Live offers return when the dashboard reconnects." />
  }

  const hasAny = offers && Object.values(offers).some(g => g && g.length > 0)

  return (
    <div className="mission-offers-list">
      {!hasAny && (
        <WidgetStateNotice tone="empty" title="No open offers" detail="No nearby stations are advertising work right now." compact />
      )}

      {offers && GROUPS.map(({ key, label, color }) => {
        const allMissions = flattenMissionOffers(offers[key], key)
        if (!allMissions.length) return null

        return (
          <div key={key} className="mission-type-group">
            <div className="mission-type-header" style={{ color }}>
              {label} ({allMissions.length})
            </div>
            {allMissions.slice(0, 10).map((item, i) => (
              <MissionItem key={`${item.type}-${i}`} mission={item.mission} type={item.type} />
            ))}
            {allMissions.length > 10 && (
              <div className="empty-state">+{allMissions.length - 10} more offers</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
