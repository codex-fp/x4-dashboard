import React, { ChangeEvent, useMemo, useRef, useState } from 'react'
import ReactGridLayout, { Layout, noCompactor, useContainerWidth } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import {
  ColumnPanelItem,
  ColumnsDashboard,
  DashboardConfig,
  GridDashboard,
  GridPanelItem,
  PanelColor,
  PanelDisplay,
  PanelInternalLayout,
  PanelToneRule,
  PanelWidgetColumn,
  PanelWidgetGrid,
} from '../../dashboards'
import {
  DashboardStoreDocument,
  buildDashboardCatalog,
  cloneDashboardAsCustom,
  createEmptyDashboard,
  normalizeDashboardStore,
  resetDashboardStore,
  resolveDashboardConfig,
  saveDashboardStore,
} from '../../dashboardStore'
import { GameState } from '../../types/gameData'
import { ColumnsLayout, GridLayout, renderDashboardPanel } from './DashboardLayouts'
import { WIDGET_REGISTRY, getWidgetMetadata } from './widgetRegistry'

interface Props {
  store: DashboardStoreDocument
  activeDashboardId: string
  state: GameState
  wsConnected: boolean
  isInitialLoading: boolean
  onClose: () => void
  onChangeDashboard: (id: string) => void
  onStoreSaved: (store: DashboardStoreDocument) => void
  onError: (message: string | null) => void
}

const PANEL_COLORS: PanelColor[] = ['primary', 'danger', 'success', 'warning', 'purple']
const TONE_RULES: Array<{ id: PanelToneRule; label: string }> = [
  { id: 'fixed', label: 'Fixed' },
  { id: 'targetHostility', label: 'Target hostility' },
  { id: 'missionUrgency', label: 'Mission urgency' },
]

const FIXED_GRID_COMPACTOR = { ...noCompactor, preventCollision: true }

function updateAt<T>(items: T[], index: number, updater: (item: T) => T): T[] {
  return items.map((item, itemIndex) => itemIndex === index ? updater(item) : item)
}

function moveItem<T>(items: T[], index: number, delta: number): T[] {
  const nextIndex = index + delta
  if (nextIndex < 0 || nextIndex >= items.length) return items
  const next = items.slice()
  const [item] = next.splice(index, 1)
  next.splice(nextIndex, 0, item)
  return next
}

function nextPanelId(dashboard: DashboardConfig): string {
  const ids = new Set<string>()
  const panels = dashboard.layout === 'grid'
    ? dashboard.panels
    : dashboard.columns.flatMap((column) => column.panels)
  panels.forEach((panel) => panel.id && ids.add(panel.id))

  let index = ids.size + 1
  while (ids.has(`panel-${index}`)) index += 1
  return `panel-${index}`
}

function normalizePanelId(panel: PanelDisplay, index: number): string {
  return panel.id ?? `panel-${index + 1}`
}

function createPanel(dashboard: DashboardConfig): GridPanelItem | ColumnPanelItem {
  const panel: PanelDisplay = {
    id: nextPanelId(dashboard),
    title: 'Panel',
    color: 'primary',
    toneRule: 'fixed',
    internal: { layout: 'columns', columns: [{ widgets: [] }] },
  }

  if (dashboard.layout === 'grid') {
    const maxRow = dashboard.panels.reduce((row, item) => Math.max(row, item.row + (item.rowSpan ?? 1)), 1)
    return { ...panel, col: 1, row: maxRow, colSpan: 4, rowSpan: 4, grow: true }
  }

  return { ...panel, grow: true }
}

function getDashboardIndex(store: DashboardStoreDocument, dashboardId: string): number {
  return store.customDashboards.findIndex((dashboard) => dashboard.id === dashboardId)
}

function getSelectedPanel(dashboard: DashboardConfig, selectedPanelId: string | null): PanelDisplay | null {
  if (!selectedPanelId) return null

  if (dashboard.layout === 'grid') {
    return dashboard.panels.find((panel, index) => normalizePanelId(panel, index) === selectedPanelId) ?? null
  }

  let panelIndex = 0
  for (const column of dashboard.columns) {
    for (const panel of column.panels) {
      if (normalizePanelId(panel, panelIndex) === selectedPanelId) return panel
      panelIndex += 1
    }
  }

  return null
}

