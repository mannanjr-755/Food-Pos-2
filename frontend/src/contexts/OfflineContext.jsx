import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { pendingCount, syncPendingSales } from '../offline/syncEngine'

const OfflineContext = createContext(null)

export function OfflineProvider({ children }) {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [pending, setPending] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const syncingRef = useRef(false)

  const refreshPending = useCallback(async () => {
    try {
      setPending(await pendingCount())
    } catch {
      setPending(0)
    }
  }, [])

  const runSync = useCallback(async () => {
    if (!navigator.onLine || syncingRef.current) return { synced: 0, failed: 0 }
    syncingRef.current = true
    setSyncing(true)
    try {
      const result = await syncPendingSales()
      await refreshPending()
      if (result.synced > 0) {
        toast.success(`Synced ${result.synced} offline order${result.synced > 1 ? 's' : ''}`)
      }
      return result
    } catch {
      return { synced: 0, failed: 0 }
    } finally {
      syncingRef.current = false
      setSyncing(false)
    }
  }, [refreshPending])

  useEffect(() => {
    refreshPending()
    const onOnline = () => {
      setOnline(true)
      toast.success('Back online — syncing…')
      runSync()
    }
    const onOffline = () => {
      setOnline(false)
      toast('You are offline. Sales will be saved locally.', { icon: '📴' })
    }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    const interval = setInterval(() => {
      if (navigator.onLine) runSync()
    }, 30000)
    if (navigator.onLine) runSync()
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      clearInterval(interval)
    }
  }, [refreshPending, runSync])

  const value = useMemo(
    () => ({
      online,
      pending,
      syncing,
      refreshPending,
      runSync,
    }),
    [online, pending, syncing, refreshPending, runSync]
  )

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
}

export function useOffline() {
  const ctx = useContext(OfflineContext)
  if (!ctx) throw new Error('useOffline must be used within OfflineProvider')
  return ctx
}
