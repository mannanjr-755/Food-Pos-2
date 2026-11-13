import express from 'express'
import asyncHandler from 'express-async-handler'
import Category from '../categories/categories.model.js'
import Product from '../products/products.model.js'
import { protect, staff } from '../../middleware/authMiddleware.js'
import { emitEvent } from '../../shared/events/integrationEvent.model.js'
import { ApiError } from '../../shared/utils/errors.js'

const router = express.Router()
const manage = staff('admin', 'manager')

router.get('/', protect, asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ sortOrder: 1, name: 1 }).populate('productCount')
  res.json(categories)
}))

router.post('/', protect, manage, asyncHandler(async (req, res) => {
  const { name, description = '', image = '', active = true, sortOrder = 0 } = req.body
  if (!name?.trim()) throw new ApiError(400, 'Category name is required')
  const category = await Category.create({ name: name.trim(), description, image, active, sortOrder })
  res.status(201).json(category)
}))

router.patch('/:id', protect, manage, asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
  if (!category) throw new ApiError(404, 'Category not found')
  const allowed = ['name', 'description', 'image', 'active', 'sortOrder']
  for (const key of allowed) if (key in req.body) category[key] = req.body[key]
  await category.save()
  await emitEvent('category.updated', { categoryId: category._id, name: category.name })
  res.json(category)
}))

router.delete('/:id', protect, manage, asyncHandler(async (req, res) => {
  const inUse = await Product.countDocuments({ category: req.params.id })
  if (inUse > 0) throw new ApiError(409, `Category has ${inUse} products; deactivate it instead of deleting`)
  const category = await Category.findByIdAndDelete(req.params.id)
  if (!category) throw new ApiError(404, 'Category not found')
  await emitEvent('category.updated', { categoryId: req.params.id, removed: true })
  res.json({ message: 'Category deleted' })
}))

export default router
