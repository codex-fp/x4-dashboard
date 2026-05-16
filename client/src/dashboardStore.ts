import {
  BUILT_IN_DASHBOARDS,
  ColumnPanelItem,
  ColumnsDashboard,
  DashboardConfig,
  GridDashboard,
  GridPanelItem,
  PanelDisplay,
  PanelInternalLayout,
  getDashboard,
  resolveLegacyDashboardId,
} from './dashboards'
import { withBasePath } from './utils/network'

export interface DashboardStoreDocument {
  schemaVersion: 1
  dashboardStoreVersion: number
  selectedDashboardId: string
  builtInOrder: string[]
  hiddenBuiltInDashboardIds: string[]
  customDashboards: DashboardConfig[]
}

export interface DashboardSummary {
  id: string
  label: string
  layout?: 'grid' | 'columns'
}

export interface DashboardCatalogResponse extends DashboardStoreDocument {
  store?: DashboardStoreDocument
  catalog?: {
    builtIns: DashboardSummary[]
    customDashboards: DashboardSummary[]
  }
}

export interface DashboardOption {
  id: string
  label: string
  source: 'built-in' | 'custom'
  hidden: boolean
}

export interface DashboardCatalog {
  store: DashboardStoreDocument
  visibleDashboards: DashboardOption[]
  builtInDashboards: DashboardOption[]
  customDashboards: DashboardOption[]
}

export const EMPTY_DASHBOARD_STORE: DashboardStoreDocument = {
  schemaVersion: 1,
  dashboardStoreVersion: 1,
  selectedDashboardId: BUILT_IN_DASHBOARDS[0]?.id ?? 'flight',
  builtInOrder: BUILT_IN_DASHBOARDS.map((dashboard) => dashboard.id),
  hiddenBuiltInDashboardIds: [],
  customDashboards: [],
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function createCustomId(): string {
  if (window.crypto?.randomUUID) return `custom:${window.crypto.randomUUID()}`
  return `custom:${Date.now()}-${Math.round(Math.random() * 100000)}`
}

export function normalizeDashboardStore(value: unknown): DashboardStoreDocument {
  const input = value && typeof value === 'object' ? value as Partial<DashboardStoreDocument> : {}
  const builtInIds = new Set(BUILT_IN_DASHBOARDS.map((dashboard) => dashboard.id))
  const builtInOrder = unique(Array.isArray(input.builtInOrder) ? input.builtInOrder : [])
    .filter((id) => builtInIds.has(id))
    .concat(BUILT_IN_DASHBOARDS.map((dashboard) => dashboard.id).filter((id) => !(Array.isArray(input.builtInOrder) ? input.builtInOrder : []).includes(id)))
  const customDashboards = (Array.isArray(input.customDashboards) ? input.customDashboards : [])
    .filter((dashboard): dashboard is DashboardConfig => Boolean(dashboard?.id && dashboard?.label && dashboard?.layout))

  return {
    schemaVersion: 1,
    dashboardStoreVersion: Number.isFinite(Number(input.dashboardStoreVersion)) ? Number(input.dashboardStoreVersion) : 1,
    selectedDashboardId: typeof input.selectedDashboardId === 'string' && input.selectedDashboardId ? input.selectedDashboardId : EMPTY_DASHBOARD_STORE.selectedDashboardId,
    builtInOrder,
    hiddenBuiltInDashboardIds: unique(Array.isArray(input.hiddenBuiltInDashboardIds) ? input.hiddenBuiltInDashboardIds : [])
      .filter((id) => builtInIds.has(id)),
    customDashboards,
  }
}

export async function fetchDashboardStore(): Promise<DashboardStoreDocument> {
  const response = await fetch(withBasePath('/api/dashboards'))
  if (!response.ok) throw new Error(`Cannot load dashboards: ${response.status}`)
  const payload = await response.json() as DashboardCatalogResponse
  return normalizeDashboardStore(payload.store ?? payload)
}

export async function saveDashboardStore(store: DashboardStoreDocument): Promise<DashboardStoreDocument> {
  const response = await fetch(withBasePath('/api/dashboards'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ store }),
  })
  if (!response.ok) throw new Error(`Cannot save dashboards: ${response.status}`)
  const payload = await response.json() as DashboardCatalogResponse
  return normalizeDashboardStore(payload.store ?? payload)
}

export async function resetDashboardStore(): Promise<DashboardStoreDocument> {
  const response = await fetch(withBasePath('/api/dashboards/reset'), { method: 'POST' })
  if (!response.ok) throw new Error(`Cannot reset dashboards: ${response.status}`)
  const payload = await response.json() as DashboardCatalogResponse
  return normalizeDashboardStore(payload.store ?? payload)
}

export function buildDashboardCatalog(store: DashboardStoreDocument): DashboardCatalog {
  const normalized = normalizeDashboardStore(store)
  const hiddenIds = new Set(normalized.hiddenBuiltInDashboardIds)
  const byId = new Map(BUILT_IN_DASHBOARDS.map((dashboard) => [dashboard.id, dashboard]))
  const builtInDashboards: DashboardOption[] = normalized.builtInOrder
    .map((id) => byId.get(id))
    .filter((dashboard): dashboard is DashboardConfig => Boolean(dashboard))
    .map((dashboard) => ({
      id: dashboard.id,
      label: dashboard.label,
      source: 'built-in' as const,
      hidden: hiddenIds.has(dashboard.id),
    }))
  const customDashboards: DashboardOption[] = normalized.customDashboards.map((dashboard) => ({
    id: dashboard.id,
    label: dashboard.label,
    source: 'custom' as const,
    hidden: false,
  }))

  return {
    store: normalized,
    builtInDashboards,
    customDashboards,
    visibleDashboards: [...builtInDashboards.filter((dashboard) => !dashboard.hidden), ...customDashboards],
  }
}

