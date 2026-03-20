import React from 'react'
import { CurrentResearch } from '../types/gameData'
import { clampPercentage, formatShortDuration } from '../utils/format'
import { WidgetStateNotice } from './WidgetStateNotice'

interface Props {
  research: CurrentResearch | null
  dataState: 'loading' | 'offline' | 'ready'
}

export function Research({ research, dataState }: Props) {
  if (dataState === 'loading') {
    return <WidgetStateNotice tone="loading" title="Syncing research queue" detail="Waiting for current project data." compact />
  }

  if (dataState === 'offline') {
    return <WidgetStateNotice tone="offline" title="Research feed offline" detail="Reconnect to inspect current laboratory progress." compact />
  }

  if (!research || research.name === null) {
    return <WidgetStateNotice tone="empty" title="No active research" detail="Start a project to monitor progress and resources here." compact />
  }

  const pct = clampPercentage(research.percentageCompleted)

  return (
    <>
      <div className="research-name">{research.name || 'Unknown Project'}</div>

      <div className="research-progress-header">
        <span style={{ fontSize: '9px', color: 'var(--c-text-dim)', letterSpacing: '1px' }}>
          Progress{research.researchtime > 0 ? ` · ${formatShortDuration(research.researchtime)} total` : ''}
        </span>
        <span className="research-pct">{pct.toFixed(1)}%</span>
      </div>
      <div className="research-bar-track">
        <div className="research-bar-fill" style={{ width: `${pct}%` }} />
      </div>

      {research.resources && research.resources.length > 0 && (
        <div className="research-resources">
          {research.resources.map((r, i) => (
            <div key={i} className="research-resource">
              <span className="resource-name">{r.name}</span>
              <span>{r.currentAmount}/{r.totalAmount}</span>
            </div>
          ))}
        </div>
      )}

      {research.precursors && research.precursors.length > 0 && (
        <div style={{ marginTop: '6px', fontSize: '9px', color: 'var(--c-text-dim)' }}>
          Requires: {research.precursors.map(p => p.name).join(', ')}
        </div>
      )}
    </>
  )
}
