import React, { useState } from 'react'
import { CommMessage, LogbookEntry } from '../types/gameData'

interface Props {
  comms: CommMessage[]
  logbook: { list: LogbookEntry[] } | null
}

type Tab = 'comms' | 'logbook'

function channelClass(channel: string): string {
  const c = channel.toLowerCase()
  if (c.includes('mission') || c.includes('friend')) return 'channel-missions'
  if (c.includes('alert')  || c.includes('warning'))  return 'channel-alerts'
  if (c.includes('news')   || c.includes('star'))      return 'channel-news'
  return ''
}

function relativeTime(ts: string): string {
  try {
    const diff = Date.now() - new Date(ts).getTime()
    const s = Math.floor(diff / 1000)
    if (s < 60)   return `${s}s ago`
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    return `${Math.floor(s / 3600)}h ago`
  } catch {
    return ''
  }
}

function sanitize(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function Comms({ comms, logbook }: Props) {
  const [tab, setTab] = useState<Tab>('comms')

  const logbookEntries = logbook?.list || []
  const hasComms   = comms.length > 0
  const hasLogbook = logbookEntries.length > 0

  const tabBtn = (t: Tab) => (
    <button
      key={t}
      style={{
        padding: '3px 8px',
        fontSize: '9px',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        cursor: 'pointer',
        background: 'transparent',
        border: `1px solid ${tab === t ? 'var(--c-cyan-dim)' : 'var(--c-border-dim)'}`,
        color: tab === t ? 'var(--c-cyan)' : 'var(--c-text-dim)',
        fontFamily: 'var(--font-mono)',
      }}
      onClick={() => setTab(t)}
    >
      {t === 'comms'   ? `Comms${hasComms ? ` (${comms.length})` : ''}` : ''}
      {t === 'logbook' ? `Log${hasLogbook ? ` (${logbookEntries.length})` : ''}` : ''}
    </button>
  )

  return (
    <>
      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', marginTop: '-2px' }}>
        {tabBtn('comms')}
        {tabBtn('logbook')}
      </div>

      {tab === 'comms' && (
        <div className="comms-list">
          {!hasComms && <div className="empty-state">No communications</div>}
          {comms.map((msg, i) => (
            <div key={i} className={`comm-item ${channelClass(msg.channel)}`}>
              <div className="comm-sender">
                <span>{msg.sender || 'System'}</span>
                <span className="comm-channel">{msg.channel}</span>
              </div>
              <div className="comm-content">{sanitize(msg.content)}</div>
              <div style={{ fontSize: '8px', color: 'var(--c-text-dim)', marginTop: '2px', textAlign: 'right' }}>
                {relativeTime(msg.timestamp)}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'logbook' && (
        <div className="comms-list">
          {!hasLogbook && <div className="empty-state">No logbook entries</div>}
          {logbookEntries.slice(0, 30).map((entry, i) => (
            <div key={i} className="logbook-item">
              <div className="logbook-title">{sanitize(entry.title)}</div>
              {entry.factionname && (
                <div className="logbook-faction">{entry.factionname}</div>
              )}
              {entry.text && (
                <div style={{ fontSize: '10px', color: 'var(--c-text-dim)', marginTop: '3px', lineHeight: '1.4' }}>
                  {sanitize(entry.text).slice(0, 150)}{entry.text.length > 150 ? '…' : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
