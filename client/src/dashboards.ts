// ─────────────────────────────────────────────────────────────────────────────
// Dashboard → Panel → Widget Architecture
//
// Three-level hierarchy:
//   Dashboard (grid or columns of panels)
//     └─ Panel (ArwesPanel frame, title, color — defined inline per dashboard)
//          └─ Widget (pure content component, no frame)
//
// Panel definitions live directly inside each dashboard's panels array.
// There is no shared panel registry — each dashboard owns its panel definitions.
//
// Widget IDs must match the WidgetId union type.
// scale?: visual zoom factor, default 1 (e.g. 1.5 = 150%)
// ─────────────────────────────────────────────────────────────────────────────

import type { CSSProperties } from 'react'
import type { GameState } from './types/gameData'

export type WidgetId =
  | 'PlayerInfo'
  | 'ShipStatus'
  | 'TargetInfo'
  | 'NavSector'
  | 'NavHeading'
  | 'NavSpeedometer'
  | 'SystemFlags'
  | 'ActiveMission'
  | 'MissionOffers'
  | 'Comms'
  | 'Research'
  | 'UnderAttack'

// ── Panel internal layout types ───────────────────────────────────────────────

export interface PanelWidgetGrid {
  id: WidgetId
  col: number
  row: number
  colSpan?: number
  rowSpan?: number
  scale?: number
  grow?: boolean
  height?: string
}

export interface PanelWidgetColumn {
  id: WidgetId
  scale?: number
  grow?: boolean
  height?: string
}

export type PanelInternalLayout =
  | { layout: 'grid'; columns: string; widgets: PanelWidgetGrid[] }
  | { layout: 'columns'; columns: Array<{ width?: string; widgets: PanelWidgetColumn[] }> }

export type PanelColor = 'primary' | 'danger' | 'success' | 'warning' | 'purple'

// ── Panel display — embedded directly in each dashboard's panel items ─────────

export interface PanelDisplay {
  id?: string                           // optional: used for runtime lookups (e.g. 'underAttack')
  title?: string
  titleIcon?: string
  color?: PanelColor
  colorFn?: (state: GameState) => PanelColor
  style?: CSSProperties                 // applied to the ArwesPanel wrapper
  frameless?: boolean
  internal: PanelInternalLayout
}

// ── Dashboard-level panel placements ─────────────────────────────────────────

export interface GridPanelItem extends PanelDisplay {
  col: number
  row: number
  colSpan?: number
  rowSpan?: number
  scale?: number
  grow?: boolean
  height?: string
}

export interface ColumnPanelItem extends PanelDisplay {
  scale?: number
  grow?: boolean
  height?: string
}

export interface GridDashboard {
  id: string
  label: string
  layout: 'grid'
  columns: string
  panels: GridPanelItem[]
}

export interface ColumnsDashboard {
  id: string
  label: string
  layout: 'columns'
  columns: Array<{ width?: string; panels: ColumnPanelItem[] }>
}

export type DashboardConfig = GridDashboard | ColumnsDashboard

// ── Dashboard registry ────────────────────────────────────────────────────────

