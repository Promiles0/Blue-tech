import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import api from '../api/axios'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { isAuthenticated, isAdmin } = useAuth()
  const [unreadCount, setUnreadCount]     = useState(0)
  const [adminUnread, setAdminUnread]     = useState(0)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(false)
  const pollRef = useRef(null)

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const { data } = await api.get('/notifications/unread-count')
      setUnreadCount(data ?? 0)
    } catch {}
  }, [isAuthenticated])

  const fetchAdminUnreadCount = useCallback(async () => {
    if (!isAdmin) return
    try {
      const { data } = await api.get('/notifications/admin/unread-count')
      setAdminUnread(data ?? 0)
    } catch {}
  }, [isAdmin])

  const fetchNotifications = useCallback(async (limit = 30) => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const { data } = await api.get(`/notifications?limit=${limit}`)
      setNotifications(data ?? [])
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  const markRead = useCallback(async (ids) => {
    if (!ids?.length) return
    try {
      await api.post('/notifications/mark-read', { ids })
      setNotifications(prev => prev.map(n => ids.includes(n.notificationId) ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - ids.length))
    } catch {}
  }, [])

  const markAllRead = useCallback(async () => {
    try {
      await api.post('/notifications/mark-all-read')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {}
  }, [])

  // Poll unread count every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) { setUnreadCount(0); return }
    fetchUnreadCount()
    if (isAdmin) fetchAdminUnreadCount()
    pollRef.current = setInterval(() => {
      fetchUnreadCount()
      if (isAdmin) fetchAdminUnreadCount()
    }, 30_000)
    return () => clearInterval(pollRef.current)
  }, [isAuthenticated, isAdmin, fetchUnreadCount, fetchAdminUnreadCount])

  return (
    <NotificationContext.Provider value={{
      unreadCount, adminUnread,
      notifications, loading,
      fetchNotifications, fetchUnreadCount, fetchAdminUnreadCount,
      markRead, markAllRead,
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider')
  return ctx
}
