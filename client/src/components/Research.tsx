import React from 'react'
import { CurrentResearch } from '../types/gameData'
import { clampPercentage, formatShortDuration } from '../utils/format'

interface Props {
  research: CurrentResearch | null
}

export function Research({ research }: Props) {
  if (!research || research.name === null) return null

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
