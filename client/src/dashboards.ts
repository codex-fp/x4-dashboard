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

export type KnownWidgetId =
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
    | 'MapToggle'
    | 'ScanModeToggle'
    | 'LongRangeScanToggle'
    | 'MissionManagerToggle'
    | 'ActiveMission'
    | 'MissionOffers'
    | 'Comms'
    | 'Research'
    | 'Factions'
    | 'Agents'
    | 'Inventory'
    | 'TransactionLog'
    | 'UnderAttack'

export type WidgetId = KnownWidgetId | (string & {})
export type PanelToneRule = 'fixed' | 'targetHostility' | 'missionUrgency'

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
        rows?: string
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
    toneRule?: PanelToneRule
    colorFn?: (state: GameState) => PanelColor
    style?: CSSProperties                 // applied to the ArwesPanel wrapper
    frameless?: boolean
    scale?: number
    grow?: boolean
    height?: string
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
    rows?: string
    autoRows?: string
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
    // ── Ship Controls ──────────────────────────────────────────────────────────
    {
        id: 'flight',
        label: 'Flight (No Target)',
        layout: 'grid',
        columns: '60% 40%',
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
                col: 1, row: 2, rowSpan: 2, grow: true, scale: 1.43
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
                col: 1, colSpan: 2, row: 4, scale: 1.43,
            },
            {
                titleIcon: '⎔',
                internal: {
                    layout: 'grid',
                    columns: '1fr 1fr',
                    rows: 'repeat(4, minmax(0, 1fr))',
                    gap: '6px',
                    width: '100%',
                    widgets: [
                        {id: 'TravelDriveToggle', col: 1, row: 1},
                        {id: 'SetaToggle', col: 2, row: 1},
                        {id: 'FlightAssistToggle', col: 1, row: 2},
                        {id: 'AutopilotToggle', col: 2, row: 2},
                        {id: 'ScanModeToggle', col: 1, row: 3},
                        {id: 'LongRangeScanToggle', col: 2, row: 3},
                        {id: 'MapToggle', col: 1, row: 4},
                        {id: 'MissionManagerToggle', col: 2, row: 4},
                    ]
                },
                col: 2, row: 2, rowSpan: 2, grow: true, scale: 1.43
            },
            {
                id: 'underAttack', frameless: true,
                style: {zIndex: 10, alignSelf: 'start', pointerEvents: 'none'},
                internal: {layout: 'columns', columns: [{widgets: [{id: 'UnderAttack', scale: 1.71}]}]},
                col: 1, colSpan: 2, row: 1, scale: 1
            },
        ],
    },

    {
        id: 'flight-classic',
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
                            {id: 'NavSpeedometer', grow: true},
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
                title: 'Target',
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
                titleIcon: '⎔',
                internal: {
                    layout: 'grid',
                    columns: '1fr 1fr',
                    rows: 'repeat(4, minmax(0, 1fr))',
                    gap: '6px',
                    width: '100%',
                    widgets: [
                        {id: 'TravelDriveToggle', col: 1, row: 1},
                        {id: 'SetaToggle', col: 2, row: 1},
                        {id: 'FlightAssistToggle', col: 1, row: 2},
                        {id: 'AutopilotToggle', col: 2, row: 2},
                        {id: 'ScanModeToggle', col: 1, row: 3},
                        {id: 'LongRangeScanToggle', col: 2, row: 3},
                        {id: 'MapToggle', col: 1, row: 4},
                        {id: 'MissionManagerToggle', col: 2, row: 4},
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
        id: 'ship-controls',
        label: 'Ship Controls',
        layout: 'columns',
        columns: [{
            panels: [
                {
                    title: 'Systems', titleIcon: '⎔',
                    internal: {
                        layout: 'grid',
                        columns: 'repeat(4, minmax(0, 1fr))',
                        rows: 'repeat(2, minmax(0, 1fr))',
                        gap: '6px',
                        alignContent: 'stretch',
                        width: '100%',
                        widgets: [
                            {id: 'TravelDriveToggle', col: 1, row: 1},
                            {id: 'SetaToggle', col: 2, row: 1},
                            {id: 'FlightAssistToggle', col: 3, row: 1},
                            {id: 'AutopilotToggle', col: 4, row: 1},
                            {id: 'ScanModeToggle', col: 1, row: 2},
                            {id: 'LongRangeScanToggle', col: 2, row: 2},
                            {id: 'MapToggle', col: 3, row: 2},
                            {id: 'MissionManagerToggle', col: 4, row: 2},
                        ]
                    },
                    grow: true, scale: 1.43
                },
            ]
        }],
    },

    {
        id: 'target',
        label: 'Target',
        layout: 'columns',
        columns: [{
            panels: [
                {
                    title: 'Target',
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
                    grow: true, scale: 1.43
                },
            ]
        }],
    },

    // ── Operations ─────────────────────────────────────────────────────────────
    {
        id: 'operations',
        label: 'Operations / Overview',
        layout: 'grid',
        columns: '0.9fr 1.2fr 0.88fr 1fr',
        panels: [
            {
                title: 'Active Mission', titleIcon: '◆',
                colorFn: (s) => s.activeMission?.completed ? 'success'
                    : (s.activeMission && s.activeMission.timeleft > 0 && s.activeMission.timeleft < 300 ? 'danger' : 'primary'),
                internal: {layout: 'columns', columns: [{widgets: [{id: 'ActiveMission'}]}]},
                col: 1, row: 1, scale: 1.14
            },
            {
                title: 'Research', titleIcon: '⬡', color: 'purple',
                internal: {layout: 'columns', columns: [{widgets: [{id: 'Research'}]}]},
                col: 1, row: 2, scale: 1.14
            },
            {
                title: 'Comms', titleIcon: '◈',
                style: {flex: 1, minHeight: 0},
                internal: {layout: 'columns', columns: [{widgets: [{id: 'Comms', grow: true}]}]},
                col: 2, row: 1, rowSpan: 2, grow: true, scale: 1.14
            },
            {
                title: 'Transaction Log', titleIcon: '¤', color: 'warning',
                style: {flex: 1, minHeight: 0},
                internal: {layout: 'columns', columns: [{widgets: [{id: 'TransactionLog', grow: true}]}]},
                col: 3, row: 1, rowSpan: 2, grow: true, scale: 1.14
            },
            {
                title: 'Mission Offers', titleIcon: '◈',
                style: {flex: 1, minHeight: 0},
                internal: {layout: 'columns', columns: [{widgets: [{id: 'MissionOffers', grow: true}]}]},
                col: 4, row: 1, rowSpan: 3, grow: true, scale: 1.14
            },
            {
                title: 'Agents', titleIcon: '◌', color: 'success',
                style: {flex: 1, minHeight: 0},
                internal: {layout: 'columns', columns: [{widgets: [{id: 'Agents', grow: true}]}]},
                col: 1, row: 3, grow: true, scale: 1.14
            },
            {
                title: 'Factions', titleIcon: '⬢',
                style: {flex: 1, minHeight: 0},
                internal: {layout: 'columns', columns: [{widgets: [{id: 'Factions', grow: true}]}]},
                col: 2, colSpan: 2, row: 3, grow: true, scale: 1.14
            },
        ],
    },

    {
        id: 'operations-intel',
        label: 'Operations / Intel',
        layout: 'grid',
        columns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)',
        panels: [
            {
                title: 'Comms', titleIcon: '◈',
                style: {flex: 1, minHeight: 0},
                internal: {layout: 'columns', columns: [{widgets: [{id: 'Comms', grow: true}]}]},
                col: 1, row: 1, grow: true, scale: 1.14
            },
            {
                title: 'Factions', titleIcon: '⬢',
                style: {flex: 1, minHeight: 0},
                internal: {layout: 'columns', columns: [{widgets: [{id: 'Factions', grow: true}]}]},
                col: 2, row: 1, grow: true, scale: 1.14
            },
        ],
    },

    {
        id: 'operations-missions',
        label: 'Operations / Missions',
        layout: 'grid',
        columns: 'minmax(280px, 0.95fr) minmax(320px, 1.05fr)',
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
                col: 2, row: 1, rowSpan: 2, grow: true, scale: 1.14
            },
            {
                title: 'Research', titleIcon: '⬡', color: 'purple',
                internal: {layout: 'columns', columns: [{widgets: [{id: 'Research'}]}]},
                col: 1, row: 2, scale: 1.14
            },
        ],
    },

    {
        id: 'operations-trade',
        label: 'Operations / Trade',
        layout: 'grid',
        columns: 'minmax(280px, 0.44fr) minmax(0, 1fr)',
        panels: [
            {
                title: 'Inventory', titleIcon: '▣', color: 'success',
                style: {flex: 1, minHeight: 0},
                internal: {layout: 'columns', columns: [{widgets: [{id: 'Inventory', grow: true}]}]},
                col: 1, row: 1, grow: true, scale: 1.14
            },
            {
                title: 'Transaction Log', titleIcon: '¤', color: 'warning',
                style: {flex: 1, minHeight: 0},
                internal: {layout: 'columns', columns: [{widgets: [{id: 'TransactionLog', grow: true}]}]},
                col: 2, row: 1, grow: true, scale: 1.14
            },
        ],
    },
]

