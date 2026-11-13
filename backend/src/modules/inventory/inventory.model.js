import mongoose from 'mongoose'

const stockMovementSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    delta: { type: Number, required: true },
    reason: { type: String, required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    balanceAfter: { type: Number },
  },
  { timestamps: true }
)

const StockMovement = mongoose.model('StockMovement', stockMovementSchema)
export default StockMovement
