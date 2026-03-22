import React, { useState } from 'react'
import { AnimatorGeneralProvider, Animator, GridLines, Dots } from '@arwes/react'
import { useGameData } from './hooks/useGameData'
import { Dashboard } from './components/Dashboard'
import { DASHBOARDS, getDashboard } from './dashboards'

const DASHBOARD_SCALE_STORAGE_KEY = 'dashboardScale'
const DEFAULT_DASHBOARD_ID = DASHBOARDS[0]?.id ?? 'flight'

function getWebSocketUrl(): string {
  const envUrl = import.meta.env.VITE_WS_URL?.trim()
  if (envUrl) return envUrl

  const currentUrl = new URL(window.location.href)
  const protocol = currentUrl.protocol === 'https:' ? 'wss:' : 'ws:'
  const port = currentUrl.port === '3000' ? '3001' : currentUrl.port

  return `${protocol}//${currentUrl.hostname}${port ? `:${port}` : ''}`
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
  const { state, wsConnected, isInitialLoading, pressKey } = useGameData(getWebSocketUrl())
  const [dashboardId, setDashboardId] = useState(getInitialDashboard)
  const [dashboardScale, setDashboardScale] = useState(getInitialDashboardScale)

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
            isInitialLoading={isInitialLoading}
            dashboardId={dashboardId}
            dashboardScale={dashboardScale}
            onKeyPress={pressKey}
            onChangeDashboard={handleChangeDashboard}
            onChangeDashboardScale={handleChangeDashboardScale}
          />
        </div>
      </Animator>
    </AnimatorGeneralProvider>
  )
}
