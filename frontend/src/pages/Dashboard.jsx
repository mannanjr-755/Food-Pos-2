import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Armchair,
  Bell,
  ChefHat,
  LayoutGrid,
  Plus,
  Receipt,
  ShoppingBag,
  TrendingUp,
  UtensilsCrossed,
  ArrowRight,
} from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useRealtime } from '../contexts/RealtimeContext'
import formatCurrency from '../utils/formatCurrency'
import StatusBadge from '../components/ui/StatusBadge'
import EmptyState from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeletons'
import { relativeOrTime } from '../utils/datetime'

const QUICK_LINKS = [
  { to: '/pos', label: 'New Order', icon: Plus, primary: true },
  { to: '/online-orders', label: 'Order Queue', icon: Receipt },
  { to: '/tables', label: 'Table QR Codes', icon: Armchair },
  { to: '/menu', label: 'Menu', icon: UtensilsCrossed },
]

function greetingForHour(hour) {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function StatCard({ icon: Icon, label, value, hint, tone = 'gold' }) {
  const tones = {
    gold: 'bg-lex-gold/10 text-lex-gold ring-lex-gold/20',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    blue: 'bg-sky-50 text-sky-700 ring-sky-600/20',
    amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  }
  return (
    <div className="lex-surface p-4 transition hover:border-lex-gold/25 hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-lex-faint">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums tracking-tight text-lex-ink">{value}</p>
          {hint && <p className="mt-1 truncate text-xs text-lex-muted">{hint}</p>}
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${tones[tone]}`}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { subscribe } = useRealtime()

  const load = useCallback(() => {
    api
      .get('/dashboard')
      .then(({ data: payload }) => setData(payload))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => subscribe(load), [subscribe, load])

  const totals = data?.totals ?? { orders: 0, todayOrders: 0, todayRevenue: 0, totalRevenue: 0, unreadAlerts: 0 }
  const counts = data?.statusCounts ?? { pending: 0, accepted: 0, preparing: 0, ready: 0, served: 0, completed: 0, cancelled: 0 }
  const tables = data?.tables ?? { total: 0, occupied: 0, rows: [] }
  const recent = data?.recentOrders ?? []
  const inFlight = counts.pending + counts.accepted + counts.preparing + counts.ready + counts.served

  const greeting = useMemo(() => greetingForHour(new Date().getHours()), [])
  const firstName = (user?.name || 'team').split(/\s+/)[0]

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lex-gold">Overview</p>
          <h1 className="lex-page-title mt-1">
            {greeting}, {firstName}
          </h1>
          <p className="lex-page-subtitle">Live view of orders, kitchen queue, and floor status</p>
        </div>
        <Link to="/pos" className="lex-btn-primary">
          <Plus className="h-4 w-4" /> New order
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {loading && !data ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[108px] rounded-2xl" />)
        ) : (
          <>
            <StatCard icon={ShoppingBag} label="Total orders" value={totals.orders.toLocaleString()} hint={`${totals.todayOrders} today`} />
            <StatCard icon={Bell} label="New orders" value={counts.pending} hint={totals.unreadAlerts ? `${totals.unreadAlerts} unread alerts` : 'No unread alerts'} tone="amber" />
            <StatCard icon={ChefHat} label="Preparing" value={counts.preparing} hint={`${counts.accepted} confirmed`} tone="blue" />
            <StatCard icon={LayoutGrid} label="Ready / served" value={`${counts.ready} / ${counts.served}`} hint={`${counts.completed} completed`} tone="green" />
            <StatCard icon={TrendingUp} label="Total sales" value={formatCurrency(totals.totalRevenue)} hint={`${formatCurrency(totals.todayRevenue)} today`} />
            <StatCard icon={Armchair} label="Active tables" value={`${tables.occupied}/${tables.total}`} hint={`${inFlight} orders in flight`} />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <section className="lex-surface overflow-hidden">
          <header className="flex items-center justify-between border-b border-lex-700 px-4 py-3.5 sm:px-5">
            <div>
              <h2 className="font-display text-lg font-semibold text-lex-ink">Recent orders</h2>
              <p className="text-xs text-lex-faint">Latest POS and online activity</p>
            </div>
            <Link
              to="/online-orders"
              className="inline-flex items-center gap-1 text-xs font-semibold text-lex-gold transition hover:text-lex-gold-light"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </header>
          {loading && !data ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={Receipt} title="No orders yet" message="QR table orders and POS sales land here the moment they are placed." />
            </div>
          ) : (
            <ul className="divide-y divide-lex-700">
              {recent.map((order) => (
                <li key={order._id}>
                  <Link
                    to="/online-orders"
                    className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-lex-800/70 sm:px-5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-lex-ink">#{order.orderNumber}</p>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-lex-muted">
                        {order.table ? `${order.table} · ` : ''}
                        {order.itemCount ?? 0} item(s)
                        {order.customerName ? ` · ${order.customerName}` : ''}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold tabular-nums text-lex-gold">{formatCurrency(order.total)}</p>
                      <p className="text-[11px] text-lex-faint">{relativeOrTime(new Date(order.createdAt))}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-4">
          <section className="lex-surface overflow-hidden">
            <header className="flex items-center justify-between border-b border-lex-700 px-4 py-3.5">
              <div>
                <h2 className="font-display text-lg font-semibold text-lex-ink">Floor status</h2>
                <p className="text-xs text-lex-faint">
                  {tables.occupied} occupied · {Math.max(tables.total - tables.occupied, 0)} free
                </p>
              </div>
              <Link to="/tables" className="text-xs font-semibold text-lex-gold transition hover:text-lex-gold-light">
                Manage
              </Link>
            </header>
            <ul className="space-y-2 p-3">
              {tables.rows.length === 0 && (
                <li className="px-2 py-8 text-center text-sm text-lex-muted">No tables configured yet.</li>
              )}
              {tables.rows.map((table) => {
                const open = Boolean(table.currentOrder)
                return (
                  <li
                    key={table.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-lex-700 bg-lex-900/80 px-3 py-2.5 transition hover:border-lex-gold/25"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-lex-ink">{table.label || `Table ${table.number}`}</p>
                      <p className="truncate text-[11px] text-lex-faint">
                        {open ? `#${table.currentOrder.orderNumber}` : `${table.totalOrders} order(s) all time`}
                      </p>
                    </div>
                    {open ? (
                      <StatusBadge status={table.currentOrder.status} />
                    ) : (
                      <StatusBadge label="Available" tone="green" status="available" />
                    )}
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="lex-surface p-3.5">
            <h2 className="px-1 pb-2.5 pt-0.5 font-display text-lg font-semibold text-lex-ink">Quick actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_LINKS.map(({ to, label, icon: Icon, primary }) => (
                <Link
                  key={to}
                  to={to}
                  className={`lex-press flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                    primary
                      ? 'bg-gold-gradient text-white shadow-gold-glow hover:brightness-110'
                      : 'border border-lex-700 bg-lex-900 text-lex-ink hover:border-lex-gold/35 hover:bg-lex-800'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
