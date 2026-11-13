import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ChevronDown, ChevronLeft, ChevronRight, Phone, Cloud, CloudOff,
  Check, X as RejectIcon, ChefHat, Bell, CheckCheck, Ban, Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api, { apiErrorMessage } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useRealtime } from '../contexts/RealtimeContext'
import formatCurrency from '../utils/formatCurrency'
import { formatClock, formatDate } from '../utils/datetime'
import StatusBadge from '../components/ui/StatusBadge'
import ProductImage from '../components/ui/ProductImage'
import EmptyState from '../components/ui/EmptyState'
import { TableSkeleton } from '../components/ui/Skeletons'

const TABS = [
  { id: 'all', label: 'All', status: '' },
  { id: 'pending', label: 'New', status: 'pending' },
  { id: 'accepted', label: 'Accepted', status: 'accepted' },
  { id: 'preparing', label: 'Preparing', status: 'preparing' },
  { id: 'ready', label: 'Ready', status: 'ready' },
  { id: 'served', label: 'Served', status: 'served' },
  { id: 'completed', label: 'Completed', status: 'completed' },
  { id: 'rejected', label: 'Rejected / Cancelled', status: 'rejectedOrCancelled' },
]

const NEXT_STATUS = { accepted: 'preparing', preparing: 'ready', ready: 'served', served: 'completed' }
const NEXT_LABEL = { accepted: 'Start Preparing', preparing: 'Mark Ready', ready: 'Mark Served', served: 'Mark Completed' }
const NEXT_ICON = { accepted: ChefHat, preparing: Bell, ready: CheckCheck, served: CheckCheck }

const LIMIT = 10

