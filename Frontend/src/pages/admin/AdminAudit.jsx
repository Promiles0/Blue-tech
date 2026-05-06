import { useQuery } from '@tanstack/react-query'
import apiService from '../../api/service'
import { dateTime } from '../../lib/format'

function fetchAuditLogs() {
  return apiService.admin.audit.getAll(200).then(r => r.data)
}

const ACTION_COLORS = {
  delete: '#ef4444',
  remove: '#ef4444',
  create: '#22c55e',
  insert: '#22c55e',
  update: '#3b82f6',
  grant:  '#7c5cf0',
  revoke: '#f59e0b',
}

function actionColor(action = '') {
  const key = Object.keys(ACTION_COLORS).find(k => action.toLowerCase().includes(k))
  return key ? ACTION_COLORS[key] : 'rgba(255,255,255,0.45)'
}

export default function AdminAudit() {
  const { data: logs = [], isLoading, isError } = useQuery({
    queryKey: ['admin-audit'],
    queryFn: fetchAuditLogs,
  })

  return (
    <div style={{ padding: 40 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>Audit Log</h1>
        <p style={{ color: 'var(--admin-muted)', fontSize: 13, marginTop: 4 }}>Recent admin activity</p>
      </div>

      {isError && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: 'var(--admin-danger)' }}>
          Failed to load audit logs.
        </div>
      )}

      <div className="surface" style={{ borderRadius: 14, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--admin-muted)', fontSize: 13 }}>Loading…</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>When</th><th>Who</th><th>Action</th>
                <th>Table</th><th>Target</th><th>Description</th>
              </tr>
            </thead>
            <tbody>
              {!logs.length ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--admin-muted)', fontSize: 13 }}>
                    No audit entries yet.
                  </td>
                </tr>
              ) : logs.map(log => (
                <tr key={log.logId}>
                  <td style={{ fontSize: 12, color: 'var(--admin-muted)', whiteSpace: 'nowrap' }}>{dateTime(log.createdAt)}</td>
                  <td style={{ fontSize: 12, color: 'var(--admin-muted)' }}>{log.userId ?? '—'}</td>
                  <td>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      background: `${actionColor(log.action)}22`,
                      color: actionColor(log.action),
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontFamily: 'monospace' }}>{log.targetTable}</td>
                  <td style={{ fontSize: 12, color: 'var(--admin-muted)', fontFamily: 'monospace' }}>{log.targetId ?? '—'}</td>
                  <td style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', maxWidth: 320 }}>{log.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
