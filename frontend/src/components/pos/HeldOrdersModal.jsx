import Modal from '../ui/Modal'
import { Play, Trash2, PauseCircle } from 'lucide-react'
import formatCurrency from '../../utils/formatCurrency'
import { formatClock } from '../../utils/datetime'
import EmptyState from '../ui/EmptyState'

export default function HeldOrdersModal({ open, onClose, orders, onResume, onDiscard }) {
  return (
    <Modal open={open} onClose={onClose} title="Held Orders" size="md">
      {!orders || orders.length === 0 ? (
        <EmptyState icon={PauseCircle} title="No held orders" message="Use Hold to park a cart and free up the terminal." />
      ) : (
        <div className="lex-fade-in space-y-2.5">
          {orders.map((o) => {
            const count = (o.items || []).reduce((s, i) => s + (i.quantity || 0), 0)
            return (
              <div
                key={o._id}
                className="flex items-center justify-between gap-3 rounded-xl border border-lex-700 bg-lex-900 p-3.5 shadow-card transition hover:border-lex-gold/30"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-lex-gold-light">#{o.orderNumber}</p>
                  <p className="truncate text-xs text-lex-muted">
                    {o.orderType} · {count} item{o.count === 1 ? '' : 's'} · {formatCurrency(o.total)}
                  </p>
                  <p className="text-[11px] tabular-nums text-lex-faint">{formatClock(new Date(o.updatedAt || o.createdAt))}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => onResume(o)}
                    className="lex-press flex items-center gap-1.5 rounded-lg bg-gold-gradient px-3 py-1.5 text-sm font-semibold text-white shadow-gold-glow transition hover:brightness-110"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Resume
                  </button>
                  <button
                    type="button"
                    aria-label={`Discard order ${o.orderNumber}`}
                    onClick={() => onDiscard(o._id)}
                    className="lex-press flex items-center rounded-lg border border-red-400/30 px-2.5 py-1.5 text-lex-error transition hover:bg-red-400/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
