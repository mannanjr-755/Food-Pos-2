import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import api from '../services/api'
import { getToken } from '../services/api'
import { useAuth } from './AuthContext'
import beep from '../utils/beep'

const RealtimeContext = createContext(null)

const ORDER_EVENT_TYPES = ['order.created', 'order.accepted', 'order.status', 'sale.completed']
const CATALOG_EVENT_TYPES = ['product.updated', 'stock.updated', 'category.updated']
const ALL_EVENT_TYPES = [...ORDER_EVENT_TYPES, ...CATALOG_EVENT_TYPES]

export function RealtimeProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [status, setStatus] = useState('idle') // idle | connecting | live | polling
  const [lastSynced, setLastSynced] = useState(null)
  const [unreadTick, setUnreadTick] = useState(0)

  const listenersRef = useRef(new Set())
  const catalogListenersRef = useRef(new Set())
  const esRef = useRef(null)
  const pollTimerRef = useRef(null)
  const connectTimerRef = useRef(null)
  const notifyTimerRef = useRef(null)
  const catalogTimerRef = useRef(null)
  const lastSeenRef = useRef(new Date().toISOString())
  const stoppedRef = useRef(false)

  const subscribe = useCallback((fn) => {
    listenersRef.current.add(fn)
    return () => listenersRef.current.delete(fn)
  }, [])

  const subscribeCatalog = useCallback((fn) => {
    catalogListenersRef.current.add(fn)
    return () => catalogListenersRef.current.delete(fn)
  }, [])

  const scheduleNotify = useCallback((event) => {
    if (notifyTimerRef.current) return
    notifyTimerRef.current = setTimeout(() => {
      notifyTimerRef.current = null
      for (const fn of listenersRef.current) {
        try {
          fn(event)
        } catch {
          /* ignore listener errors */
        }
      }
    }, 350)
  }, [])

  const handleEvent = useCallback(
    (type, payload) => {
      if (stoppedRef.current) return
      lastSeenRef.current = new Date().toISOString()
      setLastSynced(new Date())
      if (CATALOG_EVENT_TYPES.includes(type)) {
        if (catalogTimerRef.current) clearTimeout(catalogTimerRef.current)
        catalogTimerRef.current = setTimeout(() => {
          catalogTimerRef.current = null
          for (const fn of catalogListenersRef.current) {
            try {
              fn({ type, payload })
            } catch {
              /* ignore listener errors */
            }
          }
        }, 300)
        return
      }
      if (ORDER_EVENT_TYPES.includes(type)) {
        beep({ frequency: type === 'order.accepted' ? 990 : 820 })
        setUnreadTick((n) => n + 1)
        scheduleNotify({ type, payload })
      }
    },
    [scheduleNotify]
  )

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }, [])

  const startPolling = useCallback(() => {
    if (pollTimerRef.current || stoppedRef.current) return
    setStatus('polling')
    const tick = async () => {
      try {
        const { data } = await api.get('/events', { params: { since: lastSeenRef.current } })
        const events = Array.isArray(data) ? data : []
        if (events.length) {
          for (const ev of events) handleEvent(ev.type, { ...ev.payload, eventId: ev._id })
        }
      } catch {
        /* keep polling quietly */
      }
    }
    pollTimerRef.current = setInterval(tick, 8000)
  }, [handleEvent])

  const closeSse = useCallback(() => {
    if (esRef.current) {
      try {
        esRef.current.close()
      } catch {
        /* noop */
      }
      esRef.current = null
    }
  }, [])

  const connect = useCallback(() => {
    if (stoppedRef.current) return
    const token = getToken()
    if (!token) return
    closeSse()
    stopPolling()
    setStatus('connecting')
    lastSeenRef.current = new Date().toISOString()

    let opened = false
    const url = `/api/v1/events/stream?token=${encodeURIComponent(token)}`
    let es
    try {
      es = new EventSource(url)
    } catch {
      startPolling()
      return
    }
    esRef.current = es

    connectTimerRef.current = setTimeout(() => {
      if (!opened && !stoppedRef.current) {
        closeSse()
        startPolling()
      }
    }, 5000)

    es.onopen = () => {
      opened = true
      if (connectTimerRef.current) {
        clearTimeout(connectTimerRef.current)
        connectTimerRef.current = null
      }
      stopPolling()
      setStatus('live')
      setLastSynced(new Date())
    }

    for (const type of ALL_EVENT_TYPES) {
      es.addEventListener(type, (e) => {
        let payload = {}
        try {
          payload = JSON.parse(e.data)
        } catch {
          payload = {}
        }
        handleEvent(type, payload)
      })
    }

    es.onerror = () => {
      if (stoppedRef.current) return
      // EventSource auto-reconnects; only fall back to polling if it stays broken.
      if (es.readyState === EventSource.CLOSED) {
        closeSse()
        startPolling()
      } else {
        // Give it a moment; if not open soon, the connect timer handles fallback.
        if (!opened) {
          clearTimeout(connectTimerRef.current)
          connectTimerRef.current = setTimeout(() => {
            if (!opened && !stoppedRef.current) {
              closeSse()
              startPolling()
            }
          }, 2000)
        }
      }
    }
  }, [closeSse, stopPolling, startPolling, handleEvent])

  useEffect(() => {
    if (!isAuthenticated) {
      stoppedRef.current = true
      closeSse()
      stopPolling()
      setStatus('idle')
      return undefined
    }
    stoppedRef.current = false
    connect()
    return () => {
      stoppedRef.current = true
      if (connectTimerRef.current) clearTimeout(connectTimerRef.current)
      if (notifyTimerRef.current) clearTimeout(notifyTimerRef.current)
      if (catalogTimerRef.current) clearTimeout(catalogTimerRef.current)
      closeSse()
      stopPolling()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  const value = useMemo(
    () => ({ status, lastSynced, unreadTick, subscribe, subscribeCatalog, refresh: scheduleNotify }),
    [status, lastSynced, unreadTick, subscribe, subscribeCatalog, scheduleNotify]
  )

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext)
  if (!ctx) throw new Error('useRealtime must be used within RealtimeProvider')
  return ctx
}