function mapPanels(dashboard: DashboardConfig, updater: (panel: PanelDisplay, index: number) => PanelDisplay): DashboardConfig {
  if (dashboard.layout === 'grid') {
    return { ...dashboard, panels: dashboard.panels.map((panel, index) => updater(panel, index) as GridPanelItem) }
  }

  let panelIndex = 0
  return {
    ...dashboard,
    columns: dashboard.columns.map((column) => ({
      ...column,
      panels: column.panels.map((panel) => {
        const next = updater(panel, panelIndex) as ColumnPanelItem
        panelIndex += 1
        return next
      }),
    })),
  }
}

function updatePanelById(dashboard: DashboardConfig, panelId: string, updater: (panel: PanelDisplay) => PanelDisplay): DashboardConfig {
  return mapPanels(dashboard, (panel, index) => normalizePanelId(panel, index) === panelId ? updater({ ...panel }) : panel)
}

function removePanelById(dashboard: DashboardConfig, panelId: string): DashboardConfig {
  if (dashboard.layout === 'grid') {
    return { ...dashboard, panels: dashboard.panels.filter((panel, index) => normalizePanelId(panel, index) !== panelId) }
  }

  let panelIndex = 0
  return {
    ...dashboard,
    columns: dashboard.columns.map((column) => ({
      ...column,
      panels: column.panels.filter((panel) => {
        const keep = normalizePanelId(panel, panelIndex) !== panelId
        panelIndex += 1
        return keep
      }),
    })),
  }
}

function createWidgetPlacement(widgetId: string, panel: PanelDisplay): PanelWidgetGrid | PanelWidgetColumn {
  const metadata = getWidgetMetadata(widgetId)

  if (panel.internal.layout === 'grid') {
    const maxRow = panel.internal.widgets.reduce((row, widget) => Math.max(row, widget.row + (widget.rowSpan ?? 1)), 1)
    return {
      id: widgetId,
      col: 1,
      row: maxRow,
      colSpan: metadata?.defaultW ?? 4,
      rowSpan: metadata?.defaultH ?? 2,
      grow: true,
    }
  }

  return { id: widgetId, grow: true }
}

function addWidgetToPanel(panel: PanelDisplay, widgetId: string): PanelDisplay {
  if (panel.internal.layout === 'grid') {
    return {
      ...panel,
      internal: {
        ...panel.internal,
        widgets: panel.internal.widgets.concat(createWidgetPlacement(widgetId, panel) as PanelWidgetGrid),
      },
    }
  }

  const columns = panel.internal.columns.length ? panel.internal.columns : [{ widgets: [] }]
  return {
    ...panel,
    internal: {
      ...panel.internal,
      columns: updateAt(columns, 0, (column) => ({
        ...column,
        widgets: column.widgets.concat(createWidgetPlacement(widgetId, panel) as PanelWidgetColumn),
      })),
    },
  }
}

function DashboardGridEditor({
  dashboard,
  editable,
  selectedPanelId,
  state,
  wsConnected,
  isInitialLoading,
  onSelectPanel,
  onChange,
}: {
  dashboard: GridDashboard
  editable: boolean
  selectedPanelId: string | null
  state: GameState
  wsConnected: boolean
  isInitialLoading: boolean
  onSelectPanel: (id: string) => void
  onChange: (dashboard: GridDashboard) => void
}) {
  const { width, containerRef } = useContainerWidth()
  const layout: Layout = dashboard.panels.map((panel, index) => {
    const metadata = panel.internal.layout === 'columns' && panel.internal.columns[0]?.widgets[0]
      ? getWidgetMetadata(panel.internal.columns[0].widgets[0].id)
      : null

    return {
      i: normalizePanelId(panel, index),
      x: Math.max(0, panel.col - 1),
      y: Math.max(0, panel.row - 1),
      w: Math.max(1, panel.colSpan ?? metadata?.defaultW ?? 4),
      h: Math.max(1, panel.rowSpan ?? metadata?.defaultH ?? 3),
      minW: 2,
      minH: 1,
    }
  })

  function handleLayoutChange(nextLayout: Layout) {
    const byId = new Map(nextLayout.map((item) => [item.i, item]))
    onChange({
      ...dashboard,
      panels: dashboard.panels.map((panel, index) => {
        const item = byId.get(normalizePanelId(panel, index))
        if (!item) return panel
        return {
          ...panel,
          id: normalizePanelId(panel, index),
          col: item.x + 1,
          row: item.y + 1,
          colSpan: item.w,
          rowSpan: item.h,
        }
      }),
    })
  }

  return (
    <div className="dashboard-editor-canvas" ref={containerRef}>
      {width > 0 && (
        <ReactGridLayout
          width={width}
          layout={layout}
          gridConfig={{ cols: 12, rowHeight: 72, margin: [10, 10], containerPadding: [0, 0], maxRows: 80 }}
          dragConfig={{ enabled: editable, handle: '.dashboard-editor-drag-handle', cancel: '.dashboard-editor-panel-body,button,input,select' }}
          resizeConfig={{ enabled: editable, handles: ['se'] }}
          compactor={FIXED_GRID_COMPACTOR}
          autoSize
          onLayoutChange={handleLayoutChange}
          className="dashboard-editor-rgl"
        >
          {dashboard.panels.map((panel, index) => {
            const panelId = normalizePanelId(panel, index)
            return (
              <div
                key={panelId}
                className={`dashboard-editor-panel-item${selectedPanelId === panelId ? ' selected' : ''}`}
                onClick={() => onSelectPanel(panelId)}
              >
                <div className="dashboard-editor-drag-handle">
                  <span>{panel.title || panelId}</span>
                  <span>{panel.colSpan ?? 1}x{panel.rowSpan ?? 1}</span>
                </div>
                <div className="dashboard-editor-panel-body">
                  {renderDashboardPanel(panel, state, () => {}, wsConnected, isInitialLoading)}
                </div>
              </div>
            )
          })}
        </ReactGridLayout>
      )}
    </div>
  )
}

