import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, ShieldCheck, ShieldOff, Ban, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import apiService from '../../api/service'
import { money, dateShort } from '../../lib/format'

function fetchUsers(search) {
  return apiService.admin.users.getAll(search).then(r => r.data)
}

export default function AdminUsers() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users', debouncedSearch],
    queryFn: () => fetchUsers(debouncedSearch),
  })

  function handleSearch(e) {
    setSearch(e.target.value)
    clearTimeout(window._userSearchTimer)
    window._userSearchTimer = setTimeout(() => setDebouncedSearch(e.target.value), 350)
  }

  const setAdmin = useMutation({
    mutationFn: ({ userId, make }) => apiService.admin.users.setAdmin(userId, make).then(r => r.data),
    onSuccess: (_, { make }) => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success(make ? 'Admin role granted' : 'Admin role removed')
    },
    onError: () => toast.error('Failed to update role'),
  })

  const setSuspend = useMutation({
    mutationFn: ({ userId, suspend }) => apiService.admin.users.setSuspend(userId, suspend).then(r => r.data),
    onSuccess: (_, { suspend }) => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success(suspend ? 'User suspended' : 'User unsuspended')
    },
    onError: () => toast.error('Failed to update suspension'),
  })

  return (
    <div style={{ padding: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>Users</h1>
          <p style={{ color: 'var(--admin-muted)', fontSize: 13, marginTop: 4 }}>Manage roles and account status</p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-muted)' }} />
          <input
            value={search}
            onChange={handleSearch}
            placeholder="Search name or email…"
            style={{ ...inputStyle, paddingLeft: 32, width: 240 }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="surface" style={{ borderRadius: 14, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--admin-muted)', fontSize: 13 }}>Loading…</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Role</th>
                <th>Orders</th><th>Spent</th><th>Joined</th><th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!users.length ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--admin-muted)', fontSize: 13 }}>No users found.</td></tr>
              ) : users.map(u => (
                <tr key={u.userId} style={{ opacity: u.suspended ? 0.55 : 1 }}>
                  <td style={{ fontWeight: 500, fontSize: 13 }}>{u.name ?? '—'}</td>
                  <td style={{ color: 'var(--admin-muted)', fontSize: 12 }}>{u.email}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      <RoleBadge role={u.role} />
                      {u.suspended && <span style={dangerBadge}>Suspended</span>}
                    </div>
                  </td>
                  <td style={{ color: 'var(--admin-muted)' }}>{u.orderCount}</td>
                  <td style={{ color: 'var(--admin-amber)', fontWeight: 600 }}>{money(u.totalSpent)}</td>
                  <td style={{ color: 'var(--admin-muted)', fontSize: 12 }}>{dateShort(u.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {/* Admin toggle */}
                      {u.role === 'ADMIN' ? (
                        <button
                          onClick={() => setAdmin.mutate({ userId: u.userId, make: false })}
                          disabled={setAdmin.isPending}
                          style={outlineBtn}
                          title="Remove admin"
                        >
                          <ShieldOff size={12} /> Remove admin
                        </button>
                      ) : (
                        <button
                          onClick={() => setAdmin.mutate({ userId: u.userId, make: true })}
                          disabled={setAdmin.isPending}
                          style={primaryBtn}
                          title="Make admin"
                        >
                          <ShieldCheck size={12} /> Make admin
                        </button>
                      )}
                      {/* Suspend toggle */}
                      {u.suspended ? (
                        <button
                          onClick={() => setSuspend.mutate({ userId: u.userId, suspend: false })}
                          disabled={setSuspend.isPending}
                          style={ghostBtn}
                          title="Unsuspend"
                        >
                          <CheckCircle size={12} /> Unsuspend
                        </button>
                      ) : (
                        <button
                          onClick={() => setSuspend.mutate({ userId: u.userId, suspend: true })}
                          disabled={setSuspend.isPending}
                          style={ghostBtn}
                          title="Suspend"
                        >
                          <Ban size={12} /> Suspend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function RoleBadge({ role }) {
  const isAdmin = role === 'ADMIN'
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
      background: isAdmin ? 'rgba(124,92,240,0.2)' : 'rgba(255,255,255,0.08)',
      color: isAdmin ? 'var(--admin-primary)' : 'var(--admin-muted)',
    }}>
      {role ?? 'USER'}
    </span>
  )
}

const dangerBadge = {
  fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
  background: 'rgba(239,68,68,0.15)', color: 'var(--admin-danger)',
}
const inputStyle = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid var(--admin-border)',
  borderRadius: 8, color: '#fff', padding: '7px 12px', fontSize: 13, outline: 'none',
}
const primaryBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  background: 'var(--admin-primary)', border: 'none', borderRadius: 7,
  color: '#fff', padding: '5px 10px', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap',
}
const outlineBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  background: 'transparent', border: '1px solid var(--admin-border)',
  borderRadius: 7, color: '#fff', padding: '5px 10px', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap',
}
const ghostBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  background: 'none', border: 'none',
  borderRadius: 7, color: 'var(--admin-muted)', padding: '5px 8px', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap',
}
