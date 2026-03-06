import React from 'react'
import { ShipStatus as ShipStatusType } from '../types/gameData'

interface Props {
  ship: ShipStatusType
}

const TRACK_TICKS = Array.from({ length: 20 })

function hullClass(pct: number): string {
  if (pct > 60) return ''
  if (pct > 30) return 'med'
  return 'low'
}

export function ShipShieldsWidget({ ship }: Props) {
  const pct = Math.max(0, Math.min(100, ship.shields))
  return (
    <div className="clean-health-row">
      <div className="clean-health-head">
        <span className="clean-health-label">Shields</span>
        <span className="clean-health-value shields-val">{pct.toFixed(0)}%</span>
      </div>
      <div className="clean-health-track">
        <div
          className={`status-bar-fill shields${!ship.shieldsUp ? ' off' : pct < 25 ? ' low' : ''}`}
          style={{ width: `${pct}%` }}
        />
        <div className="clean-health-grid">
          {TRACK_TICKS.map((_, i) => <div key={i} className="clean-health-tick" />)}
        </div>
      </div>
    </div>
  )
}

export function ShipHullWidget({ ship }: Props) {
  const pct = Math.max(0, Math.min(100, ship.hull))
  const tone = hullClass(pct)
  return (
    <div className="clean-health-row">
      <div className="clean-health-head">
        <span className="clean-health-label">Hull</span>
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

export function ShipCargoWidget({ ship }: Props) {
  return (
    <div className="ship-side-card">
      <div className="ship-side-label">Cargo</div>
      <div className="ship-side-value">
        {ship.maxCargo > 0 ? `${ship.cargo}/${ship.maxCargo} t` : `${ship.cargo} t`}
      </div>
    </div>
  )
}

export function ShipStatusWidget({ ship }: Props) {
  return (
    <div className="ship-side-card">
      <div className="ship-side-label">Status</div>
      <div className="ship-side-pills">
        {ship.isDockedOrLanded && <span className="ship-pill">Docked</span>}
        {ship.landingGearDown && <span className="ship-pill">Gear Down</span>}
        {ship.overHeating && <span className="ship-pill alert">Overheating</span>}
        {!ship.isDockedOrLanded && !ship.landingGearDown && !ship.overHeating && (
          <span className="ship-pill dim">Nominal</span>
        )}
      </div>
    </div>
  )
}
