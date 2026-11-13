import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import { cacheSettings, getCachedSettings } from '../utils/formatCurrency'
import { useAuth } from './AuthContext'

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const { token } = useAuth()
  const [settings, setSettings] = useState(() => getCachedSettings())

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/settings')
      cacheSettings(data)
      setSettings(data)
      return data
    } catch {
      return getCachedSettings()
    }
  }, [])

  useEffect(() => {
    if (token) load()
  }, [load, token])

  const value = useMemo(
    () => ({
      settings,
      reload: load,
      currencySymbol: settings.currencySymbol || '$',
      taxRate: Number(settings.taxRate) || 0,
      businessName: settings.businessName || 'Chaska Koyla Karahi',
    }),
    [settings, load]
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
