import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../services/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const loadUser = async (session) => {
      if (!session) { if (mounted) setUser(null); return }
      const { data } = await supabase.from('users').select('*').eq('id', session.user.id).maybeSingle()
      const currentUser = data ?? { id: session.user.id, email: session.user.email }
      localStorage.setItem('user', JSON.stringify(currentUser))
      if (mounted) setUser(currentUser)
    }
    supabase.auth.getSession().then(({ data: { session } }) => loadUser(session)).finally(() => mounted && setLoading(false))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => loadUser(session))
    return () => { mounted = false; listener.subscription.unsubscribe() }
  }, [])

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }, [])

  const register = useCallback(async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
    if (error) throw error
    return data
  }, [])

  const googleLogin = useCallback(async (token) => {
    const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'google', token })
    if (error) throw error
    return data
  }, [])

  const logout = useCallback(async () => {
    localStorage.removeItem('user')
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  const updateUser = useCallback((updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser))
    setUser(updatedUser)
  }, [])

  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    googleLogin,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role?.toLowerCase() === 'admin',
  }), [user, loading, login, register, googleLogin, logout, updateUser])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/* eslint-disable-next-line react-refresh/only-export-components */
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export default AuthContext
