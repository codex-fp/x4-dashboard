import React, { useEffect, useState } from 'react'
import { PlayerInfo, FlightState, ShipControlState } from '../types/gameData'
import { getShipTelemetryNotice, isShipTelemetryLive } from '../utils/gameState'

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
  maxBoostSpeed,
  maxTravelSpeed,
  boosting,
  inTravel,
  boostEnergy,
}: {
  speed: number
  maxSpeed: number
  maxBoostSpeed: number
  maxTravelSpeed: number
  boosting: boolean
  inTravel: boolean
  boostEnergy: number
}) {
  // Scale selection:
  //   travel mode  -> maxTravelSpeed if known, else auto-scale to current speed
  //   boosting     -> maxBoostSpeed (speed can exceed maxSpeed)
  //   normal       -> maxSpeed
  const isOverspeed = boosting && maxBoostSpeed > maxSpeed && speed > maxSpeed
  const displayMax = Math.max(1,
    inTravel
      ? (maxTravelSpeed > 0 ? maxTravelSpeed : Math.max(maxBoostSpeed, speed) * 1.1)
      : (maxBoostSpeed > maxSpeed ? maxBoostSpeed : maxSpeed > 0 ? maxSpeed : speed)
  )
  const speedPct = clamp(speed / displayMax, 0, 1)
  // Fraction of the bar scale that corresponds to the normal speed cap
  const normalFrac = (maxBoostSpeed > maxSpeed && !inTravel) ? maxSpeed / displayMax : 1
  const barCount = 24
  const bars = Array.from({ length: barCount }, (_, i) => {
    const threshold = (i + 1) / barCount
    const active = speedPct >= threshold
    const heightPct = 24 + (i / (barCount - 1)) * 76
    const isBoostOver = active && isOverspeed && threshold > normalFrac
    return { active, heightPct, isBoostOver }
  })

  const accent = inTravel ? '234,128,252' : '0,229,255'
  const accentDim = `rgba(${accent},0.12)`
  const accentBorder = `rgba(${accent},0.75)`
  // SVG viewBox: 200×200 (same as ARC mode) — gives identical intrinsic aspect ratio
  // so both modes expand the grid row to the same height.
  const VW = 200, VH = 200
  const barSlot = VW / barCount
  const barW = barSlot * 0.82

  // X position of the normal-speed cap line when boost scale is active
  const normalCapX = isOverspeed ? normalFrac * VW : null

  const svgBars = bars.map((bar, i) => ({
    x: i * barSlot,
    y: VH * (1 - bar.heightPct / 100),
    h: VH * (bar.heightPct / 100),
    w: barW,
    active: bar.active,
    isBoostOver: bar.isBoostOver,
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
            <linearGradient id="retro-bar-boost" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,149,0,0.65)" />
              <stop offset="100%" stopColor="rgba(160,70,0,0.15)" />
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
          {svgBars.map((bar, idx) => {
            const gradId = bar.isBoostOver ? 'retro-bar-boost' : inTravel ? 'retro-bar-travel' : 'retro-bar-normal'
            const borderColor = bar.isBoostOver ? 'rgba(255,149,0,0.85)' : accentBorder
            return (
              <rect
                key={idx}
                x={bar.x} y={bar.y}
                width={bar.w} height={bar.h}
                fill={bar.active ? `url(#${gradId})` : accentDim}
                stroke={bar.active ? borderColor : 'none'}
                strokeWidth={0.3}
                opacity={bar.active ? 1 : 0.3}
                filter={bar.active ? 'url(#retro-bar-glow)' : undefined}
              />
            )
          })}
          {/* Normal-cap marker line shown when boost scale is active */}
          {normalCapX !== null && (
            <line
              x1={normalCapX} y1={0} x2={normalCapX} y2={VH}
              stroke="rgba(255,149,0,0.55)" strokeWidth={1.2}
              strokeDasharray="3,3"
            />
          )}
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

      {isOverspeed && (
        <div className="nav-retro-boost-note" style={{ color: 'rgba(255,149,0,0.8)' }}>Boost overspeed — max {maxBoostSpeed.toFixed(0)} m/s</div>
      )}
    </div>
  )
}

function CircularSpeedometer({
  speed,
  maxSpeed,
  maxBoostSpeed,
  maxTravelSpeed,
  boosting,
  inTravel,
  boostEnergy,
}: {
  speed: number
  maxSpeed: number
  maxBoostSpeed: number
  maxTravelSpeed: number
  boosting: boolean
  inTravel: boolean
  boostEnergy: number
}) {
  const isOverspeed = boosting && maxBoostSpeed > maxSpeed && speed > maxSpeed
  const displayMax = Math.max(1,
    inTravel
      ? (maxTravelSpeed > 0 ? maxTravelSpeed : Math.max(maxBoostSpeed, speed) * 1.1)
      : (maxBoostSpeed > maxSpeed ? maxBoostSpeed : maxSpeed > 0 ? maxSpeed : speed)
  )
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
  // When overspeed: split arc into normal (cyan) + overspeed (orange)
  const normalSpeedPct = isOverspeed ? clamp(maxSpeed / displayMax, 0, 1) : speedPct
  const activeEnd      = START + Math.max(speedPct, 0.001) * SWEEP
  const normalEnd      = START + Math.max(normalSpeedPct, 0.001) * SWEEP
  const boostEnd       = START + Math.max(boostPct, 0.001) * SWEEP

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

        {/* Active arc glow layer (normal speed portion) */}
        {normalSpeedPct > 0.002 && (
          <path d={arcD(R, START, normalEnd)} fill="none" stroke={`rgba(${accentRgb},0.3)`} strokeWidth={12}
            filter="url(#circ-glow-soft)" />
        )}

        {/* Active arc crisp layer (normal speed portion) */}
        {normalSpeedPct > 0.002 && (
          <path d={arcD(R, START, normalEnd)} fill="none" stroke={accent} strokeWidth={3}
            filter="url(#circ-glow)" />
        )}

        {/* Overspeed arc (boost beyond maxSpeed) */}
        {isOverspeed && speedPct > normalSpeedPct + 0.002 && (
          <>
            <path d={arcD(R, normalEnd, activeEnd)} fill="none" stroke="rgba(255,149,0,0.35)" strokeWidth={12}
              filter="url(#circ-glow-soft)" />
            <path d={arcD(R, normalEnd, activeEnd)} fill="none" stroke="#ff9500" strokeWidth={3}
              filter="url(#circ-glow)" />
          </>
        )}

        {/* Normal-cap tick mark when boost scale is active */}
        {isOverspeed && (() => {
          const capPt1 = pt(R - 6, normalEnd)
          const capPt2 = pt(R + 6, normalEnd)
          return (
            <line
              x1={capPt1.x.toFixed(2)} y1={capPt1.y.toFixed(2)}
              x2={capPt2.x.toFixed(2)} y2={capPt2.y.toFixed(2)}
              stroke="rgba(255,149,0,0.7)" strokeWidth={1.5}
            />
          )
        })()}

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
          fill={isOverspeed ? '#ff9500' : accent} fontSize="30"
          style={{
            fontFamily: 'var(--font-ui)',
            fontWeight: 700,
            filter: isOverspeed
              ? 'drop-shadow(0 0 7px rgba(255,149,0,0.7))'
              : `drop-shadow(0 0 7px rgba(${accentRgb},0.6))`,
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

      {isOverspeed && (
        <div className="nav-retro-boost-note" style={{ color: 'rgba(255,149,0,0.8)' }}>Boost overspeed — max {maxBoostSpeed.toFixed(0)} m/s</div>
      )}
    </div>
  )
}

// ── NavHeadingWidget ──────────────────────────────────────────────────────────

export function NavHeadingWidget({ player, flight, control }: { player: PlayerInfo; flight: FlightState; control: ShipControlState }) {
  const isLive = isShipTelemetryLive(control)
  const notice = getShipTelemetryNotice(control)

  return (
    <>
      <div className="nav-heading-compact">
        <div className={`nav-sector-name ${isLive && flight.travelDrive ? 'travel' : ''}${isLive ? '' : ' nav-sector-name-inactive'}`} style={{ fontSize: '13px', marginTop: 0 }}>
          {isLive ? (player.sector || '–') : notice.title}
        </div>
        {!isLive && <div className="nav-heading-inactive-detail">{notice.detail}</div>}
      </div>


    </>
  )
}

// ── NavSpeedometerWidget ──────────────────────────────────────────────────────

export function NavSpeedometerWidget({ flight, control, scale = 1 }: { flight: FlightState; control: ShipControlState; scale?: number }) {
  function getInitialSpeedMode(): 'bars' | 'gauge' {
    if (typeof window === 'undefined') {
      return 'bars'
    }

    const forcedMode = new URLSearchParams(window.location.search).get('speedometer')
    if (forcedMode === 'arc') return 'gauge'
    if (forcedMode === 'bar') return 'bars'

    const storedMode = window.localStorage.getItem('navSpeedometerMode')
    return storedMode === 'gauge' ? 'gauge' : 'bars'
  }

  const [speedMode, setSpeedMode] = useState<'bars' | 'gauge'>(() => {
    return getInitialSpeedMode()
  })

  useEffect(() => {
    window.localStorage.setItem('navSpeedometerMode', speedMode)
  }, [speedMode])

  const isLive = isShipTelemetryLive(control)
  const notice = getShipTelemetryNotice(control)

  return (
    <div className={`nav-speed-wrapper${isLive ? '' : ' nav-speed-wrapper-inactive'}`}>
      <div className="nav-speed-header">
        <div className={`nav-speed-toggle${isLive && flight.travelDrive ? ' travel' : ''}`}>
          <button
            className={`nav-speed-toggle-btn${speedMode === 'bars' ? ' active' : ''}`}
            disabled={!isLive}
            onClick={() => setSpeedMode('bars')}
          >BAR</button>
          <button
            className={`nav-speed-toggle-btn${speedMode === 'gauge' ? ' active' : ''}`}
            disabled={!isLive}
            onClick={() => setSpeedMode('gauge')}
          >ARC</button>
        </div>
        {isLive && flight.travelDrive && (
          <Chip
            label="Travel Drive"
            color="#ea80fc"
            bg="rgba(234,128,252,0.08)"
            border="rgba(234,128,252,0.35)"
          />
        )}
      </div>
      {isLive
        ? (speedMode === 'bars'
            ? <RetroSpeedometer
                speed={flight.speed} maxSpeed={flight.maxSpeed}
                maxBoostSpeed={flight.maxBoostSpeed ?? 0} maxTravelSpeed={flight.maxTravelSpeed ?? 0}
                boosting={flight.boosting} inTravel={flight.travelDrive} boostEnergy={flight.boostEnergy}
              />
            : <CircularSpeedometer
                speed={flight.speed} maxSpeed={flight.maxSpeed}
                maxBoostSpeed={flight.maxBoostSpeed ?? 0} maxTravelSpeed={flight.maxTravelSpeed ?? 0}
                boosting={flight.boosting} inTravel={flight.travelDrive} boostEnergy={flight.boostEnergy}
              />)
        : (
            <div className="nav-speed-inactive-panel">
              <div className="nav-speed-inactive-kicker">{notice.title}</div>
              <div className="nav-speed-inactive-value">-- m/s</div>
              <div className="nav-speed-inactive-detail">{notice.detail}</div>
            </div>
          )}
    </div>
  )
}
