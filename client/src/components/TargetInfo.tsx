import React from 'react'
import { CombatTarget } from '../types/gameData'
import { clampPercentage, formatDistanceMeters } from '../utils/format'
import { hasCombatTarget } from '../utils/gameState'

interface Props {
  target: CombatTarget
}

interface TargetInfoProps {
  target: CombatTarget | null
}

const TRACK_TICKS = Array.from({ length: 20 })

function hullClass(pct: number): string {
  if (pct > 60) return ''
  if (pct > 30) return 'med'
  return 'low'
}

export function TargetShieldsWidget({ target }: Props) {
  const pct = clampPercentage(target.shields)
  return (
    <div className="clean-health-row">
      <div className="clean-health-head">
        <span className="clean-health-label">Target Shields</span>
        <span className="clean-health-value shields-val">{pct.toFixed(0)}%</span>
      </div>
      <div className="clean-health-track">
        <div className="status-bar-fill shields" style={{ width: `${pct}%` }} />
        <div className="clean-health-grid">
          {TRACK_TICKS.map((_, i) => <div key={i} className="clean-health-tick" />)}
        </div>
      </div>
    </div>
  )
}

export function TargetHullWidget({ target }: Props) {
  const pct = clampPercentage(target.hull)
  const tone = hullClass(pct)
  return (
    <div className="clean-health-row">
      <div className="clean-health-head">
        <span className="clean-health-label">Target Hull</span>
        <span className={`clean-health-value hull-val ${tone}`}>{pct.toFixed(0)}%</span>
      </div>
      <div className="clean-health-track">
        <div className={`status-bar-fill hull ${tone}`} style={{ width: `${pct}%` }} />
        <div className="clean-health-grid">
          {TRACK_TICKS.map((_, i) => <div key={i} className="clean-health-tick" />)}
        </div>
      </div>
    </div>
  )
}

export function TargetInfoWidget({ target }: TargetInfoProps) {
  if (!hasCombatTarget(target)) {
    return (
      <div className="target-placeholder">
        <header className="target-v3-header">
          <div className="target-v3-name-wrap">
            <div className="target-name">NO TARGET LOCK</div>
            <div className="target-ship">Scanning for contacts</div>
          </div>
          <div className="target-v3-facts">
            <div className="target-v3-fact">
              <span className="target-v3-fact-label">Distance</span>
              <span className="target-v3-fact-value">--</span>
            </div>
            <div className="target-v3-fact">
              <span className="target-v3-fact-label">Faction</span>
              <span className="target-v3-fact-value">--</span>
            </div>
          </div>
        </header>
        <div className="target-placeholder-center">Standby scanner active</div>
        <footer className="target-v3-footer">
          <span className="target-badge neutral">Standby</span>
        </footer>
      </div>
    )
  }

  return (
    <>
      <header className="target-v3-header">
        <div className="target-v3-name-wrap">
          <div className="target-name">{target.name}</div>
          {target.shipName && <div className="target-ship">{target.shipName}</div>}
        </div>
        <div className="target-v3-facts">
          <div className="target-v3-fact">
            <span className="target-v3-fact-label">Distance</span>
            <span className="target-v3-fact-value">{target.distance > 0 ? formatDistanceMeters(target.distance) : '-'}</span>
          </div>
          <div className="target-v3-fact">
            <span className="target-v3-fact-label">Faction</span>
            <span className="target-v3-fact-value">{target.faction || '-'}</span>
          </div>
        </div>
      </header>
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
    </>
  )
}
