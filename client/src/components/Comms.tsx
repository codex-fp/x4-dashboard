import React, { useEffect, useRef } from 'react'
import { LogbookEntry } from '../types/gameData'
import { WidgetStateNotice } from './WidgetStateNotice'

interface Props {
  logbook: { list: LogbookEntry[] } | null
  dataState: 'loading' | 'offline' | 'ready'
}

function sanitize(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function Comms({ logbook, dataState }: Props) {
  if (dataState === 'loading') {
    return <WidgetStateNotice tone="loading" title="Opening comms buffer" detail="Waiting for the first logbook entries." />
  }

  if (dataState === 'offline') {
    return <WidgetStateNotice tone="offline" title="Comms buffer offline" detail="Logbook updates resume after the dashboard reconnects." />
  }

  const logbookEntries = logbook?.list || []
  const visibleEntries = logbookEntries.slice(-30)
  const hasLogbook = logbookEntries.length > 0
  const listRef = useRef<HTMLDivElement | null>(null)
  const shouldStickToBottomRef = useRef(true)

  function handleScroll() {
    if (!listRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = listRef.current
    const distanceFromBottom = scrollHeight - clientHeight - scrollTop

    shouldStickToBottomRef.current = distanceFromBottom < 24
  }

  useEffect(() => {
    if (!listRef.current) return

    if (shouldStickToBottomRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [logbookEntries])

  return (
    <div ref={listRef} className="comms-list" onScroll={handleScroll}>
      {!hasLogbook && <WidgetStateNotice tone="empty" title="No recent comms" detail="No logbook traffic has been recorded yet." compact />}
      {visibleEntries.map((entry, i) => (
        <div key={i} className="logbook-item">
          <div className="logbook-title">{sanitize(entry.title)}</div>
          {entry.factionname && (
            <div className="logbook-faction">{entry.factionname}</div>
          )}
          {entry.text && (
            <div className="logbook-text">
              {sanitize(entry.text).slice(0, 150)}{entry.text.length > 150 ? '…' : ''}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
