import React from 'react'
import { FrameCorners } from '@arwes/react'
import { ShipControlState, ShipStatus as ShipStatusType } from '../types/gameData'
import { getShipTelemetryNotice, isShipTelemetryLive } from '../utils/gameState'

interface Props {
  ship: ShipStatusType
  control: ShipControlState
}

function hullClass(pct: number): string {
  if (pct > 60) return ''
  if (pct > 30) return 'med'
  return 'low'
}

export function ShipShieldsWidget({ ship, control }: Props) {
  const isLive = isShipTelemetryLive(control)
  const notice = getShipTelemetryNotice(control)
  const shieldsPct = Math.max(0, Math.min(100, ship.shields))
  const hullPct = Math.max(0, Math.min(100, ship.hull))
  const tone = hullClass(hullPct)

  const hullFrameStyle = {
    '--arwes-frames-line-color': tone === 'low'
      ? 'hsl(349deg 100% 55%)'
      : tone === 'med'
        ? 'hsl(26deg 100% 50%)'
        : 'hsl(151deg 100% 45%)',
    '--arwes-frames-bg-color': tone === 'low'
      ? 'hsl(349deg 100% 55% / 8%)'
      : tone === 'med'
        ? 'hsl(26deg 100% 50% / 8%)'
        : 'hsl(151deg 100% 45% / 8%)',
    '--arwes-frames-line-filter': tone === 'low'
      ? 'drop-shadow(0 0 3px hsl(349deg 100% 55% / 60%))'
      : tone === 'med'
        ? 'drop-shadow(0 0 3px hsl(26deg 100% 50% / 60%))'
        : 'drop-shadow(0 0 3px hsl(151deg 100% 45% / 60%))',
  } as React.CSSProperties

  const inactiveFrameStyle = {
    '--arwes-frames-line-color': 'rgba(84, 110, 122, 0.5)',
    '--arwes-frames-bg-color': 'rgba(84, 110, 122, 0.08)',
    '--arwes-frames-line-filter': 'none',
  } as React.CSSProperties

  return (
    <div className={`health-bar-wrap${isLive ? '' : ' health-bar-wrap-inactive'}`}>
      <div className="health-bar-top-row">
        <span className="svg-bar-label">Shields</span>
        <span className={`svg-bar-value shields-val${isLive ? '' : ' inactive'}`}>{isLive ? `${shieldsPct.toFixed(0)}%` : '--'}</span>
      </div>

      <div className="health-bar-bars">
        <div className="health-bar-track shields-track">
          <FrameCorners
            style={isLive ? {
              '--arwes-frames-line-color': 'hsl(191deg 100% 50%)',
              '--arwes-frames-bg-color': 'hsl(191deg 100% 50% / 10%)',
              '--arwes-frames-line-filter': 'drop-shadow(0 0 4px hsl(191deg 100% 50% / 60%))',
            } as React.CSSProperties : inactiveFrameStyle}
            animated={isLive}
            strokeWidth={1}
            cornerLength={10}
          />
          <div className="health-bar-track-inner">
            <div className={`health-bar-fill ${isLive ? 'shields-fill' : 'health-bar-fill-inactive'}`} style={{ width: `${isLive ? shieldsPct : 0}%` }} />
          </div>
        </div>

        <div className="health-bar-track hull-track">
          <FrameCorners
            style={isLive ? hullFrameStyle : inactiveFrameStyle}
            animated={isLive}
            strokeWidth={1}
            cornerLength={8}
          />
          <div className="health-bar-track-inner">
            <div
              className={isLive ? `health-bar-fill hull-fill ${tone || 'high'} ${tone === 'low' ? 'hull-svg-low' : ''}` : 'health-bar-fill health-bar-fill-inactive'}
              style={{ width: `${isLive ? hullPct : 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="health-bar-bot-row">
        <span className="svg-bar-label">Hull</span>
        <span className={`svg-bar-value hull-val ${isLive ? tone : 'inactive'}`}>{isLive ? `${hullPct.toFixed(0)}%` : notice.title}</span>
      </div>
      {!isLive && <div className="ship-widget-inactive-note">{notice.detail}</div>}
    </div>
  )
}

export function ShipHullWidget(_props: Props) {
  return null
}

export function ShipCargoWidget(_props: Props) {
  return null
}

export function ShipStatusWidget({ ship, control }: Props) {
  const isLive = isShipTelemetryLive(control)
  const notice = getShipTelemetryNotice(control)

  return (
    <div className={`ship-side-card${isLive ? '' : ' ship-side-card-inactive'}`}>
      <div className="ship-side-label">Status</div>
      <div className="ship-side-pills">
        {isLive && ship.isDockedOrLanded && <span className="ship-pill">Docked</span>}
        {isLive && !ship.isDockedOrLanded && <span className="ship-pill dim">Nominal</span>}
        {!isLive && <span className="ship-pill dim">{notice.title}</span>}
      </div>
      {!isLive && <div className="ship-widget-inactive-note">{notice.detail}</div>}
    </div>
  )
}
