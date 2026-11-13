import { useEffect, useMemo, useState } from 'react'
import Modal from '../ui/Modal'
import { Banknote, CreditCard, Globe, Loader2 } from 'lucide-react'
import formatCurrency, { currencySymbol } from '../../utils/formatCurrency'

const METHODS = [
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'online', label: 'Online', icon: Globe },
]

export default function PaymentModal({ open, onClose, total, processing, onSubmit }) {
  const [method, setMethod] = useState('cash')
  const [received, setReceived] = useState('')

  useEffect(() => {
    if (open) {
      setMethod('cash')
      setReceived('')
    }
  }, [open])

  const totalNum = Number(total) || 0
  const receivedNum = Number(received) || 0
  const change = useMemo(() => Math.max(receivedNum - totalNum, 0), [receivedNum, totalNum])
  const enough = method !== 'cash' || receivedNum >= totalNum

  const quickValues = useMemo(() => {
    const set = new Set([totalNum])
    const round = [50, 100, 500, 1000, 5000]
    for (const r of round) {
      const up = Math.ceil(totalNum / r) * r
      if (up >= totalNum) set.add(up)
    }
    return Array.from(set)
      .filter((v) => v > 0)
      .sort((a, b) => a - b)
      .slice(0, 5)
  }, [totalNum])

  const submit = () => {
    if (!enough || processing) return
    onSubmit({ method, received: method === 'cash' ? receivedNum : undefined })
  }

  return (
    <Modal open={open} onClose={onClose} title="Take Payment" size="sm">
      <div className="mb-4 rounded-xl border border-lex-gold/20 bg-lex-900 px-4 py-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-lex-muted">Amount due</p>
        <p className="font-display text-3xl font-bold tabular-nums text-lex-gold">{formatCurrency(totalNum)}</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {METHODS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMethod(id)}
            className={`lex-press flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-sm font-semibold transition-all duration-150 ${
              method === id
                ? 'bg-gold-gradient text-white shadow-gold-glow'
                : 'border border-lex-700 bg-lex-900 text-lex-muted hover:border-lex-gold/40 hover:text-lex-ink'
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </div>

      {method === 'cash' && (
        <div className="mt-5">
          <label htmlFor="received" className="mb-1.5 block text-sm font-medium text-lex-ink">
            Amount received
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-lex-faint">{currencySymbol()}</span>
            <input
              id="received"
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              value={received}
              onChange={(e) => setReceived(e.target.value)}
              placeholder="0"
              autoFocus
              className="w-full rounded-xl border border-lex-gold/20 bg-lex-900 py-3 pl-10 pr-4 text-lg font-semibold tabular-nums text-lex-ink outline-none transition placeholder:text-lex-faint focus:border-lex-gold/60 focus:shadow-gold-glow"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {quickValues.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setReceived(String(v))}
                className="lex-press rounded-lg border border-lex-gold/20 bg-lex-900 px-3 py-1.5 text-sm font-semibold tabular-nums text-lex-gold transition hover:border-lex-gold/50 hover:bg-lex-gold/10"
              >
                {formatCurrency(v)}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-400/10 px-4 py-2.5 text-sm ring-1 ring-emerald-600/20">
            <span className="font-medium text-emerald-700">Change due</span>
            <span className="font-display text-lg font-bold tabular-nums text-emerald-700">{formatCurrency(change)}</span>
          </div>
          {!enough && received !== '' && (
            <p className="mt-2 text-xs font-medium text-lex-error">Received amount is less than the total due.</p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!enough || processing}
        className="lex-press mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient py-3.5 font-bold text-white shadow-gold-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {processing && <Loader2 className="h-5 w-5 animate-spin" />}
        {processing ? 'Processing…' : `Confirm ${formatCurrency(totalNum)}`}
      </button>
    </Modal>
  )
}
