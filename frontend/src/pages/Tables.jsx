import { useCallback, useEffect, useState } from 'react'
import { Armchair, Copy, Download, ExternalLink, Loader2, Pencil, Plus, Printer, QrCode, Trash2, X } from 'lucide-react'
import QRCode from 'qrcode'
import toast from 'react-hot-toast'
import api, { apiErrorMessage } from '../services/api'
import { useRealtime } from '../contexts/RealtimeContext'
import formatCurrency from '../utils/formatCurrency'
import StatusBadge from '../components/ui/StatusBadge'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import ProductImage from '../components/ui/ProductImage'
import { Skeleton } from '../components/ui/Skeletons'
import { formatDateTime } from '../utils/datetime'

const inputCls =
  'rounded-lg border border-lex-700 bg-lex-900 px-3 py-2 text-sm text-lex-ink outline-none transition placeholder:text-lex-faint focus:border-lex-gold/55 focus:bg-white'

function tableUrl(table) {
  return `${window.location.origin}/t/${table.number}`
}

function floorStatus(table) {
  if (!table.currentOrder) return { label: 'Available', tone: 'green' }
  const byStatus = {
    pending: { label: 'New Order', tone: 'amber' },
    accepted: { label: 'Preparing', tone: 'blue' },
    preparing: { label: 'Preparing', tone: 'blue' },
    ready: { label: 'Ready', tone: 'purple' },
    served: { label: 'Occupied', tone: 'teal' },
  }
  return byStatus[table.currentOrder.status] || { label: 'Occupied', tone: 'gray' }
}

