import React from 'react'
import { GameState } from '../../types/gameData'
import { ColumnsDashboard, GridDashboard, PanelDisplay } from '../../dashboards'
import { ArwesPanel } from '../ArwesPanel'
import { renderWidget } from './widgetRegistry'

interface LayoutProps {
  state: GameState
  onKeyPress: (action: string) => void
  wsConnected: boolean
  isInitialLoading: boolean
}

function renderPanelContent(panel: PanelDisplay, state: GameState, onKeyPress: (action: string) => void, wsConnected: boolean, isInitialLoading: boolean): React.ReactNode {
  const { internal } = panel
  const isOffline = !wsConnected && !isInitialLoading

  if (internal.layout === 'grid') {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: internal.columns,
          gridTemplateRows: internal.rows,
          gap: internal.gap ?? '6px',
          justifyContent: internal.justifyContent,
          justifyItems: internal.justifyItems,
          alignContent: internal.alignContent,
          alignItems: internal.alignItems,
          width: internal.width,
          flex: 1,
          minHeight: 0,
        }}
      >
        {internal.widgets.map((widget) => (
          <div
            key={widget.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gridColumn: widget.colSpan ? `${widget.col} / span ${widget.colSpan}` : widget.col,
              gridRow: widget.rowSpan ? `${widget.row} / span ${widget.rowSpan}` : widget.row,
              minHeight: 0,
              ...(widget.scale && widget.scale !== 1 ? { zoom: widget.scale } : {}),
              ...(widget.grow ? { alignSelf: 'stretch' } : {}),
              ...(widget.height ? { height: widget.height } : {}),
            }}
          >
            {renderWidget({ id: widget.id, state, onKeyPress, isInitialLoading, isOffline })}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'row' }}>
      {internal.columns.map((column, columnIndex) => (
        <div
          key={columnIndex}
          style={{
            width: column.width,
            flex: column.width ? undefined : 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          {column.widgets.map((widget) => (
            <div
              key={widget.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                ...(widget.scale && widget.scale !== 1 ? { zoom: widget.scale } : {}),
                ...(widget.grow ? { flex: 1, minHeight: 0 } : widget.height ? { height: widget.height } : {}),
              }}
            >
              {renderWidget({ id: widget.id, state, onKeyPress, scale: widget.scale ?? 1, isInitialLoading, isOffline })}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function renderPanel(panel: PanelDisplay, state: GameState, onKeyPress: (action: string) => void, wsConnected: boolean, isInitialLoading: boolean): React.ReactNode {
  const color = panel.colorFn ? panel.colorFn(state) : (panel.color ?? 'primary')
  const content = renderPanelContent(panel, state, onKeyPress, wsConnected, isInitialLoading)

  if (panel.frameless) return content

  return (
    <ArwesPanel title={panel.title} titleIcon={panel.titleIcon} color={color} style={panel.style}>
      {content}
    </ArwesPanel>
  )
}

export function GridLayout({ config, state, onKeyPress, wsConnected, isInitialLoading }: LayoutProps & { config: GridDashboard }) {
  return (
    <div className="dashboard-grid" style={{ gridTemplateColumns: config.columns }}>
      {config.panels.map((panel) => {
        const content = renderPanel(panel, state, onKeyPress, wsConnected, isInitialLoading)
        if (content === null) return null

        return (
          <div
            key={panel.id ?? `${panel.col}-${panel.row}`}
            className="dashboard-grid-cell"
            style={{
              gridColumn: panel.colSpan ? `${panel.col} / span ${panel.colSpan}` : panel.col,
              gridRow: panel.rowSpan ? `${panel.row} / span ${panel.rowSpan}` : panel.row,
              ...(panel.scale && panel.scale !== 1 ? { zoom: panel.scale } : {}),
              ...(panel.grow ? { alignSelf: 'stretch' } : {}),
              ...(panel.height ? { height: panel.height } : {}),
              ...(panel.frameless && panel.style ? panel.style : {}),
            }}
          >
            {content}
          </div>
        )
      })}
    </div>
  )
}

export function ColumnsLayout({ config, state, onKeyPress, wsConnected, isInitialLoading }: LayoutProps & { config: ColumnsDashboard }) {
  return (
    <div className="dashboard-columns">
      {config.columns.map((column, columnIndex) => (
        <div
          key={columnIndex}
          className="dashboard-column"
          style={column.width ? { width: column.width, flexShrink: 0 } : { flex: 1 }}
        >
          {column.panels.map((panel, panelIndex) => {
            const content = renderPanel(panel, state, onKeyPress, wsConnected, isInitialLoading)
            if (content === null) return null

            return (
              <div
                key={panel.id ?? `${columnIndex}-${panelIndex}`}
                className="dashboard-grid-cell"
                style={{
                  ...(panel.scale && panel.scale !== 1 ? { zoom: panel.scale } : {}),
                  ...(panel.grow ? { flex: 1, minHeight: 0 } : {}),
                  ...(panel.height ? { height: panel.height } : {}),
                }}
              >
                {content}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
