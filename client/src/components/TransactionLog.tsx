import React, { useEffect, useRef } from 'react'
import { TransactionLog as TransactionLogData, TransactionLogEntry } from '../types/gameData'
import { formatCredits } from '../utils/format'
import { toPlainText, truncateText } from '../utils/text'
import { WidgetStateNotice } from './WidgetStateNotice'

interface Props {
  transactionLog: TransactionLogData | null
  dataState: 'loading' | 'offline' | 'ready'
}

function formatValue(value: number | null): string | null {
  if (value === null) return null
  const sign = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${sign}${formatCredits(Math.abs(value))} Cr`
}

function formatContext(entry: TransactionLogEntry): string | null {
  if (entry.itemName && entry.amount !== null) {
    return `${entry.amount} x ${entry.itemName}`
  }

  if (entry.itemName) return entry.itemName
  if (entry.description) return truncateText(toPlainText(entry.description), 96)
  return null
}

export function TransactionLog({ transactionLog, dataState }: Props) {
  if (dataState === 'loading') {
    return <WidgetStateNotice tone="loading" title="Syncing transaction feed" detail="Waiting for the first commerce events from the bridge." compact />
  }

  if (dataState === 'offline') {
    return <WidgetStateNotice tone="offline" title="Transaction feed offline" detail="Reconnect to inspect recent credits, trade, and transfer activity." compact />
  }

  const allEntries = [...(transactionLog?.list || [])]
    .sort((a, b) => (a.time ?? Number.NEGATIVE_INFINITY) - (b.time ?? Number.NEGATIVE_INFINITY))

  const entries = allEntries.slice(-14)
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
  }, [transactionLog])

  if (!entries.length) {
    return <WidgetStateNotice tone="empty" title="No recent transactions" detail="Trading, sales, and transfer events appear here once the bridge exports them." compact />
  }

  return (
    <div ref={listRef} className="transaction-log-list" onScroll={handleScroll}>
      {entries.map((entry) => {
        const value = formatValue(entry.value)
        const context = formatContext(entry)
        const partner = entry.partnerName || (entry.destroyedPartner ? 'Unavailable partner' : null)

        return (
          <div key={entry.id} className="transaction-log-item">
            <div className="transaction-log-header">
              <div>
                <div className="transaction-log-event">{entry.eventLabel || 'Transaction'}</div>
                {partner && <div className="transaction-log-partner">{partner}</div>}
              </div>
              {value && (
                <div className={`transaction-log-value ${entry.value && entry.value < 0 ? 'negative' : 'positive'}`}>
                  {value}
                </div>
              )}
            </div>

            <div className="transaction-log-meta-row">
              {context && <span className="transaction-log-context">{context}</span>}
              {entry.timeText && <span className="transaction-log-time">{entry.timeText}</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
