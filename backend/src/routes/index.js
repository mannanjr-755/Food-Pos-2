import express from 'express'
import authRoutes from '../modules/auth/auth.routes.js'
import userRoutes from '../modules/users/users.routes.js'
import productRoutes from '../modules/products/products.routes.js'
import categoryRoutes from '../modules/categories/categories.routes.js'
import orderRoutes from '../modules/orders/orders.routes.js'
import inventoryRoutes from '../modules/inventory/inventory.routes.js'
import posRoutes from '../modules/pos/pos.routes.js'
import reportRoutes from '../modules/reports/reports.routes.js'
import { settingsRouter, eventsRouter, notificationsRouter } from '../modules/settings/misc.routes.js'
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js'
import customerRoutes from '../modules/customers/customers.routes.js'
import paymentRoutes from '../modules/payments/payments.routes.js'
import tableRoutes from '../modules/tables/tables.routes.js'
import imageRoutes from '../modules/images/images.routes.js'
import publicRoutes from '../modules/public/public.routes.js'

const router = express.Router()

router.use('/public', publicRoutes)
router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/products', productRoutes)
router.use('/categories', categoryRoutes)
router.use('/orders', orderRoutes)
router.use('/inventory', inventoryRoutes)
router.use('/pos', posRoutes)
router.use('/reports', reportRoutes)
router.use('/settings', settingsRouter)
router.use('/events', eventsRouter)
router.use('/notifications', notificationsRouter)
router.use('/dashboard', dashboardRoutes)
router.use('/customers', customerRoutes)
router.use('/payments', paymentRoutes)
router.use('/tables', tableRoutes)
router.use('/images', imageRoutes)

export default router
