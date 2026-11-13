import mongoose from 'mongoose'

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'business', unique: true },
    businessName: { type: String, default: 'Chaska Koyla Karahi' },
    tagline: { type: String, default: 'Karahi & Charcoal Grill' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    currencySymbol: { type: String, default: 'Rs.' },
    taxRate: { type: Number, default: 5, min: 0, max: 100 },
    serviceFee: { type: Number, default: 0, min: 0 },
    receiptFooter: { type: String, default: 'Thank you for dining with us!' },
    timezone: { type: String, default: 'Asia/Karachi' },
    qrOrdersActive: { type: Boolean, default: true },
    printer: {
      name: { type: String, default: 'Default System Printer' },
      paperSize: { type: String, enum: ['58mm', '80mm'], default: '80mm' },
      connection: { type: String, enum: ['USB', 'Bluetooth', 'LAN'], default: 'USB' },
      printBill: { type: Boolean, default: true },
      printKot: { type: Boolean, default: true },
      autoPrintBill: { type: Boolean, default: true },
      autoPrintKot: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
)

const Settings = mongoose.model('Settings', settingsSchema)

export const getSettings = async () => {
  let s = await Settings.findOne({ key: 'business' })
  if (!s) s = await Settings.create({ key: 'business' })
  return s
}

export default Settings
