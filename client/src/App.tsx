import React, { useEffect, useMemo, useState } from 'react'
import { AnimatorGeneralProvider, Animator, GridLines, Dots } from '@arwes/react'
import { useGameData } from './hooks/useGameData'
import { Dashboard } from './components/Dashboard'
import { DashboardManager } from './components/dashboard/DashboardManager'
import {
  EMPTY_DASHBOARD_STORE,
  buildDashboardCatalog,
  fetchDashboardStore,
  resolveDashboardConfig,
  resolveVisibleDashboardId,
} from './dashboardStore'
import { getDashboard } from './dashboards'
import { getDefaultWebSocketUrl } from './utils/network'

const DASHBOARD_SCALE_STORAGE_KEY = 'dashboardScale'
const DEFAULT_DASHBOARD_ID = EMPTY_DASHBOARD_STORE.selectedDashboardId

function getWebSocketUrl(): string {
  const envUrl = import.meta.env.VITE_WS_URL?.trim()
  if (envUrl) return envUrl

  return getDefaultWebSocketUrl()
}

function getInitialDashboard(): string {
  const dashboardId = new URLSearchParams(window.location.search).get('dashboard')
  return dashboardId ? getDashboard(dashboardId).id : DEFAULT_DASHBOARD_ID
}

function getInitialDashboardScale(): number {
  const savedScale = Number(window.localStorage.getItem(DASHBOARD_SCALE_STORAGE_KEY))

  if (Number.isFinite(savedScale) && savedScale > 0) {
    return savedScale
  }

  return 1
}

export function App() {
  const { state, wsConnected, bridgeConnected, lastDataTimestamp, isInitialLoading, pressKey } = useGameData(getWebSocketUrl())
  const [dashboardId, setDashboardId] = useState(getInitialDashboard)
  const [dashboardScale, setDashboardScale] = useState(getInitialDashboardScale)
  const [dashboardStore, setDashboardStore] = useState(EMPTY_DASHBOARD_STORE)
  const [dashboardManagerOpen, setDashboardManagerOpen] = useState(false)
  const [dashboardStoreError, setDashboardStoreError] = useState<string | null>(null)
  const dashboardCatalog = useMemo(() => buildDashboardCatalog(dashboardStore), [dashboardStore])
  const resolvedDashboardId = resolveVisibleDashboardId(dashboardId, dashboardStore)
  const dashboardConfig = resolveDashboardConfig(resolvedDashboardId, dashboardStore)

  useEffect(() => {
    let cancelled = false

    fetchDashboardStore()
      .then((store) => {
        if (cancelled) return
        setDashboardStore(store)
        if (!new URLSearchParams(window.location.search).get('dashboard')) {
          setDashboardId(resolveVisibleDashboardId(store.selectedDashboardId, store))
        }
      })
      .catch((error) => {
        if (cancelled) return
        setDashboardStoreError(error instanceof Error ? error.message : 'Cannot load dashboards.')
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const nextVersion = state._meta.dashboardStoreVersion
    if (!nextVersion || nextVersion <= dashboardStore.dashboardStoreVersion) return

    fetchDashboardStore()
      .then((store) => {
        setDashboardStore(store)
        setDashboardId((current) => resolveVisibleDashboardId(current, store))
      })
      .catch((error) => setDashboardStoreError(error instanceof Error ? error.message : 'Cannot refresh dashboards.'))
  }, [state._meta.dashboardStoreVersion, dashboardStore.dashboardStoreVersion])

  function handleChangeDashboard(id: string) {
    const url = new URL(window.location.href)
    url.searchParams.set('dashboard', id)
    window.history.pushState({}, '', url)
    setDashboardId(id)
  }

  function handleChangeDashboardScale(scale: number) {
    window.localStorage.setItem(DASHBOARD_SCALE_STORAGE_KEY, String(scale))
    setDashboardScale(scale)
  }

  return (
    <AnimatorGeneralProvider
      duration={{ enter: 0.5, exit: 0.3, stagger: 0.05 }}
    >
      <Animator active combine manager="stagger">
        {/* Ambient background effects */}
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        >
          <GridLines
            lineColor="hsl(191deg 100% 50% / 4%)"
            distance={40}
          />
          <Dots
            color="hsl(191deg 100% 50% / 10%)"
            distance={40}
            size={1}
          />
        </div>

        {/* Main dashboard content */}
        <div style={{ position: 'relative', zIndex: 1, height: '100vh' }}>
          <Dashboard
            state={state}
            wsConnected={wsConnected}
            bridgeConnected={bridgeConnected}
            lastDataTimestamp={lastDataTimestamp}
            isInitialLoading={isInitialLoading}
            dashboardId={resolvedDashboardId}
            dashboardConfig={dashboardConfig}
            dashboards={dashboardCatalog.visibleDashboards}
            dashboardScale={dashboardScale}
            onKeyPress={pressKey}
            onChangeDashboard={handleChangeDashboard}
            onChangeDashboardScale={handleChangeDashboardScale}
            onOpenDashboardManager={() => setDashboardManagerOpen(true)}
          />

          {dashboardStoreError && (
            <div className="dashboard-store-error">{dashboardStoreError}</div>
          )}

          {dashboardManagerOpen && (
            <DashboardManager
              store={dashboardStore}
              activeDashboardId={resolvedDashboardId}
              state={state}
              wsConnected={wsConnected}
              isInitialLoading={isInitialLoading}
              onClose={() => setDashboardManagerOpen(false)}
              onChangeDashboard={handleChangeDashboard}
              onStoreSaved={(store) => {
                setDashboardStore(store)
                setDashboardStoreError(null)
                setDashboardId(resolveVisibleDashboardId(store.selectedDashboardId, store))
              }}
              onError={setDashboardStoreError}
            />
          )}
        </div>
      </Animator>
    </AnimatorGeneralProvider>
  )
}
