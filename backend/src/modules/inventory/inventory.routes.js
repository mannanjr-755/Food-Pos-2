import express from 'express'
import asyncHandler from 'express-async-handler'
import Product from '../products/products.model.js'
import StockMovement from './inventory.model.js'
import { protect, staff } from '../../middleware/authMiddleware.js'
import { emitEvent } from '../../shared/events/integrationEvent.model.js'
import { ApiError } from '../../shared/utils/errors.js'

const router = express.Router()

router.get('/', protect, asyncHandler(async (req, res) => {
  const { status, category, search } = req.query
  const filter = {}
  if (category && category !== 'all') filter.category = category
  if (search) filter.name = { $regex: search, $options: 'i' }
  if (status === 'low') { filter.trackStock = true; filter.$expr = { $and: [{ $lte: ['$stock', '$lowStockThreshold'] }, { $gt: ['$stock', 0] }] } }
  if (status === 'out') { filter.trackStock = true; filter.stock = 0 }
  if (status === 'ok') { filter.trackStock = true; filter.$expr = { $gt: ['$stock', '$lowStockThreshold'] } }
  const products = await Product.find(filter).populate('category', 'name').sort({ name: 1 })
  res.json(products.map((p) => ({
    ...p.toObject(),
    stockStatus: !p.trackStock ? 'untracked' : p.stock === 0 ? 'out' : p.stock <= p.lowStockThreshold ? 'low' : 'ok',
  })))
}))

router.post('/adjust', protect, staff('admin', 'manager'), asyncHandler(async (req, res) => {
  const { productId, delta, reason } = req.body
  const product = await Product.findById(productId)
  if (!product) throw new ApiError(404, 'Product not found')
  if (!product.trackStock) throw new ApiError(400, `${product.name} does not track stock`)
  const change = Number(delta)
  if (!Number.isInteger(change) || change === 0) throw new ApiError(400, 'delta must be a non-zero integer')
  if (product.stock + change < 0) throw new ApiError(400, 'Stock cannot go below zero')
  product.stock += change
  await product.save()
  const movement = await StockMovement.create({
    productId, delta: change, reason: String(reason || 'manual-adjust').slice(0, 100),
    userId: req.user._id, balanceAfter: product.stock,
  })
  await emitEvent('stock.updated', { productId, stock: product.stock })
  res.json({ product, movement })
}))

router.get('/movements', protect, staff('admin', 'manager'), asyncHandler(async (req, res) => {
  const movements = await StockMovement.find()
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(req.query.limit) || 50, 200))
    .populate('productId', 'name sku')
  res.json(movements)
}))

export default router