export const DASHBOARDS: DashboardConfig[] = [

  // ── Full Dashboard ─────────────────────────────────────────────────────────
  {
    id: 'full',
    label: 'Full Dashboard',
    layout: 'grid',
    columns: '240px 280px 1fr 260px',
    panels: [
      {
        title: 'Active Mission', titleIcon: '◆',
        colorFn: (s) => s.activeMission?.completed ? 'success'
          : (s.activeMission && s.activeMission.timeleft > 0 && s.activeMission.timeleft < 300 ? 'danger' : 'primary'),
        internal: { layout: 'columns', columns: [{ widgets: [{ id: 'ActiveMission' }] }] },
        col: 1, row: 1,
      },
      {
        title: 'Mission Offers', titleIcon: '◈',
        style: { flex: 1, minHeight: 0 },
        internal: { layout: 'columns', columns: [{ widgets: [{ id: 'MissionOffers' }] }] },
        col: 1, row: 2,
      },
      {
        title: 'Commander', titleIcon: '◈',
        internal: { layout: 'columns', columns: [{ widgets: [{ id: 'PlayerInfo' }] }] },
        col: 2, row: 1,
      },
      {
        title: 'Ship Status', titleIcon: '*', style: { minHeight: '220px' },
        internal: { layout: 'columns', columns: [{ widgets: [{ id: 'ShipStatus' }] }] },
        col: 3, row: 1, scale: 1.75,
      },
      {
        title: 'Target Lock', titleIcon: '*', style: { minHeight: '220px' },
        colorFn: (s) => s.combat.target?.isHostile ? 'danger' : 'warning',
        internal: { layout: 'columns', columns: [{ widgets: [{ id: 'TargetInfo' }] }] },
        col: 3, row: 2, scale: 1.5,
      },
      {
        title: 'Navigation', titleIcon: '*',
        colorFn: (s) => s.navigation.legalStatus?.toLowerCase() === 'wanted' ? 'danger' : 'primary',
        internal: { layout: 'columns', columns: [{ widgets: [
          { id: 'NavSector' },
          { id: 'NavHeading' },
          { id: 'NavSpeedometer', grow: true },
        ] }] },
        col: 2, row: 2,
      },
      {
        title: 'Systems', titleIcon: '⎔',
        internal: { layout: 'columns', columns: [{ widgets: [{ id: 'SystemFlags' }] }] },
        col: 3, row: 3,
      },
      {
        title: 'Research', titleIcon: '⬡', color: 'purple',
        internal: { layout: 'columns', columns: [{ widgets: [{ id: 'Research' }] }] },
        col: 4, row: 1,
      },
      {
        title: 'Comms', titleIcon: '◈',
        internal: { layout: 'columns', columns: [{ widgets: [{ id: 'Comms' }] }] },
        col: 4, row: 2,
      },
    ],
  },

  // ── Flight ─────────────────────────────────────────────────────────────────
  {
    id: 'flight',
    label: 'Flight',
    layout: 'grid',
    columns: '30% 40% 30%',
    panels: [
      {
        id: 'underAttack', frameless: true,
        internal: { layout: 'columns', columns: [{ widgets: [{ id: 'UnderAttack' }] }] },
        col: 1, colSpan: 3, row: 1,
      },
      {
        title: 'Navigation', titleIcon: '*',
        colorFn: (s) => s.navigation.legalStatus?.toLowerCase() === 'wanted' ? 'danger' : 'primary',
        internal: { layout: 'columns', columns: [{ widgets: [
          { id: 'NavSector' },
          { id: 'NavHeading' },
          { id: 'NavSpeedometer', grow: true },
        ] }] },
        col: 2, row: 1, rowSpan: 2, grow: true,
      },
      /*{
        title: 'Ship Status', titleIcon: '*',
        internal: { layout: 'columns', columns: [{ widgets: [{ id: 'ShipStatus' }] }] },
        col: 2, row: 1, scale: 1.25, grow: true,
      },
      {
        title: 'Target Lock', titleIcon: '*',
        colorFn: (s) => s.combat.target?.isHostile ? 'danger' : 'warning',
        internal: { layout: 'columns', columns: [{ widgets: [{ id: 'TargetInfo' }] }] },
        col: 2, row: 2,
      },
      {
        title: 'Systems', titleIcon: '⎔',
        internal: { layout: 'columns', columns: [{ widgets: [{ id: 'SystemFlags' }] }] },
        col: 1, row: 3, colSpan: 3, scale: 1.5, grow: true,
      },
      {
        title: 'Active Mission', titleIcon: '◆',
        colorFn: (s) => s.activeMission?.completed ? 'success'
          : (s.activeMission && s.activeMission.timeleft > 0 && s.activeMission.timeleft < 300 ? 'danger' : 'primary'),
        internal: { layout: 'columns', columns: [{ widgets: [{ id: 'ActiveMission' }] }] },
        col: 3, row: 1, rowSpan: 2, scale: 1.75,
      },*/
    ],
  },

  // ── Missions & Comms ───────────────────────────────────────────────────────
  {
    id: 'comms',
    label: 'Missions & Comms',
    layout: 'grid',
    columns: '1fr 1fr',
    panels: [
      {
        title: 'Active Mission', titleIcon: '◆',
        colorFn: (s) => s.activeMission?.completed ? 'success'
          : (s.activeMission && s.activeMission.timeleft > 0 && s.activeMission.timeleft < 300 ? 'danger' : 'primary'),
        internal: { layout: 'columns', columns: [{ widgets: [{ id: 'ActiveMission' }] }] },
        col: 1, row: 1,
      },
      {
        title: 'Mission Offers', titleIcon: '◈',
        style: { flex: 1, minHeight: 0 },
        internal: { layout: 'columns', columns: [{ widgets: [{ id: 'MissionOffers' }] }] },
        col: 1, row: 2,
      },
      {
        title: 'Research', titleIcon: '⬡', color: 'purple',
        internal: { layout: 'columns', columns: [{ widgets: [{ id: 'Research' }] }] },
        col: 2, row: 1,
      },
      {
        title: 'Comms', titleIcon: '◈',
        internal: { layout: 'columns', columns: [{ widgets: [{ id: 'Comms' }] }] },
        col: 2, row: 2,
      },
    ],
  },
]

export function getDashboard(id: string): DashboardConfig {
  return DASHBOARDS.find(d => d.id === id) ?? DASHBOARDS[0]
}
