import React, { useState } from 'react'
import { PlayerInfo, FlightState } from '../types/gameData'

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function Chip({ label, color, bg, border }: { label: string; color: string; bg: string; border: string }) {
  return (
    <span
      style={{
        fontSize: '8px',
        letterSpacing: '1.5px',
        fontFamily: 'var(--font-mono)',
        padding: '2px 6px',
        border: `1px solid ${border}`,
        color,
        background: bg,
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
  )
}

function RetroSpeedometer({
  speed,
  maxSpeed,
  maxBoost,
  inTravel,
  boostEnergy,
}: {
  speed: number
  maxSpeed: number
  maxBoost: number
  inTravel: boolean
  boostEnergy: number
}) {
  const displayMax = Math.max(1, inTravel && maxBoost > 0 ? maxBoost : maxSpeed > 0 ? maxSpeed : speed)
  const speedPct = clamp(speed / displayMax, 0, 1)
  const barCount = 24
  const bars = Array.from({ length: barCount }, (_, i) => {
    const threshold = (i + 1) / barCount
    const active = speedPct >= threshold
    const heightPct = 24 + (i / (barCount - 1)) * 76
    return { active, heightPct }
  })

  const accent = inTravel ? '234,128,252' : '0,229,255'
  const accentDim = `rgba(${accent},0.12)`
  const accentBorder = `rgba(${accent},0.75)`
  // SVG viewBox: 200×200 (same as ARC mode) — gives identical intrinsic aspect ratio
  // so both modes expand the grid row to the same height.
  const VW = 200, VH = 200
  const barSlot = VW / barCount
  const barW = barSlot * 0.82

  const svgBars = bars.map((bar, i) => ({
    x: i * barSlot,
    y: VH * (1 - bar.heightPct / 100),
    h: VH * (bar.heightPct / 100),
    w: barW,
    active: bar.active,
  }))

  return (
    <div className="nav-retro-speedometer">
      <div className="nav-retro-topline">
        <span>SPEED GRAPH</span>
        <span>{displayMax.toFixed(0)} MAX</span>
      </div>

      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          className="nav-circ-svg"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="retro-bar-normal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(0,229,255,0.45)" />
              <stop offset="100%" stopColor="rgba(0,100,140,0.15)" />
            </linearGradient>
            <linearGradient id="retro-bar-travel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(234,128,252,0.45)" />
              <stop offset="100%" stopColor="rgba(120,48,136,0.15)" />
            </linearGradient>
            <filter id="retro-bar-glow" x="-15%" y="-5%" width="130%" height="110%">
              <feGaussianBlur stdDeviation="0.4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {svgBars.map((bar, idx) => (
            <rect
              key={idx}
              x={bar.x} y={bar.y}
              width={bar.w} height={bar.h}
              fill={bar.active ? `url(#retro-bar-${inTravel ? 'travel' : 'normal'})` : accentDim}
              stroke={bar.active ? accentBorder : 'none'}
              strokeWidth={0.3}
              opacity={bar.active ? 1 : 0.3}
              filter={bar.active ? 'url(#retro-bar-glow)' : undefined}
            />
          ))}
        </svg>
        <div className="nav-retro-speed-overlay">
          <div className={`nav-retro-overlay-readout ${inTravel ? 'travel' : 'normal'}`}>
            <span className="nav-retro-overlay-value">{speed.toFixed(0)}</span>
            <span className="nav-retro-overlay-unit">m/s</span>
          </div>
        </div>
      </div>

      <div className="nav-retro-boost-bar">
        <div className="nav-retro-boost-bar-header">
          <span>BOOST ENERGY</span>
          <span>{boostEnergy.toFixed(0)}%</span>
        </div>
        <div className="nav-retro-boost-bar-track">
          <div className="nav-retro-boost-bar-fill" style={{ width: `${boostEnergy}%` }} />
        </div>
      </div>

      {inTravel && maxBoost > 0 && (
        <div className="nav-retro-boost-note">Travel mode scale uses boost max {maxBoost.toFixed(0)}</div>
      )}
    </div>
  )
}

