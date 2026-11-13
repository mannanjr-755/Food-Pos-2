import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, LayoutGrid, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { apiErrorMessage } from '../services/api'
import { useRealtime } from '../contexts/RealtimeContext'
import StatusBadge from '../components/ui/StatusBadge'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import { CardSkeletonGrid } from '../components/ui/Skeletons'

const inputCls =
  'rounded-lg border border-lex-700 bg-lex-900 px-3 py-2 text-sm text-lex-ink outline-none transition placeholder:text-lex-faint focus:border-lex-gold/55 focus:bg-white'

const emptyDraft = { name: '', description: '', sortOrder: '0', isActive: true }

export default function Categories() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('name')
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState(emptyDraft)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const load = useCallback(() => {
    api
      .get('/categories')
      .then(({ data }) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => toast.error(apiErrorMessage(err, 'Could not load categories')))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const { subscribeCatalog } = useRealtime()
  useEffect(() => subscribeCatalog(load), [subscribeCatalog, load])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = categories.filter(
      (c) => !q || c.name?.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q)
    )
    list = [...list].sort((a, b) => {
      if (sort === 'count') return (b.productCount || 0) - (a.productCount || 0)
      if (sort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt)
      return (a.name || '').localeCompare(b.name || '')
    })
    return list
  }, [categories, search, sort])

  const startCreate = () => {
    setDraft(emptyDraft)
    setEditing('new')
  }

  const startEdit = (category) => {
    setDraft({
      name: category.name || '',
      description: category.description || '',
      sortOrder: String(category.sortOrder ?? 0),
      isActive: category.active !== false,
    })
    setEditing(category)
  }

  const saveCategory = async (event) => {
    event.preventDefault()
    if (draft.name.trim().length < 2) {
      toast.error('Category name needs at least 2 characters.')
      return
    }
    setSaving(true)
    const body = {
      name: draft.name.trim(),
      description: draft.description.trim(),
      sortOrder: Number(draft.sortOrder || 0),
      active: draft.isActive,
    }
    try {
      if (editing === 'new') {
        await api.post('/categories', body)
        toast.success(`${draft.name.trim()} added`)
      } else {
        await api.patch(`/categories/${editing._id}`, body)
        toast.success(`${draft.name.trim()} updated`)
      }
      setEditing(null)
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const removeCategory = async () => {
    if (!confirmDelete) return
    setSaving(true)
    try {
      await api.delete(`/categories/${confirmDelete._id}`)
      toast.success(`${confirmDelete.name} deleted`)
      setConfirmDelete(null)
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="lex-page-title">Categories</h1>
          <p className="lex-page-subtitle">Menu groupings shown on the POS and table QR menu</p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="lex-btn-primary"
        >
          <Plus className="h-4 w-4" /> Add category
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-lex-700 bg-lex-850 p-3 shadow-card">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lex-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories…"
            className={`${inputCls} w-full py-2 pl-9 pr-3`}
          />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className={inputCls}>
          <option value="name">Name (A–Z)</option>
          <option value="count">Most products</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      {loading ? (
        <CardSkeletonGrid count={5} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title={categories.length === 0 ? 'No categories yet' : 'No categories match your search'}
          message={
            categories.length === 0
              ? 'Create the first group — Karahi, Charcoal Grill, Biryani, Drinks…'
              : 'Try a different search term.'
          }
          action={
            categories.length === 0 ? (
              <button
                type="button"
                onClick={startCreate}
                className="lex-press flex items-center gap-2 rounded-xl bg-gold-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-gold-glow transition hover:brightness-110"
              >
                <Plus className="h-4 w-4" /> Add category
              </button>
            ) : null
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((c) => (
            <div
              key={c._id}
              className="group flex items-center gap-4 rounded-2xl border border-lex-700 bg-lex-850 p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-lex-gold/35 hover:shadow-gold-glow"
            >
              <button
                type="button"
                onClick={() => navigate(`/menu?category=${c._id}`)}
                className="flex min-w-0 flex-1 items-center gap-4 text-left"
                title={`Open ${c.name} in the menu`}
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-lex-gold/20 bg-lex-900 text-lex-gold">
                  <LayoutGrid className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-lex-ink">{c.name}</p>
                    <StatusBadge status={c.active ? 'active' : 'inactive'} />
                  </div>
                  {c.description && <p className="mt-0.5 line-clamp-1 text-sm text-lex-muted">{c.description}</p>}
                  <p className="mt-1 text-xs font-semibold text-lex-gold/80">
                    {c.productCount || 0} product{(c.productCount || 0) === 1 ? '' : 's'}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-lex-faint transition group-hover:translate-x-0.5 group-hover:text-lex-gold" />
              </button>
              <div className="flex shrink-0 flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => startEdit(c)}
                  aria-label={`Edit ${c.name}`}
                  className="lex-press rounded-lg border border-lex-700 p-1.5 text-lex-muted transition hover:border-lex-gold/40 hover:text-lex-ink"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(c)}
                  aria-label={`Delete ${c.name}`}
                  className="lex-press rounded-lg border border-lex-700 p-1.5 text-lex-muted transition hover:border-lex-error/50 hover:bg-red-50 hover:text-lex-error"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add category' : editing && editing !== 'new' ? `Edit ${editing.name}` : ''}
        size="sm"
      >
        <form onSubmit={saveCategory} className="space-y-4">
          <div>
            <label htmlFor="cat-name" className="mb-1.5 block text-sm font-medium text-lex-ink">Name</label>
            <input
              id="cat-name"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              className={`${inputCls} w-full`}
              placeholder="Charcoal Grill"
              maxLength={60}
              required
            />
          </div>
          <div>
            <label htmlFor="cat-desc" className="mb-1.5 block text-sm font-medium text-lex-ink">
              Description <span className="text-lex-faint">(optional)</span>
            </label>
            <input
              id="cat-desc"
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              className={`${inputCls} w-full`}
              maxLength={200}
            />
          </div>
          <div>
            <label htmlFor="cat-sort" className="mb-1.5 block text-sm font-medium text-lex-ink">Menu order</label>
            <input
              id="cat-sort"
              type="number"
              min="0"
              max="999"
              value={draft.sortOrder}
              onChange={(e) => setDraft((d) => ({ ...d, sortOrder: e.target.value }))}
              className={`${inputCls} w-full`}
            />
            <p className="mt-1.5 text-[11px] text-lex-faint">Lower numbers appear first on the customer menu.</p>
          </div>
          <button
            type="button"
            onClick={() => setDraft((d) => ({ ...d, isActive: !d.isActive }))}
            aria-pressed={draft.isActive}
            className={`lex-press w-full rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
              draft.isActive
                ? 'border-lex-gold/40 bg-lex-gold/10 text-lex-gold'
                : 'border-lex-700 bg-lex-900 text-lex-muted hover:text-lex-ink'
            }`}
          >
            {draft.isActive ? 'Visible to customers' : 'Hidden from the menu'}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="lex-press flex w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient py-2.5 font-semibold text-white shadow-gold-glow transition hover:brightness-110 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing === 'new' ? 'Add category' : 'Save changes'}
          </button>
        </form>
      </Modal>

      <Modal open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} title="Delete this category?" size="sm">
        {confirmDelete && (
          <div>
            <p className="text-sm text-lex-ink">
              Delete <span className="font-semibold">{confirmDelete.name}</span>?
            </p>
            <p className="mt-2 text-sm text-lex-muted">
              {confirmDelete.productCount > 0
                ? `Move or delete its ${confirmDelete.productCount} product(s) first — categories with items cannot be removed.`
                : 'This category has no products, so it can be removed safely.'}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="lex-press rounded-xl border border-lex-700 px-4 py-2 text-sm font-semibold text-lex-muted transition hover:border-lex-gold/40 hover:text-lex-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={removeCategory}
                disabled={saving}
                className="lex-press flex items-center gap-1.5 rounded-xl bg-lex-error px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete category
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
