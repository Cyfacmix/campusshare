import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { auth } from '../api'
import { clearSession, getRefreshToken, hasSession, setTokens } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
  })
  const [loading, setLoading] = useState(hasSession())

  const persist = useCallback((u) => {
    setUser(u)
    if (u) localStorage.setItem('user', JSON.stringify(u))
  }, [])

  const logoutLocal = useCallback(() => {
    clearSession()
    setUser(null)
    queryClient.clear()
  }, [queryClient])

  useEffect(() => {
    if (!hasSession()) { setLoading(false); return }
    auth.me().then(persist).catch(() => logoutLocal()).finally(() => setLoading(false))
  }, [persist, logoutLocal])

  useEffect(() => {
    window.addEventListener('auth:logout', logoutLocal)
    return () => window.removeEventListener('auth:logout', logoutLocal)
  }, [logoutLocal])

  const login = useCallback(async (email, password) => {
    const data = await auth.login({ email, password })
    setTokens(data.access, data.refresh)
    persist(data.user)
    return data.user
  }, [persist])

  const register = useCallback(async (payload) => {
    await auth.register(payload)
    return login(payload.email, payload.password)
  }, [login])

  const logout = useCallback(async () => {
    try { await auth.logout(getRefreshToken()) } catch { /* ignore */ }
    logoutLocal()
  }, [logoutLocal])

  const refreshUser = useCallback(() => auth.me().then(persist), [persist])

  const value = useMemo(() => ({
    user, loading, login, register, logout, refreshUser, setUser: persist,
    isAuthenticated: Boolean(user),
    hasRole: (...roles) => Boolean(user && roles.includes(user.role)),
    isModerator: Boolean(user && ['moderateur', 'admin'].includes(user.role)),
  }), [user, loading, login, register, logout, refreshUser, persist])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
