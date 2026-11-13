import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    sku: { type: String, trim: true, unique: true, sparse: true },
    barcode: { type: String, trim: true, index: { sparse: true } },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: '' },
    available: { type: Boolean, default: true },
    popular: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0, min: 0, max: 999 },
    trackStock: { type: Boolean, default: true },
    stock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 10, min: 0 },
  },
  { timestamps: true }
)

productSchema.index({ name: 'text', sku: 'text', barcode: 'text' })

const Product = mongoose.model('Product', productSchema)
export default Product
