import React from 'react'

export type WidgetStateTone = 'loading' | 'offline' | 'empty'

interface Props {
  tone: WidgetStateTone
  title: string
  detail: string
  compact?: boolean
}

const TONE_LABELS: Record<WidgetStateTone, string> = {
  loading: 'Syncing',
  offline: 'Offline',
  empty: 'Empty',
}

export function WidgetStateNotice({ tone, title, detail, compact = false }: Props) {
  return (
    <div className={`widget-state widget-state-${tone}${compact ? ' compact' : ''}`}>
      <div className="widget-state-kicker">{TONE_LABELS[tone]}</div>
      <div className="widget-state-title">{title}</div>
      <div className="widget-state-detail">{detail}</div>
    </div>
  )
}
