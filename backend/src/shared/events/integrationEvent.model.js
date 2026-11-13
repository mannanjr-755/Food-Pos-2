import mongoose from 'mongoose'

const integrationEventSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, index: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  },
  { timestamps: true }
)

integrationEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 })

const IntegrationEvent = mongoose.model('IntegrationEvent', integrationEventSchema)

export const emitEvent = async (type, payload = {}, orderId = null) => {
  const event = await IntegrationEvent.create({ type, payload, orderId })
  const sse = (await import('../../shared/events/sse.js')).default
  sse.broadcast(type, { ...payload, eventId: event._id })
  return event
}

export default IntegrationEvent