export const BUILT_IN_DASHBOARDS = DASHBOARDS

export const LEGACY_DASHBOARD_ALIASES: Record<string, string> = {
    'flight-horizontal': 'flight',
    'systems-horizontal': 'ship-controls',
    comms: 'operations-intel',
    intel: 'operations-intel',
    missions: 'operations-missions',
    trade: 'operations-trade',
}

export function resolveLegacyDashboardId(id: string): string {
    return LEGACY_DASHBOARD_ALIASES[id] ?? id
}

export function getDashboardFromList(id: string, dashboards: DashboardConfig[]): DashboardConfig {
    const resolvedId = resolveLegacyDashboardId(id)
    return dashboards.find(d => d.id === resolvedId) ?? dashboards[0]
}

export function resolvePanelColor(panel: PanelDisplay, state: GameState): PanelColor {
    if (panel.colorFn) return panel.colorFn(state)

    if (panel.toneRule === 'targetHostility') {
        return state.combat.target?.isHostile ? 'danger' : 'warning'
    }

    if (panel.toneRule === 'missionUrgency') {
        if (state.activeMission?.completed) return 'success'
        if (state.activeMission && state.activeMission.timeleft > 0 && state.activeMission.timeleft < 300) return 'danger'
    }

    return panel.color ?? 'primary'
}

export function getDashboard(id: string): DashboardConfig {
    return getDashboardFromList(id, DASHBOARDS)
}
