/**
 * One-time import of the live karahi operation (Next.js + Postgres) into this POS's Mongo database.
 *
 *   node scripts/migrate-website-data.mjs --source-url=<postgres url> [--apply]
 *   node scripts/migrate-website-data.mjs --source-env=F:/Websites/Food-Web/.env [--apply]
 *
 * MONGODB_URI is required — this script never falls back to the development in-memory database.
 * Without --apply it only reports what it would do, and re-runs are idempotent: catalogue rows are
 * matched by slug/name, orders by sourceRef `website:<pg id>`, staff by email, tables by number.
 * Password hashes are copied verbatim and never printed; customer details are counted, not logged.
 * Orders default to those whose lines reference the imported menu — pass --include-all-orders to
 * also bring in tickets from the previous (pre-rebrand) catalogue.
 * --replace first dumps every collection of the target database to backend/backups/<run>/ and then
 * clears the operational collections, so an old menu cannot end up mixed with the imported one.
 * Staff accounts survive --replace, and the backups hold customer details: keep that folder out of git.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import { Pool } from 'pg'
import Category from '../src/modules/categories/categories.model.js'
import Product from '../src/modules/products/products.model.js'
import RestaurantTable from '../src/modules/tables/tables.model.js'
import User from '../src/modules/users/users.model.js'
import Customer from '../src/modules/customers/customers.model.js'
import Order, { ORDER_STATUSES } from '../src/modules/orders/orders.model.js'
import { getSettings } from '../src/modules/settings/settings.model.js'

const APPLY = process.argv.includes('--apply')
const ALL_ORDERS = process.argv.includes('--include-all-orders')
const REPLACE = process.argv.includes('--replace')
const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=')

const sourceUrl = arg('source-url') || readUrlFromEnv(arg('source-env'))
const targetUri = process.env.MONGODB_URI || arg('target-uri')
const websitePublic = arg('website-public') || 'F:/Websites/Food-Web/public/products'
const localProducts = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/products')

if (!sourceUrl) fail('Pass --source-url=<postgres url> or --source-env=<path to .env with DATABASE_URL>')
if (!targetUri) fail('MONGODB_URI (or --target-uri) is required so the import cannot hit a throwaway database')

function fail(message) {
  console.error(`\n${message}\n`)
  process.exit(1)
}

function readUrlFromEnv(file) {
  if (!file) return null
  const text = fs.readFileSync(file.replace(/^"|"$/g, ''), 'utf8')
  return text.match(/^DATABASE_URL="?([^"\n]+)/m)?.[1] || null
}

const num = (value) => Math.round((Number(value) || 0) * 100) / 100
const str = (value) => String(value ?? '').trim()

/** /products/x.jpg is the website's own path; the POS serves its copy from /static/products/. */
function mapImage(imageUrl) {
  const url = str(imageUrl)
  if (url.startsWith('/products/')) return `/static/products/${url.slice('/products/'.length)}`
  return url
}

function copyArtwork(imageUrl) {
  const local = mapImage(imageUrl)
  if (!local.startsWith('/static/products/')) return
  const file = local.replace('/static/products/', '')
  if (!file || fs.existsSync(path.join(localProducts, file))) return
  const source = path.join(websitePublic, file)
  if (!fs.existsSync(source)) {
    warnings.add(`menu art missing on disk: ${file}`)
    return
  }
  if (!APPLY) return
  fs.mkdirSync(localProducts, { recursive: true })
  fs.copyFileSync(source, path.join(localProducts, file))
  console.log(`  copied menu art ${file}`)
}

const ORDER_TYPE = { delivery: 'Delivery', pickup: 'Takeaway', dine_in: 'Dine In', takeaway: 'Takeaway' }

/** The website records free-text payment labels; the POS stores a fixed method. */
function mapPayment(method) {
  const text = str(method).toLowerCase()
  if (text.includes('card')) return 'card'
  if (text.includes('online') || text.includes('bank') || text.includes('jaxx') || text.includes('easypaisa') || text.includes('jazzcash')) return 'online'
  if (text.includes('delivery') || text.includes('cod')) return 'cod'
  if (text.includes('cash') || text.includes('table')) return 'cash'
  return 'none'
}

