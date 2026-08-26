import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import authService from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') ?? 'null')
      setUser(storedUser)
    } catch {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data
  }, [])

  const register = useCallback(async (name, email, password) => {
    const data = await authService.register(name, email, password)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data
  }, [])

  const googleLogin = useCallback(async (token) => {
    const data = await authService.googleLogin(token)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data
  }, [])

  const logout = useCallback(async () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
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
