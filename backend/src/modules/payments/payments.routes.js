import express from 'express'

const router = express.Router()

router.get('/', (req, res) => {
  res.json({ message: 'Payments module is ready' })
})

export default router
