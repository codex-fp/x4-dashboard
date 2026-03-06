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

function safeNum(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined) return '-'
  return value.toFixed(digits)
}

export function ShipStatus({ ship }: Props) {
  const hullPct = Math.max(0, Math.min(100, ship.hull))
  const shieldsPct = Math.max(0, Math.min(100, ship.shields))
  const hullTone = hullClass(hullPct)

  return (
    <div className="ship-status-panel">
        <div className="ship-status-main">
          <div className="clean-health-stack">
            <div className="clean-health-row">
              <div className="clean-health-head">
                <span className="clean-health-label">Shields</span>
                <span className="clean-health-value shields-val">{shieldsPct.toFixed(0)}%</span>
              </div>
              <div className="clean-health-track">
                <div
                  className={`status-bar-fill shields${!ship.shieldsUp ? ' off' : shieldsPct < 25 ? ' low' : ''}`}
                  style={{ width: `${shieldsPct}%` }}
                />
                <div className="clean-health-grid">
                  {TRACK_TICKS.map((_, i) => (
                    <div key={i} className="clean-health-tick" />
                  ))}
                </div>
              </div>
            </div>

            <div className="clean-health-row">
              <div className="clean-health-head">
                <span className="clean-health-label">Hull</span>
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

          </div>

          <aside className="ship-status-aside">
            <div className="ship-side-card">
              <div className="ship-side-label">Fuel</div>
              <div className="ship-side-value">
                {safeNum(ship.fuel, 1)}
                {ship.fuelReserve !== null && ship.fuelReserve !== undefined ? ` +${safeNum(ship.fuelReserve, 1)}` : ''}
              </div>
            </div>

            <div className="ship-side-card">
              <div className="ship-side-label">Cargo</div>
              <div className="ship-side-value">
                {ship.maxCargo > 0 ? `${ship.cargo}/${ship.maxCargo} t` : `${ship.cargo} t`}
              </div>
            </div>

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
          </aside>
        </div>
      </div>
  )
}
