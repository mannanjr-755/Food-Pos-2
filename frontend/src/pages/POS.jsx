import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Search,
  SearchX,
  Coffee,
  IceCream2,
  UtensilsCrossed,
  CupSoda,
  Soup,
  LayoutGrid,
  GlassWater,
  CakeSlice,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api, { apiErrorMessage } from '../services/api'
import { useSettings } from '../contexts/SettingsContext'
import { useRealtime } from '../contexts/RealtimeContext'
import EmptyState from '../components/ui/EmptyState'
import { CardSkeletonGrid } from '../components/ui/Skeletons'
import ProductCard from '../components/pos/ProductCard'
import OrderPanel from '../components/pos/OrderPanel'
import ReceiptModal from '../components/pos/ReceiptModal'
import KotPrint from '../components/pos/KotPrint'
import SizePickerModal from '../components/pos/SizePickerModal'
import CheckoutModal from '../components/pos/CheckoutModal'
import PosHeader from '../components/pos/PosHeader'
import { readPrinterSettings } from '../utils/printerSettings'

const genKey = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `k-${Date.now()}-${Math.random().toString(36).slice(2)}`

function categoryIcon(name = '') {
  const n = name.toLowerCase()
  if (/dessert|sweet|cake|ice/.test(n)) return CakeSlice
  if (/boba|tea|shake|frappe|blend/.test(n)) return CupSoda
  if (/cold|ice tea|iced/.test(n)) return GlassWater
  if (/hot|coffee|beverage|drink|latte|espresso/.test(n)) return Coffee
  if (/soup|karahi|biryani|rice|grill/.test(n)) return Soup
  if (/food|meal|burger|sandwich|pizza/.test(n)) return UtensilsCrossed
  if (/cream|dessert/.test(n)) return IceCream2
  return LayoutGrid
}

function sizePrice(base, size) {
  const price = Number(base) || 0
  return Math.round(price * (size === 'Half' ? 0.5 : 1) * 100) / 100
}