function DashboardReadOnlyPreview({
  dashboard,
  state,
  wsConnected,
  isInitialLoading,
}: {
  dashboard: DashboardConfig
  state: GameState
  wsConnected: boolean
  isInitialLoading: boolean
}) {
  return (
    <div className="dashboard-manager-preview">
      <div className="dashboard-manager-preview-note">
        Built-in dashboards are preview-only. Duplicate this preset to edit panel and widget layout.
      </div>
      <div className="dashboard-manager-preview-shell">
        {dashboard.layout === 'grid'
          ? <GridLayout config={dashboard} state={state} onKeyPress={() => {}} wsConnected={wsConnected} isInitialLoading={isInitialLoading} />
          : <ColumnsLayout config={dashboard} state={state} onKeyPress={() => {}} wsConnected={wsConnected} isInitialLoading={isInitialLoading} />
        }
      </div>
    </div>
  )
}

function DashboardColumnsEditor({
  dashboard,
  editable,
  selectedPanelId,
  state,
  wsConnected,
  isInitialLoading,
  onSelectPanel,
  onChange,
}: {
  dashboard: ColumnsDashboard
  editable: boolean
  selectedPanelId: string | null
  state: GameState
  wsConnected: boolean
  isInitialLoading: boolean
  onSelectPanel: (id: string) => void
  onChange: (dashboard: ColumnsDashboard) => void
}) {
  function movePanel(columnIndex: number, panelIndex: number, delta: number) {
    onChange({
      ...dashboard,
      columns: updateAt(dashboard.columns, columnIndex, (column) => ({
        ...column,
        panels: moveItem(column.panels, panelIndex, delta),
      })),
    })
  }

  function movePanelAcrossColumns(columnIndex: number, panelIndex: number, delta: number) {
    const nextColumnIndex = columnIndex + delta
    if (nextColumnIndex < 0 || nextColumnIndex >= dashboard.columns.length) return
    const nextColumns = dashboard.columns.map((column) => ({ ...column, panels: column.panels.slice() }))
    const [panel] = nextColumns[columnIndex].panels.splice(panelIndex, 1)
    nextColumns[nextColumnIndex].panels.push(panel)
    onChange({ ...dashboard, columns: nextColumns })
  }

  let panelCounter = 0

  return (
    <div className="dashboard-editor-columns">
      {dashboard.columns.map((column, columnIndex) => (
        <section key={columnIndex} className="dashboard-editor-column" style={column.width ? { flex: column.width === '1fr' ? 1 : undefined, width: column.width } : { flex: 1 }}>
          <div className="dashboard-editor-column-header">
            <span>Column {columnIndex + 1}</span>
            {editable && (
              <input
                value={column.width ?? ''}
                placeholder="1fr"
                onChange={(event) => onChange({
                  ...dashboard,
                  columns: updateAt(dashboard.columns, columnIndex, (item) => ({ ...item, width: event.target.value || undefined })),
                })}
              />
            )}
          </div>
          {column.panels.map((panel, panelIndex) => {
            const panelId = normalizePanelId(panel, panelCounter)
            panelCounter += 1
            return (
              <div
                key={panelId}
                className={`dashboard-editor-column-panel${selectedPanelId === panelId ? ' selected' : ''}`}
                onClick={() => onSelectPanel(panelId)}
              >
                <div className="dashboard-editor-column-panel-actions">
                  <span>{panel.title || panelId}</span>
                  {editable && (
                    <div>
                      <button onClick={(event) => { event.stopPropagation(); movePanel(columnIndex, panelIndex, -1) }}>UP</button>
                      <button onClick={(event) => { event.stopPropagation(); movePanel(columnIndex, panelIndex, 1) }}>DOWN</button>
                      <button onClick={(event) => { event.stopPropagation(); movePanelAcrossColumns(columnIndex, panelIndex, -1) }}>LEFT</button>
                      <button onClick={(event) => { event.stopPropagation(); movePanelAcrossColumns(columnIndex, panelIndex, 1) }}>RIGHT</button>
                    </div>
                  )}
                </div>
                <div className="dashboard-editor-panel-body">
                  {renderDashboardPanel(panel, state, () => {}, wsConnected, isInitialLoading)}
                </div>
              </div>
            )
          })}
        </section>
      ))}
    </div>
  )
}

