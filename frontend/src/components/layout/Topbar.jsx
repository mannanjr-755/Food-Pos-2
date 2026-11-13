import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, LogOut, Menu as MenuIcon, Search, Wifi, RefreshCw, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { apiErrorMessage } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { useRealtime } from '../../contexts/RealtimeContext'
import { useSearch } from '../../contexts/SearchContext'
import { formatClock, formatDate } from '../../utils/datetime'

function describeEvent(ev) {
  const p = ev.payload || {}
  const num = p.orderNumber ? ` #${p.orderNumber}` : ''
  switch (ev.type) {
    case 'order.accepted':
      return `Online order${num} accepted`
    case 'order.created':
      return `New online order${num}`
    case 'order.status':
      return `Order${num} → ${p.status || 'updated'}`
    case 'sale.completed':
      return `Sale${num} completed`
    case 'stock.updated':
      return 'Inventory updated'
    case 'product.updated':
      return `Product ${p.removed ? 'removed' : 'updated'}`
    default:
      return p.status ? `Update: ${p.status}` : 'New activity'
  }
}

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth()
  const { status, unreadTick, lastSynced } = useRealtime()
  const { setQuery } = useSearch()
  const location = useLocation()
  const navigate = useNavigate()

  const [now, setNow] = useState(new Date())
  const [text, setText] = useState('')
  const [notif, setNotif] = useState({ unread: [], unreadCount: 0 })
  const [openBell, setOpenBell] = useState(false)
  const [openProfile, setOpenProfile] = useState(false)
  const bellRef = useRef(null)
  const profileRef = useRef(null)

  const isPos = location.pathname === '/pos'

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const loadNotifications = () => {
    api
      .get('/notifications')
      .then(({ data }) => setNotif(data))
      .catch(() => {})
  }

  useEffect(() => {
    loadNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (unreadTick > 0) loadNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadTick])

  useEffect(() => {
    const onClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setOpenBell(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setOpenProfile(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const onSearchChange = (value) => {
    setText(value)
    if (isPos) setQuery(value)
  }

  const submitSearch = (e) => {
    e.preventDefault()
    if (!isPos) navigate(`/menu?q=${encodeURIComponent(text.trim())}`)
  }

  const markAllRead = async () => {
    try {
      const ids = notif.unread.map((e) => e._id).filter(Boolean)
      await api.post('/notifications/read', ids.length ? { eventIds: ids } : {})
      setNotif({ unread: [], unreadCount: 0 })
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  const initials = (user?.name || user?.email || 'A')
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')

  const live = status === 'live'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-lex-700/90 bg-lex-900/92 px-3 backdrop-blur-md sm:px-5">
      <button
        type="button"
        aria-label="Open navigation"
        onClick={onMenuClick}
        className="lex-press rounded-xl p-2 text-lex-gold transition hover:bg-lex-800 lg:hidden"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      <form onSubmit={submitSearch} className="relative mx-auto hidden w-full max-w-xl sm:block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-lex-faint" />
        <input
          type="text"
          value={text}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={isPos ? 'Search menu items…' : 'Search products…'}
          aria-label="Search products"
          className="w-full rounded-xl border border-lex-700 bg-lex-850 py-2.5 pl-10 pr-9 text-sm text-lex-ink shadow-soft outline-none transition placeholder:text-lex-faint focus:border-lex-gold/40 focus:bg-white focus:shadow-gold-glow"
        />
        {text && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-lex-faint transition hover:bg-lex-800 hover:text-lex-ink"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
        <div
          title={lastSynced ? `Last synced ${formatClock(lastSynced)}` : 'Connecting…'}
          className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold md:flex ${
            live
              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15'
              : 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/15'
          }`}
        >
          {live ? <Wifi className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
          {live ? 'Live' : status === 'polling' ? 'Polling' : 'Connecting'}
        </div>

        <div className="relative" ref={bellRef}>
          <button
            type="button"
            aria-label="Notifications"
            aria-expanded={openBell}
            onClick={() => setOpenBell((v) => !v)}
            className="lex-press relative rounded-xl p-2 text-lex-gold transition hover:bg-lex-800"
          >
            <Bell className="h-5 w-5" />
            {notif.unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-lex-error px-1 text-[10px] font-bold text-white">
                {notif.unreadCount > 9 ? '9+' : notif.unreadCount}
              </span>
            )}
          </button>
          {openBell && (
            <div className="lex-fade-in lex-scroll absolute right-0 mt-2 max-h-[70vh] w-[min(22rem,calc(100vw-1.5rem))] overflow-y-auto overflow-x-hidden rounded-2xl border border-lex-700 bg-lex-850 shadow-panel">
              <div className="sticky top-0 flex items-center justify-between border-b border-lex-700 bg-lex-850/95 px-4 py-3 backdrop-blur">
                <p className="text-sm font-semibold text-lex-ink">Notifications</p>
                {notif.unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-xs font-semibold text-lex-gold hover:text-lex-gold-light"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div>
                {notif.unread.length === 0 ? (
                  <p className="px-4 py-10 text-center text-sm text-lex-muted">You're all caught up.</p>
                ) : (
                  notif.unread.map((ev) => (
                    <div
                      key={ev._id}
                      className="flex items-start gap-3 border-b border-lex-700 px-4 py-3 transition last:border-0 hover:bg-lex-800/60"
                    >
                      <span className="lex-pulse mt-1.5 h-2 w-2 shrink-0 rounded-full bg-lex-gold" />
                      <div className="min-w-0">
                        <p className="truncate text-sm text-lex-ink">{describeEvent(ev)}</p>
                        <p className="text-xs text-lex-faint">{formatClock(new Date(ev.createdAt))}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            aria-label="Account menu"
            aria-expanded={openProfile}
            onClick={() => setOpenProfile((v) => !v)}
            className="lex-press flex items-center gap-2 rounded-xl border border-lex-700 bg-lex-850 py-1 pl-1 pr-2.5 shadow-soft transition hover:border-lex-gold/35"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-gradient text-xs font-bold text-white">
              {initials || 'A'}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-semibold leading-tight text-lex-ink">{user?.name || 'Staff'}</span>
              <span className="block text-[11px] capitalize leading-tight text-lex-muted">{user?.role || 'user'}</span>
            </span>
            <ChevronDown className="hidden h-4 w-4 text-lex-faint sm:block" />
          </button>
          {openProfile && (
            <div className="lex-fade-in absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-lex-700 bg-lex-850 shadow-panel">
              <div className="border-b border-lex-700 px-4 py-3">
                <p className="text-sm font-semibold text-lex-ink">{user?.name}</p>
                <p className="truncate text-xs text-lex-muted">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout()
                  navigate('/login', { replace: true })
                }}
                className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-lex-error transition hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          )}
        </div>

        <div className="hidden border-l border-lex-700 pl-3 text-right lg:block">
          <p className="text-xs font-semibold text-lex-ink">{formatDate(now)}</p>
          <p className="text-[11px] tabular-nums text-lex-gold/85">{formatClock(now)}</p>
        </div>
      </div>
    </header>
  )
}
