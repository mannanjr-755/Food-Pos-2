import mongoose from 'mongoose'

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
})

const Counter = mongoose.model('Counter', counterSchema)

export const nextOrderNumber = async () => {
  const doc = await Counter.findOneAndUpdate(
    { _id: 'orderNumber' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  )
  const n = doc.seq < 1024 ? 1024 + doc.seq : 1000 + doc.seq
  return String(n)
}

export default Counter
