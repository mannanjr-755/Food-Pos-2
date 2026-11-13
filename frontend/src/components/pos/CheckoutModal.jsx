import { useEffect, useMemo, useState } from 'react'
import { Loader2, Printer, Ticket } from 'lucide-react'
import Modal from '../ui/Modal'
import formatCurrency, { currencySymbol } from '../../utils/formatCurrency'

export const WAITERS = ['MAMA', 'Gulzaib', 'Armir', 'Haseeb', 'Waqar']

export default function CheckoutModal({
  open,
  onClose,
  totals,
  processing,
  onConfirmBill,
  onConfirmKot,
}) {
  const [waiter, setWaiter] = useState('')
  const [amountPaid, setAmountPaid] = useState('')

  useEffect(() => {
    if (open) {
      setWaiter('')
      setAmountPaid(String(totals.total || ''))
    }
  }, [open, totals.total])

  const paid = Number(amountPaid) || 0
  const due = useMemo(() => Math.max(Math.round((totals.total - paid) * 100) / 100, 0), [totals.total, paid])
  const change = useMemo(() => Math.max(Math.round((paid - totals.total) * 100) / 100, 0), [totals.total, paid])
  const canConfirm = Boolean(waiter) && !processing

  const payload = () => ({
    waiter,
    amountPaid: paid,
    due,
    change,
  })

  return (
    <Modal open={open} onClose={() => !processing && onClose?.()} title="Checkout" size="md">
      <div className="mb-4 rounded-2xl border border-lex-700 bg-lex-800 px-4 py-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-lex-muted">Order total</p>
        <p className="text-3xl font-extrabold tabular-nums text-lex-gold">{formatCurrency(totals.total)}</p>
      </div>

      <p className="mb-2 text-sm font-semibold text-lex-ink">Assign waiter</p>
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
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

      {change > 0 && (
        <p className="mt-2 text-sm font-medium text-lex-success">Change: {formatCurrency(change)}</p>
      )}
      {!waiter && <p className="mt-3 text-xs font-medium text-lex-error">Select a waiter to continue.</p>}

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={!canConfirm}
          onClick={() => onConfirmBill(payload())}
          className="lex-btn-primary py-3 disabled:opacity-50"
        >
          {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
          Confirm Bill
        </button>
        <button
          type="button"
          disabled={!canConfirm}
          onClick={() => onConfirmKot(payload())}
          className="lex-btn-secondary py-3 disabled:opacity-50"
        >
          {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ticket className="h-4 w-4" />}
          Confirm KOT
        </button>
      </div>
    </Modal>
  )
}