function CircularSpeedometer({
  speed,
  maxSpeed,
  maxBoost,
  inTravel,
  boostEnergy,
}: {
  speed: number
  maxSpeed: number
  maxBoost: number
  inTravel: boolean
  boostEnergy: number
}) {
  const displayMax = Math.max(1, inTravel && maxBoost > 0 ? maxBoost : maxSpeed > 0 ? maxSpeed : speed)
  const speedPct = clamp(speed / displayMax, 0, 1)
  const boostPct = clamp(boostEnergy / 100, 0, 1)

  const cx = 100, cy = 108, R = 68, BOOST_R = R + 16
  const START = 135 // degrees from 3-o'clock, clockwise (lower-left)
  const SWEEP = 270

  const accent = inTravel ? '#ea80fc' : '#00e5ff'
  const accentRgb = inTravel ? '234,128,252' : '0,229,255'

  const pt = (r: number, deg: number) => ({
    x: cx + r * Math.cos((deg * Math.PI) / 180),
    y: cy + r * Math.sin((deg * Math.PI) / 180),
  })

  const arcD = (r: number, a1: number, a2: number) => {
    const s = pt(r, a1)
    const e = pt(r, a2)
    const sweep = ((a2 - a1) + 360) % 360 || 360
    return `M${s.x.toFixed(2)},${s.y.toFixed(2)} A${r},${r} 0 ${sweep > 180 ? 1 : 0} 1 ${e.x.toFixed(2)},${e.y.toFixed(2)}`
  }

  const endAngle = START + SWEEP // 405 = same as 45°
  const activeEnd = START + Math.max(speedPct, 0.001) * SWEEP
  const boostEnd = START + Math.max(boostPct, 0.001) * SWEEP

  // Ticks shortened to fit between main arc and boost arc
  const ticks = Array.from({ length: 11 }, (_, i) => {
    const a = START + (i / 10) * SWEEP
    const major = i % 5 === 0
    return { a, major, p1: pt(R + 4, a), p2: pt(R + (major ? 11 : 7), a) }
  })

  const scaleLabels = [
    { t: 0, text: '0' },
    { t: 1, text: displayMax >= 1000 ? `${(displayMax / 1000).toFixed(1)}k` : displayMax.toFixed(0) },
  ].map(({ t, text }) => {
    const a = START + t * SWEEP
    const p = pt(R + 32, a)
    return { x: p.x, y: p.y, text }
  })

  return (
    <div className="nav-circ-speedometer" style={{
      background: `radial-gradient(ellipse at 50% 40%, rgba(${accentRgb},0.05) 0%, rgba(0,4,8,0.88) 68%)`,
    }}>
      <svg viewBox="0 0 200 200" className="nav-circ-svg">
        <defs>
          <filter id="circ-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="circ-glow-soft" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer decorative ring */}
        <circle cx={cx} cy={cy} r={R + 22} fill="none" stroke={`rgba(${accentRgb},0.05)`} strokeWidth={1} />
        <circle cx={cx} cy={cy} r={R + 1} fill="none" stroke={`rgba(${accentRgb},0.08)`} strokeWidth={1} />

        {/* Boost arc track background */}
        <path d={arcD(BOOST_R, START, endAngle)} fill="none" stroke="rgba(100,255,218,0.09)" strokeWidth={5} />

        {/* Boost arc active */}
        {boostPct > 0.002 && (
          <>
            <path d={arcD(BOOST_R, START, boostEnd)} fill="none" stroke="rgba(100,255,218,0.25)" strokeWidth={8}
              filter="url(#circ-glow-soft)" />
            <path d={arcD(BOOST_R, START, boostEnd)} fill="none" stroke="#64ffda" strokeWidth={2}
              filter="url(#circ-glow)" />
          </>
        )}

        {/* Track arc background */}
        <path d={arcD(R, START, endAngle)} fill="none" stroke={`rgba(${accentRgb},0.12)`} strokeWidth={8} />

        {/* Active arc glow layer */}
        {speedPct > 0.002 && (
          <path d={arcD(R, START, activeEnd)} fill="none" stroke={`rgba(${accentRgb},0.3)`} strokeWidth={12}
            filter="url(#circ-glow-soft)" />
        )}

        {/* Active arc crisp layer */}
        {speedPct > 0.002 && (
          <path d={arcD(R, START, activeEnd)} fill="none" stroke={accent} strokeWidth={3}
            filter="url(#circ-glow)" />
        )}

        {/* Tick marks */}
        {ticks.map((t, i) => (
          <line key={i}
            x1={t.p1.x.toFixed(2)} y1={t.p1.y.toFixed(2)}
            x2={t.p2.x.toFixed(2)} y2={t.p2.y.toFixed(2)}
            stroke={t.major ? `rgba(${accentRgb},0.65)` : `rgba(${accentRgb},0.25)`}
            strokeWidth={t.major ? 1.5 : 0.8}
          />
        ))}

        {/* Scale labels at arc ends */}
        {scaleLabels.map((l, i) => (
          <text key={i} x={l.x.toFixed(2)} y={l.y.toFixed(2)}
            textAnchor="middle" dominantBaseline="middle"
            fill={`rgba(${accentRgb},0.45)`} fontSize="8"
            style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>
            {l.text}
          </text>
        ))}

        {/* Inner dark circle backdrop */}
        <circle cx={cx} cy={cy} r={R - 14} fill="rgba(0,5,10,0.88)" />
        <circle cx={cx} cy={cy} r={R - 14} fill="none" stroke={`rgba(${accentRgb},0.1)`} strokeWidth={1} />

        {/* Speed value */}
        <text x={cx} y={cy - 10} textAnchor="middle" dominantBaseline="middle"
          fill={accent} fontSize="30"
          style={{
            fontFamily: 'var(--font-ui)',
            fontWeight: 700,
            filter: `drop-shadow(0 0 7px rgba(${accentRgb},0.6))`,
          }}>
          {speed.toFixed(0)}
        </text>

        {/* m/s + speed % */}
        <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="middle"
          fill={`rgba(${accentRgb},0.45)`} fontSize="7"
          style={{ fontFamily: 'var(--font-mono)', letterSpacing: '1.5px' }}>
          m/s · {Math.round(speedPct * 100)}%
        </text>

        {/* Boost readout */}
        <text x={cx} y={cy + 27} textAnchor="middle" dominantBaseline="middle"
          fill="rgba(100,255,218,0.6)" fontSize="7"
          style={{ fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>
          BOOST {boostEnergy.toFixed(0)}%
        </text>
      </svg>

      {inTravel && maxBoost > 0 && (
        <div className="nav-retro-boost-note">Travel mode — boost max {maxBoost.toFixed(0)}</div>
      )}
    </div>
  )
}

// ── NavHeadingWidget ──────────────────────────────────────────────────────────

export function NavHeadingWidget({ player, flight }: { player: PlayerInfo; flight: FlightState }) {
  return (
    <>
      <div className="nav-heading-compact">
        <div className={`nav-sector-name ${flight.travelDrive ? 'travel' : ''}`} style={{ fontSize: '13px', marginTop: 0 }}>
          {player.sector || '–'}
        </div>
      </div>

      {flight.travelDrive && (
        <div className="nav-chips-row">
          <Chip
            label="Travel Drive"
            color="#ea80fc"
            bg="rgba(234,128,252,0.08)"
            border="rgba(234,128,252,0.35)"
          />
        </div>
      )}
    </>
  )
}

// ── NavSpeedometerWidget ──────────────────────────────────────────────────────

export function NavSpeedometerWidget({ flight, scale = 1 }: { flight: FlightState; scale?: number }) {
  const [speedMode, setSpeedMode] = useState<'bars' | 'gauge'>('bars')

  return (
    <div className="nav-speed-wrapper">
      <div className="nav-speed-header">
        <div className={`nav-speed-toggle${flight.travelDrive ? ' travel' : ''}`}>
          <button
            className={`nav-speed-toggle-btn${speedMode === 'bars' ? ' active' : ''}`}
            onClick={() => setSpeedMode('bars')}
          >BAR</button>
          <button
            className={`nav-speed-toggle-btn${speedMode === 'gauge' ? ' active' : ''}`}
            onClick={() => setSpeedMode('gauge')}
          >ARC</button>
        </div>
      </div>
      {speedMode === 'bars'
        ? <RetroSpeedometer speed={flight.speed} maxSpeed={flight.maxSpeed} maxBoost={0} inTravel={flight.travelDrive} boostEnergy={flight.boostEnergy} />
        : <CircularSpeedometer speed={flight.speed} maxSpeed={flight.maxSpeed} maxBoost={0} inTravel={flight.travelDrive} boostEnergy={flight.boostEnergy} />
      }
    </div>
  )
}
