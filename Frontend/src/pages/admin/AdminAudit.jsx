import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import api from '../../api/axios'

export default function AdminAudit() {
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    api.get('/admin/audit')
      .then(({ data }) => {
        setLogs(data.data ?? data)
        setError(null)
      })
      .catch(() => setError('Failed to load audit logs.'))
      .finally(() => setLoading(false))
  }, [refreshKey])

  const fetchLogs = () => {
    setLoading(true)
    setError(null)
    setRefreshKey(k => k + 1)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Audit Logs</h1>
          <p style={{ color: '#555', fontSize: 13, marginTop: 3 }}>System activity trail</p>
        </div>
        <button onClick={fetchLogs} className="noir-btn-outline" style={{ gap: 7, fontSize: 13, padding: '9px 16px', display: 'flex', alignItems: 'center' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#ef4444' }}>
          {error}
        </div>
      )}

      <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
              {['Time', 'Action', 'Table', 'User', 'IP', 'Description'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#444', fontWeight: 600, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #141414' }}>
                  {[1,2,3,4,5,6].map(j => (
                    <td key={j} style={{ padding: '13px 16px' }}>
                      <div className="skeleton" style={{ height: 13, borderRadius: 4 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#444' }}>No audit logs recorded yet.</td></tr>
            ) : logs.map((log, i) => (
              <tr key={log.logId ?? i} style={{ borderBottom: '1px solid #141414', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#161616'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '12px 16px', color: '#444', whiteSpace: 'nowrap', fontSize: 12 }}>
                  {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                    padding: '3px 8px', borderRadius: 4,
                    ...actionStyle(log.action),
                  }}>
                    {log.action}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#666', fontFamily: 'monospace', fontSize: 12 }}>
                  {log.targetTable ?? '—'}
                </td>
                <td style={{ padding: '12px 16px', color: '#555', fontSize: 12 }}>
                  {log.userId ?? '—'}
                </td>
                <td style={{ padding: '12px 16px', color: '#444', fontSize: 11, fontFamily: 'monospace' }}>
                  {log.ipAddress ?? '—'}
                </td>
                <td style={{ padding: '12px 16px', color: '#555', maxWidth: 280 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                    {log.description ?? '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function actionStyle(action = '') {
  const a = action.toUpperCase()
  if (a.includes('DELETE')) return { background: 'rgba(239,68,68,0.1)',   color: '#ef4444' }
  if (a.includes('CREATE') || a.includes('INSERT')) return { background: 'rgba(34,197,94,0.1)', color: '#22c55e' }
  if (a.includes('UPDATE')) return { background: 'rgba(59,130,246,0.1)',  color: '#60a5fa' }
  return { background: 'rgba(124,92,240,0.1)', color: '#a78bfa' }
}
