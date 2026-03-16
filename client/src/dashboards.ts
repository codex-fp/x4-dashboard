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

import type {CSSProperties} from 'react'
import type {GameState} from './types/gameData'

export type WidgetId =
    | 'PlayerInfo'
    | 'ShipShields'
    | 'ShipHull'
    | 'ShipCargo'
    | 'ShipStatus'
    | 'TargetShields'
    | 'TargetHull'
    | 'TargetInfo'
    | 'NavHeading'
    | 'NavSpeedometer'
    | 'FlightAssistToggle'
    | 'SetaToggle'
    | 'TravelDriveToggle'
    | 'AutopilotToggle'
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
    | {
        layout: 'grid'
        columns: string
        widgets: PanelWidgetGrid[]
        gap?: string
        justifyContent?: CSSProperties['justifyContent']
        justifyItems?: CSSProperties['justifyItems']
        alignContent?: CSSProperties['alignContent']
        alignItems?: CSSProperties['alignItems']
        width?: string
      }
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

    // ── Flight ─────────────────────────────────────────────────────────────────
    {
        id: 'flight',
        label: 'Flight',
        layout: 'grid',
        columns: '30% 40% 30%',
        panels: [
            {
                color: 'primary',
                internal: {
                    layout: 'columns', columns: [{
                        widgets: [
                            {id: 'NavHeading', scale: 0.7},
                            {id: 'NavSpeedometer', grow: true,},
                        ]
                    }]
                },
                col: 2, row: 2, rowSpan: 2, grow: true, scale: 1.43
            },
            {
                internal: {
                    layout: 'columns', columns: [{
                        widgets: [
                            {id: 'ShipShields'},
                            {id: 'ShipHull'},
                        ]
                    }]
                },
                col: 1, colSpan: 3, row: 4, scale: 1.43,
            },
            {
                title: "Target",
                colorFn: (s) => s.combat.target?.isHostile ? 'danger' : 'warning',
                internal: {
                    layout: 'columns', columns: [{
                        widgets: [
                            {id: 'TargetInfo', scale: 0.7},
                            {id: 'TargetShields'},
                            {id: 'TargetHull'},
                        ]
                    }]
                },
                col: 1, row: 2, rowSpan: 2, scale: 1.43
            },
            {
                title: 'Systems', titleIcon: '⎔',
                internal: {
                    layout: 'grid',
                    columns: '1fr 1fr',
                    gap: '6px',
                    alignContent: 'start',
                    width: '100%',
                    widgets: [
                        {id: 'FlightAssistToggle', col: 1, row: 1},
                        {id: 'SetaToggle', col: 2, row: 1},
                        {id: 'TravelDriveToggle', col: 1, row: 2},
                        {id: 'AutopilotToggle', col: 2, row: 2},
                    ]
                },
                col: 3, row: 2, rowSpan: 2, grow: true, scale: 1.43
            },
            {
                id: 'underAttack', frameless: true,
                style: {zIndex: 10, alignSelf: 'start', pointerEvents: 'none'},
                internal: {layout: 'columns', columns: [{widgets: [{id: 'UnderAttack', scale: 1.71}]}]},
                col: 1, colSpan: 3, row: 1, scale: 1
            },
        ],
    },

    {
        id: 'flight-horizontal',
        label: 'Flight Horizontal',
        layout: 'grid',
        columns: '1fr 1fr',
        panels: [
            {
                color: 'primary',
                internal: {
                    layout: 'columns', columns: [{
                        widgets: [
                            {id: 'NavHeading', scale: 0.7},
                            {id: 'NavSpeedometer', grow: true,},
                        ]
                    }]
                },
                col: 1, row: 2, grow: true, scale: 1.43
            },
            {
                internal: {
                    layout: 'columns', columns: [{
                        widgets: [
                            {id: 'ShipShields'},
                            {id: 'ShipHull'},
                        ]
                    }]
                },
                col: 1, colSpan: 2, row: 5, scale: 1.43,
            },
            {
                title: "Target",
                colorFn: (s) => s.combat.target?.isHostile ? 'danger' : 'warning',
                internal: {
                    layout: 'columns', columns: [{
                        widgets: [
                            {id: 'TargetInfo', scale: 0.7},
                            {id: 'TargetShields'},
                            {id: 'TargetHull'},
                        ]
                    }]
                },
                col: 2, row: 2, rowSpan: 1, scale: 1.43
            },
            {
                title: 'Systems', titleIcon: '⎔',
                internal: {
                    layout: 'grid', columns: '1fr 1fr', gap: '6px', alignContent: 'start', width: '100%', widgets: [
                        {id: 'FlightAssistToggle', col: 1, row: 1},
                        {id: 'SetaToggle', col: 2, row: 1},
                        {id: 'TravelDriveToggle', col: 1, row: 2},
                        {id: 'AutopilotToggle', col: 2, row: 2},
                    ]
                },
                col: 1, row: 3, colSpan: 2, grow: true, scale: 1.43
            },
            {
                id: 'underAttack', frameless: true,
                style: {zIndex: 10, alignSelf: 'start', pointerEvents: 'none'},
                internal: {layout: 'columns', columns: [{widgets: [{id: 'UnderAttack', scale: 1.71}]}]},
                col: 1, colSpan: 2, row: 1, scale: 1
            },
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
                internal: {layout: 'columns', columns: [{widgets: [{id: 'ActiveMission'}]}]},
                col: 1, row: 1, scale: 1.14
            },
            {
                title: 'Mission Offers', titleIcon: '◈',
                style: {flex: 1, minHeight: 0},
                internal: {layout: 'columns', columns: [{widgets: [{id: 'MissionOffers', grow: true}]}]},
                col: 1, row: 2, grow: true, scale: 1.14
            },
            {
                title: 'Research', titleIcon: '⬡', color: 'purple',
                internal: {layout: 'columns', columns: [{widgets: [{id: 'Research'}]}]},
                col: 2, row: 1, scale: 1.14
            },
            {
                title: 'Comms', titleIcon: '◈',
                internal: {layout: 'columns', columns: [{widgets: [{id: 'Comms'}]}]},
                col: 2, row: 2, scale: 1.14
            },
        ],
    },
]

export function getDashboard(id: string): DashboardConfig {
    return DASHBOARDS.find(d => d.id === id) ?? DASHBOARDS[0]
}
