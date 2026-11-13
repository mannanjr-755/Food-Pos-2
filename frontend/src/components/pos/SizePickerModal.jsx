import Modal from '../ui/Modal'
import ProductImage from '../ui/ProductImage'
import formatCurrency from '../../utils/formatCurrency'

export default function SizePickerModal({ open, product, onClose, onSelect }) {
  if (!product) return null
  const half = Math.round(product.price * 0.5 * 100) / 100
  const full = product.price

  return (
    <Modal open={open} onClose={onClose} title="Select size" size="sm">
      <div className="mb-5 flex items-center gap-3">
        <ProductImage src={product.image} alt={product.name} className="h-16 w-16 shrink-0 rounded-xl" />
        <div className="min-w-0">
          <p className="truncate font-bold text-lex-ink">{product.name}</p>
          <p className="text-sm text-lex-muted">Choose Half or Full portion</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onSelect('Half')}
          className="lex-press rounded-2xl border border-lex-700 bg-lex-800 px-4 py-5 text-left transition hover:border-lex-gold/40 hover:bg-lex-gold-pale"
        >
          <p className="text-sm font-bold text-lex-ink">Half</p>
          <p className="mt-2 text-lg font-extrabold tabular-nums text-lex-gold">{formatCurrency(half)}</p>
        </button>
        <button
          type="button"
          onClick={() => onSelect('Full')}
          className="lex-press rounded-2xl border border-lex-700 bg-lex-800 px-4 py-5 text-left transition hover:border-lex-gold/40 hover:bg-lex-gold-pale"
        >
          <p className="text-sm font-bold text-lex-ink">Full</p>
          <p className="mt-2 text-lg font-extrabold tabular-nums text-lex-gold">{formatCurrency(full)}</p>
        </button>
      </div>
    </Modal>
  )
}
