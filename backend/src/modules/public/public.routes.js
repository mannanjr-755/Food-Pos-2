import express from 'express'
import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose'
import Product from '../products/products.model.js'
import Category from '../categories/categories.model.js'
import RestaurantTable from '../tables/tables.model.js'
import Order from '../orders/orders.model.js'
import { getSettings } from '../settings/settings.model.js'
import { createQrOrder } from '../orders/orders.service.js'
import { ApiError } from '../../shared/utils/errors.js'
import { publicMenuLimiter, publicOrderLimiter } from './publicRateLimit.js'

const router = express.Router()

/** Everything a guest's phone needs to render the table menu, with no login. */
router.get('/menu', publicMenuLimiter, asyncHandler(async (req, res) => {
  const number = Number(req.query.table)
  const table = await RestaurantTable.findOne({ number, active: true })
  if (!table) throw new ApiError(404, 'This table is not on the floor right now')

  const [settings, categories] = await Promise.all([
    getSettings(),
    Category.find({ active: true }).sort({ sortOrder: 1, name: 1 }),
  ])
  const products = await Product.find({ available: true, category: { $in: categories.map((c) => c._id) } })
    .sort({ sortOrder: 1, name: 1 })
  const categoryOrder = new Map(categories.map((c, index) => [String(c._id), index]))
  const categoryNames = new Map(categories.map((c) => [String(c._id), c.name]))

  res.json({
    restaurant: {
      name: settings.businessName,
      tagline: settings.tagline,
      phone: settings.phone,
      currencySymbol: settings.currencySymbol,
      taxRate: settings.taxRate,
      ordersOpen: settings.qrOrdersActive !== false,
    },
    table: { number: table.number, label: table.label || `Table ${table.number}`, seats: table.seats },
    categories: categories.map((c) => ({ id: String(c._id), name: c.name, description: c.description })),
    items: products
      .map((p) => ({
        id: String(p._id),
        name: p.name,
        description: p.description,
        price: p.price,
        image: p.image,
        categoryId: String(p.category),
        categoryName: categoryNames.get(String(p.category)),
        popular: Boolean(p.popular),
        lowStock: p.trackStock && p.stock <= (p.lowStockThreshold || 0),
        soldOut: p.trackStock && p.stock <= 0,
      }))
      .sort((a, b) => categoryOrder.get(a.categoryId) - categoryOrder.get(b.categoryId)),
  })
}))

/** A guest placing the order from the QR menu. `sourceRef` makes retries safe. */
router.post('/orders', publicOrderLimiter, asyncHandler(async (req, res) => {
  const settings = await getSettings()
  if (settings.qrOrdersActive === false) throw new ApiError(503, 'Online ordering is paused right now')

  const { order, replayed } = await createQrOrder({
    tableNumber: req.body.tableNumber ?? req.body.table,
    customer: req.body.customer,
    items: Array.isArray(req.body.items) ? req.body.items.slice(0, 40) : [],
    notes: req.body.notes,
    sourceRef: req.body.sourceRef,
  })
  res.status(replayed ? 200 : 201).json({
    _id: order._id,
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total,
    table: order.table,
    replayed,
  })
}))

router.get('/orders/:id', publicMenuLimiter, asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(404, 'Order not found')
  const order = await Order.findById(req.params.id)
  if (!order || order.channel !== 'qr') throw new ApiError(404, 'Order not found')
  res.json({
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total,
    table: order.table,
    items: order.items.map((line) => ({ name: line.name, quantity: line.quantity })),
    placedAt: order.createdAt,
  })
}))

export default router
