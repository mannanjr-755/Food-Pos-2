import express from 'express'
import asyncHandler from 'express-async-handler'
import User from './users.model.js'
import { protect, staff } from '../../middleware/authMiddleware.js'
import { ApiError } from '../../shared/utils/errors.js'

const router = express.Router()

router.get('/', protect, staff('admin'), asyncHandler(async (req, res) => {
  res.json(await User.find().select('-password').sort({ createdAt: 1 }))
}))

router.post('/', protect, staff('admin'), asyncHandler(async (req, res) => {
  const { name, email, password, role = 'cashier' } = req.body
  if (!name?.trim() || !email?.trim()) throw new ApiError(400, 'Name and email are required')
  if (!password || password.length < 8) throw new ApiError(400, 'Password must be at least 8 characters')
  if (!['admin', 'manager', 'cashier'].includes(role)) throw new ApiError(400, 'Invalid role')
  if (await User.findOne({ email: email.trim() })) throw new ApiError(400, 'User already exists')
  const user = await User.create({ name: name.trim(), email: email.trim(), password, role })
  res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role })
}))

router.patch('/:id', protect, staff('admin'), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) throw new ApiError(404, 'User not found')
  if (req.body.role && ['admin', 'manager', 'cashier'].includes(req.body.role)) user.role = req.body.role
  if (req.body.name) user.name = req.body.name
  if (req.body.password) user.password = req.body.password
  await user.save()
  res.json({ _id: user._id, name: user.name, email: user.email, role: user.role })
}))

export default router
