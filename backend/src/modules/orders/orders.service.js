import mongoose from 'mongoose'
import Order from '../../modules/orders/orders.model.js'
import Product from '../../modules/products/products.model.js'
import Customer from '../../modules/customers/customers.model.js'
import StockMovement from '../../modules/inventory/inventory.model.js'
import RestaurantTable from '../../modules/tables/tables.model.js'
import { getSettings } from '../../modules/settings/settings.model.js'
import { emitEvent } from '../../shared/events/integrationEvent.model.js'
import { nextOrderNumber } from '../../shared/utils/counter.model.js'
import { ApiError, round2 } from '../../shared/utils/errors.js'

export const ORDER_TRANSITIONS = {
  pending: ['accepted', 'rejected'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['served', 'completed', 'cancelled'],
  served: ['completed', 'cancelled'],
}

/** Orders that arrive from outside the terminal and need accepting before the kitchen runs them. */
export const INTAKE_CHANNELS = ['qr', 'website']

const SIZE_MULTIPLIER = { Half: 0.5, Full: 1 }

function normalizeSize(size) {
  const value = String(size || '').trim()
  if (value === 'Half' || value === 'Full') return value
  return 'Full'
}

export async function priceItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw new ApiError(400, 'Order must contain at least one item')
  const keys = items.map((i) => `${i.productId}:${normalizeSize(i.size)}`)
  if (new Set(keys).size !== keys.length) throw new ApiError(400, 'Duplicate product lines are not allowed')
  const ids = items.map((i) => i.productId)
  const products = await Product.find({ _id: { $in: ids } }).populate('category', 'name active')
  const settings = await getSettings()
  const lines = []
  const stockNeed = new Map()
  for (const item of items) {
    const product = products.find((p) => String(p._id) === String(item.productId))
    if (!product) throw new ApiError(400, `Unknown product: ${item.productId}`)
    if (!product.available || product.category?.active === false) {
      throw new ApiError(400, `${product.name} is currently unavailable`)
    }
    const quantity = Number(item.quantity)
    if (!Number.isInteger(quantity) || quantity < 1) throw new ApiError(400, `Invalid quantity for ${product.name}`)
    const size = normalizeSize(item.size)
    const unitPrice = round2(product.price * (SIZE_MULTIPLIER[size] || 1))
    const pid = String(product._id)
    stockNeed.set(pid, (stockNeed.get(pid) || 0) + quantity)
    if (product.trackStock && product.stock < stockNeed.get(pid)) {
      throw new ApiError(400, `Insufficient stock for ${product.name} (available: ${product.stock})`)
    }
    lines.push({
      productId: product._id,
      name: product.name,
      image: product.image,
      size,
      price: unitPrice,
      quantity,
      lineTotal: round2(unitPrice * quantity),
      notes: String(item.notes || '').slice(0, 200),
    })
  }
  const subtotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0))
  return { lines, subtotal, settings }
}

export function computeTotals(subtotal, discount, settings, discountPercent = 0) {
  const pct = Math.min(Math.max(Number(discountPercent) || 0, 0), 100)
  const fromPercent = round2(subtotal * (pct / 100))
  const flat = Math.max(Number(discount) || 0, 0)
  const disc = Math.min(fromPercent + flat, subtotal)
  const tax = round2((subtotal - disc) * (settings.taxRate / 100))
  const total = round2(subtotal - disc + tax)
  return { discount: round2(disc), discountPercent: pct, tax, total }
}

async function deductStock(order, session) {
  const opts = session ? { session } : {}
  const deducted = []
  try {
    for (const line of order.items) {
      const product = await Product.findById(line.productId).session(session || null)
      if (!product || !product.trackStock) continue
      if (session) {
        const res = await Product.updateOne(
          { _id: product._id, stock: { $gte: line.quantity } },
          { $inc: { stock: -line.quantity } },
          { session }
        )
        if (res.modifiedCount !== 1) throw new ApiError(409, `Insufficient stock for ${product.name}`)
      } else {
        if (product.stock < line.quantity) throw new ApiError(409, `Insufficient stock for ${product.name}`)
        product.stock -= line.quantity
        await product.save()
      }
      const fresh = await Product.findById(product._id).session(session || null)
      await StockMovement.create([{
        productId: product._id,
        delta: -line.quantity,
        reason: order.channel === 'pos' ? 'pos-sale' : 'online-order-accepted',
        orderId: order._id,
        balanceAfter: fresh.stock,
      }], opts)
      deducted.push({ productId: product._id, quantity: line.quantity })
    }
    return deducted
  } catch (err) {
    for (const d of deducted) {
      await Product.updateOne({ _id: d.productId }, { $inc: { stock: d.quantity } }, opts)
      await StockMovement.deleteMany({ productId: d.productId, orderId: order._id, delta: -d.quantity }, opts)
    }
    throw err
  }
}