export default function POS() {
  const { taxRate } = useSettings()

  const [catalog, setCatalog] = useState({ categories: [], products: [] })
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [query, setQuery] = useState('')

  const [cart, setCart] = useState([])
  const [orderType, setOrderType] = useState('Dine In')
  const [table, setTable] = useState('')
  const [discountRs, setDiscountRs] = useState('')
  const [discountPct, setDiscountPct] = useState('')

  const [cartOpen, setCartOpen] = useState(false)
  const [sizeProduct, setSizeProduct] = useState(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [checkoutKey, setCheckoutKey] = useState(null)
  const [savedOrder, setSavedOrder] = useState(null)
  const [billOrder, setBillOrder] = useState(null)
  const [kotOrder, setKotOrder] = useState(null)

  const loadCatalog = useCallback(() => {
    setLoadingCatalog(true)
    api
      .get('/pos/products')
      .then(({ data }) => setCatalog({ categories: data.categories || [], products: data.products || [] }))
      .catch((err) => toast.error(apiErrorMessage(err, 'Could not load products')))
      .finally(() => setLoadingCatalog(false))
  }, [])

  useEffect(() => {
    loadCatalog()
  }, [loadCatalog])

  const { subscribeCatalog } = useRealtime()
  useEffect(
    () =>
      subscribeCatalog(() => {
        api
          .get('/pos/products')
          .then(({ data }) => setCatalog({ categories: data.categories || [], products: data.products || [] }))
          .catch(() => {})
      }),
    [subscribeCatalog]
  )

  useEffect(() => {
    if (cart.length === 0) setCartOpen(false)
    else setCartOpen(true)
  }, [cart.length])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return catalog.products.filter((p) => {
      if (activeCategory !== 'all') {
        const cid = p.category?._id || p.category
        if (String(cid) !== activeCategory) return false
      }
      if (!q) return true
      return (
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.category?.name?.toLowerCase().includes(q)
      )
    })
  }, [catalog.products, activeCategory, query])

  const totals = useMemo(() => {
    const subtotal = cart.reduce((s, l) => s + l.price * l.quantity, 0)
    const pct = Math.min(Math.max(Number(discountPct) || 0, 0), 100)
    const fromPct = subtotal * (pct / 100)
    const flat = Math.max(Number(discountRs) || 0, 0)
    const discount = Math.min(fromPct + flat, subtotal)
    const tax = (subtotal - discount) * (taxRate / 100)
    const total = subtotal - discount + tax
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
    }
  }, [cart, discountRs, discountPct, taxRate])

  const itemCount = cart.reduce((s, l) => s + l.quantity, 0)

  const addSizedProduct = (product, size) => {
    const pid = String(product._id)
    const lineKey = `${pid}:${size}`
    const unit = sizePrice(product.price, size)
    setCart((prev) => {
      const existing = prev.find((l) => l.lineKey === lineKey)
      const maxQty = product.trackStock ? product.stock : Infinity
      if (existing) {
        if (existing.quantity >= maxQty) {
          toast.error(`Only ${product.stock} of ${product.name} in stock`)
          return prev
        }
        return prev.map((l) => (l.lineKey === lineKey ? { ...l, quantity: l.quantity + 1 } : l))
      }
      if (maxQty < 1) {
        toast.error(`${product.name} is out of stock`)
        return prev
      }
      return [
        ...prev,
        {
          lineKey,
          productId: pid,
          name: product.name,
          image: product.image,
          size,
          price: unit,
          quantity: 1,
          trackStock: product.trackStock,
          stock: product.stock,
        },
      ]
    })
    setSizeProduct(null)
    setCartOpen(true)
  }

  const changeQty = (lineKey, delta) => {
    setCart((prev) => {
      const line = prev.find((l) => l.lineKey === lineKey)
      if (!line) return prev
      const next = line.quantity + delta
      if (next <= 0) return prev.filter((l) => l.lineKey !== lineKey)
      const maxQty = line.trackStock ? line.stock : Infinity
      if (next > maxQty) {
        toast.error(`Only ${line.stock} in stock`)
        return prev
      }
      return prev.map((l) => (l.lineKey === lineKey ? { ...l, quantity: next } : l))
    })
  }

  const removeLine = (lineKey) => setCart((prev) => prev.filter((l) => l.lineKey !== lineKey))

  const clearCart = useCallback(() => {
    setCart([])
    setTable('')
    setDiscountRs('')
    setDiscountPct('')
    setOrderType('Dine In')
    setSavedOrder(null)
    setCheckoutKey(null)
  }, [])

  const openCheckout = () => {
    if (cart.length === 0) {
      toast.error('Add at least one item first')
      return
    }
    if (!checkoutKey) setCheckoutKey(genKey())
    setCheckoutOpen(true)
  }

  const persistSale = async ({ waiter, amountPaid, printType }) => {
    const body = {
      orderType,
      items: cart.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        size: l.size,
        notes: '',
      })),
      table: orderType === 'Dine In' && table ? table : undefined,
      discount: Number(discountRs) > 0 ? Number(discountRs) : undefined,
      discountPercent: Number(discountPct) > 0 ? Number(discountPct) : undefined,
      waiter,
      printType,
      payment: {
        method: 'cash',
        received: Number(amountPaid) || 0,
      },
      idempotencyKey: checkoutKey || genKey(),
    }

    if (savedOrder) return savedOrder

    const { data } = await api.post('/pos/sales', body)
    setSavedOrder(data)
    return data
  }

  const finishAndPrint = async ({ waiter, amountPaid }, kind) => {
    const printer = readPrinterSettings()
    setProcessing(true)
    try {
      const order = await persistSale({
        waiter,
        amountPaid,
        printType: kind === 'bill' ? 'bill' : 'kot',
      })
      toast.success(`Order #${order.orderNumber} saved`)
      setCheckoutOpen(false)
      clearCart()

      if (kind === 'bill' && printer.printBill !== false) {
        setBillOrder(order)
      } else if (kind === 'kot' && printer.printKot !== false) {
        setKotOrder(order)
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Checkout failed'))
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-lex-900 text-lex-ink">
      <PosHeader itemCount={itemCount} onOpenCart={() => cart.length > 0 && setCartOpen(true)} />

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="shrink-0 space-y-3 px-3 pb-2 pt-3 sm:px-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-lex-faint" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search coffee, food, desserts, boba..."
                aria-label="Search products"
                className="w-full rounded-2xl border border-lex-700 bg-white py-3.5 pl-11 pr-4 text-sm text-lex-ink outline-none transition placeholder:text-lex-faint focus:border-lex-gold/35 focus:shadow-soft"
              />
            </div>

            <div className="lex-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              <CategoryPill
                active={activeCategory === 'all'}
                onClick={() => setActiveCategory('all')}
                label="All Items"
                icon={LayoutGrid}
              />
              {catalog.categories.map((c) => {
                const Icon = categoryIcon(c.name)
                return (
                  <CategoryPill
                    key={c._id}
                    active={activeCategory === String(c._id)}
                    onClick={() => setActiveCategory(String(c._id))}
                    label={c.name}
                    icon={Icon}
                  />
                )
              })}
            </div>
          </div>

          <div className="lex-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-6 sm:px-5">
            {loadingCatalog ? (
              <CardSkeletonGrid
                count={12}
                className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No products found"
                message={query ? `Nothing matches “${query}”.` : 'This category has no available products.'}
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {filtered.map((p) => (
                  <ProductCard key={p._id} product={p} onAdd={(product) => setSizeProduct(product)} />
                ))}
              </div>
            )}
          </div>
        </div>

        {cartOpen && cart.length > 0 && (
          <>
            <button
              type="button"
              aria-label="Close order panel"
              className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px] lg:hidden"
              onClick={() => setCartOpen(false)}
            />
            <aside className="fixed inset-y-0 right-0 z-50 w-[92%] max-w-md overflow-hidden bg-white shadow-panel lg:static lg:z-auto lg:w-[380px] lg:max-w-none lg:shrink-0 lg:shadow-none">
              <div className="h-full">
                <OrderPanel
                  cart={cart}
                  totals={totals}
                  taxRate={taxRate}
                  orderType={orderType}
                  setOrderType={setOrderType}
                  table={table}
                  setTable={setTable}
                  discountRs={discountRs}
                  setDiscountRs={setDiscountRs}
                  discountPct={discountPct}
                  setDiscountPct={setDiscountPct}
                  onClear={clearCart}
                  onQty={changeQty}
                  onRemove={removeLine}
                  onCheckout={openCheckout}
                  onCloseDrawer={() => setCartOpen(false)}
                />
              </div>
            </aside>
          </>
        )}
      </div>

      <SizePickerModal
        open={Boolean(sizeProduct)}
        product={sizeProduct}
        onClose={() => setSizeProduct(null)}
        onSelect={(size) => addSizedProduct(sizeProduct, size)}
      />

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => !processing && setCheckoutOpen(false)}
        totals={totals}
        processing={processing}
        onConfirmBill={(payload) => finishAndPrint(payload, 'bill')}
        onConfirmKot={(payload) => finishAndPrint(payload, 'kot')}
      />

      <ReceiptModal
        open={Boolean(billOrder)}
        order={billOrder}
        onClose={() => setBillOrder(null)}
        autoPrint={readPrinterSettings().autoPrintBill !== false}
      />
      <KotPrint open={Boolean(kotOrder)} order={kotOrder} onDone={() => setKotOrder(null)} />
    </div>
  )
}

function CategoryPill({ active, onClick, label, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pos-category-pill ${
        active
          ? 'border-lex-gold bg-lex-gold text-white shadow-soft'
          : 'border-lex-700 bg-white text-lex-muted hover:border-lex-gold/35 hover:text-lex-ink'
      }`}
    >
      {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  )
}