function tableNumberFrom(ref) {
  const digits = str(ref).match(/\d+/)
  return digits ? Number(digits[0]) : null
}

const pool = new Pool({ connectionString: sourceUrl, ssl: { rejectUnauthorized: true }, connectionTimeoutMillis: 15_000 })
const rows = async (sqlText) => (await pool.query(sqlText)).rows
const warnings = new Set()
const report = {}

await mongoose.connect(targetUri, { serverSelectionTimeoutMS: 8_000 })
console.log(`\n${APPLY ? 'Applying' : 'Dry run'} → ${mongoose.connection.name}\n`)

// ---------------------------------------------------------------- --replace
/**
 * The pre-rebrand catalogue is a different restaurant's menu, and none of its names match, so a
 * plain import would leave both on the POS at once. --replace clears the operational
 * collections first, after dumping every collection to disk. Staff accounts are never cleared:
 * deleting the only logins would lock the terminal out of the database being imported into it.
 */
const REPLACE_COLLECTIONS = ['categories', 'products', 'restauranttables', 'customers', 'orders', 'stockmovements', 'notifications', 'integrationevents']
if (REPLACE) {
  const mongo = mongoose.connection.db
  const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')
  const backupDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../backups', `${mongoose.connection.name}-${stamp}`)
  const existingNames = (await mongo.listCollections().toArray()).map((c) => c.name)

  report.replace = { backupDir: null, backedUp: {}, cleared: {} }
  for (const name of existingNames) {
    const count = await mongo.collection(name).countDocuments()
    report.replace.backedUp[name] = count
    if (!APPLY || !count) continue
    fs.mkdirSync(backupDir, { recursive: true })
    const docs = await mongo.collection(name).find().toArray()
    fs.writeFileSync(path.join(backupDir, `${name}.json`), JSON.stringify(docs))
    report.replace.backupDir = backupDir
  }

  for (const name of REPLACE_COLLECTIONS) {
    if (!existingNames.includes(name)) continue
    const count = await mongo.collection(name).countDocuments()
    if (!count) continue
    if (APPLY) await mongo.collection(name).deleteMany({})
    report.replace.cleared[name] = count
  }
  if (APPLY && !report.replace.backupDir) console.log('  nothing to back up — all collections are empty')
  else if (APPLY) console.log(`  backed up to ${report.replace.backupDir}`)
}

// ---------------------------------------------------------------- settings
{
  const settingsRows = await rows("select key, value from app_settings where key in ('shop.name','shop.tagline','contact.phone','contact.address','pos.receipt_footer')")
  const found = Object.fromEntries(settingsRows.map((r) => [r.key, str(r.value)]))
  const patch = {}
  if (found['shop.name']) patch.businessName = found['shop.name'].slice(0, 80)
  if (found['shop.tagline']) patch.tagline = found['shop.tagline'].slice(0, 120)
  if (found['contact.phone']) patch.phone = found['contact.phone'].slice(0, 40)
  if (found['contact.address']) patch.address = found['contact.address'].slice(0, 200)
  if (found['pos.receipt_footer']) patch.receiptFooter = found['pos.receipt_footer'].slice(0, 200)
  report.settings = Object.keys(patch)
  if (APPLY && Object.keys(patch).length) await getSettings().then((s) => { Object.assign(s, patch); return s.save() })
  // Tax is deliberately not imported: the website bills tax inside the price, the POS adds it per order.
  warnings.add('settings.taxRate was left as-is — the website quoted prices including tax')
}

// ---------------------------------------------------------------- categories
const categories = await rows('select id, name, description, sort_order, is_active from categories where is_active order by sort_order, name')
const categoryId = new Map()
report.categories = { created: 0, updated: 0 }
for (const row of categories) {
  const existing = await Category.findOne({ name: str(row.name) })
  if (existing) {
    categoryId.set(row.id, existing._id)
    if (APPLY && (existing.description || '') !== str(row.description)) {
      existing.description = str(row.description)
      existing.sortOrder = Number(row.sort_order)
      existing.active = true
      await existing.save()
    }
    report.categories.updated += 1
    continue
  }
  if (APPLY) {
    const created = await Category.create({
      name: str(row.name),
      description: str(row.description),
      sortOrder: Number(row.sort_order) || 0,
      active: true,
    })
    categoryId.set(row.id, created._id)
  } else {
    categoryId.set(row.id, new mongoose.Types.ObjectId())
  }
  report.categories.created += 1
}