export function resolveDashboardConfig(id: string, store: DashboardStoreDocument): DashboardConfig {
  const normalizedId = resolveLegacyDashboardId(id)
  const custom = store.customDashboards.find((dashboard) => dashboard.id === normalizedId)
  if (custom) return custom
  return getDashboard(normalizedId)
}

export function resolveVisibleDashboardId(id: string, store: DashboardStoreDocument): string {
  const catalog = buildDashboardCatalog(store)
  const normalizedId = resolveLegacyDashboardId(id)
  const custom = store.customDashboards.find((dashboard) => dashboard.id === normalizedId)
  if (custom) return custom.id
  const builtIn = BUILT_IN_DASHBOARDS.find((dashboard) => dashboard.id === normalizedId)
  if (builtIn) return builtIn.id
  const selected = catalog.visibleDashboards.find((dashboard) => dashboard.id === store.selectedDashboardId)
  return selected?.id ?? catalog.visibleDashboards[0]?.id ?? EMPTY_DASHBOARD_STORE.selectedDashboardId
}

function inferToneRule(panel: PanelDisplay): PanelDisplay['toneRule'] {
  const label = `${panel.id ?? ''} ${panel.title ?? ''}`.toLowerCase()
  if (label.includes('target')) return 'targetHostility'
  if (label.includes('mission')) return 'missionUrgency'
  return panel.toneRule
}

function cloneInternalLayout(internal: PanelInternalLayout): PanelInternalLayout {
  return cloneJson(internal)
}

function countGridTracks(columns: string): number {
  let depth = 0
  let token = ''
  const tokens: string[] = []

  for (const char of columns.trim()) {
    if (char === '(') depth += 1
    if (char === ')') depth = Math.max(0, depth - 1)

    if (/\s/.test(char) && depth === 0) {
      if (token) tokens.push(token)
      token = ''
      continue
    }

    token += char
  }

  if (token) tokens.push(token)
  return Math.max(1, tokens.length)
}

function clonePanelBase(panel: PanelDisplay, index: number): PanelDisplay {
  const cloned: PanelDisplay = {
    id: panel.id ?? `panel-${index + 1}`,
    title: panel.title,
    titleIcon: panel.titleIcon,
    color: panel.color,
    toneRule: inferToneRule(panel),
    frameless: panel.frameless,
    internal: cloneInternalLayout(panel.internal),
  }

  const record = cloned as unknown as Record<string, unknown>
  Object.keys(record).forEach((key) => {
    if (record[key] === undefined) {
      delete record[key]
    }
  })

  return cloned
}

function cloneGridPanel(panel: GridPanelItem, index: number): GridPanelItem {
  return {
    ...clonePanelBase(panel, index),
    col: panel.col,
    row: panel.row,
    colSpan: panel.colSpan,
    rowSpan: panel.rowSpan,
    scale: panel.scale,
    grow: panel.grow,
    height: panel.height,
  }
}

function cloneGridPanelForEditor(panel: GridPanelItem, index: number, sourceColumns: number): GridPanelItem {
  const columnFactor = 12 / Math.max(1, sourceColumns)
  const rowFactor = 3

  return {
    ...clonePanelBase(panel, index),
    col: Math.max(1, Math.round((panel.col - 1) * columnFactor) + 1),
    row: Math.max(1, Math.round((panel.row - 1) * rowFactor) + 1),
    colSpan: Math.max(2, Math.round((panel.colSpan ?? 1) * columnFactor)),
    rowSpan: Math.max(3, Math.round((panel.rowSpan ?? 1) * rowFactor)),
    scale: panel.scale,
    grow: panel.grow,
    height: panel.height,
  }
}

function cloneColumnPanel(panel: ColumnPanelItem, index: number): ColumnPanelItem {
  return {
    ...clonePanelBase(panel, index),
    scale: panel.scale,
    grow: panel.grow,
    height: panel.height,
  }
}

export function cloneDashboardAsCustom(dashboard: DashboardConfig, label?: string): DashboardConfig {
  const id = createCustomId()

  if (dashboard.layout === 'columns') {
    return {
      id,
      label: label ?? `${dashboard.label} Copy`,
      layout: 'columns',
      columns: dashboard.columns.map((column) => ({
        width: column.width,
        panels: column.panels.map(cloneColumnPanel),
      })),
    }
  }

  return {
    id,
    label: label ?? `${dashboard.label} Copy`,
    layout: 'grid',
    columns: dashboard.id.startsWith('custom:') ? dashboard.columns : 'repeat(12, minmax(0, 1fr))',
    rows: dashboard.rows,
    autoRows: dashboard.autoRows ?? 'minmax(104px, 1fr)',
    panels: dashboard.id.startsWith('custom:')
      ? dashboard.panels.map(cloneGridPanel)
      : dashboard.panels.map((panel, index) => cloneGridPanelForEditor(panel, index, countGridTracks(dashboard.columns))),
  }
}

export function createEmptyDashboard(layout: 'grid' | 'columns'): DashboardConfig {
  const id = createCustomId()

  if (layout === 'columns') {
    return {
      id,
      label: 'New Columns Dashboard',
      layout: 'columns',
      columns: [
        { width: '1fr', panels: [] },
        { width: '1fr', panels: [] },
      ],
    }
  }

  return {
    id,
    label: 'New Grid Dashboard',
    layout: 'grid',
    columns: 'repeat(12, minmax(0, 1fr))',
    autoRows: 'minmax(104px, 1fr)',
    panels: [],
  }
}
