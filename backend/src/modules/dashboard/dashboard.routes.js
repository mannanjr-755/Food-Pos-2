import express from 'express'
import asyncHandler from 'express-async-handler'
import Order, { OPEN_STATUSES } from '../orders/orders.model.js'
import RestaurantTable from '../tables/tables.model.js'
import { protect } from '../../middleware/authMiddleware.js'
import { round2 } from '../../shared/utils/errors.js'

const router = express.Router()

const STATUSES = ['pending', 'accepted', 'preparing', 'ready', 'served', 'completed', 'cancelled']

router.get('/', protect, asyncHandler(async (req, res) => {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const [
    orders,
    todayOrders,
    revenueAll,
    revenueToday,
    statusRows,
    recent,
    tables,
  ] = await Promise.all([
    Order.countDocuments({}),
    Order.countDocuments({ createdAt: { $gte: startOfDay } }),
    Order.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, value: { $sum: '$total' } } }]),
    Order.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startOfDay } } },
      { $group: { _id: null, value: { $sum: '$total' } } },
    ]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.find().sort({ createdAt: -1 }).limit(10).select('orderNumber status table total createdAt items customer'),
    RestaurantTable.find({ active: true }).sort({ number: 1 }),
  ])

  const counts = Object.fromEntries(STATUSES.map((status) => [status, 0]))
  for (const row of statusRows) if (counts[row._id] !== undefined) counts[row._id] = row.count

  const numbers = tables.map((table) => table.number)
  const [totalsByTable, openOrders] = numbers.length
    ? await Promise.all([
        Order.aggregate([{ $match: { tableNumber: { $in: numbers } } }, { $group: { _id: '$tableNumber', total: { $sum: 1 } } }]),
        Order.find({ tableNumber: { $in: numbers }, status: { $in: OPEN_STATUSES } })
          .sort({ createdAt: -1 })
          .select('orderNumber status total'),
      ])
    : [[], []]

  const totalByTable = new Map(totalsByTable.map((row) => [row._id, row.total]))
  const currentByTable = new Map()
  for (const order of openOrders) if (!currentByTable.has(order.tableNumber)) currentByTable.set(order.tableNumber, order)

  const rows = tables.map((table) => {
    const current = currentByTable.get(table.number)
    return {
      id: String(table._id),
      number: table.number,
      label: table.label || `Table ${table.number}`,
      seats: table.seats,
      totalOrders: totalByTable.get(table.number) || 0,
      currentOrder: current
        ? { _id: current._id, orderNumber: current.orderNumber, status: current.status, total: current.total }
        : null,
    }
  })

  res.json({
    totals: {
      orders,
      todayOrders,
      totalRevenue: round2(revenueAll[0]?.value || 0),
      todayRevenue: round2(revenueToday[0]?.value || 0),
      unreadAlerts: counts.pending,
    },
    statusCounts: counts,
    tables: { total: rows.length, occupied: rows.filter((row) => row.currentOrder).length, rows },
    recentOrders: recent.map((order) => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      table: order.table,
      total: order.total,
      createdAt: order.createdAt,
      itemCount: order.items.length,
      customerName: order.customer?.name || '',
    })),
  })
}))

export default router