export default function OnlineOrders() {
  const { role } = useAuth()
  const { status: connStatus, lastSynced, subscribe } = useRealtime()

  const [tab, setTab] = useState('all')
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ orders: [], total: 0, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const canManage = ['admin', 'manager'].includes(role)
  const canCancel = ['admin', 'manager'].includes(role)

  const status = useMemo(() => TABS.find((t) => t.id === tab)?.status || '', [tab])

  const load = useCallback(
    (silent = false) => {
      if (!silent) setLoading(true)
      const params = { channel: 'online', page, limit: LIMIT }
      if (status) params.status = status
      api
        .get('/orders', { params })
        .then(({ data: d }) => setData({ orders: d.orders || [], total: d.total || 0, pages: d.pages || 1 }))
        .catch((err) => toast.error(apiErrorMessage(err, 'Could not load orders')))
        .finally(() => !silent && setLoading(false))
    },
    [page, status]
  )

  useEffect(() => {
    load()
  }, [load])

  // Realtime: refresh (context already coalesces bursts) on order events.
  useEffect(() => subscribe(() => load(true)), [subscribe, load])

  useEffect(() => {
    setPage(1)
    setExpanded(null)
  }, [tab])

  const doAction = async (order, fn, successMsg) => {
    setBusyId(order._id)
    try {
      await fn()
      toast.success(successMsg)
      load(true)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  const accept = (o) => doAction(o, () => api.post(`/orders/${o._id}/accept`), `Accepted #${o.orderNumber}`)
  const reject = (o) => doAction(o, () => api.post(`/orders/${o._id}/reject`), `Rejected #${o.orderNumber}`)
  const advance = (o, next) => doAction(o, () => api.patch(`/orders/${o._id}/status`, { status: next }), `#${o.orderNumber} → ${next}`)
  const cancel = (o) => doAction(o, () => api.patch(`/orders/${o._id}/status`, { status: 'cancelled' }), `Cancelled #${o.orderNumber}`)

  const live = connStatus === 'live'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="lex-page-title">Online Ordering</h1>
          <p className="lex-page-subtitle">Orders from table QR menus, ready for the kitchen queue</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ring-1 ${
              live
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                : 'bg-amber-50 text-amber-700 ring-amber-600/20'
            }`}
          >
            {live ? <Cloud className="h-3.5 w-3.5" /> : <CloudOff className="h-3.5 w-3.5" />}
            {live ? 'Live' : connStatus === 'polling' ? 'Polling' : 'Connecting'}
          </span>
          {lastSynced && <span className="tabular-nums text-lex-muted">Synced {formatClock(lastSynced)}</span>}
        </div>
      </div>

      {/* Tabs */}
      <div className="lex-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`lex-press shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150 ${
              tab === t.id
                ? 'bg-gold-gradient text-white shadow-gold-glow'
                : 'border border-lex-700 bg-lex-850 text-lex-muted hover:border-lex-gold/35 hover:text-lex-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : data.orders.length === 0 ? (
        <EmptyState icon={Cloud} title="No orders" message="New table QR orders will appear here in real time." />
      ) : (
        <div className="space-y-3">
          {data.orders.map((o) => {
            const count = (o.items || []).reduce((s, i) => s + (i.quantity || 0), 0)
            const isOpen = expanded === o._id
            const NextIcon = NEXT_ICON[o.status]
            return (
              <div
                key={o._id}
                className="lex-fade-in overflow-hidden rounded-2xl border border-lex-700 bg-lex-850 shadow-card transition hover:border-lex-gold/25"
              >
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : o._id)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-lex-800/50"
                  aria-expanded={isOpen}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lex-ink">#{o.orderNumber}</span>
                      <StatusBadge
                        status={o.status}
                        label={o.status === 'pending' ? 'New' : undefined}
                        tone={o.status === 'pending' ? 'red' : undefined}
                      />
                    </div>
                    <p className="mt-0.5 truncate text-sm text-lex-muted">
                      {o.customer?.name || 'Table Guest'}
                      {o.customer?.phone && (
                        <span className="ml-2 inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {o.customer.phone}
                        </span>
                      )}
                    </p>
                    <p className="text-xs tabular-nums text-lex-faint">
                      {count} item{count === 1 ? '' : 's'} · {o.orderType} · {formatDate(new Date(o.createdAt))} {formatClock(new Date(o.createdAt))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-bold tabular-nums text-lex-gold">{formatCurrency(o.total)}</p>
                  </div>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-lex-faint transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="lex-fade-in border-t border-lex-700 px-4 py-4">
                    <ul className="space-y-2">
                      {(o.items || []).map((line, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <ProductImage src={line.image} alt={line.name} className="h-10 w-10 shrink-0 rounded-lg ring-1 ring-lex-gold/15" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-lex-ink">
                              {line.name} <span className="text-lex-muted">× {line.quantity}</span>
                            </p>
                            {line.notes && <p className="text-xs italic text-lex-gold/70">“{line.notes}”</p>}
                          </div>
                          <span className="tabular-nums text-sm text-lex-ink">{formatCurrency(line.lineTotal)}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-3 grid gap-2 text-xs text-lex-muted sm:grid-cols-2">
                      <p>Payment: <span className="capitalize text-lex-ink">{o.payment?.method}</span> · <StatusBadge status={o.payment?.status} /></p>
                      {o.table && <p>Table: <span className="text-lex-ink">{o.table}</span></p>}
                      {o.notes && <p className="sm:col-span-2">Order note: <span className="text-lex-ink">{o.notes}</span></p>}
                      {o.sourceRef && <p className="sm:col-span-2">Order ref: <span className="text-lex-ink">{o.sourceRef}</span></p>}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-lex-700 pt-3">
                      {o.status === 'pending' && (
                        canManage ? (
                          <>
                            <button
                              type="button"
                              disabled={busyId === o._id}
                              onClick={() => accept(o)}
                              className="lex-press flex items-center gap-1.5 rounded-lg bg-gold-gradient px-3.5 py-2 text-sm font-bold text-white shadow-gold-glow transition hover:brightness-110 disabled:opacity-60"
                            >
                              {busyId === o._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                              Accept
                            </button>
                            <button
                              type="button"
                              disabled={busyId === o._id}
                              onClick={() => reject(o)}
                              className="lex-press flex items-center gap-1.5 rounded-lg border border-red-400/30 px-3.5 py-2 text-sm font-semibold text-lex-error transition hover:bg-red-400/10 disabled:opacity-60"
                            >
                              <RejectIcon className="h-4 w-4" />
                              Reject
                            </button>
                          </>
                        ) : (
                          <p className="text-sm font-medium text-lex-muted">Awaiting admin acceptance</p>
                        )
                      )}

                      {NEXT_STATUS[o.status] && (
                        <button
                          type="button"
                          disabled={busyId === o._id}
                          onClick={() => advance(o, NEXT_STATUS[o.status])}
                          className="lex-press flex items-center gap-1.5 rounded-lg bg-gold-gradient px-3.5 py-2 text-sm font-bold text-white shadow-gold-glow transition hover:brightness-110 disabled:opacity-60"
                        >
                          {busyId === o._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <NextIcon className="h-4 w-4" />}
                          {NEXT_LABEL[o.status]}
                        </button>
                      )}

                      {canCancel && ['accepted', 'preparing', 'ready'].includes(o.status) && (
                        <button
                          type="button"
                          disabled={busyId === o._id}
                          onClick={() => cancel(o)}
                          className="lex-press flex items-center gap-1.5 rounded-lg border border-red-400/30 px-3.5 py-2 text-sm font-semibold text-lex-error transition hover:bg-red-400/10 disabled:opacity-60"
                        >
                          <Ban className="h-4 w-4" />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {data.pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="lex-press flex items-center gap-1 rounded-lg border border-lex-gold/25 px-3 py-1.5 text-sm font-semibold text-lex-gold transition hover:border-lex-gold/50 hover:bg-lex-gold/10 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <span className="text-sm tabular-nums text-lex-muted">
            Page {page} of {data.pages} · {data.total} orders
          </span>
          <button
            type="button"
            disabled={page >= data.pages}
            onClick={() => setPage((p) => p + 1)}
            className="lex-press flex items-center gap-1 rounded-lg border border-lex-gold/25 px-3 py-1.5 text-sm font-semibold text-lex-gold transition hover:border-lex-gold/50 hover:bg-lex-gold/10 disabled:opacity-40"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
