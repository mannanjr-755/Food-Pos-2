import formatCurrency from '../../utils/formatCurrency'
import ProductImage from '../ui/ProductImage'

function stockMeta(product) {
  if (!product.available) return { disabled: true, label: 'Unavailable', tone: 'out' }
  if (!product.trackStock) return { disabled: false, label: 'In stock', tone: 'ok' }
  if (product.stock <= 0) return { disabled: true, label: 'Out of stock', tone: 'out' }
  if (product.stock <= (product.lowStockThreshold || 0)) {
    return { disabled: false, label: `${product.stock} left`, tone: 'low' }
  }
  return { disabled: false, label: `${product.stock} in stock`, tone: 'ok' }
}

export default function ProductCard({ product, onAdd }) {
  const stock = stockMeta(product)
  const categoryName = product.category?.name || 'Menu'
  const description =
    product.description?.trim() ||
    `Freshly prepared ${product.name?.toLowerCase() || 'item'} from our kitchen.`

  return (
    <button
      type="button"
      disabled={stock.disabled}
      onClick={() => onAdd(product)}
      className={`lex-press group flex h-full flex-col overflow-hidden rounded-2xl border border-lex-700 bg-white text-left shadow-soft transition hover:-translate-y-0.5 hover:border-lex-gold/35 hover:shadow-card disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-lex-800">
        <ProductImage
          src={product.image}
          alt={product.name}
          className="h-full w-full"
          imgClassName="transition-transform duration-300 group-hover:scale-105"
        />

        <span className="absolute bottom-2.5 left-2.5 rounded-lg bg-lex-gold px-2.5 py-1 text-xs font-bold tabular-nums text-white shadow-soft">
          {formatCurrency(product.price)}
        </span>

        {Array.isArray(product.sizes) && product.sizes.length > 0 && (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-lex-gold shadow-soft ring-1 ring-lex-700">
            {product.sizes.length} sizes
          </span>
        )}

        {stock.tone !== 'ok' && (
          <span
            className={`absolute left-2.5 top-2.5 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-soft ${
              stock.tone === 'low'
                ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
                : 'bg-red-600 text-white'
            }`}
          >
            {stock.label}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-lex-ink" title={product.name}>
          {product.name}
        </h3>
        <p className="line-clamp-2 text-xs leading-relaxed text-lex-muted">{description}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="truncate rounded-full bg-lex-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-lex-gold">
            {categoryName}
          </span>
          <span className="shrink-0 text-[11px] font-semibold tabular-nums text-lex-faint">{stock.label}</span>
        </div>
      </div>
    </button>
  )
}
