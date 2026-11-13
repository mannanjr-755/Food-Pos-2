import express from 'express'
import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose'
import Product from './products.model.js'
import Category from '../categories/categories.model.js'
import { protect, staff } from '../../middleware/authMiddleware.js'
import { emitEvent } from '../../shared/events/integrationEvent.model.js'
import { ApiError } from '../../shared/utils/errors.js'

const router = express.Router()
const manage = staff('admin', 'manager')

router.get('/', protect, asyncHandler(async (req, res) => {
  const { category, search, available, sort = 'name' } = req.query
  const filter = {}
  if (category && category !== 'all') {
    if (!mongoose.isValidObjectId(category)) throw new ApiError(400, 'Invalid category id')
    filter.category = category
  }
  if (available === 'true') filter.available = true
  if (available === 'false') filter.available = false
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
      { barcode: search },
    ]
  }
  const sortMap = { name: 1, price: 1, '-price': -1, newest: -1 }
  const sortSpec = sortMap[sort] ? { [sort.startsWith('-') ? 'price' : sort === 'newest' ? 'createdAt' : sort]: sortMap[sort] } : { name: 1 }
  const products = await Product.find(filter).populate('category', 'name active').sort(sortSpec)
  res.json(products)
}))

router.get('/:id', protect, asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name active')
  if (!product) throw new ApiError(404, 'Product not found')
  res.json(product)
}))

router.post('/', protect, manage, asyncHandler(async (req, res) => {
  const {
    name, description = '', sku, barcode, category, price, image = '', available = true,
    popular = false, sortOrder = 0, trackStock = true, stock = 0, lowStockThreshold = 10,
  } = req.body
  if (!name?.trim()) throw new ApiError(400, 'Product name is required')
  if (!category) throw new ApiError(400, 'Category is required')
  if (!(Number(price) >= 0)) throw new ApiError(400, 'A valid price is required')
  const cat = await Category.findById(category)
  if (!cat) throw new ApiError(400, 'Unknown category')
  const product = await Product.create({
    name: name.trim(), description, sku: sku?.trim() || undefined, barcode: barcode?.trim() || undefined,
    category, price: Number(price), image, available: !!available, popular: !!popular,
    sortOrder: Number(sortOrder) || 0, trackStock: !!trackStock,
    stock: Number(stock) || 0, lowStockThreshold: Number(lowStockThreshold) || 0,
  })
  await emitEvent('product.updated', { productId: product._id, name: product.name })
  res.status(201).json(await product.populate('category', 'name active'))
}))

router.patch('/:id', protect, manage, asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) throw new ApiError(404, 'Product not found')
  const allowed = ['name', 'description', 'sku', 'barcode', 'category', 'price', 'image', 'available', 'popular', 'sortOrder', 'trackStock', 'stock', 'lowStockThreshold']
  for (const key of allowed) if (key in req.body) product[key] = key === 'price' ? Number(req.body[key]) : req.body[key]
  if (product.stock === null || product.stock === undefined) product.stock = 0
  await product.save()
  await emitEvent('product.updated', { productId: product._id, name: product.name, price: product.price })
  res.json(product)
}))

router.delete('/:id', protect, staff('admin'), asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id)
  if (!product) throw new ApiError(404, 'Product not found')
  await emitEvent('product.updated', { productId: req.params.id, removed: true })
  res.json({ message: 'Product deleted' })
}))

export default router