/** POS staff type a free-text table label; link it to a floor table when the number matches. */
async function resolveTable(table) {
  const label = String(table || '').trim().slice(0, 30)
  const match = label.match(/\d+/)
  if (!match) return { table: label, tableNumber: null }
  const number = Number(match[0])
  const found = await RestaurantTable.findOne({ number })
  return { table: label || `Table ${number}`, tableNumber: found ? number : null }
}

export async function createSale({
  items,
  orderType,
  customer,
  notes,
  table,
  discount,
  discountPercent,
  payment,
  waiter,
  printType,
  idempotencyKey,
  user,
}) {
  if (idempotencyKey) {
    const existing = await Order.findOne({ idempotencyKey })
    if (existing) return { order: existing, replayed: true }
  }
  const { lines, subtotal, settings } = await priceItems(items)
  const totals = computeTotals(subtotal, discount, settings, discountPercent)
  const link = await resolveTable(table)

  const method = payment?.method || 'cash'
  if (!['cash', 'card', 'online'].includes(method)) throw new ApiError(400, 'Payment method must be cash, card or online')

  let received = Number(payment?.received)
  if (!Number.isFinite(received) || received < 0) received = totals.total
  const change = round2(Math.max(received - totals.total, 0))
  const due = round2(Math.max(totals.total - received, 0))
  const payStatus = due > 0 ? 'unpaid' : 'paid'

  const order = await Order.create([{
    orderNumber: await nextOrderNumber(),
    channel: 'pos',
    orderType: ['Dine In', 'Takeaway', 'Delivery'].includes(orderType) ? orderType : 'Takeaway',
    status: 'completed',
    customer: {
      name: customer?.name?.trim() || 'Walk-in Customer',
      phone: customer?.phone?.trim() || '',
    },
    items: lines,
    subtotal,
    ...totals,
    waiter: String(waiter || '').trim().slice(0, 40),
    payment: { method, status: payStatus, received, change, due },
    notes: String(notes || '').slice(0, 500),
    table: link.table,
    tableNumber: link.tableNumber,
    printType: ['bill', 'kot', 'both'].includes(printType) ? printType : '',
    idempotencyKey: idempotencyKey || undefined,
    stockDeducted: true,
    completedAt: new Date(),
    createdBy: user?._id,
  }])
  const [created] = order

  try {
    let usedTransaction = false
    if (mongoose.connection.db?.client) {
      const session = await mongoose.startSession()
      try {
        await session.withTransaction(async () => {
          await deductStock(created, session)
        })
        usedTransaction = true
      } catch (err) {
        if (!/Transaction numbers are only allowed/i.test(err.message)) throw err
      } finally {
        session.endSession()
      }
    }
    if (!usedTransaction) await deductStock(created)
  } catch (err) {
    created.payment.status = 'failed'
    created.status = 'cancelled'
    created.stockDeducted = false
    await created.save()
    throw err
  }

  if (created.customer.phone) {
    await Customer.updateOne(
      { phone: created.customer.phone },
      { $setOnInsert: { name: created.customer.name, phone: created.customer.phone } },
      { upsert: true }
    )
  }

  await emitEvent('sale.completed', {
    orderNumber: created.orderNumber,
    total: created.total,
    channel: 'pos',
    status: 'completed',
  }, created._id)
  await emitEvent('stock.updated', { orderNumber: created.orderNumber })

  return { order: created, replayed: false }
}

export async function createDraft({ items, orderType, customer, notes, table, status, user, idempotencyKey, waiter }) {
  const { lines, subtotal, settings } = await priceItems(items)
  const totals = computeTotals(subtotal, 0, settings)
  const link = await resolveTable(table)
  const [order] = await Order.create([{
    orderNumber: await nextOrderNumber(),
    channel: 'pos',
    orderType: ['Dine In', 'Takeaway', 'Delivery'].includes(orderType) ? orderType : 'Takeaway',
    status,
    customer: { name: customer?.name?.trim() || 'Walk-in Customer', phone: customer?.phone?.trim() || '' },
    items: lines,
    subtotal,
    ...totals,
    waiter: String(waiter || '').trim().slice(0, 40),
    payment: { method: 'none', status: 'unpaid' },
    notes: String(notes || '').slice(0, 500),
    table: link.table,
    tableNumber: link.tableNumber,
    idempotencyKey: idempotencyKey || undefined,
    createdBy: user?._id,
  }])
  return order
}