// ---------------------------------------------------------------- products
const products = await rows('select id, category_id, slug, name, description, price, image_url, is_available, is_popular, stock, low_stock_threshold, sort_order from products order by sort_order, name')
const productId = new Map()
/** Order lines snapshot the product image, so keep it reachable by Postgres id. */
const productImage = new Map()
const bySku = new Map((await Product.find({ sku: { $exists: true } }).select('sku name')).map((p) => [p.sku, p]))
const byName = new Map()
for (const p of await Product.find({}).select('name')) {
  const key = str(p.name).toLowerCase()
  byName.set(key, byName.has(key) ? null : p)
}
report.products = { created: 0, updated: 0, skipped: 0 }
for (const row of products) {
  const category = categoryId.get(row.category_id)
  if (!category) {
    report.products.skipped += 1
    continue
  }
  const slug = str(row.slug)
  const image = mapImage(row.image_url)
  copyArtwork(row.image_url)
  const fields = {
    name: str(row.name),
    description: str(row.description),
    sku: slug,
    category,
    price: num(row.price),
    image,
    available: Boolean(row.is_available),
    popular: Boolean(row.is_popular),
    sortOrder: Math.min(999, Math.max(0, Number(row.sort_order) || 0)),
    trackStock: row.stock !== null,
    stock: row.stock === null ? 0 : Math.max(0, Number(row.stock)),
    lowStockThreshold: Math.max(0, Number(row.low_stock_threshold) || 0),
  }
  const byNameOnly = byName.get(fields.name.toLowerCase())
  const existing = bySku.get(slug) || (byNameOnly && !bySku.has(str(byNameOnly.sku)) ? byNameOnly : null)
  if (existing) {
    productId.set(row.id, existing._id)
    productImage.set(row.id, image)
    if (APPLY) await Product.updateOne({ _id: existing._id }, { $set: fields })
    report.products.updated += 1
    continue
  }
  if (APPLY) {
    const created = await Product.create(fields)
    productId.set(row.id, created._id)
  } else {
    productId.set(row.id, new mongoose.Types.ObjectId())
  }
  productImage.set(row.id, image)
  report.products.created += 1
}

// ---------------------------------------------------------------- tables
const tables = await rows('select number, label, is_active from restaurant_tables where is_active order by number')
report.tables = { created: 0, kept: 0 }
for (const row of tables) {
  const number = Number(row.number)
  const existing = await RestaurantTable.findOne({ number })
  if (existing) {
    report.tables.kept += 1
    continue
  }
  if (APPLY) {
    await RestaurantTable.create({ number, label: str(row.label) || `Table ${number}`, seats: 4, active: true })
  }
  report.tables.created += 1
}

