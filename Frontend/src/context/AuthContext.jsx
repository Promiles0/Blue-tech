import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import apiService from '../api/service'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token     = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      try { 
        const parsed = JSON.parse(savedUser)
        setUser(parsed)
      } catch (e) {
        console.error('Failed to parse saved user', e)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await apiService.auth.login({ email, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data
  }, [])

  const register = useCallback(async (name, email, password) => {
    const { data } = await apiService.auth.register({ name, email, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data
  }, [])

  const googleLogin = useCallback(async (token) => {
    const { data } = await apiService.auth.googleLogin(token)
    localStorage.setItem('token', data.token)
    const userData = data.user ?? data
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
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
    isAdmin: user?.role === 'ADMIN',
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
