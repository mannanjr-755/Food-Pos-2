import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api, { readAuth, writeAuth } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => readAuth())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  const login = useCallback(async (pin) => {
    const { data } = await api.post('/auth/login', { pin: String(pin).trim() })
    const next = {
      token: data.token,
      user: { _id: data._id, name: data.name, email: data.email, role: data.role },
    }
    writeAuth(next)
    setAuth(next)
    return next.user
  }, [])

  const logout = useCallback(() => {
    writeAuth(null)
    setAuth(null)
  }, [])

  const value = useMemo(
    () => ({
      ready,
      user: auth?.user || null,
      token: auth?.token || null,
      role: auth?.user?.role || null,
      isAuthenticated: Boolean(auth?.token),
      login,
      logout,
    }),
    [auth, ready, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
