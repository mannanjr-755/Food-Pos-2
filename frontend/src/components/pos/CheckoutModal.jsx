import { useEffect, useMemo, useState } from 'react'
import { Loader2, Printer } from 'lucide-react'
import Modal from '../ui/Modal'
import formatCurrency, { currencySymbol } from '../../utils/formatCurrency'

export const WAITERS = ['MAMA', 'Gulzaib', 'Armir', 'Haseeb', 'Waqar']

export default function CheckoutModal({
  open,
  onClose,
  subtotal,
  taxRate,
  processing,
  initialDiscountPct = '',
  initialDiscountRs = '',
  onConfirm,
}) {
  const [waiter, setWaiter] = useState('')
  const [amountPaid, setAmountPaid] = useState('')
  const [discountPct, setDiscountPct] = useState('')
  const [discountRs, setDiscountRs] = useState('')

  const totals = useMemo(() => {
    const pct = Math.min(Math.max(Number(discountPct) || 0, 0), 100)
    const fromPct = subtotal * (pct / 100)
    const flat = Math.max(Number(discountRs) || 0, 0)
    const discount = Math.min(fromPct + flat, subtotal)
    const tax = (subtotal - discount) * ((Number(taxRate) || 0) / 100)
    const total = subtotal - discount + tax
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      discountPct: pct,
      discountRs: flat,
    }
  }, [subtotal, discountPct, discountRs, taxRate])

  useEffect(() => {
    if (open) {
      setWaiter('')
      setDiscountPct(String(initialDiscountPct || ''))
      setDiscountRs(String(initialDiscountRs || ''))
      setAmountPaid('')
    }
  }, [open, initialDiscountPct, initialDiscountRs])

  useEffect(() => {
    if (open) setAmountPaid(String(totals.total || ''))
  }, [open, totals.total])

  const paid = Number(amountPaid) || 0
  const due = Math.max(Math.round((totals.total - paid) * 100) / 100, 0)
  const change = Math.max(Math.round((paid - totals.total) * 100) / 100, 0)
  const canConfirm = Boolean(waiter) && !processing

  return (
    <Modal open={open} onClose={() => !processing && onClose?.()} title="Checkout – Bill & KOT" size="md">
      <div className="mb-4 rounded-2xl border border-lex-700 bg-lex-800 px-4 py-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-lex-muted">Order total</p>
        <p className="text-3xl font-extrabold tabular-nums text-lex-gold">{formatCurrency(totals.total)}</p>
      </div>

      <p className="mb-2 text-sm font-semibold text-lex-ink">Assign waiter</p>
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {WAITERS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setWaiter(name)}
            className={`lex-press rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              waiter === name
                ? 'bg-lex-gold text-white shadow-soft'
                : 'border border-lex-700 bg-white text-lex-ink hover:border-lex-gold/35'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-lex-ink">Discount (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={discountPct}
            onChange={(e) => setDiscountPct(e.target.value)}
            className="lex-input font-semibold tabular-nums"
            placeholder="0"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-lex-ink">Discount (Rs.)</label>
          <input
            type="number"
            min="0"
            value={discountRs}
            onChange={(e) => setDiscountRs(e.target.value)}
            className="lex-input font-semibold tabular-nums"
            placeholder="0"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-lex-ink">Amount Paid</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-lex-faint">{currencySymbol()}</span>
            <input
              type="number"
              min="0"
              step="1"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="lex-input pl-10 font-semibold tabular-nums"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-lex-ink">Due Amount</label>
          <div className="rounded-xl border border-lex-700 bg-lex-900 px-4 py-3 text-lg font-bold tabular-nums text-lex-ink">
            {formatCurrency(due)}
          </div>
        </div>
      </div>

      {change > 0 && <p className="mt-2 text-sm font-medium text-lex-success">Change: {formatCurrency(change)}</p>}
      {totals.discount > 0 && (
        <p className="mt-1 text-xs text-lex-muted">Discount applied: {formatCurrency(totals.discount)}</p>
      )}
      {!waiter && <p className="mt-3 text-xs font-medium text-lex-error">Select a waiter to continue.</p>}

      <button
        type="button"
        disabled={!canConfirm}
        onClick={() =>
          onConfirm({
            waiter,
            amountPaid: paid,
            due,
            change,
            discountPct: totals.discountPct,
            discountRs: totals.discountRs,
            totals,
          })
        }
        className="lex-btn-primary mt-6 w-full py-3.5 text-base disabled:opacity-50"
      >
        {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Printer className="h-5 w-5" />}
        Checkout – Bill & KOT
      </button>
    </Modal>
  )
}
