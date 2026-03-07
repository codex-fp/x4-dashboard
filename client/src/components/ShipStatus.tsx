import React from 'react'
import { ShipStatus as ShipStatusType } from '../types/gameData'

interface Props {
  ship: ShipStatusType
}

function hullClass(pct: number): string {
  if (pct > 60) return ''
  if (pct > 30) return 'med'
  return 'low'
}

export function ShipShieldsWidget({ ship }: Props) {
  const shieldsPct = Math.max(0, Math.min(100, ship.shields))
  const hullPct    = Math.max(0, Math.min(100, ship.hull))
  const tone       = hullClass(hullPct)
  const shieldsClipId = React.useId()
  const hullClipId    = React.useId()

  const hullFill =
    tone === 'low' ? 'var(--c-red)' :
    tone === 'med' ? 'var(--c-orange)' :
    'var(--c-green)'
  const hullStroke =
    tone === 'low' ? 'rgba(255,23,68,0.3)' :
    tone === 'med' ? 'rgba(255,109,0,0.3)' :
    'rgba(0,230,118,0.3)'
  const hullFrameFill =
    tone === 'low' ? 'rgba(255,23,68,0.04)' :
    tone === 'med' ? 'rgba(255,109,0,0.04)' :
    'rgba(0,230,118,0.04)'

  // Shields polygon — full width, bottom-right lip overhangs hull
  const shieldsPoints = '0,0 400,0 400,22 392,22 386,26 0,22'
  // Hull polygon — recessed, top-right tucked under shields lip
  const hullPoints    = '8,22 386,22 394,26 394,34 8,34'

  return (
    <div className="health-bar-wrap">
      {/* Top label row: SHIELDS */}
      <div className="health-bar-top-row">
        <span className="svg-bar-label">Shields</span>
        <span className="svg-bar-value shields-val">{shieldsPct.toFixed(0)}%</span>
      </div>

      {/* Combined SVG — both bars in one coordinate space */}
      <svg
        className="health-bar-svg"
        viewBox="0 0 400 34"
        preserveAspectRatio="none"
      >
        <defs>
          <clipPath id={shieldsClipId} clipPathUnits="objectBoundingBox">
            <rect x="0" y="0" width={shieldsPct / 100} height="1" />
          </clipPath>
          <clipPath id={hullClipId} clipPathUnits="objectBoundingBox">
            <rect x="0" y="0" width={hullPct / 100} height="1" />
          </clipPath>
        </defs>

        {/* ── Shields bar ── */}
        <polygon
          points={shieldsPoints}
          fill="rgba(0,229,255,0.04)"
          stroke="rgba(0,229,255,0.25)"
          strokeWidth="1"
        />
        <polygon
          points={shieldsPoints}
          fill="var(--c-cyan)"
          stroke="none"
          clipPath={`url(#${shieldsClipId})`}
        />

        {/* ── Hull bar ── */}
        <polygon
          points={hullPoints}
          fill={hullFrameFill}
          stroke={hullStroke}
          strokeWidth="1"
        />
        <polygon
          points={hullPoints}
          fill={hullFill}
          stroke="none"
          clipPath={`url(#${hullClipId})`}
          className={tone === 'low' ? 'hull-svg-low' : undefined}
        />
      </svg>

      {/* Bottom label row: HULL */}
      <div className="health-bar-bot-row">
        <span className="svg-bar-label">Hull</span>
        <span className={`svg-bar-value hull-val ${tone}`}>{hullPct.toFixed(0)}%</span>
      </div>
    </div>
  )
}

export function ShipHullWidget(_props: Props) {
  return null
}

export function ShipCargoWidget(_props: Props) {
  return null
}

export function ShipStatusWidget({ ship }: Props) {
  return (
    <div className="ship-side-card">
      <div className="ship-side-label">Status</div>
      <div className="ship-side-pills">
        {ship.isDockedOrLanded && <span className="ship-pill">Docked</span>}
        {!ship.isDockedOrLanded && <span className="ship-pill dim">Nominal</span>}
      </div>
    </div>
  )
}
