import express from 'express'
import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose'
import RestaurantTable from './tables.model.js'
import Order, { OPEN_STATUSES } from '../orders/orders.model.js'
import { getSettings } from '../settings/settings.model.js'
import { protect, staff } from '../../middleware/authMiddleware.js'
import { ApiError } from '../../shared/utils/errors.js'

const router = express.Router()
const manage = staff('admin', 'manager')

const shape = (table, { currentOrder = null, totalOrders = 0, restaurantName = '' }) => ({
  id: String(table._id),
  number: table.number,
  label: table.label || `Table ${table.number}`,
  seats: table.seats,
  isActive: table.active,
  currentOrder,
  totalOrders,
  restaurantName,
})

router.get('/', protect, asyncHandler(async (req, res) => {
  const tables = await RestaurantTable.find(req.query.includeInactive === 'true' ? {} : { active: true }).sort({ number: 1 })
  const numbers = tables.map((t) => t.number)
  const [settings, totals, open] = await Promise.all([
    getSettings(),
    numbers.length
      ? Order.aggregate([{ $match: { tableNumber: { $in: numbers } } }, { $group: { _id: '$tableNumber', total: { $sum: 1 } } }])
      : [],
    numbers.length
      ? Order.find({ tableNumber: { $in: numbers }, status: { $in: OPEN_STATUSES } }).sort({ createdAt: -1 })
      : [],
  ])
  const countByTable = new Map(totals.map((row) => [row._id, row.total]))
  const openByTable = new Map()
  for (const order of open) if (!openByTable.has(order.tableNumber)) openByTable.set(order.tableNumber, order)

  res.json(tables.map((table) => {
    const current = openByTable.get(table.number)
    return shape(table, {
      currentOrder: current
        ? { _id: current._id, orderNumber: current.orderNumber, status: current.status, total: current.total, createdAt: current.createdAt }
        : null,
      totalOrders: countByTable.get(table.number) || 0,
      restaurantName: settings.businessName,
    })
  }))
}))

router.post('/', protect, manage, asyncHandler(async (req, res) => {
  const number = Number(req.body.number)
  if (!Number.isInteger(number) || number < 1 || number > 999) throw new ApiError(400, 'Table number must be between 1 and 999')
  if (await RestaurantTable.findOne({ number })) throw new ApiError(409, `Table ${number} already exists`)
  const table = await RestaurantTable.create({
    number,
    label: String(req.body.label || '').trim().slice(0, 40),
    seats: Number(req.body.seats) > 0 ? Number(req.body.seats) : 4,
    active: req.body.isActive !== false,
  })
  res.status(201).json(shape(table, { restaurantName: (await getSettings()).businessName }))
}))

router.patch('/:id', protect, manage, asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, 'Invalid table id')
  const table = await RestaurantTable.findById(req.params.id)
  if (!table) throw new ApiError(404, 'Table not found')

  if ('number' in req.body) {
    const number = Number(req.body.number)
    if (!Number.isInteger(number) || number < 1 || number > 999) throw new ApiError(400, 'Table number must be between 1 and 999')
    const clash = await RestaurantTable.findOne({ number, _id: { $ne: table._id } })
    if (clash) throw new ApiError(409, `Table ${number} already exists`)
    table.number = number
  }
  if ('label' in req.body) table.label = String(req.body.label || '').trim().slice(0, 40)
  if ('seats' in req.body && Number(req.body.seats) > 0) table.seats = Number(req.body.seats)
  if ('isActive' in req.body) table.active = Boolean(req.body.isActive)
  await table.save()

  res.json(shape(table, { restaurantName: (await getSettings()).businessName }))
}))

// A table with a history is retired rather than deleted, so past orders keep their reference.
router.delete('/:id', protect, manage, asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, 'Invalid table id')
  const table = await RestaurantTable.findById(req.params.id)
  if (!table) throw new ApiError(404, 'Table not found')

  const used = await Order.countDocuments({ tableNumber: table.number })
  if (used > 0) {
    table.active = false
    await table.save()
    return res.json({ deactivated: true, message: `Table ${table.number} has ${used} order(s), so it was taken off the floor` })
  }
  await table.deleteOne()
  res.json({ deactivated: false, message: 'Table deleted' })
}))

router.get('/:id/orders', protect, asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, 'Invalid table id')
  const table = await RestaurantTable.findById(req.params.id)
  if (!table) throw new ApiError(404, 'Table not found')
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50)
  const orders = await Order.find({ tableNumber: table.number }).sort({ createdAt: -1 }).limit(limit)
  res.json(orders.map((order) => ({
    _id: order._id,
    orderNumber: order.orderNumber,
    status: order.status,
    channel: order.channel,
    total: order.total,
    items: order.items,
    createdAt: order.createdAt,
    completedAt: order.completedAt,
  })))
}))

export default router