function TableCard({ table, onQr, onOrders, onEdit, onDelete, onCopy }) {
  const status = floorStatus(table)
  return (
    <div className="flex flex-col rounded-2xl border border-lex-700 bg-lex-850 p-4 shadow-card transition hover:border-lex-gold/30 hover:shadow-gold-glow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lex-gold/10 text-lex-gold ring-1 ring-lex-gold/20">
              <Armchair className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-semibold text-lex-ink">{table.label || `Table ${table.number}`}</p>
              <p className="truncate text-[11px] text-lex-faint">{table.totalOrders} order(s) all time</p>
            </div>
          </div>
        </div>
        <StatusBadge label={status.label} tone={status.tone} status={status.label} />
      </div>

      {table.currentOrder && (
        <p className="mt-3 truncate rounded-lg bg-lex-900 px-3 py-2 text-xs text-lex-muted">
          <span className="font-semibold text-lex-ink">#{table.currentOrder.orderNumber}</span> ·{' '}
          {formatCurrency(table.currentOrder.total)} · {formatDateTime(new Date(table.currentOrder.createdAt))}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={tableUrl(table)}
          target="_blank"
          rel="noopener noreferrer"
          className="lex-press flex items-center gap-1.5 rounded-lg border border-lex-700 bg-lex-900 px-3 py-1.5 text-xs font-semibold text-lex-ink transition hover:border-lex-gold/40 hover:bg-lex-800"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Open Menu
        </a>
        <button
          type="button"
          onClick={() => onCopy(table)}
          className="lex-press flex items-center gap-1.5 rounded-lg border border-lex-700 bg-lex-900 px-3 py-1.5 text-xs font-semibold text-lex-ink transition hover:border-lex-gold/40 hover:bg-lex-800"
        >
          <Copy className="h-3.5 w-3.5" /> Copy Link
        </button>
        <button
          type="button"
          onClick={() => onQr(table)}
          className="lex-press flex items-center gap-1.5 rounded-lg bg-gold-gradient px-3 py-1.5 text-xs font-semibold text-white shadow-gold-glow transition hover:brightness-110"
        >
          <QrCode className="h-3.5 w-3.5" /> Generate QR Code
        </button>
        <button
          type="button"
          onClick={() => onOrders(table)}
          className="lex-press ml-auto flex items-center gap-1.5 rounded-lg border border-lex-700 px-2.5 py-1.5 text-xs font-semibold text-lex-muted transition hover:border-lex-gold/40 hover:text-lex-ink"
        >
          Orders
        </button>
        <button
          type="button"
          aria-label={`Edit ${table.label || `Table ${table.number}`}`}
          onClick={() => onEdit(table)}
          className="lex-press rounded-lg border border-lex-700 p-1.5 text-lex-muted transition hover:border-lex-gold/40 hover:text-lex-ink"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label={`Delete ${table.label || `Table ${table.number}`}`}
          onClick={() => onDelete(table)}
          className="lex-press rounded-lg border border-lex-700 p-1.5 text-lex-muted transition hover:border-lex-error/50 hover:bg-red-50 hover:text-lex-error"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function Tables() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [qrTable, setQrTable] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [qrError, setQrError] = useState('')
  const [ordersFor, setOrdersFor] = useState(null)
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ number: '', label: '' })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const load = useCallback(() => {
    api
      .get('/tables')
      .then(({ data }) => setTables(Array.isArray(data) ? data : []))
      .catch((err) => toast.error(apiErrorMessage(err, 'Could not load tables')))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const { subscribe } = useRealtime()
  useEffect(() => subscribe(load), [subscribe, load])

  const copyLink = async (table) => {
    const url = tableUrl(table)
    try {
      await navigator.clipboard.writeText(url)
      toast.success(`Link copied for Table ${table.number}`)
    } catch {
      toast.error(url)
    }
  }

  const openQr = async (table) => {
    setQrTable(table)
    setQrDataUrl('')
    setQrError('')
    try {
      const url = await QRCode.toDataURL(tableUrl(table), {
        width: 720,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#1A1512', light: '#FFFFFF' },
      })
      setQrDataUrl(url)
    } catch {
      setQrError('Could not generate the QR code.')
    }
  }

  const printQr = () => window.print()

  const openOrders = async (table) => {
    setOrdersFor(table)
    setOrdersLoading(true)
    try {
      const { data } = await api.get(`/tables/${table.id}/orders`, { params: { limit: 10 } })
      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not load table orders'))
      setOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }

  const startCreate = () => {
    const next = tables.reduce((max, t) => Math.max(max, t.number), 0) + 1
    setEditing('new')
    setForm({ number: String(next), label: '' })
  }

  const startEdit = (table) => {
    setEditing(table)
    setForm({ number: String(table.number), label: table.label || '' })
  }

  const saveTable = async (e) => {
    e.preventDefault()
    const number = Number(form.number)
    if (!Number.isInteger(number) || number < 1 || number > 999) {
      toast.error('Use a whole number between 1 and 999.')
      return
    }
    setSaving(true)
    try {
      const payload = { number, label: form.label.trim() || null }
      if (editing === 'new') await api.post('/tables', payload)
      else await api.patch(`/tables/${editing.id}`, payload)
      toast.success(editing === 'new' ? `Table ${number} added` : `Table ${number} updated`)
      setEditing(null)
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const removeTable = async () => {
    if (!confirmDelete) return
    const table = confirmDelete
    setSaving(true)
    try {
      const { data } = await api.delete(`/tables/${table.id}`)
      toast.success(data?.deactivated ? `Table ${table.number} has orders, so it was taken off the floor instead of deleted.` : `Table ${table.number} deleted`)
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
          <h1 className="lex-page-title">Tables</h1>
          <p className="lex-page-subtitle">
            Each table carries a QR code that opens its own menu at{' '}
            <span className="font-mono text-lex-ink">{window.location.origin}/t/&lt;number&gt;</span>
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="lex-btn-primary"
        >
          <Plus className="h-4 w-4" /> Add table
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[188px] rounded-2xl" />
          ))}
        </div>
      ) : tables.length === 0 ? (
        <EmptyState
          icon={Armchair}
          title="No tables yet"
          message="Add Table 1, 2 and 3 to give each table its own QR menu link."
          action={
            <button
              type="button"
              onClick={startCreate}
              className="lex-press flex items-center gap-2 rounded-xl bg-gold-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-gold-glow transition hover:brightness-110"
            >
              <Plus className="h-4 w-4" /> Add the first table
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onQr={openQr}
              onCopy={copyLink}
              onOrders={openOrders}
              onEdit={startEdit}
              onDelete={setConfirmDelete}
            />
          ))}
        </div>
      )}

      {/* QR code */}
      <Modal open={Boolean(qrTable)} onClose={() => setQrTable(null)} title={qrTable ? `Table ${qrTable.number} QR code` : ''} size="sm">
        {qrTable && (
          <div className="text-center">
            <p className="text-sm text-lex-muted">Print this and stand it on the table — guests scan it to open the menu.</p>
            <div className="mx-auto mt-4 w-full max-w-[280px] rounded-2xl border border-lex-700 bg-white p-4 shadow-card">
              {qrError ? (
                <p className="py-10 text-sm text-lex-error">{qrError}</p>
              ) : qrDataUrl ? (
                <img src={qrDataUrl} alt={`QR code for Table ${qrTable.number}`} className="h-auto w-full" />
              ) : (
                <div className="flex h-[248px] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-lex-gold" />
                </div>
              )}
              <p className="mt-3 font-display text-base font-bold text-lex-ink">
                {qrTable.restaurantName || 'Chaska Koyla Karahi'}
              </p>
              <p className="text-xs uppercase tracking-[0.3em] text-lex-faint">Scan to order · Table {qrTable.number}</p>
            </div>
            <p className="mt-3 break-all text-[11px] text-lex-faint">{tableUrl(qrTable)}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <a
                href={qrDataUrl || undefined}
                download={`table-${qrTable.number}-qr.png`}
                className="lex-press flex items-center gap-1.5 rounded-xl border border-lex-700 bg-lex-900 px-4 py-2 text-sm font-semibold text-lex-ink transition hover:border-lex-gold/40 disabled:opacity-40"
              >
                <Download className="h-4 w-4" /> Download PNG
              </a>
              <button
                type="button"
                onClick={printQr}
                disabled={!qrDataUrl}
                className="lex-press flex items-center gap-1.5 rounded-xl bg-gold-gradient px-4 py-2 text-sm font-semibold text-white shadow-gold-glow transition hover:brightness-110 disabled:opacity-40"
              >
                <Printer className="h-4 w-4" /> Print
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Print-only sheet */}
      <div id="qr-print" className="qr-print-sheet">
        {qrTable && (
          <>
            <p className="qr-shop">{qrTable.restaurantName || 'Chaska Koyla Karahi'}</p>
            <p className="qr-table">{qrTable.label || `Table ${qrTable.number}`}</p>
            {qrDataUrl && <img src={qrDataUrl} alt="" />}
            <p className="qr-hint">Scan to open the menu and order from your table</p>
          </>
        )}
      </div>

      {/* Table orders */}
      <Modal
        open={Boolean(ordersFor)}
        onClose={() => setOrdersFor(null)}
        title={ordersFor ? `${ordersFor.label || `Table ${ordersFor.number}`} orders` : ''}
        size="lg"
      >
        {ordersLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState icon={Armchair} title="No orders on this table yet" message="QR and POS orders for this table appear here." />
        ) : (
          <ul className="space-y-3">
            {orders.map((order) => (
              <li key={order._id} className="rounded-xl border border-lex-700 bg-lex-900 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-lex-ink">#{order.orderNumber}</p>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-xs text-lex-faint">{formatDateTime(new Date(order.createdAt))}</p>
                </div>
                <p className="mt-1 text-xs text-lex-muted">
                  {order.customer?.name ? `${order.customer.name} · ` : ''}
                  {order.channel === 'qr' ? 'Table QR order' : 'POS order'}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {order.items.map((item, i) => (
                    <li key={`${order._id}-${i}`} className="flex items-center gap-2 text-sm text-lex-ink">
                      <ProductImage src={item.image || ''} alt={item.name} className="h-8 w-8 shrink-0 rounded-md" />
                      <span className="min-w-0 flex-1 truncate">{item.name}</span>
                      <span className="shrink-0 text-xs text-lex-muted">×{item.quantity}</span>
                      <span className="shrink-0 tabular-nums text-lex-gold">{formatCurrency(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex items-center justify-between border-t border-lex-700 pt-2">
                  <span className="text-xs uppercase tracking-wider text-lex-faint">Total</span>
                  <span className="font-display font-bold tabular-nums text-lex-ink">{formatCurrency(order.total)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      {/* Create / edit */}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add table' : editing ? `Edit Table ${editing.number}` : ''}
        size="sm"
      >
        <form onSubmit={saveTable} className="space-y-4">
          <div>
            <label htmlFor="table-number" className="mb-1.5 block text-sm font-medium text-lex-ink">
              Table number
            </label>
            <input
              id="table-number"
              type="number"
              min="1"
              max="999"
              value={form.number}
              onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
              className={`${inputCls} w-full`}
              required
            />
          </div>
          <div>
            <label htmlFor="table-label" className="mb-1.5 block text-sm font-medium text-lex-ink">
              Label <span className="text-lex-faint">(optional)</span>
            </label>
            <input
              id="table-label"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="e.g. Window 4"
              className={`${inputCls} w-full`}
              maxLength={60}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="lex-press flex w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient py-2.5 font-semibold text-white shadow-gold-glow transition hover:brightness-110 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing === 'new' ? 'Add table' : 'Save changes'}
          </button>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} title="Delete this table?" size="sm">
        {confirmDelete && (
          <div>
            <p className="text-sm text-lex-ink">
              Remove <span className="font-semibold">{confirmDelete.label || `Table ${confirmDelete.number}`}</span> and its QR link?
            </p>
            <p className="mt-2 text-sm text-lex-muted">
              {confirmDelete.totalOrders > 0
                ? `This table already has ${confirmDelete.totalOrders} order(s). It will be hidden from the floor instead of deleted, so history stays intact.`
                : 'This table has no orders, so it will be removed permanently.'}
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="lex-press flex items-center gap-1.5 rounded-xl border border-lex-700 px-4 py-2 text-sm font-semibold text-lex-muted transition hover:border-lex-gold/40 hover:text-lex-ink"
              >
                <X className="h-4 w-4" /> Keep
              </button>
              <button
                type="button"
                onClick={removeTable}
                disabled={saving}
                className="lex-press flex items-center gap-1.5 rounded-xl bg-lex-error px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {confirmDelete.totalOrders > 0 ? 'Hide table' : 'Delete table'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
