import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Check,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api, { apiErrorMessage } from '../services/api'
import { useRealtime } from '../contexts/RealtimeContext'
import formatCurrency from '../utils/formatCurrency'
import ProductImage from '../components/ui/ProductImage'
import StatusBadge from '../components/ui/StatusBadge'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import { CardSkeletonGrid } from '../components/ui/Skeletons'

function stockInfo(p) {
  if (!p.trackStock) return { label: 'Untracked', tone: 'gray' }
  if (p.stock <= 0) return { label: 'Out of stock', tone: 'red' }
  if (p.stock <= (p.lowStockThreshold || 0)) return { label: `Low · ${p.stock}`, tone: 'amber' }
  return { label: `In stock · ${p.stock}`, tone: 'green' }
}

const inputCls =
  'rounded-lg border border-lex-700 bg-lex-900 px-3 py-2 text-sm text-lex-ink outline-none transition placeholder:text-lex-faint focus:border-lex-gold/55 focus:bg-white'

const emptyDraft = {
  name: '',
  description: '',
  price: '',
  categoryId: '',
  imageUrl: '',
  isAvailable: true,
  isPopular: false,
  trackStock: false,
  stock: '',
  lowStockThreshold: '10',
  sortOrder: '0',
}

function ImageField({ value, onChange }) {
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)

  const pick = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Images must be 2 MB or smaller.')
      return
    }
    setBusy(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post('/images', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      onChange(data.url)
      toast.success('Image uploaded')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Upload failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-lex-ink">Photo</span>
      <div className="flex items-center gap-3">
        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-lex-700">
          <ProductImage src={value} alt="" className="h-full w-full" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="lex-press flex items-center gap-1.5 rounded-lg border border-lex-700 bg-lex-900 px-3 py-2 text-xs font-semibold text-lex-ink transition hover:border-lex-gold/40 hover:bg-lex-800 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
            {value ? 'Replace image' : 'Upload image'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="lex-press flex items-center gap-1.5 rounded-lg border border-lex-700 px-3 py-2 text-xs font-semibold text-lex-muted transition hover:border-lex-error/50 hover:text-lex-error"
            >
              <X className="h-3.5 w-3.5" /> Remove
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={pick} />
      </div>
      <p className="mt-1.5 text-[11px] text-lex-faint">JPG, PNG, WEBP or GIF · 2 MB max · shows on the POS and the table QR menu.</p>
    </div>
  )
}

export default function Menu() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const category = params.get('category') || 'all'
  const available = params.get('available') || 'all'
  const sort = params.get('sort') || 'name'

  const [search, setSearch] = useState(q)
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState(emptyDraft)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const categoryNames = useMemo(() => {
    const map = new Map()
    for (const c of categories) map.set(String(c._id), c.name)
    return map
  }, [categories])

  const loadCategories = useCallback(() => {
    api.get('/categories').then(({ data }) => setCategories(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  const loadProducts = useCallback(
    () => {
      setLoading(true)
      const p = { sort }
      if (search.trim()) p.search = search.trim()
      if (category !== 'all') p.category = category
      if (available === 'available') p.available = 'true'
      if (available === 'unavailable') p.available = 'false'
      api
        .get('/products', { params: p })
        .then(({ data }) => setProducts(Array.isArray(data) ? data : []))
        .catch((err) => toast.error(apiErrorMessage(err, 'Could not load menu')))
        .finally(() => setLoading(false))
    },
    [sort, search, category, available]
  )

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const { subscribeCatalog } = useRealtime()

  useEffect(
    () =>
      subscribeCatalog(() => {
        loadCategories()
        loadProducts()
      }),
    [subscribeCatalog, loadCategories, loadProducts]
  )

  useEffect(() => {
    setSearch(q)
  }, [q])

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (!value || value === 'all') next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  useEffect(() => {
    const t = setTimeout(loadProducts, 250)
    return () => clearTimeout(t)
  }, [loadProducts])

  const activeCategoryName = useMemo(
    () => categories.find((c) => String(c._id) === category)?.name,
    [categories, category]
  )

  const clearFilters = () => {
    setParams({}, { replace: true })
    setSearch('')
  }
  const hasFilters = Boolean(q || category !== 'all' || available !== 'all' || sort !== 'name')

  const startCreate = () => {
    setDraft({ ...emptyDraft, categoryId: categories[0] ? String(categories[0]._id) : '' })
    setEditing('new')
  }

  const startEdit = (product) => {
    setDraft({
      name: product.name || '',
      description: product.description || '',
      price: String(product.price ?? ''),
      categoryId: String(product.category?._id || ''),
      imageUrl: product.image || '',
      isAvailable: Boolean(product.available),
      isPopular: Boolean(product.popular),
      trackStock: Boolean(product.trackStock),
      stock: product.trackStock ? String(product.stock ?? 0) : '',
      lowStockThreshold: String(product.lowStockThreshold ?? 10),
      sortOrder: String(product.sortOrder ?? 0),
    })
    setEditing(product)
  }

  const payload = () => ({
    name: draft.name.trim(),
    description: draft.description.trim(),
    price: Number(draft.price),
    category: draft.categoryId,
    image: draft.imageUrl,
    available: draft.isAvailable,
    popular: draft.isPopular,
    trackStock: draft.trackStock,
    stock: draft.trackStock ? Number(draft.stock || 0) : 0,
    lowStockThreshold: Number(draft.lowStockThreshold || 0),
    sortOrder: Number(draft.sortOrder || 0),
  })

  const saveItem = async (event) => {
    event.preventDefault()
    if (draft.name.trim().length < 2) {
      toast.error('Give the item a name (at least 2 characters).')
      return
    }
    if (!(Number(draft.price) > 0)) {
      toast.error('Price must be greater than zero.')
      return
    }
    if (!draft.categoryId) {
      toast.error('Choose a category.')
      return
    }
    setSaving(true)
    try {
      if (editing === 'new') {
        await api.post('/products', payload())
        toast.success(`${draft.name.trim()} added to the menu`)
      } else {
        await api.patch(`/products/${editing._id}`, payload())
        toast.success(`${draft.name.trim()} updated`)
      }
      setEditing(null)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const toggleAvailable = async (product) => {
    try {
      await api.patch(`/products/${product._id}`, { available: !product.available })
      toast.success(`${product.name} is now ${product.available ? 'unavailable' : 'available'}`)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  const removeItem = async () => {
    if (!confirmDelete) return
    setSaving(true)
    try {
      await api.delete(`/products/${confirmDelete._id}`)
      toast.success(`${confirmDelete.name} deleted`)
      setConfirmDelete(null)
      setDetail(null)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const noCategories = categories.length === 0

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="lex-page-title">Menu</h1>
          <p className="lex-page-subtitle">
            One catalogue for the POS and table QR menus — edits go live as soon as you save.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          disabled={noCategories}
          title={noCategories ? 'Add a category first' : undefined}
          className="lex-btn-primary"
        >
          <Plus className="h-4 w-4" /> Add item
        </button>
      </div>

      {noCategories && (
        <p className="rounded-xl border border-amber-600/25 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          A new item needs a category. Create one on the Categories page first.
        </p>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-lex-700 bg-lex-850 p-3 shadow-card">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lex-faint" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setParam('q', e.target.value.trim())
            }}
            placeholder="Search by name or SKU…"
            className={`${inputCls} w-full pl-9 pr-3`}
          />
        </div>
        <div className="flex items-center gap-1.5 text-lex-gold/70">
          <SlidersHorizontal className="h-4 w-4" />
        </div>
        <select value={category} onChange={(e) => setParam('category', e.target.value)} className={inputCls}>
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        <select value={available} onChange={(e) => setParam('available', e.target.value)} className={inputCls}>
          <option value="all">Any availability</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </select>
        <select value={sort} onChange={(e) => setParam('sort', e.target.value)} className={inputCls}>
          <option value="name">Name (A–Z)</option>
          <option value="price">Price (low → high)</option>
          <option value="-price">Price (high → low)</option>
          <option value="newest">Newest</option>
        </select>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="lex-press flex items-center gap-1 rounded-lg border border-lex-700 px-2.5 py-2 text-sm text-lex-muted transition hover:border-lex-gold/40 hover:text-lex-ink"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {activeCategoryName && (
        <p className="text-sm text-lex-muted">
          Showing <span className="font-semibold text-lex-gold">{activeCategoryName}</span>
        </p>
      )}

      {loading ? (
        <CardSkeletonGrid count={8} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />
      ) : products.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No products found"
          message={hasFilters ? 'Try adjusting your search or filters.' : 'Add your first karahi, grill or side to get the menu rolling.'}
          action={
            hasFilters ? null : (
              <button
                type="button"
                onClick={startCreate}
                disabled={noCategories}
                className="lex-press flex items-center gap-2 rounded-xl bg-gold-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-gold-glow transition hover:brightness-110 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" /> Add item
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => {
            const stock = stockInfo(p)
            return (
              <div
                key={p._id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-lex-700 bg-lex-850 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-lex-gold/35 hover:shadow-gold-glow"
              >
                <button type="button" onClick={() => setDetail(p)} className="relative text-left">
                  <ProductImage
                    src={p.image}
                    alt={p.name}
                    className="aspect-video w-full"
                    imgClassName="transition-transform duration-300 group-hover:scale-105"
                  />
                  {!p.available && (
                    <span className="absolute left-2 top-2">
                      <StatusBadge label="Unavailable" tone="red" status="unavailable" />
                    </span>
                  )}
                </button>
                <div className="flex flex-1 flex-col p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-lex-ink">{p.name}</p>
                    <p className="shrink-0 font-semibold tabular-nums text-lex-gold">{formatCurrency(p.price)}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-lex-muted">{categoryNames.get(String(p.category?._id)) || 'Uncategorized'}</p>
                  {p.description && <p className="mt-1.5 line-clamp-2 text-xs text-lex-muted">{p.description}</p>}
                  <div className="mt-3 flex items-center justify-between">
                    <StatusBadge label={stock.label} tone={stock.tone} status={stock.label} />
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleAvailable(p)}
                        title={p.available ? 'Mark unavailable' : 'Mark available'}
                        aria-label={p.available ? `Mark ${p.name} unavailable` : `Mark ${p.name} available`}
                        className="lex-press rounded-lg border border-lex-700 p-1.5 text-lex-muted transition hover:border-lex-gold/40 hover:text-lex-gold"
                      >
                        {p.available ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(p)}
                        aria-label={`Edit ${p.name}`}
                        className="lex-press rounded-lg border border-lex-700 p-1.5 text-lex-muted transition hover:border-lex-gold/40 hover:text-lex-ink"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(p)}
                        aria-label={`Delete ${p.name}`}
                        className="lex-press rounded-lg border border-lex-700 p-1.5 text-lex-muted transition hover:border-lex-error/50 hover:bg-red-50 hover:text-lex-error"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / edit */}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add menu item' : editing && editing !== 'new' ? `Edit ${editing.name}` : ''}
        size="lg"
      >
        <form onSubmit={saveItem} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="item-name" className="mb-1.5 block text-sm font-medium text-lex-ink">Name</label>
              <input
                id="item-name"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                className={`${inputCls} w-full`}
                placeholder="Chicken Karahi (Half)"
                maxLength={80}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="item-desc" className="mb-1.5 block text-sm font-medium text-lex-ink">
                Description <span className="text-lex-faint">(optional)</span>
              </label>
              <textarea
                id="item-desc"
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                rows={2}
                maxLength={200}
                className={`${inputCls} w-full resize-none`}
                placeholder="Slow-cooked tomato, ginger and green chilli."
              />
            </div>
            <div>
              <label htmlFor="item-price" className="mb-1.5 block text-sm font-medium text-lex-ink">Price (PKR)</label>
              <input
                id="item-price"
                type="number"
                min="0"
                step="0.01"
                value={draft.price}
                onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
                className={`${inputCls} w-full tabular-nums`}
                placeholder="1200"
                required
              />
            </div>
            <div>
              <label htmlFor="item-category" className="mb-1.5 block text-sm font-medium text-lex-ink">Category</label>
              <select
                id="item-category"
                value={draft.categoryId}
                onChange={(e) => setDraft((d) => ({ ...d, categoryId: e.target.value }))}
                className={`${inputCls} w-full`}
                required
              >
                <option value="">Choose a category…</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <ImageField value={draft.imageUrl} onChange={(url) => setDraft((d) => ({ ...d, imageUrl: url }))} />

          <div className="flex flex-wrap gap-2">
            <ToggleChip
              active={draft.isAvailable}
              onClick={() => setDraft((d) => ({ ...d, isAvailable: !d.isAvailable }))}
              label={draft.isAvailable ? 'Available to order' : 'Hidden from the QR menus'}
            />
            <ToggleChip
              active={draft.isPopular}
              onClick={() => setDraft((d) => ({ ...d, isPopular: !d.isPopular }))}
              label="Popular on the menu"
            />
            <ToggleChip
              active={draft.trackStock}
              onClick={() => setDraft((d) => ({ ...d, trackStock: !d.trackStock }))}
              label="Track stock"
            />
          </div>

          {draft.trackStock && (
            <div className="grid gap-4 rounded-xl border border-lex-700 bg-lex-900 p-3 sm:grid-cols-3">
              <div>
                <label htmlFor="item-stock" className="mb-1.5 block text-xs font-medium text-lex-muted">Units on hand</label>
                <input
                  id="item-stock"
                  type="number"
                  min="0"
                  step="1"
                  value={draft.stock}
                  onChange={(e) => setDraft((d) => ({ ...d, stock: e.target.value }))}
                  className={`${inputCls} w-full`}
                />
              </div>
              <div>
                <label htmlFor="item-low" className="mb-1.5 block text-xs font-medium text-lex-muted">Low-stock alert</label>
                <input
                  id="item-low"
                  type="number"
                  min="0"
                  step="1"
                  value={draft.lowStockThreshold}
                  onChange={(e) => setDraft((d) => ({ ...d, lowStockThreshold: e.target.value }))}
                  className={`${inputCls} w-full`}
                />
              </div>
              <div>
                <label htmlFor="item-sort" className="mb-1.5 block text-xs font-medium text-lex-muted">Menu order</label>
                <input
                  id="item-sort"
                  type="number"
                  min="0"
                  max="999"
                  value={draft.sortOrder}
                  onChange={(e) => setDraft((d) => ({ ...d, sortOrder: e.target.value }))}
                  className={`${inputCls} w-full`}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="lex-press rounded-xl border border-lex-700 px-4 py-2.5 text-sm font-semibold text-lex-muted transition hover:border-lex-gold/40 hover:text-lex-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="lex-press flex items-center gap-2 rounded-xl bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-gold-glow transition hover:brightness-110 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing === 'new' ? 'Add to menu' : 'Save changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} title="Delete this item?" size="sm">
        {confirmDelete && (
          <div>
            <p className="text-sm text-lex-ink">
              Delete <span className="font-semibold">{confirmDelete.name}</span> from the menu?
            </p>
            <p className="mt-2 text-sm text-lex-muted">
              Items that already appear on orders cannot be deleted — mark them unavailable instead, so order history stays intact.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="lex-press rounded-xl border border-lex-700 px-4 py-2 text-sm font-semibold text-lex-muted transition hover:border-lex-gold/40 hover:text-lex-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={removeItem}
                disabled={saving}
                className="lex-press flex items-center gap-1.5 rounded-xl bg-lex-error px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete item
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title="Product details" size="md">
        {detail && (
          <div>
            <ProductImage
              src={detail.image}
              alt={detail.name}
              className="mb-4 aspect-video w-full rounded-xl ring-1 ring-lex-gold/15"
            />
            <div className="flex items-start justify-between">
              <h3 className="font-display text-xl font-semibold text-lex-ink">{detail.name}</h3>
              <span className="font-display text-xl font-bold tabular-nums text-lex-gold">{formatCurrency(detail.price)}</span>
            </div>
            <p className="mt-1 text-sm text-lex-muted">{categoryNames.get(String(detail.category?._id)) || 'Uncategorized'}</p>
            {detail.description && <p className="mt-3 text-sm text-lex-ink">{detail.description}</p>}
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-lex-700 bg-lex-900 px-3 py-2">
                <dt className="text-xs text-lex-muted">SKU</dt>
                <dd className="font-medium text-lex-ink">{detail.sku || '—'}</dd>
              </div>
              <div className="rounded-lg border border-lex-700 bg-lex-900 px-3 py-2">
                <dt className="text-xs text-lex-muted">Menu order</dt>
                <dd className="font-medium tabular-nums text-lex-ink">{detail.sortOrder ?? 0}</dd>
              </div>
              <div className="rounded-lg border border-lex-700 bg-lex-900 px-3 py-2">
                <dt className="text-xs text-lex-muted">Availability</dt>
                <dd className="mt-0.5"><StatusBadge status={detail.available ? 'active' : 'inactive'} /></dd>
              </div>
              <div className="rounded-lg border border-lex-700 bg-lex-900 px-3 py-2">
                <dt className="text-xs text-lex-muted">Stock</dt>
                <dd className="mt-0.5"><StatusBadge label={stockInfo(detail).label} tone={stockInfo(detail).tone} status="x" /></dd>
              </div>
            </dl>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDetail(null)
                  startEdit(detail)
                }}
                className="lex-press flex items-center gap-1.5 rounded-xl bg-gold-gradient px-4 py-2 text-sm font-semibold text-white shadow-gold-glow transition hover:brightness-110"
              >
                <Pencil className="h-4 w-4" /> Edit item
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function ToggleChip({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`lex-press flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
        active
          ? 'border-lex-gold/40 bg-lex-gold/10 text-lex-gold'
          : 'border-lex-700 bg-lex-900 text-lex-muted hover:border-lex-gold/30 hover:text-lex-ink'
      }`}
    >
      <span className={`flex h-4 w-4 items-center justify-center rounded-md ring-1 ${active ? 'bg-lex-gold ring-lex-gold' : 'ring-lex-600'}`}>
        {active && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
      </span>
      {label}
    </button>
  )
}
