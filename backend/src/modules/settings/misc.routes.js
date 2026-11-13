import express from 'express'
import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose'
import { getSettings } from './settings.model.js'
import IntegrationEvent from '../../shared/events/integrationEvent.model.js'
import sse from '../../shared/events/sse.js'
import Notification from '../notifications/notifications.model.js'
import { protect } from '../../middleware/authMiddleware.js'
import { ApiError } from '../../shared/utils/errors.js'

const settingsRouter = express.Router()
const eventsRouter = express.Router()
const notificationsRouter = express.Router()

settingsRouter.get('/', protect, asyncHandler(async (req, res) => {
  res.json(await getSettings())
}))

settingsRouter.put('/', protect, asyncHandler(async (req, res) => {
  const settings = await getSettings()
  const allowed = ['businessName', 'tagline', 'phone', 'address', 'currencySymbol', 'taxRate', 'serviceFee', 'receiptFooter', 'timezone', 'qrOrdersActive', 'printer']
  for (const key of allowed) {
    if (!(key in req.body)) continue
    if (key === 'printer' && req.body.printer && typeof req.body.printer === 'object') {
      settings.printer = { ...(settings.printer?.toObject?.() || settings.printer || {}), ...req.body.printer }
    } else {
      settings[key] = req.body[key]
    }
  }
  await settings.save()
  res.json(settings)
}))

eventsRouter.get('/', protect, asyncHandler(async (req, res) => {
  const filter = {}
  if (req.query.since) {
    const since = new Date(req.query.since)
    if (Number.isNaN(since.getTime())) throw new ApiError(400, 'Invalid since date')
    filter.createdAt = { $gt: since }
  }
  const events = await IntegrationEvent.find(filter).sort({ createdAt: 1 }).limit(100)
  res.json(events)
}))

eventsRouter.get('/stream', protect, (req, res, next) => {
  const run = async () => {
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    res.flushHeaders()

    const replayAfter = req.get('Last-Event-ID') || req.query.lastEventId
    if (replayAfter && mongoose.isValidObjectId(replayAfter)) {
      const missed = await IntegrationEvent.find({ _id: { $gt: replayAfter } }).sort({ _id: 1 }).limit(200)
      for (const event of missed) {
        res.write(`id: ${event._id}\nevent: ${event.type}\ndata: ${JSON.stringify({ ...event.payload, eventId: event._id })}\n\n`)
      }
    }
    res.write(`: connected\n\n`)
    sse.addClient(res)
  }
  run().catch(next)
})

notificationsRouter.get('/', protect, asyncHandler(async (req, res) => {
  const [doc, events] = await Promise.all([
    Notification.findOne({ userId: req.user._id }),
    IntegrationEvent.find({ type: { $in: ['order.accepted', 'order.created', 'order.status'] } }).sort({ createdAt: -1 }).limit(30),
  ])
  const readIds = new Set((doc?.readEventIds || []).map(String))
  const unread = events.filter((e) => !readIds.has(String(e._id)))
  res.json({ unread: unread.slice(0, 10), unreadCount: unread.length })
}))

notificationsRouter.post('/read', protect, asyncHandler(async (req, res) => {
  const ids = Array.isArray(req.body.eventIds) ? req.body.eventIds.slice(0, 100) : null
  if (ids) {
    await Notification.updateOne(
      { userId: req.user._id },
      { $addToSet: { readEventIds: { $each: ids.filter(mongoose.isValidObjectId) } } },
      { upsert: true }
    )
  } else {
    await Notification.updateOne(
      { userId: req.user._id },
      { $set: { readEventIds: (await IntegrationEvent.find({}, { _id: 1 }).sort({ createdAt: -1 }).limit(500)).map((e) => e._id) } },
      { upsert: true }
    )
  }
  res.json({ message: 'ok' })
}))

export { settingsRouter, eventsRouter, notificationsRouter }
