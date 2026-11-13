import api from '../services/api'
import { idbDelete, idbGet, idbGetAll, idbPut, idbSet } from './db'

export async function cacheCatalog(catalog) {
  await idbSet('catalog', 'latest', {
    ...catalog,
    cachedAt: new Date().toISOString(),
  })
}

export async function readCachedCatalog() {
  return (await idbGet('catalog', 'latest')) || null
}

export async function cacheHistoryPage(orders) {
  for (const order of orders || []) {
    const localId = order.idempotencyKey || order._id || order.orderNumber
    await idbPut('history', {
      localId,
      idempotencyKey: order.idempotencyKey || localId,
      synced: true,
      offline: Boolean(order.offline),
      order: {
        ...order,
        _id: order._id || localId,
      },
      createdAt: order.completedAt || order.createdAt || new Date().toISOString(),
    })
  }
}

export async function listLocalHistory() {
  const rows = await idbGetAll('history')
  return rows
    .map((r) => ({ ...r.order, offline: r.offline && !r.synced, _localPending: !r.synced }))
    .sort((a, b) => new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt))
}

export async function saveLocalSale({ body, order, offline }) {
  const key = body.idempotencyKey
  const localId = key
  await idbPut('history', {
    localId,
    idempotencyKey: key,
    synced: !offline,
    offline: Boolean(offline),
    payload: body,
    order,
    createdAt: order.completedAt || order.createdAt || new Date().toISOString(),
  })
  if (offline) {
    await idbPut('pendingSales', {
      idempotencyKey: key,
      payload: body,
      localOrder: order,
      createdAt: new Date().toISOString(),
      attempts: 0,
    })
  }
}

export async function pendingCount() {
  const rows = await idbGetAll('pendingSales')
  return rows.length
}

/**
 * Push queued offline sales. Idempotency keys prevent duplicate server rows.
 */
export async function syncPendingSales() {
  if (!navigator.onLine) return { synced: 0, failed: 0 }
  const pending = await idbGetAll('pendingSales')
  let synced = 0
  let failed = 0

  for (const row of pending) {
    try {
      const { data } = await api.post('/pos/sales', row.payload)
      await idbPut('history', {
        localId: row.idempotencyKey,
        idempotencyKey: row.idempotencyKey,
        synced: true,
        offline: false,
        payload: row.payload,
        order: data,
        createdAt: data.completedAt || data.createdAt || row.createdAt,
      })
      await idbDelete('pendingSales', row.idempotencyKey)
      synced += 1
    } catch (err) {
      const status = err?.response?.status
      // Already created on server (idempotent replay) or permanent client error.
      if (status === 200 || status === 201) {
        await idbDelete('pendingSales', row.idempotencyKey)
        synced += 1
      } else if (status >= 400 && status < 500 && status !== 409) {
        // Keep in queue only for network/5xx; mark attempts for visibility.
        row.attempts = (row.attempts || 0) + 1
        row.lastError = err?.response?.data?.message || err.message
        await idbPut('pendingSales', row)
        failed += 1
      } else {
        row.attempts = (row.attempts || 0) + 1
        row.lastError = err?.response?.data?.message || err.message
        await idbPut('pendingSales', row)
        failed += 1
      }
    }
  }

  return { synced, failed }
}

export function buildOfflineOrder({ body, totals, taxRate }) {
  const now = new Date().toISOString()
  const short = String(body.idempotencyKey || '').slice(-6).toUpperCase()
  const items = (body.items || []).map((line, idx) => {
    const price = Number(line.price) || 0
    // Frontend cart prices are already size-adjusted; rebuild from totals payload fields if present.
    return {
      productId: line.productId,
      name: line.name || `Item ${idx + 1}`,
      image: line.image || '',
      size: line.size || 'Full',
      price: line.unitPrice ?? price,
      quantity: line.quantity,
      lineTotal: Math.round((line.unitPrice ?? price) * line.quantity * 100) / 100,
      notes: '',
    }
  })

  return {
    _id: `offline-${body.idempotencyKey}`,
    orderNumber: `OFF-${short}`,
    channel: 'pos',
    orderType: body.orderType || 'Takeaway',
    status: 'completed',
    customer: { name: 'Walk-in Customer', phone: '' },
    items,
    subtotal: totals.subtotal,
    discount: totals.discount,
    discountPercent: Number(body.discountPercent) || 0,
    tax: totals.tax,
    total: totals.total,
    waiter: body.waiter || '',
    payment: {
      method: body.payment?.method || 'cash',
      status: (Number(body.payment?.received) || 0) >= totals.total ? 'paid' : 'unpaid',
      received: Number(body.payment?.received) || 0,
      change: Math.max((Number(body.payment?.received) || 0) - totals.total, 0),
      due: Math.max(totals.total - (Number(body.payment?.received) || 0), 0),
    },
    notes: '',
    table: body.table || '',
    printType: 'both',
    idempotencyKey: body.idempotencyKey,
    completedAt: now,
    createdAt: now,
    offline: true,
    taxRate,
  }
}
