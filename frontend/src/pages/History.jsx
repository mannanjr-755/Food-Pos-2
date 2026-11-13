import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Printer, Ticket, Layers, Loader2, CloudOff } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { apiErrorMessage } from '../services/api'
import formatCurrency from '../utils/formatCurrency'
import { formatDateTime } from '../utils/datetime'
import EmptyState from '../components/ui/EmptyState'
import { TableSkeleton } from '../components/ui/Skeletons'
import CombinedPrint from '../components/pos/CombinedPrint'
import ReceiptModal from '../components/pos/ReceiptModal'
import KotPrint from '../components/pos/KotPrint'
import { ChaskaMark } from '../components/ui/Logo'
import { cacheHistoryPage, listLocalHistory } from '../offline/syncEngine'
import { useOffline } from '../contexts/OfflineContext'

export default function History() {
  const { online, runSync } = useOffline()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [billOrder, setBillOrder] = useState(null)
  const [kotOrder, setKotOrder] = useState(null)
  const [bothOrder, setBothOrder] = useState(null)
  const [busy, setBusy] = useState(null)

  const mergeLocal = useCallback(async (serverOrders = []) => {
    const local = await listLocalHistory()
    const byKey = new Map()
    for (const o of serverOrders) {
      const key = o.idempotencyKey || o._id || o.orderNumber
      byKey.set(String(key), o)
    }
    for (const o of local) {
      const key = o.idempotencyKey || o._id || o.orderNumber
      if (!byKey.has(String(key))) byKey.set(String(key), o)
      else if (o.offline || o._localPending) {
        // Prefer server copy once synced; keep offline badge only if still pending.
        const existing = byKey.get(String(key))
        byKey.set(String(key), { ...existing, offline: false })
      }
    }
    return Array.from(byKey.values()).sort(
      (a, b) => new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt)
    )
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (navigator.onLine) {
        const { data } = await api.get('/orders', {
          params: { channel: 'pos', status: 'completed', page, limit: 20 },
        })
        await cacheHistoryPage(data.orders || [])
        const merged = await mergeLocal(data.orders || [])
        setOrders(page === 1 ? merged : data.orders || [])
        setPages(data.pages || 1)
      } else {
        const local = await listLocalHistory()
        setOrders(local)
        setPages(1)
      }
    } catch (err) {
      const local = await listLocalHistory()
      if (local.length) {
        setOrders(local)
        setPages(1)
        toast('Showing offline history', { icon: '📴' })
      } else {
        toast.error(apiErrorMessage(err, 'Could not load history'))
      }
    } finally {
      setLoading(false)
    }
  }, [page, mergeLocal])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (online) {
      runSync().then(() => load())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online])

  return (
    <div className="min-h-screen bg-lex-900 text-lex-ink">
      <header className="sticky top-0 z-20 border-b border-lex-700 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <Link to="/pos" className="pos-nav-btn">
            <ArrowLeft className="h-4 w-4 text-lex-gold" />
            POS
          </Link>
          <div className="flex items-center gap-2">
            <ChaskaMark className="h-8 w-8" />
            <div>
              <h1 className="text-lg font-bold">Order History</h1>
              <p className="text-xs text-lex-muted">Online and offline confirmed sales</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4 sm:p-6">
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : orders.length === 0 ? (
          <EmptyState title="No orders yet" message="Completed checkouts will appear here." />
        ) : (
          <div className="lex-surface overflow-hidden">
            <div className="lex-scroll overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-lex-800 text-left text-xs font-bold uppercase tracking-wide text-lex-muted">
                  <tr>
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Print</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lex-700">
                  {orders.map((o) => (
                    <tr key={o._id || o.idempotencyKey || o.orderNumber} className="hover:bg-lex-800/60">
                      <td className="px-4 py-3 font-semibold">
                        #{o.orderNumber}
                        {o.offline || o._localPending ? (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            <CloudOff className="h-3 w-3" /> Offline
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{o.customer?.name || 'Walk-in'}</p>
                        {o.waiter ? <p className="text-xs text-lex-muted">Waiter: {o.waiter}</p> : null}
                      </td>
                      <td className="px-4 py-3 text-lex-muted">{formatDateTime(o.completedAt || o.createdAt)}</td>
                      <td className="px-4 py-3 capitalize">
                        {o.payment?.method || '—'}
                        {Number(o.payment?.due) > 0 ? (
                          <span className="ml-1 text-xs text-lex-warning">(due {formatCurrency(o.payment.due)})</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums text-lex-gold">
                        {formatCurrency(o.total)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button type="button" className="pos-nav-btn px-2 py-1.5" onClick={() => setBillOrder(o)}>
                            <Printer className="h-3.5 w-3.5 text-lex-gold" />
                            Bill
                          </button>
                          <button type="button" className="pos-nav-btn px-2 py-1.5" onClick={() => setKotOrder(o)}>
                            <Ticket className="h-3.5 w-3.5 text-lex-gold" />
                            KOT
                          </button>
                          <button
                            type="button"
                            className="pos-nav-btn px-2 py-1.5"
                            disabled={busy === (o._id || o.orderNumber)}
                            onClick={() => {
                              setBusy(o._id || o.orderNumber)
                              setBothOrder(o)
                            }}
                          >
                            {busy === (o._id || o.orderNumber) ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-lex-gold" />
                            ) : (
                              <Layers className="h-3.5 w-3.5 text-lex-gold" />
                            )}
                            Both
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div className="flex items-center justify-between border-t border-lex-700 px-4 py-3 text-sm">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="lex-btn-secondary py-1.5 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-lex-muted">
                  Page {page} of {pages}
                </span>
                <button
                  type="button"
                  disabled={page >= pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="lex-btn-secondary py-1.5 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <ReceiptModal open={Boolean(billOrder)} order={billOrder} onClose={() => setBillOrder(null)} autoPrint />
      <KotPrint open={Boolean(kotOrder)} order={kotOrder} onDone={() => setKotOrder(null)} />
      <CombinedPrint
        open={Boolean(bothOrder)}
        order={bothOrder}
        onDone={() => {
          setBothOrder(null)
          setBusy(null)
        }}
      />
    </div>
  )
}
