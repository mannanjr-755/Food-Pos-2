import express from 'express'
import asyncHandler from 'express-async-handler'
import Product from '../products/products.model.js'
import Category from '../categories/categories.model.js'
import Order from '../orders/orders.model.js'
import { protect, staff } from '../../middleware/authMiddleware.js'
import { createSale, createDraft } from '../orders/orders.service.js'
import { ApiError } from '../../shared/utils/errors.js'

const router = express.Router()
const cashier = staff('admin', 'manager', 'cashier')

router.get('/products', protect, asyncHandler(async (req, res) => {
  const [categories, products] = await Promise.all([
    Category.find({ active: true }).sort({ sortOrder: 1, name: 1 }),
    Product.find({ available: true }).populate('category', 'name'),
  ])
  res.json({ categories, products })
}))

router.post('/sales', protect, cashier, asyncHandler(async (req, res) => {
  const { order, replayed } = await createSale({ ...req.body, user: req.user })
  res.status(replayed ? 200 : 201).json({ ...order.toObject(), replayed })
}))

router.post('/save', protect, cashier, asyncHandler(async (req, res) => {
  const order = await createDraft({ ...req.body, status: 'pending', user: req.user })
  res.status(201).json(order)
}))

router.post('/hold', protect, cashier, asyncHandler(async (req, res) => {
  const order = await createDraft({ ...req.body, status: 'held', user: req.user })
  res.status(201).json(order)
}))

router.get('/held', protect, cashier, asyncHandler(async (req, res) => {
  res.json(await Order.find({ status: 'held' }).sort({ updatedAt: -1 }))
}))

router.patch('/held/:id/resume', protect, cashier, asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, status: 'held' })
  if (!order) throw new ApiError(404, 'Held order not found')
  order.status = 'pending'
  await order.save()
  res.json(order)
}))

router.delete('/held/:id', protect, cashier, asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, status: 'held' })
  if (!order) throw new ApiError(404, 'Held order not found')
  order.status = 'cancelled'
  await order.save()
  res.json({ message: 'Held order discarded' })
}))

export default router
