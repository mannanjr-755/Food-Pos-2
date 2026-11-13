import mongoose from 'mongoose'

export const ORDER_STATUSES = [
  'pending', 'held', 'accepted', 'preparing', 'ready', 'served', 'completed', 'rejected', 'cancelled',
]

/** Statuses that still occupy a table on the floor. */
export const OPEN_STATUSES = ['pending', 'accepted', 'preparing', 'ready', 'served']

const lineItemSchema = new mongoose.Schema(
  {
    // Null only on imported history whose product has since left the catalogue; the line keeps its own snapshot.
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    size: { type: String, enum: ['Half', 'Full', ''], default: '' },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
    notes: { type: String, default: '' },
  },
  { _id: false }
)

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    // 'qr' = placed on this POS's own table menu; 'website' rows are historical imports.
    channel: { type: String, enum: ['website', 'pos', 'qr'], required: true },
    orderType: { type: String, enum: ['Dine In', 'Takeaway', 'Delivery'], default: 'Takeaway' },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    customer: {
      name: { type: String, default: 'Walk-in Customer' },
      phone: { type: String, default: '' },
    },
    items: { type: [lineItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    waiter: { type: String, default: '', trim: true },
    payment: {
      method: { type: String, enum: ['cash', 'card', 'online', 'cod', 'none'], default: 'none' },
      status: { type: String, enum: ['unpaid', 'paid', 'refunded', 'failed'], default: 'unpaid' },
      received: { type: Number, default: 0 },
      change: { type: Number, default: 0 },
      due: { type: Number, default: 0 },
    },
    notes: { type: String, default: '' },
    table: { type: String, default: '' },
    tableNumber: { type: Number, default: null, index: true },
    printType: { type: String, enum: ['bill', 'kot', 'both', ''], default: '' },
    // Where the order came from outside the terminal: a QR session, or an imported website row.
    sourceRef: { type: String, unique: true, sparse: true },
    idempotencyKey: { type: String, unique: true, sparse: true },
    stockDeducted: { type: Boolean, default: false },
    acceptedAt: { type: Date },
    completedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

orderSchema.index({ channel: 1, status: 1, createdAt: -1 })

const Order = mongoose.model('Order', orderSchema)
export default Order
