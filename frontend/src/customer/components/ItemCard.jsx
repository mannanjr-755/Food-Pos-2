import { Minus, Plus, Star } from 'lucide-react'
import formatCurrency from '../../utils/formatCurrency'
import ProductImage from '../../components/ui/ProductImage'

function Stepper({ quantity, onChange, label }) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-lex-700 bg-lex-900 p-1">
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        aria-label={`Remove one ${label}`}
        className="lex-press flex h-8 w-8 items-center justify-center rounded-full bg-lex-850 text-lex-gold shadow-sm"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-6 text-center text-sm font-bold tabular-nums">{quantity}</span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        aria-label={`Add one ${label}`}
        className="lex-press flex h-8 w-8 items-center justify-center rounded-full bg-gold-gradient text-white"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function ItemCard({ item, symbol, quantity, onQuantity, canAdd }) {
  const soldOut = item.soldOut === true
  const blocked = soldOut || (!canAdd && quantity === 0)

  return (
    <article className="lex-fade-in flex gap-3 rounded-2xl border border-lex-700 bg-lex-850 p-3 shadow-card">
      <ProductImage
        src={item.image}
        alt={item.name}
        className={`h-20 w-20 shrink-0 rounded-xl sm:h-24 sm:w-24 ${soldOut ? 'opacity-45' : ''}`}
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="text-[15px] font-bold leading-snug">{item.name}</h3>
          {item.popular && (
            <span className="flex items-center gap-1 rounded-full bg-lex-gold-pale px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-lex-gold">
              <Star className="h-2.5 w-2.5 fill-current" />
              Popular
            </span>
          )}
        </div>

        {item.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-lex-muted">{item.description}</p>
        )}

        <div className="mt-2.5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-base font-bold text-lex-gold">{formatCurrency(item.price, symbol)}</p>
            {soldOut ? (
              <p className="text-[11px] font-semibold text-lex-error">Sold out for now</p>
            ) : item.lowStock ? (
              <p className="text-[11px] font-semibold text-lex-warning">Only a few left</p>
            ) : null}
          </div>

          {quantity > 0 ? (
            <Stepper quantity={quantity} onChange={onQuantity} label={item.name} />
          ) : (
            <button
              type="button"
              disabled={blocked}
              onClick={() => onQuantity(1)}
              className="lex-press rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider text-white disabled:cursor-not-allowed disabled:bg-lex-600 enabled:bg-gold-gradient"
            >
              {soldOut ? 'Sold out' : 'Add'}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