// ---------------------------------------------------------------- staff
{
  const admins = await rows('select email, name, password_hash, role from admins order by created_at')
  report.staff = { created: 0, kept: 0 }
  for (const row of admins) {
    const email = str(row.email).toLowerCase()
    if (!email || await User.exists({ email })) {
      report.staff.kept += 1
      continue
    }
    if (APPLY) {
      // Raw insert: the pre-save hook would hash an already-hashed password again.
      await User.collection.insertOne({
        _id: new mongoose.Types.ObjectId(),
        name: str(row.name) || 'Manager',
        email,
        password: str(row.password_hash),
        role: ['admin', 'manager', 'cashier'].includes(row.role) ? row.role : 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
    report.staff.created += 1
  }
}

// ---------------------------------------------------------------- customers
{
  const rowsIn = await rows('select name, phone, email from customers order by created_at')
  report.customers = { created: 0, kept: 0 }
  for (const row of rowsIn) {
    const phone = str(row.phone)
    if (!phone || await Customer.exists({ phone })) {
      report.customers.kept += 1
      continue
    }
    if (APPLY) await Customer.create({ name: str(row.name) || 'Guest', phone, email: str(row.email) })
    report.customers.created += 1
  }
}

// ---------------------------------------------------------------- orders
{
  const pgOrders = await rows('select * from orders order by created_at')
  const pgItems = await rows('select order_id, product_id, product_name, unit_price, quantity, line_total, notes from order_items order by created_at')
  const pgPayments = await rows('select order_id, method, status, amount, received, change_due from order_payments order by created_at')
  const itemsByOrder = new Map()
  for (const item of pgItems) {
    if (!itemsByOrder.has(item.order_id)) itemsByOrder.set(item.order_id, [])
    itemsByOrder.get(item.order_id).push(item)
  }
  const paymentByOrder = new Map(pgPayments.map((p) => [p.order_id, p]))

  report.orders = { created: 0, already: 0, linesWithoutProduct: 0, skippedOldCatalogue: 0 }
  for (const row of pgOrders) {
    const sourceRef = `website:${row.id}`
    if (await Order.exists({ sourceRef })) {
      report.orders.already += 1
      continue
    }
    if (!ORDER_STATUSES.includes(row.status)) {
      warnings.add(`order ${row.order_number}: unknown status ${row.status}, imported as pending`)
    }
    const lines = (itemsByOrder.get(row.id) || []).map((item) => {
      const id = item.product_id ? productId.get(item.product_id) : null
      return {
        productId: id || null,
        name: str(item.product_name) || 'Menu item',
        image: (id && productImage.get(item.product_id)) || '',
        price: num(item.unit_price),
        quantity: Math.max(1, Number(item.quantity) || 1),
        lineTotal: num(item.line_total ?? Number(item.unit_price) * Number(item.quantity)),
        notes: str(item.notes),
      }
    })
    // The pre-rebrand coffee catalogue is not on this menu, so its tickets are
    // history the POS cannot read; --include-all-orders overrides this.
    if (!ALL_ORDERS && lines.some((line) => line.productId) === false) {
      report.orders.skippedOldCatalogue += 1
      continue
    }
    for (const line of lines) {
      if (!line.productId) report.orders.linesWithoutProduct += 1
    }
    const payment = paymentByOrder.get(row.id)
    const doc = {
      _id: new mongoose.Types.ObjectId(),
      orderNumber: str(row.order_number),
      channel: ['pos', 'qr', 'website'].includes(row.channel) ? row.channel : 'website',
      orderType: ORDER_TYPE[row.order_type] || 'Takeaway',
      status: ORDER_STATUSES.includes(row.status) ? row.status : 'pending',
      customer: { name: str(row.customer_name) || 'Walk-in Customer', phone: str(row.customer_phone) },
      items: lines,
      subtotal: num(row.subtotal),
      discount: num(row.discount),
      tax: num(row.tax),
      total: num(row.total),
      payment: {
        method: mapPayment(row.payment_method),
        status: ['unpaid', 'paid', 'refunded', 'failed'].includes(row.payment_status) ? row.payment_status : 'unpaid',
        received: num(payment?.received),
        change: num(payment?.change_due),
      },
      notes: str(row.instructions),
      table: str(row.table_ref),
      tableNumber: tableNumberFrom(row.table_ref),
      sourceRef,
      ...(str(row.idempotency_key) ? { idempotencyKey: str(row.idempotency_key) } : {}),
      stockDeducted: Boolean(row.stock_deducted_at),
      acceptedAt: row.accepted_at || null,
      completedAt: row.completed_at || null,
      createdAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
      updatedAt: row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at),
    }
    if (APPLY) {
      // Raw insert keeps the original timestamps; mongoose timestamps would rewrite them.
      await Order.collection.insertOne(doc)
    }
    report.orders.created += 1
  }
}

console.log('report:', JSON.stringify(report, null, 2))
if (warnings.size) console.log('warnings:\n  ' + [...warnings].join('\n  '))
console.log(APPLY ? '\nImport applied.' : '\nDry run only — add --apply to write.')

await mongoose.disconnect()
await pool.end()
