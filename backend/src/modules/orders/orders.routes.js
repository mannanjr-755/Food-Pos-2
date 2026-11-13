import express from 'express'
import asyncHandler from 'express-async-handler'
import Order from './orders.model.js'
import { protect, staff } from '../../middleware/authMiddleware.js'
import { acceptOrder, rejectOrder, advanceStatus, ORDER_TRANSITIONS, INTAKE_CHANNELS } from './orders.service.js'
import { ApiError } from '../../shared/utils/errors.js'

const router = express.Router()

router.get('/', protect, asyncHandler(async (req, res) => {
  const { channel, status, page = 1, limit = 20 } = req.query
  const filter = {}
  if (channel && channel !== 'all') {
    filter.channel = channel === 'online' ? { $in: INTAKE_CHANNELS } : channel
  }
  if (status && status !== 'all') {
    filter.status = status === 'rejectedOrCancelled' ? { $in: ['rejected', 'cancelled'] } : status
  }
  const perPage = Math.min(Math.max(Number(limit) || 20, 1), 100)
  const skip = (Math.max(Number(page) || 1, 1) - 1) * perPage
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(perPage),
    Order.countDocuments(filter),
  ])
  res.json({ orders, total, page: Number(page), pages: Math.ceil(total / perPage) || 1 })
}))

router.get('/:id', protect, asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
  if (!order) throw new ApiError(404, 'Order not found')
  res.json(order)
}))

router.post('/:id/accept', protect, staff('admin', 'manager'), asyncHandler(async (req, res) => {
  res.json(await acceptOrder(req.params.id, req.user))
}))

router.post('/:id/reject', protect, staff('admin', 'manager'), asyncHandler(async (req, res) => {
  res.json(await rejectOrder(req.params.id, req.user))
}))

router.patch('/:id/status', protect, asyncHandler(async (req, res) => {
  const { status } = req.body
  const known = new Set(Object.values(ORDER_TRANSITIONS).flat())
  if (!known.has(status)) throw new ApiError(400, 'Invalid target status')
  res.json(await advanceStatus(req.params.id, status, req.user))
}))

export default router
