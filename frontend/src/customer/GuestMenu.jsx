import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Loader2, Phone, RefreshCw, ShoppingBag } from 'lucide-react'
import { fetchMenu, placeOrder } from './guestApi'
import useGuestCart from './useGuestCart'
import { clearSession, forgetSourceRef, readSession, sourceRefFor, writeSession } from './guestSession'
import ItemCard from './components/ItemCard'
import CartSheet from './components/CartSheet'
import OrderTracker from './components/OrderTracker'
import { ChaskaMark } from '../components/ui/Logo'
import formatCurrency from '../utils/formatCurrency'

const MENU_REFRESH_MS = 30_000

export default function GuestMenu({ tableNumber }) {
  const [menu, setMenu] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [cartOpen, setCartOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [orderId, setOrderId] = useState(() => readSession(`order:${tableNumber}`, null))
  const cart = useGuestCart(tableNumber)

  const load = useCallback(async () => {
    try {
      const data = await fetchMenu(tableNumber)
      setMenu(data)
      setError('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [tableNumber])

  useEffect(() => {
    let alive = true
    setLoading(true)
    fetchMenu(tableNumber)
      .then((data) => {
        if (!alive) return
        setMenu(data)
        setError('')
      })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [tableNumber])

  // Prices and availability are the kitchen's, so the page keeps itself fresh while open.
  useEffect(() => {
    if (!menu) return undefined
    const id = setInterval(() => document.hasFocus() && load(), MENU_REFRESH_MS)
    return () => clearInterval(id)
  }, [menu, load])

  const categoriesWithItems = useMemo(() => {
    if (!menu) return []
    return menu.categories
      .map((category) => ({ ...category, items: menu.items.filter((item) => item.categoryId === category.id) }))
      .filter((category) => category.items.length > 0)
  }, [menu])

  const subtotal = useMemo(() => {
    if (!menu) return 0
    return menu.items.reduce((sum, item) => sum + (cart.lines[item.id] || 0) * item.price, 0)
  }, [cart.lines, menu])

  const symbol = menu?.restaurant.currencySymbol || 'Rs.'

  async function submitOrder({ customer, notes }) {
    setSubmitting(true)
    setSubmitError('')
    try {
      const order = await placeOrder({
        tableNumber,
        customer,
        notes,
        sourceRef: sourceRefFor(tableNumber),
        items: Object.entries(cart.lines).map(([productId, quantity]) => ({ productId, quantity })),
      })
      forgetSourceRef(tableNumber)
      cart.clear()
      writeSession(`order:${tableNumber}`, order._id)
      setOrderId(order._id)
      setCartOpen(false)
    } catch (e) {
      setSubmitError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  function startNewOrder() {
    clearSession(`order:${tableNumber}`)
    setOrderId(null)
    setSubmitError('')
    load()
  }

  if (orderId) {
    return (
      <GuestFrame menu={menu} tableNumber={tableNumber}>
        <OrderTracker orderId={orderId} symbol={symbol} onNewOrder={startNewOrder} onRetryMenu={startNewOrder} />
      </GuestFrame>
    )
  }

  if (loading && !menu) {
    return (
      <GuestFrame menu={menu} tableNumber={tableNumber}>
        <div className="flex flex-col items-center gap-3 py-24 text-lex-muted">
          <Loader2 className="h-6 w-6 animate-spin text-lex-gold" />
          <p className="text-sm">Opening the menu…</p>
        </div>
      </GuestFrame>
    )
  }

  if (!menu) {
    return (
      <GuestFrame menu={menu} tableNumber={tableNumber}>
        <div className="mx-auto mt-16 max-w-sm rounded-3xl border border-lex-700 bg-lex-850 p-6 text-center shadow-card">
          <AlertTriangle className="mx-auto h-7 w-7 text-lex-warning" />
          <p className="mt-3 text-sm font-semibold">{error || 'This menu is not available right now.'}</p>
          <p className="mt-1.5 text-xs text-lex-muted">Ask your server to check the table code, or call the restaurant.</p>
          <button
            type="button"
            onClick={load}
            className="lex-press mt-5 inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        </div>
      </GuestFrame>
    )
  }

  const { restaurant, table } = menu
  const canAdd = restaurant.ordersOpen !== false

  return (
    <GuestFrame menu={menu} tableNumber={tableNumber}>
      {!canAdd && (
        <div className="mx-4 mt-4 flex items-start gap-2 rounded-2xl border border-lex-warning/30 bg-lex-warning/5 px-4 py-3 text-xs font-semibold text-lex-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Ordering is paused right now. Please call your server to place this order.
        </div>
      )}

      <nav className="sticky top-0 z-20 mt-4 border-b border-lex-700 bg-lex-900/90 backdrop-blur" aria-label="Menu sections">
        <div className="lex-scroll flex gap-2 overflow-x-auto px-4 py-2.5">
          {categoriesWithItems.map((category) => (
            <a
              key={category.id}
              href={`#category-${category.id}`}
              className="lex-press shrink-0 rounded-full border border-lex-700 bg-lex-850 px-3.5 py-1.5 text-xs font-bold text-lex-ink whitespace-nowrap"
            >
              {category.name}
            </a>
          ))}
        </div>
      </nav>

      <main className="mx-auto w-full max-w-3xl px-4 pb-32 pt-5">
        {categoriesWithItems.map((category) => (
          <section key={category.id} id={`category-${category.id}`} className="scroll-mt-24 mb-8">
            <header className="mb-3">
              <h2 className="font-display text-xl font-bold">{category.name}</h2>
              {category.description && <p className="mt-0.5 text-xs text-lex-muted">{category.description}</p>}
            </header>
            <div className="grid gap-3 sm:grid-cols-2">
              {category.items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  symbol={symbol}
                  quantity={cart.lines[item.id] || 0}
                  canAdd={canAdd}
                  onQuantity={(qty) => cart.setQty(item.id, qty)}
                />
              ))}
            </div>
          </section>
        ))}

        <p className="pt-2 text-center text-[11px] text-lex-faint">
          {restaurant.phone ? `Need help? Call ${restaurant.phone}. ` : ''}
          All prices include the kitchen’s latest changes and are confirmed at your table.
        </p>
      </main>

      {cart.count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-4" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="lex-press mx-auto flex w-full max-w-3xl items-center justify-between gap-4 rounded-2xl bg-gold-gradient px-5 py-4 text-white shadow-gold-glow"
          >
            <span className="flex items-center gap-2 text-sm font-bold">
              <ShoppingBag className="h-4 w-4" />
              {cart.count} {cart.count === 1 ? 'item' : 'items'}
            </span>
            <span className="flex items-baseline gap-3">
              <span className="font-display text-lg font-bold">{formatCurrency(subtotal, symbol)}</span>
              <span className="text-xs font-bold uppercase tracking-wider opacity-90">Review</span>
            </span>
          </button>
        </div>
      )}

      <CartSheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={menu.items}
        lines={cart.lines}
        symbol={symbol}
        onQuantity={cart.setQty}
        onSubmit={submitOrder}
        submitting={submitting}
        error={submitError}
      />
    </GuestFrame>
  )
}

function GuestFrame({ menu, tableNumber, children }) {
  const restaurant = menu?.restaurant
  const tableLabel = menu?.table?.label || (tableNumber ? `Table ${tableNumber}` : '')
  return (
    <div className="min-h-screen bg-lex-900 text-lex-ink">
      <header className="bg-navy-gradient px-4 pb-6 pt-7 text-white">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
          <ChaskaMark className="h-12 w-12 shrink-0 rounded-full bg-white/10 p-0.5" />
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-bold leading-tight">
              {restaurant?.name || 'Chaska Koyla Karahi'}
            </p>
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.22em] text-white/65">
              {restaurant?.tagline || 'Karahi & Charcoal Grill'}
            </p>
          </div>
          {tableLabel && (
            <span className="ml-auto shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider">
              {tableLabel}
            </span>
          )}
        </div>
        {restaurant?.phone && (
          <a
            href={`tel:${restaurant.phone}`}
            className="mx-auto mt-4 flex w-full max-w-3xl items-center gap-1.5 text-[11px] font-semibold text-white/70"
          >
            <Phone className="h-3 w-3" />
            {restaurant.phone}
          </a>
        )}
      </header>
      {children}
    </div>
  )
}
