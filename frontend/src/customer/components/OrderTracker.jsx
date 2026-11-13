import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck, ChefHat, ClipboardList, Info, Loader2, RefreshCw } from 'lucide-react'
import { fetchOrder } from '../guestApi'
import { STATUS_STEPS, statusMeta } from '../orderStatus'
import formatCurrency from '../../utils/formatCurrency'

const POLL_MS = 5000
const TERMINAL = new Set(['served', 'completed', 'cancelled'])

const STEP_ICONS = { pending: ClipboardList, accepted: CheckCheck, preparing: ChefHat, ready: Bell, served: CheckCheck }

export default function OrderTracker({ orderId, symbol, onNewOrder, onRetryMenu }) {
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const timer = useRef(null)

  const load = useCallback(async () => {
    try {
      const data = await fetchOrder(orderId)
      setOrder(data)
      setError('')
      return data.status
    } catch (e) {
      setError(e.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    let alive = true
    let stopped = false
    async function tick() {
      const status = await load()
      if (!alive || stopped) return
      if (status && TERMINAL.has(status)) return
      timer.current = setTimeout(tick, POLL_MS)
    }
    tick()
    return () => {
      alive = false
      stopped = true
      clearTimeout(timer.current)
    }
  }, [load])

  const meta = order ? statusMeta(order.status) : null
  const stepIndex = order ? STATUS_STEPS.indexOf(order.status) : -1
  const cancelled = order?.status === 'cancelled'

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-10 pt-6">
      <div className="lex-fade-in rounded-3xl border border-lex-700 bg-lex-850 p-5 shadow-card">
        {loading && !order ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-lex-muted">
            <Loader2 className="h-4 w-4 animate-spin text-lex-gold" />
            Finding your order…
          </div>
        ) : error && !order ? (
          <div className="py-6 text-center">
            <p className="text-sm font-semibold text-lex-error">{error}</p>
            <button type="button" onClick={onRetryMenu} className="lex-press mt-4 rounded-full bg-gold-gradient px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white">
              Back to the menu
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-lex-faint">Order</p>
                <p className="font-display text-2xl font-bold">#{order.orderNumber}</p>
                <p className="mt-0.5 text-xs text-lex-muted">{order.table}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${cancelled ? 'bg-lex-error/10 text-lex-error' : 'bg-lex-gold-pale text-lex-gold'}`}>
                {meta.label}
              </span>
            </div>

            <p className="mt-2 text-sm text-lex-muted">{meta.hint}</p>

            {!cancelled && stepIndex >= 0 && (
              <ol className="mt-5 space-y-3">
                {STATUS_STEPS.map((step, index) => {
                  const Icon = STEP_ICONS[step]
                  const done = index < stepIndex
                  const current = index === stepIndex
                  return (
                    <li key={step} className="flex items-center gap-3">
                      <span
                        className={`lex-press flex h-8 w-8 items-center justify-center rounded-full ${
                          done ? 'bg-lex-gold-pale text-lex-gold' : current ? 'bg-gold-gradient text-white lex-pulse' : 'bg-lex-800 text-lex-500'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className={`text-sm ${current ? 'font-bold' : 'font-medium'} ${done || current ? 'text-lex-ink' : 'text-lex-faint'}`}>
                        {statusMeta(step).label}
                      </span>
                    </li>
                  )
                })}
              </ol>
            )}

            {order.items.length > 0 && (
              <ul className="mt-5 divide-y divide-lex-700 border-t border-lex-700 pt-3">
                {order.items.map((line) => (
                  <li key={`${line.name}-${line.quantity}`} className="flex justify-between gap-3 py-1.5 text-sm">
                    <span className="min-w-0 truncate">
                      <span className="font-semibold tabular-nums text-lex-gold">{line.quantity}×</span> {line.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex items-baseline justify-between border-t border-lex-700 pt-3">
              <span className="text-sm text-lex-muted">Total</span>
              <span className="font-display text-xl font-bold">{formatCurrency(order.total, symbol)}</span>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onNewOrder}
                className="lex-press flex items-center gap-2 rounded-full border border-lex-700 bg-lex-900 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-lex-ink"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Order something else
              </button>
              <button
                type="button"
                onClick={load}
                className="lex-press flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-lex-muted hover:bg-lex-800"
              >
                <Loader2 className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh status
              </button>
            </div>

            <p className="mt-4 flex items-center gap-1.5 text-[11px] text-lex-faint">
              <Info className="h-3 w-3 shrink-0" />
              Something wrong? Call your server — this page updates itself every few seconds.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