export function DashboardManager({
  store,
  activeDashboardId,
  state,
  wsConnected,
  isInitialLoading,
  onClose,
  onChangeDashboard,
  onStoreSaved,
  onError,
}: Props) {
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const [draftStore, setDraftStore] = useState(() => normalizeDashboardStore(store))
  const [selectedDashboardId, setSelectedDashboardId] = useState(activeDashboardId)
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null)
  const [selectedWidgetIndex, setSelectedWidgetIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const catalog = useMemo(() => buildDashboardCatalog(draftStore), [draftStore])
  const dashboard = resolveDashboardConfig(selectedDashboardId, draftStore)
  const dashboardIndex = getDashboardIndex(draftStore, dashboard.id)
  const isCustomDashboard = dashboardIndex >= 0
  const selectedPanel = getSelectedPanel(dashboard, selectedPanelId)
  const canEditLayout = isCustomDashboard

  function updateDraft(updater: (store: DashboardStoreDocument) => DashboardStoreDocument) {
    setDraftStore((current) => updater(normalizeDashboardStore(current)))
    setFeedback(null)
  }

  function updateSelectedDashboard(updater: (dashboard: DashboardConfig) => DashboardConfig) {
    if (!isCustomDashboard) return
    updateDraft((current) => ({
      ...current,
      selectedDashboardId,
      customDashboards: updateAt(current.customDashboards, dashboardIndex, updater),
    }))
  }

  function selectDashboard(id: string) {
    setSelectedDashboardId(id)
    setSelectedPanelId(null)
    setSelectedWidgetIndex(0)
    updateDraft((current) => ({ ...current, selectedDashboardId: id }))
    onChangeDashboard(id)
  }

  function handleCreate(layout: 'grid' | 'columns') {
    const next = createEmptyDashboard(layout)
    updateDraft((current) => ({
      ...current,
      selectedDashboardId: next.id,
      customDashboards: current.customDashboards.concat(next),
    }))
    setSelectedDashboardId(next.id)
    onChangeDashboard(next.id)
  }

  function handleDuplicate() {
    const next = cloneDashboardAsCustom(dashboard)
    updateDraft((current) => ({
      ...current,
      selectedDashboardId: next.id,
      customDashboards: current.customDashboards.concat(next),
    }))
    setSelectedDashboardId(next.id)
    onChangeDashboard(next.id)
  }

  function handleDeleteCustom() {
    if (!isCustomDashboard) return
    const remaining = draftStore.customDashboards.filter((item) => item.id !== dashboard.id)
    const nextId = catalog.visibleDashboards.find((item) => item.id !== dashboard.id)?.id ?? 'flight'
    updateDraft((current) => ({ ...current, selectedDashboardId: nextId, customDashboards: remaining }))
    setSelectedDashboardId(nextId)
    setSelectedPanelId(null)
    onChangeDashboard(nextId)
  }

  function handleAddPanel() {
    if (!canEditLayout) return
    const panel = createPanel(dashboard)
    const panelId = panel.id ?? nextPanelId(dashboard)
    updateSelectedDashboard((current) => {
      if (current.layout === 'grid') return { ...current, panels: current.panels.concat(panel as GridPanelItem) }
      return {
        ...current,
        columns: updateAt(current.columns, 0, (column) => ({ ...column, panels: column.panels.concat(panel as ColumnPanelItem) })),
      }
    })
    setSelectedPanelId(panelId)
    setSelectedWidgetIndex(0)
  }

  function handleRemovePanel() {
    if (!canEditLayout || !selectedPanelId) return
    updateSelectedDashboard((current) => removePanelById(current, selectedPanelId))
    setSelectedPanelId(null)
  }

  function handlePanelChange(updater: (panel: PanelDisplay) => PanelDisplay) {
    if (!canEditLayout || !selectedPanelId) return
    updateSelectedDashboard((current) => updatePanelById(current, selectedPanelId, updater))
  }

  function handleInternalLayoutChange(layout: PanelInternalLayout['layout']) {
    handlePanelChange((panel) => ({
      ...panel,
      internal: layout === 'grid'
        ? { layout: 'grid', columns: 'repeat(2, minmax(0, 1fr))', rows: 'repeat(2, minmax(0, 1fr))', gap: '6px', widgets: [] }
        : { layout: 'columns', columns: [{ widgets: [] }] },
    }))
    setSelectedWidgetIndex(0)
  }

  function handleAddWidget(widgetId: string) {
    if (!selectedPanel) return
    handlePanelChange((panel) => addWidgetToPanel(panel, widgetId))
  }

  function handleWidgetUpdate(updater: (widget: Record<string, unknown>) => Record<string, unknown>) {
    if (!selectedPanel) return
    handlePanelChange((panel) => {
      if (panel.internal.layout === 'grid') {
        return {
          ...panel,
          internal: {
            ...panel.internal,
            widgets: updateAt(panel.internal.widgets, selectedWidgetIndex, (widget) => updater(widget as unknown as Record<string, unknown>) as unknown as typeof widget),
          },
        }
      }

      return {
        ...panel,
        internal: {
          ...panel.internal,
          columns: updateAt(panel.internal.columns, 0, (column) => ({
            ...column,
            widgets: updateAt(column.widgets, selectedWidgetIndex, (widget) => updater(widget as unknown as Record<string, unknown>) as unknown as typeof widget),
          })),
        },
      }
    })
  }

  function handleRemoveWidget() {
    if (!selectedPanel) return
    handlePanelChange((panel) => {
      if (panel.internal.layout === 'grid') {
        return { ...panel, internal: { ...panel.internal, widgets: panel.internal.widgets.filter((_, index) => index !== selectedWidgetIndex) } }
      }

      return {
        ...panel,
        internal: {
          ...panel.internal,
          columns: updateAt(panel.internal.columns, 0, (column) => ({ ...column, widgets: column.widgets.filter((_, index) => index !== selectedWidgetIndex) })),
        },
      }
    })
    setSelectedWidgetIndex(0)
  }

  function handleWidgetGridLayoutChange(layout: Layout) {
    if (!selectedPanel || selectedPanel.internal.layout !== 'grid') return
    const byId = new Map(layout.map((item) => [item.i, item]))
    handlePanelChange((panel) => {
      if (panel.internal.layout !== 'grid') return panel
      return {
        ...panel,
        internal: {
          ...panel.internal,
          widgets: panel.internal.widgets.map((widget, index) => {
            const item = byId.get(`${widget.id}-${index}`)
            if (!item) return widget
            return {
              ...widget,
              col: item.x + 1,
              row: item.y + 1,
              colSpan: item.w,
              rowSpan: item.h,
            }
          }),
        },
      }
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const saved = await saveDashboardStore(draftStore)
      setDraftStore(saved)
      onStoreSaved(saved)
      setFeedback('Saved')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Cannot save dashboards.'
      setFeedback(message)
      onError(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    setSaving(true)
    try {
      const reset = await resetDashboardStore()
      setDraftStore(reset)
      onStoreSaved(reset)
      setSelectedDashboardId(reset.selectedDashboardId)
      setSelectedPanelId(null)
      setFeedback('Reset')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Cannot reset dashboards.'
      setFeedback(message)
      onError(message)
    } finally {
      setSaving(false)
    }
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(draftStore, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'x4-dashboard-layouts.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const imported = normalizeDashboardStore(JSON.parse(String(reader.result)))
        setDraftStore(imported)
        setSelectedDashboardId(imported.selectedDashboardId)
        setSelectedPanelId(null)
        setFeedback('Imported')
      } catch {
        setFeedback('Invalid dashboard JSON')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  function renderWidgetEditor() {
    if (!selectedPanel) return null
    const widgets = selectedPanel.internal.layout === 'grid'
      ? selectedPanel.internal.widgets
      : selectedPanel.internal.columns[0]?.widgets ?? []
    const selectedWidget = widgets[selectedWidgetIndex]

    return (
      <section className="dashboard-editor-section">
        <h3>Widgets</h3>
        {selectedPanel.internal.layout === 'grid' && (
          <WidgetGridEditor panel={selectedPanel} editable={canEditLayout} onLayoutChange={handleWidgetGridLayoutChange} />
        )}
        <div className="dashboard-editor-widget-list">
          {widgets.map((widget, index) => (
            <button
              key={`${widget.id}-${index}`}
              className={selectedWidgetIndex === index ? 'selected' : ''}
              onClick={() => setSelectedWidgetIndex(index)}
            >
              {getWidgetMetadata(widget.id)?.label ?? widget.id}
            </button>
          ))}
        </div>
        {selectedWidget && (
          <div className="dashboard-editor-form">
            <label>
              Widget
              <select value={selectedWidget.id} onChange={(event) => handleWidgetUpdate((widget) => ({ ...widget, id: event.target.value }))}>
                {WIDGET_REGISTRY.map((widget) => <option key={widget.id} value={widget.id}>{widget.label}</option>)}
              </select>
            </label>
            <label>
              Scale
              <input type="number" step="0.05" min="0.5" max="2.5" value={Number(selectedWidget.scale ?? 1)} onChange={(event) => handleWidgetUpdate((widget) => ({ ...widget, scale: Number(event.target.value) }))} />
            </label>
            <label className="dashboard-editor-checkbox">
              <input type="checkbox" checked={Boolean(selectedWidget.grow)} onChange={(event) => handleWidgetUpdate((widget) => ({ ...widget, grow: event.target.checked }))} />
              Grow
            </label>
            <label>
              Height
              <input value={selectedWidget.height ?? ''} onChange={(event) => handleWidgetUpdate((widget) => ({ ...widget, height: event.target.value || undefined }))} />
            </label>
            <button className="danger" onClick={handleRemoveWidget}>Remove widget</button>
          </div>
        )}
      </section>
    )
  }

  return (
    <div className="dashboard-manager-backdrop">
      <div className="dashboard-manager">
        <header className="dashboard-manager-header">
          <div>
            <div className="dashboard-manager-kicker">Dashboard manager</div>
            <h2>{dashboard.label}</h2>
          </div>
          <div className="dashboard-manager-actions">
            {feedback && <span className="dashboard-manager-feedback">{feedback}</span>}
            <button onClick={handleExport}>EXPORT</button>
            <button onClick={() => importInputRef.current?.click()}>IMPORT</button>
            <input ref={importInputRef} type="file" accept="application/json" hidden onChange={handleImport} />
            <button onClick={handleSave} disabled={saving}>{saving ? 'SAVING' : 'SAVE'}</button>
            <button onClick={onClose}>CLOSE</button>
          </div>
        </header>

        <div className="dashboard-manager-body">
          <aside className="dashboard-manager-list">
            <div className="dashboard-editor-section compact">
              <h3>Built-in</h3>
              {catalog.builtInDashboards.map((item, index) => (
                <div key={item.id} className={`dashboard-manager-list-item${item.id === selectedDashboardId ? ' selected' : ''}`}>
                  <button onClick={() => selectDashboard(item.id)}>{item.label}</button>
                  <div>
                    <button onClick={() => updateDraft((current) => ({ ...current, builtInOrder: moveItem(current.builtInOrder, index, -1) }))}>UP</button>
                    <button onClick={() => updateDraft((current) => ({ ...current, builtInOrder: moveItem(current.builtInOrder, index, 1) }))}>DOWN</button>
                    <button onClick={() => updateDraft((current) => {
                      const hidden = new Set(current.hiddenBuiltInDashboardIds)
                      hidden.has(item.id) ? hidden.delete(item.id) : hidden.add(item.id)
                      return { ...current, hiddenBuiltInDashboardIds: Array.from(hidden) }
                    })}>{item.hidden ? 'SHOW' : 'HIDE'}</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="dashboard-editor-section compact">
              <h3>Custom</h3>
              <div className="dashboard-manager-create">
                <button onClick={() => handleCreate('grid')}>NEW GRID</button>
                <button onClick={() => handleCreate('columns')}>NEW COLUMNS</button>
              </div>
              {draftStore.customDashboards.map((item, index) => (
                <div key={item.id} className={`dashboard-manager-list-item${item.id === selectedDashboardId ? ' selected' : ''}`}>
                  <button onClick={() => selectDashboard(item.id)}>* {item.label}</button>
                  <div>
                    <button onClick={() => updateDraft((current) => ({ ...current, customDashboards: moveItem(current.customDashboards, index, -1) }))}>UP</button>
                    <button onClick={() => updateDraft((current) => ({ ...current, customDashboards: moveItem(current.customDashboards, index, 1) }))}>DOWN</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="dashboard-editor-section compact">
              <h3>Actions</h3>
              <button onClick={handleDuplicate}>DUPLICATE</button>
              <button onClick={handleDeleteCustom} disabled={!isCustomDashboard} className="danger">DELETE CUSTOM</button>
              <button onClick={handleReset} className="danger">RESET STORE</button>
            </div>
          </aside>

          <main className="dashboard-manager-canvas-wrap">
            <div className="dashboard-manager-canvas-toolbar">
              <span>{canEditLayout ? 'Edit mode' : 'Built-in preview'}</span>
              <button onClick={canEditLayout ? handleAddPanel : handleDuplicate}>
                {canEditLayout ? 'ADD PANEL' : 'DUPLICATE TO EDIT'}
              </button>
            </div>
            {!canEditLayout ? (
              <DashboardReadOnlyPreview
                dashboard={dashboard}
                state={state}
                wsConnected={wsConnected}
                isInitialLoading={isInitialLoading}
              />
            ) : dashboard.layout === 'grid' ? (
              <DashboardGridEditor
                dashboard={dashboard}
                editable={canEditLayout}
                selectedPanelId={selectedPanelId}
                state={state}
                wsConnected={wsConnected}
                isInitialLoading={isInitialLoading}
                onSelectPanel={(id) => { setSelectedPanelId(id); setSelectedWidgetIndex(0) }}
                onChange={(next) => updateSelectedDashboard(() => next)}
              />
            ) : (
              <DashboardColumnsEditor
                dashboard={dashboard}
                editable={canEditLayout}
                selectedPanelId={selectedPanelId}
                state={state}
                wsConnected={wsConnected}
                isInitialLoading={isInitialLoading}
                onSelectPanel={(id) => { setSelectedPanelId(id); setSelectedWidgetIndex(0) }}
                onChange={(next) => updateSelectedDashboard(() => next)}
              />
            )}
          </main>

          <aside className="dashboard-manager-inspector">
            <section className="dashboard-editor-section">
              <h3>Dashboard</h3>
              <div className="dashboard-editor-form">
                <label>
                  Name
                  <input
                    value={dashboard.label}
                    disabled={!isCustomDashboard}
                    onChange={(event) => updateSelectedDashboard((current) => ({ ...current, label: event.target.value }))}
                  />
                </label>
                <div className="dashboard-editor-meta-row">
                  <span>{dashboard.layout}</span>
                  <span>{isCustomDashboard ? 'custom' : 'built-in'}</span>
                </div>
              </div>
            </section>

            <section className="dashboard-editor-section">
              <h3>Panel</h3>
              {!selectedPanel && <p className="dashboard-editor-muted">Select a panel on the canvas.</p>}
              {selectedPanel && (
                <div className="dashboard-editor-form">
                  <label>
                    Title
                    <input value={selectedPanel.title ?? ''} disabled={!canEditLayout} onChange={(event) => handlePanelChange((panel) => ({ ...panel, title: event.target.value }))} />
                  </label>
                  <label>
                    Icon
                    <input value={selectedPanel.titleIcon ?? ''} disabled={!canEditLayout} onChange={(event) => handlePanelChange((panel) => ({ ...panel, titleIcon: event.target.value }))} />
                  </label>
                  <label>
                    Color
                    <select value={selectedPanel.color ?? 'primary'} disabled={!canEditLayout} onChange={(event) => handlePanelChange((panel) => ({ ...panel, color: event.target.value as PanelColor }))}>
                      {PANEL_COLORS.map((color) => <option key={color} value={color}>{color}</option>)}
                    </select>
                  </label>
                  <label>
                    Tone
                    <select value={selectedPanel.toneRule ?? 'fixed'} disabled={!canEditLayout} onChange={(event) => handlePanelChange((panel) => ({ ...panel, toneRule: event.target.value as PanelToneRule }))}>
                      {TONE_RULES.map((rule) => <option key={rule.id} value={rule.id}>{rule.label}</option>)}
                    </select>
                  </label>
                  <label>
                    Scale
                    <input type="number" step="0.05" min="0.5" max="2.5" value={Number(selectedPanel.scale ?? 1)} disabled={!canEditLayout} onChange={(event) => handlePanelChange((panel) => ({ ...panel, scale: Number(event.target.value) }))} />
                  </label>
                  <label>
                    Height
                    <input value={selectedPanel.height ?? ''} disabled={!canEditLayout} onChange={(event) => handlePanelChange((panel) => ({ ...panel, height: event.target.value || undefined }))} />
                  </label>
                  <label>
                    Internal layout
                    <select value={selectedPanel.internal.layout} disabled={!canEditLayout} onChange={(event) => handleInternalLayoutChange(event.target.value as PanelInternalLayout['layout'])}>
                      <option value="columns">columns</option>
                      <option value="grid">grid</option>
                    </select>
                  </label>
                  {selectedPanel.internal.layout === 'grid' && (
                    <label>
                      Widget grid
                      <input value={selectedPanel.internal.columns} disabled={!canEditLayout} onChange={(event) => handlePanelChange((panel) => panel.internal.layout === 'grid' ? { ...panel, internal: { ...panel.internal, columns: event.target.value } } : panel)} />
                    </label>
                  )}
                  <label className="dashboard-editor-checkbox">
                    <input type="checkbox" checked={Boolean(selectedPanel.grow)} disabled={!canEditLayout} onChange={(event) => handlePanelChange((panel) => ({ ...panel, grow: event.target.checked }))} />
                    Grow
                  </label>
                  <label className="dashboard-editor-checkbox">
                    <input type="checkbox" checked={Boolean(selectedPanel.frameless)} disabled={!canEditLayout} onChange={(event) => handlePanelChange((panel) => ({ ...panel, frameless: event.target.checked }))} />
                    Frameless
                  </label>
                  <button className="danger" onClick={handleRemovePanel} disabled={!canEditLayout}>Remove panel</button>
                </div>
              )}
            </section>

            {renderWidgetEditor()}

            <section className="dashboard-editor-section">
              <h3>Palette</h3>
              <div className="dashboard-editor-palette">
                {WIDGET_REGISTRY.map((widget) => (
                  <button key={widget.id} disabled={!selectedPanel || !canEditLayout} onClick={() => handleAddWidget(widget.id)}>
                    <span>{widget.label}</span>
                    <small>{widget.category}</small>
                  </button>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}

function WidgetGridEditor({ panel, editable, onLayoutChange }: { panel: PanelDisplay; editable: boolean; onLayoutChange: (layout: Layout) => void }) {
  const { width, containerRef } = useContainerWidth()
  if (panel.internal.layout !== 'grid') return null
  const layout: Layout = panel.internal.widgets.map((widget, index) => ({
    i: `${widget.id}-${index}`,
    x: Math.max(0, widget.col - 1),
    y: Math.max(0, widget.row - 1),
    w: Math.max(1, widget.colSpan ?? getWidgetMetadata(widget.id)?.defaultW ?? 2),
    h: Math.max(1, widget.rowSpan ?? getWidgetMetadata(widget.id)?.defaultH ?? 2),
    minW: getWidgetMetadata(widget.id)?.minW ?? 1,
    minH: getWidgetMetadata(widget.id)?.minH ?? 1,
  }))

  return (
    <div className="dashboard-widget-grid-editor" ref={containerRef}>
      {width > 0 && (
        <ReactGridLayout
          width={width}
          layout={layout}
          gridConfig={{ cols: 12, rowHeight: 34, margin: [5, 5], containerPadding: [0, 0], maxRows: 40 }}
          dragConfig={{ enabled: editable }}
          resizeConfig={{ enabled: editable, handles: ['se'] }}
          compactor={FIXED_GRID_COMPACTOR}
          autoSize
          onLayoutChange={onLayoutChange}
        >
          {panel.internal.widgets.map((widget, index) => (
            <div key={`${widget.id}-${index}`} className="dashboard-widget-grid-editor-item">
              {getWidgetMetadata(widget.id)?.label ?? widget.id}
            </div>
          ))}
        </ReactGridLayout>
      )}
    </div>
  )
}
