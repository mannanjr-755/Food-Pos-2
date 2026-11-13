import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, Package, ArrowUpDown } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { apiErrorMessage } from '../services/api'
import { useRealtime } from '../contexts/RealtimeContext'
import { formatDateTime } from '../utils/datetime'
import ProductImage from '../components/ui/ProductImage'
import StatusBadge from '../components/ui/StatusBadge'
import EmptyState from '../components/ui/EmptyState'
import { TableSkeleton } from '../components/ui/Skeletons'

const STATUS_TONE = { ok: 'green', low: 'amber', out: 'red', untracked: 'gray' }
const STATUS_LABEL = { ok: 'In stock', low: 'Low stock', out: 'Out of stock', untracked: 'Untracked' }

const selectCls =
  'rounded-lg border border-lex-700 bg-lex-900 px-3 py-2 text-sm text-lex-ink outline-none transition focus:border-lex-gold/55'

export default function Inventory() {
  const [rows, setRows] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState({ key: 'name', dir: 1 })

  const loadCategories = useCallback(() => {
    api.get('/categories').then(({ data }) => setCategories(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  const loadRows = useCallback(
    (quiet = false) => {
      if (!quiet) setLoading(true)
      const p = {}
      if (search.trim()) p.search = search.trim()
      if (category !== 'all') p.category = category
      if (status !== 'all') p.status = status
      api
        .get('/inventory', { params: p })
        .then(({ data }) => setRows(Array.isArray(data) ? data : []))
        .catch((err) => toast.error(apiErrorMessage(err, 'Could not load inventory')))
        .finally(() => setLoading(false))
    },
    [search, category, status]
  )

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const { subscribeCatalog } = useRealtime()

  useEffect(
    () =>
      subscribeCatalog(() => {
        loadCategories()
        loadRows(true)
      }),
    [subscribeCatalog, loadCategories, loadRows]
  )

  useEffect(() => {
    const t = setTimeout(loadRows, 250)
    return () => clearTimeout(t)
  }, [loadRows])

  const sorted = useMemo(() => {
    const list = [...rows]
    list.sort((a, b) => {
      if (sort.key === 'stock') return (a.stock - b.stock) * sort.dir
      if (sort.key === 'updated') return (new Date(a.updatedAt) - new Date(b.updatedAt)) * sort.dir
      return (a.name || '').localeCompare(b.name || '') * sort.dir
    })
    return list
  }, [rows, sort])

  const toggleSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir * -1 } : { key, dir: 1 }))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="lex-page-title">Inventory</h1>
        <p className="lex-page-subtitle">Stock levels across the menu (read-only)</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-lex-700 bg-lex-850 p-3 shadow-card">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-lex-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-lg border border-lex-700 bg-lex-900 py-2 pl-9 pr-3 text-sm text-lex-ink outline-none transition placeholder:text-lex-faint focus:border-lex-gold/55"
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
          <option value="all">All statuses</option>
          <option value="ok">In stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : sorted.length === 0 ? (
        <EmptyState icon={Package} title="No stock items" message="No products match the current filters." />
      ) : (
        <div className="lex-scroll overflow-x-auto rounded-2xl border border-lex-700 bg-lex-850 shadow-card">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-lex-700 text-left text-xs uppercase tracking-wide text-lex-faint">
                <th className="px-4 py-3 font-semibold">
                  <button type="button" onClick={() => toggleSort('name')} className="flex items-center gap-1 transition hover:text-lex-gold">
                    Product <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold">SKU</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">
                  <button type="button" onClick={() => toggleSort('stock')} className="flex items-center gap-1 transition hover:text-lex-gold">
                    Stock <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">
                  <button type="button" onClick={() => toggleSort('updated')} className="flex items-center gap-1 transition hover:text-lex-gold">
                    Last updated <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => {
                const st = p.stockStatus || (p.trackStock ? (p.stock <= 0 ? 'out' : p.stock <= (p.lowStockThreshold || 0) ? 'low' : 'ok') : 'untracked')
                return (
                  <tr key={p._id} className="border-b border-lex-700 transition last:border-0 hover:bg-lex-800/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ProductImage src={p.image} alt={p.name} className="h-10 w-10 shrink-0 rounded-lg ring-1 ring-lex-gold/15" />
                        <span className="font-medium text-lex-ink">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-lex-muted">{p.sku || '—'}</td>
                    <td className="px-4 py-3 text-lex-muted">{p.category?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold tabular-nums text-lex-ink">{p.trackStock ? p.stock : '—'}</span>
                      {p.trackStock && <span className="ml-1 text-xs text-lex-muted">pcs</span>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={st} label={STATUS_LABEL[st]} tone={STATUS_TONE[st]} />
                    </td>
                    <td className="px-4 py-3 tabular-nums text-lex-muted">{p.updatedAt ? formatDateTime(new Date(p.updatedAt)) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