export async function createQrOrder({ tableNumber, customer, items, notes, sourceRef }) {
  const table = await RestaurantTable.findOne({ number: Number(tableNumber), active: true })
  if (!table) throw new ApiError(404, 'That table is not on the floor right now')

  const ref = String(sourceRef || '').trim()
  if (!ref) throw new ApiError(400, 'sourceRef is required for table orders')
  const existing = await Order.findOne({ sourceRef: ref })
  if (existing) return { order: existing, replayed: true }

  const { lines, subtotal, settings } = await priceItems(items)
  const totals = computeTotals(subtotal, 0, settings)
  const [order] = await Order.create([{
    orderNumber: await nextOrderNumber(),
    channel: 'qr',
    orderType: 'Dine In',
    status: 'pending',
    customer: { name: customer?.name?.trim() || 'Table Guest', phone: String(customer?.phone || '').trim() },
    items: lines,
    subtotal,
    ...totals,
    payment: { method: 'cod', status: 'unpaid' },
    notes: String(notes || '').slice(0, 500),
    table: table.label || `Table ${table.number}`,
    tableNumber: table.number,
    sourceRef: ref,
  }])

  if (order.customer.phone) {
    await Customer.updateOne(
      { phone: order.customer.phone },
      { $setOnInsert: { name: order.customer.name, phone: order.customer.phone } },
      { upsert: true }
    )
  }

  await emitEvent('order.created', {
    orderNumber: order.orderNumber,
    channel: 'qr',
    status: 'pending',
    total: order.total,
    table: order.table,
  }, order._id)
  return { order, replayed: false }
}

export async function acceptOrder(orderId, user) {
  const order = await Order.findById(orderId)
  if (!order) throw new ApiError(404, 'Order not found')
  if (!INTAKE_CHANNELS.includes(order.channel) || order.status !== 'pending') {
    throw new ApiError(409, `Only pending table orders can be accepted (current: ${order.status})`)
  }
  if (!order.stockDeducted) {
    const claimed = await Order.findOneAndUpdate(
      { _id: order._id, stockDeducted: false },
      { $set: { stockDeducted: true } },
      { new: true }
    )
    if (!claimed) throw new ApiError(409, 'Order is already being accepted elsewhere')
    try {
      await deductStock(order)
    } catch (err) {
      await Order.updateOne({ _id: order._id }, { $set: { stockDeducted: false } })
      throw err
    }
  }
  order.status = 'accepted'
  order.acceptedAt = new Date()
  await order.save()
  await emitEvent('order.accepted', {
    orderNumber: order.orderNumber,
    channel: order.channel,
    status: 'accepted',
    customer: order.customer,
    total: order.total,
  }, order._id)
  await emitEvent('stock.updated', { orderNumber: order.orderNumber })
  return order
}

export async function rejectOrder(orderId, user) {
  const order = await Order.findById(orderId)
  if (!order) throw new ApiError(404, 'Order not found')
  if (order.status !== 'pending') throw new ApiError(409, 'Only pending orders can be rejected')
  order.status = 'rejected'
  await order.save()
  await emitEvent('order.status', { orderNumber: order.orderNumber, status: 'rejected', channel: order.channel }, order._id)
  return order
}

export async function advanceStatus(orderId, nextStatus, user) {
  const order = await Order.findById(orderId)
  if (!order) throw new ApiError(404, 'Order not found')
  const allowed = ORDER_TRANSITIONS[order.status] || []
  if (!allowed.includes(nextStatus)) {
    throw new ApiError(409, `Cannot move order from ${order.status} to ${nextStatus}`)
  }
  if (nextStatus === 'accepted' || nextStatus === 'rejected') {
    if (!['admin', 'manager'].includes(user.role)) throw new ApiError(403, 'Only admin or manager can accept or reject table orders')
    if (nextStatus === 'accepted') return acceptOrder(orderId, user)
  }
  order.status = nextStatus
  if (nextStatus === 'completed') {
    order.completedAt = new Date()
    if (order.payment.status === 'unpaid' && ['card', 'online'].includes(order.payment.method)) {
      order.payment.status = 'paid'
    }
  }
  await order.save()
  await emitEvent('order.status', {
    orderNumber: order.orderNumber,
    status: nextStatus,
    channel: order.channel,
  }, order._id)
  return order
}
