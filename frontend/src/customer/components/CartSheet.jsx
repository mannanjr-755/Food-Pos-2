import { useEffect, useState } from 'react'
import { Loader2, Minus, Plus, ShoppingBag, X } from 'lucide-react'
import formatCurrency from '../../utils/formatCurrency'
import ProductImage from '../../components/ui/ProductImage'
import { readSession, writeSession } from '../guestSession'

const inputCls =
  'w-full rounded-xl border border-lex-700 bg-lex-900 px-3 py-2.5 text-sm text-lex-ink outline-none transition placeholder:text-lex-faint focus:border-lex-gold/55 focus:bg-white'

export default function CartSheet({ open, onClose, items, lines, symbol, onQuantity, onSubmit, submitting, error }) {
  const [customer, setCustomer] = useState(() => {
    const stored = readSession('customer', null)
    return stored && typeof stored === 'object' ? stored : { name: '', phone: '' }
  })
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const cart = items
    .filter((item) => lines[item.id] > 0)
    .map((item) => ({ ...item, quantity: lines[item.id] }))
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  function submit(e) {
    e.preventDefault()
    writeSession('customer', customer)
    onSubmit({ customer, notes })
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label="Your order">
      <button type="button" aria-label="Close order" onClick={onClose} className="absolute inset-0 bg-lex-ink/45 backdrop-blur-[2px]" />

      <form
        onSubmit={submit}
        className="lex-scale-in relative max-h-[88vh] overflow-y-auto rounded-t-3xl bg-lex-850 px-4 pb-5 pt-3 shadow-panel"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <ShoppingBag className="h-4 w-4 text-lex-gold" />
            Your order
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="lex-press rounded-full p-2 text-lex-muted hover:bg-lex-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {cart.length === 0 ? (
          <p className="py-8 text-center text-sm text-lex-faint">Nothing added yet. Pick something from the menu.</p>
        ) : (
          <ul className="divide-y divide-lex-700">
            {cart.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-2.5">
                <ProductImage src={item.image} alt={item.name} className="h-11 w-11 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-lex-muted">{formatCurrency(item.price * item.quantity, symbol)}</p>
                </div>
                <div className="flex items-center gap-1 rounded-full border border-lex-700 bg-lex-900 p-1">
                  <button
                    type="button"
                    onClick={() => onQuantity(item.id, item.quantity - 1)}
                    aria-label={`Remove one ${item.name}`}
                    className="lex-press flex h-7 w-7 items-center justify-center rounded-full bg-lex-850 text-lex-gold"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-5 text-center text-sm font-bold tabular-nums">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => onQuantity(item.id, item.quantity + 1)}
                    aria-label={`Add one ${item.name}`}
                    className="lex-press flex h-7 w-7 items-center justify-center rounded-full bg-gold-gradient text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {cart.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-lex-faint">Name</span>
                <input
                  className={inputCls}
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  placeholder="e.g. Bilal"
                  maxLength={60}
                  autoComplete="name"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-lex-faint">Phone (optional)</span>
                <input
                  className={inputCls}
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  placeholder="03xx xxxxxxx"
                  inputMode="tel"
                  maxLength={24}
                  autoComplete="tel"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-lex-faint">Notes for the kitchen</span>
              <textarea
                className={`${inputCls} min-h-16 resize-y`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Extra charcoal, no chilli, split the plate…"
                maxLength={500}
              />
            </label>

            <div className="flex items-baseline justify-between border-t border-lex-700 pt-3">
              <span className="text-sm text-lex-muted">Subtotal</span>
              <span className="font-display text-xl font-bold">{formatCurrency(subtotal, symbol)}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-lex-faint">
              Taxes are added at the counter and you pay your server at the table. Prices come from the kitchen, never from this page.
            </p>

            {error && (
              <p role="alert" className="rounded-xl border border-lex-error/30 bg-lex-error/5 px-3 py-2 text-xs font-semibold text-lex-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || cart.length === 0}
              className="lex-press flex w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-gold-glow disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Sending…' : 'Send order to the kitchen'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
