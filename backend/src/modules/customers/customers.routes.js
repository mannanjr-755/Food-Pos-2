import express from 'express'
import asyncHandler from 'express-async-handler'
import Customer from './customers.model.js'
import { protect, staff } from '../../middleware/authMiddleware.js'
import { ApiError } from '../../shared/utils/errors.js'

const router = express.Router()

router.get('/', protect, asyncHandler(async (req, res) => {
  const filter = req.query.search
    ? { $or: [{ name: { $regex: req.query.search, $options: 'i' } }, { phone: { $regex: req.query.search, $options: 'i' } }] }
    : {}
  res.json(await Customer.find(filter).sort({ createdAt: -1 }).limit(100))
}))

router.post('/', protect, asyncHandler(async (req, res) => {
  const { name, phone, email = '', note = '' } = req.body
  if (!name?.trim()) throw new ApiError(400, 'Customer name is required')
  if (!phone?.trim()) throw new ApiError(400, 'Customer phone is required')
  const existing = await Customer.findOne({ phone: phone.trim() })
  if (existing) return res.json(existing)
  res.status(201).json(await Customer.create({ name: name.trim(), phone: phone.trim(), email, note }))
}))

router.patch('/:id', protect, staff('admin', 'manager'), asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id)
  if (!customer) throw new ApiError(404, 'Customer not found')
  for (const key of ['name', 'email', 'note']) if (key in req.body) customer[key] = req.body[key]
  await customer.save()
  res.json(customer)
}))

export default router
