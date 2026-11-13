import { Trash2, X } from 'lucide-react'
import formatCurrency from '../../utils/formatCurrency'
import ProductImage from '../ui/ProductImage'

const ORDER_TYPES = ['Dine In', 'Takeaway', 'Delivery']

export default function OrderPanel({
  cart,
  totals,
  taxRate,
  orderType,
  setOrderType,
  table,
  setTable,
  discountRs,
  setDiscountRs,
  discountPct,
  setDiscountPct,
  onClear,
  onQty,
  onRemove,
  onCheckout,
  onCloseDrawer,
}) {
  const empty = cart.length === 0
  const itemCount = cart.reduce((s, l) => s + l.quantity, 0)

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border-l border-lex-700 bg-white">
      <div className="flex shrink-0 items-center justify-between border-b border-lex-700 bg-lex-900/40 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold tracking-tight text-lex-ink">Current Order</h2>
          {!empty && (
            <span className="rounded-full bg-lex-gold-pale px-2 py-0.5 text-[11px] font-bold tabular-nums text-lex-gold ring-1 ring-lex-700">
              {itemCount} items
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onClear}
            disabled={empty}
            className="lex-press flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-lex-muted transition hover:bg-red-50 hover:text-lex-error disabled:opacity-40"
          >
            Clear <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Close order panel"
            onClick={onCloseDrawer}
            className="rounded-lg p-1 text-lex-muted transition hover:bg-lex-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="lex-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
        <div className="mb-3 grid grid-cols-3 gap-1.5">
          {ORDER_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setOrderType(t)}
              className={`lex-press rounded-xl py-2 text-xs font-semibold transition ${
                orderType === t
                  ? 'bg-lex-gold text-white shadow-soft'
                  : 'border border-lex-700 bg-lex-900 text-lex-muted hover:border-lex-gold/35 hover:text-lex-ink'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {orderType === 'Dine In' && (
          <input
            value={table}
            onChange={(e) => setTable(e.target.value)}
            placeholder="Table number (optional)"
            className="lex-input mb-3 py-2"
          />
        )}

        {empty ? (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-lex-muted">No items yet</p>
            <p className="mt-1 text-xs text-lex-faint">Select a product and size to start.</p>
          </div>
        ) : (
          <ul className="lex-fade-in divide-y divide-lex-700">
            {cart.map((line) => (
              <li key={line.lineKey} className="flex items-start gap-3 py-3">
                <ProductImage
                  src={line.image}
                  alt={line.name}
                  className="h-12 w-12 shrink-0 rounded-xl ring-1 ring-lex-700"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-lex-ink">{line.name}</p>
                      <p className="text-[11px] font-semibold text-lex-gold">{line.size}</p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${line.name}`}
                      onClick={() => onRemove(line.lineKey)}
                      className="rounded p-0.5 text-lex-faint transition hover:text-lex-error"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs tabular-nums text-lex-muted">{formatCurrency(line.price)} each</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => onQty(line.lineKey, -1)}
                        className="lex-press flex h-7 w-7 items-center justify-center rounded-lg border border-lex-700 text-sm font-bold text-lex-gold transition hover:bg-lex-800"
                      >
                        −
                      </button>
                      <span className="w-7 text-center text-sm font-bold tabular-nums text-lex-ink">{line.quantity}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => onQty(line.lineKey, 1)}
                        className="lex-press flex h-7 w-7 items-center justify-center rounded-lg border border-lex-700 text-sm font-bold text-lex-gold transition hover:bg-lex-800"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-lex-gold">
                      {formatCurrency(line.price * line.quantity)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {!empty && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-lex-muted">Discount (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={discountPct}
                onChange={(e) => setDiscountPct(e.target.value)}
                placeholder="0"
                className="lex-input py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-lex-muted">Discount (Rs.)</label>
              <input
                type="number"
                min="0"
                value={discountRs}
                onChange={(e) => setDiscountRs(e.target.value)}
                placeholder="0"
                className="lex-input py-2"
              />
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-lex-700 bg-lex-900/50 px-4 py-3">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-lex-muted">
            <span>Subtotal</span>
            <span className="tabular-nums text-lex-ink">{formatCurrency(totals.subtotal)}</span>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-lex-muted">
              <span>Discount</span>
              <span className="tabular-nums text-lex-ink">-{formatCurrency(totals.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lex-muted">
            <span>Tax ({taxRate}%)</span>
            <span className="tabular-nums text-lex-ink">{formatCurrency(totals.tax)}</span>
          </div>
          <div className="mt-1 flex items-end justify-between border-t border-dashed border-lex-700 pt-2">
            <span className="text-lg font-bold text-lex-ink">Total</span>
            <span className="text-2xl font-extrabold tabular-nums text-lex-gold">{formatCurrency(totals.total)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onCheckout}
          disabled={empty}
          className="lex-btn-primary mt-3 w-full py-3.5 text-base disabled:opacity-40"
        >
          Checkout
        </button>
      </div>
    </div>
  )
}
