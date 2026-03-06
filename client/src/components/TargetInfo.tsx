import React from 'react'
import { CombatTarget } from '../types/gameData'

interface Props {
  target: CombatTarget
}

const TRACK_TICKS = Array.from({ length: 20 })

function hullClass(pct: number): string {
  if (pct > 60) return ''
  if (pct > 30) return 'med'
  return 'low'
}

function formatDist(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`
  return `${Math.round(m)} m`
}

export function TargetInfo({ target }: Props) {
  const hullPct = Math.max(0, Math.min(100, target.hull))
  const shieldsPct = Math.max(0, Math.min(100, target.shields))
  const hullTone = hullClass(hullPct)

  return (
    <div className="target-v3-panel">
        <header className="target-v3-header">
          <div className="target-v3-name-wrap">
            <div className="target-name">{target.name}</div>
            {target.shipName && <div className="target-ship">{target.shipName}</div>}
          </div>

          <div className="target-v3-facts">
            <div className="target-v3-fact">
              <span className="target-v3-fact-label">Distance</span>
              <span className="target-v3-fact-value">{target.distance > 0 ? formatDist(target.distance) : '-'}</span>
            </div>
            <div className="target-v3-fact">
              <span className="target-v3-fact-label">Faction</span>
              <span className="target-v3-fact-value">{target.faction || '-'}</span>
            </div>
          </div>
        </header>

        <section className="target-v3-bars">
          <div className="clean-health-row">
            <div className="clean-health-head">
              <span className="clean-health-label">Target Shields</span>
              <span className="clean-health-value shields-val">{shieldsPct.toFixed(0)}%</span>
            </div>
            <div className="clean-health-track">
              <div className="status-bar-fill shields" style={{ width: `${shieldsPct}%` }} />
              <div className="clean-health-grid">
                {TRACK_TICKS.map((_, i) => (
                  <div key={i} className="clean-health-tick" />
                ))}
              </div>
            </div>
          </div>

          <div className="clean-health-row">
            <div className="clean-health-head">
              <span className="clean-health-label">Target Hull</span>
              <span className={`clean-health-value hull-val ${hullTone}`}>{hullPct.toFixed(0)}%</span>
            </div>
            <div className="clean-health-track">
              <div className={`status-bar-fill hull ${hullTone}`} style={{ width: `${hullPct}%` }} />
              <div className="clean-health-grid">
                {TRACK_TICKS.map((_, i) => (
                  <div key={i} className="clean-health-tick" />
                ))}
              </div>
            </div>
          </div>
        </section>

        <footer className="target-v3-footer">
          {target.isHostile && <span className="target-badge hostile">HOSTILE</span>}
          {target.legalStatus && (
            <span className={`target-badge ${target.legalStatus.toLowerCase() === 'wanted' ? 'hostile' : 'neutral'}`}>
              {target.legalStatus}
            </span>
          )}
          {target.combatRank && <span className="target-badge rank">{target.combatRank}</span>}
          {target.bounty > 0 && <span className="target-badge hostile">Bounty {target.bounty.toLocaleString()} Cr</span>}
          {!target.isHostile && !target.legalStatus && !target.combatRank && target.bounty <= 0 && (
            <span className="target-badge neutral">No tactical flags</span>
          )}
        </footer>
    </div>
  )
}
