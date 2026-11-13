import mongoose from 'mongoose'

const tableSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true, unique: true, min: 1, max: 999 },
    label: { type: String, trim: true, default: '', maxlength: 40 },
    seats: { type: Number, default: 4, min: 1, max: 40 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

const RestaurantTable = mongoose.model('RestaurantTable', tableSchema)
export default RestaurantTable
