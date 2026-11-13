import mongoose from 'mongoose'

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, unique: true, sparse: true },
    email: { type: String, trim: true, default: '' },
    note: { type: String, default: '' },
  },
  { timestamps: true }
)

const Customer = mongoose.model('Customer', customerSchema)
export default Customer
